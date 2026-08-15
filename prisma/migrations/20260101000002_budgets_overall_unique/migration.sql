-- Postgres treats NULL as distinct from every other NULL in a UNIQUE constraint,
-- so the (family_id, category_id, month) constraint from the init migration does
-- NOT stop a family from ending up with two "overall" budgets (category_id IS NULL)
-- for the same month. A partial unique index closes that gap.
create unique index "budgets_family_id_month_overall_uidx"
  on "budgets" ("family_id", "month")
  where "category_id" is null;
