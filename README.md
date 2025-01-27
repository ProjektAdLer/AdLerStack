# Adler automated integration and end-to-end tests

## Setup
> [!NOTE]
> While manual test execution is supported on Windows, this project aims only on Linux support. On Windows you can use WSL.

- Required tools: Docker, Node, NPM
- For every testsuite (subfolders in project root) run `npm install`
- Execute tests with `npm test`

## Playwright commands
- Record Browser actions: `npx playwright codegen <optional: url>`

## Docker
To simplify mainting the docker-compose.yml files we use this project uses the following files:
- docker-compose.base.yml: This is currently the file used in the AdlerDevelopmentEnvironment project.
- docker-compose.test-adjustments.yml: This file contains all modifications needed for the test environment.

Use the following commands to start/stop/pull the docker containers:
- start: `docker-compose -f docker-compose.base.yml -f docker-compose.test-adjustments.yml up -d`
- stop: `docker-compose -f docker-compose.base.yml -f docker-compose.test-adjustments.yml down`
- pull: `docker-compose -f docker-compose.base.yml -f docker-compose.test-adjustments.yml pull`

You can generate the combined docker-compose.yml file with the following command:
> [!WARNING]
> You have to manually update the docker-compose.yml after every pull or change to the source files.
- `docker-compose -f docker-compose.base.yml -f docker-compose.test-adjustments.yml config > docker-compose.yml`