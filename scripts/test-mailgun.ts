
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import dotenv from 'dotenv';

dotenv.config();

const mailgun = new Mailgun(formData);

async function testEmail() {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const to = process.env.TEST_EMAIL || 'WGustin@gmail.com';

  console.log(`[Test] Using Domain: ${domain}`);
  console.log(`[Test] Sending to: ${to}`);

  if (!apiKey || !domain) {
    console.error('[Test] Error: MAILGUN_API_KEY or MAILGUN_DOMAIN is missing in environment.');
    process.exit(1);
  }

  const mg = mailgun.client({
    username: 'api',
    key: apiKey,
    url: process.env.MAILGUN_REGION === 'EU' ? 'https://api.eu.mailgun.net' : 'https://api.mailgun.net'
  });

  try {
    const result = await mg.messages.create(domain, {
      from: process.env.MAILGUN_FROM_EMAIL || `Poast Office <noreply@${domain}>`,
      to: [to],
      subject: "Poast Office - Test Integration 📦",
      text: "This is a direct test of the Mailgun integration for Poast Office. If you received this, the connection is working!",
      html: "<h1>Connection Successful!</h1><p>This is a direct test of the Mailgun integration for <strong>Poast Office</strong>. If you received this, the connection is working!</p>"
    });
    console.log('[Test] Success! Mailgun response:', result);
  } catch (error) {
    console.error('[Test] Failed to send test email:', error);
  }
}

testEmail();
