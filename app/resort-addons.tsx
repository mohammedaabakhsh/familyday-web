"use client";

import { Armchair, Coffee, Flower2, Gamepad2, ShoppingBasket, UtensilsCrossed } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import AddonItem from "./addon-item";
import BarbecueAddon from "./barbecue-addon";
import DiningAddon from "./dining-addon";
import SeatingAddons from "./seating-addons";
import VariantAddon from "./variant-addon";
import { addonQuantity, changeAddon, includedUnits, normalizeAddons, type AddonSelection } from "./addon-selection";
import { getAllowedAddons, type BookingAddon } from "./booking-addons";

const groups = [
  { id: "hospitality", title: "الضيافة", icon: Coffee, hint: "السعودية، الاسترخاء، العائلية" },
  { id: "decor", title: "تنسيقات المناسبات", icon: Flower2, hint: "صور الباقات وتفاصيل التجهيز" },
  { id: "essentials", title: "الطلبات الإضافية", icon: ShoppingBasket, hint: "مستلزمات الإقامة وبوكسات الشواء" },
  { id: "fun", title: "الألعاب والسينما", icon: Gamepad2, hint: "بوكس الألعاب وجلسة السينما" },
  { id: "seating", title: "الجلسات الخارجية", icon: Armchair, hint: "اختر الجلسة وعدد الأشخاص" },
  { id: "dining", title: "طاولات الطعام", icon: UtensilsCrossed, hint: "عدد الضيوف وتجهيز الطاولة" },
] as const;

const catalog = getAllowedAddons("resort");

export default function ResortAddons({ selection, onChange }: { selection: AddonSelection; onChange: (next: AddonSelection) => void }) {
  const selected = catalog.filter(item => selection.ids.includes(item.id));
  const covered = includedUnits(selected, selection.quantities);
  const choose = (item: BookingAddon) => onChange(changeAddon(selection, item, selection.ids.includes(item.id) ? 0 : 1));

  function itemRow(item: BookingAddon) {
    const count = selection.ids.includes(item.id) ? addonQuantity(item, selection.quantities) : 0;
    return <AddonItem key={item.id} addon={item} count={count} covered={covered[item.id] ?? 0}
      onCount={value => onChange(changeAddon(selection, item, value))} />;
  }

  function variants(group: string, options: BookingAddon[]) {
    const picked = options.find(item => selection.ids.includes(item.id));
    if (group === "dining") return <DiningAddon key={group} options={options} selectedId={picked?.id} onChoose={choose} />;
    if (group === "bbq") return <BarbecueAddon key={group} options={options} selectedId={picked?.id} onChoose={choose} />;
    return <VariantAddon key={group} options={options} selectedId={picked?.id} included={Object.keys(covered)} onChoose={choose} />;
  }

  return (
    <Accordion type="multiple" defaultValue={["hospitality"]} className="resort-extras">
      {groups.map(group => {
        const items = catalog.filter(item => item.group === group.id);
        const chosen = selected.filter(item => item.group === group.id);
        const variantGroups = [...new Set(items.flatMap(item => item.variantGroup ? [item.variantGroup] : []))];
        return (
          <AccordionItem key={group.id} value={group.id}>
            <AccordionTrigger className="extras-trigger">
              <span className="extras-heading"><group.icon size={23} />
                <span><strong>{group.title}</strong><small>{chosen.length ? chosen.map(item => {
                  const quantity = addonQuantity(item, selection.quantities);
                  return quantity > 1 ? item.title + " × " + quantity : item.title;
                }).join(" · ") : group.hint}</small></span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {group.id === "seating" ? (
                <SeatingAddons selected={selection.ids} onChange={ids => onChange(normalizeAddons(ids, selection.quantities, "resort"))} />
              ) : group.id === "decor" ? (
                <><p className="extras-hint">اختر تنسيقًا واحدًا للكوخ</p>{items.map(itemRow)}</>
              ) : (
                <>
                  {group.id === "hospitality" && <p className="extras-hint">يمكنك الجمع بين باقات الضيافة وتحديد عدد كل باقة</p>}
                  {items.filter(item => !item.variantGroup).map(itemRow)}
                  {variantGroups.map(variant => variants(variant, items.filter(item => item.variantGroup === variant)))}
                </>
              )}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
