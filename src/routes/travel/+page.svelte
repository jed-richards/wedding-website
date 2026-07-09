<script lang="ts">
  // TODO: replace with real accommodation/travel/parking details once finalized
  const sections = [
    {
      title: "Accommodations",
      body: "A room block will be available at a nearby hotel. Details and booking link coming soon.",
    },
    {
      title: "Getting There",
      body: "The nearest airport is TBD. Directions and travel tips will be posted here.",
    },
    {
      title: "Parking",
      body: "On-site parking availability is TBD.",
    },
  ];
</script>

<svelte:head>
  <title>Travel</title>
</svelte:head>

<section class="flex flex-col gap-8 py-8 sm:py-12">
  <div class="text-center">
    <h1 class="font-heading text-3xl text-primary sm:text-4xl">Travel</h1>
    <p class="mt-2 font-body text-text-muted">
      <!-- TODO: confirm accommodation, directions, and parking details -->
      Details below are placeholders and subject to change.
    </p>
  </div>

  <div class="flex flex-col gap-6">
    {#each sections as section (section.title)}
      <div class="rounded-card border border-neutral bg-neutral p-4 sm:p-6">
        <h2 class="font-heading text-lg text-text">{section.title}</h2>
        <p class="mt-1 font-body text-sm text-text-muted">{section.body}</p>
      </div>
    {/each}
  </div>
</section>
