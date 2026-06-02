-- Widen credit_history.type CHECK to include every type the app actually inserts.
-- The original constraint only allowed ('purchase','debit','bonus','refund'), but the
-- code also writes 'subscription' (create-asaas-subscription), 'subscription_renewal'
-- (asaas-webhook) and 'admin_bonus'/'admin_debit' (adminService.updateUserCredits).
-- Those inserts were silently REJECTED by the CHECK — the credit_history row was lost
-- while the profile balance update (a separate statement) still succeeded. That's why
-- admin credit adjustments moved the balance but left no/inconsistent history.

ALTER TABLE public.credit_history DROP CONSTRAINT IF EXISTS credit_history_type_check;

ALTER TABLE public.credit_history ADD CONSTRAINT credit_history_type_check
  CHECK (type IN (
    'purchase',
    'debit',
    'bonus',
    'refund',
    'subscription',
    'subscription_renewal',
    'admin_bonus',
    'admin_debit'
  ));
