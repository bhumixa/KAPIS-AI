-- ==============================================================================
-- Kapis AI Platform - Sprint 19: RAG Engine full-text search
-- Apply manually, after 037_create_ai_provider_logs.sql:
--   docker compose exec -T postgres psql -U kapis_admin -d kapis_ai -f - \
--     < database/migrations/038_create_fulltext_indexes.sql
--
-- Adds a generated `search_vector tsvector` column (+ GIN index) to every
-- table the Sprint 19 brief names as a "Knowledge Source" - clinic.services,
-- clinic.faqs, clinic.policies, clinic.insurance_providers,
-- clinic.message_templates, clinic.doctor_profiles, and, for the two
-- sources that don't have their own table (Clinic Profile, Appointment
-- Settings), two separate generated columns on clinic.clinics - plus
-- clinic.ai_prompt_settings. No embeddings, no vector extension: PostgreSQL's
-- built-in tsvector/tsquery only, per the brief.
--
-- clinic.doctor_profiles was defined by 015_create_doctor_profiles.sql (Sprint
-- 7) but, per that migration's own status, may never have been applied in
-- every environment (no DoctorProfile Prisma model existed until this
-- sprint either). Its CREATE TABLE is repeated here, verbatim and
-- idempotent (`IF NOT EXISTS`), so this migration is self-contained and
-- clinic.rag_search() below can always assume the table exists, regardless
-- of whether 015 was ever run. Applying 015 first (or not at all) is safe
-- either way - this statement is a no-op once the table exists.
CREATE TABLE IF NOT EXISTS clinic.doctor_profiles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  doctor_id          uuid NOT NULL REFERENCES clinic.doctors (id) ON DELETE CASCADE,

  biography          text NOT NULL DEFAULT '',
  languages          text[] NOT NULL DEFAULT '{}',
  awards             text[] NOT NULL DEFAULT '{}',
  certifications     text[] NOT NULL DEFAULT '{}',
  publications       text[] NOT NULL DEFAULT '{}',
  interests          text[] NOT NULL DEFAULT '{}',
  video_url          text NOT NULL DEFAULT '',
  display_priority   smallint NOT NULL DEFAULT 0,

  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT doctor_profiles_doctor_id_unique UNIQUE (doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_doctor_profiles_display_priority
  ON clinic.doctor_profiles (display_priority);

DROP TRIGGER IF EXISTS trg_doctor_profiles_set_updated_at ON clinic.doctor_profiles;
CREATE TRIGGER trg_doctor_profiles_set_updated_at
  BEFORE UPDATE ON clinic.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION clinic.set_updated_at();

-- ------------------------------------------------------------------------------
-- Generated tsvector columns - weighted A (most important) to D (least), the
-- standard tsvector convention: what a patient would search by ranks highest.
-- ------------------------------------------------------------------------------

ALTER TABLE clinic.services
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) STORED;

ALTER TABLE clinic.faqs
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(question, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(answer, '')), 'C')
  ) STORED;

ALTER TABLE clinic.policies
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) STORED;

ALTER TABLE clinic.insurance_providers
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(contact_person, '')), 'C')
  ) STORED;

ALTER TABLE clinic.message_templates
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(subject, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'C')
  ) STORED;

-- Not a GENERATED column like the others above: array_to_string() (needed to
-- fold languages/awards/certifications/publications/interests into the
-- vector) is STABLE, not IMMUTABLE, on this Postgres build, and a generated
-- column's expression must be immutable - confirmed by hand against a scratch
-- schema while authoring this migration (`generation expression is not
-- immutable`). A BEFORE INSERT/UPDATE trigger has no such restriction, so
-- clinic.doctor_profiles gets a plain tsvector column kept in sync by
-- clinic.doctor_profiles_search_vector_update() below instead.
ALTER TABLE clinic.doctor_profiles
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION clinic.doctor_profiles_search_vector_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.biography, '')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.certifications, ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(NEW.languages, ' ') || ' ' || array_to_string(NEW.awards, ' ') || ' ' || array_to_string(NEW.publications, ' ') || ' ' || array_to_string(NEW.interests, ' ')), 'C');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_doctor_profiles_search_vector ON clinic.doctor_profiles;
CREATE TRIGGER trg_doctor_profiles_search_vector
  BEFORE INSERT OR UPDATE ON clinic.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION clinic.doctor_profiles_search_vector_update();

-- Backfill rows that existed before this trigger did (the trigger only fires
-- on future INSERT/UPDATE). A no-op for a fresh table.
UPDATE clinic.doctor_profiles SET biography = biography;

ALTER TABLE clinic.ai_prompt_settings
  ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(greeting, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(clinic_personality, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(fallback_message, '') || ' ' || coalesce(escalation_rules, '') || ' ' || coalesce(emergency_instructions, '') || ' ' || coalesce(system_prompt, '')), 'C')
  ) STORED;

-- clinic.clinics backs two distinct Sprint 19 knowledge sources (Clinic
-- Profile, Appointment Settings) from one row - two separate generated
-- columns keep them independently rankable/reportable instead of one column
-- blending unrelated fields.
ALTER TABLE clinic.clinics
  ADD COLUMN IF NOT EXISTS search_vector_profile tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(clinic_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(address, '') || ' ' || coalesce(city, '') || ' ' || coalesce(state, '') || ' ' || coalesce(country, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(website, '')), 'C')
  ) STORED;

ALTER TABLE clinic.clinics
  ADD COLUMN IF NOT EXISTS search_vector_appointment_settings tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(appointment_settings::text, '') || ' ' || coalesce(business_hours::text, '')), 'B')
  ) STORED;

