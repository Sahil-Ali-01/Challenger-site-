# Quiz Challenge Arena - Frontend

Production-ready React + Vite frontend for Quiz Challenge Arena platform.

## Setup

### Prerequisites
- Node.js 18.x or higher
- pnpm 10.x or higher

### Installation

```bash
# Copy environment file
cp .env.example .env.local

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server (runs on http://localhost:5173)
pnpm dev
```

The development server will automatically proxy API calls to `http://localhost:8082` (or your configured `VITE_API_URL`).

### Build for Production

```bash
# Build optimized bundle
pnpm build

# Preview production build
pnpm preview
```

## Environment Configuration

Create `.env.local` file in the frontend root directory:

```env
# API Backend URL
VITE_API_URL=http://localhost:8082

# For development:
# VITE_API_URL=http://localhost:8082

# For production (Render):
# VITE_API_URL=https://your-backend.onrender.com

# Socket.IO Configuration
VITE_SOCKET_URL=http://localhost:8082
# VITE_SOCKET_URL=https://your-backend.onrender.com

# Supabase (if using Supabase Auth directly)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

## Deployment on Vercel

### 1. Connect GitHub Repository

```bash
# Push code to GitHub
git push origin main
```

### 2. Create Vercel Project

1. Go to [vercel.com](https://vercel.com/)
2. Click "New Project"
3. Connect your GitHub repository
4. Select the `frontend` folder as root directory

### 3. Configure Build Settings

In Vercel Dashboard:

- **Install Command**: `pnpm install`
- **Build Command**: `pnpm build`
- **Output Directory**: `dist`

### 4. Add Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_API_URL=https://your-backend.onrender.com
VITE_SOCKET_URL=https://your-backend.onrender.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

### 5. Deploy

```bash
# Vercel will automatically deploy on push to main
git push origin main
```

## Project Structure

```
frontend/
├── client/
│   ├── pages/          # Route pages (Auth, Dashboard, Quiz, Battle, etc)
│   ├── components/     # Reusable components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and helpers
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── package.json        # Dependencies and scripts
└── .env.example        # Environment variables template
```

## API Integration

Use the `api-client.ts` module for all backend calls:

```typescript
import { api } from '@/api-client';

// Authentication
const registerResponse = await api.auth.register({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'SecurePass123!',
});

// Login
const loginResponse = await api.auth.login({
  email: 'john@example.com',
  password: 'SecurePass123!',
});

// Profile
const profile = await api.profile.getProfile(userId);

// Quiz
const quiz = await api.quiz.getQuiz(quizId);

// Leaderboard
const leaderboard = await api.leaderboard.getLeaderboard('global', 100);
```

## Type Safety

All API responses are fully typed. Check the backend `shared/` folder for type definitions.

## Performance

- **Code Splitting**: Automatic with Vite
- **CSS**: Tailwind CSS with PurgeCSS
- **Images**: Optimized with Vite
- **Minification**: Automatic in production build

## Troubleshooting

### CORS Errors
- Ensure `VITE_API_URL` in `.env.local` matches backend `CORS_ORIGIN`
- Check backend CORS configuration

### API Calls Failing
- Verify backend is running on configured port
- Check network tab in browser DevTools
- Ensure authentication token is in localStorage

### Build Failing
- Run `pnpm install` again
- Clear node_modules and reinstall
- Check TypeScript errors: `pnpm typecheck`

## License

Proprietary
