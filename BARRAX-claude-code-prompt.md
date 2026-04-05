# Claude Code Prompt — BARRAX (Full Build)

Copy and paste this into Claude Code to build the entire app.

---

Read the CLAUDE.md file in this project root for full context on the tech stack, design system, coding standards, and project structure. Then read the BARRAX-app-design-document.md for the complete feature specification. Then read BARRAX-exercise-seed-data.md for the exercise library seed data.

We are building BARRAX — a military-themed personal fitness and nutrition PWA. No gym equipment. Bodyweight workouts, outdoor GPS run tracking, AI-generated meal plans for a fussy eater, and a full gamification system with military ranks, XP, streaks, and badges.

Build the entire app by working through 6 phases in order. Complete each phase fully before moving to the next. Do not skip ahead. After finishing each phase, confirm what was built and then move on.

---

## Phase 1 — Foundation

Set up the full project foundation:

1. Initialise Next.js project with App Router, TypeScript, Tailwind CSS, and ESLint. Install all dependencies: @supabase/supabase-js, @supabase/ssr, recharts, lucide-react, react-leaflet, leaflet, and a PWA plugin (next-pwa or serwist).

2. Set up the design system in globals.css. Define all CSS custom properties from the CLAUDE.md colour palette. Import Barlow Condensed and JetBrains Mono from Google Fonts. Set base styles: dark background, no border-radius anywhere, sharp square corners on everything. Create a subtle CSS-only camo pattern that can be used as a background on select elements. Add a subtle scan-line overlay effect.

3. Create the Supabase database schema. Write SQL migration files that create ALL tables defined in the app design document (profiles, weight_logs, body_measurements, food_preferences, workout_programmes, workouts, workout_exercises, exercise_library, runs, meal_plans, meal_logs, favourite_meals, water_logs, ranks, streaks, badges, personal_records, daily_challenges). Include proper foreign keys, indexes, and Row Level Security policies so users can only access their own data.

4. Set up Supabase auth with email and password. Create a sign-up page, sign-in page, and auth callback route. Protect all app routes behind authentication. Create Supabase clients for both browser and server use.

5. Build the app shell and navigation. Create the bottom tab bar with 5 tabs: COMMAND (home), MISSIONS, RATIONS, INTEL, RECORD. Use Lucide icons. Active tab shows in --green-primary, inactive in --text-secondary. Tab bar fixed to the bottom with safe area padding. Create a shared header component with the BARRAX title and notification bell icon. Smooth page transitions between tabs.

6. Build the dashboard (COMMAND) page with placeholder cards for: rank strip with XP progress bar, streak counter, today's mission card, today's rations card, quick stats row, and daily challenge card. Wire up real data where the database supports it. Use skeleton loading states while data loads.

7. Build the onboarding flow. A multi-step form that collects: name, age, height, weight (optional), fitness level (beginner/intermediate/advanced), goals (multi-select), default workout time, food preferences setup (NO GO / MAYBE / APPROVED lists with an add/remove interface for each), calorie target, notification preferences, and unit preferences (metric/imperial). Save all data to the profiles and food_preferences tables. On completion, redirect to the dashboard.

8. Build the settings page (BASE OPERATIONS). Allow editing all profile data, food preferences, notification settings, and unit preferences. Include a data export option and a reset progress option with confirmation.

