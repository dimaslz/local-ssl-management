const manifest = {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","robots.txt"]),
	mimeTypes: {".png":"image/png",".txt":"text/plain"},
	_: {
		client: {"start":"_app/immutable/entry/start.6d40c920.js","app":"_app/immutable/entry/app.8d6ef4a6.js","imports":["_app/immutable/entry/start.6d40c920.js","_app/immutable/chunks/index.9433b6d2.js","_app/immutable/chunks/singletons.904236cf.js","_app/immutable/entry/app.8d6ef4a6.js","_app/immutable/chunks/index.9433b6d2.js"],"stylesheets":[],"fonts":[]},
		nodes: [
			() => import('./chunks/0-6bb8c2bd.js'),
			() => import('./chunks/1-7832a3ef.js'),
			() => import('./chunks/2-cb94b152.js')
		],
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/api/config",
				pattern: /^\/api\/config\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server.ts-9cc60e2f.js')
			},
			{
				id: "/api/config/[domain]",
				pattern: /^\/api\/config\/([^/]+?)\/?$/,
				params: [{"name":"domain","optional":false,"rest":false,"chained":false}],
				page: null,
				endpoint: () => import('./chunks/_server.ts-a556d3d3.js')
			},
			{
				id: "/api/deploy",
				pattern: /^\/api\/deploy\/?$/,
				params: [],
				page: null,
				endpoint: () => import('./chunks/_server.ts-f8c953e5.js')
			}
		],
		matchers: async () => {
			
			return {  };
		}
	}
};

const prerendered = new Set([]);

export { manifest, prerendered };
//# sourceMappingURL=manifest.js.map
