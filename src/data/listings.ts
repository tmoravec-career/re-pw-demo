import { readFileSync } from "fs";
import path from "path";

export type ListingStatus = "active" | "pending" | "sold";
export type HomeType = "house" | "condo" | "townhouse";
export type SortKey = "desk" | "price-asc" | "price-desc" | "beds-desc";

export type Listing = {
  id: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number;
  type: HomeType;
  status: ListingStatus;
};

export type ListingsFilter = {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minBeds?: number;
  minBaths?: number;
  status?: ListingStatus;
  types?: HomeType[];
};

const listingsPath = path.resolve(process.cwd(), "mock-site/data/listings.json");

function isListing(value: unknown): value is Listing {
  if (!value || typeof value !== "object") return false;
  const listing = value as Partial<Listing>;
  return (
    typeof listing.id === "string" &&
    typeof listing.address === "string" &&
    typeof listing.city === "string" &&
    typeof listing.lat === "number" &&
    typeof listing.lng === "number" &&
    typeof listing.price === "number" &&
    typeof listing.beds === "number" &&
    typeof listing.baths === "number" &&
    typeof listing.sqft === "number" &&
    typeof listing.yearBuilt === "number" &&
    (listing.type === "house" || listing.type === "condo" || listing.type === "townhouse") &&
    (listing.status === "active" || listing.status === "pending" || listing.status === "sold")
  );
}

export function loadListings(): Listing[] {
  const parsed: unknown = JSON.parse(readFileSync(listingsPath, "utf8"));
  if (!Array.isArray(parsed) || !parsed.every(isListing)) {
    throw new Error("mock-site/data/listings.json must be an array of listings");
  }
  return parsed;
}

// Same rules as matches() and sortListings() in mock-site/js/app.js.
// Search matches address or city. Prices, beds, and baths are inclusive.
// Status and home type apply only when set. Filters combine with AND.
export function listingMatches(listing: Listing, filter: ListingsFilter = {}): boolean {
  const query = filter.city?.trim().toLowerCase();
  if (query && !`${listing.address} ${listing.city}`.toLowerCase().includes(query)) return false;
  if (filter.minPrice != null && listing.price < filter.minPrice) return false;
  if (filter.maxPrice != null && listing.price > filter.maxPrice) return false;
  if (filter.minBeds != null && listing.beds < filter.minBeds) return false;
  if (filter.minBaths != null && listing.baths < filter.minBaths) return false;
  if (filter.status && listing.status !== filter.status) return false;
  if (filter.types && filter.types.length > 0 && !filter.types.includes(listing.type)) return false;
  return true;
}

export function sortedIds(listings: Listing[], filter: ListingsFilter = {}, sort: SortKey = "desk"): string[] {
  const visible = listings.filter((listing) => listingMatches(listing, filter));
  const ranked = [...visible];
  if (sort === "price-asc") ranked.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  else if (sort === "price-desc") ranked.sort((a, b) => b.price - a.price || a.id.localeCompare(b.id));
  else if (sort === "beds-desc") ranked.sort((a, b) => b.beds - a.beds || a.price - b.price || a.id.localeCompare(b.id));
  return ranked.map((listing) => listing.id);
}

export function expectedIds(listings: Listing[], filter: ListingsFilter = {}): string[] {
  return sortedIds(listings, filter, "desk");
}
