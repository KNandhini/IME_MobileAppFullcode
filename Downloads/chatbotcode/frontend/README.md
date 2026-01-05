# AITicketMaster Frontend

This is the frontend for the AITicketMaster project, a React-based admin and AI assistant ticketing system.

## Prerequisites

- Node.js (v16 or above recommended)
- npm (v8 or above) or yarn

## Project Structure

- `client/` - Main React frontend
- `shared/` - Shared types and schema
- `server/` - (If present) Backend API (not covered by this README)

## Setup

1. **Install dependencies:**

   ```bash
   npm i
   # or
   npm install
   ```

2. **Run the development server:**

   ```bash
   npm run dev
   ```

   The app will start on [http://localhost:8080](http://localhost:8080) by default (see `main.tsx`).

3. **Build for production:**

   ```bash
   npm run build
   ```

   The build output will be in the `build/` directory.

## Useful Scripts

- `npm run lint` — Lint the codebase
- `npm run test` — Run tests (if present)

## Troubleshooting

- If you see 401 Unauthorized errors, ensure you are logged in with a valid Microsoft account and your backend is running.
- If you change the backend URL, update `API_BASE_URL` in `src/lib/apiClient.ts` or use an environment variable if supported.

## Contact

For more information or help, contact the project maintainer.
