# Writing tests
In general refer to the official documentation.

## Test environment reset
Tests are always run against the Docker environment. The environment is not automatically reset after each test.
If the environment should be reset, which should be done before each test scenario, do the following:

```typescript
test.beforeAll(async ({ resetEnvironment }, testInfo) => {
    await resetEnvironment();
});
```

This will reset the test environment to the snapshot taken before, see [General setup](docs/setup.md#general-setup).

Note that this process will take roughly half a minute each time.



## Environment variables and URLs
Always use the environment variables for "variable" data like URLs or login credentials. See the `.env` file in the root directory for the available variables.
Each playwright project has a default URL specified. Use it.

Example for authoring-tool `page.goto('/MyLearningWorldsOverview')` <-- it will automatically prefix the URL to point to the authoring-tool service.

Doing it otherwise will cause the tests to fail on the CI/CD pipeline. 

## Playwright commands
- Record Browser actions: `npx playwright codegen <optional: url>`
