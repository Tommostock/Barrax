# CLAUDE.md — BARRAX

## Project Overview

BARRAX is a military-themed personal fitness and nutrition PWA. No gym equipment. Bodyweight workouts, outdoor running with GPS tracking, and AI-generated meal plans for a fussy eater. Gamified with military ranks, XP, streaks, badges, and self-competition.

## Developer Context

The developer (Tom) is self-taught with no formal coding background. He builds apps as a hobby using Claude Code as his primary development tool.

**Code requirements:**
- Well-commented, beginner-friendly code throughout
- Clear file and folder naming
- Descriptive variable and function names
- Comments explaining WHY, not just what
- Break complex logic into small, named functions
- Console logs during development for debugging (remove before production)
- Error handling with clear user-facing messages

## Tech Stack

- **Framework:** Next.js 14+ (App Router, server components where appropriate)
- **Language:** TypeScript
- **Database:** Supabase (Postgres, Auth, Row Level Security, real-time subscriptions)
- **Hosting:** Vercel (free tier)
- **AI:** Google Gemini via Google AI Studio free tier API
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** Tailwind CSS with CSS custom properties for the design system
- **PWA:** next-pwa or Serwist for service worker and offline support
- **Notifications:** Web Push API via service worker

## Design System

### Colours (CSS Custom Properties)

```css
--bg-primary: #0C0C0C;
--bg-panel: #141A14;
--bg-panel-alt: #1A221A;
--bg-input: #0F150F;
--green-primary: #4A6B3A;
--green-light: #6B8F5A;
--green-dark: #2D4220;
--green-muted: #3A4F2E;
--khaki: #8B7D5E;
--sand: #C4B090;
--text-primary: #D4D4C8;
--text-secondary: #7A7A6E;
--danger: #8B3232;
--xp-gold: #B8A04A;
```

### Typography

- Headings: Barlow Condensed (Google Fonts), uppercase, bold
- Body: Barlow for readable text, JetBrains Mono for stats/data/numbers
- All section headers in uppercase with letter-spacing

### UI Rules (STRICT)

- NO border-radius. All corners are sharp/square.
- NO gradients. Flat solid colours only.
- NO emojis. Anywhere. None.
- Thin 1px borders using --green-dark.
- Cards use classification-style tags: [ACTIVE], [COMPLETE], [LOCKED], etc.
- Dark mode only. No light mode.
- Mobile-first. This is a PWA used primarily on a phone.
- Minimum touch target: 44x44px.
- Bottom sheet modals, not centred pop-ups.
- Skeleton loading states, not spinners.

### UX Patterns

- Bottom tab bar with 5 tabs: COMMAND, MISSIONS, RATIONS, INTEL, RECORD
- Smooth page transitions
- Pull-to-refresh on data screens
- Swipe gestures on cards where appropriate
- Toast notifications at bottom of screen
- Haptic feedback on key actions (navigator.vibrate)
- Safe area padding for notched devices

## Project Structure

```
barrax/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # Dashboard / COMMAND screen
│   ├── missions/
│   │   ├── page.tsx            # Weekly programme view
│   │   ├── [id]/page.tsx       # Individual workout detail
│   │   ├── player/[id]/page.tsx # Workout player
│   │   ├── run/page.tsx        # Run tracker
│   │   └── library/page.tsx    # Exercise library
│   ├── rations/
│   │   ├── page.tsx            # Weekly meal plan
│   │   ├── [id]/page.tsx       # Individual meal detail
│   │   ├── shopping/page.tsx   # Shopping list
│   │   ├── favourites/page.tsx # Saved meals
│   │   └── water/page.tsx      # Water tracker
│   ├── intel/
│   │   ├── page.tsx            # Stats overview
│   │   ├── runs/page.tsx       # Run stats
│   │   ├── records/page.tsx    # Personal records
│   │   └── body/page.tsx       # Weight and measurements
│   ├── record/
│   │   ├── page.tsx            # Rank, badges, service record
│   │   └── settings/page.tsx   # Settings / Base Operations
│   ├── onboarding/
│   │   └── page.tsx
│   └── api/
│       ├── generate-workout/route.ts
│       ├── generate-meals/route.ts
│       ├── generate-run-plan/route.ts
│       └── generate-challenge/route.ts
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Tag.tsx
│   │   ├── Toast.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Skeleton.tsx
│   │   └── Timer.tsx
│   ├── layout/
│   │   ├── BottomNav.tsx
│   │   └── Header.tsx
│   ├── dashboard/
│   ├── workout/
│   ├── nutrition/
│   ├── stats/
│   ├── rank/
│   └── run/
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── gemini.ts
│   ├── xp.ts
│   ├── streaks.ts
│   ├── badges.ts
│   ├── records.ts
│   ├── geolocation.ts
│   └── notifications.ts
├── hooks/
│   ├── useWorkout.ts
│   ├── useRunTracker.ts
│   ├── useMealPlan.ts
│   ├── useXP.ts
│   ├── useStreak.ts
│   └── useWater.ts
├── types/
│   └── index.ts
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── icons/
│   └── fonts/
├── supabase/
│   └── migrations/
└── styles/
    └── globals.css
```

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
```

## Key Implementation Notes

### Gemini AI Integration
- All AI calls go through Next.js API routes (never expose API key to client)
- Always request JSON-only responses from Gemini
- Parse responses with try/catch and validate structure before using
- Cache generated programmes in Supabase (do not regenerate unless user requests)
- If Gemini fails, show error toast and offer retry

### GPS Run Tracking
- Use navigator.geolocation.watchPosition with enableHighAccuracy: true
- Store GPS points as an array in state during run, save to Supabase on completion
- Calculate pace and distance client-side using the Haversine formula
- Map rendered with Leaflet (react-leaflet) using dark map tiles
- Handle GPS permission denial gracefully with clear messaging

### XP and Rank System
- XP is awarded via a utility function that handles all sources
- After every XP award, check if user has crossed a rank threshold
- If rank-up, trigger the rank-up screen before returning to normal flow
- All XP transactions logged for audit/debugging

### Offline Support
- Current week's workout programme and meal plan cached in service worker
- Workout player must work fully offline
- Queue completed workout data and sync when back online
- Shopping list works offline

### Notifications
- Request notification permission during onboarding
- Generate VAPID keys for web push
- Store push subscription in Supabase
- Send notifications via Supabase Edge Functions or Vercel cron jobs

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npx supabase db push # Push database migrations
```

## Important Reminders

- This app costs nothing to run. Every technology choice must be free tier.
- No emojis in the UI. Not in notifications, not in text, nowhere.
- Mobile-first always. Test on phone-width viewport.
- The user is a fussy eater. The food preference system (NO GO / MAYBE / APPROVED) is a core feature, not an afterthought.
- Military aesthetic: sharp corners, flat colours, monospace data, stencil headings, camo textures. No curves, no gradients, no playfulness.
- All AI responses must be validated before rendering. Never trust raw AI output.
- Keep code simple and well-commented. The developer learns from reading the code.
