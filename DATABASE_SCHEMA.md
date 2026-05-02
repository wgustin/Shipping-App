# Database Schema and Security Formalization

This document outlines the database schema, constraints, and Row Level Security (RLS) policies implemented to make the application production-safe.

## Migrations Added

A new migration file `supabase/migrations/20260317000000_initial_schema.sql` was added to formalize the database schema. It includes:

1.  **Tables & Constraints**:
    *   `profiles`: Stores user information (`first_name`, `last_name`, `email`, `balance`, `role`). Linked to `auth.users` via a foreign key with `ON DELETE CASCADE`.
    *   `addresses`: Stores user address book entries. Linked to `auth.users` via a foreign key.
    *   `quoted_rates`: Stores shipping quotes. Includes a unique constraint on `secure_rate_id` and a foreign key to `auth.users`.
    *   `shipments`: Stores shipment records. Linked to `auth.users` via a foreign key.
    *   **Foreign Keys**: Added a foreign key from `profiles.default_from_address_id` to `addresses.id` with `ON DELETE SET NULL`.
    *   **Not-Null Constraints**: Enforced on critical fields like `user_id`, `street1`, `city`, `state`, `zip`, `country`, `amount`, `carrier`, `status`, etc.

2.  **Indexes**:
    *   Added indexes on `user_id` for all tables to speed up user-specific queries.
    *   Added indexes on `quoted_rates.secure_rate_id` and `quoted_rates.expires_at` for fast rate lookups and cleanup.
    *   Added indexes on `shipments.status`, `shipments.tracking_number`, and `shipments.created_at`.
    *   Added a specialized JSONB index on `shipments((package_details->>'lastProcessedEventId'))` to optimize webhook idempotency checks.

3.  **Triggers**:
    *   Added a trigger `on_auth_user_created` to automatically insert a record into the `profiles` table whenever a new user signs up in `auth.users`.
    *   Included a backfill query to create profiles for any existing users.

## Row Level Security (RLS) Policies

RLS has been enabled on all user-facing tables (`profiles`, `addresses`, `quoted_rates`, `shipments`) to ensure data isolation.

*   **Profiles**: Users can only `SELECT` and `UPDATE` their own profile record (`auth.uid() = id`).
*   **Addresses**: Users can `SELECT`, `INSERT`, `UPDATE`, and `DELETE` only their own addresses (`auth.uid() = user_id`).
*   **Quoted Rates**: Users can `SELECT`, `INSERT`, and `UPDATE` only their own quoted rates (`auth.uid() = user_id`).
*   **Shipments**: Users can `SELECT`, `INSERT`, and `UPDATE` only their own shipments (`auth.uid() = user_id`).

*Note: The backend server uses the Supabase Service Role key, which automatically bypasses RLS. This ensures that webhooks, cron jobs, and fulfillment logic continue to work without modification.*

## Code Changes

*   **`src/services/apiService.ts`**: Updated the `saveAddressToBook` function to omit the `id` field when inserting a new address. This prevents issues where the client might accidentally send an undefined or conflicting `id`, allowing the database to safely generate a new UUID using `uuid_generate_v4()`.

## Required Environment Variables

No new environment variables are required. The application continues to use the existing Supabase URL and keys.

## How to Apply Migrations

### In Development (Local Supabase)
If you are running Supabase locally using the CLI:
```bash
supabase db reset
```
Or to just apply new migrations:
```bash
supabase db push
```

### In Production
If you have linked your Supabase project to your repository, migrations will be applied automatically upon deployment. Alternatively, you can apply them manually via the Supabase CLI:
```bash
supabase db push --linked
```
Or by copying the SQL from the migration file and running it in the Supabase SQL Editor.
