## Setup and Usage

- Required tools: Docker, Node, NPM
- For every testsuite (subfolders in project root) run `npm install`
- Execute tests with `npm test`

### General setup

The tests will automatically reset the test environment before each test or serial block by resetting the Docker volumes
back to the initial state.

- After first start, before doing ANYTHING else, wait until all the containers are "healthy" and then create a snapshot
  by
  running `./docker-volumes-snapshot.sh snapshot`
- The snapshot script only works with Linux -> execute tests in Linux, for Windows WSL can be used (in PHPStorm select
  WSL as interpreter)

## Docker

To simplify mainting the docker compose.yml files this project uses the following files:

- docker compose.base.yml: This is currently the file used in the AdlerDevelopmentEnvironment project.
- docker compose.test-adjustments.yml: This file contains all modifications needed for the test environment.

Use the following commands to start/stop/pull the docker containers:

- start:
  `docker compose -f docker compose.base.yml -f docker compose.test-adjustments.yml up -d --build --force-recreate --wait`
- stop: `docker compose -f docker compose.base.yml -f docker compose.test-adjustments.yml down`
- pull: `docker compose -f docker compose.base.yml -f docker compose.test-adjustments.yml pull`

You can generate the combined docker compose.yml file with the following command:
> [!WARNING]
> You have to manually update the docker compose.yml after every pull or change to the source files.

- `docker compose -f docker compose.base.yml -f docker compose.test-adjustments.yml config > docker compose.yml`

## Additional, less relevant information

### IDE setup

#### Visual Studio Code

The plugin "Playwright Test for VSC" can be used to run tests directly from the IDE. It might be necessary to manually
activate all testsuites in the plugin settings.

Test-Symbol in left sidebar -> Playwright -> Configs -> Settings wheel -> select projects -> OK

> [!WARNING]
> When running tests with this plugin it loads all active projects for no reason. If something (like a a dependency
> issue) in another project is broken, there will be errors in the output. Workaround: Deactivate all projects except
> the
> one you want to test.

## Engine & WebGl

Since the so called "AdLer-Engeine" uses WebGl to render the 3D models, it is important to set the '--enable-gpu' flag
when launching chrome. Other webdrivers remain to be tested.