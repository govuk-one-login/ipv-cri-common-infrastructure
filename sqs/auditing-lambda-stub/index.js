// Taken from https://docs.aws.amazon.com/lambda/latest/dg/with-sqs-create-package.html#with-sqs-example-deployment-pkg-nodejs
// Will read events from an SQS queue and log them
exports.handler = async function(event, context) {
    event.Records.forEach(record => {
        const { body } = record;
        console.log(body);
    });
    return {};
}