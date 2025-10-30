# Supabase Setup Guide - Career Lever AI

## 🎯 Goal
Set up Supabase to store and serve 10,000+ jobs for the Career Lever AI application with:
- ✅ Bulk job downloads on Tuesdays & Saturdays
- ✅ Fast search and retrieval
- ✅ Proper authentication and security
- ✅ Cost-effective storage
- ✅ Production-ready deployment

---

## 📋 Information Needed from Supabase Dashboard

### Step 1: Get Your Project Credentials

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (or create a new one)
3. **Navigate to**: Settings → API

You need to collect these 3 values:

#### 1. Project URL
- **Location**: Settings → API → Project URL
- **Format**: `https://xxxxxxxxxxxxx.supabase.co`
- **Example**: `https://abcdefghijklmno.supabase.co`
- **Environment Variable**: `NEXT_PUBLIC_SUPABASE_URL`

#### 2. Anon/Public Key
- **Location**: Settings → API → Project API keys → `anon` `public`
- **Format**: Long string starting with `eyJ...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Environment Variable**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Usage**: Client-side queries (safe to expose)

#### 3. Service Role Key (SECRET!)
- **Location**: Settings → API → Project API keys → `service_role` `secret`
- **Format**: Long string starting with `eyJ...`
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Environment Variable**: `SUPABASE_SERVICE_ROLE_KEY`
- **Usage**: Server-side bulk operations (NEVER expose to client!)
- **⚠️ CRITICAL**: This key bypasses Row Level Security - keep it secret!

---

## 🗄️ Database Schema Setup

### Step 2: Create the Jobs Table

1. **Go to**: Table Editor → Create a new table
2. **Table name**: `jobs`
3. **Enable Row Level Security (RLS)**: YES (we'll configure policies next)

#### Table Schema

Run this SQL in the SQL Editor (Database → SQL Editor → New Query):

```sql
-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Job identification
  external_id TEXT NOT NULL,
  source TEXT NOT NULL,
  
  -- Basic info
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  
  -- URLs
  url TEXT,
  apply_link TEXT,
  
  -- Location details
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Canada',
  
  -- Salary
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_type TEXT,
  salary_currency TEXT DEFAULT 'CAD',
  
  -- Job details
  job_type TEXT,
  remote_type TEXT,
  experience_level TEXT,
  
  -- Keywords and search
  keywords TEXT[] DEFAULT '{}',
  
  -- Dates
  posted_date TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  raw_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicates
  UNIQUE(external_id, source)
);

-- Create indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_jobs_title ON public.jobs USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs USING gin(to_tsvector('english', company));
CREATE INDEX IF NOT EXISTS idx_jobs_description ON public.jobs USING gin(to_tsvector('english', description));
CREATE INDEX IF NOT EXISTS idx_jobs_location ON public.jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.jobs(city);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON public.jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON public.jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_external_id_source ON public.jobs(external_id, source);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_search ON public.jobs(location, expires_at, source);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON public.jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.jobs IS 'Job listings scraped from various sources';
```

---

## 🔒 Security Setup (Row Level Security)

### Step 3: Configure RLS Policies

Run this SQL to set up proper access control:

```sql
-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to non-expired jobs
CREATE POLICY "Allow public read access to active jobs"
ON public.jobs
FOR SELECT
TO public
USING (expires_at > NOW());

-- Policy 2: Allow service role full access (for bulk operations)
CREATE POLICY "Allow service role full access"
ON public.jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Allow authenticated users to read all jobs
CREATE POLICY "Allow authenticated users to read all jobs"
ON public.jobs
FOR SELECT
TO authenticated
USING (true);
```

---

## 🔧 Environment Variables Setup

### Step 4: Configure Your .env.local File

Create or update `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk5OTk5OTk5LCJleHAiOjIwMTU1NzU5OTl9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ubyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTk5OTk5OTksImV4cCI6MjAxNTU3NTk5OX0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Adzuna API (for job scraping)
ADZUNA_APP_ID=b0300aa2
ADZUNA_API_KEY=19f3a3c651c39d4073b1a66516d38432
```

**⚠️ IMPORTANT**: 
- Replace the `xxxxxxxxxxxxx` with your actual values
- Never commit `.env.local` to Git
- Add `.env.local` to your `.gitignore`

---

## ✅ Verification Steps

### Step 5: Test Your Connection

Run this command to verify everything is set up correctly:

```bash
npx tsx test-supabase-connection.ts
```

**Expected Output:**
```
🔍 Testing Supabase Connection...

