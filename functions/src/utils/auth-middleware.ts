import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { Request } from 'firebase-functions/v2/https';

export interface AuthenticatedRequest extends Request {
  auth?: {
    uid: string;
    token: {
      uid: string;
      email?: string;
      name?: string;
      role?: string;
      partnerId?: string;
      [key: string]: any;
    };
  };
}

export interface AuthContext {
  auth: {
    uid: string;
    token: {
      uid: string;
      email?: string;
      name?: string;
      role?: string;
      partnerId?: string;
      [key: string]: any;
    };
  };
}

/**
 * Extract and verify Firebase Auth token from request headers
 */
export async function authenticateRequest(req: Request): Promise<AuthContext> {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new HttpsError('unauthenticated', 'No authorization header provided');
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      throw new HttpsError('unauthenticated', 'Invalid authorization header format. Expected "Bearer <token>"');
    }

    // Extract the token
    const token = authHeader.substring(7); // Remove "Bearer " prefix

    if (!token) {
      throw new HttpsError('unauthenticated', 'No token provided');
    }

    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    if (!decodedToken.uid) {
      throw new HttpsError('unauthenticated', 'Invalid token: no UID found');
    }

    // Get user custom claims
    const userRecord = await admin.auth().getUser(decodedToken.uid);
    const customClaims = userRecord.customClaims || {};

    // Create auth context
    const authContext: AuthContext = {
      auth: {
        uid: decodedToken.uid,
        token: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          role: customClaims.role || 'consumer',
          partnerId: customClaims.partnerId,
          ...customClaims
        }
      }
    };

    return authContext;
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    // Type guard for Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error) {
      const authError = error as { code: string };
      
      if (authError.code === 'auth/id-token-expired') {
        throw new HttpsError('unauthenticated', 'Token expired');
      }
      
      if (authError.code === 'auth/id-token-revoked') {
        throw new HttpsError('unauthenticated', 'Token revoked');
      }
      
      if (authError.code === 'auth/invalid-id-token') {
        throw new HttpsError('unauthenticated', 'Invalid token');
      }
    }
    
    throw new HttpsError('unauthenticated', 'Authentication failed');
  }
}

/**
 * Check if user has required role
 */
export function hasRole(context: AuthContext, requiredRole: string | string[]): boolean {
  const userRole = context.auth.token.role;
  
  if (!userRole) {
    return false;
  }
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(context: AuthContext): boolean {
  return hasRole(context, ['admin', 'superadmin']);
}

/**
 * Check if user is a partner
 */
export function isPartner(context: AuthContext): boolean {
  return hasRole(context, 'partner');
}

/**
 * Check if user is a consumer
 */
export function isConsumer(context: AuthContext): boolean {
  return hasRole(context, 'consumer');
}

/**
 * Get user's partner ID if they are a partner
 */
export function getPartnerId(context: AuthContext): string | null {
  if (!isPartner(context)) {
    return null;
  }
  
  return context.auth.token.partnerId || null;
}

/**
 * Require authentication middleware
 */
export function requireAuth() {
  return async (req: Request): Promise<AuthContext> => {
    return await authenticateRequest(req);
  };
}

/**
 * Require specific role middleware
 */
export function requireRole(role: string | string[]) {
  return async (req: Request): Promise<AuthContext> => {
    const context = await authenticateRequest(req);
    
    if (!hasRole(context, role)) {
      throw new HttpsError('permission-denied', `Access denied. Required role: ${Array.isArray(role) ? role.join(' or ') : role}`);
    }
    
    return context;
  };
}

/**
 * Require admin privileges middleware
 */
export function requireAdmin() {
  return requireRole(['admin', 'superadmin']);
}

/**
 * Require partner privileges middleware
 */
export function requirePartner() {
  return requireRole('partner');
}

/**
 * Optional authentication middleware (doesn't throw if no auth)
 */
export async function optionalAuth(req: Request): Promise<AuthContext | null> {
  try {
    return await authenticateRequest(req);
  } catch (error) {
    return null;
  }
} 