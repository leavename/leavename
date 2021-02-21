import {asymmetricEncrypt, asymmetricDecrypt, symmetricEncrypt, symmetricDecrypt} from "./cryptography";
import {box} from 'tweetnacl';

it('opens tweetnacl box', () => {
    const clientKeyPair = box.keyPair();
    const serverKeyPair = box.keyPair();
    const [cp, sp, cs, ss] = [
        clientKeyPair.publicKey,
        serverKeyPair.publicKey,
        clientKeyPair.secretKey,
        serverKeyPair.secretKey
    ]
    expect(asymmetricDecrypt(asymmetricEncrypt(42, cp, sp), cs, ss)).toStrictEqual(42);
    expect(asymmetricDecrypt(asymmetricEncrypt('foo', cp, sp), cs, ss)).toBe('foo');
    expect(asymmetricDecrypt(asymmetricEncrypt([1, 2, 3], cp, sp), cs, ss)).toStrictEqual([1, 2, 3]);
    expect(asymmetricDecrypt(asymmetricEncrypt({foo: 'bar'}, cp, sp), cs, ss)).toStrictEqual({foo: 'bar'});
    expect(() => asymmetricEncrypt(null, cp, sp)).toThrow('Plaintext is empty');
    expect(() => asymmetricEncrypt(undefined, cp, sp)).toThrow('Plaintext is empty');
});

it('symmetric encrypts text', () => {
    expect(symmetricDecrypt(symmetricEncrypt('foo', 'password'), 'password')).toBe('foo');
    expect(symmetricDecrypt(symmetricEncrypt(1, 'password'), 'password')).toBe(1);
});

it('passes end to end test', () => {
    const shopSecretKey = Uint8Array.from(
        atob('hG8cYYbh7ZPE25E1Rcv8M27WWIU7GJ/lGDXt10eC3R0='), c => c.charCodeAt(0))
    const serverSecretKey = Uint8Array.from(
        atob('HFqu3lEqejEZVHq1CqqSkSRUmyznPRTA7VoGG72uBQg='), c => c.charCodeAt(0))
    const ciphertext = 'wd8PYfi7pC94wUVoZOzBEmfZBqUv4itC93jJNcoDyJJAmG/kuRCnMIHcib5Flc9BJl2K1NgKD2/' +
        'rjSagi7GuQgkKOc+7xZI7JnT6IJIZxb47fs1irL7+SyCZWvbxTIDuSZvqkXzmjDk2KyNw98FzaqFBuAxq454hEgUA' +
        '5d66EDvqvJZtn4hzZvrVy+C5wJ3ufXQNazOu3Iu+cr0BB564zHBBUok5RtIcAgVXbVJTl0dtZahWPP3UcoNvgZB/emjTHRiMKUE9Kg==';
    expect(asymmetricDecrypt(ciphertext, shopSecretKey, serverSecretKey))
        .toStrictEqual({name: 'foo bar', phone: "12345678", version: "1.0.0"});
})