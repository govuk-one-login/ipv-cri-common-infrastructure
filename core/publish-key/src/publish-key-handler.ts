import { LambdaInterface } from "@aws-lambda-powertools/commons/types";

import { Logger } from "@aws-lambda-powertools/logger";
import { Context } from "aws-lambda";
const logger = new Logger({ serviceName: "PublishKeyHandler" });

export class PublishKeyHandler implements LambdaInterface {
  public async handler(event: Record<string, unknown> , context: Context): Promise<string> {
    logger.info(`Initiating lambda ${context.functionName} version ${context.functionVersion}`);
    return "Hello, World!";
  }
}

const handlerClass = new PublishKeyHandler();
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
