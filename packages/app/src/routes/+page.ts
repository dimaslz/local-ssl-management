// since there's no dynamic data here, we can prerender
// it so that it gets served as a static asset in production
// export const prerender = true;
export const ssr = true;


export async function load({ fetch }) {
	const items = await fetch("/api/config").then((d) => d.json());

	return { items };
}
