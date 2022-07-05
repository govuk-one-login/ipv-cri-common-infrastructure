# di-ipv-cri-common-infrastructure
Core Infrastructure for the Address CRI

This repository is the home for common CRI supporting Cloud Formation infrastructure which is shared or sensitive.

The code in this repository is deployed and promoted through the environments using GitHub actions and 
the dev platform team implementation.

The automated deployments are triggered on a push to main after PR approval.

GitHub secrets are required for deployment.

Required GitHub secrets:

Core secrets for dev environments:

| Secret                                       | Description |
|----------------------------------------------| ----------- |
| ADDRESS_DEV_CORE_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| ADDRESS_DEV_CORE_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |
| FRAUD_DEV_CORE_ARTIFACT_SOURCE_BUCKET_NAME   | Upload artifact bucket |
| FRAUD_DEV_CORE_GH_ACTIONS_ROLE_ARN           | Assumed role IAM ARN |
| KBV_DEV_CORE_ARTIFACT_SOURCE_BUCKET_NAME     | Upload artifact bucket |
| KBV_DEV_CORE_GH_ACTIONS_ROLE_ARN             | Assumed role IAM ARN |

Core secrets for Build environments:

| Secret                                         | Description |
|------------------------------------------------| ----------- |
| ADDRESS_BUILD_CORE_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| ADDRESS_BUILD_CORE_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |
| FRAUD_BUILD_CORE_ARTIFACT_SOURCE_BUCKET_NAME   | Upload artifact bucket |
| FRAUD_BUILD_CORE_GH_ACTIONS_ROLE_ARN           | Assumed role IAM ARN |
| KBV_BUILD_CORE_ARTIFACT_SOURCE_BUCKET_NAME     | Upload artifact bucket |
| KBV_BUILD_CORE_GH_ACTIONS_ROLE_ARN             | Assumed role IAM ARN |

TxMA secrets for dev environments:

| Secret                                       | Description |
|----------------------------------------------| ----------- |
| ADDRESS_DEV_TXMA_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| ADDRESS_DEV_TXMA_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |
| FRAUD_DEV_TXMA_ARTIFACT_SOURCE_BUCKET_NAME   | Upload artifact bucket |
| FRAUD_DEV_TXMA_GH_ACTIONS_ROLE_ARN           | Assumed role IAM ARN |
| KBV_DEV_TXMA_ARTIFACT_SOURCE_BUCKET_NAME     | Upload artifact bucket |
| KBV_DEV_TXMA_GH_ACTIONS_ROLE_ARN             | Assumed role IAM ARN |

TxMA secrets for Build environments:

| Secret                                         | Description |
|------------------------------------------------| ----------- |
| ADDRESS_BUILD_TXMA_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| ADDRESS_BUILD_TXMA_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |
| FRAUD_BUILD_TXMA_ARTIFACT_SOURCE_BUCKET_NAME   | Upload artifact bucket |
| FRAUD_BUILD_TXMA_GH_ACTIONS_ROLE_ARN           | Assumed role IAM ARN |
| KBV_BUILD_TXMA_ARTIFACT_SOURCE_BUCKET_NAME     | Upload artifact bucket |
| KBV_BUILD_TXMA_GH_ACTIONS_ROLE_ARN             | Assumed role IAM ARN |

Frontend test dev:

| Secret                          | Description |
|---------------------------------| ----------- |
| DEV_ARTIFACT_SOURCE_BUCKET_NAME | Upload artifact bucket |
| DEV_GH_ACTIONS_ROLE_ARN         | Assumed role IAM ARN |
| DEV_SIGNING_PROFILE_NAME        | Signing profile name |
