# HEP - Schnellstart fuer Code-Anpassungen

Dieses Projekt ist eine statische One-Page-Anwendung mit interaktiven SVGs und gesteuertem Scrollytelling.

## Projektstruktur

- index.html: Seitenstruktur, inhaltliche Abschnitte, semantische Marker und IDs.
- styles.css: gesamtes Layout, Animationen, Responsive-Verhalten und Abschnittsdesign.
- main.js: Interaktionen, SVG-Laden, Filterlogik, Narrative-Textsteuerung, globales Snap-Scrolling.
- QST_Bilder/: Bildmaterial fuer die Querschnittsthemen-Slideshow.

## Wichtige Bereiche fuer schnelle Anpassungen

- Navigation/Abspruenge: Links im Header in index.html.
- Teilziele-Filter und Ring-zu-Ziel-Verknuepfung: initTeilzieleFilter und initZielInteractions in main.js.
- Abschnittsweises Scrollverhalten: initSectionSnapScrolling in main.js.
- GLSTU/Kurzportrait Textseiten (seitenweise Scrollimpulse):
	- initGLSTUScrollNarrative in main.js
	- initKurzportraitScrollNarrative in main.js
- Timeline-Design und Kartenoptik: Abschnitt "Teilziele" in styles.css.

## Entwickler-Hinweis

Fuer eine detaillierte Code-Landkarte siehe CODE_OVERVIEW.md.