<script lang="ts">
  /** Native <dialog>-backed confirmation for destructive actions. The caller
   * owns whether the dialog is open (`open` prop, two-way bound) and what
   * happens on confirm; this component just handles the modal mechanics
   * (focus trap and Escape come free from <dialog>) and requires typing the
   * party's name back before the confirm button is enabled. */
  let {
    open = $bindable(false),
    partyName,
    onconfirm,
  }: {
    open: boolean;
    partyName: string;
    onconfirm: () => void;
  } = $props();

  let dialogEl: HTMLDialogElement | undefined = $state();
  let typed = $state("");

  $effect(() => {
    if (open) {
      typed = "";
      dialogEl?.showModal();
    } else {
      dialogEl?.close();
    }
  });

  function handleClose() {
    open = false;
  }

  function handleConfirm() {
    dialogEl?.close();
    onconfirm();
  }

  let confirmed = $derived(
    typed.trim().toLowerCase() === partyName.trim().toLowerCase(),
  );
</script>

<dialog
  bind:this={dialogEl}
  onclose={handleClose}
  class="w-full max-w-sm rounded-card border border-neutral bg-background p-6 text-text shadow-sm backdrop:bg-text/40"
>
  <h2 class="font-heading text-xl text-text">Delete {partyName}?</h2>
  <p class="mt-2 font-body text-sm text-text-muted">
    This removes the party and its RSVP for good. Type the party name to confirm.
  </p>
  <input
    type="text"
    bind:value={typed}
    autocomplete="off"
    placeholder={partyName}
    class="mt-4 w-full rounded-card border-neutral font-body text-sm"
  />
  <div class="mt-6 flex justify-end gap-3">
    <button
      type="button"
      onclick={() => dialogEl?.close()}
      class="font-body text-sm text-text-muted hover:text-text hover:underline"
    >
      Cancel
    </button>
    <button
      type="button"
      disabled={!confirmed}
      onclick={handleConfirm}
      class="rounded-card bg-declined px-4 py-2 font-body text-sm text-background hover:bg-declined/80 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Delete party
    </button>
  </div>
</dialog>
