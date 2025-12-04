# Melody-Rush

Ein interaktives Spiel, das mit React, TypeScript und HTML5 Canvas entwickelt wurde. Das Spiel zeigt 4 Spalten mit herabfallenden Noten, die der Spieler mit den Tasten A, S, D, F treffen muss.

## 🎮 Features

- **4 Spalten Gameplay**: Vier verschiedene Spalten mit unterschiedlichen Farben
- **Guitar Hero-Style**: Noten fallen herab und müssen zur richtigen Zeit getroffen werden
- **Keyboard-Steuerung**: Verwende die Tasten A, S, D, F für die jeweiligen Spalten
- **Bewertungssystem**: PERFECT, GOOD oder MISS je nach Timing-Genauigkeit
- **Combo-System**: Aufeinanderfolgende Treffer erhöhen den Combo-Multiplikator
- **Verschiedene Songs**: Auswählbare Demo-Songs mit unterschiedlichen BPM
- **Visuelle Effekte**: Leuchtende Lane-Highlights und Flash-Effekte bei Treffern
- **Responsive Design**: Modern gestaltetes UI mit Glasmorphismus-Effekten

## 🚀 Installation und Ausführung

### Voraussetzungen
- Node.js (Version 20.10.0 oder höher)
- npm oder yarn

### Setup
```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Build für Produktion
npm run build

# Preview der Produktion-Build
npm run preview
```
### Setup für Arduino Steuerung

**Material**: 
- Arduino Board Nano32
- Modulino Pixels
- Modulino Distance
- USB-C Kabel
- 4 Platten aus dem 3D Drucker
- Qwiic/JST-SH-Kabel

**Foto**: 

1. **Code**: Arduino Ordner -> main.py und 
2. **Main Board**: Lade den Code auf Root ebene auf dein Arduino Nano32

## 🎯 Spielanleitung

1. **Teams eingeben**: Dein Teamnamen eingeben
2. **Song auswählen**: Wähle einen der verfügbaren Demo-Songs aus
3. **Spiel starten**: Klicke auf "Start" um das Spiel zu beginnen
4. **Noten treffen**: Drücke A, S, D, F wenn die Noten die Ziellinie erreichen
5. **Bewertung erhalten**: PERFECT (±0.07s), GOOD (±0.14s) oder MISS
6. **Combo aufbauen**: Aufeinanderfolgende Treffer erhöhen den Score-Multiplikator

### Steuerung
- **Taste A**: Spalte 1 (Rot)
- **Taste S**: Spalte 2 (Orange)  
- **Taste D**: Spalte 3 (Grün)
- **Taste F**: Spalte 4 (Blau)

- **Oder mit den Arduino Tasten**: Tasten für A / S / D / F

## 🛠️ Technische Details

### Verwendete Technologien
- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **HTML5 Canvas** für das Game-Rendering
- **CSS3** mit modernen Features (Gradients, Backdrop-Filter)

## 📄 Lizenz

Dieses Projekt ist als Lernprojekt erstellt und kann frei verwendet und modifiziert werden.
