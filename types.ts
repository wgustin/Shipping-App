
export interface Address {
  id?: string;
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface PackageDetails {
  length: number;
  width: number;
  height: number;
  weight: number; // lbs
  unit: 'in' | 'cm';
  weightUnit: 'lb' | 'kg';
}

export interface Rate {
  id: string;
  carrier: string; // 'USPS' | 'UPS' | 'FedEx' | 'DHL'
  serviceName: string;
  totalAmount: number;
  currency: string;
  deliveryDays: number;
  estimatedDeliveryDate: string;
}

export interface Shipment {
  id: string;
  createdDate: string;
  fromAddress: Address;
  toAddress: Address;
  packageDetails: PackageDetails;
  selectedRate: Rate;
  trackingNumber: string;
  labelUrl: string;
  status: 'created' | 'shipped' | 'delivered' | 'cancelled';
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  balance: number;
  defaultFromAddressId?: string;
}
