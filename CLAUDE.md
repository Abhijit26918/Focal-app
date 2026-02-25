# TaskMaster - Production Task Management Application

## Project Overview

TaskMaster is a comprehensive, production-ready task management web application designed for multi-domain productivity tracking across:
- Data Science projects and analysis
- Entrepreneurship activities and business ventures
- AI Research (papers, experiments, staying current)
- Fitness tracking (gym routines, workouts)
- B.Tech Studies and continuous learning
- Personal tasks and opportunities

This is a serious, daily-use application built to manage complex workflows, track habits, analyze productivity patterns, and maintain accountability across all life domains.

---

## Tech Stack

### Core Framework
- **Frontend**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript 5 (strict mode enabled)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Neutral/Slate theme)

### Backend & Database
- **API**: Next.js API Routes (serverless)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Prisma 7
- **Authentication**: Clerk (email/password + Google OAuth)

### State & Data Management
- **State Management**: React Context + hooks (simple, scalable)
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod validation

### Utilities & Tools
- **Charts**: Recharts (for analytics dashboard)
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Command Palette**: cmdk
- **Class Management**: clsx + tailwind-merge

### Development Tools
- **Linting**: ESLint 9 + Next.js config
- **Formatting**: Prettier 3
- **Type Checking**: TypeScript strict mode
- **Version Control**: Git

### Deployment
- **Platform**: Vercel (optimized for Next.js)
- **Environment**: Serverless Edge Functions

---

## Project Structure

```
taskmaster-app/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── tasks/           # Task CRUD endpoints
│   │   ├── auth/            # Auth callbacks
│   │   ├── notifications/   # Notification system
│   │   └── habits/          # Habit tracking endpoints
│   ├── dashboard/           # Main dashboard pages
│   ├── tasks/               # Task management pages
│   ├── analytics/           # Analytics dashboard
│   └── layout.tsx           # Root layout
│
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── tasks/               # Task-related components
│   ├── dashboard/           # Dashboard widgets
│   ├── analytics/           # Charts and analytics
│   ├── habits/              # Habit tracking UI
│   ├── auth/                # Authentication components
│   └── layout/              # Layout components (Sidebar, etc.)
│
├── lib/                     # Utilities and core logic
│   ├── db/                  # Database client and helpers
│   ├── utils/               # Utility functions
│   ├── auth/                # Auth helpers
│   ├── api/                 # API client functions
│   └── hooks/               # Shared hook utilities
│
├── hooks/                   # Custom React hooks
├── contexts/                # React Context providers
├── types/                   # TypeScript type definitions
├── prisma/                  # Database schema and migrations
└── public/                  # Static assets
```

---

## Database Schema

### Core Tables

#### users
- `id` (UUID, Primary Key)
- `clerkId` (String, unique) - Clerk user ID
- `email` (String, unique)
- `name` (String)
- `avatar` (String, nullable)
- `createdAt` (DateTime)
- `preferences` (JSON) - user settings

#### tasks
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → users)
- `title` (String, required)
- `description` (Text, optional)
- `category` (Enum: DataScience, Entrepreneurship, AIResearch, Fitness, Studies, Opportunities, Personal)
- `priority` (Enum: Low, Medium, High, Urgent)
- `status` (Enum: ToDo, InProgress, Completed, Cancelled)
- `dueDate` (DateTime, nullable)
- `estimatedDuration` (Int, minutes)
- `recurringPattern` (JSON, nullable) - {type: 'daily'|'weekly'|'monthly', interval: number}
- `createdAt` (DateTime)
- `updatedAt` (DateTime)
- `completedAt` (DateTime, nullable)

#### subtasks
- `id` (UUID, Primary Key)
- `taskId` (UUID, Foreign Key → tasks)
- `title` (String)
- `completed` (Boolean)
- `order` (Int)

#### tags
- `id` (UUID, Primary Key)
- `name` (String)
- `userId` (UUID, Foreign Key → users)
- Unique constraint on (name, userId)

#### task_tags (join table)
- `taskId` (UUID, Foreign Key → tasks)
- `tagId` (UUID, Foreign Key → tags)
- Composite primary key (taskId, tagId)

#### task_dependencies
- `taskId` (UUID, Foreign Key → tasks)
- `dependsOnTaskId` (UUID, Foreign Key → tasks)
- Composite primary key (taskId, dependsOnTaskId)

#### notifications
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → users)
- `taskId` (UUID, Foreign Key → tasks, nullable)
- `type` (Enum: Reminder, DailyDigest, Deadline, Suggestion)
- `message` (String)
- `scheduledFor` (DateTime)
- `sentAt` (DateTime, nullable)
- `read` (Boolean, default: false)

