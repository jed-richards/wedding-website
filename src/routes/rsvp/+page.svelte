<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  let saved = $derived(form?.saved === true);
</script>

<svelte:head>
  <title>RSVP</title>
</svelte:head>

<div class="mx-auto max-w-xl px-6 py-12">
  <h1 class="mb-2 text-3xl font-semibold">RSVP</h1>

  {#if !data.session}
    <p class="mb-6 text-gray-600">Enter the passcode from your invitation to RSVP.</p>

    <form method="POST" action="?/verify" use:enhance class="flex flex-col gap-4">
      <label class="flex flex-col gap-1">
        <span class="text-sm font-medium">Passcode</span>
        <input
          type="text"
          name="passcode"
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
      RSVPing for the <strong>{data.session.party.party_name}</strong> party.
    </p>

    {#if saved}
      <p class="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
        Thanks! Your RSVP has been saved. You can come back and update it any time
        before the deadline.
      </p>
    {/if}

    <form method="POST" action="?/submit" use:enhance class="flex flex-col gap-8">
      {#each data.session.guests as guest (guest.id)}
        <fieldset class="flex flex-col gap-3 border-t border-gray-200 pt-6">
          <legend class="text-lg font-medium"
            >{guest.first_name} {guest.last_name}</legend
          >

          <div class="flex gap-6">
            <label class="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`attending_${guest.id}`}
                value="yes"
                checked={guest.is_attending === true}
                required
              />
              Attending
            </label>
            <label class="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={`attending_${guest.id}`}
                value="no"
                checked={guest.is_attending === false}
                required
              />
              Can't make it
            </label>
          </div>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Meal choice</span>
            <select name={`meal_${guest.id}`} class="rounded-md border-gray-300">
              <option value="" disabled selected={!guest.meal_choice}
                >Select a meal</option
              >
              {#each data.mealOptions as meal (meal.value)}
                <option value={meal.value} selected={guest.meal_choice === meal.value}>
                  {meal.label}
                </option>
              {/each}
            </select>
          </label>

          <label class="flex flex-col gap-1">
            <span class="text-sm font-medium">Dietary notes (optional)</span>
            <textarea
              name={`notes_${guest.id}`}
              rows="2"
              class="rounded-md border-gray-300"
              value={guest.dietary_notes ?? ""}></textarea>
          </label>
        </fieldset>
      {/each}

      <button
        type="submit"
        class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
      >
        Save RSVP
      </button>
    </form>
  {/if}
</div>
