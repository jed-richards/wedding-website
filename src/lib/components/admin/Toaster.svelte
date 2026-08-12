<script lang="ts">
  import { dismissToast, toasts } from "$lib/toast.svelte";
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
  aria-live="polite"
>
  {#each toasts as toast (toast.id)}
    <button
      type="button"
      onclick={() => dismissToast(toast.id)}
      class="pointer-events-auto rounded-card px-4 py-2 text-sm shadow-sm {toast.tone ===
      'error'
        ? 'bg-declined/20 text-text'
        : 'bg-attending text-background'}"
    >
      {toast.message}
    </button>
  {/each}
</div>
