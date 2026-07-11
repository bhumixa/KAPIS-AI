-- ==============================================================================
-- Kapis AI Platform - Sprint 23: Analytics & Reporting export history table
-- Apply manually, after 045_create_google_calendar_sync.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/046_create_report_exports.sql
--
-- Append-only history of every report export ExportService generates (CSV/
-- Excel/PDF) - one row per POST /api/analytics/export call, whether the
-- export itself succeeded or failed, same "append-only step log" shape
-- clinic.workflow_runtime_logs/clinic.google_calendar_sync_events use. Feeds
-- the Exports page's history table. No updated_at/trigger - a row is never
-- edited after it's written, same reasoning clinic.messages/
-- clinic.whatsapp_events use. filters is a free-form snapshot of the
-- AnalyticsQueryDto the export was generated with (date range, doctor,
-- patient, status, department) so a later "re-run this export" feature
-- could reconstruct the same request without a dedicated filters table.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS clinic.report_exports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  report_type    varchar(30) NOT NULL CHECK (report_type IN (
                    'appointments', 'doctors', 'patients', 'conversations',
                    'automation', 'ai', 'whatsapp', 'google-calendar', 'knowledge-base'
                  )),
  format         varchar(10) NOT NULL CHECK (format IN ('csv', 'excel', 'pdf')),
  filters        jsonb NOT NULL DEFAULT '{}',
  status         varchar(15) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'failed')),
  file_name      varchar(255) NOT NULL DEFAULT '',
  row_count      integer NOT NULL DEFAULT 0,
  requested_by   varchar(200) NOT NULL DEFAULT '',
  error_message  text,

  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Exports page lists history newest-first, optionally filtered by report type.
CREATE INDEX IF NOT EXISTS idx_report_exports_created_at
  ON clinic.report_exports (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_report_exports_report_type_created_at
  ON clinic.report_exports (report_type, created_at DESC);
