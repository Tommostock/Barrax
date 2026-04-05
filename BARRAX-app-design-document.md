# BARRAX — App Design Document

## 1. Overview

BARRAX is a military-themed personal fitness and nutrition PWA. No gym, no equipment. Bodyweight workouts, outdoor running, and structured meal plans — all AI-generated. Gamified with military ranks, XP, streaks, challenges, and competitive elements to drive consistency.

Single user. Built as a full-stack PWA with a modern 2026 app experience.

**Golden rule:** 100% free. No paid APIs, no subscriptions, no premium tiers. Every feature is free forever.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 14+ (App Router) | React Server Components where appropriate |
| Database | Supabase | Auth, Postgres, Row Level Security, real-time |
| Hosting | Vercel | Free tier |
| AI | Google Gemini (free tier) | Via Google AI Studio API key |
| Maps | Leaflet + OpenStreetMap | Free, no API key required |
| PWA | next-pwa or Serwist | Service worker, offline, install prompt |
| Notifications | Web Push API + Supabase Edge Functions | Free push notifications |
| GPS | Browser Geolocation API + watchPosition | For run tracking |
| Charts | Recharts | Free, React-native charting |
| Icons | Lucide React | Minimal line icons |

---

## 3. Design System

### 3.1 Colour Palette — Military Green and Camo

No gradients. Flat, solid colours. Tactical and utilitarian.

| Token | Hex | Usage |
|-------|-----|-------|
| --bg-primary | #0C0C0C | App background |
| --bg-panel | #141A14 | Cards, panels, containers |
| --bg-panel-alt | #1A221A | Alternate panels, hover states |
| --bg-input | #0F150F | Input fields, text areas |
| --green-primary | #4A6B3A | Primary accent — buttons, active states, progress bars |
| --green-light | #6B8F5A | Secondary accent — highlights, links |
| --green-dark | #2D4220 | Borders, dividers, subtle accents |
| --green-muted | #3A4F2E | Inactive states, disabled elements |
| --camo-1 | #4A6B3A | Camo pattern colour 1 |
| --camo-2 | #2D4220 | Camo pattern colour 2 |
| --camo-3 | #5C7A4A | Camo pattern colour 3 |
| --camo-4 | #1A2A14 | Camo pattern colour 4 |
| --khaki | #8B7D5E | Rank badges, earned achievements |
| --sand | #C4B090 | Headings, important text |
| --text-primary | #D4D4C8 | Body text |
| --text-secondary | #7A7A6E | Muted text, labels, timestamps |
| --danger | #8B3232 | Missed workouts, warnings, streak breaks |
| --success | #4A6B3A | Completed states (same as primary green) |
| --xp-gold | #B8A04A | XP indicators, rank-up highlights |

### 3.2 Typography

- **Headings:** Barlow Condensed (Google Fonts), uppercase, bold, letter-spacing 0.05em
- **Body:** JetBrains Mono (Google Fonts) for stats/data, Barlow for readable body text
- **Labels/Tags:** JetBrains Mono, uppercase, small, muted colour
- **Numbers/Stats:** JetBrains Mono, large weight for impact

### 3.3 UI Principles

- **No border-radius anywhere.** All corners sharp/square.
- **No gradients.** Flat solid fills only.
- **No emojis.** Anywhere. Ever.
- **Thin 1px borders** in --green-dark for panel edges.
- **Camo texture** as a subtle CSS background pattern on select surfaces (hero areas, rank cards). Implemented as a repeating CSS pattern, not an image.
- **Panel style:** Dark card with 1px green-dark border, slight drop shadow optional.
- **Classification labels:** Top of cards show status tags like [ACTIVE], [COMPLETE], [LOCKED], [REST DAY] in uppercase monospace.
- **Stencil aesthetic:** Headings should feel spray-painted or stencilled — achieved through letter-spacing, uppercase, and condensed font weight.
- **Micro-interactions:** Subtle scale on tap (0.98), quick fade transitions. No bouncing or elastic animations.
- **Scan-line overlay (optional):** A very subtle repeating 1px line pattern at low opacity over the background for CRT/tactical screen feel.

