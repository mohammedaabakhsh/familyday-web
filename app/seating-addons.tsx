"use client";
import { useState } from "react";
import { Check } from "lucide-react";
import { SEATING_OPTIONS, SEATING_CAKE, selectSeating } from "./seating-selection";
const n=(value:number)=>new Intl.NumberFormat("ar-SA-u-nu-latn").format(value);
export default function SeatingAddons({selected,onChange}:{selected:string[];onChange:(ids:string[])=>void}) {
 const chosen=SEATING_OPTIONS.find(option=>selected.includes(option.id));
 const [people,setPeople]=useState(chosen?.capacity??2);
 const cake=selected.includes(SEATING_CAKE.id);
 const options=SEATING_OPTIONS.filter(option=>option.capacity===people);
 return <div className="seating-picker">
  <fieldset className="seating-count"><legend>كم شخص؟</legend><div>{[2,4,8,12].map(count=><button type="button" key={count} aria-pressed={people===count} className={people===count?"active":""} onClick={()=>setPeople(count)}>{count===2?"شخصين":count===12?"12 شخصًا":`${n(count)} أشخاص`}</button>)}</div></fieldset>
  {chosen&&chosen.capacity!==people&&<div className="seating-current" role="status"><span>اختيارك الحالي: {chosen.title}</span><button type="button" className="text-button" onClick={()=>setPeople(chosen.capacity!)}>عرض اختياري</button></div>}
  <div className="seating-options">{options.map(option=>{const active=chosen?.id===option.id;return <article className={"seating-option"+(active?" chosen":"")} key={option.id}>
   <div className="seating-photo"><img src={option.image} alt={option.title} loading="lazy"/>{active&&<span><Check size={15}/>مختارة</span>}</div>
   <div className="seating-copy"><h3>{option.title.split(" · ")[0]}</h3><p>{option.description}</p><div className="seating-option-bottom"><strong>{n(option.price!)} <small>ر.س</small></strong><button type="button" className={"extra-add"+(active?" selected":"")} aria-label={(active?"إزالة ":"إضافة ")+option.title} aria-pressed={active} onClick={()=>onChange(selectSeating(selected,option.id))}>{active?"إزالة الجلسة":"إضافة الجلسة"}</button></div></div>
  </article>;})}</div>
  {chosen&&<div className="seating-selected"><div className="seating-cake"><span><strong>كيك وعصير</strong><small>اختياري · 170 ر.س</small></span><button type="button" className="extra-add" aria-label={(cake?"إزالة ":"إضافة ")+SEATING_CAKE.title} aria-pressed={cake} onClick={()=>onChange(cake?selected.filter(id=>id!==SEATING_CAKE.id):[...selected,SEATING_CAKE.id])}>{cake?"إزالة":"إضافة"}</button></div><div className="seating-total" aria-live="polite"><span>إجمالي الجلسة{cake?" مع الإضافة":""}</span><strong>{n(chosen.price!+(cake?SEATING_CAKE.price!:0))} ر.س</strong></div></div>}
 </div>;
}
