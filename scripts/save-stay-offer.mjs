import { writeFileSync } from "node:fs";

function amount(input) {
  const text = String(input ?? "").trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text) || !Number.isSafeInteger(Math.round(Number(text) * 100)) || Number(text) <= 0) {
    throw new Error("أدخل سعرًا موجبًا بالريال وبحد أقصى منزلتين عشريتين");
  }
  return Number(text);
}

function night(text) {
  const time = Date.parse(text + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(time) || !new Date(time).toISOString().startsWith(text)) {
    throw new Error("أدخل تاريخًا صحيحًا بصيغة YYYY-MM-DD");
  }
  return text;
}

const { FIRST, SECOND, COMBINED, START, END } = process.env;
const settings = {
  firstSectionNightly: amount(FIRST), secondSectionNightly: amount(SECOND),
  bothSectionsNightly: null, firstOfferNight: "", lastOfferNight: "",
};
if (COMBINED?.trim() || START?.trim() || END?.trim()) {
  settings.bothSectionsNightly = amount(COMBINED);
  settings.firstOfferNight = night(START?.trim() ?? "");
  settings.lastOfferNight = night(END?.trim() ?? "");
  if (settings.lastOfferNight < settings.firstOfferNight) throw new Error("آخر ليلة تسبق أول ليلة للعرض");
  if (settings.bothSectionsNightly >= settings.firstSectionNightly + settings.secondSectionNightly) {
    throw new Error("سعر العرض يجب أن يكون أقل من مجموع سعري القسمين");
  }
}
writeFileSync("app/stay-offer.json", JSON.stringify(settings, null, 2) + "\n");
