<script lang="ts">
  const REGISTRY_URL = "https://www.zola.com/registry/kenadieandjed";
</script>

<svelte:head>
  <title>Registry</title>
</svelte:head>

<section class="flex flex-col gap-10 py-8 sm:gap-12 sm:py-12">
  <div class="text-center">
    <p class="font-body text-xs tracking-widest text-text-muted uppercase">
      Kenadie &amp; Jed
    </p>
    <h1 class="mt-1 font-heading text-3xl text-primary sm:text-4xl">Registry</h1>
    <p class="mx-auto mt-3 max-w-lg font-body text-text-muted">
      Your presence is truly the best present. If you'd like to give a little something
      more, we've put together a registry of things we'll actually use.
    </p>
  </div>

  <div class="flex justify-center px-2 sm:px-0">
    <div
      class="relative flex w-full max-w-xl flex-col items-center overflow-hidden rounded-card border border-accent/50 bg-neutral p-8 text-center shadow-sm sm:p-10"
    >
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -top-16 -right-16 size-40 rounded-full bg-accent/10"
      ></div>
      <div
        aria-hidden="true"
        class="pointer-events-none absolute -bottom-20 -left-16 size-44 rounded-full bg-primary/10"
      ></div>

      <div
        class="relative flex size-14 items-center justify-center rounded-full border border-accent/50 bg-background"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-7 text-accent"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M20 12v9H4v-9M2 7h20v5H2V7Zm10 0V5a2.5 2.5 0 0 0-5 0v.09m5-.09a2.5 2.5 0 0 1 5 0V7m-5 0v14"
          />
        </svg>
      </div>

      <p class="relative mt-4 font-body text-xs tracking-widest text-primary uppercase">
        Registered on Zola
      </p>
      <h2 class="relative mt-1 font-heading text-2xl text-text sm:text-3xl">
        Our wedding registry
      </h2>

      <a
        href={REGISTRY_URL}
        target="_blank"
        rel="noopener noreferrer"
        class="relative mt-6 inline-flex items-center gap-2 rounded-card bg-primary px-8 py-3 font-body text-background transition-colors hover:bg-primary-light"
      >
        View our registry
        <svg
          viewBox="0 0 24 24"
          class="size-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7 17 17 7M7 7h10v10"
          />
        </svg>
      </a>
    </div>
  </div>
</section>
