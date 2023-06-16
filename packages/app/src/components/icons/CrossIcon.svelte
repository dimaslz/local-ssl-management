<script lang="ts">
  export let size: string | number = 24;
  export let stroke: string | number = 1;
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	viewBox="0 0 24 24"
	style={`width: ${size}px; height: ${size}px; stroke-width=${stroke};`}
	{ ...$$restProps }
  ><path
    stroke-linecap="round"
    stroke-linejoin="round"
    d="M6 18 18 6M6 6l12 12"
  /></svg
>
