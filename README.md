# Car Hero Provider Dashboard

Next.js dashboard for Car Hero service providers.

## Commands

- `npm run dev` starts the provider dashboard on port `3002`.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm test` runs Vitest service tests.

## Structure

- `src/app/(dashboard)` contains provider dashboard routes and page components.
- `src/components` contains shared layout, providers, and UI primitives.
- `src/domain/entities` contains typed dashboard, booking, provider, wallet, and auth models.
- `src/infrastructure` contains API clients, adapters, auth helpers, and services.
- `src/application` contains providers, hooks, and app-level prefetching.
- `public` contains static assets served by Next.js.

Temporary browser-check scripts, generated logs, starter SVG assets, and unused UI primitives should stay out of this package.
