<script lang="ts">
  const links = [
    { href: "/", label: "Home" },
    { href: "/schedule", label: "Schedule" },
    { href: "/travel", label: "Travel" },
    { href: "/registry", label: "Registry" },
    { href: "/rsvp", label: "RSVP" },
  ];
</script>

<header class="border-b border-gray-200 px-6 py-4">
  <nav class="mx-auto flex max-w-4xl items-center justify-between">
    <a href="/" class="font-semibold">Our Wedding</a>
    <ul class="flex gap-6 text-sm">
      {#each links as link (link.href)}
        <li><a href={link.href} class="hover:underline">{link.label}</a></li>
      {/each}
    </ul>
  </nav>
</header>
