<script>
	import './styles.css';

	import { Header } from '@/components';
</script>

<div class="app flex flex-col min-h-screen">
	<Header />

	<main class="flex flex-1 flex-col p-2 w-full max-w-[1200px] mt-12 mx-auto">
		<slot />
	</main>

	<footer class="flex flex-col justify-center items-center p-4 text-slate-200 text-sm">
		<p>dimaslz</p>
	</footer>
</div>
