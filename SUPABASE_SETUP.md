# Supabase Setup Guide

This guide will help you connect Supabase to your application for testing database reads/writes and file storage.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Create a Project**: Create a new project in your Supabase dashboard

## Step 1: Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (for client-side)
   - **service_role key** (for server-side, keep this secret!)

## Step 2: Configure Environment Variables

Create or update your `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Existing Database (Prisma)
DATABASE_URL=your_postgresql_connection_string
```

**Important**: 
- `NEXT_PUBLIC_*` variables are exposed to the browser
- `SUPABASE_SERVICE_ROLE_KEY` should NEVER be exposed to the client
- You can use the same PostgreSQL database for both Prisma and Supabase, or use Supabase's managed database

## Step 3: Set Up Supabase Database Schema

You have two options:

### Option A: Use Supabase's Managed Database (Recommended for Testing)

1. In Supabase dashboard, go to **SQL Editor**
2. Run your Prisma migrations or create tables manually
3. Or use Supabase's **Table Editor** to create tables

### Option B: Connect Supabase to Your Existing PostgreSQL Database

1. In Supabase dashboard, go to **Settings** → **Database**
2. Use the **Connection String** from your existing PostgreSQL database
3. Update `DATABASE_URL` in `.env.local` to point to Supabase's connection string

## Step 4: Set Up Supabase Storage (for File Uploads)

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket called `catch-images` (or `uploads`)
3. Set bucket to **Public** if you want public access
4. Or set up **Row Level Security (RLS)** policies for authenticated users

### Storage Bucket Setup:

```sql
-- Create bucket (run in SQL Editor)
INSERT INTO storage.buckets (id, name, public)
VALUES ('catch-images', 'catch-images', true);

-- Set up RLS policy (optional - for authenticated uploads only)
CREATE POLICY "Users can upload their own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'catch-images');

CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'catch-images');
```

## Step 5: Update Upload Route to Use Supabase Storage

The upload route (`app/api/upload/route.ts`) can be updated to use Supabase Storage instead of local file system:

```typescript
import { createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const userId = request.headers.get('x-user-id');
  
  // ... file validation ...
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `catches/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('catch-images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('catch-images')
    .getPublicUrl(filePath);
  
  return NextResponse.json({ url: publicUrl });
}
```

## Step 6: Testing Database Reads/Writes

### Using Supabase Client (Client-Side):

```typescript
import { createSupabaseClient } from '@/lib/supabase';

const supabase = createSupabaseClient();

// Read data
const { data, error } = await supabase
  .from('catch')
  .select('*')
  .eq('userId', userId)
  .order('createdAt', { ascending: false });

// Write data
const { data, error } = await supabase
  .from('catch')
  .insert({
    userId: userId,
    description: 'My catch',
    imageUrl: 'https://...',
  });
```

### Using Supabase Client (Server-Side):

```typescript
import { createServerSupabaseClient } from '@/lib/supabase';

const supabase = createServerSupabaseClient();

// Same API as client-side, but with service role permissions
```

## Step 7: Migrating from Prisma to Supabase (Optional)

You can use both Prisma and Supabase together:

- **Prisma**: For type-safe queries and migrations
- **Supabase**: For real-time subscriptions, storage, and auth

Or migrate fully to Supabase by:
1. Using Supabase's TypeScript types generator
2. Replacing Prisma queries with Supabase queries
3. Using Supabase's migration system

## Email OTP sign-in (required for LoginForm)

Poymal uses **one** email flow for both new and existing users (`signInWithOtp`).

In the Supabase dashboard:

1. **Authentication → Providers → Email**
   - Enable Email provider
   - **Turn OFF “Confirm email”** for passwordless OTP  
     (the 6-digit code already proves the address; leaving Confirm on sends “Confirm your email address” with a link instead of a code)

2. **Authentication → Email Templates → Magic Link**
   - Replace link-only copy with an OTP code using `{{ .Token }}`, for example:

```html
<h2>Your Poymal sign-in code</h2>
<p>Enter this code in the app:</p>
<p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>This code expires shortly. If you didn’t request it, you can ignore this email.</p>
```

3. Do **not** rely on the “Confirm signup” template for this flow.

After that, “Email me a code” works the same for first-time and returning users.

## Testing Checklist

- [ ] Environment variables configured
- [ ] Supabase client can connect
- [ ] Database tables created/migrated
- [ ] Storage bucket created
- [ ] File uploads working
- [ ] Database reads working
- [ ] Database writes working
- [ ] RLS policies configured (if using auth)

## Troubleshooting

1. **"Missing Supabase environment variables"**
   - Check `.env.local` file exists
   - Restart Next.js dev server after adding env vars
   - Ensure variable names start with `NEXT_PUBLIC_` for client-side

2. **Storage upload fails**
   - Check bucket exists and is public (or RLS policies allow)
   - Verify file size limits (default 50MB)
   - Check CORS settings in Supabase dashboard

3. **Database connection issues**
   - Verify connection string format
   - Check if database is accessible from your IP
   - Review Supabase logs in dashboard

## Next Steps

- Set up Row Level Security (RLS) for production
- Configure Supabase Auth if needed
- Set up real-time subscriptions for live updates
- Configure image transformations/CDN

