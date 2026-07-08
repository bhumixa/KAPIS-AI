# docker/

`docker-compose.yml` (repo root) fully defines Sprint 1's stack using stock images, so
this folder is currently empty. It's reserved for per-service overrides that don't fit
in `docker-compose.yml` itself - custom `Dockerfile`s, service-specific config files
(e.g. a `postgresql.conf` override, a custom n8n entrypoint) - once a later sprint
needs one.
