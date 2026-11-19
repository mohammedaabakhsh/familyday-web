"use client";

import { useState, type ReactNode } from "react";
import { Armchair, BedSingle, CalendarDays, ChevronDown, Coffee, ConciergeBell, Flower2, Gamepad2, Package, Projector, Utensils, Waves, type LucideIcon } from "lucide-react";
import { BOOKING_ADDONS, type BookingAddon } from "./booking-addons";
import { PackagePhotos } from "./addon-item";
import guide from "./guest-service-guide.json";
import serviceCatalog from "./resort-service-catalog.json";
import { PROPERTIES } from "./property-catalog";

const { games, cinema } = serviceCatalog.leisure;
const currency = (price: number) => price.toLocaleString("ar-SA-u-nu-latn") + " ر.س";
const byId = new Map(BOOKING_ADDONS.map(item => [item.id, item]));
const resort = BOOKING_ADDONS.filter(item => item.property === "resort");
const decor = resort.filter(item => item.group === "decor");
const seating = resort.filter(item => item.variantGroup === "outdoor");
const dining = resort.filter(item => item.variantGroup === "dining");
const venues = PROPERTIES.filter(place => !place.disabled);

function Section({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle?: string; icon: LucideIcon; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return <details className="guide-section" name="venue-service-categories" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>
      <Icon className="guide-category-icon" size={23} />
      <span className="guide-section-label"><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>
      <ChevronDown className="guide-chevron" size={18} />
    </summary>
    {open && <div className="guide-content">{children}</div>}
  </details>;
}

function Note({ children }: {children: ReactNode}) {
  return <p className="guide-note"><CalendarDays size={17} />{children}</p>;
}

function Item({ item }: { item: BookingAddon }) {
  const [open, setOpen] = useState(false);
  const thumb = item.photos?.[0] ?? item.image;
  const summary = <>
    {thumb && <img className="guide-thumb" src={thumb} alt="" width={64} height={64} loading="lazy" />}
    <span className="guide-item-name"><strong>{item.title}</strong>{item.description && <small>{item.description}</small>}</span>
    {item.price !== undefined && <span className="guide-price">{currency(item.price)}</span>}
  </>;
  if (!thumb && !item.note && !item.details.length) return <div className="guide-simple-item">{summary}</div>;
  return <details className="guide-item" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{summary}<ChevronDown className="guide-chevron" size={15} /></summary>
    {open && <div className="guide-item-body">
      {item.photos && <PackagePhotos title={item.title} photos={item.photos} />}
      {!item.photos && item.image && <img className="guide-section-photo" src={item.image} alt={item.title} loading="lazy" />}
      {item.details.length > 0 && <ul>{item.details.map(text => <li key={text}>{text}</li>)}</ul>}
      {item.note && <p>{item.note}</p>}
    </div>}
  </details>;
}

function RestaurantMenu() {
  const [category, setCategory] = useState(guide.menu[0].title);
  const current = guide.menu.find(group => group.title === category)!;
  return <>
    <div className="menu-category"><label htmlFor="guide-menu-category">فئة القائمة</label>
      <select id="guide-menu-category" value={category} onChange={event => setCategory(event.target.value)}>
        {guide.menu.map(group => <option key={group.title}>{group.title}</option>)}
      </select>
    </div>
    <ul className="guide-menu-list" aria-label={current.title}>{current.items.map(item => {
      const price = "price" in item ? item.price : byId.get(item.bookingId)?.price;
      return <li key={item.name}><div><strong>{item.name}</strong>
        {"cheesePrice" in item && item.cheesePrice && <small>مع الجبن +{currency(item.cheesePrice)}</small>}
        {"description" in item && item.description && <small>{item.description}</small>}
      </div>{price !== undefined && <span className="guide-price">{currency(price)}</span>}</li>;
    })}</ul>
  </>;
}

function DiningTable() {
  const rows = dining.filter(item => item.id.endsWith("-plain"));
  const inclusions = dining.find(item => item.id.endsWith("-decorated"))!.details;
  return <>
    <img className="guide-section-photo" src={guide.diningImage} alt="تنسيق طاولة الطعام الخارجية في المنتجع" loading="lazy" />
    <table className="guide-pricing-table"><caption>تجهيز طاولات الطعام</caption>
      <thead><tr><th scope="col">عدد الضيوف</th><th scope="col">طاولات وكراسي</th><th scope="col">مع التنسيق</th></tr></thead>
      <tbody>{rows.map(row => <tr key={row.id}><th scope="row">{row.capacity}</th><td>{currency(row.price!)}</td>
        <td>{currency(dining.find(item => item.capacity === row.capacity && item.id.endsWith("-decorated"))!.price!)}</td></tr>)}</tbody>
    </table><p className="guide-text">يشمل التنسيق {inclusions.join("، ")}</p>
  </>;
}

function Leisure({ chalet = false }: {chalet?: boolean}) {
  const box = byId.get("games-box")!;
  const table = byId.get("games-table")!;
  return <>
    <Section title="الألعاب المائية" subtitle={guide.water.size + " ألعاب للكبار والصغار · " + currency(guide.water.price)} icon={Waves}>
      <p>تشمل الباقة {guide.water.size} ألعاب مائية، ويمكن توزيعها بين الكبار والصغار</p>
      {guide.water.notes.map(note => <p className="guide-text" key={note}>{note}</p>)}
    </Section>
    <Section title="الألعاب الترفيهية" subtitle={chalet ? box.title + " · " + currency(box.price!) : "بوكس ألعاب أو طاولة مع البوكس"} icon={Gamepad2}>
      <img className="guide-section-photo" src={games.image} alt="الألعاب الجماعية المشمولة في البوكس" loading="lazy" />
      <div className="guide-simple-item"><strong>{box.title}</strong><span className="guide-price">{currency(box.price!)}</span></div>
      {!chalet && <div className="guide-simple-item"><div><strong>{table.title}</strong><small>{table.description}</small></div><span className="guide-price">{currency(table.price!)}</span></div>}
      <p className="guide-text">{games.contents.join("، ")}</p>
      {games.notes.map(note => <p className="guide-text" key={note}>{note}</p>)}
    </Section>
  </>;
}

function ResortGuide() {
  const cake = byId.get("seating-cake")!;
  return <>
    <Section title="تنسيقات المناسبات" subtitle="من الورد إلى تجهيز الاحتفال، ويفضل ترتيب الباقة قبل الوصول" icon={Flower2}>
      <Note>{guide.notes.coordination}</Note>
      {decor.map(item => <Item key={item.id} item={item} />)}
    </Section>
    <Section title="الجلسات الخارجية" subtitle="جلسات لشخصين وحتى 12 شخصا" icon={Armchair}>
      <Note>{guide.notes.seating}</Note>
      {seating.map(item => <Item key={item.id} item={item} />)}
      <Item item={cake} />
    </Section>
    <Section title="طاولات الطعام" subtitle="تجهيزات من 6 إلى 32 ضيفا" icon={Utensils}><DiningTable /></Section>
    <Section title="جلسة السينما" subtitle={cinema.duration + " في المساحة الخاصة بالكوخ · " + currency(cinema.price)} icon={Projector}>
      <Note>{cinema.notes[0]}</Note>
      <img className="guide-section-photo" src={cinema.image} alt="جلسة السينما الخارجية في المنتجع" loading="lazy" />
      <ul className="guide-bullets">{cinema.contents.map(text => <li key={text}>{text}</li>)}</ul>
      {cinema.notes.slice(1).map(note => <p className="guide-text" key={note}>{note}</p>)}
    </Section>
    <Section title="الضيافة" subtitle="الضيافة السعودية، ضيافة الاسترخاء والضيافة العائلية" icon={Coffee}>
      {resort.filter(item => item.group === "hospitality").map(item => <Item key={item.id} item={item} />)}
    </Section>
    <Section title="المطعم وبوكسات الشواء" subtitle={guide.restaurantHours} icon={Utensils}>
      <RestaurantMenu /><p className="guide-text">{guide.notes.barbecue}</p>
    </Section>
    <Leisure />
    <Section title="مستلزمات الإقامة" subtitle="حافظة الثلج، المناشف والطلبات الإضافية" icon={Package}>
      {resort.filter(item => item.group === "essentials" && !item.variantGroup).map(item => <Item key={item.id} item={item} />)}
    </Section>
    <Section title="غرفة السائق" subtitle="حسب التوفر" icon={BedSingle}><Note>{guide.notes.driver}</Note></Section>
  </>;
}

export default function ServiceDirectory({ venue, onVenueChange }: {venue: string; onVenueChange: (venue: string) => void}) {
  const place = venues.find(entry => entry.id === venue) ?? venues[0];
  return <div className="service-directory">
    <div className="guide-venues" role="group" aria-label="وجهة الخدمات">{venues.map(entry =>
      <button type="button" key={entry.id} aria-pressed={entry.id === place.id} onClick={() => onVenueChange(entry.id)}>
        <strong>{entry.shortName}</strong><small>{entry.branch}</small>
      </button>)}</div>
    <section key={place.id} aria-labelledby="guide-title"><h2 id="guide-title">خدمات {place.shortName}</h2>
      {place.id === "resort" ? <ResortGuide /> : place.id === "chalet" ? <Leisure chalet /> : guide.restHouse.map(item =>
        <Section key={item.id} title={item.title} subtitle={item.priceLabel} icon={item.id === "inflatable-slide" ? Waves : ConciergeBell}>
          {item.image && <img className="guide-section-photo" src={item.image} alt={item.title + " في القسم الثاني"} loading="lazy" />}
          <p>{item.description}</p>
        </Section>)}
    </section>
  </div>;
}
