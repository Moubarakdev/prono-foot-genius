import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/store/auth-store';
import { DashboardLayout } from './layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AnalyzePage } from './pages/AnalyzePage';
import { HomePage } from './pages/HomePage';
import { CouponsPage } from './pages/CouponsPage';
import { PricingPage } from './pages/PricingPage';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { LandingPage } from './pages/LandingPage';
import { VerifyOtpPage } from './pages/VerifyOtpPage';
import { ProfilePage } from './pages/ProfilePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout>
              <HomePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/analyze" element={
          <ProtectedRoute>
            <DashboardLayout>
              <AnalyzePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/coupons" element={
          <ProtectedRoute>
            <DashboardLayout>
              <CouponsPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/pricing" element={
          <ProtectedRoute>
            <DashboardLayout>
              <PricingPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <DashboardLayout>
              <ProfilePage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        <Route path="/subscription" element={
          <ProtectedRoute>
            <DashboardLayout>
              <SubscriptionPage />
            </DashboardLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
