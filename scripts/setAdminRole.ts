#!/usr/bin/env ts-node

/**
 * Admin Role Setup Script
 * 
 * This script sets up an admin user with the necessary custom claims
 * for accessing the CPay admin dashboard and managing the system.
 * 
 * Usage:
 *   npx ts-node scripts/setAdminRole.ts <user-uid>
 * 
 * Requirements:
 *   - Firebase Admin SDK initialized
 *   - Valid user UID from Firebase Authentication
 */

import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'applez-dch9v'
    });
    console.log('✅ Firebase Admin SDK initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error);
    process.exit(1);
  }
}

/**
 * Set admin role and permissions for a user
 */
async function setAdminRole(uid: string): Promise<void> {
  try {
    // Verify user exists
    const userRecord = await admin.auth().getUser(uid);
    console.log(`📋 User found: ${userRecord.email}`);

    // Set custom claims
    const customClaims = {
      role: 'admin',
      permissions: [
        'manage_users',
        'manage_partners', 
        'manage_kyc',
        'view_admin_dashboard',
        'manage_transactions',
        'view_compliance',
        'manage_settings'
      ],
      created_at: new Date().toISOString(),
      created_by: 'setup_script'
    };

    await admin.auth().setCustomUserClaims(uid, customClaims);
    
    console.log('🎉 Successfully set admin role!');
    console.log('📋 Admin permissions granted:');
    customClaims.permissions.forEach(permission => {
      console.log(`   ✅ ${permission}`);
    });

    // Verify the claims were set
    const updatedUser = await admin.auth().getUser(uid);
    console.log('\n🔍 Verification:');
    console.log(`   User: ${updatedUser.email}`);
    console.log(`   Role: ${updatedUser.customClaims?.role}`);
    console.log(`   Permissions: ${updatedUser.customClaims?.permissions?.length} granted`);

    console.log('\n🚀 Next steps:');
    console.log('   1. User can now log into the application');
    console.log('   2. Navigate to /admin to access admin dashboard');
    console.log('   3. Test admin functions (user management, partner approval, etc.)');

  } catch (error) {
    console.error('❌ Failed to set admin role:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('auth/user-not-found')) {
        console.log('\n💡 Troubleshooting:');
        console.log('   1. Verify the user UID is correct');
        console.log('   2. Ensure user exists in Firebase Authentication');
        console.log('   3. Check Firebase project configuration');
      }
    }
    
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  const uid = process.argv[2];

  if (!uid) {
    console.log('❌ Missing user UID argument');
    console.log('\n📋 Usage:');
    console.log('   npx ts-node scripts/setAdminRole.ts <user-uid>');
    console.log('\n💡 To get user UID:');
    console.log('   1. Go to Firebase Console → Authentication');
    console.log('   2. Find your user and copy the UID column');
    console.log('   3. Run: npx ts-node scripts/setAdminRole.ts YOUR_UID_HERE');
    process.exit(1);
  }

  console.log('🔧 CPay Admin Role Setup');
  console.log('========================');
  console.log(`📋 Setting admin role for user: ${uid}`);

  await setAdminRole(uid);
  
  console.log('\n✅ Admin setup complete!');
  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 