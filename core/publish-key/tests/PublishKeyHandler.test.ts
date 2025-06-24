import { PublishKeyHandler, logger } from "../src/PublishKeyHandler";

import { expect, jest } from "@jest/globals";

import { mockClient } from "aws-sdk-client-mock";

import "aws-sdk-client-mock-jest";

import * as AWS from "@aws-sdk/client-kms";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { Jwk } from "../utils/Types";

import { Context } from "aws-lambda";

jest.mock("crypto");

jest.mock("@aws-sdk/client-kms");

jest.mock("@aws-lambda-powertools/logger", () => ({
    Logger: jest.fn().mockImplementation(() => ({
        info: (x: any) => console.log(x),
        error: (x: any) => console.log(x),
        warn: (x: any) => console.log(x),
    })),
}));

const keyID = "1234-56789-KeyId";

const mockedHashedKid = "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08";

const bucketName = "test_bucket_name";

const mockPublicKey = {
    kty: "RSA",
    n: "nnnnnnnnnnnnnnnnnnnnnnnnnn",
    e: "AQAB",
};

jest.mock("crypto", () => ({
    createPublicKey: () => {
        return {
            export: () => {
                return mockPublicKey; // Mock
            },
        };
    },
    createHash: () => {
        return {
            update: () => {
                return {
                    digest: () => mockedHashedKid,
                };
            },
        };
    },
}));

describe("Tests", () => {
    const s3Mock = mockClient(S3Client);

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
                    "0": 48, // Mocked buffer
                },
            };
        },
    } as unknown as AWS.KMS;

    beforeEach(() => {
        s3Mock.reset();
    });

    describe("#handler happy path", () => {
        it("Should upload keys to s3", async () => {
            const expectedJwk = {
                ...mockPublicKey,
                use: "enc",
                kid: mockedHashedKid,
                alg: "RSA_OAEP_256",
            } as unknown as Jwk;

            const expectedJWKSet = {
                keys: [expectedJwk],
            };

            const publishKeyHandler: PublishKeyHandler = new PublishKeyHandler(keyID, bucketName, mockKmsClient);

            const result: string | undefined = await publishKeyHandler.handler(
                {} as Record<string, unknown>,
                { functionName: "test", functionVersion: "1" } as Context,
            );

            expect(result).toEqual("Success");

            expect(s3Mock).toHaveReceivedNthCommandWith(1, PutObjectCommand, {
                Bucket: bucketName,
                Key: "jwks.json",
                Body: JSON.stringify(expectedJWKSet),
                ContentType: "application/json",
            });
        });
    });

    describe("#handler env variables not set", () => {
        it("throws error if Key ID variable is missing", () => {
            expect(() => {
                new PublishKeyHandler(undefined, bucketName, mockKmsClient);
            }).toThrow("Key ID is missing");
        });

        it("throws error if bucketName variable is missing", () => {
            expect(() => {
                new PublishKeyHandler(keyID, undefined, mockKmsClient);
            }).toThrow("bucketName is missing");
        });

        it("throws error if kmsClient variable is missing", () => {
            expect(() => {
                new PublishKeyHandler(keyID, bucketName, undefined);
            }).toThrow("kmsClient is missing");
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
