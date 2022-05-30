The templates in this directory are not deployed via any pipelines.

Run up the new CRI VPC which is using temporarily assigned EIP's.

```shell
  gds aws di-ipv-cri-address-<ENVIRONMENT> -- aws cloudformation create-stack \
  --stack-name cri-vpc --template-body file://./cri-vpc.yaml \
  --capabilities CAPABILITY_AUTO_EXPAND 
```


To update the cri-vpc stack

```shell
  gds aws di-ipv-cri-address-<ENVIRONMENT> -- aws cloudformation update-stack \
  --stack-name cri-vpc --template-body file://./cri-vpc.yaml \
  --capabilities CAPABILITY_AUTO_EXPAND 
```
