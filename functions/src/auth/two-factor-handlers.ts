import { HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { 
  setup2FA, 
  complete2FASetup, 
  verify2FAToken, 
  disable2FA, 
  is2FAEnabled, 
  regenerateBackupCodes 
} from '../utils/two-factor-auth';
import { auditLog } from '../utils/audit';
import { checkRateLimit, recordRequest } from '../utils/rate-limiter';

// --- Schemas ---
const setup2FASchema = z.object({
  email: z.string().email()
});

const complete2FASchema = z.object({
  token: z.string().length(6)
});

const verify2FASchema = z.object({
  token: z.string().min(6).max(8) // TOTP or backup code
});

const disable2FASchema = z.object({
  confirm: z.boolean().refine(val => val === true, 'Must confirm to disable 2FA')
});

// --- Handlers ---

export async function setup2FAHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('auth', context);
    
    const { email } = setup2FASchema.parse(data);
    const userId = context.auth.uid;
    
    const secret = await setup2FA(userId, email);
    
    // Record successful request
    await recordRequest('auth', context, true);
    
    await auditLog({ uid: userId }, 'ADMIN_ACTION', {
      action: 'setup_2fa',
      email
    });
    
    return {
      success: true,
      secret: secret.secret,
      qrCodeUrl: secret.qrCodeUrl,
      backupCodes: secret.backupCodes,
      message: '2FA setup initiated. Please verify with the code from your authenticator app.'
    };
  } catch (error) {
    // Record failed request
    await recordRequest('auth', context, false);
    
    console.error('2FA setup error:', error);
    throw new HttpsError('internal', 'Failed to setup 2FA');
  }
}

export async function complete2FASetupHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('auth', context);
    
    const { token } = complete2FASchema.parse(data);
    const userId = context.auth.uid;
    
    const success = await complete2FASetup(userId, token);
    
    if (success) {
      // Record successful request
      await recordRequest('auth', context, true);
      
      await auditLog({ uid: userId }, 'ADMIN_ACTION', {
        action: 'complete_2fa_setup'
      });
      
      return {
        success: true,
        message: '2FA has been successfully enabled for your account.'
      };
    } else {
      throw new HttpsError('invalid-argument', 'Invalid verification code');
    }
  } catch (error) {
    // Record failed request
    await recordRequest('auth', context, false);
    
    console.error('2FA completion error:', error);
    throw new HttpsError('internal', 'Failed to complete 2FA setup');
  }
}

export async function verify2FAHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('auth', context);
    
    const { token } = verify2FASchema.parse(data);
    const userId = context.auth.uid;
    
    const isValid = await verify2FAToken(userId, token);
    
    if (isValid) {
      // Record successful request
      await recordRequest('auth', context, true);
      
      await auditLog({ uid: userId }, 'ADMIN_ACTION', {
        action: 'verify_2fa',
        success: true
      });
      
      return {
        success: true,
        message: '2FA verification successful.'
      };
    } else {
      // Record failed request
      await recordRequest('auth', context, false);
      
      await auditLog({ uid: userId }, 'ADMIN_ACTION', {
        action: 'verify_2fa',
        success: false
      });
      
      throw new HttpsError('invalid-argument', 'Invalid verification code');
    }
  } catch (error) {
    console.error('2FA verification error:', error);
    throw new HttpsError('internal', 'Failed to verify 2FA');
  }
}

export async function disable2FAHandler(data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('auth', context);
    
    const { confirm } = disable2FASchema.parse(data);
    const userId = context.auth.uid;
    
    if (!confirm) {
      throw new HttpsError('invalid-argument', 'Must confirm to disable 2FA');
    }
    
    const success = await disable2FA(userId);
    
    if (success) {
      // Record successful request
      await recordRequest('auth', context, true);
      
      await auditLog({ uid: userId }, 'ADMIN_ACTION', {
        action: 'disable_2fa'
      });
      
      return {
        success: true,
        message: '2FA has been successfully disabled for your account.'
      };
    } else {
      throw new HttpsError('internal', 'Failed to disable 2FA');
    }
  } catch (error) {
    // Record failed request
    await recordRequest('auth', context, false);
    
    console.error('2FA disable error:', error);
    throw new HttpsError('internal', 'Failed to disable 2FA');
  }
}

export async function get2FAStatusHandler(_data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    const userId = context.auth.uid;
    const isEnabled = await is2FAEnabled(userId);
    
    return {
      success: true,
      twoFactorEnabled: isEnabled,
      message: isEnabled ? '2FA is enabled for your account.' : '2FA is not enabled for your account.'
    };
  } catch (error) {
    console.error('2FA status check error:', error);
    throw new HttpsError('internal', 'Failed to check 2FA status');
  }
}

export async function regenerateBackupCodesHandler(_data: any, context: any) {
  if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
  
  try {
    // Rate limiting
    await checkRateLimit('auth', context);
    
    const userId = context.auth.uid;
    const newBackupCodes = await regenerateBackupCodes(userId);
    
    // Record successful request
    await recordRequest('auth', context, true);
    
    await auditLog({ uid: userId }, 'ADMIN_ACTION', {
      action: 'regenerate_backup_codes'
    });
    
    return {
      success: true,
      backupCodes: newBackupCodes,
      message: 'New backup codes have been generated. Please save them securely.'
    };
  } catch (error) {
    // Record failed request
    await recordRequest('auth', context, false);
    
    console.error('Backup codes regeneration error:', error);
    throw new HttpsError('internal', 'Failed to regenerate backup codes');
  }
} 