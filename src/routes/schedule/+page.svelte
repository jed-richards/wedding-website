<script lang="ts">
  // TODO: confirm exact event times once finalized
  type ScheduleEvent = {
    time: string;
    title: string;
    detail: string;
    caterer?: { name: string; url: string };
  };

  const events: ScheduleEvent[] = [
    { time: "4:00 PM", title: "Ceremony", detail: "Mahoney State Park" },
    { time: "5:00 PM", title: "Cocktail Hour", detail: "Mahoney State Park" },
    {
      time: "7:00 PM",
      title: "Reception & Dinner",
      detail: "Mahoney State Park",
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
      <!-- TODO: confirm final schedule with venue -->
      Details below are placeholders and subject to change.
    </p>
  </div>

  <ol class="flex flex-col gap-6">
    {#each events as event (event.title)}
      <li class="flex gap-4 rounded-card border border-neutral bg-neutral p-4 sm:p-6">
        <span class="w-20 shrink-0 font-body text-sm font-medium text-primary sm:w-24">
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
