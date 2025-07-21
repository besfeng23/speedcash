import { HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { z } from 'zod';

const db = admin.firestore();

// --- Korean Mall Store Schemas ---
export const koreanMallStoreSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  businessRegistrationNumber: z.string().min(1, "Business registration number is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  ownerEmail: z.string().email("Valid email is required"),
  ownerPhone: z.string().min(1, "Phone number is required"),
  storeAddress: z.string().min(1, "Store address is required"),
  storeCategory: z.enum(['retail', 'food', 'electronics', 'fashion', 'beauty', 'other']),
  expectedMonthlyVolume: z.number().positive("Expected monthly volume must be positive"),
  bankAccountInfo: z.object({
    bankName: z.string(),
    accountNumber: z.string(),
    accountHolder: z.string(),
  }),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string().url(),
  })),
});

export const koreanMallPaymentSchema = z.object({
  storeId: z.string(),
  amount: z.number().positive(),
  currency: z.enum(['KRW', 'PHP']),
  customerInfo: z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }),
  orderDetails: z.object({
    orderId: z.string(),
    items: z.array(z.object({
      name: z.string(),
      quantity: z.number().positive(),
      price: z.number().positive(),
    })),
  }),
  paymentMethod: z.enum(['card', 'bank_transfer', 'mobile_payment']),
});

// --- Korean Mall Store Integration Class ---
export class KoreanMallIntegration {
  
  // Create a new Korean mall store partner
  async createKoreanMallStore(data: any, context: any) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    
    const adminUid = this.ensureIsAdmin(context);
    const storeData = koreanMallStoreSchema.parse(data);

