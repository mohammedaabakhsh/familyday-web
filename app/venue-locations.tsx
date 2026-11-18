"use client";

import { useState } from "react";
import { ChevronLeft, Copy, MapPin, Navigation, Share2 } from "lucide-react";
import { PROPERTIES, type Property } from "./property-catalog";

export function VenueMapLink({ place }: { place: Property }) {
  if (!place.mapUrl) return null;
  return <a className="venue-map-link" href={place.mapUrl} target="_blank" rel="noopener noreferrer">
    <MapPin size={16} /><span>موقع {place.shortName} · {place.branch}</span><ChevronLeft size={15} />
  </a>;
}

function LocationCard({ place }: { place: Property }) {
  const [feedback, setFeedback] = useState<"copied" | "link" | null>(null);
  async function share() {
    setFeedback(null);
    try {
      if (navigator.share) {
        await navigator.share({ title: place.name, text: place.name + " · " + place.location, url: place.mapUrl });
        return;
      }
      await navigator.clipboard.writeText(place.mapUrl);
      setFeedback("copied");
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setFeedback("link");
    }
  }
  return <article className="venue-location">
    <div className="location-title"><MapPin size={23} /><div><h2>{place.name}</h2><p>{place.location}</p></div></div>
    <div className="location-actions">
      <a href={place.mapUrl} target="_blank" rel="noopener noreferrer"><Navigation size={17} />فتح الخريطة</a>
      <button type="button" onClick={share}><Share2 size={17} />مشاركة الموقع</button>
    </div>
    {feedback === "copied" && <p role="status" className="location-feedback"><Copy size={15} />تم نسخ رابط الموقع</p>}
    {feedback === "link" && <label className="location-feedback">رابط الموقع<input dir="ltr" readOnly value={place.mapUrl} onFocus={event => event.currentTarget.select()} /></label>}
  </article>;
}

export default function VenueLocations() {
  return <section className="venue-locations" aria-label="مواقع يوم العائلة">
    {PROPERTIES.filter(place => !place.disabled && place.mapUrl).map(place => <LocationCard key={place.id} place={place} />)}
  </section>;
}
