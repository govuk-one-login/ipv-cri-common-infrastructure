# Address CRI Core Resources

Deploy core resources that should not change often into their own stack with a separate deploy lifecycle.

These resources are:

* KMS keys
* DynamoDB tables
* API keys

The names and exported names of these resources will be prefixed with the API stack name `di-ipv-cri-address-core-infra`.

As a developer, you will be use these shared core stack resources by default, or you can choose to deploy your own core stack.

Note that SSM params are not yet part of this stack.

## Deployment

There are GitHub actions to package this stack for the CRI dev address build environments, and AWS Code Pipelines to deploy them.

To deploy this stack locally use:
`gds aws di-ipv-cri-dev -- sam deploy --stack-name my-core-infra --parameter-overrides Environment=dev`
Please do not use the default stack name of `di-ipv-cri-address-core-infra`.
