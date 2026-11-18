import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  appType: "custom",
  logLevel: "error",
  optimizeDeps: { noDiscovery: true, include: [] },
  server: { middlewareMode: true, hmr: false },
});
try {
  const { BOOKING_ADDONS, getAllowedAddons } = await vite.ssrLoadModule("/app/booking-addons.ts");
  const { changeAddon, EMPTY_ADDONS, addonLinePrice, includedUnits } = await vite.ssrLoadModule("/app/addon-selection.ts");
  const { readBookingDraft } = await vite.ssrLoadModule("/app/booking-draft.ts");
  const { getResortPrice, getNightlyRate } = await vite.ssrLoadModule("/app/resort-pricing.ts");
  const { readRoute, routeHash, isBookingStep } = await vite.ssrLoadModule("/app/booking-navigation.ts");
  for (const resume of [undefined, "review", "cabin"]) {
    assert.deepEqual(readRoute(routeHash("dates", "1", resume), "departure"), { screen: "dates", id: "1", resume, field: "departure" });
  }
  assert.equal(readRoute("#dates/1/other", "invalid").resume, undefined);
  assert.equal(readRoute("#dates/1", "invalid").field, undefined);
  assert.deepEqual(readRoute("#addons/12"), { screen: "addons", id: "12" });
  assert.ok(isBookingStep("dates"));
  assert.ok(!isBookingStep("services"));
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

  choose("saudi-hospitality");
  choose("ice-box");
  const oneNight = getResortPrice("2026-11-22", "2026-11-23", selection.ids.map(id => catalog.get(id)), selection.quantities, { cabinId: "1" });
  assert.deepEqual([oneNight.stayAmount, oneNight.extrasAmount, oneNight.total], [800, 84, 884]);
  const twoNights = getResortPrice("2026-11-22", "2026-11-24", selection.ids.map(id => catalog.get(id)), selection.quantities, { cabinId: "1" });
  assert.deepEqual([twoNights.stayAmount, twoNights.extrasAmount, twoNights.total], [1600, 84, 1684]);
  choose("ice-box", 0);
  checkExtras(59);
  choose("saudi-hospitality", 0);
  checkExtras(0);

  choose("dining-6-plain");
  choose("dining-12-decorated");
  assert.deepEqual(selection.ids, ["dining-12-decorated"]);
  choose("bbq-beef-plain");
  choose("bbq-chicken-coal");
  assert.deepEqual(selection.ids, ["dining-12-decorated", "bbq-chicken-coal"]);
  choose("cinema-early");
  choose("cinema-late");
  assert.deepEqual(selection.ids, ["dining-12-decorated", "bbq-chicken-coal", "cinema-late"]);

  selection = EMPTY_ADDONS;
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

  const cabins = JSON.parse(readFileSync("app/cabins.json", "utf8")).filter(c => c.property === "resort");
  assert.deepEqual(cabins.map(c => c.id), [1,12,2,3,4,13,5,6,7,8,9,10]);
  for (const unit of cabins) {
    assert.ok(!unit.description.includes(unit.suitable), unit.name);
    assert.ok(!unit.stayFeatures.some(feature => feature.includes("سائق")), unit.name);
    if (unit.rooms === 1) assert.ok(unit.indoor.includes("سرير مزدوج"), unit.name);
    else assert.ok(unit.indoor.includes("سريران مفردان في الغرفة الثانية"), unit.name);
    assert.equal(unit.outdoor.at(-1), "شواية", unit.name);
    assert.ok(unit.outdoor.some(fact => fact.includes("140 سم")), unit.name);
    assert.ok(unit.indoor.some(fact => fact.includes("حمام")), unit.name);
    assert.ok(unit.images.every(path => existsSync("public" + path)), unit.name);
    assert.equal(Boolean(unit.combinedNote), [3,9].includes(unit.id));
    if ([1,12].includes(unit.id)) assert.ok(unit.indoor.includes("صالة داخلية مدمجة مع غرفة النوم"));
  }
  for (const id of ["12", "13"]) {
    assert.equal(getNightlyRate(id), null, "no fallback rate for unpriced individual cabins");
    const price = getResortPrice("2026-11-22", "2026-11-24", [catalog.get("ice-box")], {}, {cabinId: id, offerId: "midweek"});
    assert.equal(price.nightlyRate, null);
    assert.equal(price.stayAmount, null);
    assert.equal(price.total, null);
    assert.equal(price.extrasAmount, 25);
    assert.equal(price.offer.id, "midweek");
  }
  assert.equal(getAllowedAddons("stay", "20").length, 0);
  assert.deepEqual(getAllowedAddons("stay", "21"), getAllowedAddons("stay", "both"));
  assert.equal(getAllowedAddons("stay", "21")[0].id, "water-game");
  const guide = JSON.parse(readFileSync("app/guest-service-guide.json", "utf8"));
  assert.ok(guide.notes.driver.includes("حسب التوفر"));
  const menu = guide.menu.flatMap(group => group.items);
  assert.equal(menu.length, 47);
  for (const item of menu) assert.ok((item.bookingId ? catalog.get(item.bookingId)?.price : item.price) > 0, item.name);
  const { leisure } = JSON.parse(readFileSync("app/resort-service-catalog.json", "utf8"));
  assert.equal(leisure.games.contents.length, 6);
  assert.deepEqual(catalog.get("games-table").details, leisure.games.contents);
  console.log("Booking selections, guide prices, cabin specifications, and legacy drafts passed.");
} finally {
  await vite.close();
}
