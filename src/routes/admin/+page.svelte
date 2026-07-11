<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  function attendanceLabel(isAttending: boolean | null) {
    if (isAttending === true) return "Attending";
    if (isAttending === false) return "Not attending";
    return "No response";
  }
</script>

<svelte:head>
  <title>Admin</title>
</svelte:head>

<div class="mx-auto max-w-4xl px-6 py-12">
  <h1 class="mb-6 text-3xl font-semibold">Admin</h1>

  {#if !data.authed}
    <form
      method="POST"
      action="?/login"
      use:enhance
      class="flex max-w-xs flex-col gap-4"
    >
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Password</span>
        <input
          type="password"
          name="password"
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
        Sign in
      </button>
    </form>
  {:else}
    <form method="POST" action="?/logout" use:enhance class="mb-8">
      <button type="submit" class="text-sm text-gray-500 hover:underline"
        >Sign out</button
      >
    </form>

    <section class="mb-10 rounded-md border border-gray-200 p-4">
      <h2 class="mb-3 text-lg font-medium">Summary</h2>
      <ul class="flex flex-wrap gap-x-8 gap-y-1 text-sm text-gray-700">
        <li>Total guests: {data.summary.totalGuests}</li>
        <li>Attending: {data.summary.attending}</li>
        <li>Not attending: {data.summary.notAttending}</li>
        <li>No response: {data.summary.noResponse}</li>
      </ul>
      {#if Object.keys(data.summary.mealCounts).length > 0}
        <p class="mt-2 text-sm text-gray-700">
          Meals:
          {#each Object.entries(data.summary.mealCounts) as [meal, count] (meal)}
            <span class="mr-3">{meal}: {count}</span>
          {/each}
        </p>
      {/if}
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
          <span class="text-sm font-medium">Passcode</span>
          <input
            type="text"
            name="passcode"
            required
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
      {#if form?.error}
        <p class="mt-2 text-sm text-red-600">{form.error}</p>
      {/if}
    </section>

    <section class="mb-10">
      <h2 class="mb-3 text-lg font-medium">Import guests from CSV</h2>
      <p class="mb-3 text-sm text-gray-500">
        Columns: <code>party_name</code>, <code>passcode</code>,
        <code>first_name</code>, <code>last_name</code>. One row per guest — rows that
        share a party name and passcode become one party.
      </p>
      <form
        method="POST"
        action="?/importCsv"
        enctype="multipart/form-data"
        use:enhance
        class="flex flex-wrap items-end gap-3"
      >
        <input
          type="file"
          name="csv_file"
          accept=".csv,text/csv"
          required
          class="text-sm"
        />
        <button
          type="submit"
          class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
        >
          Import
        </button>
      </form>
      {#if form?.csvImported}
        <p class="mt-2 text-sm text-green-700">
          Imported {form.partiesCreated} part{form.partiesCreated === 1 ? "y" : "ies"}
          and {form.guestsCreated} guest{form.guestsCreated === 1 ? "" : "s"}.
        </p>
      {:else if form?.csvError}
        <div class="mt-2 text-sm text-red-600">
          {#each form.csvError.split("\n") as line (line)}
            <p>{line}</p>
          {/each}
        </div>
      {/if}
    </section>

    <section class="flex flex-col gap-8">
      {#each data.parties as party (party.id)}
        <div class="rounded-md border border-gray-200 p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-lg font-medium">{party.party_name}</h3>
            <div class="flex items-center gap-3 text-sm text-gray-500">
              <span>Passcode: {party.passcode}</span>
              <form method="POST" action="?/deleteParty" use:enhance>
                <input type="hidden" name="party_id" value={party.id} />
                <button type="submit" class="text-red-600 hover:underline"
                  >Delete party</button
                >
              </form>
            </div>
          </div>

          <ul class="mb-4 flex flex-col gap-2">
            {#each party.guests as guest (guest.id)}
              <li class="flex items-center justify-between text-sm">
                <span>
                  {guest.first_name}
                  {guest.last_name} —
                  {attendanceLabel(guest.is_attending)}
                  {#if guest.meal_choice}
                    ({guest.meal_choice})
                  {/if}
                  {#if guest.dietary_notes}
                    <span class="text-gray-500">— {guest.dietary_notes}</span>
                  {/if}
                </span>
                <form method="POST" action="?/deleteGuest" use:enhance>
                  <input type="hidden" name="guest_id" value={guest.id} />
                  <button type="submit" class="text-red-600 hover:underline"
                    >Remove</button
                  >
                </form>
              </li>
            {:else}
              <li class="text-sm text-gray-500">No guests yet.</li>
            {/each}
          </ul>

          <form
            method="POST"
            action="?/createGuest"
            use:enhance
            class="flex flex-wrap items-end gap-3"
          >
            <input type="hidden" name="party_id" value={party.id} />
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">First name</span>
              <input
                type="text"
                name="first_name"
                required
                class="rounded-md border-gray-300"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="text-sm font-medium">Last name</span>
              <input
                type="text"
                name="last_name"
                required
                class="rounded-md border-gray-300"
              />
            </label>
            <button
              type="submit"
              class="rounded-md bg-gray-900 px-4 py-2 text-sm text-white hover:bg-gray-700"
            >
              Add guest
            </button>
          </form>
        </div>
      {:else}
        <p class="text-sm text-gray-500">No parties yet — add one above.</p>
      {/each}
    </section>
  {/if}
</div>
