# Open KOD

Open KOD is an alternative web UI for karaoke devices that expose the stock KOD HTTP/JSONP endpoints.

This app focuses on a cleaner browser interface for:
- searching songs
- queueing and prioritizing songs
- viewing the current playlist
- sending playback, pitch, and volume commands

The UI talks directly to the karaoke device over the local network. It does not include a backend proxy.

## Stack

- Vue 3
- Vite
- Vitest

## Development

Install dependencies first, then use the normal Vite commands:

```bash
npm install
npm run dev
```

Other useful commands:

```bash
npm run test
npm run build
npm run preview
```

## Device Setup

The app expects a device base URL such as:

```text
http://device-ip:8080
```

For best compatibility, serve and open the app over plain `http://` on the same local network as the karaoke device.

In the UI, you can usually get this from the QR code shown by the karaoke system.
If the QR scanner is unavailable on your browser or OS, enter the server URL manually instead.

## Permissions

- Camera access is only needed if you use the QR scanner.
- Camera scanning may not work on some browser and operating system combinations.
- The app is intended for direct local-network access over plain `http://`, without a backend proxy.
- Browser behavior can still vary across platforms, but the current app flow no longer depends on an explicit browser-level local-network permission trigger.

## How It Works

Open KOD uses the same browser-facing endpoints as the stock device UI:

- `SearchServlet` for song search
- `PlaylistServlet` for queue and playback state
- `CommandServlet` for control commands
- `/singer/<file>.jpg` for singer pictures

These endpoints return JSONP rather than plain JSON, so the frontend uses dynamic script injection.

That means the device response is usually shaped like:

```js
jQuery1111_123456789({...})
```

or:

```js
__openKodJsonp_123456789({...})
```

The object inside the parentheses is JSON data, but the full response is JSONP.

## Endpoint Reference

The currently known API behavior, discovered from the stock UI and live endpoint testing, is documented in:

[docs/endpoints.md](docs/endpoints.md)

## Notes

- This app is designed for local-network use.
- For best compatibility, run the app from a plain `http://` origin on the same local network as the KTV box.
