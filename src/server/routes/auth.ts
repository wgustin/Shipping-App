
import { Router, Request, Response } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { sendWelcomeEmail } from "../services/emailService";

const router = Router();

/**
 * Trigger a welcome email for a new user
 * This is called from the client after a successful signup
 */
router.post("/welcome", authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const { firstName } = req.body;
  const requestId = authReq.requestId;

  console.log(`[${requestId}] 📧 Welcome email request received for: ${authReq.user.email}`);

  if (!authReq.user.email) {
    console.error(`[${requestId}] 📧 Welcome email failed: No email in auth object`);
    return res.status(400).json({ error: "User email not found" });
  }

  try {
    console.log(`[${requestId}] 📧 Attempting to send welcome email to ${authReq.user.email}...`);
    await sendWelcomeEmail(authReq.user.email, firstName || 'there');
    console.log(`[${requestId}] 📧 Welcome email process completed successfully`);
    res.json({ status: 'success', message: 'Welcome email sent' });
  } catch (error) {
    console.error(`[${requestId}] 📧 Error triggering welcome email:`, error);
    res.status(500).json({ error: "Failed to send welcome email" });
  }
});

export default router;
