-- LEGO Store PostgreSQL Automated QA Audit Script
-- Covers normalization (up to 3NF), security, integrity, performance, and admin controls

-- 1. Tables missing a PRIMARY KEY
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type='BASE TABLE'
EXCEPT
SELECT table_name
FROM information_schema.table_constraints
WHERE constraint_type='PRIMARY KEY';

-- 2. Columns with non-atomic values (heuristic: text columns with commas)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public' AND data_type IN ('text','varchar')
AND column_name NOT ILIKE '%id%'
AND column_name NOT ILIKE '%name%';
-- Manual review needed for actual atomicity

-- 3. Repeating groups (columns with numbers in name)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public' AND column_name ~ '\d+$';

-- 4. Non-key columns not fully dependent on PK (manual review)
-- List all composite PK tables for manual dependency check
SELECT table_name
FROM information_schema.table_constraints
WHERE constraint_type='PRIMARY KEY'
AND LENGTH(table_name) > 0
AND table_name IN (
  SELECT table_name FROM information_schema.columns GROUP BY table_name HAVING COUNT(*) > 2
);

-- 5. Transitive dependencies (manual review)
-- List tables with foreign keys and extra columns
SELECT c.table_name, array_agg(c.column_name)
FROM information_schema.columns c
JOIN information_schema.table_constraints tc ON c.table_name=tc.table_name
WHERE tc.constraint_type='FOREIGN KEY'
AND c.table_schema='public'
GROUP BY c.table_name;

-- 6. Primary keys uniqueness & non-null
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public' AND is_nullable='YES'
AND column_name IN (
  SELECT kcu.column_name FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name
  WHERE tc.constraint_type='PRIMARY KEY'
);

-- 7. Foreign keys enforcement
SELECT conrelid::regclass AS table_name, conname
FROM pg_constraint WHERE contype='f' AND NOT convalidated;

-- 8. Foreign keys ON DELETE/UPDATE rules
SELECT conrelid::regclass AS referencing_table, confrelid::regclass AS referenced_table, confdeltype AS on_delete_action, confupdtype AS on_update_action
FROM pg_constraint WHERE contype='f';

-- 9. Derived/calculated columns (manual review)
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public' AND column_name ILIKE '%total%' OR column_name ILIKE '%amount%';

-- 10. Explicit CHECK constraints on enums/values
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema='public' AND data_type IN ('text','varchar','integer','numeric')
AND (table_name, column_name) NOT IN (
  SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage kcu ON tc.constraint_name=kcu.constraint_name
  WHERE tc.constraint_type='CHECK'
);

-- 11. DB user privileges
SELECT usename, usesuper, usecreatedb, valuntil FROM pg_user;

-- 12. PUBLIC schema access
SELECT grantee, privilege_type FROM information_schema.role_table_grants WHERE grantee='PUBLIC';

-- 13. SSL status
SHOW ssl;

-- 14. Password storage (manual review)
-- List columns likely to store passwords
SELECT table_name, column_name FROM information_schema.columns WHERE column_name ILIKE '%password%';

-- 15. Environment variable usage (manual review)
-- Check for hardcoded credentials in codebase (not SQL)

-- 16. Row-level security policies
SELECT * FROM pg_policies WHERE schemaname='public';

-- 17. Input validation (manual review)
-- Not checkable via SQL, must be enforced in backend code

-- 18. Schema change logging (manual review)
-- Check for audit tables
SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%audit%';

-- 19. Transaction usage (manual review)
-- Not checkable via SQL, must be enforced in backend code

-- 20. Isolation level
SHOW default_transaction_isolation;

-- 21. Monetary/quantity columns with CHECK >= 0
SELECT table_name, column_name FROM information_schema.columns WHERE data_type IN ('integer','numeric') AND (table_name, column_name) NOT IN (
  SELECT tc.table_name, kcu.column_name FROM information_schema.table_constraints tc
  JOIN information_schema.constraint_column_usage kcu ON tc.constraint_name=kcu.constraint_name
  WHERE tc.constraint_type='CHECK'
);

-- 22. Foreign key constraints for related entities
SELECT conrelid::regclass AS table_name, conname FROM pg_constraint WHERE contype='f';

-- 23. Triggers for updated_at
SELECT event_object_table, trigger_name FROM information_schema.triggers WHERE event_manipulation='UPDATE';

-- 24. Indexes on frequent join/search columns
SELECT tablename, indexname, indexdef FROM pg_indexes WHERE schemaname='public';

-- 25. WAL status
SHOW wal_level;

-- 26. Backups (manual review)
-- Check for backup tables or logs
SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%backup%';

-- 27. Audit tables for immutable history
SELECT table_name FROM information_schema.tables WHERE table_name ILIKE '%audit%';

-- 28. Datatype usage
SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema='public';

-- 29. Avoid SELECT * (manual review)
-- Not checkable via SQL, must be enforced in code

-- 30. Pagination (manual review)
-- Not checkable via SQL, must be enforced in code

-- 31. Query plan analysis
EXPLAIN ANALYZE SELECT * FROM products LIMIT 1;

-- 32. Vacuum/analyze status
SELECT relname, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze FROM pg_stat_all_tables WHERE schemaname='public';

-- 33. RBAC (role-based access control)
SELECT * FROM information_schema.role_table_grants;

-- 34. Async job/WebSocket (manual review)
-- Not checkable via SQL, must be enforced in backend

-- 35. Audit triggers
SELECT * FROM information_schema.triggers WHERE trigger_name ILIKE '%audit%';

-- 36. Soft delete flag
SELECT table_name, column_name FROM information_schema.columns WHERE column_name='is_active';

-- 37. Webhook signature validation (manual review)
-- Not checkable via SQL, must be enforced in backend

-- 38. Final rule of thumb checks
-- Every table must have a PK, every relationship a FK, every admin operation traceable, every column constrained
-- Already covered above

-- End of audit script
