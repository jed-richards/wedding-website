<svelte:head>
  <title>Registry</title>
</svelte:head>

<section class="flex flex-col gap-8 py-8 sm:py-12">
  <div class="text-center">
    <h1 class="font-heading text-3xl text-primary sm:text-4xl">Registry</h1>
    <p class="mt-2 font-body text-text-muted">
      Your presence is the best present, but if you'd like to give a gift, our registry
      is on its way.
    </p>
  </div>

  <div class="flex justify-center px-2 sm:px-0">
    <div
      class="relative flex w-full max-w-md flex-col items-center rounded-card border border-accent/50 bg-neutral p-8 text-center shadow-sm"
    >
      <div
        class="flex size-12 items-center justify-center rounded-full border border-accent/50 bg-background"
      >
        <svg
          viewBox="0 0 24 24"
          class="size-6 text-accent"
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
      <p class="mt-4 font-body text-xs tracking-widest text-primary uppercase">
        Under wraps
      </p>
      <h2 class="mt-1 font-heading text-xl text-text sm:text-2xl">Coming soon</h2>
      <p class="mt-2 font-body text-sm text-text-muted">
        We're still picking things out.
        <br />
        Check back in a couple of days!
      </p>
    </div>
  </div>
</section>
