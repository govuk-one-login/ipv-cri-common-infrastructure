# di-ipv-cri-address-infrastructure
Core Infrastructure for the Address CRI

This repository is the home for Address CRI supporting Cloud Formation infrastructure which is shared or sensitive.

The code in this repository is deployed and promoted through the environments using GitHub actions and 
the dev platform team implementation.

The automated deployments are triggered on a push to main after PR approval.

GitHub secrets are required for deployment.

Required GitHub secrets:

TxMA SQS for dev:

| Secret                              | Description |
|-------------------------------------| ----------- |
| DEV_SQS_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| DEV_SQS_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |


Frontend test dev:

| Secret                          | Description |
|---------------------------------| ----------- |
| DEV_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| DEV_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |
| DEV_SIGNING_PROFILE_NAME        | Signing profile name |
