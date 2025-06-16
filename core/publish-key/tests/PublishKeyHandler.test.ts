import {PublishKeyHandler, logger} from "../src/PublishKeyHandler";
import {Jwk} from "../utils/Types";
import crypto from "crypto";
import "aws-sdk-client-mock-jest";
// import * as AWS from "@aws-sdk/client-kms";

const generateKeyPairSync = require("node:crypto").generateKeyPairSync;

jest.mock("@aws-lambda-powertools/logger", () => ({
    Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    })),
}));

// jest.mock("@aws-sdk/client-kms", () => ({
// 	KMS: jest.fn().mockImplementation(() => ({
// 		getPublicKey: jest.fn(),
// 	})),
// }));

// jest.mock("crypto", () => ({
// 	createPublicKey: jest.fn().mockImplementation(() => ({
// 		export: jest.fn().mockImplementation(() => ({
// 			key: "123456789",
// 		})),
// 	})),
// }));

// jest.mock("@aws-sdk/client-s3", () => ({
// 	S3Client: jest.fn().mockImplementation(() => ({
// 		send: jest.fn(),
// 	})),
// 	PutObjectCommand: jest.fn().mockImplementation((args) => args),
// }));

const mockClient = require("aws-sdk-client-mock").mockClient;
const {
    S3Client,
    GetObjectCommand,
    PutObjectCommand,
    NoSuchKey,
    S3ServiceException,
} = require("@aws-sdk/client-s3");
const {KMSClient, GetPublicKeyCommand} = require("@aws-sdk/client-kms");

