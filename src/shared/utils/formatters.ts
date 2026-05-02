export const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export const getCarrierLogo = (carrier?: string) => {
  if (!carrier) return null;
  const c = carrier.toLowerCase();
  if (c.includes('ups')) return '/ups.svg';
  if (c.includes('usps')) return '/usps.svg';
  return null;
};

export const getWeightInOunces = (weight: number, unit: string): number => {
  const w = Number(weight) || 0;
  switch (unit?.toLowerCase()) {
    case 'lb': return w * 16;
    case 'oz': return w;
    case 'kg': return w * 35.274;
    case 'g': return w * 0.035274;
    default: return w;
  }
};

export const formatAddressForEhub = (addr: any) => {
  return {
    company: (addr.company || addr.name || `${addr.first_name || ''} ${addr.last_name || ''}`.trim() || "Recipient").substring(0, 50),
    first_name: "",
    last_name: "",
    phone: (addr.phone || "5555555555").replace(/\D/g, '').substring(0, 10) || "5555555555",
    email: (addr.email || "customer@poast.app").substring(0, 50),
    address1: (addr.street1 || addr.address1 || "").substring(0, 50),
    address2: (addr.street2 || addr.address2 || "").substring(0, 50),
    city: (addr.city || "").substring(0, 35),
    state: (addr.state || "").toUpperCase().trim().substring(0, 2),
    country: (addr.country || "US").toUpperCase().trim().substring(0, 2),
    postal_code: (addr.zip || addr.postal_code || "").trim().substring(0, 10)
  };
};
