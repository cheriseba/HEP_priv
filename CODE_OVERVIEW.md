# CODE OVERVIEW

Diese Datei ist die schnelle Orientierung fuer die Abgabe. Sie zeigt, wo Inhalte liegen, welche Funktionen in `main.js` die Interaktion steuern und welche Stellen bei spaeteren Aenderungen besonders wichtig sind.

## 1) Gesamtarchitektur

Die Anwendung ist eine statische One-Page-Seite. `index.html` strukturiert die Inhalte, `styles.css` bzw. die Dateien unter `styles/` regeln Layout und Responsive-Verhalten, und `main.js` laedt SVGs, steuert Interaktionen, Filter, Slideshow-Logik und das gefuehrte Scrolling.

## 2) Inhalte in `index.html`

- `#hauptgrafik`: Einstieg mit interaktiver Haupt-SVG und den Verknuepfungen zu den weiteren Bereichen.
- `#einleitung`: kurze Einfuehrung mit Reveal-Effekt.
- `#gelingendes-studium`: GLSTU-SVG plus narrative Textseiten.
- `#querschnittsthemen`: Einleitung und manuelle Slideshow.
- `#ziele-meilensteine`: Zielring, Meilenstein-Karten und Teilziele-Timeline.
- `#kurzportrait`: dreistufiger Scroll-Aufbau mit Text- und Grafikbereich.
- `#wissensspeicher-hawk`: mehrstufiger Bereich mit SVG-Reveal und Hotspot.

## 3) Wichtige JavaScript-Bloecke

### Bootstrap und Ladepfad

- `initializeApp()`: zentraler Startpunkt fuer alle Initialisierer.
- SVG-Ladepfade am Dateianfang: laden die Hauptgrafik, GLSTU, Karte und Wissensspeicher nach.
- `isolateInlineSvg()`: macht IDs und Klassen in geladenen SVGs eindeutig, damit es keine Kollisionen gibt.

### SVG- und Inhaltsinteraktion

- `initSVGInteractions()`: Hover, Klick und Scrollsprung in der Hauptgrafik.
- `initGLSTUInteractions()`: steuert die Overlays in der GLSTU-SVG und passt das mobile Layout an.
- `initKarteInteractions()`: schaltet Stadt-Layer und Infokarten im Kurzportrait.
- `initWissensspeicherHotspotInteraction()`: macht den Hotspot in der Wissensspeicher-Grafik anklickbar.

### Scrollytelling und Abschnittslogik

- `initSectionSnapScrolling()`: globales Snap-Scrolling zwischen Hauptabschnitten und Unterzielen.
- `initMobileOrientationGate()`: blockiert auf kleinen Geraeten im Hochformat die problematische Ansicht.
- `initMobileHeaderAutoHide()` und `initTimelineMenu()`: steuern die mobile Navigation im Scrollverhalten.
- `initKurzportraitStickyTextObserver()` und `initKurzportraitEntranceAnimation()`: regeln Textwechsel und Sichtbarkeit im Kurzportrait.
- `initWissensspeicherEntranceAnimation()` und `initWissensspeicherStepsReveal()`: blenden den Wissensspeicher stufenweise ein.

### Teilziele und Meilensteine

- `initTeilzieleFilter()`: verwaltet Dropdown, Tabs, SVG-Zieltrigger und die sichtbaren Jahreskarten.
- `initTeilzieleTimeline()`: macht aus vertikalem Mausrad horizontales Scrollen in der Timeline.
- `initTeilzieleRowSync()`: gleicht die Hoehen der Tabellenzeilen nach Filterwechseln an.
- `initTeilzieleChecks()`: formatiert die Teilziel-Liste und liest den Check-Status aus JSON.
- `initMeilensteineCardsReveal()`: setzt die Meilenstein-Karten per IntersectionObserver sichtbar.

## 4) Styles: Schnellorientierung

- `styles/00-tokens.css` bis `styles/03-layout.css`: Basis, Tokens, Header und Seitenlayout.
- `styles/10-hauptgrafik.css`: Hauptgrafik und Intro-Animationen.
- `styles/20-gelingendes-studium.css` und `styles/30-einleitung-qst.css`: GLSTU und Einleitung/Querschnittsthemen.
- `styles/31-fullscreen-slideshow.css`: Vollbild-Slideshow.
- `styles/32-querschnittsthemen.css`: Querschnittsthemen-Styling.
- `styles/35-wissensspeicher.css`: Wissensspeicher-Bereich.
- `styles/40-kurzportrait.css`: Kurzportrait-Aufbau und sticky Bereiche.
- `styles/50-meilensteine-teilziele.css`: Meilensteine, Teilziele und Timeline.
- `styles/90-responsive-overrides.css`: hoehen- und breitenbezogene Korrekturen fuer kleinere Viewports.

## 5) Typische Aenderungen

- Neue Textseite in GLSTU oder Kurzportrait:
  - neue `article`-Node mit der passenden Klasse in `index.html` anlegen.
  - die JS-Funktionen lesen die Seiten automatisch ueber `querySelectorAll()` ein.

- Andere Snap-Reihenfolge:
  - in `initSectionSnapScrolling()` die Ziel-Liste anpassen.

- Teilziele-Filter anders vorbelegen:
  - in `initTeilzieleFilter()` den Initialwert anpassen.
  - den Default-Wert im passenden HTML-Select mitziehen.

## 6) Wichtige Vorsichtspunkte

- SVG-IDs nicht umbenennen, ohne die Referenzen in `main.js` zu aktualisieren.
- Scroll-Zwischenschritte wie `.kurzportrait-top` oder `#teilziele-bereich` nicht entfernen, weil sie Snap-Ziele sind.
- Bei neuen interaktiven Elementen immer pruefen, ob `shouldIgnoreGlobalSnap()` erweitert werden muss.
