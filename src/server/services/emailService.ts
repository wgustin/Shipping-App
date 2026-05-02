
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import { serverConfig } from '../config';

const mailgun = new Mailgun(formData);

let mgClient: any = null;

export function getMailgunClient() {
  if (!mgClient) {
    const apiKey = process.env.MAILGUN_API_KEY;
    const domain = process.env.MAILGUN_DOMAIN;
    
    console.log(`[Mailgun] Initializing client for domain: ${domain || 'MISSING'}`);

    if (!apiKey || !domain) {
      console.warn('[Mailgun] Credentials missing (API_KEY or DOMAIN). Emails will not be sent.');
      return null;
    }

    mgClient = mailgun.client({
      username: 'api',
      key: apiKey,
      url: process.env.MAILGUN_REGION === 'EU' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
    });
    console.log('[Mailgun] Client initialized successfully');
  }
  return mgClient;
}

export async function sendEmail({ to, subject, text, html }: { to: string, subject: string, text: string, html?: string }) {
  const client = getMailgunClient();
  if (!client) {
    console.error('[Mailgun] Cannot send email: Client not initialized');
    return;
  }

  const domain = process.env.MAILGUN_DOMAIN!;
  const from = process.env.MAILGUN_FROM_EMAIL || `Poast Office <noreply@${domain}>`;

  try {
    console.log(`[Mailgun] Sending email to ${to} via domain ${domain}...`);
    const response = await client.messages.create(domain, {
      from,
      to: [to],
      subject,
      text,
      html
    });
    console.log('[Mailgun] Email sent successfully:', response.id || 'No ID returned');
    return response;
  } catch (error) {
    console.error('[Mailgun] Error sending email:', error);
    throw error;
  }
}

export async function sendLabelConfirmation(email: string, shipment: any) {
  const subject = `Your Label is Ready! - ${shipment.trackingNumber}`;
  const dashboardUrl = `${process.env.APP_URL || 'https://gopoast.com'}/dashboard`;
  const printUrl = `${process.env.APP_URL || 'https://gopoast.com'}/shipments/${shipment.id}`;
  
  const text = `
    Hi there,
    
    Your shipping label for ${shipment.toAddress.name} is ready.
    
    Tracking Number: ${shipment.trackingNumber}
    Carrier: ${shipment.selectedRate.carrier}
    Service: ${shipment.selectedRate.serviceName}
    
    You can print your label here: ${printUrl}
    
    Happy shipping!
    The Poast Office Team
  `;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Your Poast Office Label is Ready</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }

    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 20px !important; }
      .button { display: block !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header/Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${process.env.APP_URL || 'https://gopoast.com'}/poast-logo.png" alt="Poast Office" width="180" style="display: block; width: 180px;" referrerPolicy="no-referrer">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="content" style="padding: 0 40px 40px 40px; color: #1e293b; line-height: 1.6;">
              <h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; text-align: center;">Your Label is Ready!</h1>
              
              <p style="font-size: 16px; margin-bottom: 24px; text-align: center; color: #475569;">
                Success! Your shipping label for <strong>${shipment.toAddress.name}</strong> has been generated and is ready to print.
              </p>
              
              <!-- Shipment Details Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px;">
                  <tr>
                    <td style="padding-bottom: 8px; color: #64748b;">Tracking Number:</td>
                    <td style="padding-bottom: 8px; font-weight: 600; color: #0f172a; text-align: right;">${shipment.trackingNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding-bottom: 8px; color: #64748b;">Carrier:</td>
                    <td style="padding-bottom: 8px; font-weight: 600; color: #0f172a; text-align: right;">${shipment.selectedRate.carrier}</td>
                  </tr>
                  <tr>
                    <td style="color: #64748b;">Service:</td>
                    <td style="font-weight: 600; color: #0f172a; text-align: right;">${shipment.selectedRate.serviceName}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${printUrl}" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 16px 40px; border-radius: 12px; font-weight: 700; text-decoration: none; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(13, 148, 136, 0.2);">Print Shipping Label</a>
              </div>
              
              <p style="font-size: 14px; color: #64748b; text-align: center;">
                You can also manage this shipment and track its progress in your dashboard.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 32px 40px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Poast Office. All rights reserved.</p>
              <div style="margin-top: 16px;">
                <a href="${dashboardUrl}" style="color: #94a3b8; text-decoration: underline;">Dashboard</a>
                <span style="padding: 0 8px;">&bull;</span>
                <a href="${process.env.APP_URL || '#'}/history" style="color: #94a3b8; text-decoration: underline;">Shipping History</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, text, html });
}

