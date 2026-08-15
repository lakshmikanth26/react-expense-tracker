-- Hand-written (like 0002/0003): `prisma migrate diff` can't introspect this database
-- because family_members has a cross-schema FK into auth.users, which Prisma refuses
-- to diff against unless auth.users is fully modeled here (it deliberately isn't — see
-- schema.prisma). Written to match exactly what Prisma would generate for this shape.

-- AlterTable
ALTER TABLE "family_members" ADD COLUMN "telegram_chat_id" BIGINT;

-- CreateTable
CREATE TABLE "telegram_link_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_link_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "family_members_telegram_chat_id_key" ON "family_members"("telegram_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "telegram_link_codes_code_key" ON "telegram_link_codes"("code");

-- CreateIndex
CREATE INDEX "telegram_link_codes_family_id_idx" ON "telegram_link_codes"("family_id");

-- AddForeignKey
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telegram_link_codes" ADD CONSTRAINT "telegram_link_codes_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "family_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- RLS: members may generate/view/revoke their OWN family's link codes (via
-- current_family_ids()); the Edge Function talks to this table exclusively
-- with the service-role key, which bypasses RLS entirely.
-- =========================================================================
alter table "telegram_link_codes" enable row level security;

create policy "telegram_link_codes_select" on "telegram_link_codes"
  for select using (family_id in (select public.current_family_ids()));

create policy "telegram_link_codes_insert" on "telegram_link_codes"
  for insert with check (family_id in (select public.current_family_ids()));

create policy "telegram_link_codes_delete" on "telegram_link_codes"
  for delete using (family_id in (select public.current_family_ids()));

grant select, insert, delete on "telegram_link_codes" to authenticated;

-- family_members already has RLS enabled with family-scoped update policies from
-- migration 0002 (see 20260101000001_rls_and_defaults); telegram_chat_id is just a new
-- column on that existing table, so no policy changes are needed there.
