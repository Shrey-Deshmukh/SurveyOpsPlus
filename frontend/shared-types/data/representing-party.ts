export enum RepresentingParty {
  Shipper = "Shipper",
  Reciever = "Reciever",
  FreightForwarder = "Freight Forwarder",
  Terminal = "Terminal",
  ShippingLine = "Shipping line",
}

export const REPRESENTING_PARTY_OPTIONS: RepresentingParty[] = [
  RepresentingParty.Shipper,
  RepresentingParty.Reciever,
  RepresentingParty.FreightForwarder,
  RepresentingParty.Terminal,
  RepresentingParty.ShippingLine,
];

export function isRepresentingParty(value: string): value is RepresentingParty {
  return REPRESENTING_PARTY_OPTIONS.includes(value as RepresentingParty);
}
