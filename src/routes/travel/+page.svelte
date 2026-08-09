<script lang="ts">
  import { PARK_ENTRY, VENUE } from "$lib/wedding";

  type Hotel = {
    name: string;
    url: string;
    note: string;
    distance: string;
    drive?: string;
    amenities?: string[];
  };

  const hotels: Hotel[] = [
    {
      name: "Peter Kiewit Lodge",
      url: "https://outdoornebraska.gov/parks/lodging/lodges/",
      note: "Rooms inside the park — walking distance to the ceremony. Park lodging books up, and a stay here includes park access, so reserve early.",
      distance: "On site",
    },
    {
      name: "Red Lion Inn & Suites Gretna",
      url: "https://www.sonesta.com/red-lion-inn-suites/ne/gretna/red-lion-inn-suites-gretna",
      note: "",
      distance: "6.5 miles",
      drive: "12 min",
      amenities: ["Free breakfast", "Free wifi"],
    },
    {
      name: "Holiday Inn Express & Suites Omaha I-80",
      url: "https://www.ihg.com/holidayinnexpress/hotels/us/en/gretna/omagr/hoteldetail",
      note: "",
      distance: "11.9 miles",
      drive: "16 min",
      amenities: ["Free breakfast", "Pool", "Free wifi"],
    },
    {
      name: "Hampton Inn & Suites Omaha Southwest–La Vista",
      url: "https://www.hilton.com/en/hotels/omalvhx-hampton-suites-omaha-southwest-la-vista/",
      note: "",
      distance: "15.9 miles",
      drive: "20–25 min",
      amenities: ["Free breakfast", "Pool", "Free wifi"],
    },
    {
      name: "Hampton Inn & Suites Omaha West–Lakeside",
      url: "https://www.hilton.com/en/hotels/omawthx-hampton-omaha-west-lakeside/",
      note: "",
      distance: "16.6 miles",
      drive: "30–35 min",
      amenities: ["Free breakfast", "Pool", "Free wifi"],
    },
  ];
</script>

<svelte:head>
  <title>Travel</title>
</svelte:head>

<section class="flex flex-col gap-8 py-8 sm:py-12">
  <div class="text-center">
    <h1 class="font-heading text-3xl text-primary sm:text-4xl">Travel</h1>
    <p class="mt-2 font-body text-text-muted">
      Everything you need to get to Mahoney State Park, park, and stay nearby.
    </p>
  </div>

  <div class="rounded-card border border-neutral bg-neutral p-4 sm:p-6">
    <h2 class="font-heading text-lg text-text">Getting There & Parking</h2>
    <p class="mt-1 font-body text-sm text-text-muted">
      The wedding is at
      <a
        href={VENUE.url}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:text-accent hover:underline"
      >
        {VENUE.name}
      </a>
      inside {VENUE.park}, at
      <a
        href={VENUE.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:text-accent hover:underline"
      >
        {VENUE.address}
      </a>. Parking is on site at the lodge.
    </p>
  </div>

  <div class="rounded-card border-2 border-accent bg-background p-4 sm:p-6">
    <h2 class="font-heading text-lg text-text">The park entrance fee is on us</h2>
    <p class="mt-1 font-body text-sm text-text-muted">
      Mahoney is a Nebraska state park, so it charges a vehicle entry permit —
      {PARK_ENTRY.inState} for Nebraska plates, {PARK_ENTRY.outOfState} for out-of-state.
      Just tell the attendant at the gate you're here for the
      <span class="font-medium text-text">{PARK_ENTRY.weddingName}</span>
      and we'll take care of it. You don't need to buy a permit in advance.
    </p>
    <p class="mt-2 font-body text-sm text-text-muted">
      Leave a phone number on your
      <a href="/rsvp" class="text-primary hover:text-accent hover:underline">RSVP</a>
      and we'll text you exact gate and parking details the day before.
    </p>
  </div>

  <div>
    <h2 class="font-heading text-lg text-text">Accommodations</h2>
    <p class="mt-1 mb-4 font-body text-sm text-text-muted">
      There's no reserved room block — these are nearby options we'd recommend, ordered
      by distance from the park.
    </p>
    <ul class="flex flex-col gap-4">
      {#each hotels as hotel (hotel.name)}
        <li class="rounded-card border border-neutral bg-neutral p-4 sm:p-6">
          <a
            href={hotel.url}
            target="_blank"
            rel="noopener noreferrer"
            class="font-body font-medium text-primary hover:text-accent hover:underline"
          >
            {hotel.name}
          </a>
          <p class="mt-1 font-body text-sm text-text-muted">
            {hotel.distance}{#if hotel.drive}
              &middot; {hotel.drive} drive{/if}
          </p>
          {#if hotel.note}
            <p class="mt-1 font-body text-sm text-text-muted">{hotel.note}</p>
          {/if}
          {#if hotel.amenities}
            <ul class="mt-2 flex flex-wrap gap-2">
              {#each hotel.amenities as amenity (amenity)}
                <li
                  class="rounded-card bg-background px-3 py-1 font-body text-xs text-text-muted"
                >
                  {amenity}
                </li>
              {/each}
            </ul>
          {/if}
        </li>
      {/each}
    </ul>
  </div>
</section>
