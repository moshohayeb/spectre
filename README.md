# spectre
The idea is to auto download movies in a given watchlist and keep it synced locally. It also downloads the matching subtitle if found.

Currently only supports imdb watchlist (__has to be public__) and thepiratebay as a provider, perhaps more to come.

You can test it with the default watchlist currently in conf.js

## How to run
 ```
git clone https://github.com/moshohayeb/spectre.git
cd spectre
npm install
 ```
 Minimal Configuration in conf.js
- Change sources.imdb[0] to your watchlist uri
- Edit tmpDir and dlDir

```
DEBUG=spectre:* node index.js
```

## Configuration
Have a look at conf.js

## TODO
There are MANY things missing, If you'd like something in particular feel free to open an issue
 - Torrent selection strategy
 - Handling slow downloads/failures
 - Better logic for determining the actual downloaded video
 - Auto uncompressing
 - More subtitle/torrent/list providers
 - Daemonize with a configurable rerun interval

## Using a Proxy
spectre uses the request module which respects the http_proxy and https_proxy env variables
```
export http_proxy=http://yourproxy:port
```

## BUGS
This is a very rough release, If you encounter any bugs or would like a feature please open an issue
