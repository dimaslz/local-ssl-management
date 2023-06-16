type Config = {
	domain: string;
	ssl: {
		cert: string;
		key: string;
	},
	port: number;
	nginxConf: null | string;
}

export default Config;
