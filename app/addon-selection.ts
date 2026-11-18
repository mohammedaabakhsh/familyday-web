import { BOOKING_ADDONS, type BookingAddon } from "./booking-addons";

export type AddonSelection = { ids: string[]; quantities: Record<string, number> };
export const EMPTY_ADDONS: AddonSelection = { ids: [], quantities: {} };
export const MAX_ADDON_QUANTITY = 99;

const catalog = new Map(BOOKING_ADDONS.map(item => [item.id, item]));

export function addonQuantity(item: BookingAddon, quantities: AddonSelection["quantities"]) {
  const value = quantities[item.id];
  return item.quantity && Number.isFinite(value)
    ? Math.max(1, Math.min(MAX_ADDON_QUANTITY, Math.floor(value)))
    : 1;
}

export function includedUnits(items: BookingAddon[], quantities: AddonSelection["quantities"]) {
  const included: Record<string, number> = {};
  for (const pack of items) {
    for (const [id, count] of Object.entries(pack.included ?? {})) {
      included[id] = (included[id] ?? 0) + (count ?? 0) * addonQuantity(pack, quantities);
    }
  }
  return included;
}

export function addonLinePrice(item: BookingAddon, quantities: AddonSelection["quantities"], included: Record<string, number>) {
  if (item.price === undefined) return undefined;
  // Counted extras are units explicitly ordered beyond anything in a package.
  if (!item.quantity && included[item.id]) return 0;
  return item.price * addonQuantity(item, quantities);
}

export function normalizeAddons(ids: string[], quantities: AddonSelection["quantities"], property: string): AddonSelection {
  const groups = new Set<string>();
  const selected: BookingAddon[] = [];
  for (const id of new Set(ids)) {
    const item = catalog.get(id);
    if (!item || item.property !== property || (item.variantGroup && groups.has(item.variantGroup))) continue;
    if (item.variantGroup) groups.add(item.variantGroup);
    selected.push(item);
  }
  const valid = selected.filter(item => !item.requiresGroup || groups.has(item.requiresGroup));
  return {
    ids: valid.map(item => item.id),
    quantities: Object.fromEntries(valid.filter(item => item.quantity).map(item => [item.id, addonQuantity(item, quantities)])),
  };
}

export function changeAddon(selection: AddonSelection, item: BookingAddon, count: number): AddonSelection {
  const ids = selection.ids.filter(id => id !== item.id && !(count > 0 && item.variantGroup && catalog.get(id)?.variantGroup === item.variantGroup));
  if (count > 0) ids.push(item.id);
  const next = normalizeAddons(ids, { ...selection.quantities, [item.id]: count }, item.property);
  if (item.group !== "hospitality" && item.group !== "decor") return next;

  const before = includedUnits(BOOKING_ADDONS.filter(addon => selection.ids.includes(addon.id)), selection.quantities);
  const after = includedUnits(BOOKING_ADDONS.filter(addon => next.ids.includes(addon.id)), next.quantities);
  // A newly added package fulfils matching units already on the order.
  // Removing a package must never turn its contents into paid extras.
  for (const id of next.ids) {
    if (!catalog.get(id)?.quantity && before[id] && !after[id]) {
      next.ids = next.ids.filter(selected => selected !== id);
      continue;
    }
    const absorbed = (after[id] ?? 0) - (before[id] ?? 0);
    if (absorbed <= 0 || !catalog.get(id)?.quantity) continue;
    const extra = next.quantities[id] - absorbed;
    if (extra > 0) next.quantities[id] = extra;
    else {
      next.ids = next.ids.filter(selected => selected !== id);
      delete next.quantities[id];
    }
  }
  return next;
}