### 3.4 Modern 2026 UX Patterns

- Bottom sheet modals (slide up from bottom, not centred pop-ups)
- Pull-to-refresh on data screens
- Skeleton loading states (no spinners — shimmer placeholders in panel shapes)
- Haptic feedback on key actions (navigator.vibrate where supported)
- Swipe gestures on cards (swipe to dismiss, swipe to mark complete)
- Floating action button for quick-start workout
- Toast notifications (bottom of screen, auto-dismiss)
- Smooth page transitions (no hard page reloads)
- Full-bleed edge-to-edge mobile layout
- Safe area handling for notched devices
- Large touch targets (minimum 44x44px)
- Dark mode only (no light mode toggle — it is always dark)

---

## 4. Navigation

### Bottom Tab Bar (5 tabs)

Fixed bottom nav. Active tab indicated with --green-primary fill. Inactive tabs in --text-secondary.

| Tab | Label | Icon | Screen |
|-----|-------|------|--------|
| 1 | COMMAND | Crosshair/Target | Dashboard |
| 2 | MISSIONS | Swords/Dumbbell | Workouts |
| 3 | RATIONS | Utensils | Nutrition |
| 4 | INTEL | BarChart | Stats & Progress |
| 5 | RECORD | Shield | Rank & Profile |

---

## 5. Feature Specification

### 5.1 COMMAND (Dashboard)

The daily command centre. Everything you need at a glance.

**Layout (top to bottom):**

1. **Header bar:** "BARRAX" title left-aligned. Notification bell icon right. Current date below in muted text.

2. **Rank strip:** Full-width bar showing current rank insignia, rank title, and XP progress bar. e.g. "[CORPORAL] 1,240 / 2,000 XP" with a solid green progress bar.

3. **Streak counter:** Prominent streak display. Number of consecutive days. Visual chevrons or tally marks that grow with the streak. Streak freeze indicator if available.

4. **Today's Mission card:** Card showing today's workout summary. Type (HIIT / Strength / Run / Recovery), estimated duration, muscle focus. Large "BEGIN MISSION" button. Status: [PENDING] / [IN PROGRESS] / [COMPLETE].

5. **Today's Rations card:** Compact view of breakfast / lunch / dinner / snack for today. Tap to expand any meal. Checkbox next to each to mark as eaten.

6. **Quick stats row:** 3-4 stat boxes in a row. This week's completed missions. Current weight (if logged). Weekly XP earned. Meals followed today.

7. **Daily challenge card (optional):** A bonus challenge for extra XP. e.g. "Drop and give me 50 push-ups today" or "Walk 5,000 steps." Accept/decline.

8. **Upcoming missions:** Next 2-3 scheduled workouts in compact list form.

### 5.2 MISSIONS (Workouts)

#### 5.2.1 Weekly Programme

- Every Sunday (or on demand), AI generates a weekly programme of 5-6 workouts plus 1-2 rest days.
- User sets available time per day at the start of each week (or uses defaults from settings).
- AI balances across: upper body push, upper body pull, lower body, core, cardio, full body, HIIT, active recovery.
- Programme displayed as a weekly calendar view with each day showing workout type, duration, and status.

#### 5.2.2 Workout Types (No Equipment)

**Strength — Bodyweight:** Push-ups (standard, wide, diamond, decline, pike, archer), Squats (standard, jump, pistol progression, sumo, wall sit), Lunges (forward, reverse, walking, lateral, jump), Planks (standard, side, up-down, shoulder taps), Burpees, mountain climbers, bear crawls, Dips (using a garden bench or step), Core work (leg raises, bicycle crunches, flutter kicks, V-ups, dead bugs), Glute bridges, hip thrusts, calf raises, Superman, reverse snow angels, prone Y-raises (back work).

**Cardio — Outdoor:** Running (easy pace, tempo, intervals, sprints, fartlek), Walking (brisk walk, incline if available), Hill sprints (if hills nearby), Stair runs (if stairs available), Shadow boxing rounds.

