<script lang="ts">
  import { enhance } from "$app/forms";
  import { formatPhone } from "$lib/phone";
  import { PARK_ENTRY } from "$lib/wedding";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  let saved = $derived(form?.saved === true);

  function attendingCountOptions(maxPartySize: number) {
    return Array.from({ length: maxPartySize + 1 }, (_, count) => count);
  }

  function seatWording(party: {
    display_name: string;
    max_party_size: number;
    plus_ones: number;
  }) {
    const seatWord = party.max_party_size === 1 ? "seat" : "seats";
    const plusOneClause =
      party.plus_ones > 0
        ? `, plus ${party.plus_ones} guest${party.plus_ones === 1 ? "" : "s"}`
        : "";
    return `${party.display_name}${plusOneClause} — ${party.max_party_size} ${seatWord} reserved`;
  }
</script>

<svelte:head>
  <title>RSVP</title>
</svelte:head>

<div class="mx-auto max-w-xl px-6 py-12">
  <h1 class="mb-2 text-3xl font-semibold">RSVP</h1>

  {#if !data.session}
    <p class="mb-6 text-gray-600">
      Enter your party name as shown on your invitation to RSVP.
    </p>

    <form method="POST" action="?/verify" use:enhance class="flex flex-col gap-4">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Party name</span>
        <input
          type="text"
          name="party_name"
          autocomplete="off"
          required
          class="rounded-md border-gray-300"
        />
      </label>

      {#if form?.error}
        <p class="text-sm text-red-600">{form.error}</p>
      {/if}

      <button
        type="submit"
        class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
      >
        Continue
      </button>
    </form>
  {:else}
    <p class="mb-6 text-gray-600">
      {seatWording(data.session.party)}
    </p>

    {#if saved}
      <p class="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
        Thanks! Your RSVP has been saved. You can come back and update it any time
        before the deadline.
      </p>
    {/if}

    <form method="POST" action="?/submit" use:enhance class="flex flex-col gap-6">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">How many will attend?</span>
        <select name="attending_count" required class="rounded-md border-gray-300">
          <option
            value=""
            disabled
            selected={data.session.party.attending_count === null}
            >Select an option</option
          >
          {#each attendingCountOptions(data.session.party.max_party_size) as count (count)}
            <option
              value={count}
              selected={data.session.party.attending_count === count}
            >
              {count}
            </option>
          {/each}
        </select>
      </label>

      {#if form?.error}
        <p class="text-sm text-red-600">{form.error}</p>
      {/if}

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Phone number (optional)</span>
        <input
          type="tel"
          name="phone"
          inputmode="tel"
          autocomplete="tel"
          placeholder="(402) 555-1234"
          class="rounded-md border-gray-300"
          value={formatPhone(data.session.party.phone)}
        />
      </label>
      <p class="-mt-4 text-sm text-gray-500">
        We'll only use this to text you day-of details, like exactly where to enter and
        park — no spam. The park entry fee is covered; just mention the
        {PARK_ENTRY.weddingName} at the gate. See the
        <a href="/travel" class="text-gray-700 underline">Travel page</a> for details.
      </p>

      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Dietary notes (optional)</span>
        <textarea
          name="dietary_notes"
          rows="2"
          class="rounded-md border-gray-300"
          value={data.session.party.dietary_notes ?? ""}></textarea>
      </label>

      <button
        type="submit"
        class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
      >
        Save RSVP
      </button>
    </form>
  {/if}
</div>