1️⃣ Testing public client...
✅ Public client connected!

2️⃣ Testing admin client...
✅ Admin client connected!

3️⃣ Getting job statistics...
📊 Job Stats:
   Total jobs: 1249
   Active jobs: 1249
   Expired jobs: 0
   By source: { adzuna: 931, jsearch: 287, google-jobs: 31 }

4️⃣ Testing insert capability...
✅ Insert test passed!
🧹 Test job cleaned up

✅ All tests passed! Supabase is ready to use! 🎉
```

If you see errors, check:
- ❌ `TypeError: fetch failed` → Wrong URL or network issue
- ❌ `Invalid API key` → Wrong anon/service key
- ❌ `relation "jobs" does not exist` → Table not created
- ❌ `new row violates row-level security` → RLS policies not set up

---

## 📊 Bulk Download Setup

### Step 6: Schedule Mass Downloads

For Tuesday & Saturday downloads:

```bash
# Test incremental download (one location at a time)
npx tsx download-incremental.ts

# Full mass download (all locations)
npx tsx download-edmonton-jobs.ts
```

**Expected Results:**
- Edmonton: ~1,000 jobs
- Surrounding cities: ~500-1,000 each
- **Total: 5,000-10,000 jobs per run**

---

## 🚀 Production Deployment

### Step 7: Vercel Environment Variables

When deploying to Vercel:

1. Go to: Project Settings → Environment Variables
2. Add these variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Set scope: Production, Preview, Development
4. Redeploy

---

## 📈 Monitoring & Maintenance

### Database Health Checks

```sql
-- Check total jobs
SELECT COUNT(*) FROM jobs;

-- Check active jobs
SELECT COUNT(*) FROM jobs WHERE expires_at > NOW();

-- Check jobs by source
SELECT source, COUNT(*) FROM jobs GROUP BY source;

-- Check recent jobs
SELECT title, company, scraped_at FROM jobs ORDER BY scraped_at DESC LIMIT 10;

-- Check expired jobs (should be cleaned up)
SELECT COUNT(*) FROM jobs WHERE expires_at < NOW();
```

### Cleanup Old Jobs

Run this weekly to remove expired jobs:

```sql
DELETE FROM jobs WHERE expires_at < NOW() - INTERVAL '7 days';
```

---

## 🎯 Success Criteria

Your Supabase setup is complete when:

- ✅ Connection test passes
- ✅ Can query jobs from the app
- ✅ Can insert jobs via bulk download
- ✅ Search returns relevant results
- ✅ 1,000+ jobs in database
- ✅ No RLS errors
- ✅ Fast query performance (<100ms)

---

## 🆘 Troubleshooting

### Common Issues

**1. "TypeError: fetch failed"**
- Check if Supabase URL is correct
- Verify you're not behind a firewall blocking Supabase
- Test connection: `curl https://your-project.supabase.co`

**2. "Invalid API key"**
- Verify you copied the full key (they're very long!)
- Check for extra spaces or line breaks
- Make sure you're using the right key (anon vs service_role)

**3. "Row-level security policy violation"**
- Run the RLS policy SQL again
- Check if RLS is enabled: `ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;`
- Verify service_role key is set correctly

**4. "Duplicate key value violates unique constraint"**
- This is normal! It means the job already exists
- The upsert will update the existing job

**5. Slow queries**
- Check if indexes are created: `\d jobs` in SQL editor
- Run `ANALYZE jobs;` to update statistics
- Consider adding more specific indexes

---

## 📞 Next Steps

After completing this guide:

1. ✅ Share your Supabase dashboard info
2. ✅ Run connection test
3. ✅ Verify table schema
4. ✅ Test bulk download
5. ✅ Deploy to production

---

## 🔑 Checklist

Before sharing your dashboard info, verify you have:

- [ ] Project URL
- [ ] Anon/Public key
- [ ] Service Role key
- [ ] Table `jobs` exists
- [ ] RLS policies configured
- [ ] Indexes created
- [ ] Environment variables set
- [ ] Connection test passes

---

**Ready to proceed?** Share your Supabase dashboard info and I'll verify everything is configured correctly!
