# Endpoint Reference

This document describes the device endpoints currently used or identified by custom-th-mobile-interface.

The information here comes from:
- live endpoint testing against a device on the local network
- inspection of the stock device web UI HTML and JavaScript

When option lists are mentioned in this document, their source matters:
- `stock UI inspection`
  - values were found in the built-in device web page or JavaScript
  - this is how most `lang`, `songType`, and `singerType` values were first discovered
- `live endpoint validation`
  - values were then sent to the actual device endpoint and checked for plausible results
- `inference`
  - behavior was inferred from naming or response patterns and is not yet fully proven

Important:
- `SearchServlet` and `SingerServlet` do not currently appear to expose a self-describing metadata response listing all valid filter values.
- In practice, custom-th-mobile-interface derives most filter values from the stock UI first, then validates them against live endpoint behavior.

## Transport

The device browser API uses JSONP, not plain JSON.

Be clear about the difference:

- JSON:
  - plain data only
  - example:

```json
{"cmd":"Add1","code":"0"}
```

- JSONP:
  - a JavaScript function call whose argument is JSON
  - example:

```js
jQuery111109054655546115213_1773475935717({"cmd":"Del1","code":"0"})
```

The karaoke device returns JSONP responses like the second form.

Typical requests include:
- `jsonpCallback=<callback name>`
- `_=` timestamp cache-buster

Typical response shape:

```js
callbackName({...json payload...})
```

The callback name is often:
- a jQuery-generated callback such as `jQuery1111...`
- or an app-generated callback such as `__openKodJsonp_...`

So:
- the payload inside the parentheses is JSON
- the full HTTP response is JSONP

## Base URL

Example device base URL:

```text
http://device-ip:8080
```

## SearchServlet

Search endpoint:

```text
GET /SearchServlet
```

Observed query parameters:
- `songName`
- `songType`
- `singer`
- `lang`
- `sortType`
- `page`
- `jsonpCallback`
- `_`

Example:

```text
/SearchServlet?jsonpCallback=testcb&songName=&songType=&singer=&lang=国语&sortType=&page=0
```

Observed JSON payload fields:
- `maxPage`
- `number`
- `page`
- `songList`

Observed `songList` JSON item fields:
- `sONGBM`: song id
- `sONGNAME`: song title
- `sINGER`: singer name
- `sINGERPIC`: singer image filename
- `cLOUD`: cloud flag, `1` or `0`

Example item:

```json
{
  "cLOUD": 1,
  "sINGER": "田馥甄",
  "sINGERPIC": "26940.jpg",
  "sONGBM": "9029901",
  "sONGNAME": "小幸运"
}
```

### Supported `lang` values

Discovery method:
- first found by inspecting the stock device UI
- then spot-checked against live `SearchServlet` results

- `''` = All in custom-th-mobile-interface default requests
- `全部` = All in some stock UI flows
- `国语` = Mandarin
- `粤语` = Cantonese
- `闽语` = Hokkien
- `英语` = English
- `日语` = Japanese
- `韩语` = Korean
- `泰语` = Thai
- `越南语` = Vietnamese
- `柬埔寨语` = Khmer
- `缅甸语` = Burmese
- `老挝语` = Lao
- `印度语` = Hindi
- `巫语` = Malay
- `印尼语` = Indonesian
- `菲律宾语` = Filipino
- `俄语` = Russian
- `法语` = French
- `其他` = Other

Notes:
- custom-th-mobile-interface standardizes default filter values to blank where possible, so `All` is sent as `lang=''`.
- `台语` did not appear in the stock UI.
- In live testing, `台语` did not behave like a distinct supported value and appeared to fall back.

### Supported `songType` values

Discovery method:
- first found by inspecting the stock device UI
- some values were then checked against live `SearchServlet` behavior
- this is not currently a self-enumerating endpoint field

- `对唱` = Duet
- `民歌` = Folk
- `戏曲` = Opera
- `儿歌` = Children's
- `生日` = Birthday
- `喜庆` = Celebration
- `怀旧` = Nostalgia
- `串烧` = Medley
- `字幕` = Romanised / subtitle-assisted songs

### Supported `sortType` values

Discovery method:
- first found in stock UI wiring
- then checked against live `SearchServlet` responses

- `TopByHotSong`
- `TopByNewSong`

Observed behavior:
- blank `sortType` returns the default browse list
- `TopByHotSong` behaved the same as blank in live tests performed so far
- `TopByNewSong` returned a different list and appeared to ignore `lang`

