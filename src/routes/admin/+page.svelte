<script lang="ts">
  import { enhance } from "$app/forms";
  import { formatPhone } from "$lib/phone";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  function rsvpLabel(attendingCount: number | null) {
    if (attendingCount === null) return "No response";
    if (attendingCount === 0) return "Not attending";
    return `${attendingCount} attending`;
  }
</script>

<svelte:head>
  <title>Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-6 py-12">
  <h1 class="mb-6 text-3xl font-semibold">Admin</h1>

  {#if !data.authed}
    {#if data.notAuthorized}
      <p class="mb-4 text-sm text-red-600">
        That Google account isn't authorized for admin access.
      </p>
    {/if}

    <form method="POST" action="?/login" class="max-w-xs">
      {#if form?.error}
        <p class="mb-2 text-sm text-red-600">{form.error}</p>
      {/if}

      <button
        type="submit"
        class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
      >
        Sign in with Google
      </button>
    </form>
  {:else}
    <div class="mb-8 flex items-center gap-3">
      <p class="text-sm text-gray-500">Signed in as {data.email}</p>
      <form method="POST" action="?/logout" use:enhance>
        <button type="submit" class="text-sm text-gray-500 hover:underline"
          >Sign out</button
        >
      </form>
    </div>

    <section class="mb-10 rounded-md border border-gray-200 p-4">
      <h2 class="mb-3 text-lg font-medium">Summary</h2>
      <ul class="flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-700">
        <li>Total seats: {data.summary.totalSeats}</li>
        <li>Attending: {data.summary.attending}</li>
        <li>Parties responded: {data.summary.responded}</li>
        <li>Parties awaiting response: {data.summary.noResponse}</li>
        <li>Parties with a phone number: {data.summary.withPhone}</li>
      </ul>
    </section>

    <section class="mb-10">
      <h2 class="mb-3 text-lg font-medium">Add a party</h2>
      <form
        method="POST"
        action="?/createParty"
        use:enhance
        class="flex flex-wrap items-end gap-3"
      >
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Party name</span>
          <input
            type="text"
            name="party_name"
            required
            class="rounded-md border-gray-300"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Display name (optional)</span>
          <input type="text" name="display_name" class="rounded-md border-gray-300" />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Max party size</span>
          <input
            type="number"
            name="max_party_size"
            min="1"
            placeholder="1"
            class="w-24 rounded-md border-gray-300"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Plus-ones</span>
          <input
            type="number"
            name="plus_ones"
            min="0"
            placeholder="0"
            class="w-24 rounded-md border-gray-300"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">Phone (optional)</span>
          <input
            type="tel"
            name="phone"
            placeholder="1234567890"
            class="rounded-md border-gray-300"
          />
        </label>
        <button
          type="submit"
          class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
        >
          Add party
        </button>
      </form>
      <p class="mt-2 text-sm text-gray-500">
        Display name is the wording shown on the invite and RSVP page (defaults to the
        party name). Plus-ones are unnamed seats within max party size.
      </p>
      {#if form?.error && !form?.partyId}
        <p class="mt-2 text-sm text-red-600">{form.error}</p>
      {/if}
    </section>

    <section class="mb-10">
      <h2 class="mb-3 text-lg font-medium">Bulk import from JSON</h2>
      <p class="mb-3 max-w-2xl text-sm text-gray-600">
        Upload a JSON file to create many parties at once. It must be an array of
        objects, each with a <code>party_name</code>. Party names must be unique and not
        already in use. Optionally add <code>display_name</code>
        (the wording shown on the invite/RSVP page, defaults to
        <code>party_name</code>), <code>max_party_size</code>
        (total seats, defaults to 1), <code>plus_ones</code>
        (unnamed seats within max party size, defaults to 0), and
        <code>phone</code> (a 10-digit US number, defaults to none).
      </p>
      <form
        method="POST"
        action="?/importJson"
        enctype="multipart/form-data"
        use:enhance
        class="flex flex-wrap items-end gap-3"
      >
        <label class="flex flex-col gap-1">
          <span class="text-sm font-medium">JSON file</span>
          <input
            type="file"
            name="file"
            accept="application/json,.json"
            required
            class="text-sm"
          />
        </label>
        <button
          type="submit"
          class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
        >
          Import
        </button>
      </form>
      {#if form?.imported}
        <p class="mt-2 text-sm text-green-700">
          Imported {form.imported.parties}
          {form.imported.parties === 1 ? "party" : "parties"}.
        </p>
      {/if}
      {#if form?.importErrors}
        <div class="mt-2 text-sm text-red-600">
          <p class="font-medium">Import failed — nothing was saved:</p>
          <ul class="mt-1 list-inside list-disc">
            {#each form.importErrors as error (error)}
              <li>{error}</li>
            {/each}
          </ul>
        </div>
      {/if}
    </section>

    <section class="flex flex-col gap-6">
      {#each data.parties as party (party.id)}
        <div class="rounded-md border border-gray-200 p-4">
          <form
            method="POST"
            action="?/updateParty"
            use:enhance
            class="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="party_id" value={party.id} />
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Party name</span>
              <input
                type="text"
                name="party_name"
                value={party.party_name}
                required
                class="rounded-md border-gray-300"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Display name</span>
              <input
                type="text"
                name="display_name"
                value={party.display_name}
                required
                class="rounded-md border-gray-300"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Max party size</span>
              <input
                type="number"
                name="max_party_size"
                value={party.max_party_size}
                min="1"
                required
                class="w-24 rounded-md border-gray-300"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Plus-ones</span>
              <input
                type="number"
                name="plus_ones"
                value={party.plus_ones}
                min="0"
                required
                class="w-24 rounded-md border-gray-300"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Phone (optional)</span>
              <input
                type="tel"
                name="phone"
                value={formatPhone(party.phone)}
                placeholder="1234567890"
                class="rounded-md border-gray-300"
              />
            </label>
            <button
              type="submit"
              class="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-700"
            >
              Save
            </button>
            <button
              formaction="?/deleteParty"
              class="text-sm text-red-600 hover:underline"
            >
              Delete party
            </button>
            {#if form?.error && form?.partyId === party.id}
              <p class="w-full text-sm text-red-600">{form.error}</p>
            {/if}
          </form>

          <p class="mt-3 text-sm text-gray-700">
            {rsvpLabel(party.attending_count)}
            {#if party.dietary_notes}
              <span class="text-gray-500">— {party.dietary_notes}</span>
            {/if}
            {#if party.phone}
              <span class="text-gray-500">— {formatPhone(party.phone)}</span>
            {/if}
          </p>
        </div>
      {:else}
        <p class="text-sm text-gray-500">No parties yet — add one above.</p>
      {/each}
    </section>
  {/if}
</div>
