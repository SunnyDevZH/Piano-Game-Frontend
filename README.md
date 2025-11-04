# Piano Game - Canvas-basiertes React Spiel

Ein interaktives Piano-Spiel, das mit React, TypeScript und HTML5 Canvas entwickelt wurde. Das Spiel zeigt 4 Spalten mit herabfallenden Noten, die der Spieler mit den Tasten 1-4 treffen muss.

## 🎮 Features

- **4 Spalten Gameplay**: Vier verschiedene Spalten mit unterschiedlichen Farben
- **Kontinuierliche Note-Generierung**: Noten fallen kontinuierlich von oben herab
- **Keyboard-Steuerung**: Verwende die Tasten 1, 2, 3, 4 für die jeweiligen Spalten
- **Score-System**: Sammle Punkte durch das Treffen der Noten zur richtigen Zeit
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

## 🎯 Spielanleitung

1. **Spiel starten**: Klicke auf "Start" um das Spiel zu beginnen
2. **Noten treffen**: Drücke die Tasten 1-4 wenn die Noten die Ziellinie erreichen
3. **Punkte sammeln**: Jede getroffene Note gibt 10 Punkte
4. **Reset**: Verwende "Reset" um das Spiel zurückzusetzen

### Steuerung
- **Taste 1**: Spalte 1 (Rot)
- **Taste 2**: Spalte 2 (Orange)
- **Taste 3**: Spalte 3 (Grün)
- **Taste 4**: Spalte 4 (Blau)

## 🛠️ Technische Details

### Verwendete Technologien
- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **HTML5 Canvas** für das Game-Rendering
- **CSS3** mit modernen Features (Gradients, Backdrop-Filter)

### Projekt-Struktur
```
src/
├── components/
│   └── GameCanvas.tsx    # Haupt-Game-Komponente
├── App.tsx              # Haupt-App-Komponente
├── App.css             # Haupt-Styling
└── main.tsx            # Entry Point
```

### Game-Mechaniken
- **Note-Spawning**: Neue Noten werden alle 2 Sekunden generiert
- **Kollisionserkennung**: Hit-Zone am unteren Bildschirmrand
- **Animation-Loop**: 60 FPS mit requestAnimationFrame
- **State-Management**: React Hooks für UI-State, useRef für Game-State

## 🎨 Anpassungen

Das Spiel kann einfach erweitert werden:

- **Geschwindigkeit**: Ändere `NOTE_SPEED` für schnellere/langsamere Noten
- **Spawn-Rate**: Modifiziere `SPAWN_INTERVAL` für häufigere/seltenere Noten
- **Farben**: Passe `COLUMN_COLORS` für andere Farbschemata an
- **Anzahl Spalten**: Ändere `COLUMNS` für mehr/weniger Spalten

## 📝 Entwicklung

### Debugging
- Browser-Konsole zeigt Hit-Events
- React DevTools für Component-State
- Canvas-Rendering kann direkt im Browser inspiziert werden

### Erweiterungsideen
- [ ] Combo-System für aufeinanderfolgende Treffer
- [ ] Verschiedene Schwierigkeitsstufen
- [ ] Sound-Effekte und Musik
- [ ] Partikel-Effekte für visuelle Verbesserungen
- [ ] Highscore-System mit Local Storage
- [ ] Mobile Touch-Steuerung

## 🔧 Build & Deployment

```bash
# Production Build erstellen
npm run build

# Build lokal testen
npm run preview
```

Die Build-Ausgabe befindet sich im `dist/` Ordner und kann auf jedem statischen Web-Server deployed werden.

## 📄 Lizenz

Dieses Projekt ist als Lernprojekt erstellt und kann frei verwendet und modifiziert werden.