#### habits (Phase 2)
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key → users)
- `name` (String)
- `category` (Same enum as tasks)
- `targetFrequency` (String) - e.g., "daily", "3x per week"
- `createdAt` (DateTime)

#### habit_completions (Phase 2)
- `id` (UUID, Primary Key)
- `habitId` (UUID, Foreign Key → habits)
- `completedDate` (Date)
- Unique constraint on (habitId, completedDate)

---

## Coding Standards

### TypeScript
- **Strict mode**: Always enabled
- **Type everything**: No `any` types unless absolutely necessary
- **Prefer interfaces** for object shapes
- **Use enums** for fixed value sets (Priority, Status, Category)
- **Generic types** for reusable components

### React
- **Component-based architecture**: Small, focused components
- **Server Components by default**: Use Client Components only when needed (interactivity, hooks)
- **Custom hooks**: Extract reusable logic
- **Error boundaries**: Wrap major sections
- **Loading states**: Always show loading UI
- **Optimistic updates**: Immediate feedback for mutations

### Naming Conventions
- **Components**: PascalCase (e.g., `TaskCard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_TASKS_PER_PAGE`)
- **Types/Interfaces**: PascalCase with descriptive names (e.g., `TaskWithSubtasks`)
- **API routes**: kebab-case folders (e.g., `api/task-dependencies/`)

### Code Organization
- **One component per file** (unless tightly coupled sub-components)
- **Export types** from `/types` directory
- **Shared utilities** in `/lib/utils`
- **API logic** separated from UI components
- **Comments**: Document complex logic, algorithms, and business rules

### Styling
- **Tailwind utility classes** preferred
- **Component variants**: Use `cva` (class-variance-authority) from shadcn/ui
- **Dark mode**: Use Tailwind's dark mode classes
- **Responsive design**: Mobile-first approach
- **Color coding**: Consistent colors for priority/category

### Validation
- **Client-side**: Zod schemas for forms
- **Server-side**: Validate all API inputs with Zod
- **Database**: Prisma schema constraints

### Error Handling
- **Try-catch** around async operations
- **User-friendly messages**: Never expose technical errors
- **Logging**: Log errors for debugging (consider error tracking service later)
- **Graceful degradation**: App should work even if features fail

---

## Development Workflow

### Local Development
```bash
npm run dev          # Start dev server on localhost:3000
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
npm run build        # Production build test
```

### Database
```bash
npx prisma generate      # Generate Prisma Client
npx prisma db push       # Push schema to database (dev)
npx prisma migrate dev   # Create and apply migrations
npx prisma studio        # Open Prisma Studio GUI
```

### Git Workflow
- **Feature branches**: `feature/task-dependencies`, `feature/analytics-dashboard`
- **Commit messages**: Conventional commits (e.g., `feat: add task filtering`, `fix: date picker timezone issue`)
- **Pull requests**: For major features
- **Main branch**: Always production-ready

---

## Feature Implementation Roadmap

### ✅ Phase 0: Foundation (Current)
- [x] Project initialization
- [x] TypeScript + Tailwind + shadcn/ui setup
- [x] Folder structure
- [x] Prettier + ESLint configuration
- [ ] Prisma schema design
- [ ] Clerk authentication setup
- [ ] Basic layout and navigation

### 📋 Phase 1: MVP - Core Task Management
- [ ] User authentication (email + Google OAuth)
- [ ] Task CRUD operations
- [ ] Task properties: title, description, category, priority, status, due date
- [ ] Task filtering and sorting
- [ ] Dashboard views: Today, Category, List
- [ ] Subtasks functionality
- [ ] Tags system
- [ ] Quick add task (Cmd+K command palette)
- [ ] Basic notifications (browser alerts)

### 🔄 Phase 1.5: Advanced Task Features
- [ ] Recurring tasks
- [ ] Task dependencies
- [ ] Calendar view
- [ ] Drag-and-drop task reordering
- [ ] Bulk operations (select multiple, edit, delete)
- [ ] Task templates
- [ ] Search functionality
- [ ] Email notifications (daily digest, reminders)

### 📊 Phase 2: Analytics & Insights
- [ ] Time distribution charts (pie/donut)
- [ ] Task completion trends (line/area charts)
- [ ] Productivity heatmap
- [ ] Streak tracking
- [ ] Category-specific insights
- [ ] "Most productive time" analysis
- [ ] Export reports as PDF

### 🎯 Phase 3: Habit Tracking
- [ ] Habit creation and management
- [ ] Daily habit completion tracking
- [ ] Habit streaks
- [ ] Integration with task analytics
- [ ] Habit reminders

