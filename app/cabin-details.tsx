"use client";

import { Armchair, BedDouble, Check, ChefHat, ChevronLeft, Clock3, Home, Info, ShieldCheck, UtensilsCrossed, Waves } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import cabinData from "./cabins.json";
import { getProperty } from "./property-catalog";
import { VenueMapLink } from "./venue-locations";

type Cabin = typeof cabinData[number];
const guests = (value: number) => value === 2 ? "حتى ضيفين" : `حتى ${value} ${value <= 10 ? "ضيوف" : "ضيفا"}`;

function FeatureList({ items }: { items: string[] }) {
  return <ul className="detail-feature-list">{items.map(item => <li key={item}><Check size={17} /><span>
    {item.split(/(\d+\s*×\s*\d+(?:\s*م)?|\d+\s*سم)/).map((part, index) =>
      /^\d/.test(part) ? <bdi key={index} dir="ltr">{part}</bdi> : part)}
  </span></li>)}</ul>;
}

type Props = {
  cabin: Cabin; onPolicy: () => void; onBrowseServices: () => void; checkoutLabel?: string;
};

export default function CabinDetails({ cabin, onPolicy, onBrowseServices, checkoutLabel = "12 ظهرًا" }: Props) {
  const isResort = cabin.property === "resort";
  const place = getProperty(cabin.property)!;
  // Resort records contain the complete outdoor list in the source's display order.
  const outside = cabin.pool ? [
    ...cabin.outdoor,
    [cabin.pool, ...(cabin.poolNotes ?? []).map(note => note.replace("عمق المسبح يصل إلى", "بعمق"))].join(" · "),
    ...(cabin.poolFacilities ?? []),
  ] : cabin.outdoor;

  return <div className="detail-body cabin-complete-details">
    <div className="cabin-title">
      <VenueMapLink place={place} />
      <h1>{cabin.name}</h1>
      <p>{cabin.suitable} · {guests(cabin.capacity)}{isResort && <> · {cabin.rooms === 1 ? "غرفة نوم واحدة" : "غرفتا نوم"}</>}</p>
    </div>
    {isResort && <p className="description">{cabin.description}</p>}
    {cabin.combinedNote && <aside className="cabin-combined-note"><strong>حجز الكوخين معا</strong><p>{cabin.combinedNote}</p></aside>}
    <Accordion type="multiple" defaultValue={isResort ? ["indoor"] : []} className="detail-accordion">
      <AccordionItem value="indoor"><AccordionTrigger><span><Home size={21} />{isResort ? "داخل الكوخ" : "المنطقة الداخلية"}</span></AccordionTrigger>
        <AccordionContent><FeatureList items={cabin.indoor} /></AccordionContent></AccordionItem>
      <AccordionItem value="outdoor"><AccordionTrigger><span><Armchair size={21} />المنطقة الخارجية والمسبح</span></AccordionTrigger>
        <AccordionContent><FeatureList items={outside} />{cabin.outdoorNotes?.map(note => <p className="detail-note" key={note}><ShieldCheck size={17} />{note}</p>)}</AccordionContent></AccordionItem>
      <AccordionItem value="kitchen"><AccordionTrigger><span><ChefHat size={21} />تجهيزات المطبخ</span></AccordionTrigger>
        <AccordionContent><FeatureList items={cabin.kitchen} />{cabin.kitchenNote && <p className="detail-note"><Info size={17} />{cabin.kitchenNote}</p>}</AccordionContent></AccordionItem>
      <AccordionItem value="features"><AccordionTrigger><span><BedDouble size={21} />مميزات الإقامة</span></AccordionTrigger>
        <AccordionContent><FeatureList items={cabin.stayFeatures} /></AccordionContent></AccordionItem>
      {!!cabin.availableServices?.length && <AccordionItem value="services"><AccordionTrigger><span><UtensilsCrossed size={21} />الخدمات المتاحة</span></AccordionTrigger>
        <AccordionContent>
          <div className="available-service-list">{cabin.availableServices.map(service =>
            <div key={service.title}><strong>{service.title}</strong><p>{service.detail}</p></div>)}</div>
          <button className="cabin-source-link" onClick={onBrowseServices}>تصفح خدمات {place.shortName}<ChevronLeft size={17} /></button>
        </AccordionContent></AccordionItem>}
      <AccordionItem value="information"><AccordionTrigger><span><Clock3 size={21} />{isResort ? "معلومات الإقامة" : "معلومات الإقامة والسياسات"}</span></AccordionTrigger>
        <AccordionContent><div className="stay-times"><span>الدخول<strong>4 مساء</strong></span><span>الخروج<strong>{checkoutLabel}</strong></span></div>
          {isResort ? <p className="detail-note"><Waves size={17} />مسابح الأكواخ مخصصة للكبار، ويسمح للأطفال باستخدامها تحت إشراف ذويهم طوال الوقت</p> :
            <button className="policy-row" onClick={onPolicy}>السياسات ومعلومات الإقامة <ChevronLeft size={18} /></button>}
        </AccordionContent></AccordionItem>
    </Accordion>
  </div>;
}
