<script lang="ts">
  import "./layout.css";
  import favicon from "$lib/assets/favicon.svg";
  import Nav from "$lib/components/Nav.svelte";
  import Footer from "$lib/components/Footer.svelte";

  let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
<Nav />
<main class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
  {@render children()}
</main>
<Footer />
