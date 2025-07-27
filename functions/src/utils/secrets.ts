/**
 * Environment-based Secret Management Utility
 * 
 * This utility provides secure access to secrets from environment variables,
 * with caching for performance and proper error handling.
 * 
 * Usage:
 *   const apiKey = await getSecret('OPENAI_API_KEY');
 *   const dbUrl = await getSecret('DATABASE_URL');
 */

// Cache to store secrets in memory for the lifetime of the function instance
// This reduces environment variable lookups and improves performance
const secretCache: { [key: string]: string } = {};

/**
 * Retrieves a secret from environment variables
 * 
 * @param secretName - The name of the secret to retrieve
 * @returns Promise<string> - The secret value
 * @throws Error if the secret cannot be accessed
 */
export async function getSecret(secretName: string): Promise<string> {
  // Return cached value if available
  if (secretCache[secretName]) {
    console.log(`📋 Secret cache hit: ${secretName}`);
    return secretCache[secretName];
  }

  try {
    console.log(`🔐 Fetching secret from environment: ${secretName}`);
    
    const value = process.env[secretName];
    
    if (!value) {
      throw new Error(`Secret ${secretName} not found in environment variables.`);
    }
    
    // Cache the secret for future requests
    secretCache[secretName] = value;
    console.log(`✅ Secret retrieved and cached: ${secretName}`);
    
    return value;
    
  } catch (error) {
    console.error(`❌ Failed to access secret from environment: ${secretName}`, error);
    throw new Error(`Could not access secret ${secretName} from environment variables.`);
  }
}

/**
 * Retrieves multiple secrets at once
 * 
 * @param secretNames - Array of secret names to retrieve
 * @returns Promise<{[key: string]: string}> - Object mapping secret names to values
 */
export async function getSecrets(secretNames: string[]): Promise<{[key: string]: string}> {
  const results: {[key: string]: string} = {};
  
  // Fetch all secrets in parallel for better performance
  const promises = secretNames.map(async (secretName) => {
    try {
      const value = await getSecret(secretName);
      results[secretName] = value;
    } catch (error) {
      console.error(`Failed to get secret ${secretName}:`, error);
      throw error;
    }
  });
  
  await Promise.all(promises);
  return results;
}

/**
 * Clears the secret cache (useful for testing or forced refresh)
 */
export function clearSecretCache(): void {
  Object.keys(secretCache).forEach(key => delete secretCache[key]);
  console.log('🧹 Secret cache cleared');
}

/**
 * Gets a secret with a custom default value
 * 
 * @param secretName - The name of the secret to retrieve
 * @param defaultValue - Default value if secret is not found
 * @returns Promise<string> - The secret value or default
 */
export async function getSecretWithDefault(secretName: string, defaultValue: string): Promise<string> {
  try {
    return await getSecret(secretName);
  } catch (error) {
    console.warn(`Using default value for secret ${secretName}:`, error);
    return defaultValue;
  }
}

/**
 * Validates that all required secrets are available
 * 
 * @param requiredSecrets - Array of secret names that must be available
 * @throws Error if any required secret is missing
 */
export async function validateRequiredSecrets(requiredSecrets: string[]): Promise<void> {
  const missingSecrets: string[] = [];
  
  for (const secretName of requiredSecrets) {
    try {
      await getSecret(secretName);
    } catch (error) {
      missingSecrets.push(secretName);
    }
  }
  
  if (missingSecrets.length > 0) {
    throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
  }
  
  console.log('✅ All required secrets are available');
}

// Common secret configurations for CPay
export const SECRET_NAMES = {
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  MAILCHIMP_API_KEY: 'MAILCHIMP_API_KEY',
  EMANGO_SECRET_KEY: 'EMANGO_SECRET_KEY',
  CHANNEL_AGGREGATOR_SHA256_KEY: 'CHANNEL_AGGREGATOR_SHA256_KEY',
  JWT_SECRET: 'JWT_SECRET',
  DATABASE_URL: 'DATABASE_URL',
  WEBHOOK_SECRET: 'WEBHOOK_SECRET'
} as const;

/**
 * Gets all CPay secrets at once
 * 
 * @returns Promise<{[key: string]: string}> - All CPay secrets
 */
export async function getCPaySecrets(): Promise<{[key: string]: string}> {
  const secretNames = Object.values(SECRET_NAMES);
  return await getSecrets(secretNames);
} 