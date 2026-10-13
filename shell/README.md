# Show Control shell

A window that loads the Show Control interface from a server. The shell contains no interface code. Update the web app on the server, press reload, and every shell shows the new version. Build the shell once; change the content as often as you like.

## Run it

From the project root:

```sh
npm run shell:install   # once
npm run dev             # the server, in another terminal
npm run shell
```

Or from this folder: `npm install`, then `npm start`.

The shell looks for the server, shows a waiting screen until it answers, then loads the interface. If the server goes away, the shell returns to the waiting screen and reconnects when the server is back.

## Pointing it at a server

The address is chosen in this order:

1. `--url=http://host:port/` on the command line
2. the `SHOWCONTROL_URL` environment variable
3. the address saved from **Server > Change Server Address…** (⌘L)
4. `config.json` in this folder (default `http://127.0.0.1:5173/`)

Saved settings live in the app's user data folder; **Server > Show Settings File** reveals it. A packaged shell can be pointed at a new server without rebuilding.

For a shell on a different machine than the server, start the server so it listens on the network:

```sh
npm run dev:lan        # development server with live reload
npm run build && npm run preview:lan   # built app, no live reload
```

Then enter that machine's address in the shell, for example `http://192.168.1.20:5173/`.

## Menu

| Item | Shortcut | What it does |
|---|---|---|
| Server > Reload Interface | ⌘R | Re-checks the server and reloads the page |
| Server > Reload Ignoring Cache | ⇧⌘R | Reload that skips cached files |
| Server > Change Server Address… | ⌘L | Enter a new address and connect |
| Server > Open Server in Browser | | Opens the same address in the default browser |
| Server > Show Settings File | | Reveals the saved settings |
| View > Toggle Full Screen | ⌃⌘F | Full screen |
| View > Toggle Developer Tools | ⌥⌘I | Chromium developer tools for the loaded interface |

## Kiosk mode

For the room machine:

```sh
npm run start:kiosk -- --url=http://192.168.1.20:5173/
```

Kiosk mode fills the screen with no window chrome. Quit with ⌘Q.

## Package a Mac app

```sh
npm run dist
```

This writes `release/mac*/Show Control.app` (and a zip). The build is unsigned; on first launch, right-click the app and choose Open. The packaged app reads the same settings and accepts the same `--url` and `--kiosk` flags.

## Check it from a terminal

```sh
SHOWCONTROL_SMOKE=1 npx electron . --url=http://127.0.0.1:5173/
```

Prints the URL and page title that loaded, then quits. With the server stopped it reports the waiting page instead.

## Files

- `main.js`: window, server polling, menu, settings
- `preload.js`: the small bridge used by the address dialog
- `pages/waiting.html`: shown until the server answers
- `pages/address.html`: the change-address dialog
- `config.json`: bundled defaults
