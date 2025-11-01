# To-Do App - Full MERN Stack Application

A production-ready MERN (MongoDB, Express, React, Node.js) to-do application designed for college students to maximize productivity and discipline. Features include task management, calendar views, interactive dashboard, tags, priorities, recurrence, reminders, and focus mode.

## 🚀 Features

- **Authentication**: Secure JWT-based auth with refresh tokens
- **Task Management**: CRUD operations with priorities, tags, checklists, and status tracking
- **Calendar Views**: Day, Week, Month views with drag-drop scheduling
- **Recurrence**: Daily, weekly, monthly recurring tasks
- **Tags & Filters**: Organize tasks with color-coded tags and advanced filtering
- **Dashboard**: KPIs, charts, completion rates, streaks, and CSV export
- **Focus Mode**: Timer-based focus sessions with task tracking
- **Reminders**: In-app notifications for upcoming due dates
- **Quick Add**: Natural language task creation (e.g., "finish lab report #school !high @today")
- **Accessibility**: WCAG AA compliant, keyboard navigation, ARIA labels

## 📋 Tech Stack

### Frontend
- React 18 + Vite
- TypeScript
- React Router v6
- React Query (TanStack Query)
- Zustand (state management)
- Tailwind CSS + shadcn/ui components
- FullCalendar
- Recharts

### Backend
- Node.js 20
- Express 4
- TypeScript
- Mongoose 8
- Zod (validation)
- JWT + bcrypt (auth)
- node-cron (reminders)
- date-fns

### Database
- MongoDB Atlas (production) or local MongoDB (development)

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 20+ and npm/pnpm
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone and Install

```bash
git clone <repo-url>
cd "To-Do App"
npm install  # or pnpm install
```

### 2. Environment Configuration

#### Backend (`apps/api/.env`)
Copy `.env.example` to `.env`:

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=4000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/todo-app
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
CORS_ORIGIN=http://localhost:5173
```

#### Frontend (`apps/web/.env`)
```bash
cd apps/web
cp .env.example .env
```

```env
VITE_API_BASE=http://localhost:4000/api/v1
```

### 3. MongoDB Atlas Setup

1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new project and cluster (free tier is fine)
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Add your IP to Network Access (0.0.0.0/0 for development)
7. Paste the connection string into `apps/api/.env` as `MONGO_URI`

### 4. Seed Demo Data (Optional)

```bash
npm run seed  # or: npx ts-node scripts/seed.ts
```

Demo credentials:
- Email: `demo@example.com`
- Password: `demo123`

## 🏃 Development

### Start Development Servers

From the root directory:

```bash
npm run dev
```

This starts:
- **API**: http://localhost:4000
- **Web**: http://localhost:5173

### Available Scripts

```bash
# Development
npm run dev              # Start both API and web servers

# Build
npm run build            # Build both apps for production

# Testing
npm run test            # Run all tests

# Code Quality
npm run lint            # Lint all code
npm run fmt             # Format code with Prettier
```

### Individual Workspace Scripts

**API (`apps/api`):**
```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run start    # Start production server
npm run test     # Run tests
npm run lint     # Lint code
```

**Web (`apps/web`):**
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm run test     # Run tests
npm run lint     # Lint code
npm run fmt      # Format code
```

## 🐳 Docker (Local Development - Optional)

If you prefer local MongoDB instead of Atlas:

```bash
cd infra
docker compose up -d
```

This starts MongoDB on `localhost:27017`. Update `MONGO_URI` in `apps/api/.env`:

```env
MONGO_URI=mongodb://localhost:27017/todo-app
```

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. **Build the frontend:**
   ```bash
   cd apps/web
   npm run build
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repo
   - Set root directory to `apps/web`
   - Add environment variable: `VITE_API_BASE=https://your-api-url.com/api/v1`
   - Deploy

3. **Deploy to Netlify:**
   - Similar steps, set build command: `npm run build`
   - Publish directory: `dist`

### Backend (Render/Railway/Fly.io)

#### Render
1. Create a new Web Service
2. Connect GitHub repo
3. Set:
   - Build Command: `cd apps/api && npm install && npm run build`
   - Start Command: `cd apps/api && npm start`
4. Add environment variables from `apps/api/.env`
5. Deploy

#### Railway
1. Create new project
2. Deploy from GitHub
3. Set root directory: `apps/api`
4. Add environment variables
5. Deploy

#### Fly.io
```bash
cd apps/api
fly launch
# Follow prompts, add env vars
fly deploy
```

### Post-Deployment Checklist

- [ ] Set strong `JWT_SECRET` and `JWT_REFRESH_SECRET` in production
- [ ] Update `CORS_ORIGIN` to your frontend URL
- [ ] Verify MongoDB Atlas network access includes your server IP
- [ ] Enable reminder cron job (runs automatically)
- [ ] (Optional) Configure SMTP for email reminders
- [ ] Test authentication flow
- [ ] Verify calendar and dashboard features

## 📖 API Documentation

Base URL: `/api/v1`

### Auth
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout

### Tags
- `GET /tags` - List user tags
- `POST /tags` - Create tag
- `PATCH /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag

### Tasks
- `GET /tasks` - List tasks (supports query params: status, from, to, q, tags, priority, limit, cursor)
- `POST /tasks` - Create task
- `GET /tasks/:id` - Get task
- `PATCH /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `POST /tasks/:id/checklist` - Add checklist item
- `PATCH /tasks/:id/checklist/:itemId` - Update checklist item
- `DELETE /tasks/:id/checklist/:itemId` - Delete checklist item

### Calendar
- `GET /calendar/events?from=<ISO>&to=<ISO>` - Get calendar events

### Analytics
- `GET /analytics/summary?from=<ISO>&to=<ISO>` - Get dashboard KPIs and charts
- `GET /analytics/csv?from=<ISO>&to=<ISO>` - Download CSV export

### Reminders
- `GET /reminders` - Get user reminders
- `POST /reminders/:taskId/dismiss` - Dismiss reminder

## 🎨 Quick Add Syntax

Natural language task creation supports:
- `#tag` - Assign tag
- `!1-5` - Set priority (1=low, 5=high)
- `@today`, `@tomorrow`, `@mon` (next Monday), etc. - Set due date
- `^allday` - Mark as all-day event
- `-- description` - Add description

Example: `finish lab report #school !high @today -- chemistry assignment`

## 🧪 Testing

```bash
# Backend tests
cd apps/api
npm test

# Frontend tests
cd apps/web
npm test
```

## 🔒 Security Features

- JWT authentication with short-lived access tokens (15m)
- HttpOnly refresh token cookies (7d)
- Rate limiting on auth endpoints
- Password hashing with bcrypt
- CORS with configurable origins
- Helmet.js security headers
- Input validation with Zod

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify `MONGO_URI` is correct
- Check network access in MongoDB Atlas
- Ensure database user has proper permissions

### CORS Errors
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Check browser console for exact error

### JWT Errors
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are set
- Clear browser cookies/localStorage if tokens are stale

### Build Errors
- Run `npm install` in root and each workspace
- Check Node.js version (20+)
- Clear `node_modules` and reinstall

## 📝 License

This project is provided as-is for educational and personal use.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

---

**Built with ❤️ for disciplined productivity**
