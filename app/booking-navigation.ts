export type ResortStep = "cabin" | "dates" | "addons" | "review";
export type Screen = ResortStep | "home" | "availability" | "favorites" | "offers" | "bookings" | "account" | "services" | "locations";
export type DateReturn = "cabin" | "review";
export type DateField = "arrival" | "departure";
export type Route = { screen: Screen; id?: string; resume?: DateReturn; field?: DateField };

const names: ReadonlySet<string> = new Set<Screen>([
  "home", "availability", "cabin", "dates", "addons", "review", "favorites", "offers", "bookings", "account", "services", "locations",
]);

export function readRoute(hash: string, field?: unknown): Route {
  const [name, id, resume] = hash.replace(/^#/, "").split("/");
  const screen = names.has(name) ? name as Screen : "home";
  if (screen !== "dates") return { screen, id };
  return { screen, id, resume: resume === "review" || resume === "cabin" ? resume : undefined, field: field === "arrival" || field === "departure" ? field : undefined };
}

export function routeHash(screen: Screen, id?: string, resume?: DateReturn) {
  return "#" + [screen, id, screen === "dates" ? resume : undefined].filter(Boolean).join("/");
}

export function isBookingStep(screen: Screen): screen is ResortStep {
  return screen === "cabin" || screen === "dates" || screen === "addons" || screen === "review";
}
