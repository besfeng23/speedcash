
import { HttpsError } from 'firebase-functions/v2/https';

const OWNER_UID = "b7gBDTiACCeZchRHZiY7UvJhqAg2"; // Joven's UID

export function assertKaiOwner(context: any) {
  if (context.auth?.uid !== OWNER_UID) {
    throw new HttpsError(
      'permission-denied',
      'This Kai feature is restricted.'
    );
  }
}
