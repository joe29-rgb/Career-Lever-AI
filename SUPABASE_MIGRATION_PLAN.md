# Supabase Migration Plan

## Why Supabase?

### MongoDB Atlas Free Tier Limits
- **Storage**: 512 MB (we need ~200 MB for Edmonton alone)
- **Connections**: 500 concurrent
- **Cost**: $0/month (free tier) → $60/month (M10)

### Supabase Free Tier Benefits
- **Storage**: 500 MB database + 1 GB file storage
- **Bandwidth**: 2 GB/month
- **API Requests**: Unlimited
- **Cost**: $0/month forever!
- **Bonus**: Built-in Auth, Realtime, Storage

## Architecture Comparison

### Current (MongoDB)
```
Bulk Download → MongoDB Atlas → User Search
                  (512 MB limit)
```

### Proposed (Supabase)
```
Bulk Download → Supabase PostgreSQL → User Search
                  (500 MB database)
                  (Full-text search built-in!)
```

## Migration Steps

### Phase 1: Setup Supabase (30 minutes)
1. Create Supabase account (free)
2. Create new project
3. Get connection string
4. Install Supabase client: `npm install @supabase/supabase-js`

### Phase 2: Create Schema (15 minutes)
```sql
-- Jobs table
CREATE TABLE global_jobs_cache (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  source TEXT NOT NULL,
  keywords TEXT[],
  posted_date TIMESTAMP,
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- Full-text search
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED
);

-- Indexes for fast search
CREATE INDEX idx_jobs_search ON global_jobs_cache USING GIN(search_vector);
CREATE INDEX idx_jobs_location ON global_jobs_cache(location);
CREATE INDEX idx_jobs_source ON global_jobs_cache(source);
CREATE INDEX idx_jobs_expires ON global_jobs_cache(expires_at);

-- Auto-delete expired jobs
CREATE OR REPLACE FUNCTION delete_expired_jobs()
RETURNS void AS $$
BEGIN
  DELETE FROM global_jobs_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Run daily
SELECT cron.schedule('delete-expired-jobs', '0 0 * * *', 'SELECT delete_expired_jobs()');
```

### Phase 3: Update Code (1 hour)

#### Install Dependencies
```bash
npm install @supabase/supabase-js
npm install pg  # PostgreSQL client
```

#### Create Supabase Client
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

#### Update Bulk Download
```typescript
// Replace MongoDB insert with Supabase
const { data, error } = await supabase
  .from('global_jobs_cache')
  .upsert(jobs, { onConflict: 'id' })
```

#### Update User Search
```typescript
// Use PostgreSQL full-text search
const { data, error } = await supabase
  .from('global_jobs_cache')
  .select('*')
  .textSearch('search_vector', keywords.join(' & '))
  .ilike('location', `%${location}%`)
  .limit(50)
```

### Phase 4: Test & Deploy (30 minutes)
1. Test bulk download → Supabase
2. Test user search from Supabase
3. Verify performance (should be faster!)
4. Update environment variables
5. Deploy to Vercel

## Performance Comparison

### MongoDB
- **Insert**: 100-200ms per batch
- **Search**: 50-100ms
- **Full-text search**: Requires aggregation pipeline

### Supabase (PostgreSQL)
- **Insert**: 50-100ms per batch (faster!)
- **Search**: 20-50ms (2x faster!)
- **Full-text search**: Built-in with GIN indexes

## Cost Comparison (6 months)

### MongoDB Atlas
- Free tier: 512 MB (not enough)
- M10 tier: $60/month × 6 = **$360**

### Supabase
- Free tier: 500 MB (enough for Edmonton)
- Pro tier: $25/month (if we need more)
- 6 months: **$0** (free tier) or **$150** (pro)

**Savings**: $210-360 over 6 months!

## Migration Checklist

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Run SQL schema
- [ ] Install dependencies
- [ ] Create Supabase client
- [ ] Update bulk download code
- [ ] Update user search code
- [ ] Update environment variables
- [ ] Test locally
- [ ] Deploy to Vercel
- [ ] Monitor performance
- [ ] Deprecate MongoDB

## Rollback Plan

If Supabase doesn't work:
1. Keep MongoDB connection active
2. Dual-write to both databases
3. Compare performance
4. Switch back if needed

## Timeline

- **Today**: Setup Supabase + Schema (45 min)
- **Tomorrow**: Update code + Test (2 hours)
- **Day 3**: Deploy + Monitor (1 hour)

**Total**: 4 hours to migrate!

## Next Steps

1. **Immediate**: Test pagination (should get 600-900 jobs)
2. **This week**: Migrate to Supabase
3. **Next week**: Add more cities (Calgary, Vancouver)

## Resources

- Supabase Docs: https://supabase.com/docs
- PostgreSQL Full-Text Search: https://www.postgresql.org/docs/current/textsearch.html
- Supabase Free Tier: https://supabase.com/pricing
