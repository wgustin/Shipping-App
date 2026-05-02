import { Router, Response, Request } from "express";
import { rateLimit } from "express-rate-limit";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getErrorMessage, getErrorStatusCode } from "../../shared/utils/errors";
import { parseAddressWithAI } from "../services/ai.service";

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20, // Limit each IP to 20 AI requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: "AI usage limit reached for this hour. Please try again later." }
});

router.post("/parse-address", authenticateUser, aiLimiter, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const requestId = authReq.requestId;
  try {
    const { rawText } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "rawText is required" });
    }

    const parsed = await parseAddressWithAI(rawText);
    res.json(parsed);
  } catch (error: unknown) {
    console.error(`[${requestId}] ❌ AI Parse Error:`, getErrorMessage(error));
    res.status(getErrorStatusCode(error)).json({ error: "Failed to parse address with AI" });
  }
});

export default router;
