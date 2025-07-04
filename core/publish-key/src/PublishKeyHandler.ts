import { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import { Context } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { Jwk, JWKSBody } from "../utils/Types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import crypto from "crypto";
import { KMS } from "@aws-sdk/client-kms";
import { GetPublicKeyCommandOutput } from "@aws-sdk/client-kms/dist-types/commands/GetPublicKeyCommand";

export const logger = new Logger({ serviceName: "PublishKeyHandler" });

export class PublishKeyHandler implements LambdaInterface {
    decryptionKeyID: string;
    bucketName: string;
    kmsClient: KMS;

    constructor(decryptionKeyID: string | undefined, bucketName: string | undefined, kmsClient: KMS | undefined) {
        if (!decryptionKeyID) {
            throw new Error("Key ID is missing");
        }
        this.decryptionKeyID = decryptionKeyID;

        if (!bucketName) {
            throw new Error("bucketName is missing");
        }
        this.bucketName = bucketName;

        if (!kmsClient) {
            throw new Error("kmsClient is missing");
        }
        this.kmsClient = kmsClient;
    }

    readonly s3Client = new S3Client({
        region: process.env.REGION,
        maxAttempts: 5,
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 5000,
            requestTimeout: 5000,
        }),
    });

    // PLEASE NOTE: THIS LAMBDA WILL OVERWRITE EVERYTHING IN THE JWKS.JSON FILE. It does not append the current decryption key details.
    public async handler(event: Record<string, unknown>, context: Context): Promise<string | undefined> {
        try {
            logger.info(`Initiating lambda ${context.functionName} version ${context.functionVersion}`);
            logger.debug(`Using key ${this.decryptionKeyID} and uploading to ${this.bucketName}`);

            const jwksBody: JWKSBody = { keys: [] };

            const decryptionKey: GetPublicKeyCommandOutput | null = await this.getFromKms();
            const decryptionJwk: Jwk | null = this.convertToJwk(decryptionKey);
            logger.info("Successfully obtained kmsKey as jwk");

            if (decryptionJwk) {
                jwksBody.keys.push(decryptionJwk);

                const uploadParams = {
                    Bucket: this.bucketName,
                    Key: "jwks.json",
                    Body: JSON.stringify(jwksBody),
                    ContentType: "application/json",
                };
                logger.debug(`uploadParams = ${JSON.stringify(uploadParams)}`);

                await this.s3Client.send(new PutObjectCommand(uploadParams));
                logger.debug(`jwksBody = ${JSON.stringify(jwksBody)}`);

                logger.info("Successfully Uploaded jwks.json to bucket");

                return "Success";
            }
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Unable to create JWKS file: ${error.message}`);
            } else {
                throw new Error(`Unable to create JWKS file: ${JSON.stringify(error)}`);
            }
        }
    }

    async getFromKms(): Promise<GetPublicKeyCommandOutput> {
        let kmsKey: GetPublicKeyCommandOutput;

        try {
            kmsKey = await this.kmsClient.getPublicKey({ KeyId: this.decryptionKeyID });
        } catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to fetch key from KMS: ${error.message}`);
            } else {
                throw new Error(`Failed to fetch key from KMS: ${JSON.stringify(error)}`);
            }
        }
        logger.debug("Successfully obtained kmsKey as jwk " + JSON.stringify(kmsKey));

        return kmsKey;
    }

    convertToJwk(kmsKey: GetPublicKeyCommandOutput | null): Jwk | null {
        if (this.keyPresentAndValid(kmsKey)) {
            const publicKey = crypto
                .createPublicKey({
                    key: kmsKey?.PublicKey as Buffer,
                    type: "spki",
                    format: "der",
                })
                .export({ format: "jwk" });

            const hashedKeyId: string = this.getHashedKid(this.decryptionKeyID);

            return {
                ...publicKey,
                use: "enc",
                kid: hashedKeyId,
                alg: "RSA_OAEP_256",
            } as unknown as Jwk;
        }
        throw new Error("Failed to build JWK from key due to incomplete key obtained from KMS");
    }

    keyPresentAndValid(kmsKey: GetPublicKeyCommandOutput | null): boolean {
        if (!kmsKey) {
            return false;
        }

        return kmsKey.KeySpec != undefined && kmsKey.KeyId != undefined && kmsKey.PublicKey != undefined;
    }

    getHashedKid(kmsKeyId: string): string {
        return crypto.createHash("sha256").update(kmsKeyId).digest().toString("hex");
    }
}

const DECRYPTION_KEY_ID: string | undefined = process.env.DECRYPTION_KEY_ID;
const JWKS_BUCKET_NAME: string | undefined = process.env.JWKS_BUCKET_NAME;
const KMS_CLIENT = new KMS({
    region: process.env.REGION ?? "eu-west-2",
});

const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, JWKS_BUCKET_NAME, KMS_CLIENT);
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
