# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartPlanning is a MERN stack SaaS application for intelligent team planning with integrated AI, built with TypeScript. The application allows businesses to automatically optimize work schedules considering individual constraints, vacations, and required skills.

## Architecture

This is a full-stack application with separate backend and frontend directories:

- **Backend**: Node.js + Express + TypeScript + MongoDB (Mongoose)
- **Frontend**: React + TypeScript + Vite + TailwindCSS

## Development Commands

### Backend Commands

From the `backend/` directory:

```bash
# Development server with hot reload
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Database migration scripts
npm run migrate
npm run create-admin
npm run migrate:employees
npm run assign-teams-to-manager
npm run reset-chris
```

### Frontend Commands

From the `frontend/` directory:

```bash
# Development server (runs on port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

### Running the Full Application

Start both servers in separate terminals:

1. Backend: `cd backend && npm run dev` (runs on port 5050)
2. Frontend: `cd frontend && npm run dev` (runs on port 5173)

The frontend is configured to proxy API requests to the backend at `http://localhost:5050/api`.

## Key Architecture Patterns

### Authentication & Authorization

- JWT-based authentication with Google OAuth support
- Role-based access control (RBAC) with roles: admin, directeur, manager, employé
- Middleware-based route protection in `backend/src/middlewares/auth.middleware.ts`
- Frontend auth context in `frontend/src/context/AuthContext.tsx`

### API Communication

- Centralized axios instance at `frontend/src/api/axiosInstance.ts`
- Request/response interceptors for automatic token handling in `frontend/src/api/axiosInterceptors.ts`
- Automatic redirect to login on 401 errors
- All API calls should use the centralized axiosInstance, not direct axios imports

### Database Models

Key models in `backend/src/models/`:
- User, Employee, Company, Team
- WeeklySchedule, GeneratedSchedule, VacationRequest
- Task, Incident, Event
- ChatbotInteraction, ChatbotSettings

### Component Architecture

- UI components in `frontend/src/components/ui/` (reusable)
- Page components in `frontend/src/pages/`
- Feature-specific components organized by domain (admin/, modals/, vacations/, etc.)
- Theme management with light/dark mode support

### File Upload

- Cloudinary integration for image uploads (user profiles, company logos)
- Multer middleware for handling file uploads
- Upload routes in `backend/src/routes/upload.routes.ts`

## Environment Variables

### Backend (.env)

Required variables:
```
MONGODB_URI=mongodb://connection-string
JWT_SECRET=your-jwt-secret
PORT=5050
NODE_ENV=development
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
OPENAI_API_KEY=your-openai-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### Frontend (.env.local)

Required variables:
```
VITE_API_URL=http://localhost:5050/api
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Database Scripts

Important database management scripts in `backend/src/scripts/`:
- `init-db.ts`: Initialize database with test data
- `create-admin-user.ts`: Create admin user
- `migrate-from-test.ts`: Migrate data from test environment

Run with: `cd backend && ts-node src/scripts/script-name.ts`

## Development Guidelines

### Code Style (from cursor.rules.md)

- TypeScript strict mode - no `any` types
- Explicit types for all functions and variables
- Simple, clear code without unnecessary features
- Modular structure with clear separation of concerns
- Never add functionality without explicit requirements

### API Routes Structure

Routes are organized in `backend/src/routes/`:
- Public routes: `/api/` (SEO, health check)
- Auth routes: `/api/auth/`
- Admin routes: `/api/admin/users`, `/api/admin/companies`, `/api/admin/teams`
- Business logic routes: `/api/employees`, `/api/teams`, `/api/vacations`, etc.

### Frontend Routing

- React Router setup in `frontend/src/AppRouter.tsx`
- Protected routes using `PrivateRoute` component
- Role-based page access control

## Testing

- Backend: Uses Jest (though no test files currently exist)
- Frontend: Jest + React Testing Library configuration in place
- Test files should follow `*.test.ts` or `*.test.tsx` naming

## Deployment

- Backend: Configured for Render deployment with `render.yaml`
- Frontend: Configured for Hostinger deployment
- Docker support available with `Dockerfile` and `docker-compose.yml`
- Health check endpoint available at `/api/health`

## AI Integration

The application includes AI-powered planning features:
- AI route handlers in `backend/src/routes/ai.routes.ts`
- OpenAI API integration for schedule generation
- AI guide interface in `frontend/src/components/ui/AIGenerationGuide.tsx`
- Modal components for AI interactions in `frontend/src/components/modals/`

## Important Notes

- The backend runs on port 5050 (not the standard 5000)
- CORS is configured for development (localhost:5173) and production (smartplanning.fr)
- The application uses French language in many interfaces and comments
- Extensive documentation exists in multiple markdown files in the root directory