# CouponFoot Frontend

The modern, responsive frontend for CouponFoot, built with **React**, **TypeScript**, and **Tailwind CSS**.

##  Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **UI Components**: Shadcn/UI + Lucide React
- **Internationalization**: react-i18next

##  Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Ensure `VITE_API_URL` points to your backend (default: http://localhost:8000/api/v1)*

3. **Start Development Server**
   ```bash
   pnpm dev
   ```
   Access the app at http://localhost:5173

##  Project Structure

- `src/features/`: Feature-based architecture (Auth, Analyze, Coupons, etc.)
- `src/components/`: Shared UI components
- `src/lib/`: Utilities and API client
- `src/store/`: Global state stores (Zustand)
- `src/i18n/`: Translation files

##  Linting & Formatting

```bash
# Lint
pnpm lint

# Build for production
pnpm build
```
