"use client";

import { AddonOption } from "./addon-item";
import type { BookingAddon } from "./booking-addons";

type Props = { options: BookingAddon[]; selectedId?: string; onChoose: (addon: BookingAddon) => void };

export default function BarbecueAddon({ options, selectedId, onChoose }: Props) {
  return <fieldset className="extra-row addon-option-group">
    <legend>بوكس الشواء</legend>
    <p className="extras-hint">{options[0].description}</p>
    <div className="extra-variants immediate-options">
      {options.map(item => <AddonOption key={item.id} addon={item}
        title={item.title.replace("بوكس الشواء · ", "")} selected={item.id === selectedId} onChoose={onChoose}/>)}
    </div>
  </fieldset>;
}
