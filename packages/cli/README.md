# @dimaslz/local-ssl-management-cli

> Command line to manage local SSL certicifates and use domains without port.

## Installation

`npm install @dimaslz/local-ssl-management-cli -g`

## Usage

* `local-ssl create <domain> --port XXXX`: Create a domain (without http or https) like: `local-ssl create local.your-domain.com --port 3333`. The port should where the original application is running ([http://localhost:3333](http://localhost:3333));
* `local-ssl list`: List all the configs working.
* `local-ssl remove <domain-key>`: Remove domain in the proxy. The domain key is the value you can see in the result of `local-ssl list`.
* `local-ssl update <domain-key> --port XXXX`: Update config for a domain. For example, the port like: `local-ssl update local.your-domain.com --port 4444`
