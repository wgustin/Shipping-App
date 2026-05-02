import { z } from 'zod';

export { z };

export const AddressSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().trim().max(20, "Phone number is too long").nullish().or(z.literal('')),
  email: z.string().trim().email().max(100, "Email is too long").nullish().or(z.string().length(0)).or(z.null()),
  street1: z.string().trim().min(1, "Street address is required").max(150, "Street address is too long"),
  street2: z.string().trim().max(150, "Street address is too long").nullish(),
  city: z.string().trim().min(1, "City is required").max(100, "City is too long"),
  state: z.string().trim().length(2, "State must be a 2-letter code"),
  zip: z.string().trim().min(5, "ZIP code must be at least 5 digits").max(10, "ZIP code too long").regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format (use 12345 or 12345-6789)"),
  country: z.string().trim().min(1, 'Country is required').max(50, "Country is too long"),
});

export const PackageSchema = z.object({
  length: z.number().positive().max(108, "Length cannot exceed 108 inches"),
  width: z.number().positive().max(108, "Width cannot exceed 108 inches"),
  height: z.number().positive().max(108, "Height cannot exceed 108 inches"),
  weight: z.number().positive().max(150, "Weight cannot exceed 150 lbs"),
  unit: z.string().optional().default('in'),
  weightUnit: z.string().optional().default('lb'),
});

export const RateSchema = z.object({
  id: z.string().or(z.number()),
  carrier: z.string(),
  serviceName: z.string(),
  totalAmount: z.number().positive(),
  secureRateId: z.string().optional(),
});

export const CreateCheckoutSessionSchema = z.object({
  rate: RateSchema.extend({ secureRateId: z.string() }),
  from: AddressSchema,
  to: AddressSchema,
  pkg: PackageSchema,
  idempotencyKey: z.string().optional(),
});

export const CreatePaymentIntentSchema = z.object({
  rate: RateSchema.extend({ secureRateId: z.string() }),
});

export const EhubAddressSchema = z.object({
  company: z.string().nullish(),
  address1: z.string(),
  address2: z.string().nullish(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string(),
  phone: z.string().nullish(),
  email: z.string().nullish(),
}).passthrough();

export const EhubParcelSchema = z.object({
  length: z.number(),
  width: z.number(),
  height: z.number(),
  weight: z.number(),
  package_type: z.string().nullish(),
}).passthrough();

export const RatesPayloadSchema = z.object({
  shipment: z.object({
    from_location: EhubAddressSchema,
    to_location: EhubAddressSchema,
    parcels: z.array(EhubParcelSchema),
  }).passthrough().optional(),
  from_location: EhubAddressSchema.optional(),
  to_location: EhubAddressSchema.optional(),
  parcels: z.array(EhubParcelSchema).optional(),
}).passthrough().refine(data => {
  return data.shipment || (data.from_location && data.to_location && data.parcels);
}, {
  message: "Payload must contain either a 'shipment' object or 'from_location', 'to_location', and 'parcels' at the root."
});

export const AddressAutocompleteSchema = z.object({
  input: z.string().min(2),
});

export const AddressDetailsSchema = z.object({
  placeId: z.string(),
});

export const AddressValidateSchema = z.object({
  address: AddressSchema,
});

export const ShippingValidateAddressSchema = z.object({
  street1: z.string(),
  street2: z.string().nullish(),
  city: z.string(),
  state: z.string(),
  zip: z.string().min(5).max(10).regex(/^\d{5}(-\d{4})?$/),
  country: z.string().nullish(),
  validation_level: z.enum(['strict', 'normal']).nullish(),
}).passthrough();

export const CreateShipmentSchema = z.object({
  from: AddressSchema,
  to: AddressSchema,
  rate: RateSchema.extend({ secureRateId: z.string() }),
  pkg: PackageSchema,
});

export const VoidShipmentSchema = z.object({
  carrierId: z.string().or(z.number()),
  shipmentId: z.string().or(z.number()),
});

export const ShipmentResponseSchema = z.object({
  id: z.string().or(z.number()),
  createdDate: z.string(),
  fromAddress: AddressSchema,
  toAddress: AddressSchema,
  packageDetails: PackageSchema.extend({
    carrierId: z.string().optional(),
  }),
  selectedRate: RateSchema,
  trackingNumber: z.string(),
  labelUrl: z.string(),
  status: z.string(),
  warning: z.string().optional(),
});

export const RatesResponseSchema = z.object({
  service_rates: z.array(z.object({
    service_id: z.string().or(z.number()),
    carrier_code: z.string().nullish(),
    service: z.string().nullish(),
    rate: z.string().or(z.number()).nullish(),
    delivery_days: z.string().or(z.number()).nullish(),
    delivery_date: z.string().nullish(),
    secureRateId: z.string().nullish(),
  })).nullish(),
});

export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  isStandardized: z.boolean(),
  isUnverifiable: z.boolean(),
  isPartialFix: z.boolean().optional(),
  verdict: z.object({
    inputGranularity: z.string().optional(),
    validationGranularity: z.string().optional(),
    geocodeGranularity: z.string().optional(),
    addressComplete: z.boolean().nullish().default(false),
    hasUnconfirmedComponents: z.boolean().nullish().default(false),
    hasInferredComponents: z.boolean().nullish().default(false),
    hasReplacedComponents: z.boolean().nullish().default(false),
  }),
  standardizedAddress: AddressSchema,
  originalAddress: AddressSchema,
  diffs: z.array(z.string()).optional().default([]),
});
