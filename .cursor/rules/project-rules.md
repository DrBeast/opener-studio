# Project Context

You are building Opener Studio, a "Thick Backend" application for professional outreach.
The goal is to solve "Blank Page Syndrome" for ambitious professionals.

# Tech Stack & Constraints

- Frontend: React + Vite + Tailwind CSS + Radix UI.
- Backend: Supabase (PostgreSQL, Auth, Edge Functions).
- Language: TypeScript (Strict mode).

# Critical Rules (The "Upgrades")

1. **No Client-Side Logic:** Logic belongs in Supabase Edge Functions. The frontend is a dumb terminal.
2. **Persistence:** NEVER use localStorage for user data. All state must be persisted to Supabase tables immediately.
3. **Styling:** Use the existing `design-system` components (DsTextarea, PrimaryAction) and CSS styling components. Do not invent new styles unless necessary.
4. **Layout:** Prefer "Centered Layouts" for tools. Avoid "Split Layouts" that squash text inputs.
5. **Guest Mode:** Always consider the `GuestSessionContext`. Features must work without a `user_id` initially.

# Code Style

- Use functional components.
- Use explicit types for all props.
- No "any" types.
