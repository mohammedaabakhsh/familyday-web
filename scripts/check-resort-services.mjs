import assert from "node:assert/strict";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
});
try {
  const { BOOKING_ADDONS } = await vite.ssrLoadModule("/app/booking-addons.ts");
  const { changeAddon, EMPTY_ADDONS, addonLinePrice, includedUnits } = await vite.ssrLoadModule("/app/addon-selection.ts");
  const { readBookingDraft } = await vite.ssrLoadModule("/app/booking-draft.ts");
  const { getResortPrice } = await vite.ssrLoadModule("/app/resort-pricing.ts");
  const catalog = new Map(BOOKING_ADDONS.map(item => [item.id, item]));
  let selection = EMPTY_ADDONS;
  function choose(id, count = 1) {
    assert.ok(catalog.has(id), id);
    selection = changeAddon(selection, catalog.get(id), count);
  }
  function checkExtras(expected) {
    const items = selection.ids.map(id => catalog.get(id));
    const included = includedUnits(items, selection.quantities);
    const review = items.reduce((sum, item) => sum + addonLinePrice(item, selection.quantities, included), 0);
    const price = getResortPrice("2026-11-22", "2026-11-24", items, selection.quantities, { cabinId: "1" });
    assert.equal(review, expected, "review line prices");
    assert.equal(price.extrasAmount, expected, "booking subtotal");
    assert.equal(price.total, price.baseStayAmount + expected);
  }

  choose("ice-box", 2);
  checkExtras(50);
  choose("family-hospitality");
  checkExtras(110); // One of the two coolers is already in the package.
  choose("family-hospitality", 2);
  assert.ok(!selection.ids.includes("ice-box"));
  checkExtras(170);
  choose("saudi-hospitality", 2);
  choose("relaxation-hospitality");
  checkExtras(363);
  choose("ice-box"); // An additional cooler explicitly ordered after the package.
  checkExtras(388);
  choose("family-hospitality", 0);
  checkExtras(218);

  selection = EMPTY_ADDONS;
  choose("decor-complete");
  choose("cinema-late");
  choose("games-table");
  checkExtras(1750);
  choose("decor-rose");
  assert.deepEqual(selection.ids, ["decor-rose"]);
  checkExtras(120);
  choose("cinema-late");
  checkExtras(270);

  const draft = JSON.stringify({ version: 1, savedAt: 1000, selectedKey: "1", from: "2026-11-22", to: "2026-11-24",
    addons: ["hospitality-complete", "decor", "extra-bed", "ice-box", "ice-box", "unknown", "water-game"],
    addonQuantities: { "ice-box": 2 } });
  const recovered = readBookingDraft(draft, "2026-11-18", 1100);
  assert.deepEqual(recovered.addons, ["ice-box"]);
  assert.deepEqual(recovered.addonQuantities, { "ice-box": 2 });
  assert.equal(recovered.from, "2026-11-22");
  console.log("Service quantities, package inclusions, review totals and legacy drafts passed.");
} finally {
  await vite.close();
}
