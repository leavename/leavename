import CryptoJS from 'crypto-js';
import {PBKDF2_ITERATION} from "./constants";
import {box, randomBytes} from 'tweetnacl';
import {
    decodeUTF8,
    encodeUTF8,
    encodeBase64,
    decodeBase64
} from 'tweetnacl-util';

export const symmetricEncrypt = (plaintext, password) => {
    if (!plaintext) {
        throw new Error('Plaintext is empty');
    }
    const encoded = JSON.stringify(plaintext);

    // key derivation using PBKDF2
    const salt = CryptoJS.lib.WordArray.random(16);
    const secretKey = CryptoJS.PBKDF2(password, salt, {keySize: 4, iterations: PBKDF2_ITERATION});

    // encrypt with AES-CBC
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(encoded, secretKey, {iv});

    // sign with HMAC-SHA256
    const hmac = CryptoJS.HmacSHA256(encoded, secretKey);
    return `${salt}${iv}${hmac}${encrypted.toString()}`
}

export const symmetricDecrypt = (result, password) => {
    // extract salt, initial vector, HMAC and ciphertext from `symmetricEncrypt()`
    const salt = CryptoJS.enc.Hex.parse(result.slice(0, 32));
    const iv = CryptoJS.enc.Hex.parse(result.slice(32, 64));
    const expectedHmac = result.slice(64, 128);
    const ciphertext = result.slice(128, result.length);

    // key derivation and decrypt
    const secretKey = CryptoJS.PBKDF2(password, salt, {keySize: 4, iterations: PBKDF2_ITERATION});
    const plaintext = CryptoJS.AES.decrypt(ciphertext, secretKey, {iv});

    // TODO: Compare HMAC before the utf-8 encode
    try {
        const plaintextUtf = plaintext.toString(CryptoJS.enc.Utf8);
        const decryptedHmac = CryptoJS.HmacSHA256(plaintextUtf, secretKey).toString();
        return expectedHmac === decryptedHmac ? JSON.parse(plaintextUtf): null;
    } catch {
        return null;
    }
}

export const asymmetricEncrypt = (plaintext, clientPub, serverPub) => {
    if (!plaintext) {
        throw new Error('Plaintext is empty');
    }
    const messageUint8 = decodeUTF8(JSON.stringify(plaintext));

    const ephemeralKeyPair1 = box.keyPair();
    const nonce1 = randomBytes(box.nonceLength);
    const result1 = new Uint8Array([
        ...nonce1,
        ...ephemeralKeyPair1.publicKey,
        ...box(messageUint8, nonce1, clientPub, ephemeralKeyPair1.secretKey)
    ]);

    const ephemeralKeyPair2 = box.keyPair();
    const nonce2 = randomBytes(box.nonceLength);
    const result2 = new Uint8Array([
        ...nonce2,
        ...ephemeralKeyPair2.publicKey,
        ...box(result1, nonce2, serverPub, ephemeralKeyPair2.secretKey)
    ]);
    return encodeBase64(result2);
}


export const asymmetricDecrypt = (result, clientSecret, serverSecret) => {
    const nonceLength = box.nonceLength;
    const pubKeyLength = box.publicKeyLength;

    const result2 = decodeBase64(result);

    const ciphertext2 = result2.slice(nonceLength + pubKeyLength, result2.length);
    const nonce2 = result2.slice(0, nonceLength);
    const pubKey2 = result2.slice(nonceLength, nonceLength + pubKeyLength);
    const result1 = box.open(ciphertext2, nonce2, pubKey2, serverSecret);

    const ciphertext1 = result1.slice(nonceLength + pubKeyLength, result1.length);
    const nonce1 = result1.slice(0, nonceLength);
    const pubKey1 = result1.slice(nonceLength, nonceLength + pubKeyLength);

    const plaintext = box.open(ciphertext1, nonce1, pubKey1, clientSecret);
    return plaintext ? JSON.parse(encodeUTF8(plaintext)) : null;
}
