<script lang="ts">
  import { enhance } from "$app/forms";
  import { formatPhone } from "$lib/phone";
  import { PARK_ENTRY } from "$lib/wedding";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  let saved = $derived(form?.saved === true);

  // --- Name gate combobox -------------------------------------------------

  let query = $state("");
  let suggestions = $state<string[]>([]);
  let open = $state(false);
  let activeIndex = $state(-1);
  let picked = $state(false);
  let continueButton: HTMLButtonElement | undefined = $state();

  // Server-reported picks when a query matched more than one party (also
  // shown to no-JS visitors via `form.suggestions`).
  let serverSuggestions = $derived(form?.suggestions ?? []);

  let requestSeq = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  async function fetchSuggestions(q: string) {
    const seq = ++requestSeq;
    try {
      const res = await fetch(`/rsvp/search?q=${encodeURIComponent(q)}`);
      if (!res.ok || seq !== requestSeq) return;
      const body = (await res.json()) as { results: { display_name: string }[] };
      if (seq !== requestSeq) return;
      suggestions = body.results.map((r) => r.display_name);
      activeIndex = -1;
    } catch {
      // Network hiccup — leave whatever suggestions are already showing.
    }
  }

  function onInput() {
    open = true;
    picked = false;
    clearTimeout(debounceTimer);
    const q = query;
    if (q.trim().length < 2) {
      suggestions = [];
      return;
    }
    debounceTimer = setTimeout(() => fetchSuggestions(q), 200);
  }

  // Picking a suggestion only fills the field and marks it confirmed — it
  // does not submit. The guest still has to press Continue, so a mistaken
  // click (e.g. a similarly-named party) doesn't silently RSVP the wrong
  // household.
  function selectName(name: string) {
    query = name;
    suggestions = [];
    open = false;
    activeIndex = -1;
    picked = true;
    continueButton?.focus();
  }

  function onKeydown(event: KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % suggestions.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + suggestions.length) % suggestions.length;
    } else if (event.key === "Enter") {
      if (activeIndex >= 0) {
        event.preventDefault();
        selectName(suggestions[activeIndex]);
      }
    } else if (event.key === "Escape") {
      open = false;
      activeIndex = -1;
    }
  }

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
      Start typing your name and pick yourself from the list. The name from your
      invitation works too.
    </p>

    <form method="POST" action="?/verify" use:enhance class="flex flex-col gap-4">
      <div class="relative flex flex-col gap-1">
        <label class="text-sm font-medium" for="party-name">Your name</label>
        <input
          id="party-name"
          type="text"
          name="party_name"
          autocomplete="off"
          required
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls="party-suggestions"
          aria-activedescendant={activeIndex >= 0
            ? `party-suggestion-${activeIndex}`
            : undefined}
          class="rounded-md border-gray-300 {picked
            ? 'border-green-600 focus:border-green-600 focus:ring-green-600'
            : ''}"
          bind:value={query}
          oninput={onInput}
          onkeydown={onKeydown}
          onfocus={() => (open = true)}
          onblur={() => setTimeout(() => (open = false), 150)}
        />
        {#if picked}
          <p class="text-sm text-green-700">
            ✓ Selected — press Continue below to confirm it's you.
          </p>
        {/if}
        {#if open && suggestions.length > 0}
          <ul
            id="party-suggestions"
            role="listbox"
            class="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
          >
            {#each suggestions as name, i (name)}
              <!-- Combobox pattern: the input above owns all keyboard
                   interaction via aria-activedescendant (see onKeydown);
                   options are mouse/touch targets only, not independently
                   focusable. -->
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <li
                id={`party-suggestion-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                class="cursor-pointer px-3 py-2 text-sm {i === activeIndex
                  ? 'bg-gray-100'
                  : ''}"
                onmousedown={(e) => e.preventDefault()}
                onclick={() => selectName(name)}
              >
                {name}
              </li>
            {/each}
          </ul>
        {/if}
      </div>

      {#if form?.error}
        <p class="text-sm text-red-600">{form.error}</p>
      {/if}

      {#if serverSuggestions.length > 0}
        <ul class="flex flex-col gap-2">
          {#each serverSuggestions as name (name)}
            <li>
              <button
                type="button"
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-left text-sm hover:bg-gray-50"
                onclick={() => selectName(name)}
              >
                {name}
              </button>
            </li>
          {/each}
        </ul>
      {/if}

      <button
        type="submit"
        bind:this={continueButton}
        class="rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-700"
      >
        Continue
      </button>
    </form>

    <p class="mt-6 text-sm text-gray-500">
      Still can't find yourself? Reach out to Kenadie or Jed and we'll get you sorted.
    </p>
  {:else}
    <p class="mb-6 text-gray-600">
      {seatWording(data.session.party)}
    </p>

    {#if saved}
      <p class="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
        Thanks! Your RSVP has been saved.
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
          placeholder="1234567890"
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
