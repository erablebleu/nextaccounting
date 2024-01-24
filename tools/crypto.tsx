
import crypto from 'crypto';

const algorithm = 'aes-256-ctr'
const ENCRYPTION_KEY = Buffer.concat([Buffer.from( process.env.NEXTAUTH_SECRET as string), Buffer.alloc(32)], 32)
const IV = "1f48edb17632972e";

export function encrypt(text: string) {
    let cipher = crypto.createCipheriv(algorithm, ENCRYPTION_KEY, IV)
    let encrypted = cipher.update(text)
    encrypted = Buffer.concat([encrypted, cipher.final()])
    return encrypted.toString('hex')
}

export function decrypt(text: string) {
    let encryptedText = Buffer.from(text, 'hex');
    let decipher = crypto.createDecipheriv(algorithm, ENCRYPTION_KEY, IV)
    let decrypted = decipher.update(encryptedText)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}