# Writing tests

In general refer to the official documentation.

Tests are always run against the Docker environment. It does not reset automatically so it might be required to manually
reset between test executions. It is possible to do this only for certain services:

- `docker compose down authoring-tool && docker compose up --force-recreate -d authoring-tool` restarts authoring-tool.
  This will not delete data in volumes
- `docker compose down -v && docker compose up -d` restarts all services and deletes all data. Will take a few minutes

Always use the environment variables for "variable" data like URLs or login credentials. See the `.env` file in the root
directory for the available variables.
Each playwright project has a default URL specified. Use it.

Example for authoring-tool `page.goto('/MyLearningWorldsOverview')` <-- it will automatically prefix the URL to point to
the authoring-tool service.

Doing it otherwise will cause the tests to fail on the CI/CD pipeline.

## Playwright commands

- Record Browser actions: `npx playwright codegen <optional: url>`