### 🚀 Phase 4: Advanced Features
- [ ] PWA support (offline mode)
- [ ] Mobile app (React Native or Progressive Web App)
- [ ] Collaboration features (share tasks)
- [ ] File attachments
- [ ] Activity log / audit trail
- [ ] Pomodoro timer integration
- [ ] AI-powered suggestions (task prioritization)
- [ ] Voice input for task creation

---

## Environment Variables

Create `.env.local` file with:

```bash
# Database
DATABASE_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Optional: Email service (for notifications)
# RESEND_API_KEY="re_..."

# Optional: Analytics
# VERCEL_ANALYTICS_ID="..."
```

---

## UI/UX Principles

### Design Philosophy
- **Minimal and clean**: Slate/Zinc color palette, lots of whitespace
- **Focus on content**: Task information is primary
- **Fast interactions**: Optimistic updates, instant feedback
- **Keyboard-first**: Power users should never touch mouse
- **Responsive**: Perfect on mobile, tablet, desktop

### Accessibility
- **ARIA labels** on all interactive elements
- **Keyboard navigation**: Tab order, focus states
- **Screen reader support**: Semantic HTML
- **Color contrast**: WCAG AA compliance minimum
- **Focus indicators**: Clear visual feedback

### Color System
- **Priority colors**:
  - Low: Slate/Gray
  - Medium: Blue
  - High: Orange
  - Urgent: Red
- **Category colors**: Assign distinct colors to each life domain
- **Status colors**:
  - To Do: Slate
  - In Progress: Blue
  - Completed: Green
  - Cancelled: Gray

### Animations
- **Subtle transitions**: 150-300ms duration
- **Page transitions**: Smooth route changes
- **Micro-interactions**: Button hover, task check
- **Loading states**: Skeleton screens, spinners

---

## Performance Optimization

- **React Server Components**: Default for non-interactive UI
- **Dynamic imports**: Code split heavy components
- **Image optimization**: Next.js Image component
- **Database queries**: Efficient Prisma queries, proper indexing
- **Caching**: React Query for client-side caching
- **Edge functions**: Deploy to Vercel Edge when possible

---

## Security Considerations

- **Authentication**: Clerk handles security, session management
- **Authorization**: Check user ownership for all data access
- **Input validation**: Zod schemas on client and server
- **SQL injection**: Prisma ORM prevents this by default
- **XSS protection**: React escapes by default, be careful with dangerouslySetInnerHTML
- **CSRF**: Next.js API routes have built-in protection
- **Environment secrets**: Never commit `.env` files
- **Rate limiting**: Consider implementing for API routes (Phase 3)

---

## Testing Strategy (Future)

- **Unit tests**: Jest + React Testing Library
- **Integration tests**: API routes, database operations
- **E2E tests**: Playwright for critical user flows
- **Type checking**: TypeScript catches many bugs
- **Manual testing**: Test on multiple browsers, devices

---

## Deployment

### Vercel Deployment
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Automatic deployments on push to main
4. Preview deployments for pull requests

### Database Migrations
- Use Prisma Migrate for production migrations
- Test migrations in staging environment first
- Backup database before major schema changes

---

## Claude Code Preferences

When assisting with this project:

1. **Always use TypeScript**: No JavaScript files
2. **Follow the folder structure**: Don't create files in random locations
3. **Use shadcn/ui components**: Don't build from scratch if shadcn has it
4. **Prefer Server Components**: Only use "use client" when necessary
5. **Write comments**: Especially for complex business logic
6. **Test as you build**: Suggest testing after implementing features
7. **Mobile-first**: Consider responsive design in all components
8. **Accessibility**: Include ARIA labels and keyboard support
9. **Error handling**: Always handle errors gracefully
10. **Validate inputs**: Both client and server side

---

## Notes & Decisions

### Why Clerk over NextAuth?
- Better UX out of the box
- Easier Google OAuth setup
- Built-in user management UI
- Great DX for MVP speed
- (Tradeoff: vendor lock-in, usage limits on free tier)

### Why Prisma over raw SQL?
- Type-safe queries
- Automatic migrations
- Great TypeScript integration
- Easier to maintain and refactor

### Why TanStack Query?
- Excellent caching
- Optimistic updates support
- Request deduplication
- Great DevTools

### Why Supabase?
- Easy PostgreSQL setup
- Good free tier
- Real-time subscriptions (useful for Phase 3)
- Backup and scaling built-in

---

## Getting Help

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Clerk Docs**: https://clerk.com/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs

---

**Last Updated**: February 14, 2026
**Version**: 0.1.0 (Foundation Phase)
**Status**: In Active Development
