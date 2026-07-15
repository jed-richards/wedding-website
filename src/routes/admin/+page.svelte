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

    <section class="flex flex-col gap-8">
      {#each data.parties as party (party.id)}
        <div class="rounded-md border border-gray-200 p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-lg font-medium">{party.party_name}</h3>
            <div class="flex items-center gap-3 text-sm text-gray-500">
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
