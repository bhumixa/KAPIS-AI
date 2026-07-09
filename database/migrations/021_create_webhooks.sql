-- ==============================================================================
-- Kapis AI Platform - Sprint 8: Webhooks table
-- Apply manually (never auto-run):
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/021_create_webhooks.sql
--
-- Outbound webhook subscriptions - mirrors `Webhook` field-for-field.
-- `events` is `text[]`, the same choice `018_create_message_templates.sql`
-- (Sprint 7) made for `variables`: a flat list with no per-item attributes.
-- Unlike that column, these values *are* a closed vocabulary
-- (`WEBHOOK_EVENTS` in the Angular model), but Postgres has no clean way to
-- CHECK-constrain individual array elements against an enum without a
-- trigger or a domain type - enforcing that is left to the application
-- layer for now, the same trust boundary the mock `IntegrationService`
-- already applies via its `WebhookEvent` union type.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.webhooks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  name         varchar(200) NOT NULL,
  url          text NOT NULL,
  secret       text NOT NULL,
  events       text[] NOT NULL DEFAULT '{}',

  status       varchar(10) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'inactive')),

  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_status ON clinic.webhooks (status);

-- Reuses clinic.set_updated_at(), defined in 002_create_doctors.sql.
DROP TRIGGER IF EXISTS trg_webhooks_set_updated_at ON clinic.webhooks;
CREATE TRIGGER trg_webhooks_set_updated_at
  BEFORE UPDATE ON clinic.webhooks
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();
