# Quiz Challenge Arena - Backend

Production-ready Node.js + Express backend for Quiz Challenge Arena platform.

## Setup

### Prerequisites
- Node.js 18.x or higher
- pnpm 10.x or higher
- Supabase account (for PostgreSQL database)
- Gmail account with app password (for email)

### Installation

```bash
# Copy environment file
cp .env.example .env

# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with auto-reload (runs on http://localhost:8082)
pnpm dev
```

### Build for Production

```bash
# Build TypeScript to JavaScript
pnpm build

# Start production server
pnpm start
```

## Environment Configuration

Create `.env` file in the backend root directory:

```env
# Node Environment
NODE_ENV=development
PORT=8082

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:port/database

# Email Configuration (Resend SMTP)
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_NAME=BihariCoder
EMAIL_FROM=noreply@biharicoder.com
REPLY_TO=noreply@biharicoder.com

# BullMQ + Upstash Redis (Email Queue)
REDIS_URL=rediss://default:your-upstash-token@your-upstash-endpoint.upstash.io:6379
# Optional if token already included in REDIS_URL
REDIS_TOKEN=your-upstash-token

# JWT Configuration
JWT_SECRET=your-very-secure-random-secret-key-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
# For production:
# CORS_ORIGIN=https://your-frontend.vercel.app

# Socket.IO Configuration
SOCKET_CORS_ORIGIN=http://localhost:5173
# For production:
# SOCKET_CORS_ORIGIN=https://your-frontend.vercel.app

# Frontend URL for redirects
FRONTEND_URL=http://localhost:5173
# For production:
# FRONTEND_URL=https://your-frontend.vercel.app
```

## Deployment on Render

### 1. Connect GitHub Repository

```bash
# Push code to GitHub
git push origin main
```

### 2. Create Render Web Service

1. Go to [render.com](https://render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure settings:
   - **Name**: `quiz-challenge-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `backend`

### 3. Configure Build & Start Commands

In Render Dashboard:

- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm start`

### 4. Add Environment Variables

In Render Dashboard → Environment:

```
NODE_ENV=production
PORT=8082
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:port/database
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASS=your-resend-api-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM_NAME=BihariCoder
EMAIL_FROM=noreply@biharicoder.com
REPLY_TO=noreply@biharicoder.com
REDIS_URL=rediss://default:your-upstash-token@your-upstash-endpoint.upstash.io:6379
REDIS_TOKEN=your-upstash-token
JWT_SECRET=your-very-secure-random-secret-key-generate-new-one
CORS_ORIGIN=https://your-frontend.vercel.app
SOCKET_CORS_ORIGIN=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
```

### 4b. Create Render Background Worker (Email Queue)

Create a separate Render Background Worker service with:

- **Root Directory**: `backend`
- **Build Command**: `pnpm install && pnpm build`
- **Start Command**: `pnpm run start:worker:email`

Use the same environment variables as the web service, including `REDIS_URL` and SMTP vars.

### 5. Deploy

```bash
push code to GitHub and Render will automatically deploy
git push origin main
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify-email?token={token}` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/:userId` - Update user profile
- `GET /api/profile/:userId/achievements` - Get user achievements

### Quiz
- `GET /api/quiz/:id` - Get quiz questions
- `POST /api/quiz/submit` - Submit quiz answers
- `GET /api/questions` - Get all questions
- `POST /api/questions/generate` - Generate AI question
- `POST /api/questions/generate-multiple` - Generate multiple AI questions

### Leaderboard
- `GET /api/leaderboard` - Get global/weekly leaderboard
- `GET /api/leaderboard/rank/:userId` - Get user rank

## Project Structure

```
backend/
├── server/
│   ├── routes/
│   │   ├── auth-email.ts        # Email authentication endpoints
│   │   ├── quiz-api.ts          # Quiz endpoints
│   │   ├── profile.ts           # Profile management
│   │   ├── ai-questions.ts      # AI question generation
│   │   └── demo.ts              # Demo routes
│   ├── lib/
│   │   └── db.ts                # Supabase client
│   ├── config/
│   │   └── mailer.ts            # Email/Nodemailer config
│   ├── middleware/
│   │   └── auth.ts              # Authentication middleware
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── index.ts                 # Express app setup
│   └── multiplayer.ts           # Socket.IO handlers
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Database Setup

### Supabase Tables

Create these tables in your Supabase database:

1. **profiles** - User profiles
2. **leaderboard** - User rankings
3. **quiz_sessions** - Quiz attempt history
4. **quiz_questions** - Quiz questions
5. **quiz_responses** - User answers
6. **battles** - 1v1 battle records
7. **battle_participants** - Battle participant data
8. **user_achievements** - User badges and achievements

Run the SQL setup script from `COMPLETE_PROJECT_SQL.md` in the root directory.

## Email Configuration

### Gmail SMTP Setup

1. Enable 2-factor authentication on your Google account
2. Generate an app password:
   - Go to [myaccount.google.com/security](https://myaccount.google.com/security)
   - Select "App passwords"
   - Generate password for "Mail" and "Windows"
3. Use generated password as `GMAIL_PASSWORD` in `.env`

## Authentication Flow

### Registration
1. User submits registration form
2. Backend creates user in `profiles` table with bcrypt-hashed password
3. Verification email job enqueued to BullMQ (processed by email worker)
4. User clicks verification link
5. `email_verified` set to `true`
6. User automatically logged in

### Login
1. User submits credentials
2. Backend validates email and password with bcrypt
3. JWT token generated (7-day expiry)
4. Token stored in localStorage (frontend)
5. User redirected to dashboard

### Password Reset
1. User requests password reset
2. Reset email job enqueued to BullMQ with 1-hour token
3. User clicks link, enters new password
4. Password updated in database
5. User can login with new password

## Socket.IO Setup

Real-time multiplayer battles use Socket.IO:

- **Connection**: Handshake with user authentication
- **Events**: `join_matchmaking`, `match_found`, `question_answered`, `battle_end`
- **Rooms**: One room per battle session

## Performance Tips

1. **Database Indexing**: Ensure indexes on frequently queried columns
2. **Connection Pooling**: Use Supabase connection pooling mode
3. **Static Files**: Serve from CDN in production
4. **Caching**: Use Redis for session storage (optional)
5. **Monitoring**: Set up error tracking (e.g., Sentry)

## Troubleshooting

### Email Not Sending
- Verify Gmail credentials in `.env`
- Check "Less secure apps" setting (if using non-app password)
- Review email logs in console

### Database Connection Failed
- Verify `DATABASE_URL` format
- Check Supabase firewall rules
- Ensure IP is whitelisted

### CORS Errors
- Update `CORS_ORIGIN` to match frontend URL
- Check `SOCKET_CORS_ORIGIN` for Socket.IO

### Auth Token Expired
- Default expiry is 7 days
- Update `JWT_SECRET` periodically
- Clear localStorage and re-login if issues persist

## License

Proprietary
