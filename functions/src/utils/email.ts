import { HttpsError } from 'firebase-functions/v2/https';

// Email service configuration
interface EmailConfig {
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  apiKey: string;
  serverPrefix: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailData {
  to: string;
  template: EmailTemplate;
  data?: Record<string, any>;
}

class EmailService {
  private config: EmailConfig;
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.MAILCHIMP_API_KEY || '';
    this.config = {
      fromEmail: process.env.FROM_EMAIL || 'noreply@cpay.com',
      fromName: process.env.FROM_NAME || 'CPay',
      replyTo: process.env.REPLY_TO_EMAIL || 'support@cpay.com',
      apiKey: process.env.MAILCHIMP_API_KEY || '',
      serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX || ''
    };

    if (!this.apiKey) {
      console.warn('Mailchimp API key not configured. Email service will be disabled.');
    }
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.apiKey || !this.config.serverPrefix) {
      console.log('Email service disabled - no API key or server prefix configured');
      return false;
    }

    try {
      const response = await fetch(`https://${this.config.serverPrefix}.api.mailchimp.com/3.0/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: {
            html: emailData.template.html,
            text: emailData.template.text,
            subject: emailData.template.subject,
            from_email: this.config.fromEmail,
            from_name: this.config.fromName,
            to: [{
              email: emailData.to,
              type: 'to'
            }],
            headers: {
              'Reply-To': this.config.replyTo
            }
          },
          async: false
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Mailchimp API error:', error);
        throw new HttpsError('internal', 'Failed to send email');
      }

      const result = await response.json();
      console.log(`Email sent successfully to ${emailData.to}, message ID: ${result.id}`);
      return true;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new HttpsError('internal', 'Email service unavailable');
    }
  }

  // Predefined email templates
  getWelcomeEmailTemplate(userName: string, partnerId?: string): EmailTemplate {
    return {
      subject: 'Welcome to CPay! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2E3192;">Welcome to CPay!</h1>
          <p>Hi ${userName},</p>
          <p>Welcome to CPay! Your account has been successfully created.</p>
          ${partnerId ? `<p>Your Partner ID: <strong>${partnerId}</strong></p>` : ''}
          <p>You can now:</p>
          <ul>
            <li>Send and receive money instantly</li>
            <li>Complete your KYC verification</li>
            <li>Access your dashboard</li>
          </ul>
          <p>If you have any questions, feel free to contact our support team.</p>
          <p>Best regards,<br>The CPay Team</p>
        </div>
      `,
      text: `Welcome to CPay! Hi ${userName}, your account has been successfully created. ${partnerId ? `Your Partner ID: ${partnerId}` : ''} You can now send and receive money, complete KYC verification, and access your dashboard.`
    };
  }

  getKycApprovedTemplate(userName: string): EmailTemplate {
    return {
      subject: 'KYC Verification Approved ✅',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">KYC Verification Approved!</h1>
          <p>Hi ${userName},</p>
          <p>Great news! Your KYC verification has been approved.</p>
          <p>You now have full access to all CPay features including:</p>
          <ul>
            <li>Higher transaction limits</li>
            <li>International remittances</li>
            <li>Advanced security features</li>
          </ul>
          <p>Thank you for choosing CPay!</p>
          <p>Best regards,<br>The CPay Team</p>
        </div>
      `,
      text: `KYC Verification Approved! Hi ${userName}, your KYC verification has been approved. You now have full access to all CPay features.`
    };
  }

  getKycRejectedTemplate(userName: string, reason: string): EmailTemplate {
    return {
      subject: 'KYC Verification Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #ef4444;">KYC Verification Update</h1>
          <p>Hi ${userName},</p>
          <p>We've reviewed your KYC submission and found some issues that need to be addressed:</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please log in to your account and submit updated documents.</p>
          <p>If you need assistance, please contact our support team.</p>
          <p>Best regards,<br>The CPay Team</p>
        </div>
      `,
      text: `KYC Verification Update. Hi ${userName}, we've reviewed your KYC submission and found issues: ${reason}. Please log in and submit updated documents.`
    };
  }

  getTransactionNotificationTemplate(userName: string, transactionType: string, amount: string, currency: string): EmailTemplate {
    return {
      subject: `Transaction ${transactionType} - CPay`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2E3192;">Transaction Notification</h1>
          <p>Hi ${userName},</p>
          <p>Your ${transactionType.toLowerCase()} transaction has been processed successfully.</p>
          <p><strong>Amount:</strong> ${amount} ${currency}</p>
          <p>You can view the full details in your transaction history.</p>
          <p>Best regards,<br>The CPay Team</p>
        </div>
      `,
      text: `Transaction Notification. Hi ${userName}, your ${transactionType.toLowerCase()} transaction of ${amount} ${currency} has been processed successfully.`
    };
  }

  getPasswordResetTemplate(userName: string, resetLink: string): EmailTemplate {
    return {
      subject: 'Password Reset Request - CPay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2E3192;">Password Reset Request</h1>
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetLink}" style="background-color: #2E3192; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>The CPay Team</p>
        </div>
      `,
      text: `Password Reset Request. Hi ${userName}, click this link to reset your password: ${resetLink}. This link expires in 1 hour.`
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Convenience functions
export async function sendWelcomeEmail(email: string, userName: string, partnerId?: string): Promise<boolean> {
  const template = emailService.getWelcomeEmailTemplate(userName, partnerId);
  return emailService.sendEmail({ to: email, template });
}

export async function sendKycApprovedEmail(email: string, userName: string): Promise<boolean> {
  const template = emailService.getKycApprovedTemplate(userName);
  return emailService.sendEmail({ to: email, template });
}

export async function sendKycRejectedEmail(email: string, userName: string, reason: string): Promise<boolean> {
  const template = emailService.getKycRejectedTemplate(userName, reason);
  return emailService.sendEmail({ to: email, template });
}

export async function sendTransactionNotification(email: string, userName: string, transactionType: string, amount: string, currency: string): Promise<boolean> {
  const template = emailService.getTransactionNotificationTemplate(userName, transactionType, amount, currency);
  return emailService.sendEmail({ to: email, template });
}

export async function sendPasswordResetEmail(email: string, userName: string, resetLink: string): Promise<boolean> {
  const template = emailService.getPasswordResetTemplate(userName, resetLink);
  return emailService.sendEmail({ to: email, template });
} 