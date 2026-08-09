<script lang="ts">
  import { VENUE } from "$lib/wedding";

  type ScheduleEvent = {
    time: string;
    title: string;
    detail: string;
    caterer?: { name: string; url: string };
  };

  const events: ScheduleEvent[] = [
    { time: "4:00 PM", title: "Ceremony", detail: `${VENUE.name} — ${VENUE.park}` },
    {
      // TODO: confirm reception start time with the venue/caterer
      time: "Time TBD",
      title: "Reception & Dinner",
      detail: `${VENUE.name} — ${VENUE.park}`,
      caterer: { name: "the Pancake Man", url: "https://www.pancakeman.net" },
    },
  ];
</script>

<svelte:head>
  <title>Schedule</title>
</svelte:head>

<section class="flex flex-col gap-8 py-8 sm:py-12">
  <div class="text-center">
    <h1 class="font-heading text-3xl text-primary sm:text-4xl">Schedule</h1>
    <p class="mt-2 font-body text-text-muted">
      The ceremony time is set — the rest of the evening is still being finalized.
    </p>
  </div>

  <ol class="flex flex-col gap-6">
    {#each events as event (event.title)}
      <li class="flex gap-4 rounded-card border border-neutral bg-neutral p-4 sm:p-6">
        <span class="w-24 shrink-0 font-body text-sm font-medium text-primary sm:w-28">
          {event.time}
        </span>
        <div class="font-body">
          <h2 class="text-text">{event.title}</h2>
          <p class="text-sm text-text-muted">
            {event.detail}{#if event.caterer}
              — catering by
              <a
                href={event.caterer.url}
                target="_blank"
                rel="noopener noreferrer"
                class="text-primary hover:text-accent hover:underline"
              >
                {event.caterer.name}
              </a>{/if}
          </p>
        </div>
      </li>
    {/each}
  </ol>
</section>
