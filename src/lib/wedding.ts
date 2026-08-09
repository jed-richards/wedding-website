// Wedding date and ceremony start time are confirmed: October 24, 2026 at 4:00 PM.
export const WEDDING_DATE = new Date("2026-10-24T16:00:00");

// Venue details, shared by the Schedule, Travel, and RSVP pages so the name/
// address/links only need to be updated in one place.
export const VENUE = {
  name: "Crete Carrier Riverview Lodge",
  park: "Eugene T. Mahoney State Park",
  address: "28500 W Park Hwy, Ashland, NE 68003",
  url: "https://outdoornebraska.gov/parks/lodging/rent-a-facility/crete-carrier-riverview-lodge/",
  mapsUrl: "https://maps.google.com/?q=28500+W+Park+Hwy,+Ashland,+NE+68003",
} as const;

// Mahoney is a state park with a per-vehicle entry permit; we're covering it
// at the gate, guests just need to say who they're there for.
export const PARK_ENTRY = {
  inState: "$7",
  outOfState: "$14",
  weddingName: "Doty/Richards wedding",
} as const;
