#!/bin/bash

echo Reset test environment
docker compose down -v

echo Start test environment
docker compose up -d --wait --timeout 300

if [ $? -ne 0 ]; then
    echo "Error: Services failed to start within timeout"
    exit 1
fi

echo Run backend_api test suite

# todo potentially refactor docker stuff to globalSetup and globalTeardown https://playwright.dev/docs/test-global-setup-teardown#option-2-configure-globalsetup-and-globalteardown