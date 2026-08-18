<script lang="ts">
  import { PARK_ENTRY, VENUE } from "$lib/wedding";

  type Hotel = {
    name: string;
    url: string;
    note?: string;
    distance: string;
    drive?: string;
    amenities?: string;
  };

  function distanceLabel(hotel: Hotel) {
    return hotel.drive ? `${hotel.distance} · ${hotel.drive}` : hotel.distance;
  }

  const hotels: Hotel[] = [
    {
      name: "Peter Kiewit Lodge",
      url: "https://outdoornebraska.gov/parks/lodging/lodges/",
      note: "Inside the park, walking distance to the ceremony. Rooms include park access, and they book up — reserve early.",
      distance: "On site",
    },
    {
      name: "Red Lion Inn & Suites Gretna",
      url: "https://www.sonesta.com/red-lion-inn-suites/ne/gretna/red-lion-inn-suites-gretna",
      distance: "6.5 mi",
      drive: "12 min",
      amenities: "Free breakfast · Free wifi",
    },
    {
      name: "Holiday Inn Express & Suites Omaha I-80",
      url: "https://www.ihg.com/holidayinnexpress/hotels/us/en/gretna/omagr/hoteldetail",
      distance: "11.9 mi",
      drive: "16 min",
      amenities: "Free breakfast · Pool · Free wifi",
    },
    {
      name: "Hampton Inn & Suites Omaha Southwest–La Vista",
      url: "https://www.hilton.com/en/hotels/omalvhx-hampton-suites-omaha-southwest-la-vista/",
      distance: "15.9 mi",
      drive: "20–25 min",
      amenities: "Free breakfast · Pool · Free wifi",
    },
    {
      name: "Hampton Inn & Suites Omaha West–Lakeside",
      url: "https://www.hilton.com/en/hotels/omawthx-hampton-omaha-west-lakeside/",
      distance: "16.6 mi",
      drive: "30–35 min",
      amenities: "Free breakfast · Pool · Free wifi",
    },
  ];
</script>

<svelte:head>
  <title>Travel</title>
</svelte:head>

<section class="flex flex-col gap-10 py-8 sm:gap-14 sm:py-12">
  <div class="text-center">
    <h1 class="font-heading text-3xl text-primary sm:text-4xl">Travel</h1>
    <p class="mt-2 font-body text-text-muted">
      Getting to Mahoney State Park, parking, and staying nearby.
    </p>
  </div>

  <div>
    <p class="font-body text-xs tracking-widest text-text-muted uppercase">
      Getting there
    </p>
    <h2 class="mt-1 font-heading text-2xl text-text">
      <a
        href={VENUE.url}
        target="_blank"
        rel="noopener noreferrer"
        class="hover:text-accent hover:underline"
      >
        {VENUE.name}
      </a>
    </h2>
    <p class="mt-2 max-w-lg font-body text-text-muted">
      Inside {VENUE.park} at {VENUE.address}. Parking is on site at the lodge.
      <a
        href={VENUE.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary hover:text-accent hover:underline"
      >
        Get directions
      </a>
    </p>
  </div>

  <div class="flex flex-col items-center gap-4 px-2 sm:px-0">
    <div
      class="relative flex w-full max-w-md rounded-card border border-accent/50 bg-neutral shadow-sm sm:-rotate-1"
    >
      <div
        class="relative flex w-14 shrink-0 items-center justify-center border-r border-dashed border-accent/50 sm:w-20"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-5 text-accent sm:size-6"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"
          />
          <circle cx="12" cy="9" r="2.5" stroke-linecap="round" />
        </svg>
        <span
          class="absolute -top-2 left-1/2 size-4 -translate-x-1/2 rounded-full border border-accent/50 bg-background"
        ></span>
        <span
          class="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rounded-full border border-accent/50 bg-background"
        ></span>
      </div>
      <div class="min-w-0 flex-1 p-4 sm:p-6">
        <p class="font-body text-xs tracking-widest text-primary uppercase">
          Park entry &middot; complimentary
        </p>
        <h2 class="mt-1 font-heading text-lg text-text sm:text-xl">
          You're covered at the gate
        </h2>
        <p class="mt-2 font-body text-sm text-text-muted">
          Mahoney charges a vehicle entry permit, but it's on us. Just tell the
          attendant you're here for the
          <span class="font-medium text-text">{PARK_ENTRY.weddingName}</span>.
        </p>
        <p class="mt-3 font-body text-xs text-text-muted">
          {PARK_ENTRY.inState} Nebraska plates &middot; {PARK_ENTRY.outOfState} out of state.
        </p>
        <p class="mt-1 font-body text-xs text-text-muted">
          On the wedding day we'll cover the permits.
        </p>
      </div>
    </div>

    <p class="max-w-md text-center font-body text-sm text-text-muted">
      Adding a phone number to your
      <a href="/rsvp" class="text-primary hover:text-accent hover:underline">RSVP</a>
      is optional. If you do, we'll text the exact gate and parking details the day of
      the wedding.
    </p>
  </div>

  <div>
    <p class="font-body text-xs tracking-widest text-text-muted uppercase">
      Where to stay
    </p>
    <h2 class="mt-1 font-heading text-2xl text-text">Nearby hotels</h2>
    <p class="mt-2 font-body text-sm text-text-muted">
      There's no reserved room block — these are our picks, closest first.
    </p>

    <ul class="mt-4 divide-y divide-neutral">
      {#each hotels as hotel (hotel.name)}
        <li class="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
          <div class="min-w-0 sm:flex-1">
            <a
              href={hotel.url}
              target="_blank"
              rel="noopener noreferrer"
              class="font-body font-medium text-primary hover:text-accent hover:underline"
            >
              {hotel.name}
            </a>
            <p class="mt-0.5 font-body text-sm text-text-muted">
              {hotel.note ?? hotel.amenities}
            </p>
          </div>
          <p class="shrink-0 font-body text-sm text-text-muted sm:text-right">
            {distanceLabel(hotel)}
          </p>
        </li>
      {/each}
    </ul>
  </div>
</section>
