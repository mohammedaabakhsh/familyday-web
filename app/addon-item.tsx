"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react";
import { MAX_ADDON_QUANTITY } from "./addon-selection";
import type { BookingAddon } from "./booking-addons";

const format = (value: number) => value.toLocaleString("ar-SA-u-nu-latn");

type OptionProps = {
  addon: BookingAddon;
  title: string;
  selected: boolean;
  onChoose: (addon: BookingAddon) => void;
  description?: string;
  included?: boolean;
};

export function AddonOption({ addon, title, selected, onChoose, description, included }: OptionProps) {
  const price = included ? "مشمول في باقتك" : addon.price === undefined ? "السعر قيد التحديد" : format(addon.price) + " ر.س";
  return <button type="button" className={selected ? "selected" : ""} aria-pressed={selected}
    aria-label={(selected ? "إزالة " : "إضافة ") + addon.title} onClick={() => onChoose(addon)}>
    <strong>{title}</strong>{description && <small>{description}</small>}
    <span>{price}</span><span className="option-action">{selected ? "إزالة" : "إضافة"}</span>
  </button>;
}

export function PackagePhotos({ photos, title }: { photos: string[]; title: string }) {
  const [index, setIndex] = useState(0);
  return (
    <figure className="package-photos">
      <img src={photos[index]} alt={title + "، الصورة " + format(index + 1)} loading="lazy" />
      <figcaption>
        <button type="button" aria-label={"الصورة السابقة من " + title} disabled={index === 0} onClick={() => setIndex(index - 1)}><ChevronRight size={18} /></button>
        <span aria-live="polite"><bdi dir="ltr">{format(index + 1)} / {format(photos.length)}</bdi></span>
        <button type="button" aria-label={"الصورة التالية من " + title} disabled={index === photos.length - 1} onClick={() => setIndex(index + 1)}><ChevronLeft size={18} /></button>
      </figcaption>
    </figure>
  );
}

type Props = {
  addon: BookingAddon;
  count: number;
  covered: number;
  onCount: (count: number) => void;
};

export default function AddonItem({ addon, count, covered, onCount }: Props) {
  const [expanded, setExpanded] = useState(false);
  const detailRef = useRef<HTMLDetailsElement>(null);
  const isPackage = addon.group === "hospitality" || addon.group === "decor";
  const hasPhotos = Boolean(addon.photos?.length);
  const addLabel = covered ? "إضافة كمية أخرى" : "إضافة";
  return (
    <article className={"extra-row service-item" + (count ? " chosen" : "")} aria-label={addon.title}>
      <div className="extra-row-main">
        <div className="service-item-title">
          {hasPhotos && <button type="button" className="package-thumbnail" aria-label={"صور " + addon.title} aria-expanded={expanded}
            onClick={() => { if (detailRef.current) detailRef.current.open = !detailRef.current.open; }}>
            <img src={addon.photos![0]} width={66} height={66} alt="" loading="lazy" />
          </button>}
          <div><strong>{addon.title}</strong>
          {addon.description && <small>{addon.description}</small>}
          <small className="extra-price">{addon.price !== undefined ? format(addon.price) + " ر.س" : "السعر يُحدّد لاحقًا"}{isPackage && " للباقة"}</small></div>
        </div>
        {!count && <button type="button" className="extra-add" aria-label={addLabel + " · " + addon.title} onClick={() => onCount(1)}>{addLabel}</button>}
        {count > 0 && <button type="button" className="extra-add selected" aria-label={"إزالة " + addon.title} onClick={() => onCount(0)}>إزالة</button>}
      </div>
      {covered > 0 && <small className="included-label covered-count">ضمن الباقات المختارة × {format(covered)}</small>}
      {count > 0 && addon.quantity && (
        <div className="extra-quantity service-counter">
          <span>{covered ? "الكمية الإضافية" : isPackage ? "عدد الباقات" : "الكمية"}</span>
          <button type="button" aria-label={"تقليل كمية " + addon.title} onClick={() => onCount(count - 1)}><Minus size={15} /></button>
          <output aria-label={"كمية " + addon.title}>{format(count)}</output>
          <button type="button" aria-label={"زيادة كمية " + addon.title} disabled={count >= MAX_ADDON_QUANTITY} onClick={() => onCount(count + 1)}><Plus size={15} /></button>
          {count > 1 && addon.price !== undefined && <strong className="line-amount">{format(count * addon.price)} ر.س</strong>}
        </div>
      )}
      {(addon.details.length > 0 || hasPhotos || addon.note) && (
        <details ref={detailRef} className="extra-details" onToggle={event => setExpanded(event.currentTarget.open)}>
          <summary>{hasPhotos ? "الصور وتفاصيل الباقة" : isPackage ? "تفاصيل الباقة" : "التفاصيل"}</summary>
          {expanded && hasPhotos && <PackagePhotos photos={addon.photos!} title={addon.title} />}
          <ul>{addon.details.map(detail => <li key={detail}>{detail}</li>)}</ul>
          {addon.note && <p className="package-note">{addon.note}</p>}
        </details>
      )}
    </article>
  );
}
