<script lang="ts">
  import { WEDDING_DATE } from "$lib/wedding";

  let { target = WEDDING_DATE }: { target?: Date } = $props();

  type TimeRemaining = {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };

  function getTimeRemaining(deadline: Date, now: number): TimeRemaining | null {
    const diff = deadline.getTime() - now;
    if (diff <= 0) return null;

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    };
  }

  function pad(n: number) {
    return n.toString().padStart(2, "0");
  }

  let now = $state(Date.now());
  let remaining = $derived(getTimeRemaining(target, now));

  $effect(() => {
    const interval = setInterval(() => {
      now = Date.now();
    }, 1000);

    return () => clearInterval(interval);
  });
</script>

{#if remaining}
  <div class="flex gap-4 sm:gap-8" role="timer" aria-live="polite">
    <div class="flex flex-col items-center">
      <span class="font-heading text-3xl text-primary sm:text-5xl"
        >{remaining.days}</span
      >
      <span class="font-body text-xs text-text-muted uppercase sm:text-sm">Days</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="font-heading text-3xl text-primary sm:text-5xl"
        >{pad(remaining.hours)}</span
      >
      <span class="font-body text-xs text-text-muted uppercase sm:text-sm">Hours</span>
    </div>
    <div class="flex flex-col items-center">
      <span class="font-heading text-3xl text-primary sm:text-5xl"
        >{pad(remaining.minutes)}</span
      >
      <span class="font-body text-xs text-text-muted uppercase sm:text-sm">Minutes</span
      >
    </div>
    <div class="flex flex-col items-center">
      <span class="font-heading text-3xl text-primary sm:text-5xl"
        >{pad(remaining.seconds)}</span
      >
      <span class="font-body text-xs text-text-muted uppercase sm:text-sm">Seconds</span
      >
    </div>
  </div>
{:else}
  <p class="font-heading text-2xl text-primary sm:text-3xl">We're married!</p>
{/if}
