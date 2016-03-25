# spectre
The idea is to auto download movies in a given watchlist and keep it synced locally. It also downloads the matching subtitle if found.

You can test it with the test watchlist currently in spectre.json

## Requirements
I am using quite a few ES6 features so I am not sure which is the minimal required node version. Currently tested with __Node v.5.6__

## How to run
 ```
git clone https://github.com/moshohayeb/spectre.git
cd spectre
npm install
DEBUG=
 ```
 Minimal Configuration in spectre.json
- Add your lists in the lists array
- Edit tmpDir and dlDir

```
DEBUG=spectre:* node index.js
```

## Watchlists
Currently only IDMB lists are supported (watchlist and normal lists).

## Providers
The following trackers are supported
 - thepiratebay
 - kickass


## Configuration
Have a look at spectre.json

## Note
The current feature set fit all my needs. However there are many MANY things missing, If you'd like something in particular feel free to open an issue
 - Provide a way to choose a profile (720p/1080)
 - Handling slow downloads/failures
 - Better logic for determining the actual downloaded video
 - Auto uncompressing
 - More subtitle/torrent/list providers
 - Daemonize with a configurable rerun interval

## Using a Proxy
spectre uses the request module which respects the http_proxy and https_proxy env variables
```
export http_proxy=http://yourproxy:port
export https_proxy=https://yourproxy:port
```

## BUGS
If you encounter any bugs or would like a feature please open an issue
