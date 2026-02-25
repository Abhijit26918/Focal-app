# TaskMaster

A production-ready, comprehensive task management application for managing multi-domain productivity.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css)

---

## 🎯 Project Overview

TaskMaster is designed for ambitious individuals managing multiple life domains:

- 📊 **Data Science** - ML projects, data analysis
- 💼 **Entrepreneurship** - Business ventures, networking, opportunities
- 🤖 **AI Research** - Papers, experiments, staying current
- 💪 **Fitness** - Gym routines, workout tracking
- 📚 **Studies** - Continuous learning, courses
- ✨ **Personal** - Life management

**One central system** to manage tasks, track habits, analyze productivity patterns, and maintain accountability.

---

## ✨ Features

### Phase 1: MVP (Current Sprint)
- ✅ **User Authentication** - Email/password + Google OAuth (Clerk)
- ✅ **Database Schema** - Comprehensive PostgreSQL schema via Prisma
- ✅ **Project Foundation** - TypeScript, Next.js 16, Tailwind, shadcn/ui
- 🚧 **Task Management** - CRUD operations (coming next)
- 🚧 **Dashboard Views** - Today, Calendar, List, Kanban (coming next)

### Phase 2: Advanced Features
- 📊 Analytics dashboard with charts and insights
- 🎯 Habit tracking with streaks
- 🔔 Smart notifications and reminders
- 📅 Calendar integration
- 🏷️ Tags and categories
- 🔗 Task dependencies

### Phase 3: Power Features
- 🌙 Dark mode (infrastructure ready)
- ⌨️ Keyboard shortcuts & command palette
- 📱 PWA support (offline mode)
- 🤖 AI-powered suggestions
- 📈 Advanced analytics & reporting

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5 |
| **Styling** | Tailwind CSS 4, shadcn/ui |
| **Backend** | Next.js API Routes (Serverless) |
| **Database** | PostgreSQL (Supabase) |
| **ORM** | Prisma 7 |
| **Authentication** | Clerk |
| **State Management** | React Context + TanStack Query |
| **Charts** | Recharts |
| **Forms** | React Hook Form + Zod |
| **Deployment** | Vercel |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (you have v24.13.1 ✅)
- npm 9+ (you have v11.8.0 ✅)
- Supabase account
- Clerk account

### Installation

1. **Navigate to the project**
   ```bash
   cd taskmaster-app
   ```

2. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   # Supabase
   DATABASE_URL="postgresql://..."

   # Clerk (from https://clerk.com dashboard)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   CLERK_SECRET_KEY="sk_test_..."
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000)

📖 **Detailed setup instructions**: See [SETUP.md](./SETUP.md)

---

## 📁 Project Structure

```
taskmaster-app/
├── app/                    # Next.js App Router
│   ├── dashboard/         # Main dashboard (protected)
│   ├── sign-in/           # Clerk sign-in page
│   ├── sign-up/           # Clerk sign-up page
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout with providers
│
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── tasks/            # Task management components
│   ├── dashboard/        # Dashboard widgets
│   └── analytics/        # Charts and visualizations
│
├── lib/                   # Core utilities
│   ├── db.ts             # Prisma client
│   ├── utils.ts          # Helper functions
│   └── auth/             # Auth utilities
│
├── types/                 # TypeScript definitions
│   └── index.ts          # Shared types
│
├── prisma/               # Database
│   └── schema.prisma     # Database schema
│
├── hooks/                # Custom React hooks
├── contexts/             # React Context providers
│
├── CLAUDE.md             # Project documentation for Claude
├── SETUP.md              # Setup instructions
└── README.md             # This file
```

---

## 🗄️ Database Schema

### Core Tables
- **users** - User profiles (synced with Clerk)
- **tasks** - Task records with all metadata
- **subtasks** - Checkable sub-items
- **tags** - User-defined tags
- **task_tags** - Many-to-many relationship
- **task_dependencies** - Task dependency graph
- **notifications** - Reminder system
- **habits** - Habit tracking (Phase 2)
- **habit_completions** - Daily habit logs

See [prisma/schema.prisma](./prisma/schema.prisma) for full schema.

---

## 🧪 Development Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format with Prettier
npm run type-check   # TypeScript checking
```

### Database Commands
```bash
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema to DB (dev)
npx prisma migrate dev   # Create migration
npx prisma studio        # Open database GUI
```

---

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Detailed setup guide
- **[CLAUDE.md](./CLAUDE.md)** - Project specification & coding standards
- **[Prisma Schema](./prisma/schema.prisma)** - Database schema
- **[Types](./types/index.ts)** - TypeScript definitions

---

## 🎨 Design System

### Color Palette
- **Slate/Neutral** - Primary color scheme (minimal, professional)
- **Priority Colors**:
  - 🔴 Urgent: Red
  - 🟠 High: Orange
  - 🔵 Medium: Blue
  - ⚪ Low: Slate/Gray

### Category Colors
- 🟣 Data Science: Purple
- 🟡 Entrepreneurship: Amber
- 🔵 AI Research: Indigo
- 🟢 Fitness: Emerald
- 🔵 Studies: Cyan
- 🩷 Opportunities: Pink
- ⚪ Personal: Slate

---

## 🔐 Authentication

Using **Clerk** for authentication:
- ✅ Email/password signup and login
- ✅ Google OAuth
- ✅ User profile management
- ✅ Secure session handling
- ✅ Protected routes via middleware

---

## 🚧 Current Status

### ✅ Completed (Phase 0: Foundation)
- [x] Next.js 16 project initialization
- [x] TypeScript strict mode configuration
- [x] Tailwind CSS 4 setup
- [x] shadcn/ui integration
- [x] ESLint + Prettier configuration
- [x] Folder structure organization
- [x] Prisma schema design (9 tables)
- [x] Clerk authentication setup
- [x] Sign-in/sign-up pages
- [x] Protected routes middleware
- [x] Landing page
- [x] Basic dashboard structure
- [x] Utility functions and types
- [x] Documentation (CLAUDE.md, SETUP.md)

### 🚧 Next Steps (Phase 1: MVP)
- [ ] Task CRUD API endpoints
- [ ] Task list component
- [ ] Task creation form
- [ ] Task filtering and sorting
- [ ] Dashboard views (Today, List, Calendar)
- [ ] Quick add task (Cmd+K)
- [ ] Subtasks functionality
- [ ] Tags system

---

## 📈 Roadmap

| Phase | Features | Timeline |
|-------|----------|----------|
| **Phase 0** | Foundation | ✅ Complete |
| **Phase 1** | Core Task Management | 🚧 In Progress |
| **Phase 1.5** | Advanced Tasks (recurring, dependencies) | 📅 Planned |
| **Phase 2** | Analytics & Habits | 📅 Planned |
| **Phase 3** | PWA, Collaboration, AI | 🔮 Future |

---

## 🤝 Contributing

This is a personal productivity app, but the codebase follows production-grade standards:
- TypeScript strict mode
- Component-based architecture
- Proper error handling
- Input validation (client + server)
- Accessibility (ARIA, keyboard navigation)

---

## 📄 License

Private project. All rights reserved.

---

## 🙏 Acknowledgments

Built with:
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://www.prisma.io/) - Database ORM
- [Clerk](https://clerk.com/) - Authentication
- [Supabase](https://supabase.com/) - PostgreSQL hosting
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Vercel](https://vercel.com/) - Deployment

---

**Created**: February 14, 2026
**Status**: Foundation Complete ✅
**Next**: Building Task Management Features 🚀