9. Set up PWA configuration. Create manifest.json with app name BARRAX, dark theme colour (#0C0C0C), standalone display mode. Set up a basic service worker for asset caching. Create placeholder app icons (dark square with green "B" text).

10. Create reusable UI components: Button (primary, secondary, danger variants with sharp corners), Card (dark panel with 1px green-dark border and classification tag slot), ProgressBar (flat green fill, no rounded ends), Tag (uppercase monospace status labels), Toast (bottom-positioned notification), BottomSheet (slide-up modal), Skeleton (shimmer loading placeholder), Timer (countdown display).

---

## Phase 2 — Workouts

Build the full workout system:

1. Create the Gemini AI integration. Build a server-side API route at /api/generate-workout that sends prompts to Gemini and returns structured JSON workout data. The system prompt tells Gemini it is a military fitness instructor generating bodyweight-only workouts. The user prompt includes available time, target muscle group, current rank (difficulty scaling), recent workout history, and fitness level. Always request JSON-only responses. Validate the response structure before returning. Handle errors gracefully with retries.

2. Build weekly programme generation. An API route or function that generates a full week of 5-6 workouts plus rest days. Balances across workout types (upper push, upper pull, lower body, core, cardio, HIIT, full body, recovery). Store the programme in the workout_programmes table. Display as a weekly calendar view on the MISSIONS page showing each day with workout type, duration, and status.

3. Build the workout player. A full-screen workout execution mode with: mission briefing screen (workout overview, exercise list, XP available, DEPLOY button), exercise cards showing name, description, form cue, rep target or timer, current set indicator, rest timer between exercises with skip option, progress bar, total elapsed time, COMPLETE EXERCISE button, skip option, pause button. After completion: mission debrief screen showing duration, exercises done, XP earned, personal records broken, rank progress.

4. Build workout logging. Save completed workout data to the workouts and workout_exercises tables. Track sets completed, reps completed, duration, and exercises skipped.

5. Seed the exercise library. Use the data from BARRAX-exercise-seed-data.md to populate the exercise_library table with 50+ bodyweight exercises. Build a browsable exercise library page organised by muscle group with search, filter by difficulty, and favourite toggle. Exercises locked behind rank requirements show as [LOCKED] with the rank needed.

6. Implement warm-up and cool-down. Every workout auto-includes a warm-up (3-5 min dynamic stretches) and cool-down (3-5 min static stretches) appropriate to the workout type. These are generated by AI as part of the workout or selected from a preset pool.

7. Wire up XP awards on workout completion. Use the XP values from the design document. After awarding XP, check for rank-up.

8. Update the dashboard. Today's mission card now shows real data from the current programme. Tapping it navigates to the workout or opens the player.

---

## Phase 3 — Run Tracker

Build the GPS run tracking system:

1. Build the run tracker screen. Uses navigator.geolocation.watchPosition with enableHighAccuracy: true. Live display showing: elapsed time (large), distance covered, current pace (min/km or min/mile based on user preference), average pace, current speed. A live Leaflet map showing the route being drawn in real-time (green line on dark map tiles from CartoDB dark_all or similar free dark tiles). Controls: PAUSE, RESUME, STOP buttons. Lock mode to prevent accidental taps.

2. Implement GPS data processing. Store GPS points as an array of {lat, lng, timestamp, altitude, speed} during the run. Calculate distance using the Haversine formula. Calculate pace from distance and time. Auto-log splits every km or mile. Calculate elevation gain if altitude data is available. Handle GPS signal loss gracefully.

3. Build the post-run summary screen. Total distance, time, average pace, best pace, split table, full route displayed on map, elevation profile if available, XP earned, comparison to previous runs, personal records flagged.

4. Build run history. All runs logged in the runs table with full data. List view with date, distance, time, pace. Tap to see full summary with route map. Filter by date range and distance.

5. Build run stats. Total distance (all time, this month, this week), total runs, average pace, best pace, longest run, pace trend chart, distance trend chart.

6. Integrate runs into the workout system. Running can be a mission type in the weekly programme. AI can generate run programmes (intervals, tempo, distance goals). Runs earn XP scaled by distance.

7. Update the INTEL page with run stats section.

---

## Phase 4 — Nutrition

Build the full nutrition system:

1. Build the food preference management system. Three lists: NO GO (never include these foods), MAYBE (occasionally suggest, clearly marked), APPROVED (preferred foods, use these). Each list has an add/remove interface. Pre-populate APPROVED with common staple foods during onboarding. This data is stored in the food_preferences table.

2. Create the meal plan AI generation. Build a server-side API route at /api/generate-meals that sends prompts to Gemini. The system prompt tells Gemini it is a nutritionist for a fussy eater in the UK. The user prompt includes the NO GO list as hard exclusions, APPROVED list as preferred ingredients, MAYBE list (max 1 try-meal per week, clearly marked), calorie target, number of people eating, saved favourites to potentially include, dietary requirements. Response is 7 days of meals (breakfast, lunch, dinner, snack) with ingredients, method, prep time, calories, and macros. All in JSON.

3. Build the RATIONS page. Weekly meal plan displayed as daily cards. Each day expandable to show all meals. Each meal card shows: name, calorie estimate, prep time, status tag. Tap to expand to full recipe view with ingredients checklist and step-by-step method. Mark as eaten checkbox. SWAP button to regenerate one meal. SAVE button to add to favourites. REPORT button to flag a NO GO food the AI missed.

4. Build the shopping list. Auto-generated from the active week's meal plan. Consolidated quantities. Organised by supermarket section (produce, meat, dairy, pantry, frozen). Checkboxes to tick off items. Persists across sessions.

5. Build the favourites system. Save meals to a favourites list. Browse and search saved meals. Option to tell AI to include favourites in future plans.

6. Build the water intake tracker. Daily target (default 2L, configurable). Quick-tap buttons for +250ml, +500ml, custom. Visual fill indicator. Resets daily. Data stored in water_logs.

7. Update the dashboard. Today's rations card shows real meal plan data. Quick stats show meals followed today.

---

## Phase 5 — Gamification

Build the full progression and motivation system:

1. Implement the complete XP system. All XP sources from the design document: workout completion (30/50/80 by duration), run completion (40-100 by distance), full day meal plan followed (20), weight logged (10), streak bonus (+5 per day, max +50), daily challenge (50-150), weekly programme completion (200), try a MAYBE food and approve (25), water goal hit (10), new personal record (50). Create a central XP utility that handles awarding and logging.

2. Build the rank system. 12 ranks from Recruit (0 XP) to General (33,000 XP). After every XP award, check if user crossed a rank threshold. Build the rank-up screen: full-screen takeover with dark camo background, rank insignia, rank title in large uppercase stencil text, PROMOTED header, what unlocks at this rank, total XP. No confetti, no emojis. Militarily restrained but impactful. Rank displayed on dashboard and RECORD page.

3. Build the badge and achievement system. All badges from the design document: streak badges (7/14/30/60/90/180/365 days), workout badges (1/10/50/100/250/500), run badges (first run, 5K, 10K, 50km total, 100km, 500km), nutrition badges, rank badges, special badges (Dawn Patrol, Night Ops, Iron Will, Double Time, Clean Sweep). Check badge conditions after relevant actions. Award with a toast notification. Display all badges on the RECORD page (earned shown in full colour, unearned shown greyed with requirements).

4. Build streak tracking. A day is active if a workout is completed OR the meal plan is followed. Current streak and longest streak stored. Streak freeze: 1 free rest day per week that does not break the streak. Streak milestones at 7, 14, 30, 60, 90 days with bonus XP. Visual streak display on dashboard.

5. Build daily challenges. Generate a daily bonus challenge (via AI or from a preset pool). Examples: 100 push-ups throughout the day, walk 5000 steps, 10 minute plank cumulative. Accept or decline. Completing earns bonus XP. Show on dashboard.

6. Build personal records tracking. Automatically detect new PRs: longest streak, most XP in a week, fastest 1km, fastest 5km, longest run, most push-ups, longest plank, longest workout, heaviest workout. Display on INTEL > Records page. Toast notification when a PR is broken.

7. Build the self-competition system. Weekly score vs last week vs best week. Monthly performance rating (S/A/B/C/D). Personal best board. Ghost runs (compare current run to previous on same route).

8. Build the weekly report card. Generated every Sunday. Missions completed, total workout time, XP earned, meals followed, streak status, rank progress, new badges earned, new PRs.

9. Update all dashboard cards with real gamification data.

---

## Phase 6 — Notifications and Polish

Final phase:

1. Set up Web Push notifications. Register the service worker for push. Request notification permission (during onboarding or first visit). Generate and store push subscription in Supabase. Implement all notification types from the design document: morning mission reminder, missed workout nudge, streak at risk warning, water reminder, weekly programme ready, rank-up, personal record. All notification text is military-toned, no emojis.

2. Build notification preferences. Per-type toggles in settings. Configurable reminder times. Quiet hours setting.

3. Implement progressive overload. AI tracks reps and times over weeks and progressively increases difficulty. More reps, harder variations, shorter rest, longer duration. Track progression per exercise.

4. Implement ghost runs. When running a route similar to a previous run, show previous pace as a ghost to beat.

5. Optimise performance. Lazy load heavy components (maps, charts). Optimise images and assets. Minimise bundle size. Ensure smooth 60fps animations.

6. Refine offline support. Current week's workout programme and meal plan always cached. Workout player works fully offline. Queue completed data and sync when online. Shopping list works offline.

7. Build the PWA install prompt. Custom in-app banner on first visit. Dismissible. Re-shows after 3 visits if not installed.

8. Final UI polish. Review every screen for consistency with the military green/camo design system. Sharp corners everywhere. No emojis anywhere. Proper skeleton loading on all data screens. Smooth transitions. Proper safe area handling. Test on mobile viewport widths.

9. Progressive overload tracking visualisation in the INTEL section showing how exercises have progressed over time.

---

## General Rules for All Phases

- All code must be well-commented and beginner-friendly. The developer is self-taught.
- Use TypeScript throughout.
- Mobile-first. This is a phone PWA.
- No emojis in the UI, notifications, or anywhere else.
- No border-radius. No gradients. Sharp corners and flat colours only.
- All AI calls go through server-side API routes. Never expose API keys to the client.
- All AI responses must be validated before rendering. Never trust raw AI output.
- Handle all errors gracefully with user-facing messages.
- Use skeleton loading states, not spinners.
- Every technology must be free tier. Zero ongoing cost.
- Test as you go. Make sure each phase works before moving to the next.
