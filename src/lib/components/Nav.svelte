<script lang="ts">
  const links = [
    { href: "/", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    { href: "/travel", label: "Travel" },
    { href: "/registry", label: "Registry" },
    { href: "/rsvp", label: "RSVP" },
  ];
</script>

<header class="border-b border-neutral bg-background px-6 py-4">
  <nav class="mx-auto flex max-w-4xl items-center justify-between">
    <a href="/" class="font-heading text-lg text-primary">Our Wedding</a>
    <ul class="flex gap-6 font-body text-sm text-text">
      {#each links as link (link.href)}
        <li>
          <a href={link.href} class="hover:text-accent hover:underline">{link.label}</a>
        </li>
      {/each}
    </ul>
  </nav>
</header>