Practical recommendation:
- use blank for `Top Hits`
- use `TopByNewSong` for `New Songs`

## PlaylistServlet

Playlist endpoint:

```text
GET /PlaylistServlet
```

Observed query parameters:
- `onSelectPage=true`
- `type=1`
- `jsonpCallback`
- `_`

Example:

```text
/PlaylistServlet?jsonpCallback=testcb&onSelectPage=true&type=1
```

Observed JSON payload fields:
- `hasChange`
- `number`
- `songList`
- `stateMuOr`
- `stateMute`
- `statePlay`

Observed `songList` JSON item fields:
- `xH`: song id / queue item id
- `sONGNAME`: song title
- `sINGER`: singer name

Example:

```json
{
  "hasChange": "true",
  "number": 2,
  "songList": [
    { "sINGER": "梦然", "sONGNAME": "少年", "xH": "1503296" },
    { "sINGER": "陈奕迅", "sONGNAME": "十年", "xH": "1486462" }
  ],
  "stateMuOr": false,
  "stateMute": false,
  "statePlay": false
}
```

## CommandServlet

Command endpoint:

```text
GET /CommandServlet
```

Observed query parameters:
- `cmd`
- `cmdValue` when applicable
- `jsonpCallback`
- `_`

Typical JSON payload on success:

```json
{
  "cmd": "Add1",
  "code": "0"
}
```

Observed commands:

### Queue management

- `Add1`
  - add song to queue
  - requires `cmdValue=<song id>`
- `Pro1`
  - prioritize song
  - requires `cmdValue=<song id>`
- `Del1`
  - delete song from queue
  - requires `cmdValue=<song id>`

### Playback and mode

- `Play`
  - play or pause toggle
- `Skip`
  - skip current song
- `Reset`
  - replay / restart current playback
- `MuOr`
  - vocals toggle
- `Mute`
  - mute toggle

### Music volume

- `Music_up`
- `Music_down`

### Microphone volume

- `Mic_up`
- `Mic_down`

### Pitch

- `Tone_nom`
  - original key
- `Tone_down`
  - flatten
- `Tone_up`
  - sharpen

## Singer Images

Singer image endpoint:

```text
GET /singer/<filename>
```

Example:

```text
/singer/26940.jpg
```

The filename comes from `sINGERPIC` in `SearchServlet` results.

## Related Stock UI Endpoints Found

These were identified in the stock UI but are not currently used by custom-th-mobile-interface:

- `SearchServletYb`
- `SearchServletBanner`
- `SearchServletCollect`
- `SingerServlet`

They may be useful for future expansion.

## SingerServlet

Singer browse/search endpoint:

```text
GET /SingerServlet
```

Observed query parameters:
- `singer`
- `singerType`
- `sortType`
- `page`
- `jsonpCallback`
- `_`

Example:

```text
/SingerServlet?jsonpCallback=testcb&singer=&singerType=大陆&sortType=&page=0
```

Observed response fields:
- `maxPage`
- `number`
- `page`
- `singerList`

Observed `singerList` item fields:
- `name`
- `picture`

Example item:

```json
{
  "name": "周杰伦",
  "picture": "27356.jpg"
}
```

Discovery method:
- first found by inspecting the stock device UI
- then spot-checked against live `SingerServlet` responses

Verified `singerType` values:
- `全部` = All
- `大陆` = China
- `港台` = Hong Kong / Taiwan
- `英语` = English
- `日本` = Japan
- `韩国` = Korea
- `越南` = Vietnam
- `柬埔寨` = Cambodia
- `印度` = India
- `泰国` = Thailand
- `菲律宾` = Philippines
- `马来西亚` = Malaysia
- `缅甸` = Myanmar
- `印尼` = Indonesia
- `老挝` = Laos
- `俄罗斯` = Russia
- `法国` = France
- `其他` = Other

Notes from live checks:
- many of these return singer lists immediately on page 0
- some categories such as `老挝`, `俄罗斯`, and `其他` returned `number: 8` but the first visible item was empty in spot checks, so those may need deeper validation

## Current Caveats

- The device API uses `GET` even for state-changing commands.
- The API is JSONP-based rather than CORS JSON.
- `TopByNewSong` appears to override or ignore language filtering.
- The exact semantic meaning of some response flags may still need further validation on-device.
