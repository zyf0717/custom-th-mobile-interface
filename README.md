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

In the UI, you can usually get this from the QR code shown by the karaoke system.

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
- If the app is hosted over `https` but the karaoke device only exposes `http`, browsers may block device requests as mixed content.
- Opening the built app directly from `file://` is not recommended; serve it over HTTP with Vite preview or another static server.
