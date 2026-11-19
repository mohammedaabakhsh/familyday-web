"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Home, Building2, Tag, CalendarDays, UserRound, Heart, ChevronRight, ChevronLeft, X, Check, UsersRound, BedDouble, Waves, Armchair, Bath, Volleyball, MapPin, Coffee, Flower2, Info, CircleHelp, ImageIcon, Clock3, ShieldCheck, ConciergeBell } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription, SheetClose } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { arSA } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { DRAFT_KEY, readBookingDraft } from "./booking-draft";
import cabinData from "./cabins.json";
import CabinDetails from "./cabin-details";
import stayRates from "./stay-offer.json";
import { stayQuote, sectionAvailability } from "./stay-pricing";
import ResortAddons from "./resort-addons";
import VenueLocations, { VenueMapLink } from "./venue-locations";
import "./visitor-guide.css";
import ResortDates from "./resort-dates";
import ResortBookingSteps from "./resort-booking-steps";
import { isBookingStep, readRoute, routeHash, type DateField, type DateReturn, type ResortStep, type Route, type Screen } from "./booking-navigation";
import ResortOfferCards from "./resort-offer-cards";
import { getResortOffer, type ResortOfferId } from "./resort-offers";
import { getResortPrice } from "./resort-pricing";
import { NightlyPrice, ResortPriceSummary, ResortPriceAction } from "./resort-price";
import { PROPERTIES, getProperty } from "./property-catalog";
import { getAllowedAddons } from "./booking-addons";
import { addonLinePrice, addonQuantity, changeAddon, EMPTY_ADDONS, includedUnits, type AddonSelection } from "./addon-selection";
import { loadAvailability, type AvailabilityResult, getStayAvailability } from "./availability";

const ServiceDirectory = lazy(() => import("./service-directory"));