-- ------------------------------------------------------------------------------
-- GIN indexes - one per generated column above.
-- ------------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_services_search_vector ON clinic.services USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_faqs_search_vector ON clinic.faqs USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_policies_search_vector ON clinic.policies USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_insurance_providers_search_vector ON clinic.insurance_providers USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_message_templates_search_vector ON clinic.message_templates USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_doctor_profiles_search_vector ON clinic.doctor_profiles USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_settings_search_vector ON clinic.ai_prompt_settings USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_clinics_search_vector_profile ON clinic.clinics USING GIN (search_vector_profile);
CREATE INDEX IF NOT EXISTS idx_clinics_search_vector_appointment_settings ON clinic.clinics USING GIN (search_vector_appointment_settings);

-- ------------------------------------------------------------------------------
-- clinic.rag_search(search_query, result_limit) - the single search function
-- KnowledgeRepository (apps/api-server/src/rag/knowledge.repository.ts) calls.
-- UNIONs every source above, ranks each match with ts_rank_cd against the same
-- weighted tsvector the GIN index covers, and returns a snippet via
-- ts_headline. `source_id` is text, not uuid, because ai_prompt_settings' id
-- is a smallint (singleton row) while every other source uses a uuid - a
-- single uniform return shape needs a common, string, type.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION clinic.rag_search(search_query text, result_limit integer DEFAULT 10)
RETURNS TABLE (
  source     varchar(30),
  source_id  text,
  title      text,
  snippet    text,
  score      real
)
LANGUAGE sql
STABLE
AS $$
  WITH query AS (
    SELECT websearch_to_tsquery('english', search_query) AS tsq
  )
  SELECT source, source_id, title, snippet, score
  FROM (
    SELECT
      'clinic_service'::varchar(30) AS source,
      s.id::text AS source_id,
      s.name AS title,
      ts_headline('english', coalesce(s.description, s.name), query.tsq,
        'MaxFragments=1,MaxWords=30,MinWords=10') AS snippet,
      ts_rank_cd(s.search_vector, query.tsq) AS score
    FROM clinic.services s, query
    WHERE s.status = 'active' AND s.search_vector @@ query.tsq

    UNION ALL

    SELECT
      'faq',
      f.id::text,
      f.question,
      ts_headline('english', f.answer, query.tsq, 'MaxFragments=1,MaxWords=30,MinWords=10'),
      ts_rank_cd(f.search_vector, query.tsq)
    FROM clinic.faqs f, query
    WHERE f.status = 'published' AND f.search_vector @@ query.tsq

    UNION ALL

    SELECT
      'policy',
      p.id::text,
      p.title,
      ts_headline('english', p.content, query.tsq, 'MaxFragments=1,MaxWords=30,MinWords=10'),
      ts_rank_cd(p.search_vector, query.tsq)
    FROM clinic.policies p, query
    WHERE p.status = 'active' AND p.search_vector @@ query.tsq

    UNION ALL

    SELECT
      'insurance_provider',
      ip.id::text,
      ip.name,
      coalesce(nullif(ip.website, ''), ip.contact_person, ip.name),
      ts_rank_cd(ip.search_vector, query.tsq)
    FROM clinic.insurance_providers ip, query
    WHERE ip.status = 'active' AND ip.search_vector @@ query.tsq

    UNION ALL

    SELECT
      'message_template',
      mt.id::text,
      mt.name,
      ts_headline('english', mt.body, query.tsq, 'MaxFragments=1,MaxWords=30,MinWords=10'),
      ts_rank_cd(mt.search_vector, query.tsq)
    FROM clinic.message_templates mt, query
    WHERE mt.search_vector @@ query.tsq

    UNION ALL

    SELECT
      'doctor_profile',
      dp.id::text,
      'Dr. ' || d.first_name || ' ' || d.last_name,
      ts_headline('english', coalesce(nullif(dp.biography, ''), d.specialization), query.tsq,
        'MaxFragments=1,MaxWords=30,MinWords=10'),
      ts_rank_cd(dp.search_vector, query.tsq)
    FROM clinic.doctor_profiles dp
    JOIN clinic.doctors d ON d.id = dp.doctor_id, query
    WHERE dp.search_vector @@ query.tsq

    UNION ALL

    SELECT
      'clinic_profile',
      c.id::text,
      c.clinic_name,
      left(c.address || ', ' || c.city || ', ' || c.state, 200),
      ts_rank_cd(c.search_vector_profile, query.tsq)
    FROM clinic.clinics c, query
    WHERE c.search_vector_profile @@ query.tsq

    UNION ALL

    SELECT
      'appointment_settings',
      c.id::text,
      c.clinic_name || ' - Appointment Settings',
      left(c.appointment_settings::text, 200),
      ts_rank_cd(c.search_vector_appointment_settings, query.tsq)
    FROM clinic.clinics c, query
    WHERE c.search_vector_appointment_settings @@ query.tsq

    UNION ALL

    SELECT
      'ai_prompt_setting',
      aps.id::text,
      'AI Persona Settings',
      ts_headline('english', coalesce(nullif(aps.greeting, ''), aps.clinic_personality), query.tsq,
        'MaxFragments=1,MaxWords=30,MinWords=10'),
      ts_rank_cd(aps.search_vector, query.tsq)
    FROM clinic.ai_prompt_settings aps, query
    WHERE aps.search_vector @@ query.tsq
  ) matches
  ORDER BY score DESC
  LIMIT result_limit;
$$;
