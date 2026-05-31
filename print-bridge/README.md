# GateSign Print-Bridge

Lokaler Node-Service, der das GateSign-Backend pollt und Druckjobs an einen Brother QL-Drucker weitergibt. Eine Bridge bedient genau ein GateSign-Terminal.

## Voraussetzungen

- **Node 20+**
- **Python 3** mit `brother_ql` und Pillow < 10:
  ```bash
  pip3 install 'Pillow<10' brother_ql
  ```
- **libusb** (für USB-Drucker):
  - macOS: `brew install libusb`
  - Debian/Pi: `apt install libusb-1.0-0`
- **PATH** muss `brother_ql` finden — bei macOS-Default-Install evtl.:
  ```bash
  echo 'export PATH="$HOME/Library/Python/3.9/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```

## Installation

```bash
cd print-bridge
npm install
```

## Pairing

1. Im Admin-Dashboard von GateSign: `/<dein-slug>/admin/billing` → Drucker-Add-on → **Print-Bridge koppeln** → 8-stelligen Code notieren (TTL 10 Min).
2. Pairing-Flow starten:
   ```bash
   # Lokal:
   npm run pair

   # Gegen Production:
   GATESIGN_URL=https://www.gatesign.de npm run pair
   ```
3. Der Wizard:
   - sucht USB-Drucker via `brother_ql discover`
   - fragt nach Pairing-Code
   - speichert API-Token in `~/.gatesign-bridge/config.json` (chmod 600)

## Starten

```bash
npm run start
```

Die Bridge pollt alle 3 Sekunden den Backend-Endpoint `/api/print-agent/jobs`, druckt jeden Job via `brother_ql` an den konfigurierten USB- oder TCP-Drucker und meldet den Status zurück.

Bei Drucker-Problemen (Rolle leer, Cover offen) wird der Job in der Queue gelassen und beim nächsten Poll automatisch wiederholt. Bei unerreichbarem Backend wird mit exponentiellem Backoff bis 30 s nachgehakt.

## Weitere Commands

```bash
npm run status   # zeigt aktuelle Konfiguration
npm run reset    # löscht config.json (vor erneutem Pairing)
```

## Konfiguration

`~/.gatesign-bridge/config.json` (chmod 600):

```json
{
  "baseUrl": "https://www.gatesign.de",
  "apiToken": "uuid…",
  "bridgeId": "uuid…",
  "terminalId": "uuid…",
  "companyId": "uuid…",
  "printerTarget": "usb://0x04f9:0x209d",
  "printerModel": "QL-820NWB",
  "pollIntervalMs": 3000,
  "rotateDegrees": 90
}
```

## Troubleshooting

| Fehler | Lösung |
|---|---|
| `brother_ql discover` findet keinen Drucker | USB-Kabel/Port prüfen, `system_profiler SPUSBDataType \| grep -i brother` (macOS) |
| `Backend None not implemented` | brother_ql-CLI mit `--backend pyusb` aufrufen — Bridge tut das automatisch |
| `ANTIALIAS` AttributeError | Pillow ≥10 inkompatibel: `pip3 install 'Pillow<10' --force-reinstall` |
| `QL-820NWBc is not one of …` | brother_ql 0.9.4 kennt nur `QL-820NWB` (ohne `c`) — Modell-Name beim Pairing korrigieren |
| Karte druckt 90° gedreht | `rotateDegrees` in config.json setzen (default 90, alternativ 270) |
| Karte druckt zu kurz | Aspect-Ratio im Backend-Renderer prüfen (`src/lib/card-renderer.tsx`) |

## Hardware

Empfohlen:
- **Drucker:** Brother QL-820NWBc (oder QL-810W)
- **Material:** Brother DK-N55224 (54 mm endlos, nicht-klebend) — kein Drittanbieter wegen RFID-Erkennung
- **Hüllen:** Standard 88 × 55 mm Visitenkartenhüllen
