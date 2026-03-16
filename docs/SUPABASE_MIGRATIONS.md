# Supabase Migration Workflow

This project treats `supabase/migrations` as the only source of truth for
database schema changes.

## Prerequisites

- Supabase CLI (commands below use `npx supabase ...`).
- Docker Desktop running (required for local `db reset`, `db push`, and `migration list --local`).

## Naming Rules

- Use `YYYYMMDDHHMMSS_description.sql`.
- Keep version prefixes unique.
- Keep one migration concern per file when possible.
- Do not place ad-hoc/manual scripts in `supabase/migrations`.

Legacy manual scripts have been moved to `supabase/manual_sql_archive`.

## Local Terminal Workflow

From repository root:

```bash
# Start local Supabase services
npm run db:start

# Create a new migration (pass a name after --)
npm run db:migration:new -- add_feature_x

# Rebuild local DB by replaying all migrations
npm run db:reset

# Show local/remote migration status
npm run db:status

# Apply pending migrations without reset
npm run db:push
```

## Recommended Loop

1. Create migration.
2. Edit SQL file.
3. Run `npm run db:reset`.
4. Verify app behavior and schema.
5. Commit migration file.

## Notes

- `supabase/config.toml` is committed so CLI commands work from terminal.
- Keep manual `psql` execution for emergency recovery only; default to Supabase CLI.
