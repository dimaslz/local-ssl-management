import fs from "fs";
import shell from "shelljs";
import { mkcert } from "@dimaslz/local-ssl-management-core";

import generateProxyImage from "./generate-proxy-image";
import listContainer from "./list-container";
import { SpyInstance } from "vitest";

vi.mock("fs");
vi.mock("shelljs");
vi.mock("@dimaslz/local-ssl-management-core", () => ({
	mkcert: vi.fn(),
	getLocalIP: vi.fn(() => "192.168.0.0"),
}));
vi.mock("./list-container");
vi.mock("path", () => ({
	default: {
		resolve: () => "/root/path"
	}
}));

vi.mock("chalk", async () => ({
	default: {
		green: vi.fn((v) => v),
		red: vi.fn((v) => v)
	}
}));

describe("Generate proxy image", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("single service", () => {
		test("does not exists localhost certs", () => {
			fs.existsSync = vi.fn(() => false);

			generateProxyImage([]);

			expect(fs.existsSync).toBeCalledTimes(2);
			expect(mkcert).toBeCalled();
			expect(fs.writeFileSync).toBeCalledTimes(2);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				1,
				"/root/path/.local-ssl-management/nginx.conf",
				`user  nginx;
worker_processes  20;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
		server {
				listen              443 ssl;
				server_name         _;
				ssl_certificate     /etc/nginx/localhost-cert.pem;
				ssl_certificate_key /etc/nginx/localhost-key.pem;
				location / {
						root  /var/www/html;
				}
		}

		server {
				listen 80 default_server;
				server_name         _;

				include       /etc/nginx/mime.types;
				default_type  application/octet-stream;

				location / {
						root  /var/www/html;
				}
		}

\t\t
}`
			);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				2,
				"/root/path/.local-ssl-management/Dockerfile",
				`FROM nginx

# RUN rm -f /etc/nginx/conf.d/default.conf

# WORKDIR /var/www/html
# COPY index.html /var/www/html
# RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/



COPY ssl/localhost-key.pem /etc/nginx/
COPY ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]`
			);

			expect(shell.exec).toBeCalledTimes(1);
			expect(shell.exec).toHaveBeenNthCalledWith(
				1,
				`NAME=local-ssl-management && \
		docker rm -f $NAME && \
		docker rmi -f $NAME && \
		docker build --no-cache -t $NAME /root/path/.local-ssl-management && \
		docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
				{ silent: true }
			);
			expect(listContainer).toBeCalled();

			expect(shell.echo).toBeCalledTimes(2);
			expect(shell.echo).nthCalledWith(
				1,
				"\nSSL proxy running\n"
			);
			expect(shell.echo).nthCalledWith(
				2,
				"\ndomain app running\n"
			);
		});

		test("create domain config succesful (localhost certs does not exists)", () => {
			vi.spyOn(fs, "existsSync").mockImplementation((v) => {
				if (/localhost-cert.pem$/.test(String(v))) {
					return false;
				}

				if (/demo.com-.*.pem$/.test(String(v))) {
					return true;
				}

				return false;
			});

			(vi.spyOn(shell, "exec") as SpyInstance).mockImplementation((v) => v);

			generateProxyImage([
				{
					"id": "485b5a34-f0c3-4472-8308-6bcc0a485527",
					"domain": "demo.com",
					"port": "4000",
					"location": "/"
				}
			]);

			expect(fs.existsSync).toBeCalledTimes(4);

			expect(mkcert).toBeCalledTimes(1);
			expect(mkcert).nthCalledWith(
				1,
				"localhost",
				"/root/path/.local-ssl-management/ssl",
			);

			expect(fs.writeFileSync).toBeCalledTimes(2);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				1,
				"/root/path/.local-ssl-management/nginx.conf",
				`user  nginx;
worker_processes  20;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
		server {
				listen              443 ssl;
				server_name         _;
				ssl_certificate     /etc/nginx/localhost-cert.pem;
				ssl_certificate_key /etc/nginx/localhost-key.pem;
				location / {
						root  /var/www/html;
				}
		}

		server {
				listen 80 default_server;
				server_name         _;

				include       /etc/nginx/mime.types;
				default_type  application/octet-stream;

				location / {
						root  /var/www/html;
				}
		}

		server {
			listen	443 ssl;

			autoindex off;

			access_log  /var/log/nginx/demo.com.access.log;
			error_log   /var/log/nginx/demo.com.error.log;

			server_tokens off;
			server_name demo.com;

			ssl_certificate     /etc/nginx/demo.com-cert.pem;
			ssl_certificate_key /etc/nginx/demo.com-key.pem;

			gzip_static on;

			location / {
				gzip on;
				gzip_disable \"msie6\";
				gzip_vary on;
				gzip_proxied any;
				gzip_comp_level 6;
				gzip_buffers 16 8k;
				gzip_http_version 1.1;
				gzip_min_length 256;
				gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
				proxy_pass http://192.168.0.0:4000;
				proxy_redirect off;
				proxy_http_version 1.1;
				proxy_cache_bypass $http_upgrade;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header 'Access-Control-Allow-Origin' '*';
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
				expires off;
		}
	}
}`
			);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				2,
				"/root/path/.local-ssl-management/Dockerfile",
				`FROM nginx

# RUN rm -f /etc/nginx/conf.d/default.conf

# WORKDIR /var/www/html
# COPY index.html /var/www/html
# RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/

COPY ssl/demo.com-key.pem /etc/nginx/
COPY ssl/demo.com-cert.pem /etc/nginx/

COPY ssl/localhost-key.pem /etc/nginx/
COPY ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]`
			);

			expect(shell.exec).toBeCalledTimes(2);
			expect(shell.exec).toHaveBeenNthCalledWith(
				1,
				`NAME=local-ssl-management && \
		docker rm -f $NAME && \
		docker rmi -f $NAME && \
		docker build --no-cache -t $NAME /root/path/.local-ssl-management && \
		docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
				{ silent: true }
			);
			expect(listContainer).toBeCalled();

			expect(shell.echo).toBeCalledTimes(2);
			expect(shell.echo).nthCalledWith(
				1,
				"\nSSL proxy running\n"
			);

			expect(shell.exec).nthCalledWith(
				2,
				"curl -s -o /dev/null -w \"%{http_code}\" https://demo.com",
				{ silent: true }
			);

			expect(shell.echo).nthCalledWith(
				2,
				`
domain           app running
https://demo.com ❌${'          '}
`
			);
		});

		test("create domain config succesful (domain certs does not exists)", () => {
			vi.spyOn(shell, "exec").mockImplementation(() => {
				return { status: 200 }
			})
			vi.spyOn(fs, "existsSync").mockImplementation((v) => {
				if (/localhost-cert.pem$/.test(String(v))) {
					return false;
				}

				if (/demo.com-.*.pem$/.test(String(v))) {
					return false;
				}

				return false;
			});

			generateProxyImage([
				{
					"id": "485b5a34-f0c3-4472-8308-6bcc0a485527",
					"domain": "demo.com",
					"port": "4000",
					"location": "/"
				}
			]);

			expect(fs.existsSync).toBeCalledTimes(4);

			expect(mkcert).toBeCalledTimes(2);
			expect(mkcert).nthCalledWith(
				1,
				"localhost",
				"/root/path/.local-ssl-management/ssl",
			);
			expect(mkcert).nthCalledWith(
				2,
				"demo.com",
				"/root/path/.local-ssl-management/ssl",
			);

			expect(fs.writeFileSync).toBeCalledTimes(2);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				1,
				"/root/path/.local-ssl-management/nginx.conf",
				`user  nginx;
worker_processes  20;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
		server {
				listen              443 ssl;
				server_name         _;
				ssl_certificate     /etc/nginx/localhost-cert.pem;
				ssl_certificate_key /etc/nginx/localhost-key.pem;
				location / {
						root  /var/www/html;
				}
		}

		server {
				listen 80 default_server;
				server_name         _;

				include       /etc/nginx/mime.types;
				default_type  application/octet-stream;

				location / {
						root  /var/www/html;
				}
		}

		server {
			listen	443 ssl;

			autoindex off;

			access_log  /var/log/nginx/demo.com.access.log;
			error_log   /var/log/nginx/demo.com.error.log;

			server_tokens off;
			server_name demo.com;

			ssl_certificate     /etc/nginx/demo.com-cert.pem;
			ssl_certificate_key /etc/nginx/demo.com-key.pem;

			gzip_static on;

			location / {
				gzip on;
				gzip_disable \"msie6\";
				gzip_vary on;
				gzip_proxied any;
				gzip_comp_level 6;
				gzip_buffers 16 8k;
				gzip_http_version 1.1;
				gzip_min_length 256;
				gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
				proxy_pass http://192.168.0.0:4000;
				proxy_redirect off;
				proxy_http_version 1.1;
				proxy_cache_bypass $http_upgrade;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header 'Access-Control-Allow-Origin' '*';
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
				expires off;
		}
	}
}`
			);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				2,
				"/root/path/.local-ssl-management/Dockerfile",
				`FROM nginx

# RUN rm -f /etc/nginx/conf.d/default.conf

# WORKDIR /var/www/html
# COPY index.html /var/www/html
# RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/

COPY ssl/demo.com-key.pem /etc/nginx/
COPY ssl/demo.com-cert.pem /etc/nginx/

COPY ssl/localhost-key.pem /etc/nginx/
COPY ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]`
			);

			expect(shell.exec).toBeCalledTimes(2);
			expect(shell.exec).toHaveBeenNthCalledWith(
				1,
				`NAME=local-ssl-management && \
		docker rm -f $NAME && \
		docker rmi -f $NAME && \
		docker build --no-cache -t $NAME /root/path/.local-ssl-management && \
		docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
				{ silent: true }
			);
			expect(listContainer).toBeCalled();

			expect(shell.echo).toBeCalledTimes(2);
			expect(shell.echo).nthCalledWith(
				1,
				"\nSSL proxy running\n"
			);

			expect(shell.exec).nthCalledWith(
				2,
				"curl -s -o /dev/null -w \"%{http_code}\" https://demo.com",
				{ silent: true }
			);

			expect(shell.echo).nthCalledWith(
				2,
				`
domain           app running
https://demo.com ❌${'          '}
`
			);
		});
	});

	describe("multiple service", () => {
		test("does not exists localhost certs", () => {
			fs.existsSync = vi.fn(() => false);

			generateProxyImage([]);

			expect(fs.existsSync).toBeCalledTimes(2);
			expect(mkcert).toBeCalled();
			expect(fs.writeFileSync).toBeCalledTimes(2);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				1,
				"/root/path/.local-ssl-management/nginx.conf",
				`user  nginx;
worker_processes  20;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
		server {
				listen              443 ssl;
				server_name         _;
				ssl_certificate     /etc/nginx/localhost-cert.pem;
				ssl_certificate_key /etc/nginx/localhost-key.pem;
				location / {
						root  /var/www/html;
				}
		}

		server {
				listen 80 default_server;
				server_name         _;

				include       /etc/nginx/mime.types;
				default_type  application/octet-stream;

				location / {
						root  /var/www/html;
				}
		}

\t\t
}`
			);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				2,
				"/root/path/.local-ssl-management/Dockerfile",
				`FROM nginx

