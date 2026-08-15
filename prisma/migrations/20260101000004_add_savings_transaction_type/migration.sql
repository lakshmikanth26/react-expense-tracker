-- Adds a first-class "savings" transaction/category type, alongside expense/income/transfer.
-- Postgres cannot use a newly-added enum value in the same transaction it was added in, so
-- this migration ONLY adds the enum values; everything that references 'savings' (the
-- balance trigger, the default-categories RPC) lives in the next migration.
ALTER TYPE "transaction_type" ADD VALUE 'savings';
ALTER TYPE "category_type" ADD VALUE 'savings';
