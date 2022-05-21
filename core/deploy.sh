#!/usr/bin/env bash
set -eu
sam validate
sam build --config-env dev
sam deploy --config-env dev --no-fail-on-empty-changeset
