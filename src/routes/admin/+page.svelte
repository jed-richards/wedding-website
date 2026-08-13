<script lang="ts">
  import { enhance } from "$app/forms";
  import {
    filterParties,
    sortParties,
    type PartyStatus,
    type SortKey,
  } from "$lib/admin";
  import PartyRow from "$lib/components/admin/PartyRow.svelte";
  import PartyToolbar from "$lib/components/admin/PartyToolbar.svelte";
  import SeatLedger from "$lib/components/admin/SeatLedger.svelte";
  import Toaster from "$lib/components/admin/Toaster.svelte";
  import { pushToast } from "$lib/toast.svelte";
  import type { PageProps } from "./$types";

  let { data, form }: PageProps = $props();

  let query = $state("");
  let status = $state<PartyStatus | "all">("all");
  let sort = $state<SortKey>("name");

  let visibleParties = $derived(
    data.authed
      ? sortParties(filterParties(data.parties, { query, status }), sort)
      : [],
  );

  /** The update-form error for a given party row, if the last form submission
   * was an update that targeted it. `partyId` is only ever set by updateParty
   * (see admin/+page.server.ts), so this stays undefined for every other
   * action's result. */
  function rowError(partyId: string): { field: string; message: string } | undefined {
    const message: string | undefined = form?.error;
    if (!message || form?.partyId !== partyId) return undefined;
    return { field: "", message };
  }
</script>

<svelte:head>
  <title>Admin</title>
</svelte:head>

{#if data.authed}
  <Toaster />
{/if}

<div>
  <h1 class="font-heading text-3xl text-primary sm:text-4xl">Admin</h1>

  {#if !data.authed}
    {#if data.notAuthorized}
      <p class="mt-4 font-body text-sm text-declined">
        That Google account isn't authorized for admin access.
      </p>
    {/if}

    <form method="POST" action="?/login" class="mt-6 max-w-xs">
      {#if form?.error}
        <p class="mb-2 font-body text-sm text-declined">{form.error}</p>
      {/if}

      <button
        type="submit"
        class="rounded-card bg-primary px-4 py-2 font-body text-background hover:bg-primary-light"
      >
        Sign in with Google
      </button>
    </form>
  {:else}
    <div class="mt-2 mb-8 flex items-center gap-3">
      <p class="font-body text-sm text-text-muted">Signed in as {data.email}</p>
      <form method="POST" action="?/logout" use:enhance>
        <button type="submit" class="font-body text-sm text-text-muted hover:underline">
          Sign out
        </button>
      </form>
    </div>

    <SeatLedger summary={data.summary} />

    <details class="mt-8 mb-6 rounded-card border border-neutral">
      <summary
        class="cursor-pointer px-4 py-3 font-body text-sm font-medium text-text select-none"
      >
        Add parties
      </summary>
      <div class="flex flex-col gap-8 border-t border-neutral p-4">
        <section>
          <h2 class="mb-3 font-heading text-lg text-text">Add a party</h2>
          <form
            method="POST"
            action="?/createParty"
            use:enhance={() => {
              return async ({ result, update }) => {
                await update();
                if (result.type === "success") pushToast("Party added.");
                else if (result.type === "failure")
                  pushToast("Couldn't add party.", "error");
              };
            }}
            class="flex flex-wrap items-end gap-3"
          >
            <label class="flex flex-col gap-1">
              <span class="font-body text-sm font-medium text-text">Party name</span>
              <input
                type="text"
                name="party_name"
                required
                class="rounded-card border-neutral text-sm"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-body text-sm font-medium text-text"
                >Display name (optional)</span
              >
              <input
                type="text"
                name="display_name"
                class="rounded-card border-neutral text-sm"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-body text-sm font-medium text-text">Max party size</span
              >
              <input
                type="number"
                name="max_party_size"
                min="1"
                placeholder="1"
                class="w-24 rounded-card border-neutral text-sm"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-body text-sm font-medium text-text">Plus-ones</span>
              <input
                type="number"
                name="plus_ones"
                min="0"
                placeholder="0"
                class="w-24 rounded-card border-neutral text-sm"
              />
            </label>
            <label class="flex flex-col gap-1">
              <span class="font-body text-sm font-medium text-text"
                >Phone (optional)</span
              >
              <input
                type="tel"
                name="phone"
                placeholder="1234567890"
                class="rounded-card border-neutral text-sm"
              />
            </label>
            <button
              type="submit"
              class="rounded-card bg-primary px-4 py-2 font-body text-sm text-background hover:bg-primary-light"
            >
              Add party
            </button>
          </form>
          <p class="mt-2 font-body text-sm text-text-muted">
            Display name is the wording shown on the invite and RSVP page (defaults to
            the party name). Plus-ones are unnamed seats within max party size.
          </p>
          {#if form?.error && !form?.partyId}
            <p class="mt-2 font-body text-sm text-declined">{form.error}</p>
          {/if}
        </section>

        <section>
          <h2 class="mb-3 font-heading text-lg text-text">Bulk import from JSON</h2>
          <p class="mb-3 max-w-2xl font-body text-sm text-text-muted">
            Upload a JSON file to create many parties at once. It must be an array of
            objects, each with a <code>party_name</code>. Party names must be unique and
            not already in use. Optionally add <code>display_name</code>
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
            use:enhance={() => {
              return async ({ result, update }) => {
                await update();
                if (result.type === "success") pushToast("Import complete.");
                else if (result.type === "failure")
                  pushToast("Import failed.", "error");
              };
            }}
            class="flex flex-wrap items-end gap-3"
          >
            <label class="flex flex-col gap-1">
              <span class="font-body text-sm font-medium text-text">JSON file</span>
              <input
                type="file"
                name="file"
                accept="application/json,.json"
                required
                class="font-body text-sm"
              />
            </label>
            <button
              type="submit"
              class="rounded-card bg-primary px-4 py-2 font-body text-sm text-background hover:bg-primary-light"
            >
              Import
            </button>
          </form>
          {#if form?.imported}
            <p class="mt-2 font-body text-sm text-attending">
              Imported {form.imported.parties}
              {form.imported.parties === 1 ? "party" : "parties"}.
            </p>
          {/if}
          {#if form?.importErrors}
            <div class="mt-2 font-body text-sm text-declined">
              <p class="font-medium">Import failed — nothing was saved:</p>
              <ul class="mt-1 list-inside list-disc">
                {#each form.importErrors as error (error)}
                  <li>{error}</li>
                {/each}
              </ul>
            </div>
          {/if}
        </section>
      </div>
    </details>

    <PartyToolbar
      bind:query
      bind:status
      bind:sort
      shown={visibleParties.length}
      total={data.parties.length}
    />

    <section class="flex flex-col">
      {#each visibleParties as party (party.id)}
        <PartyRow {party} error={rowError(party.id)} />
      {:else}
        <p class="py-6 font-body text-sm text-text-muted">
          {data.parties.length === 0
            ? "No parties yet — add one above."
            : "No parties match your search."}
        </p>
      {/each}
    </section>
  {/if}
</div>
