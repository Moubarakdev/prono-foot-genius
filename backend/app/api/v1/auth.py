from datetime import datetime, timedelta
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.core.logger import get_logger
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_access_token
)
from app.models import User, MatchAnalysis, Coupon
from app.schemas import (
    UserCreate, UserLogin, UserResponse, Token, RefreshTokenRequest,
    VerifyOTP, UserUpdate, PasswordChange, 
    ForgotPasswordRequest, ResetPassword
)
import random
import string
from app.tasks.email import send_otp_email, send_reset_password_email

logger = get_logger('api.auth')


def generate_otp(length: int = 6) -> str:
    """Generate a random numeric OTP code."""
    return ''.join(random.choices(string.digits, k=length))


router = APIRouter(prefix="/auth", tags=["Authentication"])



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)]
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    try:
        user_uuid = str(uuid.UUID(user_id))
    except ValueError:
        raise credentials_exception
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Register a new user."""
    logger.info(
        f"📝 Registration attempt: {user_data.email}",
        extra={'extra_data': {
            'email': user_data.email,
            'full_name': user_data.full_name
        }}
    )
    
    try:
        # Check if email already exists
        result = await db.execute(select(User).where(User.email == user_data.email))
        if result.scalar_one_or_none():
            logger.warning(
                f"⚠️ Registration failed: Email already exists",
                extra={'extra_data': {'email': user_data.email}}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        otp_code = generate_otp()
        user = User(
            email=user_data.email,
            hashed_password=get_password_hash(user_data.password),
            full_name=user_data.full_name,
            is_verified=False,
            otp_code=otp_code,
            otp_expires_at=datetime.utcnow() + timedelta(minutes=10),
            created_at=datetime.utcnow()
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.log_auth(
            'user_registered',
            user_id=str(user.id),
            email=user.email,
            success=True
        )
        
        # Send OTP Email
        try:
            send_otp_email.delay(user.email, otp_code, user.full_name)
            logger.debug(
                f"📧 OTP email task queued",
                extra={'extra_data': {'email': user.email}}
            )
        except Exception as celery_err:
            logger.error(
                f"❌ Celery task failed for OTP email: {celery_err}",
                exc_info=True,
                extra={'extra_data': {'email': user.email, 'error': str(celery_err)}}
            )
        
        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"❌ FATAL ERROR during registration: {str(e)}",
            exc_info=True,
            extra={'extra_data': {
                'email': user_data.email,
                'error': str(e)
            }}
        )
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")


@router.post("/verify-otp", response_model=UserResponse)
async def verify_otp(
    data: VerifyOTP,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Verify user's OTP code."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.is_verified:
        return user
        
    if user.otp_code != data.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    if user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="OTP code expired")
        
    user.is_verified = True
    user.otp_code = None
    user.otp_expires_at = None
    await db.commit()
    
    return user


@router.post("/resend-otp")
async def resend_otp(
    email: str,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Resend a new OTP code to the user."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp_code = generate_otp()
    user.otp_code = otp_code
    user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
    await db.commit()
    
    send_otp_email.delay(user.email, otp_code, user.full_name)
    
    return {"message": "OTP sent successfully"}


@router.post("/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Login and get access token."""
    logger.info(
        f"🔐 Login attempt: {form_data.username}",
        extra={'extra_data': {'email': form_data.username}}
    )
    
    # Find user
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not user.hashed_password:
        logger.log_auth(
            'login_failed',
            email=form_data.username,
            success=False
        )
        logger.warning(
            f"⚠️ Login failed: User not found",
            extra={'extra_data': {'email': form_data.username}}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        logger.log_auth(
            'login_failed',
            user_id=str(user.id),
            email=user.email,
            success=False
        )
        logger.warning(
            f"⚠️ Login failed: Incorrect password",
            extra={'extra_data': {'email': user.email, 'user_id': str(user.id)}}
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Store refresh token in database
    user.refresh_token = refresh_token
    await db.commit()
    
    logger.log_auth(
        'login_success',
        user_id=str(user.id),
        email=user.email,
        success=True
    )
    logger.info(
        f"✅ Login successful: {user.email}",
        extra={'extra_data': {
            'email': user.email,
            'user_id': str(user.id),
            'subscription_plan': user.subscription
        }}
    )
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token
    )


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Get current user profile."""
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(
    data: RefreshTokenRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Refresh access token using refresh token."""
    # Decode refresh token
    payload = decode_access_token(data.refresh_token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Verify it's a refresh token
    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type"
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    # Get user from database
    try:
        user_uuid = str(uuid.UUID(user_id))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID"
        )
    
    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    # Verify stored refresh token matches
    if user.refresh_token != data.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or invalid"
        )
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": str(user.id)})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    # Update refresh token in database
    user.refresh_token = new_refresh_token
    await db.commit()
    
    return Token(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )


@router.put("/me", response_model=UserResponse)
async def update_profile(
    data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Update user profile information."""
    if data.full_name is not None:
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    if data.profile_type is not None:
        current_user.profile_type = data.profile_type
    if data.favorite_leagues is not None:
        current_user.favorite_leagues = data.favorite_leagues
        
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def change_password(
    data: PasswordChange,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Change user password."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    current_user.hashed_password = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Password updated successfully"}


@router.post("/forgot-password/request")
async def request_forgot_password(
    data: ForgotPasswordRequest,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Request a password reset OTP."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if user:
        otp_code = generate_otp()
        user.otp_code = otp_code
        user.otp_expires_at = datetime.utcnow() + timedelta(minutes=10)
        await db.commit()
        
        send_reset_password_email.delay(user.email, otp_code, user.full_name)
        
    # We return success even if user doesn't exist for security (avoid enumeration)
    return {"message": "If an account exists with this email, a reset code has been sent."}


@router.post("/forgot-password/reset")
async def reset_password_with_otp(
    data: ResetPassword,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Reset password using OTP code."""
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.otp_code != data.otp_code or user.otp_expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code")
        
    user.hashed_password = get_password_hash(data.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    user.is_verified = True # Resetting password with OTP also verifies user
    await db.commit()
    
    return {"message": "Password has been reset successfully."}


@router.get("/me/stats")
async def get_user_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    """Get statistics for the current user's dashboard."""
    # Count analyses
    analyses_count_result = await db.execute(
        select(MatchAnalysis).where(MatchAnalysis.user_id == current_user.id)
    )
    analyses = analyses_count_result.scalars().all()
    total_analyses = len(analyses)
    
    # Calculate success rate
    correct_analyses = sum(1 for a in analyses if a.was_correct is True)
    success_rate = (correct_analyses / total_analyses * 100) if total_analyses > 0 else 0
    
    # Count coupons
    coupons_result = await db.execute(
        select(Coupon).where(Coupon.user_id == current_user.id)
    )
    coupons = coupons_result.scalars().all()
    total_coupons = len(coupons)
    validated_coupons = sum(1 for c in coupons if c.status == "won")
    
    # Get recent analyses
    recent_analyses = sorted(analyses, key=lambda x: x.created_at, reverse=True)[:5]
    
    return {
        "total_analyses": total_analyses,
        "success_rate": round(success_rate, 1),
        "total_coupons": total_coupons,
        "validated_coupons": validated_coupons,
        "recent_analyses": [
            {
                "id": str(a.id),
                "home_team": a.home_team,
                "away_team": a.away_team,
                "league_name": a.league_name,
                "predicted_outcome": a.predicted_outcome,
                "confidence_score": a.confidence_score,
                "created_at": a.created_at.isoformat()
            }
            for a in recent_analyses
        ]
    }
