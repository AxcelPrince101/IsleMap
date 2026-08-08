# IsleMap

EAC-safe Gateway radar overlay for **The Isle**, by **Balake Gaming**.

IsleMap never reads game memory. It updates your position from the clipboard when you click **Asset Location** in Status Report.

## Features

- Transparent overlay mini-map that stays above the game
- Control Center dashboard (overlay style, destinations, hotkeys, tutorial)
- Waypoint navigation with remaining distance
- Nearby Gateway places (areas, water, landmarks)
- Auto-updates from [GitHub Releases](https://github.com/AxcelPrince101/IsleMap/releases)

## Requirements

- Windows 10/11
- The Isle in **Borderless Windowed** mode (recommended)
- Node.js 20+ (for development only)

## Install (players)

1. Download the latest **IsleMap-Setup** installer from [Releases](https://github.com/AxcelPrince101/IsleMap/releases/latest)
2. Run the installer
3. Launch IsleMap, open the game in Borderless Windowed, then click **Asset Location** in Status Report to place your pin

## Developer

| Field | Value |
| --- | --- |
| Creator | Balake Gaming |
| ID | `balake101` |
| TikTok | [@balakestream](https://www.tiktok.com/@balakestream) |

## Development

```bash
npm install
npm start
```

### Scripts

| Command | Description |
| --- | --- |
| `npm start` | Run the Electron app unpackaged |
| `npm run sync:areas` | Refresh bundled Gateway place data (`ISLEMAP_AREA_ORIGIN` required) |
| `npm run dist` | Build a Windows installer into `dist/` |
| `npm run release` | Build and publish a GitHub Release (updater feed) |

### Publishing an update

1. Bump `"version"` in `package.json`
2. Commit and push
3. Run `npm run release` (uses your GitHub auth)

Packaged clients check this repository’s releases for updates.

## Safety

- No injection into The Isle process
- No memory scanning or game hooks
- Position updates from clipboard text only

Not affiliated with The Isle, Afterthought LLC, or any third-party map websites.

## License

All rights reserved © Balake Gaming.
