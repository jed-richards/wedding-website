<script lang="ts">
  import type { Summary } from "$lib/admin";

  let { summary }: { summary: Summary } = $props();

  // One tick per seat reads well up to a few hundred seats; past that it just
  // becomes visual noise, so collapse into a single proportional bar instead.
  const TICK_LIMIT = 300;

  let ticks = $derived(
    summary.totalSeats <= TICK_LIMIT
      ? [
          ...Array(summary.seatsAttending).fill("attending"),
          ...Array(summary.seatsUnclaimed).fill("unclaimed"),
          ...Array(summary.seatsDeclined).fill("declined"),
          ...Array(summary.seatsAwaiting).fill("awaiting"),
        ]
      : [],
  );

  // Unclaimed seats render hollow (sage outline, no fill) — reserved by an
  // attending party but not claimed by anyone, distinct from a filled
  // declined tick.
  const tickClass: Record<string, string> = {
    attending: "bg-attending",
    unclaimed: "border border-attending bg-transparent",
    declined: "bg-declined",
    awaiting: "bg-awaiting",
  };

  function pct(n: number) {
    return summary.totalSeats === 0 ? 0 : (n / summary.totalSeats) * 100;
  }
</script>

<section class="border-b border-neutral pb-8">
  <p class="font-heading text-4xl text-primary sm:text-5xl">
    <span class="tabular-nums">{summary.seatsAttending}</span>
    <span class="text-2xl text-text-muted sm:text-3xl">
      of {summary.totalSeats} seats confirmed
    </span>
  </p>

  {#if ticks.length > 0}
    <div class="mt-4 flex flex-wrap gap-[3px]" role="img" aria-label="Seat ledger">
      {#each ticks as status, i (i)}
        <span class="h-3 w-2 rounded-[1px] {tickClass[status]}"></span>
      {/each}
    </div>
  {:else}
    <div
      class="mt-4 flex h-3 w-full overflow-hidden rounded-[1px]"
      role="img"
      aria-label="Seat ledger"
    >
      <span class="h-full bg-attending" style="width: {pct(summary.seatsAttending)}%"
      ></span>
      <span
        class="h-full border border-attending bg-transparent"
        style="width: {pct(summary.seatsUnclaimed)}%"
      ></span>
      <span class="h-full bg-declined" style="width: {pct(summary.seatsDeclined)}%"
      ></span>
      <span class="h-full bg-awaiting" style="width: {pct(summary.seatsAwaiting)}%"
      ></span>
    </div>
  {/if}

  <ul class="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-body text-sm text-text-muted">
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-full bg-attending"></span>
      {summary.seatsAttending} attending ({summary.partiesAttending}
      {summary.partiesAttending === 1 ? "party" : "parties"})
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-full border border-attending"></span>
      {summary.seatsUnclaimed} unclaimed ({summary.partiesUnclaimed}
      {summary.partiesUnclaimed === 1 ? "party" : "parties"})
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-full bg-declined"></span>
      {summary.seatsDeclined} declined ({summary.partiesDeclined}
      {summary.partiesDeclined === 1 ? "party" : "parties"})
    </li>
    <li class="flex items-center gap-1.5">
      <span class="size-2 rounded-full bg-awaiting"></span>
      {summary.seatsAwaiting} awaiting ({summary.partiesAwaiting}
      {summary.partiesAwaiting === 1 ? "party" : "parties"})
    </li>
    <li>{Math.round(summary.responseRate * 100)}% of parties responded</li>
    <li>{summary.withPhone} with a phone number</li>
  </ul>
</section>
