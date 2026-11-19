import settings from "./stay-offer.json";
import { getStayAvailability, type AvailabilityResult } from "./availability";

export type StayRates = {
  firstSectionNightly: number | null;
  secondSectionNightly: number | null;
  bothSectionsNightly: number | null;
  firstOfferNight: string;
  lastOfferNight: string;
};

const day = 86_400_000;
function dateNumber(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().startsWith(value) ? time / day : NaN;
}

function validRate(value: number | null): value is number {
  return value !== null && Number.isFinite(value) && value > 0;
}

export function stayQuote(id: string, from: string, to: string, rates: StayRates = settings) {
  const arrival = dateNumber(from), departure = dateNumber(to);
  const nights = departure - arrival;
  if (!(nights > 0)) return null;
  const first = rates.firstSectionNightly, second = rates.secondSectionNightly;
  const base = id === "20" ? first : id === "21" ? second :
    id === "both" && validRate(first) && validRate(second) ? first + second : null;
  if (!validRate(base)) return null;
  const original = Math.round(base * nights * 100) / 100;
  const special = rates.bothSectionsNightly;
  let savings = 0;
  if (id === "both" && validRate(special) && special < base) {
    const start = Math.max(arrival, dateNumber(rates.firstOfferNight));
    const end = Math.min(departure, dateNumber(rates.lastOfferNight) + 1);
    if (end > start) savings = Math.round((end - start) * (base - special) * 100) / 100;
  }
  return {original, savings, amount: Math.round((original - savings) * 100) / 100};
}

export function sectionAvailability(id: string, result: AvailabilityResult) {
  if (id !== "both") return getStayAvailability(id, result);
  const states = ["20", "21"].map(key => getStayAvailability(key, result));
  if (states.includes("unavailable")) return "unavailable";
  return states.every(state => state === "available") ? "available" : "unknown";
}
