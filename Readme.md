# Local SSL Management

This project is the iteration of [https://github.com/dimaslz/local-ssl-management-docker](https://github.com/dimaslz/local-ssl-management-docker), to do the same but throuth a UI or CLI.

CLI to manage local SSL certifications by [mkcert](https://github.com/FiloSottile/mkcert). The key of this script: do not use ports in the domain and use all of them through port 443.

**Example:**

https://local.your-domain.tld:3000 → https://local.your-domain.tld

> ℹ️ At the moment, just tested in MacOS

## Install cli

`npm install -g @dimaslz/local-ssl-management-cli`

Then the CLI will be `local-ssl ...`

### Commands

* `local-ssl create <domain> --port XXXX`: Create a domain (without http or https) like: `local-ssl create local.your-domain.com --port 3333`. The port should where the original application is running ([http://localhost:3333](http://localhost:3333));
* `local-ssl list`: List all the configs working.
* `local-ssl remove <domain-key>`: Remove domain in the proxy. The domain key is the value you can see in the result of `local-ssl list`.
* `local-ssl update <domain-key> --port XXXX`: Update config for a domain. For example, the port like: `local-ssl update local.your-domain.com --port 4444`

## Use case

Sometimes we need to use HTTPS for some security restrictions or just to work closely to the PRODUCTION reality.

This is not a common use case, just it is a particular scenario on my side. Probably you do not need this to work with multiple projects in local but, it is helpful for me, also maybe for you.

Some of projects I work, has a authentication process linked to some platform like Github for example. Following this case, to setup your authentication process, you need to give a callback url like `https://local.your-domain.com:3000`, but sometimes I need to change the PORT for some reason. The problem is, I need to change the PORT in the service where I doing the authentication process and, all the parts in the code where I have the domain set, as for example, in the environment vars.

Now, you can work without port when you use HTTPS, so, you can access to `https://local.your-domain.com` directly, without specify the PORT. With this CLI, back to the Github authentication case, just you need to give the domain, without care when you change the PORT.

Yes, this is a specific use case but for me, sometimes is very useful and, I do not need to touch anything on my machine.

### Other use cases

* When you need to do something related with different TLD, as for example: setup a default language according to the TLD. You do not need to add a special script to get the TLD.
* ...

## Requirements

* Nodejs +16
* Docker
* Mkcert
* Update /etc/hosts manually

## How it works?

![alt text](/architecture-schema.png)

Basically, the script creates a container based on [nginx](https://hub.docker.com/_/nginx), and this container works as proxy for local domains, like in a server.

## How to use

**#1 - Update your /hosts**:

OSX:

```bash
...
127.0.0.1					local.your-domain.com
```

**#2 - Setup config**:

```json
[
  {
    "domain": "local.your-domain.com",
    "port": 2000, // port where the application is running http://localhost:2000
  },
  ...
]
```

**#3 - Run your application**:

The script will work but, if your application is not running, the domain with not resolve the source.

**#4 - Run the script**:

Before all, build the script by running `yarn build` and after `yarn up`

The script will:

* Check the `config.json` file, creating the new SSL certificates if needed.
* Create the `nginx.conf` per each domain.
* Generate the `Dockerfile` configuration.
* Remove and create the new image (named `local-ssl-management`).
* Remove and create the new container (named `local-ssl-management`).

> All files create will be into `.temp` folder.

**#4 - Go to your domain and check it**:

Go you your application local domain: [https://local.your-domain.com](https://local.your-domain.com) and... should work 😅.


## TODO

* [ ] Add certs manually
* [ ] Add custom nginx config

## Packages

### app

UI of the project (WIP)

### cli

Command line to manage local SSL certificates.

### core

Common methods and functions to use in `app` and `cli`. At the moment not very useful because the `app` is not ready.
