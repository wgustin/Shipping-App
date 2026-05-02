
import dotenv from 'dotenv';
import { sendWelcomeEmail } from '../src/server/services/emailService';

dotenv.config();

async function run() {
  const email = 'wgustin@gmail.com';
  const firstName = 'Wgustin';

  console.log(`[Manual] Sending welcome email to ${email}...`);

  try {
    const result = await sendWelcomeEmail(email, firstName);
    console.log('[Manual] Success! Welcome email sent:', result);
  } catch (error) {
    console.error('[Manual] Failed to send welcome email:', error);
    process.exit(1);
  }
}

run();
