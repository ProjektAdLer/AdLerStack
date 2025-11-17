# Deploying AdLer

## Deploying a local test environment
We provide a localhost only deployment for development and testing purposes in the 
[ProjektAdLer/AdlerDevelopmentEnvironment repository](https://github.com/ProjektAdLer/AdlerDevelopmentEnvironment/tree/main/non-moodle).

With small modifications this deployment can also be used for a LAN only IP based dev/test deployment. See the README.md
of the provided link for some further details. We do not officially support LAN deployments.

## Production deployment
### docker-compose.yml
A production environment should be based on the `docker-compose.yml` from a GitHub release. It contains the bare minimum
configuration and is designed to be adjusted through a `docker-compose.override.yml` for each specific deployment environment.
The base `docker-compose.yml` is not meant to be changed directly to simplify updates.

The provided compose file does not provide a way to access the services. Either one of the following options have to be used:
- Open ports of Moodle, Backend and Frontend. You have to use a reverse proxy as the services (at least moodle) have
  to be accessed through their defined domain names (see [section .env](#env-file)).

  The [local development/test environment](https://github.com/ProjektAdLer/AdlerDevelopmentEnvironment/tree/main/non-moodle)
  also uses this approach to allow localhost access, but uses further adjustments to make it work.
```yaml
  backend:
    ports:
      - '${_PORT_BACKEND}:80'
```
- Set up a reverse proxy in docker. We use Traefik. With this approach the services itself do not expose a port to the 
  docker host.

  Our production deployment using docker is available in [this repo](https://github.com/ProjektAdLer/deployment-adler-prod/tree/deploy).
  See the `docker-compose.override.yml` for our modifactions compared to the base `docker-compose.yml`, including the 
  Traefik configuration.

For further customization of the deployment refer to the documentation of each service. Most likely modification is
probably the creation of a set of default test users through the 
[AdLer LMS / Moodle service](https://github.com/ProjektAdLer/MoodleAdlerLMS?tab=readme-ov-file#usage).

### .env file
Along with the `docker-compose.yml` a `.env` file is provided in the release. It contains documentation about all variables.
The provided file contains two sections with variables only used for deployment tests. You should remove them as they are not
needed in a production environment.

Our `.env` file used in production is also available in [this repo](https://github.com/ProjektAdLer/deployment-adler-prod/tree/deploy).
Our secrets are not stored in the `.env` file.

### Updating
Do not update anything in the docker-compose.yml, like an image version, manually!

To update your environment [get a newer version of the `docker-compose.yml`](https://github.com/ProjektAdLer/AdLerStack/releases). All potential changes you are required to make
to your deployment will be listed in the changelog. The releases follow semantic versioning. Note that any breaking change
in either the deployment or in the services (which will not result in changes in the deployment configuration) will
increase the major version number.

Downgrades are not supported! Make a backup before updating.