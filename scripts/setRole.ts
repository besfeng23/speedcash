
import * as admin from 'firebase-admin';

// This script needs Firebase Admin credentials to run.
// Make sure you have GOOGLE_APPLICATION_CREDENTIALS set in your environment.
// For example: export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-file.json"

// Initialize the app if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Sets a custom role claim on a user's Firebase Auth token and updates their Firestore doc.
 * @param email The email of the user to modify.
 * @param role The role to assign ('user', 'admin', 'superadmin', 'partner').
 * @param displayName The display name to set for the user.
 */
async function updateUser(
    email: string, 
    role: 'user' | 'admin' | 'superadmin' | 'partner',
    displayName?: string
): Promise<string | undefined> {
  try {
    const user = await admin.auth().getUserByEmail(email);
    
    // --- Auth Updates ---
    await admin.auth().setCustomUserClaims(user.uid, { role });
    if (displayName) {
        await admin.auth().updateUser(user.uid, { displayName });
    }
    
    // --- Firestore Updates ---
    const userDocRef = db.collection('users').doc(user.uid);
    const firestoreUpdateData: { role: string; displayName?: string } = { role: role };
    if (displayName) {
        firestoreUpdateData.displayName = displayName;
    }
    await userDocRef.set(firestoreUpdateData, { merge: true });
    
    console.log(`✅ User ${email} (UID: ${user.uid}) updated. Role: '${role}'${displayName ? `, Name: '${displayName}'` : ''}.`);
    return user.uid;

  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ Error: User with email ${email} not found in Firebase Auth.`);
    } else {
      console.error(`❌ Error updating user ${email}:`, error);
    }
    process.exit(1);
  }
}

/**
 * Creates or updates a partner document in the 'partners' collection.
 * @param partnerId The unique ID for the partner document.
 * @param data The data for the partner.
 */
async function createPartner(partnerId: string, data: object) {
    try {
        const partnerRef = db.collection('partners').doc(partnerId);
        await partnerRef.set(data, { merge: true });
        console.log(`✅ Partner ${partnerId} created/updated with name: ${(data as any).businessName}.`);
    } catch (error) {
        console.error(`❌ Error creating partner ${partnerId}:`, error);
        process.exit(1);
    }
}


// --- HOW TO USE ---
// 1. Make sure the users exist in Firebase Authentication first.
// 2. Run this script from your terminal: `npx ts-node --project tsconfig.scripts.json scripts/setRole.ts`
// 3. To create the tsconfig.scripts.json, copy your main tsconfig.json and ensure it can run with ts-node.

async function main() {
  console.log("Starting user and data update process...");
  
  // Set user roles
  await updateUser('jovenongz@gmail.com', 'superadmin', 'Joven');
  await updateUser('winny@redapplex.com', 'admin', 'Winny');
  await updateUser('user@cpay.com', 'user', 'Test User');
  
  // Set partner user role and create corresponding partner document
  const partnerUid = await updateUser('partner@cpay.com', 'partner', 'Partner Co.');
  if (partnerUid) {
      await createPartner(partnerUid, {
          businessName: 'Partner Co.',
          status: 'Active',
          dateJoined: new Date().toISOString().split('T')[0], // e.g., '2023-10-27'
          primaryContactUid: partnerUid
      });
  }
  
  await createPartner('prt_1a2b3c', {
    businessName: 'SuperMart Inc.',
    status: 'Active',
    dateJoined: '2023-09-15',
     apiKeys: {
        live: { publishable: "pk_live_sm_...", secret: "sk_live_sm_..." },
        test: { publishable: "pk_test_sm_...", secret: "sk_test_sm_..." },
    },
    webhookConfig: {
        url: 'https://api.supermart.com/webhooks/cpay',
        secret: 'whsec_sm_...',
    }
  });
  await createPartner('prt_4d5e6f', {
    businessName: 'Global Exports Co.',
    status: 'Pending Review',
    dateJoined: '2023-10-20',
     apiKeys: {
        live: { publishable: "pk_live_gec_...", secret: "sk_live_gec_..." },
        test: { publishable: "pk_test_gec_...", secret: "sk_test_gec_..." },
    },
     webhookConfig: {
        url: null,
        secret: 'whsec_gec_...',
    }
  });
   await createPartner('prt_7g8h9i', {
    businessName: 'Local Coffee Shop',
    status: 'Active',
    dateJoined: '2023-08-01',
    apiKeys: {
        live: { publishable: "pk_live_lcs_...", secret: "sk_live_lcs_..." },
        test: { publishable: "pk_test_lcs_...", secret: "sk_test_lcs_..." },
    },
     webhookConfig: {
        url: 'https://api.localcoffeeshop.com/hooks',
        secret: 'whsec_lcs_...',
    }
  });

  console.log("\nUpdate script finished.");
}


main().then(() => {
  process.exit(0);
}).catch(err => {
  console.error("An unexpected error occurred during the script execution:", err);
  process.exit(1);
});
