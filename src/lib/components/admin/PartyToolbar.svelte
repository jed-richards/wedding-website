<script lang="ts">
  import type { PartyStatus, SortKey } from "$lib/admin";

  let {
    query = $bindable(""),
    status = $bindable<PartyStatus | "all">("all"),
    sort = $bindable<SortKey>("name"),
    shown,
    total,
  }: {
    query: string;
    status: PartyStatus | "all";
    sort: SortKey;
    shown: number;
    total: number;
  } = $props();

  const statusOptions: { value: PartyStatus | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "awaiting", label: "Awaiting" },
    { value: "attending", label: "Attending" },
    { value: "declined", label: "Declined" },
  ];

  let searchInput: HTMLInputElement | undefined = $state();

  function handleKeydown(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    const typing = target.tagName === "INPUT" || target.tagName === "TEXTAREA";
    if (event.key === "/" && !typing) {
      event.preventDefault();
      searchInput?.focus();
    } else if (event.key === "Escape" && target === searchInput) {
      query = "";
      searchInput?.blur();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div
  class="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-neutral bg-background py-3"
>
  <label
    class="flex flex-1 items-center gap-2 rounded-card border border-neutral px-3 py-2"
  >
    <svg
      viewBox="0 0 24 24"
      class="size-4 text-text-muted"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path stroke-linecap="round" d="m20 20-3.5-3.5" />
    </svg>
    <span class="sr-only">Search parties</span>
    <input
      type="text"
      bind:this={searchInput}
      bind:value={query}
      placeholder="Search by name or phone… (press /)"
      class="w-full border-0 bg-transparent p-0 font-body text-sm focus:ring-0"
    />
  </label>

  <div
    role="group"
    aria-label="Filter by status"
    class="flex overflow-hidden rounded-card border border-neutral font-body text-sm"
  >
    {#each statusOptions as option (option.value)}
      <button
        type="button"
        aria-pressed={status === option.value}
        onclick={() => (status = option.value)}
        class="px-3 py-2 {status === option.value
          ? 'bg-primary text-background'
          : 'text-text hover:bg-neutral'}"
      >
        {option.label}
      </button>
    {/each}
  </div>

  <label class="flex items-center gap-2 font-body text-sm text-text-muted">
    Sort
    <select bind:value={sort} class="rounded-card border-neutral text-sm">
      <option value="name">Name</option>
      <option value="size">Party size</option>
      <option value="recent">Recently updated</option>
      <option value="status">Status</option>
    </select>
  </label>

  <p class="font-body text-sm text-text-muted tabular-nums">
    Showing {shown} of {total}
  </p>
</div>
