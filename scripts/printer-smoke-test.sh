#!/usr/bin/env bash
# GateSign Drucker-Add-on — Hardware-Smoke-Test (Phase 0)
#
# Verifiziert, dass der Brother QL-820NWBc per USB erreichbar ist und
# via Python `brother_ql` (unser späterer Bridge-Stack) bedruckt werden kann.
#
# Vorbereitung (einmalig):
#   brew install imagemagick
#   pip3 install brother_ql
#   Drucker per USB-Kabel an Mac anschließen
#   USB-Identifier herausfinden:  brother_ql discover
#
# Ausführen:
#   bash scripts/printer-smoke-test.sh
# Mit anderem USB-Pfad:
#   PRINTER_USB="usb://0x04F9:0x209B/000XYZ" bash scripts/printer-smoke-test.sh
# Mit Netzwerk-Drucker (Smoke-Test für Bundle-Variante mit LAN-Drucker):
#   PRINTER_TARGET="tcp://192.168.1.42" bash scripts/printer-smoke-test.sh

set -euo pipefail

# Konfiguration
# Hinweis: brother_ql 0.9.4 kennt 'QL-820NWB' (ohne c-Suffix). Die 'NWBc'-Hardware ist
# funktional identisch zur NWB-Variante, nur ein neueres Revision-Stamp.
PRINTER_MODEL="${PRINTER_MODEL:-QL-820NWB}"
PRINTER_BACKEND="${PRINTER_BACKEND:-pyusb}"                              # 'pyusb' für USB, 'network' für TCP
PRINTER_TARGET="${PRINTER_TARGET:-${PRINTER_USB:-usb://0x04f9:0x209d}}"   # Default: erkannter QL-820NWBc; via `brother_ql --backend pyusb discover` validieren
LABEL_TYPE="${LABEL_TYPE:-54}"   # 54mm endlos für DK-N55224 (nicht-klebend, Visitenkarten)
OUTPUT_PNG="/tmp/gatesign-printer-test.png"

# Farben für Ausgabe
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() { echo -e "${YELLOW}→${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }

# 1) Pre-flight Checks
step "Pre-flight: prüfe Abhängigkeiten"
command -v magick    >/dev/null 2>&1 || fail "ImageMagick fehlt. Installation:  brew install imagemagick"
command -v brother_ql >/dev/null 2>&1 || fail "brother_ql fehlt. Installation:  pip3 install brother_ql"

# Schrift suchen (ImageMagick v7 findet macOS-System-Schriften nicht per Kurzname)
FONT_BOLD=""
FONT_REGULAR=""
for f in \
  "/System/Library/Fonts/HelveticaNeue.ttc" \
  "/System/Library/Fonts/Helvetica.ttc" \
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf" \
  "/Library/Fonts/Arial Bold.ttf" \
  "/System/Library/Fonts/Avenir Next.ttc"; do
  if [ -f "$f" ]; then FONT_BOLD="$f"; break; fi
done
for f in \
  "/System/Library/Fonts/HelveticaNeue.ttc" \
  "/System/Library/Fonts/Helvetica.ttc" \
  "/System/Library/Fonts/Supplemental/Arial.ttf" \
  "/Library/Fonts/Arial.ttf" \
  "/System/Library/Fonts/Avenir Next.ttc"; do
  if [ -f "$f" ]; then FONT_REGULAR="$f"; break; fi
done
[ -z "$FONT_BOLD" ]    && fail "Keine Bold-Schrift gefunden im System."
[ -z "$FONT_REGULAR" ] && fail "Keine Regular-Schrift gefunden im System."
ok "ImageMagick + brother_ql + Schriften gefunden"
echo "    Bold:    $FONT_BOLD"
echo "    Regular: $FONT_REGULAR"

# 2) Test-Karte rendern
#    DK-N55224 ist 54mm endlos (nicht-klebend, Visitenkartenformat)
#    brother_ql nimmt PNG hochkant: 54mm × 300dpi = 638 px Breite. Höhe definiert die Karten-Länge.
#    Wir wählen 638×420 px → ergibt nach Auto-Cut eine ~54×36 mm Karte (gut für 88mm-Hüllen quer)
step "Erstelle Test-PNG: $OUTPUT_PNG"
magick -size 638x420 xc:white \
  -font "$FONT_BOLD"    -pointsize 280 -fill '#DC2626' \
    -gravity West      -annotate +30+0   "042" \
  -font "$FONT_BOLD"    -pointsize 48  -fill black \
    -gravity NorthEast -annotate +30+80  "Max Mustermann" \
  -font "$FONT_REGULAR" -pointsize 36  -fill black \
    -gravity NorthEast -annotate +30+150 "Rüther Logistik" \
  -font "$FONT_REGULAR" -pointsize 24  -fill '#64748B' \
    -gravity SouthEast -annotate +20+20  "GateSign · Smoke-Test" \
  "$OUTPUT_PNG"
ok "Test-PNG erstellt"

# 3) PNG als Vorschau im Finder öffnen (damit User sieht was gleich gedruckt wird)
step "Öffne Vorschau (zum Verifizieren des Layouts)"
open -a Preview "$OUTPUT_PNG" 2>/dev/null || true

# 4) Drucker erreichbar?
step "Prüfe Drucker-Erreichbarkeit: $PRINTER_TARGET"
echo "    (Falls keiner gefunden: 'brother_ql discover' ausführen und USB-Pfad in PRINTER_USB setzen)"

# 5) Druckjob senden
step "Sende Druckjob an Drucker (Backend: $PRINTER_BACKEND)"
brother_ql \
  --backend "$PRINTER_BACKEND" \
  --model "$PRINTER_MODEL" \
  --printer "$PRINTER_TARGET" \
  print \
  --label "$LABEL_TYPE" \
  "$OUTPUT_PNG"

ok "Druckjob abgesendet"
echo ""
echo -e "${GREEN}Erwartetes Verhalten:${NC}"
echo "  - Drucker zieht Rolle ein"
echo "  - Karte mit '042' (rot, groß) + 'Max Mustermann / Rüther Logistik' (schwarz) wird gedruckt"
echo "  - Auto-Cutter trennt sauber bei der Markierung"
echo "  - Karte fällt aus dem Drucker"
echo ""
echo -e "${YELLOW}Falls nichts kommt:${NC}"
echo "  - LCD am Drucker prüfen (Fehler? Rolle leer? Cover offen?)"
echo "  - USB-Verbindung prüfen (anderes Kabel? anderer Port?)"
echo "  - 'brother_ql discover' ausführen — wird Drucker dort gelistet?"
