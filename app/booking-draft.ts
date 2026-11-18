import cabins from "./cabins.json";
import { normalizeAddons } from "./addon-selection";
import { getResortOffer, normalizeExtensionHours } from "./resort-offers";
export const DRAFT_KEY="familyday-booking-draft-v1";
export const DRAFT_TTL=24*60*60*1000;
export function readBookingDraft(raw:string|null,today:string,now=Date.now()) {
 try {
  if(!raw)return null;
  const d=JSON.parse(raw);
  if(d.version!==1||!Number.isFinite(d.savedAt)||now-d.savedAt>DRAFT_TTL||d.savedAt>now||!cabins.some(c=>c.property==="resort"&&String(c.id)===d.selectedKey))return null;
  const validDate=(value:unknown)=>typeof value==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&new Date(value+"T12:00:00Z").toISOString().slice(0,10)===value;
  const dates=validDate(d.from)&&validDate(d.to)&&d.from>=today&&d.to>d.from;
  const { ids: addons, quantities } = normalizeAddons(
    Array.isArray(d.addons) ? d.addons : [], d.addonQuantities ?? {}, "resort"
  );
  const offer=dates&&d.offerCabinId===d.selectedKey?getResortOffer(d.resortOfferId,d.selectedKey):null;
  return {selectedKey:d.selectedKey as string,from:dates?d.from as string:"",to:dates?d.to as string:"",addons,addonQuantities:quantities,offerCabinId:offer?d.selectedKey as string:null,resortOfferId:offer?.id??null,resortExtensionHours:offer?.shortStay?normalizeExtensionHours(d.resortExtensionHours):0};
 }catch{return null;}
}
