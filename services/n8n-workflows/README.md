# n8n Workflows

Exported n8n workflow JSON files (version-controlled automation definitions) live here.
The `n8n` service in `docker-compose.yml` mounts this folder so workflows can be exported
from the n8n UI straight into source control.

Sprint 1 did not implement any workflows yet. Sprint 14 added the folder structure and
placeholder-only exports (no business logic, no credentials, no active workflows) plus
the NestJS bridge (`apps/api-server/src/n8n/`) that knows about them - it never called
n8n. Sprint 15 makes the bridge real: `WorkflowRegistryService` loads workflow
definitions directly from this folder at startup (not a static in-code seed), and
`POST /api/n8n/workflows/import/:id` can import + activate a workflow into a running n8n
instance. See
[docs/DevelopmentGuide.md](../../docs/DevelopmentGuide.md#n8n-integration-bridge-sprint-1415)
for why the structure is shaped this way.

```
n8n-workflows/
  appointments/    Appointment-related automations (reminders, follow-ups)
  patients/         Patient-related automations (intake, onboarding)
  conversations/    Inbound-message routing / AI handoff automations
  automation/        Clinic-wide operational automations (digests, housekeeping)
  templates/          Reusable starter workflows to copy into a category folder
```

Each category folder holds one JSON export per registered workflow. `WorkflowRegistryService`
reads each file's top-level `meta` block to build the registry - it must contain:

| Field | Meaning |
| --- | --- |
| `id` | Stable identifier, used in every `/api/n8n/workflows/:id/...` route |
| `name` | Display name |
| `category` | Must match the folder it lives in (`appointments`/`patients`/`conversations`/`automation`) |
| `version` | Free-form version string for the export |
| `description` | Shown on the Automation dashboard's workflow card |
| `webhookPath` | Path segment n8n exposes this workflow under once imported+active: `{N8N_BRIDGE_BASE_URL}/webhook/{webhookPath}` - must match the `path` parameter on the file's own `n8n-nodes-base.webhook` trigger node |

`meta.triggerType` (`webhook`/`manual`/`event`) is optional, UI-only labeling of how a
human/system expects to invoke the workflow - every workflow is triggered the same way
under the hood (a webhook POST) once imported. `templates/` holds starter shapes (a bare
webhook trigger, a bare manual trigger) that are **not** registered anywhere - `templates/`
itself is skipped by the registry loader; they exist to be copied, renamed, and filled in
when a real workflow is built.

Importing a file here into n8n (`POST /api/n8n/workflows/import/:id`) sends only its
`name`/`nodes`/`connections`/`settings` - the `meta` block is stripped first, since n8n's
own workflow API doesn't accept it.

WhatsApp intake, AI-response routing, and Google Calendar sync are still not built here -
that starts once the corresponding integration (Sprint 8, still mock-only) goes live.