type Cabin = typeof cabinData[number];
const NAV = [{ id: "home", label: "الرئيسية", icon: Home }, { id: "locations", label: "المواقع", icon: MapPin }, { id: "offers", label: "العروض", icon: Tag }, { id: "services", label: "الخدمات", icon: ConciergeBell }, { id: "account", label: "حسابي", icon: UserRound }] as const;
// Owner-approved temporary destination imagery for visual review only.
const DESTINATION_PREVIEW_IMAGES: Record<string, string> = { "resort-obhur": "/assets/palm_1.webp", chalet: "/assets/royal_1.webp" };
const ROOMS = [{ id: "all", label: "الكل" }, { id: "one", label: "غرفة" }, { id: "two", label: "غرفتين" }];
const SECTIONS = [{ id: "first", label: "القسم الأول" }, { id: "second", label: "القسم الثاني" }, { id: "both", label: "القسمين مع بعض" }];
const n = (v: number) => new Intl.NumberFormat("ar-SA-u-nu-latn").format(v);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => new Date(`${s}T12:00:00`);
const label = (s: string) => s ? parse(s).toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { day: "numeric", month: "short" }) : "اختر التاريخ";
const cabinCount = (count: number) => {
 if (count === 1) return "كوخ واحد";
 if (count === 2) return "كوخان";
 return n(count) + (count <= 10 ? " أكواخ" : " كوخا");
};
const capacity = (v: number) => v === 2 ? "حتى ضيفين" : `حتى ${n(v)} ${v <= 10 ? "ضيوف" : "ضيف"}`;
const todayInJeddah = () => parse(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
const selectionUnits = (key: string) => key === "both" ? cabinData.filter(c => c.property === "stay") : cabinData.filter(c => String(c.id) === key);
const selectionProperty = (key: string) => key === "chalet" ? "chalet" : key === "both" ? "stay" : selectionUnits(key)[0]?.property ?? "resort";
const selectionName = (key: string) => key === "both" ? "القسم الأول والثاني معًا" : key === "chalet" ? "الشاليه" : selectionUnits(key)[0]?.name ?? "بيت الدوم";
const validSelection = (key: string) => key === "both" || key === "chalet" || cabinData.some(c => String(c.id) === key);
const emptyAvailability: AvailabilityResult = { connection: "not_configured", stays: [] };

export default function Experience() {
 const [route, setRoute] = useState<Route>({ screen: "home", id: "resort" });
 const [property, setProperty] = useState("resort");
 const directoryReturn = useRef<Route | null>(null);
 const [selectedKey, setSelectedKey] = useState("1");
 const selectedKeyRef = useRef("1");
 const [roomFilter, setRoomFilter] = useState("all");
 const [sectionFilter, setSectionFilter] = useState("all");
 const [from, setFrom] = useState("");
 const [to, setTo] = useState("");
 const [offerCabinId,setOfferCabinId] = useState<string | null>(null);
 const [resortOfferId,setResortOfferId] = useState<ResortOfferId | null>(null);
 const [resortExtensionHours,setResortExtensionHours] = useState(0);
 const [favorites, setFavorites] = useState<string[]>([]);
 const [ready, setReady] = useState(false);
 const [extras, setExtras] = useState<AddonSelection>(EMPTY_ADDONS);
 const { ids: addons, quantities: addonQuantities } = extras;
 const [gallery, setGallery] = useState(0);
 const [searchDatesOpen, setSearchDatesOpen] = useState(false);
 const [sheet, setSheet] = useState<"dates" | "availability" | null>(null);
 const [draftRange, setDraftRange] = useState<DateRange>();
 const [month, setMonth] = useState(new Date());
 const [dateNext, setDateNext] = useState<Route | null>(null);
 const [calendarProperty, setCalendarProperty] = useState("all");
 const [dialog, setDialog] = useState<"help" | "policy" | "photo" | "login" | null>(null);
 const [inventory, setInventory] = useState<{ key: string; result: AvailabilityResult } | null>(null);
 const touch = useRef<number | null>(null);
 const current = getProperty(property)!;
 const units = selectionUnits(selectedKey);
 const selected = units[0];
 const selectedPlace = getProperty(selectionProperty(selectedKey))!;
 const selectedName = selectionName(selectedKey);
 const hasDates = !!from && !!to && to > from;
 const stayPrice = stayQuote(selectedKey, from, to);
 const bothPrice = stayQuote("both", from, to);
 const images = units.flatMap(c => c.images);
 const allowed = getAllowedAddons(selectedPlace.id, selectedKey);
 const hasAddonStep = allowed.length > 0;
 const selectedServices = allowed.filter(item => addons.includes(item.id));
 const activeAddons = selectedServices.map(item => item.id);
 const covered = includedUnits(selectedServices, addonQuantities);
 const extrasSubtotal = selectedServices.reduce((sum, item) => sum + (addonLinePrice(item, addonQuantities, covered) ?? 0), 0);
 const selectedOffer = getResortOffer(offerCabinId === selectedKey ? resortOfferId : null,selectedKey);
 const priceContext = {cabinId:selectedKey,offerId:selectedOffer?.id,extensionHours:resortExtensionHours};
 const resortBasePrice = getResortPrice(from,to,[],{},priceContext);
 const resortTotalPrice = getResortPrice(from,to,selectedServices,addonQuantities,priceContext);
 const availabilityCabinId = isBookingStep(route.screen) && selectedOffer ? selectedKey : undefined;
 const availabilityDepartureTime = resortBasePrice?.offer?.shortStay ? `${String(2+resortBasePrice.extensionHours).padStart(2,"0")}:00` : "12:00";
 const inventoryKey = [from, to, availabilityCabinId ?? "", availabilityDepartureTime].join("/");
 const availability = inventory?.key === inventoryKey ? inventory.result : emptyAvailability;
 const combinedStatus = sectionAvailability("both", availability);
 const stayBlocked = hasDates && selectedPlace.id === "stay" && sectionAvailability(selectedKey, availability) === "unavailable";
 const canSkipDate = hasDates && !resortBasePrice?.offerIssue && getStayAvailability(selectedKey, availability) !== "unavailable";
 const activeTab = (route.screen === "availability" || isBookingStep(route.screen)) ? "home" : ["favorites", "bookings"].includes(route.screen) ? "account" : route.screen;
 const title = ({ availability: "استعراض الوجهات", home: "يوم العائلة", cabin: selectedName, dates: "موعد الإقامة", addons: "إضافات الإقامة", review: "مراجعة الحجز", favorites: "المفضلة", offers: "العروض", bookings: "حجوزاتي", account: "حسابي", services: "الخدمات", locations: "المواقع" })[route.screen];
 const syncLocation = useCallback(() => {
  const nextRoute = readRoute(window.location.hash, window.history.state?.familyDayField);
  const { screen, id } = nextRoute;
  if (screen === "home") {
   const place = id ? getProperty(id) : undefined;
   setProperty(place && !place.disabled ? place.id : "resort");
   setRoomFilter("all"); setSectionFilter("all");
  }
  if (isBookingStep(screen)) {
   if (!id || !validSelection(id)) {
    window.history.replaceState(null, "", routeHash("home", "resort"));
    setProperty("resort"); setRoute({ screen: "home", id: "resort" }); return;
   }
   if (selectedKeyRef.current !== id) setExtras(EMPTY_ADDONS);
   selectedKeyRef.current = id;
   setSelectedKey(id); setProperty(selectionProperty(id)); setGallery(0);
  }
  setRoute(nextRoute);
  window.scrollTo({ top: 0, behavior: "instant" });
 }, []);
 const navigate = useCallback((screen: Screen, id?: string, options: { resume?: DateReturn; field?: DateField; replace?: boolean } = {}) => {
  const hash = routeHash(screen, id, options.resume);
  if (hash !== window.location.hash) {
   const history = window.history;
   if (options.replace) {
    history.replaceState({ ...history.state, familyDayField: options.field }, "", hash);
   } else {
    history.pushState({ familyDayPrevious: window.location.hash, familyDayField: options.field }, "", hash);
   }
  }
  syncLocation();
 }, [syncLocation]);

 // Use an existing booking entry when going back, including the browser's Back gesture.
 function returnTo(screen: Screen, id?: string) {
  if (window.history.state?.familyDayPrevious === routeHash(screen, id)) window.history.back();
  else navigate(screen, id, { replace: true });
 }

 useEffect(() => {
  try { const stored = JSON.parse(localStorage.getItem("familyday-favorites") ?? "[]"); if (Array.isArray(stored)) setFavorites(stored.filter(v => typeof v === "string" && validSelection(v))); localStorage.removeItem("familyday-experience-v1"); } catch { /* Device-local favorites are optional. */ }
  try {
   const draft=readBookingDraft(localStorage.getItem(DRAFT_KEY),iso(todayInJeddah()));
   if(draft){
    const { screen, id } = readRoute(location.hash);
    const differentCabin = isBookingStep(screen) && id && id !== draft.selectedKey;
    setFrom(draft.from);setTo(draft.to);
    if(!differentCabin){selectedKeyRef.current=draft.selectedKey;setSelectedKey(draft.selectedKey);setExtras({ ids: draft.addons, quantities: draft.addonQuantities });setOfferCabinId(draft.offerCabinId);setResortOfferId(draft.resortOfferId);setResortExtensionHours(draft.resortExtensionHours);}
   }else localStorage.removeItem(DRAFT_KEY);
  }catch{/* Storage is optional. */}
  syncLocation();
  setReady(true);
  window.addEventListener("hashchange", syncLocation);
  return () => window.removeEventListener("hashchange", syncLocation);
 }, [syncLocation]);
 useEffect(() => {
  if (!ready) return;
  if ((route.screen === "dates" && selectedPlace.id !== "resort") || (route.screen === "addons" && !hasAddonStep)) {
   navigate("cabin", selectedKey, { replace: true });
  } else if (selectedPlace.id === "stay" && (stayBlocked || !hasDates) && (route.screen === "addons" || route.screen === "review")) {
   navigate("cabin", selectedKey, { replace: true });
  } else if (selectedPlace.id === "resort" && !canSkipDate && (route.screen === "addons" || route.screen === "review")) {
   navigate("dates", selectedKey, { replace: true });
  }
 }, [ready, route.screen, selectedPlace.id, hasAddonStep, canSkipDate, hasDates, stayBlocked, selectedKey, navigate]);
 useEffect(() => { if (ready) try { localStorage.setItem("familyday-favorites", JSON.stringify(favorites)); } catch { /* Storage is optional. */ } }, [favorites, ready]);
 useEffect(()=>{
  if(!ready)return;
  try {if(selectedPlace.id!=="resort"){localStorage.removeItem(DRAFT_KEY);return;}
   localStorage.setItem(DRAFT_KEY,JSON.stringify({version:1,savedAt:Date.now(),selectedKey,from,to,addons:activeAddons,addonQuantities,offerCabinId,resortOfferId,resortExtensionHours}));
  }catch{/* Storage is optional. */}
 },[ready,selectedKey,selectedPlace.id,from,to,addons,addonQuantities,offerCabinId,resortOfferId,resortExtensionHours]);
 useEffect(() => { const controller = new AbortController(); if (hasDates) loadAvailability({ arrival: from, departure: to, ...(availabilityCabinId ? {cabinId:availabilityCabinId,arrivalTime:"16:00",departureTime:availabilityDepartureTime} : {}) }, controller.signal).then(result => { if (!controller.signal.aborted) setInventory({key:inventoryKey,result}); }).catch(() => { if (!controller.signal.aborted) setInventory({key:inventoryKey,result:{ connection: "error", stays: [] }}); }); return () => controller.abort(); }, [from, to, hasDates, availabilityCabinId, availabilityDepartureTime, inventoryKey]);
 useEffect(() => {
  const ctx = (document as Document & { modelContext?: { registerTool: (tool: unknown, options?: unknown) => unknown } }).modelContext;
  if (!ctx?.registerTool) return;
  const life = new AbortController();
  try { Promise.resolve(ctx.registerTool({ name: "start_cabin_preview", title: "عرض تفاصيل كوخ", description: "Open accommodation specifications without creating a booking.", inputSchema: { type: "object", properties: { cabin_id: { type: "integer", enum: cabinData.map(c => c.id) } }, required: ["cabin_id"], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: async (input: unknown) => { const key = String((input as { cabin_id: number }).cabin_id); if (!validSelection(key)) throw new Error("Unknown accommodation"); navigate("cabin", key); return { screen: "cabin", name: selectionName(key), booking_created: false }; } }, { signal: life.signal })).catch(() => {}); } catch { /* Optional browser capability. */ }
  return () => life.abort();
 }, [navigate]);

 function openSelection(key: string) { if (key !== selectedKey) setExtras(EMPTY_ADDONS); selectedKeyRef.current = key; setSelectedKey(key); setProperty(selectionProperty(key)); setGallery(0); navigate("cabin", key); }
 function chooseProperty(id: string) { if (getProperty(id)?.disabled) return; setProperty(id); setRoomFilter("all"); setSectionFilter("all"); navigate("home", id); }
 function toggleFavorite(key: string) { setFavorites(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]); }
 function openDates(next: Route | null = null, all = false, field?: DateField) {
  if (!all && isBookingStep(route.screen) && selectedPlace.id === "resort") {
   const resume = route.screen === "review" || next?.screen === "review" ? "review" : route.screen === "cabin" && !next ? "cabin" : undefined;
   navigate("dates", selectedKey, { resume, field });
   return;
  }
  if (!all && !isBookingStep(route.screen) && property === "resort") {
   setSearchDatesOpen(true);
   return;
  }
  setDraftRange(hasDates ? { from: parse(from), to: parse(to) } : undefined);
  setMonth(hasDates ? parse(from) : todayInJeddah());
  setDateNext(next);
  setCalendarProperty(all && route.screen === "availability" ? route.id ?? "all" : "all");
  setSheet(all ? "availability" : "dates");
 }
 function applyDates() { if (!draftRange?.from || !draftRange.to || draftRange.to <= draftRange.from) return; setFrom(iso(draftRange.from)); setTo(iso(draftRange.to)); setSheet(null); if (sheet === "availability") { setRoomFilter("all"); setSectionFilter("all"); navigate("availability", calendarProperty); } else if (dateNext) navigate(dateNext.screen, dateNext.id); setDateNext(null); }
 function chooseStay() {
  if (selectedPlace.id === "stay" && (!hasDates || stayBlocked)) {
   openDates({ screen: hasAddonStep ? "addons" : "review", id: selectedKey });
   return;
  }
  if (selectedPlace.id === "resort") {
   if (!canSkipDate) {
    navigate("dates", selectedKey);
    return;
   }
   // A date chosen on Home is already complete. Keep it one Back gesture away.
   const previous = window.location.hash;
   if (previous === routeHash("cabin", selectedKey)) {
    window.history.pushState({ familyDayPrevious: previous }, "", routeHash("dates", selectedKey));
   }
  }
  navigate(hasAddonStep ? "addons" : "review", selectedKey);
 }
 function review() {
  if (hasDates && !stayBlocked && (selectedPlace.id !== "resort" || canSkipDate)) navigate("review", selectedKey);
  else openDates({ screen: "review", id: selectedKey });
 }
 function confirmCabinDates(arrival: string, departure: string, offer: ResortOfferId | null, extension: number) {
  setFrom(arrival); setTo(departure);
  setOfferCabinId(selectedKey); setResortOfferId(offer); setResortExtensionHours(extension);
  if (route.resume) returnTo(route.resume, selectedKey);
  else navigate("addons", selectedKey);
 }
 function selectResortStep(step: ResortStep) {
  if (step === "dates") navigate("dates", selectedKey, { resume: route.screen === "review" ? "review" : undefined });
  else if (route.screen === "cabin" && step === "addons") chooseStay();
  else navigate(step, selectedKey);
 }
 function toggleAddon(id: string) {
  const item = allowed.find(addon => addon.id === id);
  if (item) setExtras(previous => changeAddon(previous, item, previous.ids.includes(id) ? 0 : 1));
 }
 function openDirectory(screen: "services" | "locations", id?: string) {
  if (route.screen !== "services" && route.screen !== "locations") directoryReturn.current = route;
  navigate(screen, id);
 }
 function back() {
  if ((route.screen === "services" || route.screen === "locations") && directoryReturn.current) {
   const previous = directoryReturn.current;
   directoryReturn.current = null;
   navigate(previous.screen, previous.id, { resume: previous.resume, field: previous.field });
   return;
  }
  if (route.screen === "dates") {
   returnTo(route.resume === "review" && canSkipDate ? "review" : "cabin", selectedKey);
   return;
  }
  if (route.screen === "addons") returnTo(selectedPlace.id === "resort" ? "dates" : "cabin", selectedKey);
  else if (route.screen === "review") returnTo(hasAddonStep ? "addons" : "cabin", selectedKey);
  else if (route.screen === "favorites" || route.screen === "bookings") navigate("account");
  else navigate("home", property);
 }
 function moveGallery(step: number) { setGallery(i => Math.max(0, Math.min(images.length - 1, i + step))); }
 const resortResults = property === "resort" && hasDates && availability.connection === "connected";
 const filtered = cabinData.filter(c => c.property === property && (!resortResults || getStayAvailability(String(c.id), availability) === "available") && (property !== "resort" || roomFilter === "all" || c.rooms === (roomFilter === "one" ? 1 : 2)) && (property !== "stay" || sectionFilter === "all" || sectionFilter === "both" || c.id === (sectionFilter === "first" ? 20 : 21))).sort((a, b) => { if (property === "stay") return a.id - b.id; const order = { available: 0, unknown: 1, unavailable: 2 }; return order[getStayAvailability(String(a.id), availability)] - order[getStayAvailability(String(b.id), availability)]; });
 const resultProperty = route.id === "all" || PROPERTIES.some(p => p.id === route.id && !p.disabled) ? route.id : "all";
 const resultPlaces = PROPERTIES.filter(p => !p.disabled && (resultProperty === "all" || p.id === resultProperty));
 const dates = <div className="date-fields"><button onClick={() => openDates(null, route.screen === "availability", "arrival")} aria-label="اختيار تاريخ الوصول"><CalendarDays size={21}/><span><small>{route.screen === "review" ? "الدخول · 4 عصرًا" : "الوصول"}</small><strong>{label(from)}</strong></span></button><button onClick={() => openDates(null, route.screen === "availability", "departure")} aria-label="اختيار تاريخ المغادرة"><CalendarDays size={21}/><span><small>{route.screen === "review" ? `الخروج · ${resortBasePrice?.checkoutLabel ?? "12 ظهرًا"}` : "المغادرة"}</small><strong>{label(to)}</strong></span></button></div>;
 const summary = <section className="selection-summary">{selected ? <img src={selected.images[0]} alt=""/> : <span className="summary-placeholder"><Home/></span>}<div><small>{selectedPlace.shortName} · {selectedPlace.branch}</small><h2>{selectedName}</h2>{route.screen === "addons" && <button onClick={() => openDates()} aria-label="تعديل موعد الإقامة"><CalendarDays size={16}/>{hasDates ? `${label(from)} — ${label(to)}` : "تحديد موعد الإقامة"}</button>}</div></section>;
 function progress(step: number) {
  if (selectedPlace.id === "resort" && isBookingStep(route.screen)) {
   return <ResortBookingSteps current={route.screen} dateSelected={canSkipDate} onSelect={selectResortStep}/>;
  }
  return <ol className="flow-progress" aria-label="خطوات الاختيار">{(hasAddonStep ? ["المكان والموعد", "الإضافات", "المراجعة"] : ["المكان والموعد", "المراجعة"]).map((item, i) => <li key={item} className={i <= step ? "active" : ""} aria-current={i === step ? "step" : undefined}><span>{i < step ? <Check size={14}/> : n(i + 1)}</span>{item}</li>)}</ol>;
 }
 const card = (c: Cabin) => { const sectionPrice = c.property === "stay" ? stayQuote(String(c.id),from,to) : null; const resortBrowsePrice = getResortPrice(from,to,[],{},{cabinId:String(c.id)}); const status = hasDates ? getStayAvailability(String(c.id), availability) : "unknown"; return <article className="stay-card" key={c.id} data-unit-id={c.id}><button className="favorite-button" onClick={() => toggleFavorite(String(c.id))} aria-pressed={favorites.includes(String(c.id))} aria-label={(favorites.includes(String(c.id)) ? "إزالة من المفضلة: " : "إضافة للمفضلة: ") + c.name}><Heart size={21} fill={favorites.includes(String(c.id)) ? "currentColor" : "none"}/></button><button className="stay-open" onClick={() => openSelection(String(c.id))} aria-label={"عرض تفاصيل " + c.name}><div className="stay-image"><img src={c.images[0]} alt={c.name} loading={c.id === 1 || c.id === 20 ? "eager" : "lazy"}/>{status !== "unknown" && <span className={"availability-badge " + status}>{status === "available" ? "متاح" : "غير متاح لهذا الموعد"}</span>}</div><div className="stay-info"><div className="stay-heading"><h3>{c.name}</h3><span className="capacity"><UsersRound size={16}/>{capacity(c.capacity)}</span></div><div className="stay-features">{c.property === "resort" && <span><BedDouble size={16}/>{c.rooms === 1 ? "غرفة" : "غرفتين"}</span>}<span><Waves size={16}/>{c.id === 20 ? "مسبحين" : "مسبح خاص"}</span><span><Armchair size={16}/>مساحة خارجية</span>{c.bathSummary && <span><Bath size={16}/>{c.bathSummary}</span>}{c.id === 21 && <span><Volleyball size={16}/>ملعب طائرة</span>}</div>{c.property === "resort" && <div className="stay-price"><div><NightlyPrice cabinId={String(c.id)}/>{resortBrowsePrice && resortBrowsePrice.stayAmount !== null && <small className="card-stay-total">{n(resortBrowsePrice.stayAmount)} ر.س إجمالي الإقامة</small>}</div></div>}{sectionPrice && <strong>{n(sectionPrice.amount)} ر.س للإقامة</strong>}<span className="stay-link">{status === "unavailable" ? "التفاصيل ومواعيد أخرى" : "عرض التفاصيل والصور"}</span></div></button></article>; };
 const hasStayOffer = stayRates.bothSectionsNightly !== null && stayRates.lastOfferNight >= iso(todayInJeddah());
 const combinedChoice = <button type="button" className="combined-choice stay-bundle" onClick={() => openSelection("both")}>
   <Building2 size={23}/><span><strong>حجز القسمين معًا</strong><small>القسم الأول والثاني لنفس الموعد</small>
   {hasDates && combinedStatus === "unavailable" ? <small>القسمان غير متاحين معًا لهذا الموعد · استعرض مواعيد أخرى</small> :
     bothPrice && <small>{bothPrice.savings > 0 && <><del>{n(bothPrice.original)} ر.س</del>{" · "}</>}{n(bothPrice.amount)} ر.س لإقامة القسمين
     {bothPrice.savings > 0 && <> · وفّر {n(bothPrice.savings)} ر.س</>}</small>}
   </span><ChevronLeft size={19}/></button>;
 const chaletCard = <article className="stay-card chalet-card"><button className="favorite-button" aria-label="حفظ الشاليه في المفضلة" aria-pressed={favorites.includes("chalet")} onClick={() => toggleFavorite("chalet")}><Heart size={21} fill={favorites.includes("chalet") ? "currentColor" : "none"}/></button><button className="stay-open" onClick={() => openSelection("chalet")}><div className="missing-photo"><ImageIcon size={38}/><span>صور الشاليه</span></div><div className="stay-info"><h3>الشاليه</h3><p><MapPin size={15}/>فرع المروج</p><span className="stay-link">عرض التفاصيل</span></div></button></article>;

 return <div className="app-shell" dir="rtl"><header className="app-header">{route.screen === "home" ? <><button className="brand-wordmark" onClick={() => navigate("home", property)}><Home size={36} strokeWidth={1.4}/><span><strong>يوم العائلة</strong><small>خصوصيتكم راحتنا</small></span></button><button className="icon-button" aria-label="المساعدة والتواصل" onClick={() => setDialog("help")}><CircleHelp size={23}/></button></> : <><button className="back-button" onClick={back} aria-label="رجوع"><ChevronRight size={25}/></button><h1>{title}</h1><span className="header-spacer"/></>}</header><main className={"main-content view-" + route.screen}>
 {route.screen === "availability" && <><div className="section-heading"><h2>اختر الوجهة</h2></div><div className="filter-row" role="group" aria-label="تصفية نتائج الوجهات">{[{id:"all",shortName:"كل الوجهات"}, ...PROPERTIES.filter(p => !p.disabled)].map(p => <button key={p.id} className={resultProperty === p.id ? "active" : ""} aria-pressed={resultProperty === p.id} onClick={() => navigate("availability", p.id)}>{p.shortName}</button>)}</div><section className="booking-controls"><div className="section-heading"><h2>موعد إقامتك</h2></div>{dates}</section><div aria-live="polite">{resultPlaces.map(p => <section className="inventory destination-results" key={p.id} aria-label={p.shortName + " · " + p.branch}><div className="section-heading"><h2>{p.id === "resort" ? "أكواخ المنتجع" : p.id === "stay" ? "أقسام الاستراحة" : "الشاليه"}</h2><small>{p.branch}</small></div><div className="stay-grid">{p.id === "chalet" ? chaletCard : cabinData.filter(c => c.property === p.id).map(card)}</div>{p.id === "stay" && combinedChoice}</section>)}</div></>}
 {route.screen === "home" && <><h2 className="destinations-title">اختر وجهتك</h2><div className="destination-grid" role="group" aria-label="اختر الوجهة">{PROPERTIES.map(place => { const destinationImage = place.image || DESTINATION_PREVIEW_IMAGES[place.id]; return <button key={place.id} className={"destination-tile destination-photo-tile " + (property === place.id ? "selected" : "")} disabled={place.disabled} aria-pressed={property === place.id} onClick={() => chooseProperty(place.id)}><span className="destination-visual" aria-hidden="true"><img src={destinationImage} alt="" sizes="(min-width: 700px) 25vw, 50vw"/></span><span className="destination-copy"><strong>{place.shortName}</strong><small>{place.branch}</small></span>{place.disabled && <span className="coming-soon">قريبا</span>}{property === place.id && <span className="selected-check" aria-hidden="true"><Check size={10}/></span>}</button>; })}</div><VenueMapLink place={current}/>{property !== "resort" && <button className="availability-link" onClick={() => openDates(null, true)}><CalendarDays size={19}/>استعرض المواعيد المتاحة</button>}<section className={"booking-controls " + (property === "resort" ? "resort-booking-controls" : "")} aria-label="تواريخ الإقامة والتصفية"><div className="section-heading"><h2>{property === "resort" ? "متى ودك تقيم؟" : "متى ودك تزورنا؟"}</h2>{hasDates && <button className="text-button" onClick={() => { setFrom(""); setTo(""); }}>مسح التواريخ</button>}</div>{dates}{property === "resort" && !hasDates && <div className="resort-search-options"><button className="text-button" onClick={() => document.getElementById("resort-cabins")?.scrollIntoView({behavior:"smooth",block:"start"})}>أو تصفح الأكواخ أولا <ChevronLeft size={15}/></button></div>}{property === "resort" && <div className="filter-row" role="group" aria-label="عدد الغرف">{ROOMS.map(item => <button key={item.id} aria-pressed={roomFilter === item.id} className={roomFilter === item.id ? "active" : ""} onClick={() => setRoomFilter(item.id)}>{item.label}</button>)}</div>}{property === "stay" && <div className="filter-row section-filters" role="group" aria-label="أقسام الاستراحة">{SECTIONS.map(item => <button key={item.id} aria-pressed={sectionFilter === item.id} className={sectionFilter === item.id ? "active" : ""} onClick={() => setSectionFilter(sectionFilter === item.id ? "all" : item.id)}>{item.label}</button>)}</div>}</section><section className="inventory" id={property === "resort" ? "resort-cabins" : undefined}><div className="section-heading"><h2>{property === "resort" ? resortResults ? "الأكواخ المتاحة لموعدك" : "أكواخ المنتجع" : property === "stay" ? "أقسام الاستراحة" : "الشاليه"}</h2>{property === "resort" && <small>{cabinCount(filtered.length)}</small>}</div>{property === "resort" && !hasDates && <p className="browse-hint">في بالك كوخ معين؟ افتح تفاصيله وشوف مواعيده.</p>}{resortResults && filtered.length === 0 && <div className="empty-state resort-no-results"><CalendarDays size={32}/><h3>ما فيه أكواخ متاحة لهذا الاختيار</h3><p>جرب موعدا آخر{roomFilter !== "all" ? " أو اعرض كل الغرف" : ""}.</p><button className="primary" onClick={() => openDates()}>تغيير الموعد</button>{roomFilter !== "all" && <button className="text-button" onClick={() => setRoomFilter("all")}>عرض كل الغرف</button>}</div>}<div className="stay-grid">{property === "chalet" ? chaletCard : filtered.map(card)}</div>{property === "stay" && (sectionFilter === "all" || sectionFilter === "both") && combinedChoice}</section></>}

 {route.screen === "cabin" && <>{progress(0)}{images.length > 0 ? <div className="detail-layout"><div className="gallery-block"><div className="hero-gallery" onTouchStart={e => { touch.current = e.touches[0].clientX; }} onTouchEnd={e => { if (touch.current !== null) { const delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 45) moveGallery(delta > 0 ? 1 : -1); touch.current = null; } }}><button className="gallery-photo" onClick={() => setDialog("photo")} aria-label="تكبير صورة الإقامة"><img src={images[gallery] ?? images[0]} alt={selectedName + " — الصورة " + n(gallery + 1)}/></button><button className="gallery-nav previous" disabled={gallery === 0} onClick={() => moveGallery(-1)} aria-label="الصورة السابقة"><ChevronRight/></button><button className="gallery-nav next" disabled={gallery === images.length - 1} onClick={() => moveGallery(1)} aria-label="الصورة التالية"><ChevronLeft/></button><span className="gallery-count">{n(gallery + 1)} / {n(images.length)}</span><button className="favorite-button" aria-label="حفظ الإقامة في المفضلة" aria-pressed={favorites.includes(selectedKey)} onClick={() => toggleFavorite(selectedKey)}><Heart fill={favorites.includes(selectedKey) ? "currentColor" : "none"}/></button></div><div className="gallery-thumbs">{images.map((src, i) => <button key={src} aria-label={"الصورة " + n(i + 1)} aria-pressed={gallery === i} onClick={() => setGallery(i)}><img src={src} alt=""/></button>)}</div></div><div className="specifications">
   {hasDates && selectedPlace.id !== "resort" && <button className="date-summary" onClick={() => openDates()}><CalendarDays size={19}/><span>{label(from)} — {label(to)}</span><small>تعديل</small></button>}
   {selectedKey === "both" && hasDates && <p className="detail-note" role="status">{stayBlocked ? "القسمان غير متاحين معًا لهذا الموعد" : combinedStatus === "available" ? "القسمان متاحان لنفس الموعد" : "توفر القسمين يحتاج إلى تأكيد"}</p>}
   {units.map(c => <CabinDetails key={c.id} cabin={c} onPolicy={() => setDialog("policy")}
     checkoutLabel={c.property === "resort" ? resortBasePrice?.checkoutLabel : undefined}
     onBrowseServices={() => openDirectory("services", c.property)} />)}
  </div></div> : <><div className="missing-photo detail-missing"><ImageIcon size={42}/><span>صور الشاليه</span></div><div className="chalet-details"><span className="eyebrow">فرع المروج</span><h1>الشاليه</h1><VenueMapLink place={selectedPlace}/>{dates}</div></>}<div className={"sticky-action " + (selectedPlace.id === "resort" ? "resort-sticky-action" : "")}>{selectedPlace.id === "resort" ? (resortBasePrice && <div className="cabin-booking-price">
    <ResortPriceAction cabinId={selectedKey} price={resortBasePrice}/>
    <button type="button" className="text-button cabin-booking-dates" aria-label="تعديل موعد الإقامة" onClick={() => openDates()}>
     <CalendarDays size={14}/>{label(from)} – {label(to)}
    </button>
   </div>) : <span>{selectedPlace.id === "stay" && stayPrice && <strong>{n(stayPrice.amount)} ر.س · </strong>}{hasDates ? `${label(from)} — ${label(to)}` : "اختر إقامتك ثم أكمل التفاصيل"}</span>}<button className="primary" onClick={chooseStay}>{stayBlocked ? "اختيار موعد آخر" : selectedKey === "both" ? "اختيار القسمين" : selectedPlace.id === "stay" ? "اختيار هذا القسم" : selectedPlace.id === "chalet" ? "متابعة الاختيار" : resortBasePrice?.offerIssue ? "عدّل موعد العرض" : getStayAvailability(selectedKey, availability) === "unavailable" ? "اختر موعدا آخر" : canSkipDate ? "متابعة للإضافات" : "اختيار الموعد"}</button></div></>}

 {route.screen === "dates" && selectedPlace.id === "resort" && <>
  {progress(1)}
  <ResortDates key={selectedKey} open cabinId={selectedKey} cabinName={selectedName} from={from} to={to}
   offerId={selectedOffer?.id} extensionHours={resortExtensionHours} initialField={route.field}
   confirmLabel={route.resume === "review" ? "حفظ الموعد والعودة للمراجعة" : route.resume === "cabin" ? "حفظ الموعد" : "المتابعة للإضافات"}
   onConfirm={confirmCabinDates}/>
 </>}

 {route.screen === "addons" && <>
  {progress(1)}{summary}
  {selectedPlace.id === "resort" ? <>
   <p className="addons-intro">اختر ما يناسب إقامتك، أو تابع دون إضافات</p>
   <ResortAddons selection={extras} onChange={setExtras}/>
  </> : <section className="addon-section">{allowed.map(a =>
   <div key={a.id} className={"addon-card " + (activeAddons.includes(a.id) ? "chosen" : "")}>
    <label className="addon-choice"><Checkbox checked={activeAddons.includes(a.id)} onCheckedChange={() => toggleAddon(a.id)}/>
     <span><strong>{a.title}</strong><small>{a.description}</small></span><Waves size={26}/>
    </label>
   </div>)}</section>}
  <div className="sticky-action">
   {selectedServices.length > 0 && <div className="booking-price-action" role="status" aria-live="polite" aria-atomic="true">
    <small>مجموع الإضافات</small>
    <strong>{selectedServices.some(item => item.price === undefined) ?
     (extrasSubtotal ? n(extrasSubtotal) + " ر.س + سعر قيد التحديد" : "قيد التحديد") : n(extrasSubtotal) + " ر.س"}</strong>
   </div>}
   <button className="primary" onClick={review}>{activeAddons.length ? "مراجعة الحجز" : "متابعة دون إضافات"}</button>
  </div>
 </>}

 {route.screen === "review" && <>{progress(hasAddonStep ? 2 : 1)}<div className="page-intro"><h1>راجع اختياراتك</h1><p>{hasAddonStep ? "المكان والموعد والإضافات في مكان واحد" : "المكان والموعد في مكان واحد"}</p></div>{summary}<div className="review-grid"><section className="review-panel"><div className="section-heading"><h2>الموعد</h2>
    {selectedPlace.id === "resort" && <button className="text-button" onClick={() => openDates()}>{selectedOffer ? "تعديل عرض الإقامة" : "اختيار عرض للإقامة"}</button>}
   </div>{dates}{selected && <div className="review-spec"><UsersRound size={20}/>{selectedKey === "both" ? "حتى 70 ضيف لكل قسم" : capacity(selected.capacity)}</div>}</section>{hasAddonStep && <section className="review-panel"><div className="section-heading"><h2>إضافاتك</h2><button className="text-button" onClick={() => navigate("addons", selectedKey)}>تعديل الإضافات</button></div>{activeAddons.length ? <ul className="addon-list">{selectedServices.map(item => {
 const quantity = addonQuantity(item, addonQuantities);
 const price = addonLinePrice(item, addonQuantities, covered);
 return <li key={item.id}><Check size={17}/><span>{item.title}{quantity > 1 && " × " + n(quantity)}</span>{price !== undefined && <span className="addon-review-price">{price === 0 ? "مشمول في الباقة" : n(price) + " ر.س"}</span>}<button type="button" className="review-remove" aria-label={"حذف " + item.title} onClick={() => setExtras(previous => changeAddon(previous, item, 0))}>حذف</button></li>;
})}</ul> : <p role="status">دون إضافات</p>}</section>}</div>{selectedPlace.id === "resort" && resortTotalPrice && <ResortPriceSummary price={resortTotalPrice}/>}{selectedPlace.id === "stay" && <section className="review-panel stay-total" aria-live="polite">
   <h2>ملخص السعر</h2>
   {hasDates && selectedKey === "both" && <p>{combinedStatus === "available" ? "القسمان متاحان لنفس الموعد" : "توفر القسمين يحتاج إلى تأكيد"}</p>}
   {stayPrice ? <>
    {stayPrice.savings > 0 && <p>القسمان قبل العرض <del>{n(stayPrice.original)} ر.س</del> · وفّرت {n(stayPrice.savings)} ر.س</p>}
    <p>الإقامة · {n(stayPrice.amount)} ر.س</p>
    {extrasSubtotal > 0 && <p>الإضافات · {n(extrasSubtotal)} ر.س</p>}
    {selectedServices.some(item => item.price === undefined) ? <p>يُحدد الإجمالي بعد تسعير الإضافات المختارة</p> :
      <strong>الإجمالي · {n(stayPrice.amount + extrasSubtotal)} ر.س</strong>}
   </> : <p>{hasDates ? "سعر الإقامة قيد التحديد" : "اختر الموعد لعرض السعر"}</p>}
   </section>}<section className="booking-boundary"><button className="primary" disabled>تأكيد الحجز</button></section><button className="secondary" onClick={() => navigate("home", property)}>العودة إلى الوجهات</button></>}

 {route.screen === "favorites" && <><div className="page-intro"><h1>أماكنك المفضلة</h1><p>كل الأماكن التي حفظتها للرجوع إليها</p></div>{favorites.length ? <div className="stay-grid">{cabinData.filter(c => favorites.includes(String(c.id))).map(card)}{favorites.includes("chalet") && chaletCard}{favorites.includes("both") && <button className="combined-choice" onClick={() => openSelection("both")}><Building2/><strong>القسمين مع بعض</strong><span>فرع خليج سلمان</span></button>}</div> : <div className="empty-state"><Heart size={40}/><h2>ما عندك مفضلة حتى الآن</h2><p>اضغط القلب على المكان اللي يعجبك</p><button className="primary" onClick={() => navigate("home", property)}>استعرض الأماكن</button></div>}</>}
 {route.screen === "locations" && <VenueLocations/>}
 {route.screen === "services" && <Suspense fallback={<p role="status">جار عرض الخدمات…</p>}><ServiceDirectory venue={route.id ?? property} onVenueChange={id => navigate("services", id)}/></Suspense>}
 {route.screen === "offers" && <><div className="page-intro"><h1>عروض الوجهات</h1></div><div className="offer-places" role="group" aria-label="وجهة العروض">{PROPERTIES.filter(p => !p.disabled).map(p => <button key={p.id} aria-pressed={property === p.id} className={property === p.id ? "active" : ""} onClick={() => setProperty(p.id)}>{p.shortName}<small>{p.branch}</small></button>)}</div>{property === "resort" ? <section className="resort-offers-page"><div className="resort-offers-intro"><img src={cabinData.find(c=>c.id===1)!.images[0]} alt="بيت الدوم"/><div><small>المنتجع · خليج سلمان</small><h2>عروض المنتجع</h2><p>اختر العرض الذي يناسبك عند تحديد موعد الكوخ أو عند مراجعة الحجز</p></div></div><ResortOfferCards informational/></section> : property === "stay" && hasStayOffer ? <section className="review-panel stay-total">
   <h2>عرض حجز القسمين معًا</h2><p>{n(Number(stayRates.bothSectionsNightly))} ر.س لليلة للقسمين</p>
   <p>من {label(stayRates.firstOfferNight)} إلى {label(stayRates.lastOfferNight)}</p>
   <button className="secondary" onClick={() => openSelection("both")}>عرض القسمين</button>
  </section> : <div className="empty-state"><Tag size={40}/><h2>لا توجد عروض لهذه الوجهة</h2><p>تظهر هنا عروض {current.shortName} عند توفرها.</p><button className="secondary" onClick={() => navigate("home", property)}>استعرض {current.unitsLabel}</button></div>}</>}
 {route.screen === "bookings" && <div className="empty-state"><CalendarDays size={42}/><h1>لا توجد حجوزات حتى الآن</h1><p>تظهر هنا الحجوزات المؤكدة وتفاصيل إقامتك.</p><button className="primary" onClick={() => navigate("home", property)}>استعرض الأماكن</button></div>}
 {route.screen === "account" && <><div className="empty-state account-intro"><UserRound size={44}/><h1>مرحبا بك في يوم العائلة</h1><p>حسابك ومفضلاتك وحجوزاتك في مكان واحد</p><button className="primary" onClick={() => setDialog("login")}>تسجيل الدخول</button></div><div className="account-menu"><button onClick={() => navigate("favorites")}><Heart/>المفضلة<ChevronLeft/></button><button onClick={() => navigate("bookings")}><CalendarDays/>حجوزاتي<ChevronLeft/></button><button onClick={() => setDialog("help")}><CircleHelp/>المساعدة والتواصل<ChevronLeft/></button></div></>}
 </main><nav className="bottom-nav" aria-label="التنقل الرئيسي">{NAV.map(item => <button key={item.id} aria-current={activeTab === item.id ? "page" : undefined} className={activeTab === item.id ? "active" : ""} onClick={() => {
  if (item.id === "services" || item.id === "locations") openDirectory(item.id, item.id === "services" ? property : undefined);
  else navigate(item.id, item.id === "home" ? property : undefined);
 }}><item.icon size={24} fill={item.id === "home" && activeTab === "home" ? "currentColor" : "none"}/><span>{item.label}</span></button>)}</nav>

 <ResortDates open={searchDatesOpen} from={from} to={to} onClose={() => setSearchDatesOpen(false)} onConfirm={(arrival, departure) => {
  setFrom(arrival); setTo(departure); setSearchDatesOpen(false);
  requestAnimationFrame(() => document.getElementById("resort-cabins")?.scrollIntoView({behavior:"smooth",block:"start"}));
 }}/>
 <Sheet open={!!sheet} onOpenChange={open => { if (!open) { setSheet(null); setDateNext(null); } }}><SheetContent side="bottom" className="date-sheet" showCloseButton={false} dir="rtl"><div className="sheet-handle"/><SheetClose asChild><button className="sheet-close icon-button" aria-label="إغلاق التقويم"><X size={23}/></button></SheetClose><SheetTitle>{sheet === "availability" ? "المواعيد المتاحة" : "حدد موعد إقامتك"}</SheetTitle><SheetDescription>{sheet === "availability" ? "استعرض المواعيد عبر كل وجهات يوم العائلة" : `${current.shortName} · ${current.branch}`}</SheetDescription><div className="sheet-scroll">{sheet === "availability" && <RadioGroup dir="rtl" className="calendar-places" value={calendarProperty} onValueChange={setCalendarProperty}>{[{ id: "all", name: "كل الوجهات" }, ...PROPERTIES.filter(p => !p.disabled).map(p => ({ id: p.id, name: p.shortName }))].map(p => <label key={p.id} className={calendarProperty === p.id ? "active" : ""}><RadioGroupItem value={p.id}/>{p.name}</label>)}</RadioGroup>}<div className="sheet-date-labels"><span>الوصول<strong>{draftRange?.from ? label(iso(draftRange.from)) : "اختر اليوم"}</strong></span><span>المغادرة<strong>{draftRange?.to ? label(iso(draftRange.to)) : "اختر اليوم"}</strong></span></div><Calendar dir="rtl" mode="range" min={1} selected={draftRange} onSelect={setDraftRange} month={month} onMonthChange={setMonth} locale={arSA} numerals="latn" disabled={{ before: todayInJeddah() }} formatters={{ formatDay: d => n(d.getDate()), formatCaption: d => d.toLocaleDateString("ar-SA-u-ca-gregory-nu-latn", { month: "long", year: "numeric" }) }} labels={{ labelNext: () => "الشهر التالي", labelPrevious: () => "الشهر السابق", labelNav: () => "التنقل بين الأشهر" }} className="fd-calendar"/>{sheet === "availability" && <><div className="calendar-inventory" aria-live="polite">{PROPERTIES.filter(p => !p.disabled && (calendarProperty === "all" || p.id === calendarProperty)).flatMap(p => (p.id === "chalet" ? [{id:"chalet",name:"الشاليه"}] : cabinData.filter(c => c.property === p.id)).map(c => <div key={c.id}><strong>{c.name}<small>{p.shortName} · {p.branch}</small></strong></div>))}</div></>}</div><button className="primary" disabled={!draftRange?.from || !draftRange.to || draftRange.to <= draftRange.from} onClick={applyDates}>{sheet === "availability" ? "عرض النتائج" : "تأكيد التواريخ"}</button></SheetContent></Sheet>
 <Dialog open={!!dialog} onOpenChange={open => { if (!open) setDialog(null); }}><DialogContent className={"fd-dialog " + (dialog === "photo" ? "photo-dialog" : "")} showCloseButton={false} dir="rtl"><DialogClose asChild><button className="dialog-close icon-button" aria-label="إغلاق"><X size={23}/></button></DialogClose><DialogTitle>{dialog === "photo" ? selectedName : dialog === "policy" ? "معلومات الإقامة" : dialog === "login" ? "تسجيل الدخول" : "المساعدة والتواصل"}</DialogTitle><DialogDescription className={dialog === "photo" ? "sr-only" : ""}>{dialog === "photo" ? "صور الإقامة" : dialog === "login" ? "تصفح إقاماتك المفضلة وخطط لزيارتك القادمة." : dialog === "policy" ? "مواعيد الوصول والمغادرة" : `${current.name} · ${current.location}`}</DialogDescription>{dialog === "photo" && <><img className="full-photo" src={images[gallery]} alt={selectedName}/><div className="photo-controls"><button className="icon-button" disabled={gallery === 0} onClick={() => moveGallery(-1)} aria-label="الصورة السابقة"><ChevronRight/></button><span>{n(gallery + 1)} / {n(images.length)}</span><button className="icon-button" disabled={gallery === images.length - 1} onClick={() => moveGallery(1)} aria-label="الصورة التالية"><ChevronLeft/></button></div></>}{dialog === "policy" && <div className="policy-content"><p><Clock3/>الدخول 4 مساء · الخروج 12 ظهرا</p><p><Waves/>{current.id === "resort" ? "يسمح للأطفال باستخدام مسابح الأكواخ تحت إشراف ذويهم طوال الوقت" : "مسابح الكبار غير مخصصة للأطفال"}</p><p><ShieldCheck/>خصوصيتكم راحتنا</p></div>}{dialog === "help" && <div className="help-content"><MapPin size={32}/>{current.mapUrl ? <a className="primary" href={current.mapUrl} target="_blank" rel="noopener noreferrer">فتح الموقع في الخرائط</a> : <p>{current.name}</p>}<button className="secondary" onClick={() => setDialog("policy")}>معلومات الإقامة</button></div>}</DialogContent></Dialog>
 </div>;
}
