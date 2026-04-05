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
- Error handling with clear user-facing messages

## Tech Stack

- **Framework:** Next.js (App Router, server components where appropriate)
- **Language:** TypeScript
- **Database:** Supabase (Postgres, Auth, Row Level Security)
- **Hosting:** Vercel (free tier)
- **AI:** Google Gemini via Google AI Studio free tier API
- **Maps:** Leaflet + OpenStreetMap (free, no API key)
- **Charts:** Recharts
- **Icons:** Lucide React
- **Styling:** Tailwind CSS v4 with CSS custom properties

## Design System

### UI Rules (STRICT)
- NO border-radius. All corners are sharp/square.
- NO gradients. Flat solid colours only.
- NO emojis. Anywhere. None.
- Dark mode only. No light mode.
- Mobile-first PWA.
- Minimum touch target: 44x44px.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
```

## Important Reminders

- This app costs nothing to run. Every technology choice must be free tier.
- No emojis in the UI. Not in notifications, not in text, nowhere.
- Mobile-first always. Test on phone-width viewport.
- Military aesthetic: sharp corners, flat colours, monospace data, stencil headings.
- All AI responses must be validated before rendering.
- Keep code simple and well-commented.
