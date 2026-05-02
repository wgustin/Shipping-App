
import { z } from './schemas/api';
import { 
  AddressSchema, 
  PackageSchema, 
  RateSchema, 
  CreateShipmentSchema,
  EhubAddressSchema,
  EhubParcelSchema
} from './schemas/api';

export type Address = z.infer<typeof AddressSchema> & { 
  id?: string | null | undefined;
  first_name?: string | null | undefined;
  last_name?: string | null | undefined;
  address1?: string | null | undefined;
  address2?: string | null | undefined;
  postal_code?: string | null | undefined;
  company?: string | null | undefined;
};
export type PackageDetails = z.infer<typeof PackageSchema> & {
  lastError?: string;
  isProcessing?: boolean;
  carrierId?: string;
  carrierRawResponse?: unknown;
  lastProcessedEventId?: string;
  fulfillmentStartedAt?: string;
  processingOwner?: string;
  fulfilledAt?: string;
  reconciliationNeeded?: boolean;
  paymentIntentId?: string;
  labelFormat?: string;
  paperSize?: string;
};

export type Rate = z.infer<typeof RateSchema> & {
  id: string;
  currency: string;
  deliveryDays: number;
  estimatedDeliveryDate: string;
  secureRateId: string;
};

export interface Shipment {
  id: string;
  createdDate: string;
  fromAddress: Address;
  toAddress: Address;
  packageDetails: PackageDetails;
  selectedRate: Rate;
  trackingNumber: string | null;
  labelUrl: string | null;
  status: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'error' | 'voided';
}

export interface DbShipment {
  id: string;
  created_at: string;
  user_id: string;
  from_address_json: Address;
  to_address_json: Address;
  package_details: PackageDetails;
  selected_rate: Rate;
  tracking_number: string | null;
  label_url: string | null;
  status: 'created' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'error' | 'voided';
  processing_status: 'pending' | 'processing' | 'completed' | 'error' | 'locked';
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  balance: number;
  defaultFromAddressId?: string | null;
  role: 'user' | 'admin';
  labelFormat?: 'PDF' | 'PNG' | 'ZPL';
  labelSize?: '4x6' | '8.5x11';
}

export type EhubAddress = z.infer<typeof EhubAddressSchema>;
export type EhubParcel = z.infer<typeof EhubParcelSchema>;

/**
 * eHub Service Rate from the API
 */
export interface EhubServiceRate {
  service_id: string | number;
  carrier_code?: string | null;
  service?: string | null;
  rate?: string | number | null;
  delivery_days?: string | number | null;
  delivery_date?: string | null;
  secureRateId?: string | null;
}

/**
 * eHub Rate Response from the API
 */
export interface EhubRateResponse {
  service_rates?: EhubServiceRate[] | null;
  message?: string;
  error?: string;
  errors?: string[];
}

/**
 * Google Address Validation API types
 */
export interface GoogleAddressComponent {
  componentName: {
    text: string;
    languageCode: string;
  };
  componentType: string;
  confirmationLevel: string;
  inferred?: boolean;
  spellCorrected?: boolean;
  replaced?: boolean;
  unexpected?: boolean;
}

export interface GoogleAddressValidationResponse {
  result: {
    verdict: {
      inputGranularity: string;
      validationGranularity: string;
      geocodeGranularity: string;
      addressComplete?: boolean;
      hasUnconfirmedComponents?: boolean;
      hasInferredComponents?: boolean;
      hasReplacedComponents?: boolean;
    };
    address: {
      formattedAddress: string;
      postalAddress: {
        regionCode: string;
        languageCode: string;
        postalCode: string;
        administrativeArea: string;
        locality: string;
        addressLines: string[];
      };
      addressComponents: GoogleAddressComponent[];
    };
    geocode: {
      location: {
        latitude: number;
        longitude: number;
      };
      plusCode: {
        globalCode: string;
        compoundCode: string;
      };
      bounds: {
        low: { latitude: number; longitude: number };
        high: { latitude: number; longitude: number };
      };
      featureSizeMeters: number;
      placeId: string;
      placeTypes: string[];
    };
    metadata?: {
      business?: boolean;
      poBox?: boolean;
      residential?: boolean;
    };
    uspsData?: {
      standardizedAddress: {
        addressLine1: string;
        cityStateZipAddressLine: string;
        city: string;
        state: string;
        zipCode: string;
        zipCodeExtension: string;
      };
      deliveryPointCode: string;
      deliveryPointCheckDigit: string;
      dpvConfirmation: string;
      dpvFootnote: string;
      dpvCmra: string;
      dpvVacant: string;
      dpvNoStat: string;
      carrierRoute: string;
      carrierRouteIndicator: string;
      postOfficeCity: string;
      postOfficeState: string;
      fipsCountyCode: string;
      county: string;
      elotNumber: string;
      elotFlag: string;
      lacsLinkIndicator: string;
      lacsLinkReturnCode: string;
      active: boolean;
    };
  };
  responseId: string;
}

/**
 * eHub Fulfillment Response
 */
export interface EhubFulfillmentResponse {
  id?: string | number;
  shipment_id?: string | number;
  tracking_number?: string;
  label_url?: string;
  message?: string;
  error?: string;
  shipment?: {
    id?: string | number;
    tracking_number?: string;
    label_url?: string;
    postage_label?: {
      image_url?: string;
      label_url?: string;
    };
    parcels?: {
      tracking_number?: string;
      label_url?: string;
      postage_label?: {
        image_url?: string;
        label_url?: string;
      };
    }[];
  };
  parcels?: {
    tracking_number?: string;
    label_url?: string;
    postage_label?: {
      image_url?: string;
      label_url?: string;
    };
  }[];
}

/**
 * Authenticated user as it appears on the Request object
 */
export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * Secure rate record stored in the database
 */
export interface SecureRateRecord {
  secure_rate_id: string;
  rate_id: string;
  user_id: string;
  amount: number;
  carrier: string;
  service_name: string;
  expires_at: string;
  used_at?: string | null;
  origin_address: z.infer<typeof EhubAddressSchema>;
  destination_address: z.infer<typeof EhubAddressSchema>;
  parcel_details: z.infer<typeof EhubParcelSchema>[];
}

/**
 * Metadata stored in Stripe PaymentIntent
 */
export interface PaymentIntentMetadata {
  userId: string;
  shipmentId: string;
  rateId: string;
  carrier: string;
  serviceName: string;
}

/**
 * Result of a fulfillment operation
 */
export interface FulfillmentResult {
  success: boolean;
  shipmentId: string;
  trackingNumber?: string;
  labelUrl?: string;
  error?: string;
  carrierResponse?: unknown;
}

/**
 * Standard shape for carrier errors
 */
export interface CarrierError {
  code?: string;
  message: string;
  details?: unknown;
}
