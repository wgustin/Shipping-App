import { z } from 'zod';

export const addressSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  company: z.string().trim().max(100, 'Company name is too long').nullish(),
  street1: z.string().trim().min(1, 'Street address is required').max(150, 'Street address is too long'),
  street2: z.string().trim().max(150, 'Street address is too long').nullish(),
  city: z.string().trim().min(1, 'City is required').max(100, 'City is too long'),
  state: z.string().trim().min(1, 'State is required').max(50, 'State is too long'),
  zip: z.string().trim().min(1, 'ZIP Code is required').max(20, 'ZIP Code is too long').refine((val) => {
    if (!val) return false;
    // Support 5-digit or 9-digit (ZIP+4) format
    return /^\d{5}(-\d{4})?$/.test(val);
  }, {
    message: "Invalid ZIP Code. Use 12345 or 12345-6789."
  }),
  country: z.string().trim().min(1, 'Country is required').max(50, 'Country is too long'),
  phone: z.string().trim().max(20, 'Phone number is too long').nullish(),
  email: z.string().trim().email().max(100, 'Email is too long').nullish().or(z.string().length(0)),
  id: z.string().nullish(),
});

export const packageSchema = z.object({
  length: z.number({ message: ' ' }).positive('Length must be positive').max(1000, 'Length is too large'),
  width: z.number({ message: ' ' }).positive('Width must be positive').max(1000, 'Width is too large'),
  height: z.number({ message: ' ' }).positive('Height must be positive').max(1000, 'Height is too large'),
  weight: z.number({ message: ' ' }).positive('Weight must be positive').max(10000, 'Weight is too large'),
  unit: z.enum(['in', 'cm']),
  weightUnit: z.enum(['lb', 'oz', 'kg']),
});

export const shipmentFormSchema = z.object({
  fromAddress: addressSchema,
  toAddress: addressSchema,
  package: packageSchema,
});

export type AddressFormData = z.infer<typeof addressSchema>;
export type PackageFormData = z.infer<typeof packageSchema>;
export type ShipmentFormData = z.infer<typeof shipmentFormSchema>;
