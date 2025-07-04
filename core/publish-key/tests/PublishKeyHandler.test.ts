import { PublishKeyHandler } from "../src/PublishKeyHandler";
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
        debug: (x: any) => console.log(x),
    })),
}));

const keyID = "1234-56789-KeyId";
const mockedHashedKid = "2f572216be9732645402b591d4bebbc2fc6f10749d73fc22aaec1fa2f11fbc08"; //pragma: allowlist secret
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
                return mockPublicKey;
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

    describe("AWS Service Errors", () => {
        it("handle any errors from kmsClient getPublicKey", async () => {
            const invalidMockKmsClient = {
                getPublicKey: () => {
                    throw new Error("TEST ERROR");
                },
            } as unknown as AWS.KMS;

            const publishKeyHandler = new PublishKeyHandler(keyID, bucketName, invalidMockKmsClient);

            expect.assertions(1);
            try {
                await publishKeyHandler.handler(
                    {} as Record<string, unknown>,
                    { functionName: "test", functionVersion: "1" } as Context,
                );
            } catch (error) {
                expect(error).toEqual(
                    new Error("Unable to create JWKS file: Failed to fetch key from KMS: TEST ERROR"),
                );
            }
        });

        it("handle any null key from kmsClient getPublicKey", async () => {
            const invalidMockKmsClient = {
                getPublicKey: () => {
                    return undefined;
                },
            } as unknown as AWS.KMS;

            const publishKeyHandler = new PublishKeyHandler(keyID, bucketName, invalidMockKmsClient);

            expect.assertions(1);
            try {
                await publishKeyHandler.handler(
                    {} as Record<string, unknown>,
                    { functionName: "test", functionVersion: "1" } as Context,
                );
            } catch (error) {
                expect(error).toEqual(
                    new Error(
                        "Unable to create JWKS file: Failed to build JWK from key due to incomplete key obtained from KMS",
                    ),
                );
            }
        });

        it("handle any errors from kmsClient getPublicKey", async () => {
            const expectedJwk = {
                ...mockPublicKey,
                use: "enc",
                kid: mockedHashedKid,
                alg: "RSA_OAEP_256",
            } as unknown as Jwk;

            const expectedJWKSet = {
                keys: [expectedJwk],
            };

            s3Mock.on(PutObjectCommand).callsFake(() => {
                throw new Error("S3 Upload Error");
            });

            const publishKeyHandler: PublishKeyHandler = new PublishKeyHandler(keyID, bucketName, mockKmsClient);

            expect.assertions(3);
            let result: string | undefined;
            try {
                result = await publishKeyHandler.handler(
                    {} as Record<string, unknown>,
                    { functionName: "test", functionVersion: "1" } as Context,
                );
            } catch (error) {
                expect(error).toEqual(new Error("Unable to create JWKS file: S3 Upload Error"));
            }

            expect(s3Mock).toHaveReceivedNthCommandWith(1, PutObjectCommand, {
                Bucket: bucketName,
                Key: "jwks.json",
                Body: JSON.stringify(expectedJWKSet),
                ContentType: "application/json",
            });

            expect(result).toBeUndefined();
        });
    });
});
