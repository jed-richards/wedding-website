<script lang="ts">
  const links = [
    { href: "/", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    { href: "/travel", label: "Travel" },
    { href: "/registry", label: "Registry" },
    { href: "/rsvp", label: "RSVP" },
  ];

  let open = $state(false);
  let toggleButton: HTMLButtonElement | undefined = $state();
  let mobileMenu: HTMLUListElement | undefined = $state();

  function closeMenu() {
    open = false;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape" && open) {
      open = false;
      toggleButton?.focus();
    }
  }

  $effect(() => {
    if (open) {
      mobileMenu?.querySelector("a")?.focus();
    }
  });
</script>

<svelte:window onkeydown={handleKeydown} />

<header class="border-b border-neutral bg-background px-6 py-4">
  <nav class="mx-auto flex max-w-4xl items-center justify-between">
    <a href="/" class="font-heading text-lg text-primary">Our Wedding</a>

    <ul class="hidden gap-6 font-body text-sm text-text sm:flex">
      {#each links as link (link.href)}
        <li>
          <a href={link.href} class="hover:text-accent hover:underline">{link.label}</a>
        </li>
      {/each}
    </ul>

    <button
      type="button"
      bind:this={toggleButton}
      class="text-text sm:hidden"
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      onclick={() => (open = !open)}
    >
      {#if open}
        <svg
          viewBox="0 0 24 24"
          class="size-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18 18 6M6 6l12 12"
          />
        </svg>
      {:else}
        <svg
          viewBox="0 0 24 24"
          class="size-6"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      {/if}
    </button>
  </nav>

  {#if open}
    <ul
      id="mobile-menu"
      bind:this={mobileMenu}
      class="mx-auto mt-4 flex max-w-4xl flex-col gap-4 font-body text-sm text-text sm:hidden"
    >
      {#each links as link (link.href)}
        <li>
          <a
            href={link.href}
            class="block hover:text-accent hover:underline"
            onclick={closeMenu}
          >
            {link.label}
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</header>
