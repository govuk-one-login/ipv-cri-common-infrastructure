# CRI Core Resources

Deploy core resources that should not change often into their own stack with a separate deploy lifecycle.

These resources are:

* KMS keys
* DynamoDB tables
* API keys
* S3 bucket with `jwks.json` to store public keys

The names and exported names of these resources will be prefixed with the API stack name `di-ipv-cri-address-core-infra`.

As a developer, you will be use these shared core stack resources by default, or you can choose to deploy your own core stack.

Note that SSM params are not yet part of this stack.

> [!IMPORTANT]
> The published keys bucket has `ObjectLock` enabled as per the RFC for key-rotation. This is enabled in `COMPLIANCE` mode in production, and `GOVERNANCE` mode in lower environments. This protects the `jwks.json` file and means it cannot be overwritten or deleted by any user. See AWS docs [here](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html).
>
> For development work, i.e if the core stack is deployed via sam deploy, `ObjectLock` and `ObjectLockConfiguration` is switched off so the dev file can be deleted once the ticket is complete.

## Deployment

There are GitHub actions to package this stack for the CRI dev address build environments, and AWS Code Pipelines to deploy them.

To deploy this stack locally use:
`gds aws di-ipv-cri-dev -- sam deploy --stack-name my-core-infra --parameter-overrides Environment=dev`
Please do not use the default stack name of `di-ipv-cri-address-core-infra`.
