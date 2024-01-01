# Local SSL Management

This project is the iteration of [https://github.com/dimaslz/local-ssl-management-docker](https://github.com/dimaslz/local-ssl-management-docker), to do the same but throuth a UI or CLI.

CLI to manage local SSL certifications by [mkcert](https://github.com/FiloSottile/mkcert). The key of this script: do not use ports in the domain and use all of them through port 443.

**Example:**

https://local.your-domain.tld:3000 → https://local.your-domain.tld

> ℹ️ At the moment, just tested in MacOS

From `version 1.0.0`, also is possible to setup a reverse proxy for microservices on the same domain.

**Example:**

Request to <https://local.your-domain.tld/> will serve <http://localhost:3000>

Request to <https://local.your-domain.tld/app-name> will serve <http://localhost:4000>

## Content

- [Local SSL Management](#local-ssl-management)
  - [Content](#content)
  - [Install cli](#install-cli)
  - [Commands](#commands)
    - [create domain config](#create-domain-config)
    - [create new location for a existing domain](#create-new-location-for-a-existing-domain)
    - [rename location](#rename-location)
    - [update port to a location](#update-port-to-a-location)
    - [update location and port](#update-location-and-port)
    - [remove domain](#remove-domain)
    - [remove location for a domain](#remove-location-for-a-domain)
    - [list current service configs](#list-current-service-configs)
  - [Use case](#use-case)
    - [Other use cases](#other-use-cases)
  - [Requirements](#requirements)
  - [How it works?](#how-it-works)
  - [How to use](#how-to-use)
  - [TODO](#todo)
  - [Packages](#packages)
    - [app](#app)
    - [cli](#cli)
    - [core](#core)
  - [Author](#author)
  - [My other projects](#my-other-projects)

## Install cli

`npm install -g @dimaslz/local-ssl-management-cli`
> [https://www.npmjs.com/package/@dimaslz/local-ssl-management-cli](https://www.npmjs.com/package/@dimaslz/local-ssl-management-cli)

Then the CLI will be `local-ssl ...`

## Commands

> Is important to know that you need to setup the domains into your `/etc/hosts`
>
> ```bash
> your-domain.com           127.0.0.1
> ```
>
> This will be automatically on the next version

### create domain config

```bash
$ local-ssl create local.your-name.com --location / --port 3000

# note: --location is "/"" by default.
```

Now, go to your favourite browser and visit <https://local.your-name.com> and should be serving what is serving on <http://localhost:3000>.

### create new location for a existing domain

```bash
$ local-ssl create local.your-name.com --location /app --port 4000
```

### rename location

```bash
$ local-ssl update local.your-name.com --location /app,/new-app
```

> Also you can update the port at the same time if you want.

### update port to a location

```bash
$ local-ssl update local.your-name.com --location /new-app --port 4000
```

### update location and port

```bash
$ local-ssl update local.your-name.com --location /,/new-app --port 4000
```

Now, intead of access to <https://local.your-domain.com/app>, you should access to <https://local.your-domain.com/new-app>

### remove domain

```bash
$ local-ssl remove local.your-domain.com
```

### remove location for a domain

```bash
$ local-ssl remove local.your-domain.com --location /new-app
```

### list current service configs

```bash
$ local-ssl list
```

## Use case

Sometimes we need to use HTTPS for some security restrictions or just to work closely to the PRODUCTION reality.

This is not a common use case, just it is a particular scenario on my side. Probably you do not need this to work with multiple projects in local but, it is helpful for me, also maybe for you.

Some of projects I work, has a authentication process linked to some platform like Github for example. Following this case, to setup your authentication process, you need to give a callback url like `https://local.your-domain.com:3000`, but sometimes I need to change the PORT for some reason. The problem is, I need to change the PORT in the service where I doing the authentication process and, all the parts in the code where I have the domain set, as for example, in the environment vars.

Now, you can work without port when you use HTTPS, so, you can access to `https://local.your-domain.com` directly, without specify the PORT. With this CLI, back to the Github authentication case, just you need to give the domain, without care when you change the PORT.

Yes, this is a specific use case but for me, sometimes is very useful and, I do not need to touch anything on my machine.

### Other use cases

- When you need to do something related with different TLD, as for example: setup a default language according to the TLD. You do not need to add a special script to get the TLD.
- ...

## Requirements

- Nodejs +16
- Docker
- Mkcert
- Update /etc/hosts manually

## How it works?

![Local SSL Management - Project idea](/architecture-schema.png)

Basically, the script creates a container based on [nginx](https://hub.docker.com/_/nginx), and this container works as proxy for local domains, like in a server.

## How to use

> By default, always is created the certifications for `https://localhost`

**#1 - Update your /hosts**:

MacOS and Linux:

```bash
...
127.0.0.1     local.your-domain.com
```

**#2 - Create new domain**:

`$ local-ssl create local.your-domain.com --port 4200`

or for multiple domains...

`$ local-ssl create local.your-domain.com,local.your-domain.es --port 4200`

List domain to check it

![Local SSL Management - list domains configured](/local-ssl-list-example.png)

The script will:

- Store the configs.
- Create the `nginx.conf` per each domain.
- Create or update the `Dockerfile` configuration.
- Remove and create the new image (named `local-ssl-management`).
- Remove and create the new container (named `local-ssl-management`).

**#3 - Run your application**:

The script will work but, if your application is not running, the domain with not resolve the source.

**#4 - Go to your domain and check it**:

Go you your application local domain: [https://local.your-domain.com](https://local.your-domain.com) and... should work 😅.

For sure, if the service is not working, the result will response a server error.

## TODO

- [ ] Serve dashboard on <https://localhost>
  - [ ] Manage domains by UI
  - [ ] Show logs in a friendly ui
  - [ ] Allow edit Nginx config
- [ ] Add certs manually
- [ ] Add custom nginx config

## Packages

### app

UI of the project (WIP)

### cli

Command line to manage local SSL certificates.

### core

Common methods and functions to use in `app` and `cli`. At the moment not very useful because the `app` is not ready.

## Author

```json
{
  "name": "Dimas López Zurita",
  "role": "Senior Software Engineer",
  "alias": "dimaslz",
  "linkedin": "https://www.linkedin.com/in/dimaslopezzurita",
  "github": "https://github.com/dimaslz",
  "twitter": "https://twitter.com/dimaslz",
  "tags": "tooling, docker, tailwindcss, vue, SAAS, nodejs+express"
}
```

## My other projects

* [https://ng-heroicons.dimaslz.dev/](https://ng-heroicons.dimaslz.dev/): An Angular components library to use Heroicons.com in your Angular projects.
* [https://randomdata.loremapi.io/](https://randomdata.loremapi.io/): A tool to create mock Api responses with your custom schema.
* [https://svg-icon-2-fw-component.dimaslz.dev](https://svg-icon-2-fw-component.dimaslz.dev): A tool to create a framework icon component from a SVG
* [https://loremapi.io](https://loremapi.io): Mock and document your Api's
* [https://cv.dimaslz.dev](https://cv.dimaslz.dev): My online CV
* [https://api.dimaslz.dev](https://api.dimaslz.dev): My professional info by API
* [https://dimaslz.dev](https://dimaslz.dev): Dev landing
* [https://dimaslz.com](https://dimaslz.com): Profesional landing profile
