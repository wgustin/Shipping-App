import { Router, Response, Request } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getErrorMessage, getErrorStatusCode } from "../../shared/utils/errors";
import { Address } from "../../shared/types";
import { validateAddress, autocompleteAddress, getAddressDetails } from "../services/address.service";
import * as schemas from "../../shared/schemas/api";

const router = Router();

router.get("/autocomplete", async (req: Request, res: Response) => {
  const requestId = req.requestId || Math.random().toString(36).substring(7);
  try {
    const input = req.query.input as string;
    if (!input) return res.json({ predictions: [] });
    const data = await autocompleteAddress(input, requestId);
    res.json(data);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

router.get("/details/:placeId", async (req: Request, res: Response) => {
  const requestId = req.requestId || Math.random().toString(36).substring(7);
  try {
    const data = await getAddressDetails(req.params.placeId as string, requestId);
    res.json(data);
  } catch (error: unknown) {
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

router.post("/validate", authenticateUser, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const requestId = authReq.requestId;
  try {
    const { address } = schemas.AddressValidateSchema.parse(req.body);
    const result = await validateAddress(address, requestId);
    res.json(result);
  } catch (error: unknown) {
    console.error(`[${requestId}] ❌ Address Validation Error:`, getErrorMessage(error));
    res.status(getErrorStatusCode(error)).json({ error: getErrorMessage(error) });
  }
});

export default router;
