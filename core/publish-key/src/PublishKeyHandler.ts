import { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import { Context } from "aws-lambda";
import { Logger } from "@aws-lambda-powertools/logger";
import { Jwk, Jwks } from "../types/Keys";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { KMSClient, GetPublicKeyCommand, GetPublicKeyCommandOutput } from "@aws-sdk/client-kms";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import crypto from "node:crypto";
import { normaliseError } from "./utils";

export const logger = new Logger({ serviceName: "PublishKeyHandler" });

export class PublishKeyHandler implements LambdaInterface {
    decryptionKeyID: string;
    bucketName: string;

    readonly s3Client = new S3Client({
        region: process.env.REGION,
        maxAttempts: 5,
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 5000,
            requestTimeout: 5000,
        }),
    });

    readonly kmsClient = new KMSClient({
        region: process.env.REGION,
        maxAttempts: 5,
        requestHandler: new NodeHttpHandler({
            connectionTimeout: 5000,
            requestTimeout: 5000,
        }),
    });

    constructor(decryptionKeyID: string | undefined, bucketName: string | undefined) {
        if (!decryptionKeyID) {
            throw new Error("Key ID is missing");
        }
        this.decryptionKeyID = decryptionKeyID;

        if (!bucketName) {
            throw new Error("bucketName is missing");
        }
        this.bucketName = bucketName;
    }

    // PLEASE NOTE: THIS LAMBDA WILL OVERWRITE EVERYTHING IN THE JWKS.JSON FILE. It does not append the current decryption key details.
    public async handler(event: Record<string, unknown>, context: Context): Promise<string | undefined> {
        try {
            logger.info(`Initiating lambda ${context.functionName} version ${context.functionVersion}`);
            logger.debug(`Using key ${this.decryptionKeyID} and uploading to ${this.bucketName}`);

            const jsonWebKeySet: Jwks = { keys: [] };
            const decryptionKey = await this.getKmsKey();
            logger.debug(`Obtained the Public Key: ${JSON.stringify(decryptionKey)}`);

            const decryptionKeyAsJwk: Jwk = this.convertToJwk(decryptionKey);
            jsonWebKeySet.keys.push(decryptionKeyAsJwk);

            await this.saveToS3(jsonWebKeySet);
            logger.info("Successfully uploaded a new object version of jwks.json to bucket");

            return "Success";
        } catch (error) {
            throw normaliseError(error, "Unable to create JWKS file");
        }
    }

    private async saveToS3(jsonWebKeySet: Jwks) {
        try {
            const uploadParams = {
                Bucket: this.bucketName,
                Key: "jwks.json",
                Body: JSON.stringify(jsonWebKeySet),
                ContentType: "application/json",
            };
            logger.debug(`uploadParams = ${JSON.stringify(uploadParams)}`);

            await this.s3Client.send(new PutObjectCommand(uploadParams));
        } catch (error) {
            throw normaliseError(error, "Failed to save to S3");
        }
    }

    private async getKmsKey() {
        try {
            const decryptionKey = await this.kmsClient.send(new GetPublicKeyCommand({ KeyId: this.decryptionKeyID }));
            if (!this.isValidPublicKey(decryptionKey)) {
                logger.debug(`InvalidKey: ${JSON.stringify(decryptionKey)}`);
                throw new Error(`Public key data obtained from KMS is invalid`);
            }
            return decryptionKey;
        } catch (error) {
            throw normaliseError(error, "Failed to fetch key from KMS");
        }
    }

    private convertToJwk(kmsKeyOutput: GetPublicKeyCommandOutput): Jwk {
        const publicKey: crypto.JsonWebKey = crypto
            .createPublicKey({
                key: kmsKeyOutput.PublicKey as Buffer,
                type: "spki",
                format: "der",
            })
            .export({ format: "jwk" });

        return {
            ...publicKey,
            use: "enc",
            kid: crypto.createHash("sha256").update(this.decryptionKeyID).digest().toString("hex"),
            alg: "RSA_OAEP_256",
        } as Jwk;
    }

    private isValidPublicKey(kmsKey: GetPublicKeyCommandOutput | null): boolean {
        return (
            !!kmsKey &&
            kmsKey.KeySpec != undefined &&
            kmsKey.KeyId != undefined &&
            kmsKey.PublicKey != undefined &&
            kmsKey.KeyUsage === "ENCRYPT_DECRYPT"
        );
    }
}

const DECRYPTION_KEY_ID: string | undefined = process.env.DECRYPTION_KEY_ID;
const JWKS_BUCKET_NAME: string | undefined = process.env.JWKS_BUCKET_NAME;

const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, JWKS_BUCKET_NAME);
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