    try {
      // Generate unique store ID
      const storeId = `korean_mall_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create store document
      const storeRef = db.doc(`korean_mall_stores/${storeId}`);
      await storeRef.set({
        ...storeData,
        storeId,
        status: 'PENDING_VERIFICATION',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: adminUid,
        verificationStatus: {
          documents: 'PENDING',
          business: 'PENDING',
          bank: 'PENDING',
        },
        settings: {
          autoSettlement: true,
          settlementFrequency: 'daily',
          minimumSettlementAmount: 100000, // 100,000 KRW
          supportedCurrencies: ['KRW', 'PHP'],
          supportedPaymentMethods: ['card', 'bank_transfer', 'mobile_payment'],
        },
        statistics: {
          totalTransactions: 0,
          totalVolume: 0,
          lastSettlement: null,
        }
      });

      // Create partner account for the store
      const partnerUid = `partner_${storeId}`;
      await admin.auth().createUser({
        uid: partnerUid,
        email: storeData.ownerEmail,
        displayName: storeData.storeName,
        password: this.generateTemporaryPassword(),
      });

      // Set custom claims for Korean mall partner
      await admin.auth().setCustomUserClaims(partnerUid, {
        role: 'korean_mall_partner',
        partnerId: partnerUid,
        storeId: storeId,
        permissions: ['process_payments', 'view_transactions', 'request_settlements'],
      });

      // Create partner document
      const partnerRef = db.doc(`partners/${partnerUid}`);
      await partnerRef.set({
        businessName: storeData.storeName,
        primaryContactUid: partnerUid,
        status: 'PENDING_VERIFICATION',
        kybStatus: 'PENDING_REVIEW',
        dateJoined: admin.firestore.FieldValue.serverTimestamp(),
        partnerType: 'korean_mall_store',
        storeId: storeId,
        apiKeys: {},
        webhookConfig: {},
        koreanMallDetails: {
          businessRegistrationNumber: storeData.businessRegistrationNumber,
          storeCategory: storeData.storeCategory,
          expectedMonthlyVolume: storeData.expectedMonthlyVolume,
          bankAccountInfo: storeData.bankAccountInfo,
        }
      });

      // Create wallets for the store
      const walletRef = partnerRef.collection('wallets');
      await walletRef.doc('KRW').set({ 
        balance: 0, 
        currency: 'KRW', 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });
      await walletRef.doc('PHP').set({ 
        balance: 0, 
        currency: 'PHP', 
        updatedAt: admin.firestore.FieldValue.serverTimestamp() 
      });

      // Send welcome email with credentials
      await this.sendWelcomeEmail(storeData.ownerEmail, storeData.storeName, partnerUid);

      return {
        success: true,
        storeId,
        partnerId: partnerUid,
        message: 'Korean mall store created successfully. Welcome email sent with credentials.',
      };

    } catch (error) {
      console.error('Error creating Korean mall store:', error);
      throw new HttpsError('internal', 'Failed to create Korean mall store.');
    }
  }

  // Process payment for Korean mall store
  async processKoreanMallPayment(data: any, context: any) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    
    const paymentData = koreanMallPaymentSchema.parse(data);
    const storeId = paymentData.storeId;

    try {
      // Verify store exists and is active
      const storeRef = db.doc(`korean_mall_stores/${storeId}`);
      const storeDoc = await storeRef.get();
      
      if (!storeDoc.exists) {
        throw new HttpsError('not-found', 'Store not found.');
      }

      const storeData = storeDoc.data();
      if (storeData?.status !== 'ACTIVE') {
        throw new HttpsError('failed-precondition', 'Store is not active.');
      }

      // Create transaction record
      const transactionRef = db.collection('transactions').doc();
      const transactionId = transactionRef.id;

      await transactionRef.set({
        type: 'korean_mall_payment',
        status: 'PROCESSING',
        amount: paymentData.amount,
        currency: paymentData.currency,
        storeId: storeId,
        storeName: storeData.storeName,
        customerInfo: paymentData.customerInfo,
        orderDetails: paymentData.orderDetails,
        paymentMethod: paymentData.paymentMethod,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        partnerId: storeData.partnerId,
      });

      // Process payment based on method
      let paymentResult;
      switch (paymentData.paymentMethod) {
        case 'card':
          paymentResult = await this.processCardPayment(paymentData);
          break;
        case 'bank_transfer':
          paymentResult = await this.processBankTransfer(paymentData);
          break;
        case 'mobile_payment':
          paymentResult = await this.processMobilePayment(paymentData);
          break;
        default:
          throw new HttpsError('invalid-argument', 'Unsupported payment method.');
      }

      // Update transaction status
      await transactionRef.update({
        status: paymentResult.success ? 'COMPLETED' : 'FAILED',
        gatewayResponse: paymentResult.gatewayResponse,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // If successful, credit the store's wallet
      if (paymentResult.success) {
        const partnerId = storeData.partnerId;
        const walletRef = db.doc(`partners/${partnerId}/wallets/${paymentData.currency}`);
        
        await walletRef.update({
          balance: admin.firestore.FieldValue.increment(paymentData.amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Update store statistics
        await storeRef.update({
          'statistics.totalTransactions': admin.firestore.FieldValue.increment(1),
          'statistics.totalVolume': admin.firestore.FieldValue.increment(paymentData.amount),
        });

        // Send webhook notification if configured
        await this.sendWebhookNotification(partnerId, {
          event: 'payment.succeeded',
          transactionId: transactionId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          orderId: paymentData.orderDetails.orderId,
        });
      }

      return {
        success: paymentResult.success,
        transactionId: transactionId,
        message: paymentResult.message,
        status: paymentResult.success ? 'COMPLETED' : 'FAILED',
      };

    } catch (error) {
      console.error('Error processing Korean mall payment:', error);
      throw new HttpsError('internal', 'Payment processing failed.');
    }
  }

  // Get Korean mall store statistics
  async getKoreanMallStats(storeId: string, context: any) {
    if (!context.auth) throw new HttpsError('unauthenticated', 'Authentication required.');
    
    try {
      const storeRef = db.doc(`korean_mall_stores/${storeId}`);
      const storeDoc = await storeRef.get();
      
      if (!storeDoc.exists) {
        throw new HttpsError('not-found', 'Store not found.');
      }

      const storeData = storeDoc.data();
      
      // Get recent transactions
      const transactionsSnapshot = await db.collection('transactions')
        .where('storeId', '==', storeId)
        .orderBy('timestamp', 'desc')
        .limit(10)
        .get();

      const recentTransactions = transactionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get monthly statistics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const monthlyTransactionsSnapshot = await db.collection('transactions')
        .where('storeId', '==', storeId)
        .where('timestamp', '>=', thirtyDaysAgo)
        .where('status', '==', 'COMPLETED')
        .get();

      const monthlyStats = monthlyTransactionsSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        acc.totalTransactions += 1;
        acc.totalVolume += data.amount || 0;
        return acc;
      }, { totalTransactions: 0, totalVolume: 0 });

      return {
        success: true,
        store: storeData,
        recentTransactions,
        monthlyStats,
      };

    } catch (error) {
      console.error('Error getting Korean mall stats:', error);
      throw new HttpsError('internal', 'Failed to get store statistics.');
    }
  }

  // Helper methods
  private ensureIsAdmin(context: any): string {
    if (!context.auth || !context.auth.token.role || !['admin', 'superadmin'].includes(context.auth.token.role)) {
      throw new HttpsError('permission-denied', 'Admin access required.');
    }
    return context.auth.uid;
  }

  private generateTemporaryPassword(): string {
    return Math.random().toString(36).substr(2, 12) + '!1';
  }

  private async sendWelcomeEmail(email: string, storeName: string, partnerId: string): Promise<void> {
    // TODO: Implement email sending logic
    console.log(`Welcome email would be sent to ${email} for store ${storeName} with partner ID ${partnerId}`);
  }

  private async processCardPayment(paymentData: any): Promise<any> {
    // TODO: Implement card payment processing
    return { success: true, message: 'Card payment processed successfully' };
  }

  private async processBankTransfer(paymentData: any): Promise<any> {
    // TODO: Implement bank transfer processing
    return { success: true, message: 'Bank transfer processed successfully' };
  }

  private async processMobilePayment(paymentData: any): Promise<any> {
    // TODO: Implement mobile payment processing
    return { success: true, message: 'Mobile payment processed successfully' };
  }

  private async sendWebhookNotification(partnerId: string, eventData: any): Promise<void> {
    // TODO: Implement webhook notification logic
    console.log(`Webhook notification would be sent to partner ${partnerId} with event data:`, eventData);
  }
} 