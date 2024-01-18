export type Config = {
	id: string;
	domain: string;
	ssl?: {
		cert: string;
		key: string;
	},
	services: {
		id: string;
		port: string;
		location: string;
	}[],
	nginxConf?: null | string;
}
