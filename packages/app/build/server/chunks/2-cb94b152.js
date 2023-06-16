const ssr = true;
async function load({ fetch }) {
  const items = await fetch("/api/config").then((d) => d.json());
  return { items };
}

var _page_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load,
  ssr: ssr
});

const index = 2;
const component = async () => (await import('./_page.svelte-fc004bc6.js')).default;
const universal_id = "src/routes/+page.ts";
const imports = ["_app/immutable/nodes/2.3997194a.js","_app/immutable/chunks/index.9433b6d2.js"];
const stylesheets = ["_app/immutable/assets/2.1d121e74.css"];
const fonts = [];

export { component, fonts, imports, index, stylesheets, _page_ts as universal, universal_id };
//# sourceMappingURL=2-cb94b152.js.map
