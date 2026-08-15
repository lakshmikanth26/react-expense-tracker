-- Hand-written (like 0002/0003/0006/0007): `prisma migrate diff` can't introspect this
-- database because family_members has a cross-schema FK into auth.users.

-- CreateEnum
CREATE TYPE "insurance_type" AS ENUM ('health', 'life', 'vehicle', 'home', 'other');

-- CreateTable
CREATE TABLE "insurances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "family_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "insurance_type" NOT NULL DEFAULT 'other',
    "provider" TEXT,
    "policy_number" TEXT,
    "premium_amount" DECIMAL(14,2),
    "renewal_date" DATE,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "insurance_id" UUID NOT NULL,
    "family_id" UUID NOT NULL,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "file_size" INTEGER,
    "content_type" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insurance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "insurances_family_id_idx" ON "insurances"("family_id");

-- CreateIndex
CREATE INDEX "insurance_documents_insurance_id_idx" ON "insurance_documents"("insurance_id");

-- AddForeignKey
ALTER TABLE "insurances" ADD CONSTRAINT "insurances_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_documents" ADD CONSTRAINT "insurance_documents_insurance_id_fkey" FOREIGN KEY ("insurance_id") REFERENCES "insurances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_documents" ADD CONSTRAINT "insurance_documents_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =========================================================================
-- RLS: family-scoped, same current_family_ids() pattern as every other table.
-- =========================================================================
alter table "insurances" enable row level security;
alter table "insurance_documents" enable row level security;

create policy "insurances_select" on "insurances" for select using (family_id in (select public.current_family_ids()));
create policy "insurances_insert" on "insurances" for insert with check (family_id in (select public.current_family_ids()));
create policy "insurances_update" on "insurances" for update using (family_id in (select public.current_family_ids()));
create policy "insurances_delete" on "insurances" for delete using (family_id in (select public.current_family_ids()));

create policy "insurance_documents_select" on "insurance_documents" for select using (family_id in (select public.current_family_ids()));
create policy "insurance_documents_insert" on "insurance_documents" for insert with check (family_id in (select public.current_family_ids()));
create policy "insurance_documents_delete" on "insurance_documents" for delete using (family_id in (select public.current_family_ids()));

grant select, insert, update, delete on "insurances" to authenticated;
grant select, insert, delete on "insurance_documents" to authenticated;

-- Trigger to keep updated_at current, matching every other mutable table (see 0002).
create trigger set_updated_at before update on "insurances" for each row execute function public.set_updated_at();

-- =========================================================================
-- Storage: a private bucket for uploaded policy documents. Objects are keyed
-- "{family_id}/{insurance_id}/{filename}" so storage.foldername(name)[1] gives
-- the owning family — RLS on storage.objects reuses that same family scoping
-- instead of duplicating a document's metadata into the storage layer.
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('insurance-documents', 'insurance-documents', false)
on conflict (id) do nothing;

create policy "insurance_documents_storage_select" on storage.objects for select
  using (bucket_id = 'insurance-documents' and (storage.foldername(name))[1]::uuid in (select public.current_family_ids()));

create policy "insurance_documents_storage_insert" on storage.objects for insert
  with check (bucket_id = 'insurance-documents' and (storage.foldername(name))[1]::uuid in (select public.current_family_ids()));

create policy "insurance_documents_storage_delete" on storage.objects for delete
  using (bucket_id = 'insurance-documents' and (storage.foldername(name))[1]::uuid in (select public.current_family_ids()));