**HIIT Circuits:** Timed rounds (30s work / 15s rest, 40s/20s, Tabata 20s/10s), AMRAP (as many rounds as possible in X minutes), EMOM (every minute on the minute), Ladder workouts (1-2-3-4-5-4-3-2-1 reps).

**Active Recovery:** Stretching routines, Mobility flows, Light walking, Foam rolling guidance, Yoga-style flows.

**Challenge Missions (bonus XP):** "100 push-up challenge" (throughout the day), "1 mile as fast as you can", "10 minute plank challenge" (cumulative), "200 squats" (throughout the day), Weekly boss challenge (harder, more XP).

#### 5.2.3 Workout Player

Full-screen workout execution mode.

**Before workout:** Mission briefing screen: workout name, type, estimated duration, exercises listed, total XP available. "DEPLOY" button to begin.

**During workout:** Current exercise name (large text), Form cue / description (1-2 lines, collapsible), Rep counter OR countdown timer (depending on exercise type), Current set indicator (e.g. "Set 2 of 3"), Rest timer between exercises (auto-starts, shows countdown, "SKIP REST" button), Progress bar showing exercises completed vs remaining, Running clock showing total workout elapsed time, "COMPLETE EXERCISE" large tappable button, "SKIP" option (with XP penalty note), "PAUSE" button (pauses all timers).

**After workout:** Mission debrief screen. Summary: duration, exercises completed, estimated calories burned. XP earned (with breakdown: base + streak bonus + challenge bonus). Personal records broken (if any). Rank progress update. "DISMISS" to return to dashboard.

#### 5.2.4 Exercise Library

A browsable library of all exercises in the system. Organised by muscle group: chest, back, shoulders, arms, core, legs, full body, cardio. Each exercise has: name, description, form cues, difficulty level (1-5), muscles targeted. Filter by difficulty, muscle group, time required. Search function. Exercises unlock as rank increases (harder variations at higher ranks). User can favourite exercises to influence AI generation.

#### 5.2.5 Warm-Up and Cool-Down

Every workout auto-includes a warm-up (3-5 min) and cool-down (3-5 min). Warm-up: dynamic stretches, light cardio, joint mobilisation appropriate to the workout type. Cool-down: static stretches targeting muscles used, breathing exercises. Can be skipped but shown as recommended.

#### 5.2.6 Progressive Overload (Without Weights)

AI tracks reps/times and progressively increases difficulty over weeks. Progression methods: more reps, more sets, slower tempo, harder variations, shorter rest, longer duration. Example: Week 1 standard push-ups > Week 4 diamond push-ups > Week 8 decline push-ups. Progression is per-exercise, tracked in the database.

### 5.3 RUN TRACKER (Sub-feature of MISSIONS)

A Nike Run Club style GPS run tracker built into the app.

#### 5.3.1 Tracking Features

Uses the browser Geolocation API (watchPosition) with high accuracy enabled.

**Live tracking data (displayed during run):** Current pace (min/km or min/mile — user preference in settings), Average pace, Distance covered (km or miles), Elapsed time (running clock), Current speed (km/h or mph), Split times (auto-logged every km or mile), Elevation gain/loss (if altitude data available from GPS), Live route drawn on a Leaflet/OpenStreetMap map.

**Run screen layout:** Top: elapsed time (large). Middle: distance and current pace (large numbers). Bottom: map showing route in real-time (green line on dark map tiles). Controls: PAUSE / RESUME / STOP buttons. Lock screen mode: simplified display, prevents accidental taps.

#### 5.3.2 Post-Run Summary

Total distance, time, average pace, best pace. Split table (per km/mile with pace for each). Route map (full route displayed). Elevation profile (if data available). XP earned. Comparison to previous runs (same distance or same route). Personal records flagged (fastest km, longest run, etc.).

#### 5.3.3 Run History

All runs logged with date, distance, time, pace, route. Filter by date range, distance range. Route replay on map. Total running stats: all-time distance, total runs, average pace, best pace.

#### 5.3.4 Run Programmes

