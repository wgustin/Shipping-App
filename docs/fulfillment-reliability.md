# Fulfillment Reliability & Idempotency

This document outlines the architecture and operational procedures for the shipment fulfillment flow, specifically focusing on reliability, idempotency, and recovery from partial failures.

## 1. Race Conditions & Idempotency Gaps Addressed

Prior to these changes, the fulfillment flow was vulnerable to several race conditions:
- **Duplicate Webhooks:** Stripe can deliver the same `payment_intent.succeeded` webhook multiple times. Without idempotency, this could trigger multiple label purchases for the same shipment.
- **Concurrent Fulfillment:** If a user refreshed the success page while a webhook was processing, two concurrent `fulfillShipment` calls could occur, potentially leading to duplicate label purchases.
- **Partial Failures:** If the carrier API (eHub) successfully generated a label, but the subsequent database update failed (e.g., due to a network blip or DB constraint), the system would lose track of the purchased label, and a retry would purchase a *second* label.

## 2. Changes Made

To address these vulnerabilities, the following mechanisms were implemented:

### A. Webhook Idempotency (`processed_events` table)
- A new table `processed_events` stores the IDs of all successfully processed Stripe webhook events.
- Before processing a `payment_intent.succeeded` event, the system checks this table. If the event ID exists, it is skipped.
- The event ID is inserted into this table *only after* successful fulfillment.

### B. Atomic Locking (`processing_status` column)
- The `shipments` table now uses an atomic update to acquire a lock: `.update({ status: 'processing', processing_status: 'locked' }).or("status.eq.error,status.eq.created")`.
- This ensures that only one worker (webhook or direct API call) can transition a shipment from `created` or `error` to `processing`.
- If a worker fails to acquire the lock (because another worker already did), it gracefully exits.

### C. Stale Lock Recovery
- When acquiring a lock, a `fulfillmentStartedAt` timestamp is recorded in `package_details`.
- If a shipment is stuck in the `processing` state for more than 5 minutes, the lock is considered stale, and another worker can attempt to process it.

### D. Partial Failure Handling (Carrier Success, DB Failure)
- This is the most critical failure mode. If `fetch` to eHub succeeds, but the `finalizeShipment` database update fails:
  - The system logs a **CRITICAL** error.
  - It returns a `200 OK` to Stripe to prevent retries (which would purchase another label).
  - The shipment remains in the `processing` state, requiring manual reconciliation.

### E. Quoted Rate Consumption
- The `quoted_rates` table's `used_at` column is now updated *before* triggering fulfillment. This prevents the same rate from being used for multiple shipments.

### F. Payment Intent Reuse
- The `create-payment-intent` endpoint now checks if a valid `PaymentIntent` already exists for the shipment (stored in `package_details.paymentIntentId`). If so, it reuses it instead of creating a new one.

## 3. Operational Caveats & Manual Reconciliation

Despite these safeguards, certain edge cases require manual intervention.

### Monitoring
Set up alerts for the following conditions:
1. **Shipments stuck in `processing`:** Any shipment with `status === 'processing'` for more than 15 minutes.
2. **Critical Errors:** Search server logs for `[CRITICAL] Carrier purchase succeeded, but DB update failed`.
3. **Shipments in `error` state:** Any shipment with `status === 'error'`.

### Manual Reconciliation Process

**Scenario 1: Shipment stuck in `processing` (Critical Error logged)**
*Cause:* eHub label was purchased, but the database update failed.
*Action:*
1. Locate the shipment ID in the database.
2. Check the server logs for the `[CRITICAL]` error to find the eHub `tracking_number` and `label_url`.
3. Alternatively, log into the eHub dashboard and find the shipment using the internal shipment ID (passed as the `reference` field).
4. Manually update the `shipments` table:
   - `status` = `created`
   - `tracking_number` = the actual tracking number
   - `label_url` = the actual label URL
   - `package_details.isProcessing` = `false`

**Scenario 2: Shipment in `error` state**
*Cause:* eHub API failed (e.g., invalid address, insufficient funds) or a database error occurred *before* carrier purchase.
*Action:*
1. Check the `package_details.lastError` and `package_details.carrierRawResponse` fields in the database.
2. If it's a user error (e.g., invalid address), the user may need to create a new shipment.
3. If it's a transient error, you can manually reset the status to `created` and clear the `tracking_number` (if it's a PENDING placeholder) to allow the user to retry payment/fulfillment.

**Scenario 3: Duplicate Webhooks (Handled automatically)**
*Cause:* Stripe retries a webhook.
*Action:* None required. The `processed_events` table will safely ignore the duplicate.
