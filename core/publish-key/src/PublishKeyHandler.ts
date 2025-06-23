import { LambdaInterface } from "@aws-lambda-powertools/commons/types";
import { Logger } from "@aws-lambda-powertools/logger";
import { Jwk, JWKSBody} from "../utils/Types";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NodeHttpHandler } from "@smithy/node-http-handler";
import crypto from "crypto";
import { KMS } from "@aws-sdk/client-kms";

// const POWERTOOLS_LOG_LEVEL : string = process.env.POWERTOOLS_LOG_LEVEL ?? "INFO";
export const logger = new Logger({ serviceName: "PublishKeyHandler" });

// REMEMBER TO CHANGE BACK FROM HARDCODED "INFO"!!!!!!!!!!!

export class PublishKeyHandler implements LambdaInterface {
  decryptionKeyID: string;
  bucketName: string;
  kmsClient: any;

  constructor(decryptionKeyID: string, bucketName: string, kmsClient : any) {
  	this.decryptionKeyID = decryptionKeyID;
  	this.bucketName = bucketName;
  	this.kmsClient = kmsClient;
    console.log(`DECRYPTION_KEY_ID at end of constructor = ${this.decryptionKeyID}`);
    console.log(`JWKS_BUCKET_NAME at end of constructor = ${this.bucketName}`);
  };

	readonly s3Client = new S3Client({
		region: process.env.REGION,
		maxAttempts: 2,
		requestHandler: new NodeHttpHandler({
			connectionTimeout: 29000,
			socketTimeout: 29000,
		}),
	});

    public async handler(): Promise<string | void | Error> {

        try {

        logger.info(`DECRYPTION_KEY_ID = ${this.decryptionKeyID}`);
        logger.info(`JWKS_BUCKET_NAME = ${this.bucketName}`);
        console.log(`DECRYPTION_KEY_ID in handler = ${this.decryptionKeyID}`);
        console.log(`JWKS_BUCKET_NAME in handler = ${this.bucketName}`);


        if (this.decryptionKeyID === "NOT_SET" || this.bucketName === "NOT_SET") {
            logger.error({ message:"Environment variable DECRYPTION_KEY_ID or JWKS_BUCKET_NAME is not configured" });
            console.log("Environment variable DECRYPTION_KEY_ID or JWKS_BUCKET_NAME is not configured");
            throw new Error("Service incorrectly configured");
        }

        const body: JWKSBody = { keys: [] };

        logger.info({ message:"Building wellknown JWK endpoint with key " + this.decryptionKeyID });
        console.log("Building wellknown JWK endpoint with key " + this.decryptionKeyID);


        const decryptionJwk : Jwk | null = await this.getAsJwk(this.decryptionKeyID);

        if (decryptionJwk) {
            body.keys.push(decryptionJwk);

            const uploadParams = {
                Bucket: this.bucketName,
                Key: "jwks.json",
                Body: JSON.stringify(body),
                ContentType: "application/json",
            };

            logger.info(`uploadParams = ${JSON.stringify(uploadParams)}`);
            console.log(`uploadParams = ${JSON.stringify(uploadParams)}`);


                        try {
                            await this.s3Client.send(new PutObjectCommand(uploadParams));
                        } catch (err) {
                            logger.error({ message: "Error writing keys to S3 bucket" + err });
                            throw new Error("Error writing keys to S3 bucket");
                        }
                        logger.info(`body = ${JSON.stringify(body)}`);
                        console.log(`body = ${JSON.stringify(body)}`);
                        return JSON.stringify(body);
                        // return okay message - status 200
        }
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Unable to create JWKS file: ${error.message}`);
        } else {
            throw new Error(`Unable to create JWKS file: ${JSON.stringify(error)}`);
        }
    }

}

	async getAsJwk(keyId: string): Promise<Jwk | null> {
		let kmsKey;
		try {
			kmsKey = await this.kmsClient.getPublicKey({ KeyId: keyId });
			console.log("successfully obtained kmsKey = " + JSON.stringify(kmsKey));
		} catch (error) {
            console.log("In kms catch block");
			logger.warn({ message:"Failed to fetch key from KMS" }, { error });
			console.log("Failed to fetch key from KMS" + error);
			throw new Error(`Failed to fetch key from KMS: ${JSON.stringify(error)}`)
		};


		if (
			kmsKey != null &&
			        kmsKey.KeySpec != null &&
					kmsKey.KeyId != null &&
					kmsKey.PublicKey != null
		) {
            console.log("in kms null is NOT NULL thing");
			const publicKey = crypto
				.createPublicKey({
					key: kmsKey.PublicKey as Buffer,
					type: "spki",
					format: "der",
				})
				.export({ format: "jwk" });
				console.log(`!!!!!!!!!!!!!!!PUBLIC KEY = ${publicKey}`);
				const hashedKeyId : string = this.getHashedKid(keyId);
			return {
				...publicKey,
				use: "enc",
				kid: hashedKeyId,
				alg: "RSA_OAEP_256",
			} as unknown as Jwk;
		}
		logger.error({ message: "Failed to build JWK from key " + keyId  + " due to incomplete key obtained from KMS"});
		throw new Error("Failed to build JWK from key due to incomplete key obtained from KMS");
	}

    getHashedKid (kmsKeyId: string): string {
	    return crypto.createHash("sha256").update(kmsKeyId).digest().toString("hex");
    }
}

const DECRYPTION_KEY_ID: string = process.env.DECRYPTION_KEY_ID ?? "NOT_SET";
const JWKS_BUCKET_NAME : string = process.env.JWKS_BUCKET_NAME ?? "NOT_SET";
const KMS_CLIENT = new KMS({
    region: process.env.REGION,
});

const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, JWKS_BUCKET_NAME, KMS_CLIENT);
export const lambdaHandler = handlerClass.handler.bind(handlerClass);