AI can generate running programmes: Couch to 5K style progressive plans, Interval training runs, Tempo runs, Long slow distance runs, Sprint sessions.

### 5.4 RATIONS (Nutrition)

#### 5.4.1 Fussy Eater System

**This is critical.** The user is a fussy eater. The app must handle this gracefully.

**Food Preferences Setup (in onboarding and settings):**

1. **"NO GO" list:** Foods the user absolutely will not eat. These are never included in any meal plan. User adds items freely. AI is instructed to never use these ingredients.

2. **"MAYBE" list:** Foods the user is willing to try or is warming up to. AI can occasionally suggest these in clearly marked meals. These meals show a [TRY SOMETHING NEW] tag so the user knows. If the user eats it and likes it, they can move it to the "approved" list. If not, they can move it to "NO GO."

3. **"APPROVED" list:** Foods the user is confirmed happy to eat. Pre-populated with common foods during onboarding. User can add freely. AI prioritises these.

4. **Dietary requirements:** Allergies (serious — these override everything), vegetarian days (if any), other restrictions.

**How AI uses these lists:** The NO GO list is injected into every Gemini prompt as a hard exclusion. The APPROVED list is sent as preferred ingredients. The MAYBE list triggers one "try" meal per week maximum, clearly labelled. The AI is prompted to keep meals simple, not fancy. Familiar comfort foods made healthier.

#### 5.4.2 Weekly Meal Plan

AI generates 7 days of meals: breakfast, lunch, dinner, 1 snack. Each meal includes: name, full ingredients list (with quantities), step-by-step method, approximate calories, approximate protein/carbs/fat. Meals should be: budget-friendly, family-suitable (can feed the household), quick to prepare (30 min max unless slow cooker), UK-centric ingredients (available in Tesco/Asda/Aldi). Plan generated on demand or auto-generated weekly.

#### 5.4.3 Meal Cards

Each meal is a card showing: meal name, calorie estimate, prep time, [status tag]. Tap to expand: full recipe view with ingredients checklist and method steps. Mark as eaten (checkbox). "SWAP" button: regenerate just this meal slot with a new suggestion. "SAVE" button: add to favourites. "REPORT" button: flag as containing a NO GO food (in case AI makes a mistake).

#### 5.4.4 Shopping List

Auto-generated from the active week's meal plan. Consolidated (if 3 meals need chicken breast, show total quantity). Organised by supermarket section: produce, meat, dairy, pantry, frozen. Checkbox to tick off items while shopping. Persists across sessions (saved to Supabase).

#### 5.4.5 Favourites

Saved meals library. AI can be told to "include my favourites this week" — it will weave them in. Meals can be removed from favourites at any time.

#### 5.4.6 Water Intake Tracker

Simple daily water tracker. Target: user sets daily goal (default 2 litres / 8 glasses). Quick-tap buttons: +250ml glass, +500ml bottle, custom amount. Visual fill indicator (like a canteen filling up). Resets daily. Reminder notification if behind target by midday.

### 5.5 INTEL (Stats and Progress)

#### 5.5.1 Body Tracking

**Weight log:** Optional. User logs weight whenever they want. Chart shows trend over time (line chart). Never nags to log. **Body measurements:** Optional. Chest, waist, hips, arms, thighs. Logged periodically. Chart per measurement. **BMI display:** Calculated from height/weight. Shown as reference only, not emphasised.

#### 5.5.2 Workout Stats

**Calendar heat map:** Month view, each day coloured by activity. Dark green = workout completed. Light green = rest day. Red = missed day. Grey = future. **Weekly report card:** Missions completed, total workout time, XP earned, meals followed, streak status. Generated every Sunday. **All-time totals:** Total workouts, total minutes trained, total distance run, total reps (estimated), total XP. **By category:** Breakdown by workout type (strength / cardio / HIIT / recovery).

#### 5.5.3 Personal Records

Tracked automatically. Categories: longest streak, most XP in a week, fastest 1km, fastest 5km, longest run, most push-ups in one session, longest plank hold, heaviest workout (most exercises), longest workout. Displayed as a records board with date achieved. New PR notification and celebration when broken.

