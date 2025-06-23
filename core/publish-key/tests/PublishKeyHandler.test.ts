import { PublishKeyHandler, logger } from "../src/PublishKeyHandler";
import { Jwk } from "../utils/Types";
// import crypto, { KeyObject } from "crypto";
// import "aws-sdk-client-mock-jest";
import { expect, jest } from "@jest/globals";
import { mock } from "jest-mock-extended";
import { generateKeyPairSync, RSAKeyPairOptions } from "node:crypto";
import { mockClient } from "aws-sdk-client-mock";
// import { KMS } from "@aws-sdk/client-kms";
import * as AWS from "@aws-sdk/client-kms";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
jest.mock("crypto");
jest.mock("@aws-sdk/client-kms");

//
// const generateKeyPairSync = require("node:crypto").generateKeyPairSync;

// const nodeCrypto = await import('node:crypto');
// const awsSdkClientMock = await import("aws-sdk-client-mock").mockClient;
// const mockClient = await awsSdkClientMock.mockClient;

jest.mock("@aws-lambda-powertools/logger", () => ({
    Logger: jest.fn().mockImplementation(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
    })),
}));

jest.mock("crypto", () => ({
    // ...jest.requireActual("crypto"),
    createPublicKey: () => {
        return {
            export: () => "123456",
        };
    },
    createHash: () => {
        return {
            update: () => {
                return {
                    digest: () => "hashedKid",
                };
            },
        };
    },
}));

const keyID = "1234-56789-KeyId";

// const {
//     S3Client,
//     PutObjectCommand,
// } = require("@aws-sdk/client-s3");
// const {KMSClient} = require("@aws-sdk/client-kms");