# RUN rm -f /etc/nginx/conf.d/default.conf

# WORKDIR /var/www/html
# COPY index.html /var/www/html
# RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/



COPY ssl/localhost-key.pem /etc/nginx/
COPY ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]`
			);

			expect(shell.exec).toBeCalledTimes(1);
			expect(shell.exec).toHaveBeenNthCalledWith(
				1,
				`NAME=local-ssl-management && \
		docker rm -f $NAME && \
		docker rmi -f $NAME && \
		docker build --no-cache -t $NAME /root/path/.local-ssl-management && \
		docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
				{ silent: true }
			);
			expect(listContainer).toBeCalled();

			expect(shell.echo).toBeCalledTimes(2);
			expect(shell.echo).nthCalledWith(
				1,
				"\nSSL proxy running\n"
			);
			expect(shell.echo).nthCalledWith(
				2,
				"\ndomain app running\n"
			);
		});

		test("create domain config succesful (localhost certs does not exists)", () => {
			vi.spyOn(fs, "existsSync").mockImplementation((v) => {
				if (/localhost-cert.pem$/.test(String(v))) {
					return false;
				}

				if (/demo.com-.*.pem$/.test(String(v))) {
					return true;
				}

				return false;
			});

			(vi.spyOn(shell, "exec") as SpyInstance).mockImplementation((v) => v);

			generateProxyImage([
				{
					"id": "485b5a34-f0c3-4472-8308-6bcc0a485527",
					"domain": "demo.com",
					"port": "4000,3000",
					"location": "/,/app-name"
				}
			]);

			expect(fs.existsSync).toBeCalledTimes(4);

			expect(mkcert).toBeCalledTimes(1);
			expect(mkcert).nthCalledWith(
				1,
				"localhost",
				"/root/path/.local-ssl-management/ssl",
			);

			expect(fs.writeFileSync).toBeCalledTimes(2);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				1,
				"/root/path/.local-ssl-management/nginx.conf",
				`user  nginx;
worker_processes  20;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
		server {
				listen              443 ssl;
				server_name         _;
				ssl_certificate     /etc/nginx/localhost-cert.pem;
				ssl_certificate_key /etc/nginx/localhost-key.pem;
				location / {
						root  /var/www/html;
				}
		}

		server {
				listen 80 default_server;
				server_name         _;

				include       /etc/nginx/mime.types;
				default_type  application/octet-stream;

				location / {
						root  /var/www/html;
				}
		}

		server {
			listen	443 ssl;

			autoindex off;

			access_log  /var/log/nginx/demo.com.access.log;
			error_log   /var/log/nginx/demo.com.error.log;

			server_tokens off;
			server_name demo.com;

			ssl_certificate     /etc/nginx/demo.com-cert.pem;
			ssl_certificate_key /etc/nginx/demo.com-key.pem;

			gzip_static on;

			location / {
				gzip on;
				gzip_disable \"msie6\";
				gzip_vary on;
				gzip_proxied any;
				gzip_comp_level 6;
				gzip_buffers 16 8k;
				gzip_http_version 1.1;
				gzip_min_length 256;
				gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
				proxy_pass http://192.168.0.0:4000;
				proxy_redirect off;
				proxy_http_version 1.1;
				proxy_cache_bypass $http_upgrade;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header 'Access-Control-Allow-Origin' '*';
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
				expires off;
		}

location /app-name {
				gzip on;
				gzip_disable \"msie6\";
				gzip_vary on;
				gzip_proxied any;
				gzip_comp_level 6;
				gzip_buffers 16 8k;
				gzip_http_version 1.1;
				gzip_min_length 256;
				gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
				proxy_pass http://192.168.0.0:3000;
				proxy_redirect off;
				proxy_http_version 1.1;
				proxy_cache_bypass $http_upgrade;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header 'Access-Control-Allow-Origin' '*';
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
				expires off;
		}
	}
}`
			);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				2,
				"/root/path/.local-ssl-management/Dockerfile",
				`FROM nginx

# RUN rm -f /etc/nginx/conf.d/default.conf

# WORKDIR /var/www/html
# COPY index.html /var/www/html
# RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/

COPY ssl/demo.com-key.pem /etc/nginx/
COPY ssl/demo.com-cert.pem /etc/nginx/

COPY ssl/localhost-key.pem /etc/nginx/
COPY ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]`
			);

			expect(shell.exec).toBeCalledTimes(2);
			expect(shell.exec).toHaveBeenNthCalledWith(
				1,
				`NAME=local-ssl-management && \
		docker rm -f $NAME && \
		docker rmi -f $NAME && \
		docker build --no-cache -t $NAME /root/path/.local-ssl-management && \
		docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
				{ silent: true }
			);
			expect(listContainer).toBeCalled();

			expect(shell.echo).toBeCalledTimes(2);
			expect(shell.echo).nthCalledWith(
				1,
				"\nSSL proxy running\n"
			);

			expect(shell.exec).nthCalledWith(
				2,
				"curl -s -o /dev/null -w \"%{http_code}\" https://demo.com",
				{ silent: true }
			);

			expect(shell.echo).nthCalledWith(
				2,
				`
domain           app running
https://demo.com ❌${'          '}
`
			);
		});

		test("create domain config succesful (domain certs does not exists)", () => {
			vi.spyOn(shell, "exec").mockImplementation(() => {
				return { status: 200 }
			})
			vi.spyOn(fs, "existsSync").mockImplementation((v) => {
				if (/localhost-cert.pem$/.test(String(v))) {
					return false;
				}

				if (/demo.com-.*.pem$/.test(String(v))) {
					return false;
				}

				return false;
			});

			generateProxyImage([
				{
					"id": "485b5a34-f0c3-4472-8308-6bcc0a485527",
					"domain": "demo.com",
					"port": "4000,3000",
					"location": "/,/app-name"
				}
			]);

			expect(fs.existsSync).toBeCalledTimes(4);

			expect(mkcert).toBeCalledTimes(2);
			expect(mkcert).nthCalledWith(
				1,
				"localhost",
				"/root/path/.local-ssl-management/ssl",
			);
			expect(mkcert).nthCalledWith(
				2,
				"demo.com",
				"/root/path/.local-ssl-management/ssl",
			);

			expect(fs.writeFileSync).toBeCalledTimes(2);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				1,
				"/root/path/.local-ssl-management/nginx.conf",
				`user  nginx;
worker_processes  20;

error_log  /var/log/nginx/error.log warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  1024;
}

