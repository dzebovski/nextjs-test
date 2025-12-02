# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Commands

- `npm run dev` – Start the Next.js 16 development server (App Router) on port 3000.
- `npm run build` – Create a production build.
- `npm start` – Run the production server (after `npm run build`).
- `npm run lint` – Run ESLint using the Next.js TypeScript and Core Web Vitals configuration.

Notes:
- The repo ships with a `package-lock.json`, so `npm` is the canonical package manager. The README also documents equivalent `yarn`, `pnpm`, and `bun` commands.
- There is currently **no test script or test runner configured** (no `test` npm script, Jest/Vitest/Playwright config, or test files). Add a test setup before expecting `npm test` or single-test commands to work.

## High-level architecture

### Framework and routing

- This is a Next.js 16 application using the **App Router**.
- Top-level entrypoints:
  - `app/layout.tsx` – Root layout component. Responsibilities:
    - Declares global `metadata` (title/description).
    - Registers two Google fonts via `next/font` (`Schibsted_Grotesk`, `Martian_Mono`) and exposes them as CSS variables on `<body>`.
    - Wraps the app in a `<html>/<body>` shell, renders the global `<NavBar />`, a full-screen `LightRays` background effect, and then the route `children` inside `<main>`.
  - `app/page.tsx` – Home route (`/`). Responsibilities:
    - Renders a simple hero section plus a "Featured" event list.
    - Imports `events` data from `@/lib/constants` and maps it to `<EventCard />` instances.
    - Uses `<ExploreBtn />` as a client component CTA.

### Shared components

All shared UI lives under `components/` and is imported via the `@/components/...` alias (configured in `tsconfig.json`). Key pieces:

- `components/NavBar.tsx`
  - Stateless header with a logo and simple nav links (`Home`, `Events`, `Create Event`).
  - Uses `next/link` and `next/image` for client-side navigation and optimized images.

- `components/EventCard.tsx`
  - Presentational card for a single event.
  - Accepts typed props (`title`, `image`, `slug`, `location`, `date`, `time`).
  - Uses `next/link` to link to `/events/{slug}` and `next/image` for the poster and small iconography.
  - Consumers are expected to pass data shaped like `EventItem` from `lib/constants.ts`.

- `components/ExploreBtn.tsx`
  - Marked as a **client component** (`"use client"`).
  - Simple button that logs a message on click and anchors to `#events` via an inner `<a>` tag.
  - Useful place to evolve client-only interactivity (analytics, smooth scroll, etc.).

- `components/LightRays.tsx` and `components/LightRays.css`
  - `LightRays.tsx` is a client-only component that renders a full-screen WebGL effect using **OGL** (`Renderer`, `Program`, `Triangle`, `Mesh`).
  - It:
    - Mounts a WebGL canvas into a container div and continuously renders animated light rays.
    - Supports multiple configuration props (origin, color, speed, spread, length, pulsating, fade distance, saturation, mouse-follow behavior, noise, distortion).
    - Uses `IntersectionObserver` to start/stop rendering when the component enters/leaves the viewport.
    - Listens to `resize` and (optionally) global `mousemove` events, and performs explicit WebGL cleanup (including `WEBGL_lose_context`).
  - `LightRays.css` defines a `.light-rays-container` utility class; the main layout currently relies more on Tailwind utility classes for positioning.

### Domain and utilities

- `lib/constants.ts`
  - Defines a strongly-typed `EventItem` model and an `events: EventItem[]` array that backs the homepage.
  - Encapsulates all event metadata (titles, slugs, locations, dates/times, and corresponding `/public/images/...` paths).
  - Exported as both a named `events` and the default export; `app/page.tsx` imports the default.

- `lib/utils.ts`
  - Defines a standard `cn(...classes)` helper combining `clsx` and `tailwind-merge`.
  - Intended as the canonical way to compose Tailwind and conditional classNames across the app.

- `components.json`
  - Configuration for the **shadcn/ui-style component tooling**.
  - Important details:
    - Global Tailwind CSS entrypoint: `app/globals.css`.
    - Aliases for imported modules: `components` → `@/components`, `utils` → `@/lib/utils`, `ui` → `@/components/ui`, `lib` → `@/lib`, `hooks` → `@/hooks`.
  - When generating new UI pieces via this tooling, expect them to land under `components/` or `components/ui/` and to reuse the `cn` helper and Tailwind setup already present.

### Styling and configuration

- **TypeScript config** (`tsconfig.json`):
  - `paths` alias: `@/*` → `./*`, used throughout (e.g., `@/components/...`, `@/lib/...`).
  - `strict` mode is enabled, with `noEmit` and `moduleResolution: "bundler"` configured for Next.js 16.

- **ESLint** (`eslint.config.mjs`):
  - Uses `eslint-config-next` (`core-web-vitals` and `typescript` presets) via `defineConfig`.
  - Custom `globalIgnores` to exclude `.next/**`, `out/**`, `build/**`, and `next-env.d.ts`.
  - `npm run lint` will lint both server and client components, enforcing Next/React/TypeScript best practices.

- **Tailwind / PostCSS** (`postcss.config.mjs`):
  - Configures `@tailwindcss/postcss` as the only PostCSS plugin.
  - Tailwind 4-style setup is implied; global styles live in `app/globals.css` (imported from `app/layout.tsx`).

### Analytics and instrumentation

- `instrumentation-client.ts`
  - Initializes **PostHog** on the client via `posthog-js`.
  - Key options:
    - `api_host: "/ingest"` and `ui_host: "https://eu.posthog.com"` – traffic is proxied through the app.
    - `capture_exceptions: true` – enables PostHog Error Tracking.
    - `debug` toggled by `NODE_ENV === "development"`.
  - Requires `process.env.NEXT_PUBLIC_POSTHOG_KEY` to be defined in the environment.

- `next.config.ts`
  - Adds `rewrites()` to support PostHog ingestion endpoints:
    - `/ingest/static/:path*` → `https://eu-assets.i.posthog.com/static/:path*`.
    - `/ingest/:path*` → `https://eu.i.posthog.com/:path*`.
  - Sets `skipTrailingSlashRedirect: true` to avoid redirecting PostHog API requests that rely on trailing slashes.

This summary should give future Warp agents enough context to run the app, understand the main architectural pieces, and extend routes/components in a way that is consistent with the existing setup.