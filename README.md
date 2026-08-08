# IsleMap

**IsleMap** is an EAC-safe Gateway radar overlay for **The Isle**, created by **Balake Gaming**.

It is a desktop mini-map that sits on top of your game. IsleMap **never** opens or injects into The Isle process and **never** scans game memory. Your position updates only when you copy coordinates from the game (via **Asset Location** in Status Report) and IsleMap reads that text from the Windows clipboard.

---

## Who this is for

- Players who want a lightweight Gateway radar while they play
- Anyone who wants waypoints, nearby place names, and a clear overlay without risking anti-cheat tools

---

## Creator

| | |
| --- | --- |
| **Name** | Balake Gaming |
| **ID** | `balake101` |
| **TikTok** | [@balakestream](https://www.tiktok.com/@balakestream) |
| **GitHub** | [AxcelPrince101/IsleMap](https://github.com/AxcelPrince101/IsleMap) |

---

## Features

- **Overlay radar** — circular Gateway map that stays above the game window
- **Control Center** — separate dashboard window for all settings
- **Clipboard location** — pin updates when you use **Asset Location** in Status Report
- **Waypoints** — set a destination, see path guidance and remaining distance
- **Nearby places** — areas, water, and landmarks with distance limits you control
- **Hotkeys** — play/map mode, filters, zoom, and more (fully remappable)
- **Tutorial** — guided tour of the real Control Center UI
- **Required updates** — when a newer release exists, installed builds lock the map until you install it

---

## Requirements

| Requirement | Details |
| --- | --- |
| **OS** | Windows 10 or Windows 11 (64-bit) |
| **Game** | The Isle (Gateway) |
| **Display mode** | **Borderless Windowed** strongly recommended so the overlay can sit cleanly on top |
| **Permissions** | Normal desktop app install; clipboard access for location updates |

No Easy Anti-Cheat bypass, trainer, or memory tool is required or included.

---

## Download & install (players)

1. Open the latest release:  
   **https://github.com/AxcelPrince101/IsleMap/releases/latest**
2. Download **`IsleMap-Setup-….exe`** (the Windows installer).
3. Run the installer and follow the prompts.  
   Shortcuts named **IsleMap** are created for you.
4. Start **IsleMap** from the Start Menu or desktop shortcut.
5. **Control Center** opens first. The in-game map starts **hidden**.
6. A tray icon (near the clock) stays available even if you close Control Center.

If Windows SmartScreen warns about an unknown publisher, choose **More info → Run anyway** (the build is unsigned unless a future release adds a certificate).

---

## First-time setup (in-game)

1. Launch **The Isle** and set the game to **Borderless Windowed** (not exclusive fullscreen).
2. Launch **IsleMap** — Control Center opens; the radar map is still off.
3. In Control Center, click **Show map** (bottom-left) when you want the radar over the game.
4. In-game, open your character **Status Report**.
5. Click **Asset Location** (Lat / Long / Alt).  
   The game copies your coordinates to the clipboard.
6. IsleMap reads that clipboard text and places your pin on the Gateway map.
7. Click **Asset Location** again whenever you want a fresh position (and to refresh facing when you move).

### Tray icon (background)

IsleMap keeps a **system tray icon** (near the Windows clock). Closing Control Center hides that window only — the app stays running in the background.

- **Click / double-click** the tray icon → reopen Control Center  
- **Right-click** → Show map / Hide map / Quit IsleMap  
- Check the hidden icons overflow (^) if you do not see IsleMap next to the clock

### Turning the map off

- **Hide map** in Control Center (same button toggles Show / Hide)
- Right-click the **IsleMap tray icon** → **Hide map**
- Use the **Hide / show overlay** hotkey (see Game & hotkeys)
- **Quit IsleMap** from the tray when you want to close everything

Closing Control Center alone does **not** quit the app.

**Tip:** Keep IsleMap running while you play. Each Asset Location click refreshes the pin; the overlay does not track you continuously by itself.

---

## Using the Control Center

Open or focus the **Control Center** window anytime from the tray/task area or by bringing IsleMap to the front.

### Overlay

Tune how the radar looks and behaves:

- **Style** — player icon, colors, chrome
- **Frame** — stone / Evrima-style frame alignment and scale
- **HUD** — compass, radar sweep, on-screen guides
- **Places** — show/hide labels, place style, max distance radius
- **Opacity** — how transparent the overlay is over the game
- **Layout** — size, monitor, position on screen

Use the live preview in Control Center when available so you can see changes before you commit to them in-game.

### Destination

- Click the destination map to drop a waypoint
- Name the waypoint and choose what shows on the overlay (pin, label, remaining distance)
- Remaining distance uses **kilometers** at 1 km and above, and **meters** below that
- Clear or change the waypoint whenever you want a new target

### Game & hotkeys

- **Hotkeys** — rebind Play/Map mode, filters, zoom, and other shortcuts
- **Setup** — EAC-safe usage reminders and system notes
- **Filters** — quick reference for place filter keys (All / Water / Areas / Landmarks)
- **Data** — notes about bundled Gateway place labels shipped with the app

### Tutorial

- Start or replay the **guided tour**
- The tour highlights real controls in Control Center and explains Asset Location, overlay tabs, monitors, and waypoints
- You can skip or exit at any time (**Esc**)

### Developer

- Credits for **Balake Gaming**
- Social IDs (Discord ID / TikTok)
- **Updates** panel — check this GitHub repo for a newer release, download, and restart to install (installed builds)

---

## Play / Map mode

| Mode | Behavior |
| --- | --- |
| **Play mode** | Overlay ignores mouse clicks so you can play through it |
| **Map mode** | Overlay accepts clicks (for interacting with the radar UI when needed) |

Toggle with the hotkey shown under **Game & hotkeys → Hotkeys** (default is set in Control Center; you can change it there).

---

## Updates

Installed copies of IsleMap use **this repository’s GitHub Releases** as the update source.

### For players

When a newer release is available, IsleMap **requires the update**: the map stays locked, Control Center shows a blocking update screen, and download starts automatically. Choose **Restart & install** when it finishes (or **Quit IsleMap**).

You can also open **Control Center → Developer → Updates** to retry a download or open the release page.

Newest installer: https://github.com/AxcelPrince101/IsleMap/releases/latest

### What “up to date” means

IsleMap compares your installed version to the latest **published release** on GitHub (for example `v1.0.5`). Only official Releases with the Windows installer and updater metadata count as update feeds.

---

## Publishing a new version (maintainer)

Use this when **Balake Gaming / the repo owner** ships a new public build. Players do not need these steps.

### Before you publish

1. Decide the new version number (example: `1.0.1`, then `1.1.0`).
2. Make sure the project on your PC matches what you want players to receive.
3. Sign in to GitHub on that PC with access to **AxcelPrince101/IsleMap** (GitHub CLI or a token with `repo` scope).

### Publish steps

1. Set the new version number in the app’s package version field (same number players will see as `vX.Y.Z`).
2. Save your work to GitHub (`main`).
3. On the project machine, run the release publish command for Windows (`npm run release`).  
   This builds the **IsleMap-Setup** installer and uploads it to a GitHub Release, including the updater feed file (`latest.yml`) that installed clients check.
4. Confirm the release page looks correct:  
   https://github.com/AxcelPrince101/IsleMap/releases  
   You should see the new tag, release notes, the `.exe` installer, and updater files.

### After publishing

- Installed players can use **Developer → Updates → Check for updates**
- New players should use **Releases → Latest** and download the new setup EXE
- Keep release notes clear: what changed for players, any new hotkeys, and any setup tips

### Optional: build without publishing

To create an installer on your PC only (no GitHub upload), use the local Windows build command (`npm run dist`). The file appears under the project’s `dist` folder as **IsleMap-Setup-…exe**. Use the full release command when you want everyone to receive the update through GitHub.

---

## Safety & fair play

IsleMap is designed for Easy Anti-Cheat environments:

- No injection into The Isle
- No memory reading or process hooks
- Location comes only from clipboard text you copy in-game with **Asset Location**
- Use **Borderless Windowed** for a stable overlay

**Disclaimer:** IsleMap is a fan-made utility. It is **not** affiliated with The Isle, Afterthought LLC, or any third-party map website. Use at your own responsibility and follow the game’s rules and Terms of Service.

---

## Support & socials

- **TikTok:** [@balakestream](https://www.tiktok.com/@balakestream)
- **Issues / releases:** [github.com/AxcelPrince101/IsleMap](https://github.com/AxcelPrince101/IsleMap)
- **Creator ID:** `balake101`

---

## License

All rights reserved © Balake Gaming.
