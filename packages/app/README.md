# Local SSL management

Script to handle local SSL certifications by [mkcert](https://github.com/FiloSottile/mkcert). The key of this script?: do not use ports in the domain and use all by the 443 port.

**Example**:

`https://local.your-domain.tld:3000` → `https://local.your-domain.tld`

## Use case

Sometimes we need to use HTTPS for some security restrictions or just to work closely to the PRODUCTION reality.

I work with multiple projects and, some of them, has a authentication process linked to some platform like Github for example. Following this case, to setup your authentication process, you need to give a callback url like `https://local.your-domain.com:3000`, but sometimes I need to change the PORT for some reason. The problem is, I need to change the PORT in the service what I doing the authentication process.

Now, you can work without port when you use HTTPS, so, you can access to `https://local.your-domain.com` directly, without specify the PORT. With this, back to the Github authentication case, just you need to give the domain, without care when you change teh PORT.

Yes, this is a specific use case but, for me sometimes is very useful.

### Others

* When you need to do something related with different TLD, as for example: setup a default language according to the TLD. You do not need to add a special script to get the TLD.
* ...

## TODO

* [ ] Create certification for multiple TLD for the same project

## How it works?

![alt text](/architecture-schema.png)

Basically, the script creates a container based on [Nginx](https://hub.docker.com/_/nginx), and this container works as proxy for local domains, like in a server.

## Use by CLI

**#1 - Update your /hosts**:

OSX:

```bash
...
127.0.0.1					local.your-domain.com
```

**#2 (option 1) - Generate your SSL certs**:

If you already have the local SSL certificates, you can move it to local /ssl folder and update the `config.json` file.

```json
[
  {
    "domain": "local.your-domain.com",
    "ssl": {
      "cert": "./ssl/your-self-ssl-cert.pem",
      "key": "./ssl/your-self-ssl-key.pem",
    },
    "port": 2000, // port where the application is running http://localhost:2000
    "nginxConf": null
  },
  ...
]
```

**#2 (option 2) - Auto generate SSL certificates**:

If you do not have the SSL certificates yet, you can set the `ssl` data to null in the `config.json` file, and the script will create it automatically.

Your config

```json
[
  {
    "domain": "local.your-domain.com",
    "ssl": {
      "cert": null,
      "key": null,
    },
    "port": 2000, // port where the application is running http://localhost:2000
    "nginxConf": null
  },
  ...
]
```

After run the script

```json
[
  {
    "domain": "local.your-domain.com",
    "ssl": {
      "cert": "./ssl/local.your-domain.com-cert.pem",
      "key": "./ssl/local.your-domain.com-key.pem",
    },
    "port": 2000, // port where the application is running http://localhost:2000
    "nginxConf": null
  },
  ...
]
```

**#3 - Run your application**:

The script will work but, if your application is not running, the domain with not resolve the source.

**#4 - Run the script**:

`yarn up`

The script will:

- Check and update the `config.json` file, creating the new SSL certificates if needed.
- Create the `nginx.conf` per each domain.
- Generate the `Dockerfile` configuration.
- Remove and create the new image (named `local-ssl-management`).
- Remove and create the new container (named `local-ssl-management`).

**#4 - Go to your domain and check it**:

Go you your application local domain: [https://local.your-domain.com](https://local.your-domain.com) and... should work 😅.

## Use by application

Just init the frontend application running the command `yarn dev` and access to [http://localhost:5173](http://localhost:5173) and manage the certificates by UI.

![alt text](/app-screenshot.png)
