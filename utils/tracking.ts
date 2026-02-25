export const getTrackingUrl = (carrier: string, trackingNumber: string): string => {
  const c = carrier.toUpperCase();
  if (c.includes('USPS')) {
    return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${trackingNumber}`;
  }
  if (c.includes('UPS')) {
    return `https://www.ups.com/track?loc=en_US&tracknum=${trackingNumber}`;
  }
  if (c.includes('FEDEX')) {
    return `https://www.fedex.com/en-us/tracking.html`;
  }
  return `https://www.google.com/search?q=${carrier}+tracking+${trackingNumber}`;
};
