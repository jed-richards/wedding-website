<script lang="ts">
  import Countdown from "$lib/components/Countdown.svelte";
  import { WEDDING_DATE } from "$lib/wedding";

  const formattedDate = WEDDING_DATE.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
</script>

<svelte:head>
  <title>Kenadie & Jed</title>
</svelte:head>

<section class="flex flex-col items-center gap-6 py-12 text-center sm:py-20">
  <p class="font-body text-sm tracking-widest text-text-muted uppercase">
    We're getting married
  </p>

  <h1 class="font-heading text-4xl text-primary sm:text-6xl">Kenadie &amp; Jed</h1>

  <div class="flex flex-col gap-1 font-body text-text">
    <p>{formattedDate}</p>
    <p class="text-text-muted">Mahoney State Park</p>
  </div>

  <Countdown />

  <a
    href="/rsvp"
    class="mt-4 rounded-card bg-primary px-8 py-3 font-body text-background hover:bg-primary-light"
  >
    RSVP
  </a>
</section>
