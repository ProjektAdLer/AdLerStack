This docker-compose.yml is configured for organization runners. Changes for personal runners are minimal.
See [myoung34/docker-github-actions-runner documentation](https://github.com/myoung34/docker-github-actions-runner/wiki/Usage).
Provide a [personal access token]() through the env variable `GITHUB_ACCESS_TOKEN`, eg defined in the `.env`file.
Personal access tokens have to be enabled first for the organization. Using fine grained permissions is recommended.
Select `All repositories` and grant write permissions for `Self-hosted runners`.

Using [service containers](https://docs.github.com/de/actions/use-cases-and-examples/using-containerized-services/about-service-containers)
is possible, but they can not be accessed like on the shared runners. Expose a port on the service container (eg
`3001:80`) and access it via `dind:3001` in the job steps. Same for `docker` and `docker-compose` services.

To start the runner, run `docker-compose up -d`. To stop the runner, run `docker-compose down`. This will only run one
runner. To run multiple runners start the compose with different project names

- defined by the `GITHUB_RUNNER_NAME` env variable, or
- by having multiple `docker-compose.yml` files with different project names.

**Do not** use the -p/--project-name flag!
