# Besucherkarten-Drucker einrichten

Diese Anleitung richtet sich an GateSign-Kunden mit gebuchtem **Drucker-Add-on**.
Sie führt vom ausgepackten Drucker bis zur ersten automatisch gedruckten
Besucherkarte. Rechnen Sie mit etwa 20 Minuten.

> **Kurzfassung:** Drucker per USB an das Bridge-Gerät anschließen → Bridge-Software
> starten → im Admin-Dashboard einen Kopplungs-Code erzeugen → Code in der Bridge
> eingeben. Ab dann druckt jede Anmeldung am Terminal automatisch eine Karte.

---

## 1. Was Sie brauchen

| Komponente | Empfehlung |
|---|---|
| **Drucker** | Brother QL-820NWBc (oder QL-810W) |
| **Etiketten** | Brother **DK-N55224** — 54 mm Endlosrolle, nicht-klebend |
| **Kartenhüllen** | Standard-Visitenkartenhüllen 88 × 55 mm |
| **Bridge-Gerät** | Ein kleiner Computer im selben Netzwerk: Touch-PC, Mini-PC oder Raspberry Pi |

> **Wichtig:** Verwenden Sie nur Original-Brother-Etiketten. Der QL-820NWBc erkennt
> die Rolle über einen Funk-Chip (RFID) und verweigert Drittanbieter-Material.

### Warum ein „Bridge-Gerät"?

Der Drucker spricht ein technisches Protokoll, das ein reiner Browser (z. B. auf
einem iPad) nicht direkt ansteuern kann. Deshalb übernimmt ein kleines Programm —
die **Print-Bridge** — die Verbindung. Sie läuft auf einem Gerät mit echtem
Betriebssystem (Windows, Linux oder macOS), an dem der Drucker per USB-Kabel hängt.

**Die einfachste und stabilste Variante:** Ein Touch-PC ist gleichzeitig das
Anmelde-Terminal *und* das Bridge-Gerät — der Drucker hängt per Kabel direkt daran.
Ein Gerät, ein Kabel, fertig. Alternativ steht ein kleiner Raspberry Pi neben einem
iPad-Terminal und versorgt den Drucker.

---

## 2. Drucker anschließen

1. Drucker auspacken, Etikettenrolle **DK-N55224** einlegen, Deckel schließen.
2. Stromkabel anschließen, Drucker einschalten.
3. Drucker per **USB-Kabel** mit dem Bridge-Gerät verbinden.
   *(WLAN ist nicht nötig — die Bridge spricht den Drucker direkt über USB an.)*
4. Eine Testseite über die Drucker-Taste ziehen, um Rolle und Cutter zu prüfen.

---

## 3. Print-Bridge installieren

Die Print-Bridge ist ein kleines Programm, das wir Ihnen bereitstellen. Je nach
gebuchtem Bundle ist sie auf dem Gerät bereits vorinstalliert — dann überspringen
Sie diesen Schritt.

Falls Sie selbst installieren (technische Person erforderlich), folgen Sie der
ausführlichen Anleitung in `print-bridge/README.md`. Kurz:

```bash
cd print-bridge
npm install
```

Voraussetzungen auf dem Bridge-Gerät: Node 20+, Python 3 mit `brother_ql`
(`pip3 install 'Pillow<10' brother_ql`) und – für USB – `libusb`.

---

## 4. Kopplungs-Code erzeugen (Admin-Dashboard)

1. Melden Sie sich im GateSign-Dashboard an.
2. Gehen Sie zu **Abrechnung** (`/IHR-SLUG/admin/billing`).
3. Im Bereich **„Drucker einrichten"** sehen Sie Ihre Terminals.
4. Klicken Sie beim gewünschten Terminal auf **„Print-Bridge koppeln"**.
5. Es erscheint ein **8-stelliger Code** (z. B. `K7P2RXM4`).
   Dieser Code ist **10 Minuten** gültig und kann nur **einmal** verwendet werden.

---

## 5. Bridge mit dem Code koppeln

Auf dem Bridge-Gerät:

```bash
cd print-bridge
npm run pair
```

Der Assistent:
1. sucht automatisch den angeschlossenen Brother-Drucker,
2. fragt nach dem **Kopplungs-Code** aus Schritt 4,
3. speichert die Zugangsdaten sicher auf dem Gerät.

Danach die Bridge dauerhaft starten:

```bash
npm run start
```

Im Dashboard wechselt der Status des Terminals jetzt auf **„Online"** (grün).

---

## 6. Erste Karte drucken (Funktionstest)

1. Öffnen Sie das Anmelde-Terminal.
2. Führen Sie eine normale Anmeldung durch.
3. Nach Abschluss erscheint auf dem Bildschirm eine große **Tagesnummer**, und
   wenige Sekunden später fällt die gedruckte Karte aus dem Drucker.
4. Stecken Sie die Karte in eine Hülle und geben Sie sie dem Besucher.

**Abmelden:** Beim Verlassen tippt der Besucher am Terminal auf **„Abmelden"** und
gibt seine Tagesnummer ein. Vergessene Karten werden jede Nacht automatisch
geschlossen.

---

## 7. Status & Wartung

Im Dashboard unter **„Drucker einrichten"** sehen Sie pro Terminal:

| Anzeige | Bedeutung |
|---|---|
| 🟢 **Online** | Bridge ist verbunden, alles bereit |
| ⚪ **Offline** | Bridge gerade nicht erreichbar (Gerät aus / kein Netz) |
| 🟡 **Kein Papier** | Etikettenrolle leer oder Deckel offen |
| 🔴 **Fehler** | Druckproblem – siehe Bridge-Protokoll |

**Etiketten nachbestellen:** Brother **DK-N55224**. Eine Rolle reicht für mehrere
hundert Karten. Bestellen Sie rechtzeitig nach, bevor die Rolle leer ist.

---

## Häufige Fragen

**Der Drucker wird nicht gefunden.**
USB-Kabel und Port prüfen, Drucker aus- und wieder einschalten, dann `npm run pair`
erneut starten.

**Der Code ist abgelaufen.**
Kein Problem – im Dashboard einfach einen neuen Code erzeugen (Schritt 4).

**Die Karte druckt schief oder zu kurz.**
Bitte den GateSign-Support kontaktieren. Es handelt sich um eine
Konfigurationseinstellung, die wir aus der Ferne anpassen.

**Müssen wir den Drucker ins WLAN bringen?**
Nein. Der Drucker hängt per USB am Bridge-Gerät – nur das Bridge-Gerät selbst
braucht eine Internet-Verbindung.

---

*Detaillierte technische Hinweise zur Bridge (Konfiguration, Troubleshooting,
TCP-Drucker) finden Installateure in `print-bridge/README.md`.*
