# BARRAX — Setup Checklist

Things you need to do manually before or during the build. Claude Code handles the code, but these are the accounts and config steps only you can do.

---

## 1. Supabase Project

- Go to https://supabase.com and sign in
- Create a new project called "barrax"
- Choose the free tier and your nearest region (London)
- Once created, go to Settings > API and copy:
  - Project URL (this is NEXT_PUBLIC_SUPABASE_URL)
  - anon public key (this is NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - service_role secret key (this is SUPABASE_SERVICE_ROLE_KEY)

## 2. Google Gemini API Key

- Go to https://aistudio.google.com/apikey
- Sign in with your Google account
- Click "Create API Key"
- Copy the key (this is GEMINI_API_KEY)
- Free tier gives you 15 requests per minute which is more than enough

## 3. Vercel Project

- Go to https://vercel.com
- Connect your GitHub repo when ready to deploy
- Add all environment variables in the Vercel dashboard under Settings > Environment Variables

## 4. VAPID Keys (for push notifications)

- Claude Code can generate these for you during Phase 6
- Or generate them at https://vapidkeys.com
- You need a public key (NEXT_PUBLIC_VAPID_PUBLIC_KEY) and private key (VAPID_PRIVATE_KEY)
- These are not needed until Phase 6 so no rush

## 5. Environment Variables (.env.local)

Create a file called .env.local in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
```

The last two (VAPID) can be left blank until Phase 6.

## 6. GitHub Repo

- Create a new repo called "barrax" on GitHub
- Claude Code will initialise the project and you can push to this repo
- Connect it to Vercel for auto-deployments

---

## Build Order

1. Set up Supabase project and get your keys
2. Get your Gemini API key
3. Create the GitHub repo
4. Open Claude Code and paste the prompt from BARRAX-claude-code-prompt.md
5. When Claude Code asks, provide your environment variable values
6. Claude Code will work through all 6 phases automatically