http {
		server {
				listen              443 ssl;
				server_name         _;
				ssl_certificate     /etc/nginx/localhost-cert.pem;
				ssl_certificate_key /etc/nginx/localhost-key.pem;
				location / {
						root  /var/www/html;
				}
		}

		server {
				listen 80 default_server;
				server_name         _;

				include       /etc/nginx/mime.types;
				default_type  application/octet-stream;

				location / {
						root  /var/www/html;
				}
		}

		server {
			listen	443 ssl;

			autoindex off;

			access_log  /var/log/nginx/demo.com.access.log;
			error_log   /var/log/nginx/demo.com.error.log;

			server_tokens off;
			server_name demo.com;

			ssl_certificate     /etc/nginx/demo.com-cert.pem;
			ssl_certificate_key /etc/nginx/demo.com-key.pem;

			gzip_static on;

			location / {
				gzip on;
				gzip_disable \"msie6\";
				gzip_vary on;
				gzip_proxied any;
				gzip_comp_level 6;
				gzip_buffers 16 8k;
				gzip_http_version 1.1;
				gzip_min_length 256;
				gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
				proxy_pass http://192.168.0.0:4000;
				proxy_redirect off;
				proxy_http_version 1.1;
				proxy_cache_bypass $http_upgrade;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header 'Access-Control-Allow-Origin' '*';
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
				expires off;
		}

location /app-name {
				gzip on;
				gzip_disable \"msie6\";
				gzip_vary on;
				gzip_proxied any;
				gzip_comp_level 6;
				gzip_buffers 16 8k;
				gzip_http_version 1.1;
				gzip_min_length 256;
				gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
				proxy_pass http://192.168.0.0:3000;
				proxy_redirect off;
				proxy_http_version 1.1;
				proxy_cache_bypass $http_upgrade;
				proxy_set_header Upgrade $http_upgrade;
				proxy_set_header Connection 'upgrade';
				proxy_set_header Host $host;
				proxy_set_header 'Access-Control-Allow-Origin' '*';
				proxy_set_header X-Real-IP $remote_addr;
				proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
				proxy_set_header 'Cache-Control' 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
				expires off;
		}
	}
}`
			);
			expect(fs.writeFileSync).toHaveBeenNthCalledWith(
				2,
				"/root/path/.local-ssl-management/Dockerfile",
				`FROM nginx

