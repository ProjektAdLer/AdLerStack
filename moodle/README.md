# Moodle Security Tests

Security tests for the Adler Moodle plugins using [Hurl](https://hurl.dev/).

## Setup

1. Install Hurl following the [official installation guide](https://hurl.dev/docs/installation.html)
2. Have the Adler Stack compose running and set up (see [Setup and Usage](../docs/setup.md)). 
The whole snapshot topic is not required as this project works without resetting.
Nevertheless, it might still be useful to be able to reset the environment to the initial state.

## Project Structure

- **`setup_test_environment/setup.hurl`** - Creates test users (students s1/s2, managers m1/m2) and 
a test course c1 with m1 as author. Enrolls s1 to c1 and completes a learning element. All variables are
documented at the start of the file.
- **`tests/*.hurl`** - Individual test files
- **`envrionments/*.env`** - Environment configuration files containing host URLs and admin credentials etc.

## Running Tests

Tests are run by piping the setup file and test file together. Run from within the `moodle` directory:

```bash
cat setup_test_environment/setup.hurl tests/<testfile>.hurl | hurl --variables-file envrionments/<env file>.env
```

example:

```bash
cat setup_test_environment/setup.hurl tests/local_adler_get_element_ids_by_uuids.hurl | hurl --variables-file envrionments/env_localhost_adler_stack.env
```

## Test Design

Tests are designed to run **without requiring a reset** between executions. Each test run:
- Creates fresh test users and courses via the setup file
- Only interacts with resources created in that specific test run
- Never modifies or accesses existing system data

This ensures tests can run repeatedly and in parallel without slow resets. Note that this way test isolation is
not perfect. For example a `drop database` would still break other tests.

