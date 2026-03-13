# CODE OVERVIEW

Diese Datei hilft beim schnellen Einarbeiten in die wichtigsten Logik- und Stylingbereiche.

## 1) Architektur in einem Satz

Die Seite wird ueber index.html strukturiert, ueber styles.css gestaltet und ueber main.js interaktiv gemacht (SVG-Interaktionen, Filter, Slideshow und gesteuertes Scrolling).

## 2) HTML: Wo ist was?

- #hauptgrafik: Einstieg mit interaktiver Haupt-SVG.
- #einleitung: Intro-Textkarte mit Reveal-Effekt.
- #gelingendes-studium: GLSTU-SVG + narrative Textseiten (.glstu-text-page).
- #querschnittsthemen: Textintro + Bildslideshow.
- #ziele-meilensteine: Ringgrafik + Zielkarten + Teilziele-Timeline.
- #kurzportrait: drei Scroll-Teilschritte (.kurzportrait-top/.main/.third).
- #wissensspeicher-hawk: drei Scroll-Teilschritte (intro/slidein/final).

## 3) JavaScript: Kernfunktionen

### Initialisierung

- initializeApp(): startet alle Feature-Initialisierer in fester Reihenfolge.

### SVG und Interaktion

- initSVGInteractions(): Hover/Klick in der Hauptgrafik, inkl. optionalem Scrollsprung.
- initGLSTUInteractions(): Klick auf Basiselemente blendet passende Overlays ein.
- initZielInteractions(): koppelt Zielringe mit Zielkarten und Teilziele-Filter.
- initKarteInteractions(): Standortkarten in der Kurzportrait-SVG ein-/ausblenden.

### Content-Interaktionen

- initQSTSlideshow(): manuelle Slideshow mit Buttons, Dots und Tastatur.
- initTeilzieleFilter(): Dropdown + Kartenklick setzen den aktiven Zielfilter.
- initTeilzieleTimeline(): vertikales Wheel wird horizontaler Timeline-Scroll.
- initTeilzieleRowSync(): synchronisiert Hoehen in den Timeline-Zeilen.

### Scrollytelling und Reveal

- initGLSTUScrollNarrative(): seitenweises Scrollen durch GLSTU-Textseiten.
- initKurzportraitScrollNarrative(): seitenweises Scrollen durch Kurzportrait-Textseiten.
- initSectionSnapScrolling(): globales, schrittweises Springen zwischen (Teil-)Abschnitten.
- initWissensspeicherReveal() / initWissensspeicherSlidein(): Einblend-Animationen.

## 4) Styles: Schnell orientieren

- Globaler Rahmen: Reset, Header, .section, .container am Anfang der Datei.
- Hauptgrafik: #svg-container + Intro-Animationen.
- GLSTU: .glstu-* Bereiche (SVG links, narratives Textpanel rechts).
- Meilensteine/Teilziele: .meilensteine-* und .teilziele-* Bereiche.
- Kurzportrait: .kurzportrait-* Bereiche.
- Wissensspeicher: .wissensspeicher-* Bereiche.

## 5) Typische Aenderungen

- Neue Textseite bei GLSTU/Kurzportrait:
  - Neue article-Node mit Klasse .glstu-text-page oder .kurzportrait-text-page in index.html.
  - Die JS-Narrative-Funktionen erkennen die Seite automatisch ueber querySelectorAll.

- Andere Snap-Reihenfolge:
  - In initSectionSnapScrolling() die targets-Bildung anpassen.

- Teilziele-Filter anders vorbelegen:
  - In initTeilzieleFilter() initialValue setzen.
  - HTML-Select default-Wert passend setzen.

## 6) Vorsicht bei Aenderungen

- IDs in SVG-Mappings nicht umbenennen, ohne die Maps in main.js mitzuziehen.
- Klassen fuer Scroll-Teilschritte nicht entfernen, da sie Snap-Ziele sind.
- Bei neuen interaktiven Feldern pruefen, ob shouldIgnoreGlobalSnap() erweitert werden muss.
