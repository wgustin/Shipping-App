import { Address, Rate, Shipment } from "../types";

// Mock delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockValidateAddress = async (address: Address): Promise<{ isValid: boolean; messages: string[] }> => {
  await delay(800); // Simulate API call
  
  if (!address.street1 || !address.city || !address.state || !address.zip) {
    return { isValid: false, messages: ["Missing required address fields."] };
  }

  // Simulate a specific failure case
  if (address.zip === "00000") {
    return { isValid: false, messages: ["Invalid ZIP code provided."] };
  }

  return { isValid: true, messages: [] };
};

export const mockGetRates = async (from: Address, to: Address, pkg: any): Promise<Rate[]> => {
  await delay(1500); // Simulate shopping for rates

  // Generate deterministic but realistic looking rates based on zip codes
  const basePrice = 5 + (parseInt(to.zip.substring(0, 2) || "10") / 10);
  
  const today = new Date();
  const addDays = (days: number) => {
    const result = new Date(today);
    result.setDate(result.getDate() + days);
    return result.toLocaleDateString();
  };

  return [
    {
      id: 'rate_usps_gnd',
      carrier: 'USPS',
      serviceName: 'Ground Advantage',
      totalAmount: parseFloat((basePrice * 0.8).toFixed(2)),
      currency: 'USD',
      deliveryDays: 5,
      estimatedDeliveryDate: addDays(5),
    },
    {
      id: 'rate_usps_prio',
      carrier: 'USPS',
      serviceName: 'Priority Mail',
      totalAmount: parseFloat((basePrice * 1.5).toFixed(2)),
      currency: 'USD',
      deliveryDays: 2,
      estimatedDeliveryDate: addDays(2),
    },
    {
      id: 'rate_ups_gnd',
      carrier: 'UPS',
      serviceName: 'Ground',
      totalAmount: parseFloat((basePrice * 1.1).toFixed(2)),
      currency: 'USD',
      deliveryDays: 4,
      estimatedDeliveryDate: addDays(4),
    },
    {
      id: 'rate_fedex_2day',
      carrier: 'FedEx',
      serviceName: '2Day',
      totalAmount: parseFloat((basePrice * 2.5).toFixed(2)),
      currency: 'USD',
      deliveryDays: 2,
      estimatedDeliveryDate: addDays(2),
    },
  ];
};

export const mockCreateShipment = async (
  from: Address,
  to: Address,
  rate: Rate,
  pkg: any
): Promise<Shipment> => {
  await delay(2000); // Simulate label generation and payment processing

  const id = `shp_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const tracking = `TRK${Math.floor(Math.random() * 1000000000)}`;

  return {
    id,
    createdDate: new Date().toISOString(),
    fromAddress: from,
    toAddress: to,
    packageDetails: pkg,
    selectedRate: rate,
    trackingNumber: tracking,
    // Using a placeholder image for the label
    labelUrl: "https://picsum.photos/600/800",
    status: 'created',
  };
};

export const mockProcessPayment = async (amount: number, paymentMethodId: string): Promise<boolean> => {
    await delay(1500);
    // Simulate 90% success rate
    return Math.random() > 0.1;
}
