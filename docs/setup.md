## Setup and Usage

- Required tools: Docker, Node, NPM (any guide from Google/official docs should work, or see [this unmaintained guide in our documenation](https://projektadler.github.io/Documentation/integration-und-e2e-testing.html))
- For every testsuite (subfolders in project root) run `npm install`
- Execute tests with `npm test`

> [!NOTE]
> Its recommended to use PHPStorm or WebStorm

> [!NOTE]
> Run all commands inside WSL

### First Start / Update / config change
This section describes how to first start the environment. This section also applies if the docker-compose files were changed in any way, including pulling an updated version from the git remote.

#### 1: Start containers
1) Delete existing data: `docker compose down -v`
2) Start containers `docker compose up -d --force-recreate --wait`

This will take a few minutes.

#### 2: Snapshot

To use a clean test environment tests can reset the environment to the initial state. See [writing_tests documentation](./writing_tests.md) for details. To make this work a snapshot of the initial state has to be created.

- After first start, before doing ANYTHING else, wait until all the containers are "healthy" and then create a snapshot
  by
  running `./docker-volumes-snapshot.sh snapshot`
- The snapshot script only works with Linux -> execute tests in Linux, for Windows WSL can be used (in PHPStorm select
  WSL as interpreter)

## Docker

To simplify mainting the docker-compose.yml files this project uses the following files:

- docker-compose.yml: This is the base docker compose file that will be used for all of our projects. Do not change it.
- docker-compose.override.yml: This file contains all modifications needed for the test environment. If you have to change something related to the deployment, do it in this file.
- .env: This file is like a configuration file. Typically you do not have to change anything there, but you can change the values of the variables. Do not change or remove variable keys.

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
