user  nginx;
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

		#--server-config--#
}