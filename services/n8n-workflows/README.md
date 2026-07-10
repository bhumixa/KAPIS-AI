# n8n Workflows

Exported n8n workflow JSON files (version-controlled automation definitions) live here.
The `n8n` service in `docker-compose.yml` mounts this folder so workflows can be exported
from the n8n UI straight into source control.

Sprint 1 did not implement any workflows yet. Sprint 14 adds the folder structure and
**placeholder-only** exports - no business logic, no credentials, no active workflows -
plus the NestJS bridge (`apps/api-server/src/n8n/`) that knows about them. See
[docs/Architecture.md](../../docs/Architecture.md#n8n-integration-bridge-sprint-14) for
why the structure is shaped this way.

```
n8n-workflows/
  appointments/    Appointment-related automations (reminders, follow-ups)
  patients/         Patient-related automations (intake, onboarding)
  conversations/    Inbound-message routing / AI handoff automations
  automation/        Clinic-wide operational automations (digests, housekeeping)
  templates/          Reusable starter workflows to copy into a category folder
```

Each category folder holds one placeholder JSON per workflow registered in
`apps/api-server/src/n8n/registry/workflow-definitions.seed.ts` - the seed's `id` and
`workflowFile` fields point at the exact file here. `templates/` holds starter shapes
(a bare webhook trigger, a bare manual trigger) that are **not** registered anywhere;
they exist to be copied, renamed, and filled in when a real workflow is built.

WhatsApp intake, AI-response routing, and Google Calendar sync are still not built here -
that starts once the corresponding integration (Sprint 8, still mock-only) goes live.