#### 5.5.4 Running Stats

Total distance (all time, this month, this week), Total runs, Average pace (all time, recent trend), Best pace, Longest run, Pace trend chart, Distance trend chart.

#### 5.5.5 Nutrition Stats

Meals followed vs skipped (percentage), Favourite meals (most saved, most repeated), Foods tried from MAYBE list (with liked/disliked outcome), Water intake trend.

### 5.6 SERVICE RECORD (Rank and Profile)

#### 5.6.1 Rank System

12 ranks with military progression:

| Rank | Title | XP Required | Unlocks |
|------|-------|-------------|---------|
| 1 | Recruit | 0 | Basic exercises, basic meals |
| 2 | Private | 200 | Challenge missions unlock |
| 3 | Lance Corporal | 500 | Intermediate exercise variations |
| 4 | Corporal | 1,000 | HIIT workout type unlocks |
| 5 | Sergeant | 2,000 | Run programmes unlock |
| 6 | Staff Sergeant | 3,500 | Advanced exercise variations |
| 7 | Warrant Officer | 5,500 | Custom workout builder |
| 8 | Lieutenant | 8,000 | Meal plan customisation options |
| 9 | Captain | 12,000 | Elite exercise variations |
| 10 | Major | 17,000 | All features unlocked |
| 11 | Colonel | 24,000 | Prestige badge |
| 12 | General | 33,000 | Full prestige, all badges |

#### 5.6.2 XP System

| Action | XP |
|--------|-----|
| Complete workout (short, < 15 min) | 30 |
| Complete workout (medium, 15-30 min) | 50 |
| Complete workout (long, 30+ min) | 80 |
| Complete a run | 40-100 (scaled by distance) |
| Follow full day meal plan | 20 |
| Log weight | 10 |
| Daily streak bonus | +5 per consecutive day (max +50) |
| Complete daily challenge | 50-150 |
| Complete full weekly programme | 200 bonus |
| Try a MAYBE food and approve it | 25 |
| Hit water intake goal | 10 |
| New personal record | 50 |

#### 5.6.3 Badges and Achievements

Unlockable badges displayed on the service record. Military patch style.

**Streak badges:** 7 days, 14 days, 30 days, 60 days, 90 days, 180 days, 365 days. **Workout badges:** First workout, 10 workouts, 50, 100, 250, 500. **Run badges:** First run, 5K completed, 10K completed, 50km total, 100km total, 500km total. **Nutrition badges:** First week meal plan followed, 30 days tracked, tried 10 new foods. **Rank badges:** One for each rank achieved. **Special badges:** "Dawn patrol" (workout before 7am), "Night ops" (workout after 9pm), "Iron will" (worked out on a rest day), "Double time" (two workouts in one day), "Clean sweep" (perfect week — all workouts and meals).

#### 5.6.4 Rank-Up Screen

Full-screen takeover when user hits a new rank: Dark background with subtle camo pattern, New rank insignia centred (large), Rank title in large uppercase stencil text, "PROMOTED" header, Summary of what unlocks at this rank, Total XP and time served, Dismiss button. No confetti. No emojis. Keep it militarily restrained but impactful.

#### 5.6.5 Leaderboard (Self-Competition)

Since this is a solo app, the competition is against yourself: **Weekly score:** XP earned this week vs last week vs best week ever. **Monthly performance rating:** S / A / B / C / D based on percentage of missions completed, meals followed, and streak maintained. **Personal best board:** All your records in one view. **Ghost runs:** When doing a run you have done before (same rough route), show your previous pace as a "ghost" to beat.

### 5.7 Notifications

Using the Web Push API (via service worker).

**Notification types:** Morning mission reminder (configurable time, e.g. 7am): "Your mission is waiting, [Rank] [Name]. Deploy when ready." Missed workout nudge (evening, e.g. 7pm if not done): "Mission incomplete. You still have time." Streak at risk (if approaching midnight with no activity): "Your [X]-day streak is at risk. Don't break the chain." Water reminder (midday if behind target): "Hydration check. You are behind on water intake." Weekly programme ready: "New weekly programme generated. Report to MISSIONS." Rank-up: "Promotion. You have been promoted to [Rank]." Personal record broken: "New personal record. [Category]: [Value]."

