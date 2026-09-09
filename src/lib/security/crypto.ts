import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

// 32-byte master key from environment or deterministic local dev fallback
function getMasterKey(): Buffer {
  const envKey = process.env.FINANCE_ENCRYPTION_KEY;
  if (envKey && envKey.length === 64) {
    return Buffer.from(envKey, 'hex');
  }
  // Deterministic 32-byte key for local development demonstration
  return crypto.createHash('sha256').update(process.env.NEXTAUTH_SECRET || 'pup-access-vault-master-key-2026').digest();
}

export interface EncryptedContainer {
  iv: string;         // Base64
  ciphertext: string; // Base64
  tag: string;        // Base64
  keyVersion: number;
}

export interface DisbursementData {
  payeeName: string;
  accountType: 'GCASH' | 'LANDBANK' | 'BDO' | 'OTHER_BANK' | 'CASH';
  accountNumber: string;
  phoneNumber?: string;
  studentNumber?: string;
}

/**
 * Encrypts sensitive disbursement PII (bank/GCash numbers) using AES-256-GCM.
 * Operates in-process at zero external KMS cost.
 */
export function encryptDisbursementData(data: DisbursementData): string {
  const key = getMasterKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const jsonStr = JSON.stringify(data);
  let encrypted = cipher.update(jsonStr, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag().toString('base64');

  const container: EncryptedContainer = {
    iv: iv.toString('base64'),
    ciphertext: encrypted,
    tag,
    keyVersion: 1,
  };

  return JSON.stringify(container);
}

/**
 * Decrypts sensitive disbursement data in server memory only.
 */
export function decryptDisbursementData(payloadJson: string): DisbursementData {
  try {
    const { iv, ciphertext, tag }: EncryptedContainer = JSON.parse(payloadJson);
    const key = getMasterKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return {
      payeeName: '[Decryption Error]',
      accountType: 'OTHER_BANK',
      accountNumber: '****-****',
    };
  }
}

/**
 * Generates an immutable SHA-256 hash chaining back to the previous audit block.
 */
export function generateAuditHash(
  prevHash: string,
  trackingNumber: string,
  amount: number,
  timestamp: string,
  certifierId: string
): string {
  return crypto
    .createHash('sha256')
    .update(`${prevHash}:${trackingNumber}:${amount.toFixed(2)}:${timestamp}:${certifierId}`)
    .digest('hex');
}

/**
 * Generates an HMAC-SHA256 signature for approval verification.
 */
export function generateApprovalSignature(
  txId: string,
  approverId: string,
  tier: string,
  timestamp: string
): string {
  const key = getMasterKey();
  return crypto
    .createHmac('sha256', key)
    .update(`${txId}:${approverId}:${tier}:${timestamp}`)
    .digest('hex');
}
