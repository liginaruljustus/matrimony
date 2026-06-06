## Next.js Matrimony App with Zustand

Full-stack matrimony web application built with:

- Next.js 14 App Router + TypeScript
- MongoDB + Mongoose data layer
- NextAuth.js (credentials provider)
- Zustand stores for auth/filter/chat/ui
- Tailwind CSS
- React Hook Form + Zod

### Features

- Authentication and protected routes
- Profile create/edit using server actions
- Global search filters with Zustand
- Match suggestions API
- Interest system
- Chat module with cached local state
- Admin dashboard

### Project Structure

- `app/` - pages, API routes, server actions
- `components/` - reusable UI
- `store/` - Zustand stores
- `hooks/` - selector hooks
- `lib/` - shared server/client utilities, Mongo connection, models
- `prisma/seed.js` - Mongo seed script (kept for convenience path)

### Setup

1. Copy `.env.example` to `.env` and update values.
2. Ensure MongoDB is running at `mongodb://localhost:27017/matrimony`.
3. Seed demo users:

```bash
npm run db:seed
```

4. Start app:

```bash
npm run dev
```

Demo accounts after seed:
- Admin: `admin@matrimony.app` / `Admin@123`
- User: `priya@example.com` / `User@1234`