**Settings:** User can enable/disable each notification type individually. Set quiet hours (e.g. no notifications between 10pm and 6am).

### 5.8 Onboarding Flow

First-time user setup. Clean, step-by-step screens.

1. **Welcome screen:** "Welcome to BARRAX. Your training begins now." Minimal, atmospheric.
2. **Profile:** Name, age, height, current weight (optional).
3. **Fitness level:** Beginner / Intermediate / Advanced (affects initial exercise difficulty).
4. **Goals:** What are you training for? (General fitness / Weight loss / Strength / Endurance / Mental health). Multi-select.
5. **Available time:** Default workout duration preference.
6. **Food preferences:** Set up NO GO list, review pre-populated APPROVED list, optionally add MAYBE items. Allergy flags.
7. **Calorie target:** AI suggests based on profile, user can adjust.
8. **Notifications:** Enable push notifications. Set preferred reminder times.
9. **Unit preferences:** Metric (km, kg) or Imperial (miles, lbs).
10. **Deploy:** "Report for duty" button. Generates first weekly programme and meal plan.

### 5.9 Settings — "BASE OPERATIONS"

Accessible from RECORD tab or header. Profile details (edit name, age, height, weight), Food preferences (manage NO GO / MAYBE / APPROVED lists), Calorie and macro targets, Workout preferences (default time, preferred types, fitness level), Unit preferences (metric/imperial, pace format), Notification settings (per-type toggles, quiet hours, reminder times), Run settings (auto-pause, GPS accuracy, voice cues), Data management (export data as JSON, clear all data, reset progress), About (version, credits).

---

## 6. AI Prompt Strategy

### 6.1 Workout Generation

**System prompt:**
```
You are a military fitness instructor. Generate bodyweight workout programmes that require ZERO gym equipment. All exercises must be doable in a garden, park, or indoors at home. Respond ONLY in valid JSON with no additional text, markdown, or code fences.
```

**User prompt includes:** Available time for this workout, Target muscle group or workout type, Current rank (maps to difficulty level 1-12), Recent workout history (last 3 workouts to avoid repetition), Any flagged soreness areas to avoid, Fitness level (beginner/intermediate/advanced).

**Expected response format:**
```json
{
  "name": "Operation Ironclad",
  "type": "strength",
  "duration_minutes": 25,
  "warmup": [],
  "exercises": [
    {
      "name": "Push-ups",
      "description": "Standard push-up with full range of motion",
      "form_cue": "Keep core tight, lower chest to floor",
      "sets": 3,
      "reps": 12,
      "rest_seconds": 45,
      "difficulty": 2,
      "muscles": ["chest", "triceps", "shoulders"]
    }
  ],
  "cooldown": [],
  "xp_value": 50
}
```

### 6.2 Meal Plan Generation

**System prompt:**
```
You are a nutritionist creating simple, healthy meal plans for a fussy eater in the UK. Meals must be budget-friendly, quick to prepare (30 minutes max), and use ingredients available in standard UK supermarkets. Respond ONLY in valid JSON with no additional text, markdown, or code fences.
```

**User prompt includes:** NO GO food list (hard exclusion), APPROVED food list (preferred ingredients), MAYBE food list (include max 1 "try" meal per week, clearly marked), Calorie target per day, Number of people eating (for portion sizing), Any saved favourites to potentially include, Dietary requirements/allergies.

### 6.3 Run Programme Generation

**System prompt:**
```
You are a running coach creating progressive running programmes for beginners to intermediate runners. All runs are outdoors. Respond ONLY in valid JSON with no additional text, markdown, or code fences.
```

---

## 7. Data Model (Supabase)

### Tables

**profiles** — id (uuid, PK, references auth.users), name (text), age (int), height_cm (decimal), fitness_level (enum: beginner/intermediate/advanced), goals (text[]), default_workout_minutes (int), calorie_target (int), unit_preference (enum: metric/imperial), notification_settings (jsonb), created_at, updated_at (timestamptz).

