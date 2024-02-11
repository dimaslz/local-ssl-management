<script>
	import './styles.css';

	import { Header } from '@/components';
</script>

<div class="flex flex-col dark min-h-screen background text-white">
	<Header />

	<main class="flex-1 flex flex-col p-1 w-full max-w-[64rem] my-0 mx-auto h-full">
		<slot />
	</main>

	<footer class="flex flex-col justify-center items-center p-4 text-sm">
		<p>from Barcelona with ☕️ by <a href="http://x.com/dimaslz" target="_blank" rel="noopener noreferrer" class="text-gray-300 underline hover:no-underline hover:text-gray-400">dimaslz</a></p>
	</footer>
</div>
