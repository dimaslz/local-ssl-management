export type Config = {
	id: string;
	domain: string;
	ssl?: {
		cert: string;
		key: string;
	},
	port: number;
	nginxConf?: null | string;
}
