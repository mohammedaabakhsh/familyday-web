"use client";

import { useState } from "react";
import { AddonOption } from "./addon-item";
import type { BookingAddon } from "./booking-addons";

type Props = { options: BookingAddon[]; selectedId?: string; onChoose: (addon: BookingAddon) => void };

export default function DiningAddon({ options, selectedId, onChoose }: Props) {
  const chosen = options.find(item => item.id === selectedId);
  const capacities = [...new Set(options.map(item => item.capacity!))].sort((a, b) => a - b);
  const [people, setPeople] = useState(chosen?.capacity ?? capacities[0]);
  const setups = options.filter(item => item.capacity === people);
  const details = setups.find(item => item.details.length)?.details;
  return <div className="dining-picker">
    <fieldset className="dining-count"><legend>عدد الضيوف</legend><div>
      {capacities.map(count => <button key={count} type="button" aria-pressed={people === count}
        className={people === count ? "selected" : ""} onClick={() => setPeople(count)}>{count}</button>)}
    </div></fieldset>
    {chosen && chosen.capacity !== people && <div className="seating-current">
      <span>المضاف للحجز · {chosen.capacity} ضيفًا · {chosen.variantLabel}</span>
      <button type="button" className="text-button" onClick={() => setPeople(chosen.capacity!)}>عرض اختياري</button>
    </div>}
    <fieldset className="dining-setup"><legend>تجهيز الطاولة</legend>
      <div className="extra-variants immediate-options">{setups.map(item =>
        <AddonOption key={item.id} addon={item} title={item.variantLabel ?? item.title} description={item.description}
          selected={item.id === selectedId} onChoose={onChoose}/>
      )}</div>
    </fieldset>
    {details && <details className="extra-details"><summary>ماذا يشمل التنسيق؟</summary>
      <ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul></details>}
  </div>;
}