# RUN rm -f /etc/nginx/conf.d/default.conf

# WORKDIR /var/www/html
# COPY index.html /var/www/html
# RUN chmod 755 /var/www/html/index.html

COPY nginx.conf /etc/nginx/conf.d/

COPY ssl/demo.com-key.pem /etc/nginx/
COPY ssl/demo.com-cert.pem /etc/nginx/

COPY ssl/localhost-key.pem /etc/nginx/
COPY ssl/localhost-cert.pem /etc/nginx/

COPY nginx.conf /etc/nginx/

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]`
			);

			expect(shell.exec).toBeCalledTimes(2);
			expect(shell.exec).toHaveBeenNthCalledWith(
				1,
				`NAME=local-ssl-management && \
		docker rm -f $NAME && \
		docker rmi -f $NAME && \
		docker build --no-cache -t $NAME /root/path/.local-ssl-management && \
		docker run --name $NAME -p 80:80 -p 443:443 -d $NAME`,
				{ silent: true }
			);
			expect(listContainer).toBeCalled();

			expect(shell.echo).toBeCalledTimes(2);
			expect(shell.echo).nthCalledWith(
				1,
				"\nSSL proxy running\n"
			);

			expect(shell.exec).nthCalledWith(
				2,
				"curl -s -o /dev/null -w \"%{http_code}\" https://demo.com",
				{ silent: true }
			);

			expect(shell.echo).nthCalledWith(
				2,
				`
domain           app running
https://demo.com ❌${'          '}
`
			);
		});
	});
});