**weight_logs** — id (uuid, PK), user_id (uuid, FK), weight_kg (decimal), logged_at (timestamptz).

**body_measurements** — id (uuid, PK), user_id (uuid, FK), chest_cm, waist_cm, hips_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm (decimal, all nullable), logged_at (timestamptz).

**food_preferences** — id (uuid, PK), user_id (uuid, FK), food_name (text), category (enum: no_go/maybe/approved), created_at (timestamptz).

**workout_programmes** — id (uuid, PK), user_id (uuid, FK), week_start (date), programme_data (jsonb), created_at (timestamptz).

**workouts** — id (uuid, PK), user_id (uuid, FK), programme_id (uuid, FK, nullable), workout_data (jsonb), status (enum: pending/in_progress/complete/skipped), scheduled_date (date), started_at, completed_at (timestamptz, nullable), duration_seconds (int, nullable), xp_earned (int, default 0).

**workout_exercises** — id (uuid, PK), workout_id (uuid, FK), exercise_name (text), sets_completed (int), reps_completed (int, nullable), duration_seconds (int, nullable), skipped (boolean, default false), order_index (int).

**exercise_library** — id (uuid, PK), name (text), description (text), form_cue (text), muscles (text[]), difficulty (int, 1-5), category (enum: strength/cardio/hiit/recovery/core), min_rank (int, default 1), is_favourite (boolean, default false), user_id (uuid, FK).

**runs** — id (uuid, PK), user_id (uuid, FK), workout_id (uuid, FK, nullable), route_data (jsonb), distance_metres (decimal), duration_seconds (int), avg_pace_seconds_per_km (int), best_pace_seconds_per_km (int), elevation_gain_metres (decimal, nullable), splits (jsonb), started_at, completed_at (timestamptz), xp_earned (int).

**meal_plans** — id (uuid, PK), user_id (uuid, FK), week_start (date), plan_data (jsonb), shopping_list (jsonb), created_at (timestamptz).

**meal_logs** — id (uuid, PK), user_id (uuid, FK), meal_plan_id (uuid, FK), day (date), meal_type (enum: breakfast/lunch/dinner/snack), eaten (boolean, default false), logged_at (timestamptz).

**favourite_meals** — id (uuid, PK), user_id (uuid, FK), meal_data (jsonb), created_at (timestamptz).

**water_logs** — id (uuid, PK), user_id (uuid, FK), amount_ml (int), logged_at (timestamptz).

**ranks** — id (uuid, PK), user_id (uuid, FK), current_rank (int, default 1), total_xp (int, default 0), rank_history (jsonb).

**streaks** — id (uuid, PK), user_id (uuid, FK), current_streak (int, default 0), longest_streak (int, default 0), last_active_date (date), freeze_used_this_week (boolean, default false), streak_history (jsonb).

**badges** — id (uuid, PK), user_id (uuid, FK), badge_key (text), badge_name (text), badge_description (text), earned_at (timestamptz).

**personal_records** — id (uuid, PK), user_id (uuid, FK), category (text), value (decimal), unit (text), achieved_at (timestamptz).

**daily_challenges** — id (uuid, PK), user_id (uuid, FK), challenge_data (jsonb), date (date), accepted (boolean, default false), completed (boolean, default false), xp_value (int).

---

## 8. PWA Configuration

- **App name:** BARRAX
- **Short name:** BARRAX
- **Theme colour:** #0C0C0C
- **Background colour:** #0C0C0C
- **Display:** standalone
- **Orientation:** portrait
- **Start URL:** /
- **Scope:** /
- **Icons:** 192x192 and 512x512 PNG. Military shield with "B" monogram in green on dark background.
- **Offline strategy:** Cache-first for static assets. Network-first for API calls with offline fallback showing cached data. Current week's workout programme and meal plan always cached for offline access.
- **Install prompt:** Custom in-app install banner on first visit. Dismissible. Shows again after 3 visits if not installed.
