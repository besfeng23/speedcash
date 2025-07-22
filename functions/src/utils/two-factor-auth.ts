import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';

const db = admin.firestore();

export interface TOTPConfig {
  issuer: string;
  algorithm: 'sha1' | 'sha256' | 'sha512';
  digits: number;
  period: number;
  window: number; // Number of time steps to allow for clock skew
}

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export class TwoFactorAuth {
  private config: TOTPConfig;

  constructor(config: Partial<TOTPConfig> = {}) {
    this.config = {
      issuer: 'CPay',
      algorithm: 'sha1',
      digits: 6,
      period: 30,
      window: 1,
      ...config
    };
  }

  /**
   * Generate a new TOTP secret for a user
   */
  generateSecret(_userId: string, userEmail: string): TwoFactorSecret {
    // Generate a random secret using speakeasy
    const secret = speakeasy.generateSecret({
      name: userEmail,
      issuer: this.config.issuer,
      length: 32
    });
    
    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    
    // Generate QR code URL for authenticator apps
    const qrCodeUrl = speakeasy.otpauthURL({
      secret: secret.base32,
      label: userEmail,
      issuer: this.config.issuer,
      algorithm: this.config.algorithm,
      digits: this.config.digits,
      period: this.config.period
    });
    
    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Verify a TOTP token
   */
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: this.config.window,
      algorithm: this.config.algorithm,
      digits: this.config.digits
    });
  }

  /**
   * Verify a backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return false;
    }
    
    const userData = doc.data()!;
    const backupCodes = userData.backupCodes || [];
    
    // Check if code exists and hasn't been used
    const codeIndex = backupCodes.findIndex((bc: any) => bc.code === code && !bc.used);
    
    if (codeIndex === -1) {
      return false;
    }
    
    // Mark code as used
    backupCodes[codeIndex].used = true;
    backupCodes[codeIndex].usedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await userRef.update({ backupCodes });
    
    return true;
  }

  /**
   * Enable 2FA for a user
   */
  async enable2FA(userId: string, userEmail: string): Promise<TwoFactorSecret> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const secretData = this.generateSecret(userId, userEmail);
    
    // Store the secret temporarily (will be confirmed later)
    await userRef.update({
      twoFactorSecret: secretData.secret,
      twoFactorBackupCodes: secretData.backupCodes.map(code => ({
        code: this.hashBackupCode(code),
        used: false
      })),
      twoFactorEnabled: false, // Will be set to true after verification
      twoFactorSetupAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return secretData;
  }

  /**
   * Complete 2FA setup by verifying the token
   */
  async complete2FASetup(userId: string, token: string): Promise<boolean> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = doc.data()!;
    const secret = userData.twoFactorSecret;
    
    if (!secret) {
      throw new HttpsError('failed-precondition', '2FA setup not initiated');
    }
    
    if (userData.twoFactorEnabled) {
      throw new HttpsError('already-exists', '2FA is already enabled');
    }
    
    // Verify the token
    if (!this.verifyToken(secret, token)) {
      return false;
    }
    
    // Enable 2FA
    await userRef.update({
      twoFactorEnabled: true,
      twoFactorVerifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return true;
  }

  /**
   * Disable 2FA for a user
   */
  async disable2FA(userId: string): Promise<boolean> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    await userRef.update({
      twoFactorEnabled: false,
      twoFactorSecret: admin.firestore.FieldValue.delete(),
      twoFactorBackupCodes: admin.firestore.FieldValue.delete(),
      twoFactorSetupAt: admin.firestore.FieldValue.delete(),
      twoFactorVerifiedAt: admin.firestore.FieldValue.delete()
    });
    
    return true;
  }

  /**
   * Verify 2FA token (TOTP or backup code)
   */
  async verify2FA(userId: string, token: string): Promise<boolean> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = doc.data()!;
    
    if (!userData.twoFactorEnabled) {
      return true; // 2FA not enabled, consider as verified
    }
    
    const secret = userData.twoFactorSecret;
    
    if (!secret) {
      throw new HttpsError('failed-precondition', '2FA not properly configured');
    }
    
    // Try TOTP token first
    if (this.verifyToken(secret, token)) {
      return true;
    }
    
    // Try backup code
    if (await this.verifyBackupCode(userId, token)) {
      return true;
    }
    
    return false;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      throw new HttpsError('not-found', 'User not found');
    }
    
    const userData = doc.data()!;
    
    if (!userData.twoFactorEnabled) {
      throw new HttpsError('failed-precondition', '2FA not enabled');
    }
    
    const newBackupCodes = this.generateBackupCodes();
    
    await userRef.update({
      twoFactorBackupCodes: newBackupCodes.map(code => ({
        code: this.hashBackupCode(code),
        used: false
      }))
    });
    
    return newBackupCodes;
  }

  /**
   * Check if 2FA is enabled for a user
   */
  async is2FAEnabled(userId: string): Promise<boolean> {
    const userRef = db.doc(`users/${userId}`);
    const doc = await userRef.get();
    
    if (!doc.exists) {
      return false;
    }
    
    const userData = doc.data()!;
    return userData.twoFactorEnabled === true;
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(this.generateRandomCode());
    }
    return codes;
  }

  /**
   * Generate a random backup code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Hash a backup code for storage
   */
  private hashBackupCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }
}

// Create a singleton instance
const twoFactorAuth = new TwoFactorAuth();

// Export convenience functions
export async function setup2FA(userId: string, userEmail: string): Promise<TwoFactorSecret> {
  return await twoFactorAuth.enable2FA(userId, userEmail);
}

export async function verify2FAToken(userId: string, token: string): Promise<boolean> {
  return await twoFactorAuth.verify2FA(userId, token);
}

export async function complete2FASetup(userId: string, token: string): Promise<boolean> {
  return await twoFactorAuth.complete2FASetup(userId, token);
}

export async function disable2FA(userId: string): Promise<boolean> {
  return await twoFactorAuth.disable2FA(userId);
}

export async function is2FAEnabled(userId: string): Promise<boolean> {
  return await twoFactorAuth.is2FAEnabled(userId);
}

export async function regenerateBackupCodes(userId: string): Promise<string[]> {
  return await twoFactorAuth.regenerateBackupCodes(userId);
} 