<script lang="ts">
  import { enhance } from "$app/forms";
  import { partyStatus, relativeTime, type PartyRow } from "$lib/admin";
  import { formatPhone } from "$lib/phone";
  import { pushToast } from "$lib/toast.svelte";
  import ConfirmDialog from "./ConfirmDialog.svelte";

  let {
    party,
    error,
  }: {
    party: PartyRow;
    error?: { field: string; message: string };
  } = $props();

  let status = $derived(partyStatus(party));
  let editing = $state(false);
  let confirmingDelete = $state(false);
  let deleteForm: HTMLFormElement | undefined = $state();

  // Keep the edit form open (and its error visible) after a failed save.
  $effect(() => {
    if (error) editing = true;
  });

  const railColor = {
    attending: "bg-attending",
    declined: "bg-declined",
    awaiting: "bg-awaiting",
  };

  let statusLabel = $derived({
    attending: `${party.attending_count} attending`,
    declined: "Not attending",
    awaiting: "Awaiting response",
  });
</script>

<div class="flex gap-3 border-b border-neutral py-3">
  <span class="w-[3px] shrink-0 rounded-full {railColor[status]}" aria-hidden="true"
  ></span>

  <div class="min-w-0 flex-1">
    {#if !editing}
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p class="font-body text-sm font-medium text-text">{party.display_name}</p>
        <p class="font-body text-sm text-text-muted tabular-nums">
          {statusLabel[status]} ({party.max_party_size} reserved)
        </p>
        {#if party.phone}
          <p class="font-body text-sm text-text-muted">{formatPhone(party.phone)}</p>
        {/if}
        <p class="font-body text-xs text-text-muted">
          {status === "awaiting" ? "invited" : "responded"}
          {relativeTime(party.updated_at)}
        </p>
      </div>
      {#if party.dietary_notes}
        <p class="mt-1 font-body text-sm text-text-muted">{party.dietary_notes}</p>
      {/if}

      <div class="mt-2 flex gap-4">
        <button
          type="button"
          onclick={() => (editing = true)}
          class="font-body text-sm text-primary hover:text-accent hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onclick={() => (confirmingDelete = true)}
          class="font-body text-sm text-declined hover:underline"
        >
          Delete
        </button>
      </div>
    {:else}
      <form
        method="POST"
        action="?/updateParty"
        use:enhance={() => {
          return async ({ result, update }) => {
            await update();
            if (result.type === "success") {
              editing = false;
              pushToast("Changes saved.");
            } else if (result.type === "failure") {
              pushToast("Couldn't save changes.", "error");
            }
          };
        }}
        class="flex flex-wrap items-end gap-3"
      >
        <input type="hidden" name="party_id" value={party.id} />
        <label class="flex flex-col gap-1">
          <span class="font-body text-xs text-text-muted">Party name</span>
          <input
            type="text"
            name="party_name"
            value={party.party_name}
            required
            class="rounded-card border-neutral text-sm"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-body text-xs text-text-muted">Display name</span>
          <input
            type="text"
            name="display_name"
            value={party.display_name}
            required
            class="rounded-card border-neutral text-sm"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-body text-xs text-text-muted">Max party size</span>
          <input
            type="number"
            name="max_party_size"
            value={party.max_party_size}
            min="1"
            required
            class="w-20 rounded-card border-neutral text-sm"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-body text-xs text-text-muted">Plus-ones</span>
          <input
            type="number"
            name="plus_ones"
            value={party.plus_ones}
            min="0"
            required
            class="w-20 rounded-card border-neutral text-sm"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="font-body text-xs text-text-muted">Phone</span>
          <input
            type="tel"
            name="phone"
            value={formatPhone(party.phone)}
            placeholder="1234567890"
            class="rounded-card border-neutral text-sm"
          />
        </label>
        <button
          type="submit"
          class="rounded-card bg-primary px-3 py-2 font-body text-sm text-background hover:bg-primary-light"
        >
          Save changes
        </button>
        <button
          type="button"
          onclick={() => (editing = false)}
          class="font-body text-sm text-text-muted hover:underline"
        >
          Cancel
        </button>
        {#if error}
          <p class="w-full font-body text-sm text-declined">{error.message}</p>
        {/if}
      </form>
    {/if}
  </div>
</div>

<form
  method="POST"
  action="?/deleteParty"
  bind:this={deleteForm}
  use:enhance={() => {
    return async ({ result, update }) => {
      await update();
      if (result.type === "success") {
        pushToast(`${party.display_name} deleted.`);
      } else if (result.type === "failure") {
        pushToast("Couldn't delete party.", "error");
      }
    };
  }}
  class="hidden"
>
  <input type="hidden" name="party_id" value={party.id} />
</form>

<ConfirmDialog
  bind:open={confirmingDelete}
  partyName={party.display_name}
  onconfirm={() => deleteForm?.requestSubmit()}
/>
