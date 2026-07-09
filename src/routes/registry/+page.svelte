<script lang="ts">
  // TODO: replace with real registry links once finalized
  const registries = [
    { name: "Registry 1", href: "#" },
    { name: "Registry 2", href: "#" },
  ];
</script>

<svelte:head>
  <title>Registry</title>
</svelte:head>

<section class="flex flex-col gap-8 py-8 sm:py-12">
  <div class="text-center">
    <h1 class="font-heading text-3xl text-primary sm:text-4xl">Registry</h1>
    <p class="mt-2 font-body text-text-muted">
      Your presence is the best present, but if you'd like to give a gift, here are a
      few places we're registered.
      <!-- TODO: confirm final registry links -->
    </p>
  </div>

  <div class="grid gap-6 sm:grid-cols-2">
    {#each registries as registry (registry.name)}
      <a
        href={registry.href}
        class="rounded-card border border-neutral bg-neutral p-6 text-center font-body text-text hover:text-accent"
      >
        {registry.name}
      </a>
    {/each}
  </div>
</section>