export async function sendWelcomeEmail(email: string, firstName: string) {
  const subject = `Welcome to Poast Office, ${firstName}! 📦`;
  const text = `
    Hi ${firstName},
    
    Welcome to Poast Office! We're thrilled to have you join our community.
    
    You're now part of a group of smart shippers who save up to 89% on every label and avoid the lines.
    
    You are cleared to start shipping immediately.
    
    Ready to get started?
    1. Log in to your dashboard
    2. Save your addresses to speed up your workflow
    3. Compare live rates from USPS, UPS, and FedEx
    
    If you have any questions, just reply to this email.
    
    Happy shipping!
    The Poast Office Team
  `;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to Poast Office</title>
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; }

    /* Mobile styles */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 10px !important; }
      .content { padding: 20px !important; }
      .button-container { display: block !important; width: 100% !important; }
      .button { display: block !important; margin-bottom: 10px !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="container" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header/Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px 40px;">
              <img src="${process.env.APP_URL || 'https://gopoast.com'}/poast-logo.png" alt="Poast Office" width="180" style="display: block; width: 180px;" referrerPolicy="no-referrer">
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td class="content" style="padding: 0 40px 40px 40px; color: #1e293b; line-height: 1.6;">
              <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 16px; text-align: center;">Welcome aboard, ${firstName}!</h1>
              
              <p style="font-size: 16px; margin-bottom: 24px; text-align: center; color: #475569;">
                We're thrilled to have you join our community. You're now part of a group of smart shippers who save up to <strong>89% on every label</strong> and avoid the lines.
              </p>
              
              <!-- Highlight Box -->
              <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 12px; padding: 24px; margin-bottom: 32px;">
                <h2 style="font-size: 18px; font-weight: 600; color: #0d9488; margin-top: 0; margin-bottom: 12px;">You are cleared to start shipping immediately:</h2>
                <ul style="margin: 0; padding-left: 20px; color: #134e4a; font-size: 15px;">
                  <li style="margin-bottom: 8px;"><strong>Save your addresses:</strong> Use the Address Book to speed up your workflow.</li>
                  <li style="margin-bottom: 0;"><strong>Compare rates:</strong> See live prices from USPS, UPS, and FedEx in one view.</li>
                </ul>
              </div>
              
              <!-- Buttons -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" class="button-container">
                    <a href="${process.env.APP_URL || '#'}/dashboard" class="button" style="display: inline-block; background-color: #0d9488; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px; margin: 0 8px 16px 8px;">Go to My Dashboard</a>
                    <a href="${process.env.APP_URL || '#'}/shipments/new" class="button" style="display: inline-block; background-color: #1e293b; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 16px; margin: 0 8px 16px 8px;">Create Label</a>
                  </td>
                </tr>
              </table>
              
              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 32px;">
                If you have any questions, simply reply to this email. Our team is always here to help.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 32px 40px; text-align: center; color: #94a3b8; font-size: 12px;">
              <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Poast Office. All rights reserved.</p>
              <p style="margin: 0;">Commercial Shipping Made Simple.</p>
              <div style="margin-top: 16px;">
                <a href="${process.env.APP_URL || '#'}/privacy" style="color: #94a3b8; text-decoration: underline;">Privacy Policy</a>
                <span style="padding: 0 8px;">&bull;</span>
                <a href="${process.env.APP_URL || '#'}/terms" style="color: #94a3b8; text-decoration: underline;">Terms of Service</a>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail({ to: email, subject, text, html });
}
