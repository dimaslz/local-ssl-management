server {
				listen	443 ssl;

				autoindex off;

				access_log  /var/log/nginx/%APP_DOMAIN%.access.log;
				error_log   /var/log/nginx/%APP_DOMAIN%.error.log;

				server_tokens off;
				server_name %SERVER_NAME%;

				ssl_certificate     /etc/nginx/%APP_DOMAIN%-cert.pem;
				ssl_certificate_key /etc/nginx/%APP_DOMAIN%-key.pem;

				gzip_static on;

				location / {
						gzip on;
						gzip_disable "msie6";
						gzip_vary on;
						gzip_proxied any;
						gzip_comp_level 6;
						gzip_buffers 16 8k;
						gzip_http_version 1.1;
						gzip_min_length 256;
						gzip_types text/plain text/css application/json application/x-javascript application/javascript text/xml application/xml application/xml+rss text/javascript application/vnd.ms-fontobject application/x-font-ttf font/opentype image/svg+xml image/x-icon;
						proxy_pass http://%LOCAL_IP%:%PORT%;
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