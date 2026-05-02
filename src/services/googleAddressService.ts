
import { Address } from "../shared/types";
import * as schemas from "../shared/schemas/api";
import { apiClient } from "./apiClient";

export interface ValidationVerdict {
  inputGranularity: string;
  validationGranularity: string;
  geocodeGranularity: string;
  addressComplete: boolean;
  hasUnconfirmedComponents: boolean;
  hasInferredComponents: boolean;
  hasReplacedComponents: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  isStandardized: boolean;
  isUnverifiable: boolean;
  isPartialFix?: boolean;
  verdict: ValidationVerdict;
  standardizedAddress: Address;
  originalAddress: Address;
  diffs: string[];
}

export const validateAddress = async (address: Address): Promise<ValidationResult> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const data = await apiClient('/api/address/validate', {
      method: 'POST',
      body: JSON.stringify({ address }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log("[googleAddressService] Raw data from API:", data);

    const validatedData = schemas.ValidationResultSchema.parse(data);
    return validatedData as ValidationResult;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error("Address verification timed out. Please check your connection and try again.");
    }
    throw err;
  }
};
