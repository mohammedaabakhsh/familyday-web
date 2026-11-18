"use client";

import { AddonOption } from "./addon-item";
import type { BookingAddon } from "./booking-addons";

type Props = { options: BookingAddon[]; selectedId?: string; included: string[]; onChoose: (item: BookingAddon) => void };

export default function VariantAddon({ options, selectedId, included, onChoose }: Props) {
  const cinema = options[0].variantGroup === "cinema";
  return <fieldset className="extra-row addon-option-group">
    <legend>{cinema ? "جلسة السينما" : "الألعاب الجماعية"}</legend>
    {cinema && <p className="extras-hint">{options[0].description}</p>}
    <div className="extra-variants immediate-options">{options.map(item =>
      <AddonOption key={item.id} addon={item} title={item.variantLabel ?? item.title}
        description={cinema ? undefined : item.description} included={included.includes(item.id)}
        selected={selectedId === item.id} onChoose={onChoose}/>
    )}</div>
    {!cinema && <details className="extra-details"><summary>محتويات البوكس</summary>
      <ul>{options[0].details.map(detail => <li key={detail}>{detail}</li>)}</ul></details>}
  </fieldset>;
}
