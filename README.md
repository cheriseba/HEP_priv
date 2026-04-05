# HEP - Projektuebersicht

Dies ist eine statische One-Page-Anwendung mit interaktiven SVGs, gefuehrtem Scrollytelling und mehreren responsiven Inhaltsbereichen. Die Seite laedt ihre wichtigsten Grafiken zur Laufzeit nach und koppelt die sichtbaren Bereiche ueber JavaScript aneinander.

## Inhalt

- `#hauptgrafik`: interaktiver Einstieg mit Verknuepfung zu den weiteren Bereichen.
- `#einleitung`: kurze Einfuehrung mit Reveal-Animation.
- `#gelingendes-studium`: GLSTU-SVG mit narrativen Textseiten.
- `#querschnittsthemen`: Einleitung und manuelle Slideshow.
- `#ziele-meilensteine`: Zielring, Meilensteine und Teilziele-Timeline.
- `#kurzportrait`: dreiteiliger Scrollbereich mit Kartenansicht.
- `#wissensspeicher-hawk`: strukturierter Info-Bereich mit SVG-Reveal.

## Projektstruktur

- `index.html`: Seitenstruktur, Abschnitts-IDs und semantische Marker.
- `styles.css`: Einbindung der CSS-Module.
- `styles/`: Basis, Layout, Abschnittsdesign, Animationen und Responsive-Overrides.
- `main.js`: SVG-Laden, Interaktionen, Filter, Scrollsteuerung und Animationen.
- `assets/images/`: SVGs, Logos, Fotos und weitere Grafiken.
- `teilziele-checks.json`: Statusdaten fuer die Teilziel-Liste.

## Wichtige Funktionen in `main.js`

- `initializeApp()`: zentraler Startpunkt aller Initialisierer.
- `initSectionSnapScrolling()`: fuert das globale Springen zwischen den Abschnitten aus.
- `initTeilzieleFilter()`: setzt den aktiven Ziel-Filter und synchronisiert Tabs, Karten und SVG-Trigger.
- `initGLSTUInteractions()`: steuert die GLSTU-Overlays und das mobile Overflow-Verhalten.
- `initKurzportraitStickyTextObserver()`: wechselt die Kurzportrait-Texte und synchronisiert die Anzeige.
- `initWissensspeicherStepsReveal()`: blende die Wissensspeicher-Schritte nacheinander ein.

## Anpassungen

- Neue oder verschobene Inhalte immer zuerst in `index.html` und danach in den zugehoerigen Initialisierern in `main.js` nachziehen.
- Bei SVG-Aenderungen darauf achten, dass die erwarteten IDs weiter vorhanden sind, weil sie zur Laufzeit gemappt werden.
- Bei Layout-Aenderungen in den Abschnittsdateien unter `styles/` die zugehoerigen responsive Regeln mitpruefen.

## Doku

Die detaillierte Code-Landkarte liegt in [CODE_OVERVIEW.md](CODE_OVERVIEW.md).