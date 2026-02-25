# TaskMaster Setup Guide

## 🚀 Quick Start

Follow these steps to get TaskMaster running locally.

---

## Prerequisites

- **Node.js**: v20.x or higher (you have v24.13.1 ✅)
- **npm**: v9.x or higher (you have v11.8.0 ✅)
- **Supabase account** (you already have one ✅)
- **Clerk account** (sign up at https://clerk.com)

---

## Step 1: Database Setup (Supabase)

### 1.1 Get Database URL

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **Settings** → **Database**
3. Find the **Connection String** (PostgreSQL)
4. Copy the URI format: `postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres`

### 1.2 Update Environment Variables

Open [.env.local](d:/ml/taskmaster-app/.env.local) and replace the `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres"
```

### 1.3 Push Database Schema

Run the following commands to create tables in your Supabase database:

```bash
cd taskmaster-app
npx prisma generate
npx prisma db push
```

This will create all tables defined in [prisma/schema.prisma](d:/ml/taskmaster-app/prisma/schema.prisma).

### 1.4 Verify Database (Optional)

```bash
npx prisma studio
```

This opens a GUI at http://localhost:5555 where you can see your database tables.

---

## Step 2: Clerk Authentication Setup

### 2.1 Create Clerk Account

1. Go to https://clerk.com and sign up (free tier is perfect for this project)
2. Create a new application
3. Name it "TaskMaster" or similar

### 2.2 Get API Keys

1. In your Clerk dashboard, go to **API Keys**
2. Copy the following:
   - **Publishable Key** (starts with `pk_test_...`)
   - **Secret Key** (starts with `sk_test_...`)

### 2.3 Update Environment Variables

Open [.env.local](d:/ml/taskmaster-app/.env.local) and add your Clerk keys:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 2.4 Configure Clerk URLs

In your Clerk dashboard:

1. Go to **Paths** (under **User & Authentication**)
2. Set the following paths:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in URL: `/dashboard`
   - After sign-up URL: `/dashboard`

### 2.5 Enable Google OAuth (Optional but Recommended)

1. In Clerk dashboard, go to **User & Authentication** → **Social Connections**
2. Enable **Google**
3. Follow the instructions to set up Google OAuth (or use Clerk's dev credentials for testing)

---

## Step 3: Install Dependencies & Run

### 3.1 Install Dependencies (Already Done ✅)

The dependencies are already installed, but if you need to reinstall:

```bash
npm install
```

### 3.2 Run Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:3000**

---

## Step 4: Test Authentication

1. Open http://localhost:3000
2. You should see the landing page
3. Click "Sign Up" or navigate to http://localhost:3000/sign-up
4. Create an account using:
   - Email/password
   - Or Google OAuth (if configured)
5. After signing up, you'll be redirected to `/dashboard`

---

## Step 5: Create User in Database (Automatic via Webhook - Phase 2)

For now, we'll need to manually sync Clerk users to our database. In Phase 2, we'll add a Clerk webhook to automatically create User records.

**Temporary solution**: We'll create a user record on first login in the dashboard page.

---

## Verify Everything is Working

Run these commands to check:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Format code
npm run format

# Build (make sure there are no errors)
npm run build
```

---

## Project Structure Overview

```
taskmaster-app/
├── app/
│   ├── sign-in/          # Clerk sign-in page
│   ├── sign-up/          # Clerk sign-up page
│   ├── dashboard/        # Main app (to be built)
│   └── layout.tsx        # Root layout with ClerkProvider
├── prisma/
│   └── schema.prisma     # Database schema
├── lib/
│   ├── db.ts            # Prisma client
│   └── utils.ts         # Utility functions
├── types/
│   └── index.ts         # TypeScript types
├── components/          # React components (to be built)
├── .env.local          # Environment variables (DO NOT COMMIT)
└── .env.example        # Example env file
```

---

## Common Issues & Solutions

### Issue: `prisma db push` fails

**Solution**: Check your DATABASE_URL in `.env.local`. Make sure:
- No typos in the URL
- Password is correct
- No special characters need URL encoding

### Issue: Clerk authentication not working

**Solution**:
- Verify API keys are correct in `.env.local`
- Restart dev server after changing environment variables
- Check Clerk dashboard for any configuration issues

### Issue: TypeScript errors

**Solution**:
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## Next Steps

Once everything is set up:

1. ✅ Foundation is complete
2. 🚀 Next: Build the dashboard UI
3. 📋 Then: Implement task CRUD operations
4. 📊 Later: Add analytics and habit tracking

See [CLAUDE.md](d:/ml/taskmaster-app/CLAUDE.md) for the full development roadmap.

---

## Environment Variables Checklist

Make sure your [.env.local](d:/ml/taskmaster-app/.env.local) has:

- [x] `DATABASE_URL` (from Supabase)
- [x] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (from Clerk)
- [x] `CLERK_SECRET_KEY` (from Clerk)

---

## Need Help?

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **Clerk**: https://clerk.com/docs
- **Supabase**: https://supabase.com/docs

---

**Created**: February 14, 2026
**Status**: Foundation Complete ✅
