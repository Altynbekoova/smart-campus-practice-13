# Project

Continue the existing Smart Campus Room Availability Checker. React, TypeScript, Vite, Tailwind and Vitest. One-page availability decisions for one selected room from the four existing fictional room fixtures. No booking creation.

# Structure

src/App.tsx is the existing responsive UI. src/lib/validation.ts contains pure checkAvailability plus time helpers. src/data.ts contains fixtures; src/types.ts contains Room and Booking. Active suites: src/lib/validation.test.ts (validation and time parsing) and src/lib/roomFilter.test.ts (room filters). Baseline before the time-parsing fix: 30 validation + 8 room filter = 38 tests. src/lib/validation.test.original.ts is historical and not run. Counts change as tests are added; use npm test for current totals. src/lib/validation.test.original.ts and PRACTICE_07_REPORT.md are historical evidence and must remain unchanged.

# Acceptance contract

AC1: reject invalid or NaN times, start < 0, end > 1440, start >= end, and start <= currentTime. Start must be strictly after the supplied time. Preserve existing guard order, messages, signature and return shape.

AC2: maximum duration 120 minutes, inclusive.

AC3: reject blocked rooms.

AC4: overlap is start < booking.end && end > booking.start; touching either endpoint is allowed.

AC5: return Available/Unavailable without modifying room or booking data.

AC6: preserve existing design, room selection, duration feedback, validation messages and desktop/mobile usability.

# Engineering rules

Inspect first and justify ZERO, ONE or TWO patterns. Keep the existing pure booking-rule function. Prefer the smallest module boundary that removes actual duplication; no redundant extraction, classes, Singleton or Factory. Only use Adapter for genuinely inconsistent input shapes and Strategy for multiple required policies; neither is currently needed. Do not redesign the UI or change fixtures, dependencies, storage, authentication, backend, analytics or booking creation. Keep the current 120-minute behavior and historical files. Do not weaken or remove existing assertions.

# Commands

Install: npm ci. Tests: npm test (vitest run); detailed evidence: npm test -- --reporter=verbose. Build: npm run build. Types: npm run typecheck. Lint: npm run lint. Preview: npm run dev.

# Verification and evidence

Run the baseline and final suite; retain exact command/output, exit status and pass/fail counts. Ensure regression coverage for past time, reversed interval, 121-minute duration, blocked room, overlap, touching endpoints and unchanged fixtures, retaining prior boundary and NaN tests. Check desktop and narrow UI before/after and capture actual screenshots. Do not invent test results, screenshots, browser checks, AI responses or model identity. Report changed files, a 100–150-word rationale and limitations. Do not publish until scoped changes have passed verification.

# Explicit activation

Do not assume Bolt automatically loads this file. When explicitly asked, read it, summarize constraints and verified commands, and state what could not be checked.
