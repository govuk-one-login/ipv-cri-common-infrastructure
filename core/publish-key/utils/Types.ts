export interface JWKSBody {
    keys: Jwk[];
}

export interface Jwks {
    keys: Jwk[];
}

export interface Jwk extends JsonWebKey {
    alg: string;
    kid: string;
    kty: "RSA";
    use: "enc";
}