describe("PublishKeyHandler", () => {
    const s3Mock = mockClient(S3Client);

    //     KMS.getPublicKey.mockReturnValue("test");
    //     const kmsMock = mockClient(KMSClient);
    const mockKmsClient = {
        getPublicKey: () => {
            return {
                $metadata: {
                    httpStatusCode: 200,
                    requestId: "cfc3d7ac-fa8c-4e3f-ab04-5aa1d6531f52",
                    attempts: 1,
                    totalRetryDelay: 0,
                },
                CustomerMasterKeySpec: "RSA_2048",
                EncryptionAlgorithms: ["RSAES_OAEP_SHA_1", "RSAES_OAEP_SHA_256"],
                KeyId: `arn:aws:kms:eu-west-2:0001:key/${keyID}`,
                KeySpec: "RSA_2048",
                KeyUsage: "ENCRYPT_DECRYPT",
                PublicKey: {
                    "0": 48,
                },
            };
        },
    } as unknown as AWS.KMS;

    // crypto.createPublicKey.mockReturnValue("");
    // crypto.export.mockImplementation(() => ({
    //     test: "json"
    // });

    // type PublicKeyInput = string | Buffer | KeyObject | JsonWebKey; // Define your input type
    //
    // const mockCreatePublicKey = jest.fn((publicKeyData: PublicKeyInput) => ({
    //   export: jest.fn(() => Promise.resolve("mocked-public-key-data")),
    //   verify: jest.fn(() => Promise.resolve(true)),
    // }));
    // crypto.mockImplementation(() => ({
    //     createPublicKey: jest.fn(),
    //     export: jest.fn()
    // });

    // jest.mock("@aws-sdk/client-kms", () => ({
    //     KMS: jest.fn().mockImplementation(() => ({
    //         getPublicKey: jest.fn().mockReturnValue(() => ({
    //             }) ,
    //     })),
    // }));

    const bucketName = "test_bucket_name";
    const hashedKeyID = "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08";

    // const { publicKey } = generateKeyPairSync("rsa", {
    //   modulusLength: 2048,
    //   publicKeyEncoding: {
    //     type: "spki",
    //     format: "der",
    //   },
    //   //         privateKeyEncoding : {
    //   //             type: "pkcs8"
    //   //         }
    // } as RSAKeyPairOptions<"der", "der">);

    // const expectedJwk : Jwk =  keys: [
    //                            					{
    //                            						alg: "RSA_OAEP_256",
    //                            						kid: hashedKeyID,
    //                            						kty: "RSA",
    //                            						use: "enc",
    //                            						n: expect.any(String),
    //                            						e: "AQAB",
    //                            					}] as Jwk;

    //     const expectedJwk = {
    //         "keys": [
    //             {
    //                 "kty": "RSA",
    //                 "n": expect.any(String),
    //                 "e": "AQAB",
    //                 "use:": "enc",
    //                 "kid": hashedKeyID,
    //                 "alg": "RSA_OAEP_256"
    //
    //
    //             }
    //         ]
    //     };

    beforeEach(() => {
        s3Mock.reset();
    });

    describe("#handler", () => {
        //         it("throws error if environment variables are missing", async () => {
        //             const handlerClass = new PublishKeyHandler("NOT_SET", bucketName);
        //
        //             await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
        //                 message: "Unable to create JWKS file: Service incorrectly configured",
        //             }));
        //             expect(logger.error).toHaveBeenCalledWith({message: "Environment variable DECRYPTION_KEY_ID or JWKS_BUCKET_NAME is not configured"});
        //         });

        it("uploads keys to s3", async () => {
            const handlerClass: PublishKeyHandler = new PublishKeyHandler(keyID, bucketName, mockKmsClient);

            const result: string | void | Error = await handlerClass.handler();

            console.log("result", result);

            expect(logger.info).toHaveBeenCalledWith({
                message: "Building wellknown JWK endpoint with key " + [keyID],
            });

            //             const expectedPublicKey = crypto
            //                 .createPublicKey({
            //                     key: publicKey,
            //                     type: "spki",
            //                     format: "der",
            //                 })
            //                 .export({format: "jwk"});

            //             const expectedJwk = {
            //                 ...expectedPublicKey,
            //                 use: "enc",
            //                 kid: hashedKeyID,
            //                 alg: "RSA_OAEP_256",
            //             } as unknown as Jwk;

            //             const getPublicKey = jest.fn().mockReturnValue({
            //                    CustomerMasterKeySpec: "RSA_2048",
            //                    KeySpec: "RSA_2048",
            //                    EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
            //                    KeyId: keyID,
            //                    KeyUsage: "ENCRYPT_DECRYPT",
            //                    PublicKey: expectedPublicKey,
            //                });

            //             expect(s3Mock).toHaveReceivedNthCommandWith(1, PutObjectCommand,
            //                 {
            //                     Bucket: bucketName,
            //                     Key: "jwks.json",
            //                     Body: JSON.stringify({
            //                         "keys": [
            //                             expectedJwk,
            //                         ]
            //                     }),
            //                     ContentType: "application/json"
            //                 });
        });
    });

    //     describe("#getAsJwk", () => {
    //         it("gets the kms key with the given KeyId and returns jwk with public key", async () => {
    //                          const expectedPublicKey = crypto
    //                              .createPublicKey({
    //                                  key: publicKey,
    //                                  type: "spki",
    //                                  format: "der",
    //                              })
    //                              .export({format: "jwk"});
    //
    //                                     		const getPublicKey = jest.fn().mockReturnValue({
    //                                                    CustomerMasterKeySpec: "RSA_2048",
    //                                                    KeySpec: "RSA_2048",
    //                                                    EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
    //                                                    KeyId: keyID,
    //                                                    KeyUsage: "ENCRYPT_DECRYPT",
    //                                                    PublicKey: expectedPublicKey,
    //                                                })
    //
    //             const handlerClass = new PublishKeyHandler(keyID, bucketName);
    //
    //
    //
    //
    //
    // //             jest.mock("@aws-sdk/client-kms", () => ({
    // //             	kmsMock: jest.fn().mockImplementation(() => ({
    // //             		getPublicKey: jest.fn().mockReturnValue({
    // //                            CustomerMasterKeySpec: "RSA_2048",
    // //                            KeySpec: "RSA_2048",
    // //                            EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
    // //                            KeyId: DECRYPTION_KEY_ID,
    // //                            KeyUsage: "ENCRYPT_DECRYPT",
    // //                            PublicKey: expectedPublicKey,
    // //                        }),
    // //             	})),
    // //             }));
    // //             kmsMock.on(GetPublicKeyCommand).resolves({
    // //                 CustomerMasterKeySpec: "RSA_2048",
    // //                 KeySpec: "RSA_2048",
    // //                 EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
    // //                 KeyId: keyID,
    // //                 KeyUsage: "ENCRYPT_DECRYPT",
    // //                 PublicKey: publicKey,
    // //             });
    //
    //             await handlerClass.handler();
    //
    //
    //             expect(getPublicKey).toHaveBeenCalledWith({KeyId: "1234-56789-KeyId"});
    //             // 			expect(kmsMock.GetPublicKeyCommand).toEqual
    //             // 			({
    //             //             				key: "123456789",
    //             //             				use: "enc",
    //             //             				kid: "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08",
    //             //             				alg: "RSA_OAEP_256",
    //             //             			});
    //             // 			expect(handlerClass.crypto.createPublicKey).toHaveBeenCalledWith({
    //             // 				key: publicKey as unknown as Buffer,
    //             // 				type: "spki",
    //             // 				format: "der",
    //             // 			});
    //             // 			expect(result).toEqual({
    //             // 				key: "123456789",
    //             // 				use: "enc",
    //             // 				kid: "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08",
    //             // 				alg: "RSA_OAEP_256",
    //             // 			} as unknown as Jwk);
    //         });
    //         //
    //         it("logs error if no key is fetched", async () => {
    //             const DECRYPTION_KEY_ID = "1234-56789-KeyId";
    //             const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
    //             const getPublicKey = jest.fn().mockReturnValue(null);
    // //             jest.spyOn(handlerClass.kmsClient, "getPublicKey").mockImplementationOnce(() => null);
    //
    //             // 			await handlerClass.getAsJwk(DECRYPTION_KEY_ID);
    //
    //             await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
    //                 message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
    //                 // 				statusCode: HttpCodesEnum.SERVER_ERROR,
    //             }));
    //
    //             expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key 1234-56789-KeyId due to incomplete key obtained from KMS"});
    //         });
    //         //
    //         it("logs error if fetched key does not contain KeySpec", async () => {
    //             const DECRYPTION_KEY_ID = "1234-56789-KeyId";
    //             const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
    //             const invalidKey = {
    //                 EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
    //                 KeyId: keyID,
    //                 KeyUsage: "ENCRYPT_DECRYPT",
    //                 PublicKey: publicKey,
    //             }
    //             // pragma: allowlist nextline secret
    //             // 			const publicKey = "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAES4sDJifz8h3GDznZZ6NC3QN5qlQn8Zf2mck4yBmlwqvXzZu7Wkwc4QuOxXhGHXamfkoG5d0UJVXJwwvFxiSzRQ==";
    //             const getPublicKey = jest.fn().mockReturnValue(invalidKey);
    //
    //             await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
    //                 message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
    //                 // 				statusCode: HttpCodesEnum.SERVER_ERROR,
    //             }));
    //
    //             expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key " + DECRYPTION_KEY_ID + " due to incomplete key obtained from KMS"});
    //         });
    //         //
    //         it("logs error if fetched key does not contain KeyId", async () => {
    //             const DECRYPTION_KEY_ID = "1234-56789-KeyId";
    //             const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
    //             const getPublicKey = jest.fn().mockReturnValue({
    //                 KeySpec: "RSA_2048",
    //                 KeyUsage: "ENCRYPT_DECRYPT",
    //                 PublicKey: publicKey,
    //             });
    //
    //             await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
    //                 message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
    //                 // 				statusCode: HttpCodesEnum.SERVER_ERROR,
    //             }));
    //
    //             expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key " + keyID + " due to incomplete key obtained from KMS"});
    //         });
    //         //
    //         it("logs error if fetched key does not contain PublicKey", async () => {
    //             const DECRYPTION_KEY_ID = "1234-56789-KeyId";
    //             const handlerClass = new PublishKeyHandler(DECRYPTION_KEY_ID, "test_bucket_name");
    //             const invalidKey = {
    //                CustomerMasterKeySpec: "RSA_2048",
    //                KeySpec: "RSA_2048",
    //                EncryptionAlgorithms: ["RSAES_OAEP_SHA_256"],
    //                KeyId: keyID,
    //                KeyUsage: "ENCRYPT_DECRYPT",
    //            }
    //             			const getPublicKey = jest.fn().mockReturnValue(invalidKey);
    //
    //
    //             await expect(handlerClass.handler()).rejects.toThrow(expect.objectContaining({
    //                 message: "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
    //                 // 				statusCode: HttpCodesEnum.SERVER_ERROR,
    //             }));
    //
    //             expect(logger.error).toHaveBeenCalledWith({message: "Failed to build JWK from key " + DECRYPTION_KEY_ID + " due to incomplete key obtained from KMS"})
    //         });
    //     });
});
