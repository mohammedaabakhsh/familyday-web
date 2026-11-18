import serviceCatalog from "./resort-service-catalog.json";
import guide from "./guest-service-guide.json";

export type BookingAddon = {
  id: string;
  property: "resort" | "stay";
  group: "hospitality" | "decor" | "water" | "seating" | "fun" | "essentials" | "dining";
  title: string;
  price?: number;
  description?: string;
  details: string[];
  note?: string;
  photos?: string[];
  image?: string;
  capacity?: number;
  requiresGroup?: string;
  variantGroup?: string;
  variantLabel?: string;
  included?: Partial<Record<string, number>>;
  quantity?: boolean;
};

export const BOOKING_ADDONS: BookingAddon[] = [
  ...serviceCatalog.hospitality.map((pack): BookingAddon => ({
    ...pack, property: "resort", group: "hospitality", quantity: true,
  })),
  ...serviceCatalog.decor.map((pack): BookingAddon => ({
    ...pack, property: "resort", group: "decor", variantGroup: "coordination",
  })),
  ...serviceCatalog.essentials.map((item): BookingAddon => ({
    ...item, property: "resort", group: "essentials", quantity: true,
  })),
 { id: "water-game", property: "stay", group: "water", title: "الزحليقة الهوائية الكبيرة", description: "تتوفر في القسم الثاني من الاستراحة برسوم إضافية", details: [] },
 {"id": "romantic", "property": "resort", "group": "seating", "title": "جلسة بإطار مثلث · شخصان", "price": 300, "description": "طاولة وكرسيان، مع شموع وورود.", "details": [], "capacity": 2, "image": "/assets/jalsat_1.webp", "variantGroup": "outdoor"},
 {"id": "floor-table", "property": "resort", "group": "seating", "title": "جلسة أرضية · 4 أشخاص", "price": 200, "description": "طاولة أرضية، فرشة ومخدات، مع شموع وورود.", "details": [], "capacity": 4, "image": "/assets/jalsat_3.webp", "variantGroup": "outdoor"},
 {"id": "tent", "property": "resort", "group": "seating", "title": "الخيمة الهرمية · شخصان", "price": 300, "description": "طاولة صغيرة، فرشة ومخدات، مع شموع وورود.", "details": [], "capacity": 2, "image": "/assets/jalsat_2.webp", "variantGroup": "outdoor"},
 {"id": "seating-4", "property": "resort", "group": "seating", "title": "جلسة بإطار خشبي · 4 أشخاص", "price": 300, "description": "إطار خشبي وطاولة أرضية، فرشات ومخدات، مع شموع وورود.", "details": [], "variantGroup": "outdoor", "capacity": 4, "image": "/assets/jalsat_4.webp"},
 {"id": "seating-8", "property": "resort", "group": "seating", "title": "جلسة بإطار خشبي · 8 أشخاص", "price": 550, "description": "إطار خشبي وطاولة أرضية، فرشات ومخدات، مع شموع وورود.", "details": [], "variantGroup": "outdoor", "capacity": 8, "image": "/assets/jalsat_5.webp"},
 {"id": "seating-12", "property": "resort", "group": "seating", "title": "جلسة بإطار خشبي · 12 شخصًا", "price": 650, "description": "إطار خشبي وطاولة أرضية، فرشات ومخدات، مع شموع وورود.", "details": [], "variantGroup": "outdoor", "capacity": 12, "image": "/assets/jalsat_6.webp"},
 {"id": "cinema-early", "property": "resort", "group": "fun", "title": "سينما · 7–10 مساء", "price": guide.cinema.price, "description": "3 ساعات · شاشة عرض خارجية، كرسيان مريحان، فشار وموهيتو لشخصين", "details": [], "variantGroup": "cinema", "variantLabel": "7–10 مساء"},
 {"id": "cinema-late", "property": "resort", "group": "fun", "title": "سينما · 11 مساء–2 صباحا", "price": guide.cinema.price, "description": "3 ساعات · شاشة عرض خارجية، كرسيان مريحان، فشار وموهيتو لشخصين", "details": [], "variantGroup": "cinema", "variantLabel": "11 مساء–2 صباحا"},
 {"id": "games-box", "property": "resort", "group": "fun", "title": "بوكس الألعاب", "price": 50, "description": "بوكس الألعاب الجماعية", "details": guide.games.contents, "variantGroup": "games", "variantLabel": "بوكس فقط"},
 {"id": "games-table", "property": "resort", "group": "fun", "title": "طاولة مع بوكس الألعاب", "price": 150, "description": "طاولة + 4 كراسي + بوكس الألعاب", "details": guide.games.contents, "variantGroup": "games", "variantLabel": "طاولة مع البوكس"},
 {"id": "bbq-beef-plain", "property": "resort", "group": "essentials", "variantGroup": "bbq", "title": "بوكس الشواء · لحم · بدون فحم", "price": 85, "description": "مناسب لـ6 أشخاص · خبز وجبن وصوصات", "details": []},
 {"id": "bbq-beef-coal", "property": "resort", "group": "essentials", "variantGroup": "bbq", "title": "بوكس الشواء · لحم · مع الفحم", "price": 120, "description": "مناسب لـ6 أشخاص · خبز وجبن وصوصات", "details": []},
 {"id": "bbq-chicken-plain", "property": "resort", "group": "essentials", "variantGroup": "bbq", "title": "بوكس الشواء · دجاج · بدون فحم", "price": 85, "description": "مناسب لـ6 أشخاص · خبز وجبن وصوصات", "details": []},
 {"id": "bbq-chicken-coal", "property": "resort", "group": "essentials", "variantGroup": "bbq", "title": "بوكس الشواء · دجاج · مع الفحم", "price": 120, "description": "مناسب لـ6 أشخاص · خبز وجبن وصوصات", "details": []},
 {"id": "seating-cake", "property": "resort", "group": "seating", "requiresGroup": "outdoor", "title": "كيك وعصير مع الجلسة", "price": 170, "description": "", "details": []},
 {"id": "dining-6-plain", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "بدون تنسيق", "capacity": 6, "title": "طاولات الطعام · 6 أشخاص · بدون تنسيق", "price": 199, "description": "طاولات وكراسي فقط", "details": []},
 {"id": "dining-6-decorated", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "مع تنسيق", "capacity": 6, "title": "طاولات الطعام · 6 أشخاص · مع تنسيق", "price": 399, "description": "طاولات وكراسي مع تنسيق متكامل", "details": ["طاولات زجاجية أنيقة", "كراسي أكريليك شفافة", "أطقم تقديم متكاملة", "مناديل قماش", "تنسيق زهور", "حاملات شموع مزودة بالشموع"]},
 {"id": "dining-12-plain", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "بدون تنسيق", "capacity": 12, "title": "طاولات الطعام · 12 أشخاص · بدون تنسيق", "price": 399, "description": "طاولات وكراسي فقط", "details": []},
 {"id": "dining-12-decorated", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "مع تنسيق", "capacity": 12, "title": "طاولات الطعام · 12 أشخاص · مع تنسيق", "price": 599, "description": "طاولات وكراسي مع تنسيق متكامل", "details": ["طاولات زجاجية أنيقة", "كراسي أكريليك شفافة", "أطقم تقديم متكاملة", "مناديل قماش", "تنسيق زهور", "حاملات شموع مزودة بالشموع"]},
 {"id": "dining-18-plain", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "بدون تنسيق", "capacity": 18, "title": "طاولات الطعام · 18 أشخاص · بدون تنسيق", "price": 599, "description": "طاولات وكراسي فقط", "details": []},
 {"id": "dining-18-decorated", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "مع تنسيق", "capacity": 18, "title": "طاولات الطعام · 18 أشخاص · مع تنسيق", "price": 799, "description": "طاولات وكراسي مع تنسيق متكامل", "details": ["طاولات زجاجية أنيقة", "كراسي أكريليك شفافة", "أطقم تقديم متكاملة", "مناديل قماش", "تنسيق زهور", "حاملات شموع مزودة بالشموع"]},
 {"id": "dining-24-plain", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "بدون تنسيق", "capacity": 24, "title": "طاولات الطعام · 24 أشخاص · بدون تنسيق", "price": 799, "description": "طاولات وكراسي فقط", "details": []},
 {"id": "dining-24-decorated", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "مع تنسيق", "capacity": 24, "title": "طاولات الطعام · 24 أشخاص · مع تنسيق", "price": 999, "description": "طاولات وكراسي مع تنسيق متكامل", "details": ["طاولات زجاجية أنيقة", "كراسي أكريليك شفافة", "أطقم تقديم متكاملة", "مناديل قماش", "تنسيق زهور", "حاملات شموع مزودة بالشموع"]},
 {"id": "dining-32-plain", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "بدون تنسيق", "capacity": 32, "title": "طاولات الطعام · 32 أشخاص · بدون تنسيق", "price": 999, "description": "طاولات وكراسي فقط", "details": []},
 {"id": "dining-32-decorated", "property": "resort", "group": "dining", "variantGroup": "dining", "variantLabel": "مع تنسيق", "capacity": 32, "title": "طاولات الطعام · 32 أشخاص · مع تنسيق", "price": 1199, "description": "طاولات وكراسي مع تنسيق متكامل", "details": ["طاولات زجاجية أنيقة", "كراسي أكريليك شفافة", "أطقم تقديم متكاملة", "مناديل قماش", "تنسيق زهور", "حاملات شموع مزودة بالشموع"]},
];
export function getAllowedAddons(property: string, accommodation?: string) {
  return BOOKING_ADDONS.filter(addon => addon.property === property && (
    addon.id !== "water-game" || accommodation === undefined || accommodation === "21" || accommodation === "both"
  ));
}