describe("PublishKeyHandler", () => {
    const s3Mock = mockClient(S3Client);
    const kmsMock = mockClient(KMSClient);

    const keyID = "1234-56789-KeyId";
    const bucketName = "test_bucket_name";
    const hashedKeyID = "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08";

    const {publicKey} = generateKeyPairSync("rsa", {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: "spki",
            format: "der",
        },
    });

    //         const expectedJwk : Jwk =  keys: [
    //                                    					{
    //                                    						alg: "RSA_OAEP_256",
    //                                    						kid: hashedKeyID,
    //                                    						kty: "RSA",
    //                                    						use: "enc",
    //                                    						n: expect.any(String),
    //                                    						e: "AQAB",
    //                                    					}] as Jwk;

    const expectedJwk = {
        "keys": [
            {
                "kty": "RSA",
                "n": expect.any(String),
                "e": "AQAB",
                "use:": "enc",
                "kid": hashedKeyID,
                "alg": "RSA_OAEP_256"


            }
        ]
    };


    beforeEach(() => {
        s3Mock.reset();
        kmsMock.reset();
    });

    describe("#handler", () => {
        it("throws error if environment variables are missing", async () => {
            const handlerClass = new PublishKeyHandler("NOT_SET", bucketName);

            await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
                message: "Unable to create JWKS file: Service incorrectly configured",
                // 				statusCode: HttpCodesEnum.SERVER_ERROR,
            }));
            expect(logger.error).toHaveBeenCalledWith({message: "Environment variable DECRYPTION_KEY_ID or JWKS_BUCKET_NAME is not configured"});
        });

        it("uploads keys to s3", async () => {
            const handlerClass: PublishKeyHandler = new PublishKeyHandler(keyID, bucketName);
            const testPublicKey = publicKey;

            kmsMock.on(GetPublicKeyCommand).resolves({
                CustomerMasterKeySpec: "RSA_2048",
                KeySpec: "RSA_2048",
                EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
                KeyId: keyID,
                KeyUsage: "ENCRYPT_DECRYPT",
                PublicKey: testPublicKey,
            });

            //             const PutObjectCommand = jest.fn();
            //             const nField : string = Any<String>;
            //             jest.spyOn(handlerClass)
            await handlerClass.handler();

            //             const receivedCommand = s3Mock.mock.calls[0][0];
            //             const receivedBody = JSON.parse(receivedCommand.Body);
            //             expect(receivedBody).toMatchObject({
            //                              keys: expect.arrayContaining([
            //                                  expect.objectContaining({
            //
            //                                                                         kty: "RSA",
            //                                                                         n: expect.any(String),
            //                                                                         e: "AQAB",
            //                                                                         use: "enc",
            //                                                                         kid: hashedKeyID,
            //                                                    						alg: "RSA_OAEP_256"
            //
            //                                                                     })
            //
            //                                                                    ]),
            //                 });


            expect(logger.info).toHaveBeenCalledWith({message: "Building wellknown JWK endpoint with key " + [keyID]});

            const expectedPublicKey = crypto
                .createPublicKey({
                    key: testPublicKey,
                    type: "spki",
                    format: "der",
                })
                .export({format: "jwk"});


            const expectedJwk = {
                ...expectedPublicKey,
                use: "enc",
                kid: hashedKeyID,
                alg: "RSA_OAEP_256",
            } as unknown as Jwk;

            expect(s3Mock).toHaveReceivedNthCommandWith(1, PutObjectCommand,
                {
                    Bucket: bucketName,
                    Key: "racheljwks.json",
                    Body: JSON.stringify({
                        "keys": [
                            expectedJwk,
                        ]
                    }),
                    ContentType: "application/json"
                });
        });
    });


    describe("#getAsJwk", () => {
        it("gets the kms key with the given KeyId and returns jwk with public key", async () => {
            const DECRYPTION_KEY_ID = "1234-56789-KeyId";
            const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
            // pragma: allowlist nextline secret
            // 			const publicKey = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAES4sDJifz8h3GDznZZ6NC3QN5qlQn8Zf2mck4yBmlwqvXzZu7Wkwc4QuOxXhGHXamfkoG5d0UJVXJwwvFxiSzRQ==";
            // 			jest.spyOn(handlerClass.kmsClient, "getPublicKey").mockImplementationOnce(() => ({
            // 				KeySpec: "RSA_2048",
            // 				KeyId: DECRYPTION_KEY_ID,
            // 				KeyUsage: "ENCRYPT_DECRYPT",
            // 				PublicKey: publicKey,
            // 			}));

            //             kmsMock.on(GetPublicKeyCommand).resolves({
            //                 CustomerMasterKeySpec: "RSA_2048",
            //                 KeySpec: "RSA_2048",
            //                 EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
            //                 KeyId: keyID,
            //                 KeyUsage: "ENCRYPT_DECRYPT",
            //                 PublicKey: publicKey,
            //             });

            //         const createPublicKey = jest.fn();
            kmsMock.on(GetPublicKeyCommand).resolves({
                CustomerMasterKeySpec: "RSA_2048",
                KeySpec: "RSA_2048",
                EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
                KeyId: keyID,
                KeyUsage: "ENCRYPT_DECRYPT",
                PublicKey: publicKey,
            });

            await handlerClass.handler();

            expect(kmsMock).toHaveReceivedCommandWith(GetPublicKeyCommand, {KeyId: "1234-56789-KeyId"});
            // 			expect(kmsMock.GetPublicKeyCommand).toEqual
            // 			({
            //             				key: "123456789",
            //             				use: "enc",
            //             				kid: "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08",
            //             				alg: "RSA_OAEP_256",
            //             			});
            // 			expect(handlerClass.crypto.createPublicKey).toHaveBeenCalledWith({
            // 				key: publicKey as unknown as Buffer,
            // 				type: "spki",
            // 				format: "der",
            // 			});
            // 			expect(result).toEqual({
            // 				key: "123456789",
            // 				use: "enc",
            // 				kid: "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08",
            // 				alg: "RSA_OAEP_256",
            // 			} as unknown as Jwk);
        });
        //
        it("logs error if no key is fetched", async () => {
            const DECRYPTION_KEY_ID = "1234-56789-KeyId";
            const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
            jest.spyOn(handlerClass.kmsClient, "getPublicKey").mockImplementationOnce(() => null);

            // 			await handlerClass.getAsJwk(DECRYPTION_KEY_ID);

            await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
                message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
                // 				statusCode: HttpCodesEnum.SERVER_ERROR,
            }));

            expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key 1234-56789-KeyId due to incomplete key obtained from KMS"});
        });
        //
        it("logs error if fetched key does not contain KeySpec", async () => {
            const DECRYPTION_KEY_ID = "1234-56789-KeyId";
            const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
            // pragma: allowlist nextline secret
            // 			const publicKey = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAES4sDJifz8h3GDznZZ6NC3QN5qlQn8Zf2mck4yBmlwqvXzZu7Wkwc4QuOxXhGHXamfkoG5d0UJVXJwwvFxiSzRQ==";
            kmsMock.on(GetPublicKeyCommand).resolves({
                EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
                KeyId: keyID,
                KeyUsage: "ENCRYPT_DECRYPT",
                PublicKey: publicKey,
            });
            //
            await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
                message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
                // 				statusCode: HttpCodesEnum.SERVER_ERROR,
            }));

            expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key " + DECRYPTION_KEY_ID + " due to incomplete key obtained from KMS"});
        });
        //
        it("logs error if fetched key does not contain KeyId", async () => {
            const DECRYPTION_KEY_ID = "1234-56789-KeyId";
            const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
            jest.spyOn(handlerClass.kmsClient, "getPublicKey").mockImplementationOnce(() => ({
                KeySpec: "RSA_2048",
                KeyUsage: "ENCRYPT_DECRYPT",
                PublicKey: publicKey,
            }));

            await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
                message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
                // 				statusCode: HttpCodesEnum.SERVER_ERROR,
            }));

            expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key " + keyID + " due to incomplete key obtained from KMS"});
        });
        //
        it("logs error if fetched key does not contain PublicKey", async () => {
            const DECRYPTION_KEY_ID = "1234-56789-KeyId";
            const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
            // 			jest.spyOn(handlerClass.kmsClient, "getPublicKey").mockImplementationOnce(() => ({
            // 				KeySpec: "RSA_2048",
            // 				KeyUsage: "ENCRYPT_DECRYPT",
            // 				KeyId: DECRYPTION_KEY_ID,
            // 			}));

            kmsMock.on(GetPublicKeyCommand).resolves({
                CustomerMasterKeySpec: "RSA_2048",
                KeySpec: "RSA_2048",
                EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
                KeyId: keyID,
                KeyUsage: "ENCRYPT_DECRYPT",
            });

            await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
                message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
                // 				statusCode: HttpCodesEnum.SERVER_ERROR,
            }));

            expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key " + DECRYPTION_KEY_ID + " due to incomplete key obtained from KMS"})
        });
    });
});


