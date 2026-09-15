import crypto from 'crypto';

// Gunakan environment variable jika ada, jika tidak gunakan fallback 32 bytes
const SECRET_KEY = process.env.QR_SECRET_KEY || 'bimbel-sync-super-secret-key-32b'; 

export function encryptQrData(payload: object): string {
  try {
    const text = JSON.stringify(payload);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY.padEnd(32, '0').slice(0, 32)), iv);
    
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    
    // Format: iv:encryptedData
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (error) {
    console.error("Encryption error:", error);
    return "";
  }
}

export function decryptQrData(encryptedText: string): any {
  try {
    const textParts = encryptedText.split(':');
    if (textParts.length !== 2) return null;
    
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = Buffer.from(textParts[1], 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY.padEnd(32, '0').slice(0, 32)), iv);
    
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
}
