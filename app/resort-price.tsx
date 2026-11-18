import { getNightlyRate, nightCountLabel, type ResortPrice } from "./resort-pricing";
import { Tag, Clock3 } from "lucide-react";

const number = (value: number) => new Intl.NumberFormat("ar-SA-u-nu-latn").format(value);

export function NightlyPrice({cabinId}: {cabinId?: string}) {
 const rate = getNightlyRate(cabinId);
 if (rate === null) return <span className="nightly-price"><small>سعر الإقامة قيد التحديد</small></span>;
 return <span className="nightly-price"><strong>{number(rate)} <span>ر.س</span></strong><small>/ ليلة</small></span>;
}

export function ResortPriceSummary({ price }: { price: ResortPrice }) {
 const partial = price.unpriced.length > 0;
 return <section className="resort-price-summary" aria-label="ملخص السعر">
  <div className="price-summary-heading"><span>ملخص السعر</span></div>
  {price.offer && <div className="applied-resort-offer"><Tag size={19}/><div><strong>{price.offer.title}</strong>
   <small>{price.baseStayAmount === null ? `خصم ${number(price.offer.discount)}٪ على الإقامة` : `وفّرت ${number(price.savings)} ر.س على الإقامة`}</small></div></div>}
  <dl className="price-breakdown">
   <div><dt>{price.offer?.shortStay ? "سعر الإقامة الأساسي" : "الإقامة · " + nightCountLabel(price.nights)}</dt>
    <dd>{price.baseStayAmount === null ? "سعر الإقامة قيد التحديد" : number(price.baseStayAmount) + " ر.س"}</dd></div>
   {price.offer && price.baseStayAmount !== null && <div className="offer-saving"><dt>خصم {number(price.offer.discount)}٪</dt><dd>−{number(price.savings)} ر.س</dd></div>}
   {price.extensionHours > 0 && <div><dt>تمديد {number(price.extensionHours)} {price.extensionHours === 1 ? "ساعة" : "ساعات"}</dt><dd>{number(price.extensionAmount)} ر.س</dd></div>}
   <div><dt>{partial ? "الإضافات المسعّرة" : "الإضافات"}</dt><dd>{price.hasExtras ? partial && price.extrasAmount === 0 ? "بانتظار التسعير" : number(price.extrasAmount) + " ر.س" : "دون إضافات"}</dd></div>
   <div className="price-total"><dt>{partial ? "المجموع الجزئي" : "الإجمالي"}</dt>
    <dd>{price.total === null ? "بانتظار سعر الإقامة" : <>{number(price.total)} <span>ر.س</span></>}</dd></div>
  </dl>
  {price.offer && <p className="offer-stay-times"><Clock3 size={15}/>الدخول 4 عصرًا · الخروج {price.checkoutLabel}{price.offer.shortStay ? " في اليوم التالي" : ""}</p>}
  {partial && <p className="price-pending">بانتظار تسعير {price.unpriced.join("، ")}</p>}
 </section>;
}

export function ResortPriceAction({ price, cabinId, offerPreview }: {
 price: ResortPrice | null; cabinId?: string; offerPreview?: { amount: number; label: string };
}) {
 const amount = price ? price.stayAmount : (offerPreview?.amount ?? getNightlyRate(cabinId));
 return <div className="booking-price-action">
  <small>{price ? "سعر الإقامة" : offerPreview?.label ?? "سعر الليلة"}{price?.offer && <span className="sticky-offer-title">{price.offer.shortStay ? "10 ساعات" : "وسط الأسبوع"}</span>}</small>
  <strong>{amount === null ? "قيد التحديد" : <>{number(amount)} <span>ر.س</span></>}</strong>
 </div>;
}
