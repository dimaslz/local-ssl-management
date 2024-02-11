<svelte:head>
	<title>Home</title>
	<meta name="description" content="local-ssl cli" />
</svelte:head>

<script lang="ts">
	import DiagramImg from "$lib/images/diagram.png";

	const copyInstallCommandToClipboard = ($event: Event) => {
		const { textContent } = $event.target as HTMLButtonElement;

		navigator.clipboard.writeText(textContent as string);
	}
</script>

<section class="h-full flex flex-1 flex-col py-24 space-y-12">
	<h1 class="text-6xl w-full text-center">
		<code class="font-mono">$ local-ssl</code>
	</h1>

	<div class="w-full h-full flex justify-center flex-col items-center space-y-12">
		<div class="flex flex-col">
				<button
					class="font-light font-mono p-4 bg-gray-800 rounded-lg text-sm hover:bg-gray-900"  on:click={copyInstallCommandToClipboard}
				>npm install -g @dimaslz/local-ssl-management-cli</button>

				<div class="text-xs text-gray-800 dark:text-white mt-2 text-center">
					<span class="text-red-600 font-bold mr-2">npm</span>
					<a
					href="https://www.npmjs.com/package/@dimaslz/local-ssl-management-cli"
					target="_blank"
					class="underline hover:opacity-75"
					>https://www.npmjs.com/package/@dimaslz/local-ssl-management-cli</a>
				</div>
		</div>

		<div>
			Simple CLI command to manage local SSL certifications by <a href="https://github.com/FiloSottile/mkcert" aria-label="Github of MkCert package" target="_blank" class="underline hover:opacity-75">mkcert</a>. The key of this script is work easily with local HTTPS domains and, to do not use ports in the domain and use all of them through port 443.
		</div>

		<div>
			<img src={DiagramImg} alt="Project diagram" class="rounded-lg" />
		</div>
	</div>
</section>
