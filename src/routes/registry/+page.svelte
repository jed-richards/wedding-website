<script lang="ts">
  const REGISTRY_URL = "https://www.zola.com/registry/kenadieandjed";

  type Fund = {
    name: string;
    tagline: string;
    blurb: string;
    icon: "house" | "road";
  };

  // The two group gift funds we're most excited about — the rest of the
  // registry lives on Zola, but these get top billing here.
  const funds: Fund[] = [
    {
      name: "Operation: Dry Basement",
      tagline: "Home fund",
      blurb:
        "Our basement took on water we didn't plan for. Chip in and help us keep the new place dry and cozy.",
      icon: "house",
    },
    {
      name: "Roadtrip",
      tagline: "Adventure fund",
      blurb:
        "A tank of gas, a good playlist, and somewhere new. Send us down the road on our first married adventure.",
      icon: "road",
    },
  ];

  // Quick sense of what's on the list — practical over fancy, which is very us.
  const categories = [
    "Kitchen essentials",
    "Home & renovation",
    "Outdoor & garden",
    "Games & backyard fun",
  ];
</script>

<svelte:head>
  <title>Registry</title>
</svelte:head>

<section class="flex flex-col gap-12 py-8 sm:gap-16 sm:py-12">
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

  <!-- Primary call to action: the Zola registry -->
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
      <p class="relative mt-2 max-w-md font-body text-sm text-text-muted">
        One place for everything — cash funds, kitchen gear, and a few odds and ends
        from Amazon and Target.
      </p>

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

      <p class="relative mt-4 font-body text-xs text-text-muted">
        Gifts ship straight to us — no need to bring anything to the wedding.
      </p>
    </div>
  </div>

  <!-- Featured group gift funds -->
  <div>
    <div class="text-center">
      <p class="font-body text-xs tracking-widest text-text-muted uppercase">
        Group gifts
      </p>
      <h2 class="mt-1 font-heading text-2xl text-text">Chip in on a fund</h2>
      <p class="mx-auto mt-2 max-w-md font-body text-sm text-text-muted">
        Prefer to give together? These two are close to our hearts — every little bit
        helps.
      </p>
    </div>

    <div class="mt-6 grid gap-4 sm:grid-cols-2">
      {#each funds as fund (fund.name)}
        <a
          href={REGISTRY_URL}
          target="_blank"
          rel="noopener noreferrer"
          class="group flex flex-col rounded-card border border-accent/50 bg-neutral p-6 shadow-sm transition-shadow hover:shadow-md"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent/50 bg-background text-accent"
            >
              {#if fund.icon === "house"}
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5M9.5 21v-6h5v6"
                  />
                </svg>
              {:else}
                <svg
                  viewBox="0 0 24 24"
                  class="size-5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 16.5V8a2 2 0 0 1 2-2h6l3 4h1a2 2 0 0 1 2 2v4.5M5 16.5h14M5 16.5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Zm11 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z"
                  />
                </svg>
              {/if}
            </div>
            <div>
              <p class="font-body text-xs tracking-widest text-primary uppercase">
                {fund.tagline}
              </p>
              <h3 class="font-heading text-lg text-text group-hover:text-accent">
                {fund.name}
              </h3>
            </div>
          </div>
          <p class="mt-4 font-body text-sm text-text-muted">{fund.blurb}</p>
          <span
            class="mt-4 inline-flex items-center gap-1 font-body text-sm font-medium text-primary group-hover:text-accent group-hover:underline"
          >
            Contribute
            <svg
              viewBox="0 0 24 24"
              class="size-4"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="m9 6 6 6-6 6" />
            </svg>
          </span>
        </a>
      {/each}
    </div>
  </div>

  <!-- What's on the list -->
  <div class="text-center">
    <p class="font-body text-xs tracking-widest text-text-muted uppercase">
      What's on the list
    </p>
    <h2 class="mt-1 font-heading text-2xl text-text">A little bit of everything</h2>
    <ul class="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-2">
      {#each categories as category (category)}
        <li
          class="rounded-full border border-accent/50 bg-neutral px-4 py-1.5 font-body text-sm text-text"
        >
          {category}
        </li>
      {/each}
    </ul>
    <p class="mx-auto mt-6 max-w-md font-body text-sm text-text-muted">
      Most of all, we can't wait to celebrate with you. Thank you for being part of our
      story.
    </p>
  </div>
</section>
