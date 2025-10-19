# Environment Setup for Opener Studio

## Current Setup

Your Supabase client now uses environment variables with fallbacks to production values.

## For Local Development

### Option 1: Use Production Supabase (Recommended for LinkedIn Testing)

Since you're testing LinkedIn OAuth, it's easier to use the production Supabase instance that's already configured.

**No additional setup needed** - your app will use the production Supabase by default.

### Option 2: Use Local Supabase (For Database Development)

If you want to use local Supabase for database development:

1. **Create `.env.local` file**:

```bash
# Local Development Environment
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key-here
```

2. **Start local Supabase**:

```bash
npx supabase start
```

3. **Get local credentials**:

```bash
npx supabase status
```

## For Production Deployment (Vercel)

### Dev Environment (dev-opener-studio.vercel.app)

Set these environment variables in Vercel:

```
VITE_SUPABASE_URL=https://exbzektbhynykyschqso.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Ynpla3RiaHlueWt5c2NocXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1Mzk2NDksImV4cCI6MjA2NDExNTY0OX0.yN9C7USIeelvdfTs_sBq9zwxWOb8JOzdPLwxrPU9s3c
```

### Production Environment (prod-opener-studio.vercel.app)

Set these environment variables in Vercel:

```
VITE_SUPABASE_URL=https://your-prod-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key-here
```

## LinkedIn OAuth Configuration

### Required Redirect URLs in LinkedIn Developer Portal

Add these URLs to your LinkedIn app's OAuth settings:

1. **Local Development**: `http://localhost:8081/auth/callback`
2. **Dev Deployment**: `https://dev-opener-studio.vercel.app/auth/callback`
3. **Production**: `https://prod-opener-studio.vercel.app/auth/callback`

### Supabase Auth Configuration

Make sure your Supabase project has LinkedIn OAuth configured:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable LinkedIn provider
3. Add your LinkedIn Client ID and Client Secret
4. Set redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`

## Switching Between Environments

### For Local Development

- **Default**: Uses production Supabase (good for LinkedIn testing)
- **With .env.local**: Uses local Supabase (good for database development)

### For Vercel Deployment

- **Dev branch**: Automatically uses dev environment variables
- **Prod branch**: Automatically uses production environment variables

## Testing LinkedIn OAuth

### Local Testing

1. Make sure `http://localhost:8081/auth/callback` is added to LinkedIn app
2. Run `npm run dev`
3. Test LinkedIn sign-in/sign-up buttons

### Production Testing

1. Make sure production redirect URLs are added to LinkedIn app
2. Deploy to Vercel
3. Test on live URLs

## Troubleshooting

### "requested path is invalid" Error

- Check that your Supabase URL is correct
- Verify environment variables are set properly
- Ensure LinkedIn redirect URLs match your deployment URL

### LinkedIn OAuth Not Working

- Verify redirect URLs in LinkedIn Developer Portal
- Check Supabase Auth provider configuration
- Ensure Client ID and Secret are correct in Supabase
