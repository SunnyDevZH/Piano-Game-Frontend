<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Piano Game - Canvas-basiertes React Spiel

Dies ist ein React-Projekt mit Vite und TypeScript, das ein Canvas-Element für Spiele-Entwicklung verwendet.

## Projekt-Kontext
- **Framework**: React mit TypeScript
- **Build Tool**: Vite
- **Canvas**: HTML5 Canvas für Spiel-Rendering
- **Stil**: Moderne CSS mit Glasmorphismus-Effekten

## Entwicklungsrichtlinien
- Verwende TypeScript für alle Komponenten
- Befolge React Hooks-Patterns (useState, useEffect, useRef)
- Canvas-Operationen sollten in useEffect und requestAnimationFrame organisiert werden
- Implementiere saubere Komponentenarchitektur mit klaren Props-Interfaces
- Verwende moderne CSS-Features für ansprechende UI

## Canvas-Spiel Struktur
- Spiele-Logik sollte in separaten Komponenten organisiert werden
- Verwende useRef für Canvas-Referenzen und Animation-Frames
- Implementiere Game-Loop mit requestAnimationFrame
- Halte Spiel-State in React-State oder useRef für Performance-kritische Daten

## Code-Stil
- Funktionale Komponenten mit TypeScript
- Klare Interface-Definitionen für Props und State
- Aussagekräftige Variablen- und Funktionsnamen
- Kommentiere komplexe Canvas-Operationen und Spiel-Mechaniken
