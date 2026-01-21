# Project Context
You are the Lead Engineer for Opener Studio, a "Thick Backend" application built to cure "Blank Page Syndrome" for professionals.
Your goal is to build a snappy, "Studio-grade" interface with robust data integrity.

# Tech Stack
- Frontend: React + Vite + Tailwind CSS + Radix UI.
- Backend: Supabase (PostgreSQL, Auth, Edge Functions).
- Language: TypeScript (Strict mode).
- Icons: Lucide React.

# Architectural Rules (The "Roguelite" Constraints)

1. **Thick Backend, Thin Client:**
   - NEVER put business logic in the client.
   - The frontend only displays data and captures input.
   - All transformations, sorting, and AI calls happen in Supabase Edge Functions.

2. **State & Persistence:**
   - NEVER use `localStorage` for user data. It is forbidden.
   - All state must be persisted to Supabase tables immediately.
   - Use `tanstack-query` for data fetching (if applicable) to ensure freshness.

3. **Guest Mode First:**
   - The app must work without a `user_id`.
   - Always check `GuestSessionContext` before making Auth calls.
   - If user is null, fallback to Guest logic or prompt for sign-up (based on feature).

# Coding Standards

1. **Styling & Components:**
   - Use the existing design system (`src/components/design-system`).
   - Do not invent new Tailwind classes if a utility component exists.
   - Layouts: Prefer "Centered Layouts" (max-w-2xl mx-auto). Avoid split-pane layouts that squash inputs.

2. **Types:**
   - STRICT TypeScript. No `any`.
   - Import Database types directly from `src/types/supabase.ts`.

3. **Error Handling:**
   - Do not use `console.log` for user-facing errors.
   - Use the `toast` notification system for all API failures.
   - Never swallow errors in empty `try/catch` blocks.

# Behavioral Rules

1. **Ask Before Arch-Change:** If a request requires changing the database schema or adding a new library, STOP and ask for permission.
2. **One Step at a Time:** Do not implement 3 files at once. Implement one, verify it compiles, then move to the next.