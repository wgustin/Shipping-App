import { Request, Response, NextFunction } from "express";
import { auth } from "../firebaseAdmin";
import { AuthUser } from "../../shared/types";
import { getErrorMessage } from "../../shared/utils/errors";

/**
 * Reusable request type for authenticated routes
 */
export interface AuthenticatedRequest<P = unknown, ResBody = unknown, ReqBody = unknown, ReqQuery = unknown> 
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  user: AuthUser;
  requestId: string;
}

/**
 * Middleware to verify Firebase user
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const requestId = (req as any).requestId as string;
  
  if (!authHeader || authHeader === 'Bearer ' || authHeader === '') {
    console.warn(`[${requestId}] 🔐 Auth failed: Missing Authorization header on ${req.method} ${req.path}`);
    return res.status(401).json({ error: "Authentication required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    console.warn(`[${requestId}] 🔐 Auth failed: Missing token in header`);
    return res.status(401).json({ error: "Authentication token required" });
  }

  try {
    console.log(`[${requestId}] 🔐 Verifying token with Firebase...`);
    const decodedToken = await auth.verifyIdToken(token);
    
    if (!decodedToken) {
      console.warn(`[${requestId}] 🔐 Auth failed: Invalid or expired session`);
      return res.status(401).json({ error: "Invalid or expired session" });
    }
    
    console.log(`[${requestId}] 🔐 User verified: ${decodedToken.uid}.`);
    
    // We cannot fetch the role from Firestore using firebase-admin with applicationDefault()
    // because it lacks the necessary IAM permissions in this environment.
    // We will assume 'user' role by default. If admin privileges are needed,
    // they should be checked via custom claims or client-side checks.
    const role = 'user';

    const authReq = req as AuthenticatedRequest;
    authReq.user = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role: role
    };
    
    next();
  } catch (err: any) {
    console.error(`[${requestId}] ❌ Auth error details:`, err.message || err);
    return res.status(401).json({ error: "Invalid or expired session", details: err.message || String(err) });
  }
};

/**
 * Middleware to require admin privileges
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.role !== 'admin') {
    return res.status(403).json({ error: "Admin privileges required" });
  }
  next();
};
