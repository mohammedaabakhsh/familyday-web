"use client";

import { useState } from "react";
import type { BookingAddon } from "./booking-addons";

const n = (value: number) => value.toLocaleString("ar-SA-u-nu-latn");
type Props = { options: BookingAddon[]; selectedId?: string; included: string[]; onChoose: (item: BookingAddon) => void };

export default function VariantAddon({ options, selectedId, included, onChoose }: Props) {
  const [draftId, setDraftId] = useState(selectedId ?? "");
  const draft = options.find(item => item.id === draftId);
  const picked = options.find(item => item.id === selectedId);
  const cinema = options[0].variantGroup === "cinema";
  const amount = (item: BookingAddon) => included.includes(item.id) ? 0 : item.price!;
  const lowest = Math.min(...options.map(amount));
  const price = draft ? amount(draft) : lowest;
  return (
    <div className="extra-row">
      <div className="extra-row-main"><strong>{cinema ? "جلسة السينما" : "الألعاب الجماعية"}</strong>
        <span className="extra-price">{price === 0 ? "مشمول في الباقة" : (draft ? "" : "من ") + n(price) + " ر.س"}</span></div>
      {cinema && <p className="extras-hint">{options[0].description}</p>}
      <p className="extras-hint">{cinema ? "اختر الفترة" : "اختر التجهيز المناسب لك"}</p>
      <div className="extra-variants">{options.map(item =>
        <button type="button" key={item.id} aria-pressed={draftId === item.id} className={draftId === item.id ? "selected" : ""} onClick={() => setDraftId(item.id)}>
          {item.variantLabel}{!cinema && <small>{item.description}</small>}
          <small>{included.includes(item.id) ? "مشمول في باقتك" : n(item.price!) + " ر.س"}</small>
        </button>)}</div>
      {!cinema && <details className="extra-details"><summary>محتويات البوكس</summary><ul>{options[0].details.map(detail => <li key={detail}>{detail}</li>)}</ul></details>}
      {picked && <p className="extras-hint" role="status">المضاف: {picked.title}</p>}
      <div className="service-actions"><button type="button" className="extra-add" disabled={!draft} onClick={() => draft && onChoose(draft)}>{picked && picked.id === draft?.id ? "إزالة" : picked ? "تحديث الاختيار" : "إضافة"}</button>
        {picked && picked.id !== draft?.id && <button type="button" className="text-button" onClick={() => onChoose(picked)}>إزالة</button>}
      </div>
    </div>
  );
}
