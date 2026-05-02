import { Router, Response, Request } from "express";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { getErrorMessage, getErrorStatusCode } from "../../shared/utils/errors";
import * as schemas from "../../shared/schemas/api";
import { fulfillShipment } from "../services/carrier.service";
import { sendLabelConfirmation } from "../services/emailService";

const router = Router();

router.post("/:shipmentId/fulfill", authenticateUser, async (req: Request, res: Response) => {
  const shipmentId = req.params.shipmentId as string;
  const authReq = req as AuthenticatedRequest;
  try {
    const { shipmentDetails, labelFormat, labelSize } = req.body;
    if (!shipmentDetails) {
      return res.status(400).json({ error: "shipmentDetails is required" });
    }
    const shipment = await fulfillShipment(shipmentId, shipmentDetails, undefined, authReq.user.id, labelFormat, labelSize);
    
    // Send confirmation email asynchronously
    if (authReq.user.email) {
      sendLabelConfirmation(authReq.user.email, shipment).catch(err => {
        console.error(`[Fulfill] Failed to send confirmation email for shipment ${shipmentId}:`, err);
      });
    }

    res.json({ 
      status: 'success', 
      shipment: shipment 
    });
  } catch (error: unknown) {
    console.error(`[Fulfill] Error fulfilling shipment ${shipmentId}:`, error);
    res.status(getErrorStatusCode(error)).json({ 
      status: 'error', 
      error: getErrorMessage(error)
    });
  }
});

export default router;
