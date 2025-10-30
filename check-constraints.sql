-- Check what constraints exist on the jobs table
-- Run this in Supabase SQL Editor

-- Show all constraints
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'c' THEN 'CHECK'
        ELSE con.contype::text
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'jobs'
AND nsp.nspname = 'public'
ORDER BY con.contype, con.conname;

-- Show all indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'jobs'
AND schemaname = 'public'
ORDER BY indexname;
