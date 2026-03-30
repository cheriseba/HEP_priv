// Timeline-Menü Scroll-Tracking
function initMobileOrientationGate() {
    const gate = document.getElementById('orientation-gate');
    if (!gate || !document.body) return;

    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const phoneWidthQuery = window.matchMedia('(max-width: 56.25rem)');
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    function isPortraitFallback() {
        return window.innerHeight >= window.innerWidth;
    }

    function shouldBlockPortraitView() {
        return coarsePointerQuery.matches
            && phoneWidthQuery.matches
            && (portraitQuery.matches || isPortraitFallback());
    }

    function updateOrientationGate() {
        const blocked = shouldBlockPortraitView();
        document.body.classList.toggle('mobile-portrait-blocked', blocked);
        gate.setAttribute('aria-hidden', blocked ? 'false' : 'true');
    }

    if (document.body.dataset.orientationGateBound !== 'true') {
        document.body.dataset.orientationGateBound = 'true';

        [coarsePointerQuery, phoneWidthQuery, portraitQuery].forEach((query) => {
            if (typeof query.addEventListener === 'function') {
                query.addEventListener('change', updateOrientationGate);
            } else if (typeof query.addListener === 'function') {
                query.addListener(updateOrientationGate);
            }
        });

        window.addEventListener('resize', updateOrientationGate, { passive: true });
        window.addEventListener('orientationchange', updateOrientationGate, { passive: true });
    }

    updateOrientationGate();
}

function initTimelineMenu() {
    const steps = document.querySelectorAll('.timeline-step');
    const sectionIds = Array.from(steps).map(step => step.getAttribute('data-section'));
    const sections = sectionIds.map(id => document.getElementById(id));

    function updateTimeline() {
        let activeIdx = 0;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i]?.getBoundingClientRect();
            if (rect && rect.top - 80 < window.innerHeight * 0.33) {
                activeIdx = i;
            }
        }
        steps.forEach((step, i) => {
            step.classList.remove('active', 'completed');
            if (i < activeIdx) step.classList.add('completed');
            if (i === activeIdx) step.classList.add('active');
        });
    }
    window.addEventListener('scroll', updateTimeline, { passive: true });
    updateTimeline();
}

function initTimelineLogoHomeLink() {
    const logoElement = document.querySelector('.timeline-logo');
    const logoContainer = document.querySelector('.timeline-logo-container');
    const backToGraphic = document.getElementById('back-to-graphic');
    const interactiveLogo = logoElement || logoContainer;
    if (!interactiveLogo || !backToGraphic) return;

    interactiveLogo.style.cursor = 'pointer';
    interactiveLogo.setAttribute('role', 'button');
    interactiveLogo.setAttribute('tabindex', '0');
    interactiveLogo.setAttribute('aria-label', 'Zur Hauptgrafik');

    const triggerBackToGraphic = (event) => {
        if (event) event.preventDefault();
        backToGraphic.click();
    };

    interactiveLogo.addEventListener('click', triggerBackToGraphic);
    interactiveLogo.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            triggerBackToGraphic(event);
        }
    });
}

window.addEventListener('DOMContentLoaded', () => {
    initMobileOrientationGate();
    initTimelineMenu();
    initTimelineLogoHomeLink();
});
// ============================================================================
// HEP Frontend Script
// Dieses Skript orchestriert alle interaktiven Bereiche der Seite:
// 1) SVG-Laden und SVG-Interaktionen
// 2) Abschnittsbezogene Narratives (GLSTU, Kurzportrait)
// 3) Globales Snap-Scrolling zwischen Haupt- und Teilabschnitten
// 4) Teilziele-Filter, Timeline und Reveal-Animationen
// ============================================================================

function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isolateInlineSvg(svgText, prefix) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgText, 'image/svg+xml');
    const svg = doc.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return null;

    const idMap = new Map();

    // IDs pro SVG eindeutig machen und Original-ID als Datenattribut behalten.
    svg.querySelectorAll('[id]').forEach((node) => {
        const oldId = node.getAttribute('id');
        if (!oldId) return;
        const newId = `${prefix}-${oldId}`;
        idMap.set(oldId, newId);
        node.setAttribute('data-orig-id', oldId);
        node.setAttribute('id', newId);
    });

    function rewriteIdRefs(text) {
        if (!text) return text;
        let result = text;

        idMap.forEach((newId, oldId) => {
            const oldIdEscaped = escapeRegExp(oldId);
            result = result.replace(new RegExp(`url\\(#${oldIdEscaped}\\)`, 'g'), `url(#${newId})`);
            result = result.replace(new RegExp(`(["'])#${oldIdEscaped}\\1`, 'g'), `$1#${newId}$1`);
            result = result.replace(new RegExp(`=#${oldIdEscaped}(?=[\\s;]|$)`, 'g'), `=#${newId}`);
        });

        return result;
    }

    // Klassen pro SVG eindeutig machen, damit .st0/.cls-1 nicht kollidieren.
    const classMap = new Map();
    const classNames = new Set();

    svg.querySelectorAll('[class]').forEach((node) => {
        (node.getAttribute('class') || '')
            .split(/\s+/)
            .filter(Boolean)
            .forEach((className) => classNames.add(className));
    });

    svg.querySelectorAll('style').forEach((styleNode) => {
        const cssText = styleNode.textContent || '';
        const matches = cssText.match(/\.([_a-zA-Z][_a-zA-Z0-9-]*)/g) || [];
        matches.forEach((match) => classNames.add(match.slice(1)));
    });

    classNames.forEach((className) => {
        classMap.set(className, `${prefix}-${className}`);
    });

    svg.querySelectorAll('[class]').forEach((node) => {
        const nextClasses = (node.getAttribute('class') || '')
            .split(/\s+/)
            .filter(Boolean)
            .map((className) => classMap.get(className) || className)
            .join(' ');
        node.setAttribute('class', nextClasses);
    });

    svg.querySelectorAll('*').forEach((node) => {
        ['href', 'xlink:href'].forEach((attr) => {
            const value = node.getAttribute(attr);
            if (!value || !value.startsWith('#')) return;
            const targetId = value.slice(1);
            const mappedId = idMap.get(targetId);
            if (mappedId) {
                node.setAttribute(attr, `#${mappedId}`);
            }
        });

        [
            'fill',
            'stroke',
            'filter',
            'clip-path',
            'mask',
            'marker-start',
            'marker-mid',
            'marker-end'
        ].forEach((attr) => {
            const value = node.getAttribute(attr);
            if (!value) return;
            const rewritten = rewriteIdRefs(value);
            if (rewritten !== value) {
                node.setAttribute(attr, rewritten);
            }
        });

        const inlineStyle = node.getAttribute('style');
        if (inlineStyle) {
            node.setAttribute('style', rewriteIdRefs(inlineStyle));
        }
    });

    svg.querySelectorAll('style').forEach((styleNode) => {
        let cssText = styleNode.textContent || '';

        classMap.forEach((newClass, oldClass) => {
            const oldClassEscaped = escapeRegExp(oldClass);
            cssText = cssText.replace(new RegExp(`\\.${oldClassEscaped}(?![\\w-])`, 'g'), `.${newClass}`);
        });

        idMap.forEach((newId, oldId) => {
            const oldIdEscaped = escapeRegExp(oldId);
            cssText = cssText.replace(new RegExp(`#${oldIdEscaped}(?![\\w-])`, 'g'), `#${newId}`);
        });

        cssText = rewriteIdRefs(cssText);
        styleNode.textContent = cssText;
    });

    return svg;
}

// Initiales Laden der Hauptgrafik und Start aller intro-nahen Effekte.
fetch('assets/images/svg/1_Hauptgrafik.svg')
    .then(response => response.text())
    .then(svgText => {
        const mainContainer = document.getElementById('svg-container');
        if (!mainContainer) return;
        const mainSvg = isolateInlineSvg(svgText, 'main');
        if (!mainSvg) return;
        mainContainer.replaceChildren(mainSvg);
        applyIntroAnimation();
        initSVGInteractions();
        initSectionReveal();
    });

// Laden der Grafik fuer den Abschnitt "Gelingendes Studium".
fetch('assets/images/svg/GLSTU.svg')
    .then(response => response.text())
    .then(svgText => {
        const glstuContainer = document.getElementById('glstu-svg-container');
        if (!glstuContainer) return;
        const glstuSvg = isolateInlineSvg(svgText, 'glstu');
        if (!glstuSvg) return;
        glstuContainer.replaceChildren(glstuSvg);
        initGLSTUInteractions();
    });

const narrativeControllers = {
    glstu: null,
    kurzportrait: null
};

// Laden der Ziel-Ringe fuer die Meilenstein-Sektion inklusive Hover-Verknuepfung.
fetch('assets/images/svg/Ziel.svg')
    .then(response => response.text())
    .then(svgText => {
        const zieleContainer = document.getElementById('ziele-svg-container');
        if (!zieleContainer) return;
        const zieleSvg = isolateInlineSvg(svgText, 'ziel');
        if (!zieleSvg) return;
        zieleContainer.replaceChildren(zieleSvg);

        const svg = zieleContainer.querySelector('svg');
        if (svg) {
            svg.style.overflow = 'visible'; // verhindert Abschneiden bei Hover-Scale
        }
        initZielInteractions();
    });

// Laden der Standortkarte fuer das Kurzportrait.
fetch('assets/images/svg/Karte.svg')
    .then(response => response.text())
    .then(svgText => {
        const karteContainer = document.getElementById('karte-svg-container');
        if (!karteContainer) return;
        const karteSvg = isolateInlineSvg(svgText, 'karte');
        if (!karteSvg) return;
        karteContainer.replaceChildren(karteSvg);
        initKarteInteractions();
    });

function setKarteGebietVisible(karteRoot, isVisible) {
    if (!karteRoot) return;
    const gebietLayer = karteRoot.querySelector('[data-orig-id="Gebiet"], [id="Gebiet"]');
    if (!gebietLayer) return;
    gebietLayer.classList.toggle('karte-gebiet-hidden', !isVisible);
}

function initKarteInteractions() {
    const karteRoot = document.querySelector('#karte-svg-container svg');
    if (!karteRoot) return;

    function getKarteLayer(id) {
        return karteRoot.querySelector(`[data-orig-id="${id}"], [id="${id}"]`);
    }

    // Zuordnung der klickbaren Stadt-Layer zu ihren Info-Karten in der SVG.
    const cityToCardMap = {
        Holzminden: 'Karte_Holzminden',
        'Göttingen': 'Karte_Göttingen',
        Hildesheim: 'Karte_Hildesheim'
    };

    setKarteGebietVisible(karteRoot, false);

    const cardIds = Object.values(cityToCardMap);
    let hasCityBeenClicked = false;

    cardIds.forEach((cardId) => {
        const cardLayer = getKarteLayer(cardId);
        if (!cardLayer) return;
        cardLayer.classList.add('karte-city-card', 'karte-city-card-hidden');
        cardLayer.classList.remove('karte-city-card-visible');
    });

    // Schaltet die zugehoerige Karte ein/aus (Toggle), ohne andere Layer zu veraendern.
    function showCityCard(targetCardId) {
        const cardLayer = getKarteLayer(targetCardId);
        if (!cardLayer) return;

        const isVisible = cardLayer.classList.contains('karte-city-card-visible');
        if (isVisible) {
            cardLayer.classList.add('karte-city-card-hidden');
            cardLayer.classList.remove('karte-city-card-visible');
            return;
        }

        cardLayer.classList.add('karte-city-card-visible');
        cardLayer.classList.remove('karte-city-card-hidden');
    }

    Object.entries(cityToCardMap).forEach(([cityId, cardId]) => {
        const cityLayer = getKarteLayer(cityId);
        if (!cityLayer) return;

        cityLayer.classList.add('karte-city-layer', 'karte-city-layer-pulse');
        cityLayer.style.cursor = 'pointer';

        cityLayer.addEventListener('mouseenter', () => {
            cityLayer.classList.add('karte-city-layer-hover');
        });

        cityLayer.addEventListener('mouseleave', () => {
            cityLayer.classList.remove('karte-city-layer-hover');
        });

        cityLayer.addEventListener('click', (event) => {
            event.stopPropagation();

            if (!hasCityBeenClicked) {
                hasCityBeenClicked = true;
                Object.keys(cityToCardMap).forEach((layerId) => {
                    const layer = getKarteLayer(layerId);
                    if (layer) {
                        layer.classList.remove('karte-city-layer-pulse');
                    }
                });
            }

            showCityCard(cardId);
        });
    });
}

function initSectionReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    // Bewegt Intro-Karten horizontal ein, abhaengig von der Position ihrer Section im Viewport.
    function updateTransforms() {
        const windowHeight = window.innerHeight;
        const headerOffset = 60; // passend zur sticky-header Hoehe

        revealElements.forEach(el => {
            const section = el.closest('.section');
            if (!section) return;

            const rect = section.getBoundingClientRect();
            const endTop = section.id === 'querschnittsthemen'
                ? headerOffset + (windowHeight * 0.18)
                : headerOffset;

            // Fortschritt berechnen:
            // 0 wenn der Abschnitt unten am Bildschirmrand auftaucht (rect.top = windowHeight)
            // 1 wenn der Abschnitt am definierten Endpunkt ist (rect.top = endTop)
            let progress = (windowHeight - rect.top) / (windowHeight - endTop);
            progress = Math.max(0, Math.min(1, progress));

            // Lineare Verschiebung von -100% zu 0%
            const xPercent = (1 - progress) * -100;
            el.style.transform = `translateX(${xPercent}%)`;
            // Optional: Deckkraft parallel dazu einblenden
            el.style.opacity = progress;
        });
    }

    window.addEventListener('scroll', updateTransforms, { passive: true });
    updateTransforms();
}

function applyIntroAnimation() {
    // Intro-Choreografie: zentrales Symbol laden -> Gruppen aufbauen -> ausgewaehlte Gruppen wieder einklappen.
    const svgRoot = document.querySelector('#svg-container svg');
    if (!svgRoot) return;

    function getMainLayer(id) {
        return svgRoot.querySelector(`[data-orig-id="${id}"], [id="${id}"]`);
    }

    const loadingId = 'Gelingendes_Studium';
    const buildGroups = [
        { ids: ['Ziele'], delay: 0 },
        { ids: ['K1', 'K2', 'K3', 'K4'], delay: 0.12 },
        { ids: ['F', 'SGE', 'NHK', 'KIR', 'QST'], delay: 0.24 }
    ];
    const retractIds = ['F', 'SGE', 'KIR', 'NHK'];

    const loadingElement = getMainLayer(loadingId);
    if (loadingElement) {
        loadingElement.classList.add('loading-symbol-minimal');
    }
    buildGroups.forEach(group => {
        group.ids.forEach(id => {
            const element = getMainLayer(id);
            if (element) {
                element.classList.add('intro-hidden');
            }
        });
    });

    const loadingDurationMs = 700;
    const buildDurationMs = 900;
    const lastBuildDelayMs = 240;
    const buildEndBufferMs = 180;

    setTimeout(() => {
        if (loadingElement) {
            loadingElement.classList.remove('loading-symbol-minimal');
        }

        buildGroups.forEach(group => {
            group.ids.forEach(id => {
                const element = getMainLayer(id);
                if (element) {
                    element.classList.remove('intro-hidden');
                    element.classList.add('intro-unit');
                    element.style.animationDelay = `${group.delay}s`;
                }
            });
        });

        const retractStartMs = lastBuildDelayMs + buildDurationMs + buildEndBufferMs;

        setTimeout(() => {
            retractIds.forEach((id, index) => {
                const element = getMainLayer(id);
                if (element) {
                    element.classList.remove('intro-unit');
                    element.classList.add('retract-unit');
                    element.style.animationDelay = `${index * 0.16}s`;
                }
            });
        }, retractStartMs);
    }, loadingDurationMs);
}

function initSVGInteractions() {
    // Interaktive Layer der Hauptgrafik (Hover, Klick, optionales Scroll-Ziel).
    const svgRoot = document.querySelector('#svg-container svg');
    if (!svgRoot) return;

    function getMainLayer(id) {
        return svgRoot.querySelector(`[data-orig-id="${id}"], [id="${id}"]`);
    }

    const elements = ['F', 'K1', 'K2', 'K3', 'K4', 'QST', 'SGE', 'NHK', 'KIR', 'Gelingendes_Studium', 'Ziele'];
    const linkedSections = {
        K2: 'F',
        K3: 'SGE',
        K4: 'NHK',
        K1: 'KIR'
    };
    const scrollTargets = {
        QST: { sectionId: 'querschnittsthemen', hint: 'Klicken: zu Querschnittsthemen' },
        Gelingendes_Studium: { sectionId: 'gelingendes-studium', hint: 'Klicken: zu Gelingendes Studium' },
        Ziele: { sectionId: 'ziele-meilensteine', hint: 'Klicken: zu Ziele / Meilensteine' }
    };
    const hoverHints = {
        QST: 'Klicken: zu Querschnittsthemen',
        Gelingendes_Studium: 'Klicken: zu Gelingendes Studium',
        Ziele: 'Klicken: zu Ziele / Meilensteine',
        K1: 'Aufklappen',
        K2: 'Aufklappen',
        K3: 'Aufklappen',
        K4: 'Aufklappen'
    };
    const hint = document.getElementById('svg-hint');
    const hoverLeaveTimers = new Map();
    const activeTimers = new Map();
    const backToGraphic = document.getElementById('back-to-graphic');

    function updateBackToGraphicVisibility() {
        if (!backToGraphic) return;
        if (window.scrollY > 380) {
            backToGraphic.classList.add('visible');
        } else {
            backToGraphic.classList.remove('visible');
        }
    }

    updateBackToGraphicVisibility();
    window.addEventListener('scroll', updateBackToGraphicVisibility, { passive: true });

    function scrollToSection(sectionId) {
        const targetSection = document.getElementById(sectionId);
        if (!targetSection) return;
        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function showHint(event, text) {
        if (!hint) return;
        hint.textContent = text;
        hint.classList.add('visible');
        const x = event.clientX + 14;
        const y = event.clientY + 14;
        hint.style.left = `${x}px`;
        hint.style.top = `${y}px`;
    }

    function moveHint(event) {
        if (!hint || !hint.classList.contains('visible')) return;
        hint.style.left = `${event.clientX + 14}px`;
        hint.style.top = `${event.clientY + 14}px`;
    }

    function hideHint() {
        if (!hint) return;
        hint.classList.remove('visible');
    }

    function clearHoverLeaveTimer(id) {
        const timer = hoverLeaveTimers.get(id);
        if (timer) {
            clearTimeout(timer);
            hoverLeaveTimers.delete(id);
        }
    }

    function expandSection(sectionId) {
        const section = getMainLayer(sectionId);
        if (!section) return;

        section.classList.remove('retract-unit', 'intro-hidden', 'intro-unit');
        section.style.animationDelay = '0s';
        void section.getBoundingClientRect();
        section.classList.add('intro-unit');
    }

    function collapseSection(sectionId) {
        const section = getMainLayer(sectionId);
        if (!section) return;

        section.classList.remove('intro-unit', 'intro-hidden', 'retract-unit');
        section.style.animationDelay = '0s';
        void section.getBoundingClientRect();
        section.classList.add('retract-unit');
    }

    // K-Buttons steuern jeweils ein verbundenes Segment (aus-/einklappen).
    function toggleLinkedSection(controlId) {
        const targetId = linkedSections[controlId];
        if (!targetId) return;

        const target = getMainLayer(targetId);
        if (!target) return;

        // Jeder Bereich toggelt nur sich selbst: offen bleibt offen,
        // bis derselbe Bereich erneut geklickt wird.

        if (target.classList.contains('retract-unit') || target.classList.contains('intro-hidden')) {
            expandSection(targetId);
            return;
        }

        collapseSection(targetId);
    }

    elements.forEach(id => {
        const element = getMainLayer(id);
        if (element) {
            // Hover-Effekt
            element.addEventListener('mouseenter', function(e) {
                clearHoverLeaveTimer(id);
                this.classList.add('svg-element-hover');
                if (hoverHints[id]) {
                    showHint(e, hoverHints[id]);
                }
                console.log(id + ' hovered');
            });

            element.addEventListener('mousemove', function(e) {
                if (hoverHints[id]) {
                    moveHint(e);
                }
            });

            element.addEventListener('mouseleave', function() {
                clearHoverLeaveTimer(id);
                const timer = setTimeout(() => {
                    this.classList.remove('svg-element-hover');
                    hideHint();
                    hoverLeaveTimers.delete(id);
                }, 110);
                hoverLeaveTimers.set(id, timer);
            });

            // Click-Effekt
            element.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.add('svg-element-active');

                const currentTimer = activeTimers.get(id);
                if (currentTimer) {
                    clearTimeout(currentTimer);
                }

                const timer = setTimeout(() => {
                    this.classList.remove('svg-element-active');
                    activeTimers.delete(id);
                }, 420);
                activeTimers.set(id, timer);

                toggleLinkedSection(id);

                if (scrollTargets[id]) {
                    hideHint();
                    scrollToSection(scrollTargets[id].sectionId);
                }

                console.log(id + ' clicked');
            });

            element.style.cursor = 'pointer';
        }
    });

    // Entferne die active-Klasse wenn Hintergrund geklickt wird
    document.getElementById('svg-container').addEventListener('click', function() {
        elements.forEach(id => {
            const el = getMainLayer(id);
            if (el) el.classList.remove('svg-element-active');
        });
        hideHint();
    });
}

function initGLSTUInteractions() {
    const glstuRoot = document.querySelector('#glstu-svg-container svg');
    if (!glstuRoot) return;

    function getGLSTULayer(id) {
        return glstuRoot.querySelector(`[data-orig-id="${id}"], [id="${id}"]`);
    }

    // Basisebene (Lehrende/Studierende/Hochschule) steuert jeweils ein Overlay in der GLSTU-SVG.
    const layerMap = {
        Lehrende: 'O_x5F_Lehrende',
        Studierende: 'O_x5F_Studierende',
        Hochschule: 'O_x5F_Hochschule'
    };
    const overlayIds = Object.values(layerMap);

    overlayIds.forEach(id => {
        const overlay = getGLSTULayer(id);
        if (overlay) {
            overlay.classList.add('glstu-overlay', 'glstu-overlay-hidden');
        }
    });

    // Es ist immer nur ein Overlay sichtbar; erneuter Klick blendet alle aus.
    function showOverlay(targetId) {
        const target = getGLSTULayer(targetId);
        const isVisible = target ? target.classList.contains('glstu-overlay-visible') : false;

        overlayIds.forEach(id => {
            const overlay = getGLSTULayer(id);
            if (!overlay) return;
            if (!isVisible && id === targetId) {
                overlay.classList.add('glstu-overlay-visible');
                overlay.classList.remove('glstu-overlay-hidden');
            } else {
                overlay.classList.add('glstu-overlay-hidden');
                overlay.classList.remove('glstu-overlay-visible');
            }
        });
    }

    Object.entries(layerMap).forEach(([baseId, overlayId]) => {
        const baseLayer = getGLSTULayer(baseId);
        if (!baseLayer) return;
        baseLayer.classList.add('glstu-layer');
        baseLayer.addEventListener('mouseenter', () => {
            baseLayer.classList.add('glstu-layer-hover');
        });
        baseLayer.addEventListener('mouseleave', () => {
            baseLayer.classList.remove('glstu-layer-hover');
        });
        baseLayer.addEventListener('click', event => {
            event.stopPropagation();
            showOverlay(overlayId);
            // Pulsieren nach erstem Klick entfernen
            document.querySelectorAll('.glstu-layer').forEach(layer => {
                layer.style.animation = 'none';
            });
        });
    });
}

// Alte Ziel-Box/Ring-Interaktion (nur aktiv, wenn die entsprechenden Klassen im DOM vorhanden sind).
function initMeilesteine() {
    const zielBoxes = document.querySelectorAll('.ziel-box');
    const ringCircles = document.querySelectorAll('.ring-circle');
    const ringLabels = document.querySelectorAll('.ring-label');

    // Scroll-Reveal für die sichtbaren Ziel-Karten
    const zielCards = document.querySelectorAll('.meilensteine-ziel');
    if (zielCards.length) {
        zielCards.forEach((card, index) => {
            // leichte Staffelung der Animation
            card.style.transitionDelay = `${index * 0.05}s`;
        });

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('meilensteine-ziel-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            threshold: 1,
            rootMargin: '0px 0px -5px 0px' // recht früh „ankommen“
        });

        zielCards.forEach(card => observer.observe(card));
    }

    zielBoxes.forEach(box => {
        const zielNum = box.getAttribute('data-ziel');

        box.addEventListener('mouseenter', () => {
            zielBoxes.forEach(b => b.classList.remove('active'));
            box.classList.add('active');

            ringCircles.forEach(ring => {
                const ringNum = ring.getAttribute('data-ring');
                if (ringNum === zielNum) {
                    ring.style.opacity = '1';
                    ring.style.strokeWidth = '50';
                } else {
                    ring.style.opacity = '0.3';
                }
            });
        });

        box.addEventListener('mouseleave', () => {
            box.classList.remove('active');
            ringCircles.forEach(ring => {
                const originalOpacity = ring.getAttribute('data-ring');
                ring.style.opacity = (5 - parseInt(originalOpacity)) * 0.2;
                ring.style.strokeWidth = '40';
            });
        });
    });

    ringCircles.forEach(ring => {
        ring.addEventListener('mouseenter', () => {
            const zielNum = ring.getAttribute('data-ring');
            zielBoxes.forEach(box => {
                if (box.getAttribute('data-ziel') === zielNum) {
                    box.classList.add('active');
                } else {
                    box.classList.remove('active');
                }
            });
        });
    });

    ringLabels.forEach(label => {
        label.addEventListener('mouseenter', () => {
            const ring = label.parentElement.querySelector('.ring-circle');
            if (ring) {
                const zielNum = ring.getAttribute('data-ring');
                zielBoxes.forEach(box => {
                    if (box.getAttribute('data-ziel') === zielNum) {
                        box.classList.add('active');
                    } else {
                        box.classList.remove('active');
                    }
                });
            }
        });
    });
}

// Hover-Verknuepfung zwischen den drei Ziel-Ringen und den drei Textkarten.
function initZielInteractions() {
    const zieleRoot = document.querySelector('#ziele-svg-container svg');
    if (!zieleRoot) return;

    function getZielLayer(id) {
        return zieleRoot.querySelector(`[data-orig-id="${id}"], [id="${id}"]`);
    }

    const ringToZielMap = {
        'Außen': { selector: '.meilensteine-ziel.ziel-1', goal: '1' },
        'Mitte': { selector: '.meilensteine-ziel.ziel-2', goal: '2' },
        'Innen': { selector: '.meilensteine-ziel.ziel-3', goal: '3' }
    };

    Object.entries(ringToZielMap).forEach(([ringId, config]) => {
        const { selector: zielSelector, goal } = config;
        const ringGroup = getZielLayer(ringId);
        const zielCard = document.querySelector(zielSelector);
        if (!ringGroup || !zielCard) return;

        ringGroup.style.transformBox = 'fill-box';
        ringGroup.style.transformOrigin = '50% 50%';
        ringGroup.style.cursor = 'pointer';

        const handleEnter = () => {
            ringGroup.classList.add('ziel-ring-hover');
            zielCard.classList.add('meilensteine-ziel-hover');
        };

        const handleLeave = () => {
            ringGroup.classList.remove('ziel-ring-hover');
            zielCard.classList.remove('meilensteine-ziel-hover');
        };

        ringGroup.addEventListener('mouseenter', handleEnter);
        ringGroup.addEventListener('mouseleave', handleLeave);

        // Hover funktioniert auch umgekehrt: Karte -> Ring.
        zielCard.addEventListener('mouseenter', handleEnter);
        zielCard.addEventListener('mouseleave', handleLeave);

        // Klick auf einen Ring setzt den Teilziele-Filter und springt in den Teilziele-Bereich.
        ringGroup.addEventListener('click', (event) => {
            event.stopPropagation();

            const matrix = document.querySelector('.teilziele-matrix');
            const filterSelect = document.getElementById('teilziele-goal-filter');
            const teilzieleSection = document.getElementById('teilziele-bereich');

            if (matrix) {
                matrix.dataset.goalFilter = goal;
                matrix.dispatchEvent(new Event('teilziele:filter-change'));
            }
            if (filterSelect) {
                filterSelect.value = goal;
            }
            if (teilzieleSection) {
                teilzieleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

// Querschnittsthemen als manuelle Slideshow (Buttons, Dots, Tastatur im sichtbaren Bereich).
function initQSTSlideshow() {
    let currentSlide = 1;
    const totalSlides = 4;

    function showSlide(slideNumber) {
        // Update slide visibility
        document.querySelectorAll('.qst-slide').forEach(slide => {
            slide.classList.remove('active');
        });
        const activeSlide = document.querySelector(`.qst-slide[data-slide="${slideNumber}"]`);
        if (activeSlide) {
            activeSlide.classList.add('active');
        }

        // Update indicators
        document.querySelectorAll('.qst-indicator').forEach(indicator => {
            indicator.classList.remove('active');
        });
        const activeIndicator = document.querySelector(`.qst-indicator[data-slide="${slideNumber}"]`);
        if (activeIndicator) {
            activeIndicator.classList.add('active');
        }

        currentSlide = slideNumber;
    }

    function nextSlide() {
        let next = currentSlide + 1;
        if (next > totalSlides) next = 1;
        showSlide(next);
    }

    function prevSlide() {
        let prev = currentSlide - 1;
        if (prev < 1) prev = totalSlides;
        showSlide(prev);
    }

    // Next Button
    const nextBtn = document.querySelector('.qst-next');
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }

    // Previous Button
    const prevBtn = document.querySelector('.qst-prev');
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }

    // Indicator Buttons
    document.querySelectorAll('.qst-indicator').forEach(indicator => {
        indicator.addEventListener('click', () => {
            const slideNum = indicator.getAttribute('data-slide');
            showSlide(parseInt(slideNum));
        });
    });

    // Keyboard Navigation
    document.addEventListener('keydown', (e) => {
        const qstSection = document.getElementById('querschnittsthemen');
        if (!qstSection) return;

        const rect = qstSection.getBoundingClientRect();
        const isQSTInView = rect.top < window.innerHeight && rect.bottom > 0;

        if (isQSTInView) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
        }
    });

    // Set initial slide
    showSlide(1);
}

// Teilziele Timeline: Mausrad vertikal -> horizontal scrollen
function initTeilzieleTimeline() {
    const matrix = document.querySelector('.teilziele-matrix');
    const timeline = document.querySelector('.teilziele-timeline');
    if (!matrix || !timeline) return;

    if (matrix.dataset.wheelBound === 'true') return;
    matrix.dataset.wheelBound = 'true';

    matrix.addEventListener('wheel', (event) => {
        // Ctrl/Cmd+Wheel wird oft für Zoom/Gesten genutzt.
        if (event.ctrlKey || event.metaKey) return;

        const maxScrollLeft = timeline.scrollWidth - timeline.clientWidth;
        if (maxScrollLeft <= 0) return;

        const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;

        if (dominantDelta === 0) return;

        const movingRight = dominantDelta > 0;
        const atLeftEdge = timeline.scrollLeft <= 0;
        const atRightEdge = timeline.scrollLeft >= maxScrollLeft - 1;

        // An den horizontalen Kanten nicht blockieren,
        // damit globales vertikales Abschnitts-Scrolling greifen kann.
        if ((movingRight && atRightEdge) || (!movingRight && atLeftEdge)) {
            return;
        }

        timeline.scrollLeft += dominantDelta;
        event.preventDefault();
    }, { passive: false });
}

function initTeilzieleFilter() {
    const matrix = document.querySelector('.teilziele-matrix');
    const filterSelect = document.getElementById('teilziele-goal-filter');
    const teilzieleSection = document.getElementById('teilziele-bereich');
    const goalTriggers = Array.from(document.querySelectorAll('.meilensteine-ziel[data-goal-target]'));
    if (!matrix || !filterSelect) return;

    const allowedValues = new Set(['1', '2', '3']);
    const initialValue = allowedValues.has(filterSelect.value) ? filterSelect.value : '1';

    function applyFilter(value) {
        const selectedValue = allowedValues.has(value) ? value : '1';
        matrix.dataset.goalFilter = selectedValue;
        filterSelect.value = selectedValue;
        matrix.dispatchEvent(new Event('teilziele:filter-change'));
    }

    applyFilter(initialValue);

    filterSelect.addEventListener('change', () => {
        applyFilter(filterSelect.value);
    });

    // Klick auf Zielkarten oberhalb der Timeline setzt den Filter und scrollt zur Teilziele-Sektion.
    goalTriggers.forEach((trigger) => {
        const targetValue = trigger.getAttribute('data-goal-target');
        if (!allowedValues.has(targetValue)) return;

        trigger.addEventListener('click', () => {
            applyFilter(targetValue);
            if (teilzieleSection) {
                teilzieleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            applyFilter(targetValue);
            if (teilzieleSection) {
                teilzieleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function initTeilzieleChecks() {
    const teilzieleSection = document.getElementById('teilziele-bereich');
    if (!teilzieleSection) return;

    const goalItems = Array.from(teilzieleSection.querySelectorAll('.teilziele-cell li'));
    if (!goalItems.length) return;

    function extractKey(text, fallbackIndex) {
        const match = text.match(/Z\.?\s*(\d+\.\d+)/i);
        if (match && match[1]) {
            return match[1];
        }
        return `item-${fallbackIndex + 1}`;
    }

    function applyChecks(checks) {
        goalItems.forEach((item, index) => {
            const key = extractKey(item.textContent || '', index);
            item.dataset.checkKey = key;
            const isChecked = checks[key] === true;
            item.classList.toggle('teilziel-checked', isChecked);
        });
    }

    fetch('teilziele-checks.json', { cache: 'no-store' })
        .then((response) => {
            if (!response.ok) {
                throw new Error('teilziele-checks.json konnte nicht geladen werden.');
            }
            return response.json();
        })
        .then((checks) => {
            if (typeof checks !== 'object' || checks === null || Array.isArray(checks)) {
                applyChecks({});
                return;
            }
            applyChecks(checks);
        })
        .catch(() => {
            applyChecks({});
        });
}

function initTeilzieleRowSync() {
    const matrix = document.querySelector('.teilziele-matrix');
    if (!matrix) return;

    if (matrix.dataset.rowSyncBound === 'true') return;
    matrix.dataset.rowSyncBound = 'true';

    const stickyGoals = Array.from(matrix.querySelectorAll('.teilziele-sticky-goal'));
    const rowSelectors = ['.teilziele-cell-1', '.teilziele-cell-2', '.teilziele-cell-3'];

    let scheduled = false;

    // Hoehen angleichen: Sticky-Zielspalte und alle Jahreszellen einer Zeile bleiben deckungsgleich.
    function syncHeights() {
        scheduled = false;

        // Reset so we can measure natural heights
        stickyGoals.forEach((el) => {
            el.style.minHeight = '';
        });
        rowSelectors.forEach((selector) => {
            matrix.querySelectorAll(selector).forEach((cell) => {
                cell.style.minHeight = '';
            });
        });

        rowSelectors.forEach((selector, index) => {
            let maxHeight = 0;

            const sticky = stickyGoals[index];
            if (sticky) {
                maxHeight = Math.max(maxHeight, sticky.offsetHeight);
            }

            const cells = Array.from(matrix.querySelectorAll(selector));
            cells.forEach((cell) => {
                maxHeight = Math.max(maxHeight, cell.offsetHeight);
            });

            if (!maxHeight) return;

            if (sticky) {
                sticky.style.minHeight = `${maxHeight}px`;
            }
            cells.forEach((cell) => {
                cell.style.minHeight = `${maxHeight}px`;
            });
        });
    }

    function scheduleSync() {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(syncHeights);
    }

    scheduleSync();
    window.addEventListener('resize', scheduleSync, { passive: true });
    matrix.addEventListener('teilziele:filter-change', scheduleSync);
}

function initWissensspeicherReveal() {
    // Stufenweises Einblenden der drei Wissensspeicher-Schritte beim ersten Sichtkontakt.
    const stepsWrap = document.querySelector('.wissensspeicher-steps');
    if (!stepsWrap) return;
    if (stepsWrap.dataset.revealBound === 'true') return;

    stepsWrap.dataset.revealBound = 'true';

    const steps = Array.from(stepsWrap.querySelectorAll('.wissensspeicher-step'));
    const stepTransitionMs = 550;
    const stepStaggerMs = 120;
    steps.forEach((step, index) => {
        step.style.transitionDelay = `${index * 0.12}s`;
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            steps.forEach((step) => {
                step.classList.add('wissensspeicher-step-visible');
            });

            const firstStepFullyVisibleMs = stepTransitionMs;
            const lineDelayMs = firstStepFullyVisibleMs + 40;
            window.setTimeout(() => {
                stepsWrap.classList.add('wissensspeicher-steps-visible');
            }, lineDelayMs);

            obs.unobserve(entry.target);
        });
    }, {
        threshold: 0.25,
        rootMargin: '0px 0px -8% 0px'
    });

    observer.observe(stepsWrap);
}

function initWissensspeicherSlidein() {
    // Zweiter Wissensspeicher-Block schiebt beim Erreichen der Section ein.
    const slideSection = document.querySelector('.wissensspeicher-slidein-section');
    const slideCard = document.querySelector('.wissensspeicher-slidein-card');
    if (!slideSection || !slideCard) return;
    if (slideSection.dataset.slideBound === 'true') return;

    slideSection.dataset.slideBound = 'true';

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            slideCard.classList.add('wissensspeicher-slidein-visible');
            obs.unobserve(entry.target);
        });
    }, {
        threshold: 0.28,
        rootMargin: '0px 0px -8% 0px'
    });

    observer.observe(slideSection);
}

function initKurzportraitStickyTextObserver() {
    // Textwechsel via Klick-Pfeile neben den Indikatoren.
    const section = document.getElementById('kurzportrait');
    if (!section) return;
    if (section.dataset.kurzportraitObserverBound === 'true') return;

    const sourcePages = Array.from(section.querySelectorAll('.kurzportrait-text-source .kurzportrait-text-page'));
    const bodyElement = section.querySelector('.kurzportrait-display-body');
    const progressDots = Array.from(section.querySelectorAll('.kurzportrait-progress-dot'));
    const progressCount = section.querySelector('.kurzportrait-progress-count');
    const prevButton = section.querySelector('.kurzportrait-nav-btn-prev');
    const nextButton = section.querySelector('.kurzportrait-nav-btn-next');

    if (!sourcePages.length || !bodyElement) return;

    section.dataset.kurzportraitObserverBound = 'true';

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const payload = sourcePages.map((page) => {
        const paragraph = page.querySelector('p');
        return paragraph ? paragraph.textContent.trim() : page.textContent.trim();
    });

    let activeIndex = -1;
    function updateNavState() {
        if (prevButton) prevButton.disabled = activeIndex <= 0;
        if (nextButton) nextButton.disabled = activeIndex >= payload.length - 1;
    }

    function setActiveText(index) {
        const safeIndex = Math.max(0, Math.min(payload.length - 1, index));
        if (safeIndex === activeIndex) return;

        activeIndex = safeIndex;
        const text = payload[safeIndex];
        if (!text) return;

        bodyElement.textContent = text;
        bodyElement.classList.remove('kurzportrait-display-enter');
        void bodyElement.offsetWidth;
        bodyElement.classList.add('kurzportrait-display-enter');

        if (progressDots.length) {
            progressDots.forEach((dot, dotIndex) => {
                dot.classList.toggle('is-active', dotIndex === safeIndex);
            });
        }
        if (progressCount) {
            progressCount.textContent = `${safeIndex + 1}/${payload.length}`;
        }
        updateNavState();

        // Im 2. Kurzportrait-Abschnitt soll die Gebietsebene sichtbar sein.
        setKarteGebietVisible(safeIndex === 1);

        section.classList.toggle('kurzportrait-show-scroll-hint', false);
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => setActiveText(activeIndex - 1));
    }
    if (nextButton) {
        nextButton.addEventListener('click', () => setActiveText(activeIndex + 1));
    }

    mediaQuery.addEventListener('change', () => setActiveText(Math.max(activeIndex, 0)));
    setActiveText(0);
}

function initKurzportraitEntranceAnimation() {
    const section = document.getElementById('kurzportrait');
    if (!section) return;
    if (section.dataset.kurzportraitEntranceBound === 'true') return;

    const mainBlock = section.querySelector('.kurzportrait-main');
    const slideCard = section.querySelector('.kurzportrait-slide-card');
    const graphic = section.querySelector('.kurzportrait-layout--graphic-only .kurzportrait-sticky-graphic');
    if (!mainBlock || !slideCard || !graphic) return;

    section.dataset.kurzportraitEntranceBound = 'true';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const isActive = entry.isIntersecting && entry.intersectionRatio >= 0.28;
            section.classList.toggle('kurzportrait-entered', isActive);
        });
    }, {
        threshold: [0.12, 0.28, 0.55],
        rootMargin: '-6% 0px -14% 0px'
    });

    observer.observe(mainBlock);
}

function initSectionSnapScrolling() {
    // Globale Scroll-Steuerung:
    // - springt zwischen definierten Snap-Zielen
    // - Teilabschnitte werden als eigene Ziele behandelt
    // - Narrative Controller (GLSTU/Kurzportrait) haben Vorrang
    const main = document.querySelector('main');
    if (!main) return;
    if (main.dataset.sectionSnapBound === 'true') return;

    const topSections = Array.from(main.querySelectorAll(':scope > section.section'));
    if (!topSections.length) return;

    const targets = [];

    function pushIf(element) {
        if (!element) return;
        targets.push(element);
    }

    topSections.forEach((section) => {
        // Einige Bereiche bestehen aus mehreren inhaltlichen Scroll-Schritten.
        // Diese werden hier bewusst als Unterziele eingetragen.
        if (section.id === 'ziele-meilensteine') {
            pushIf(section.querySelector('.meilensteine-split'));
            pushIf(section.querySelector('#teilziele-bereich'));
            return;
        }

        if (section.id === 'kurzportrait') {
            pushIf(section.querySelector('.kurzportrait-top'));
            pushIf(section.querySelector('.kurzportrait-main'));
            pushIf(section.querySelector('.kurzportrait-third'));
            return;
        }

        if (section.id === 'wissensspeicher-hawk') {
            pushIf(section.querySelector('.wissensspeicher-intro'));
            pushIf(section.querySelector('.wissensspeicher-slidein-section'));
            pushIf(section.querySelector('.wissensspeicher-final'));
            return;
        }

        pushIf(section);
    });

    if (!targets.length) return;

    main.dataset.sectionSnapBound = 'true';

    let isAnimating = false;
    let ignoreWheelUntil = 0;
    const animationDurationMs = 380;

    function getTargetTop(target) {
        const y = target.getBoundingClientRect().top + window.scrollY;
        return Math.max(0, y - 60);
    }

    function getCurrentTargetIndex() {
        const anchorY = window.scrollY + 61;
        for (let i = targets.length - 1; i >= 0; i -= 1) {
            if (getTargetTop(targets[i]) <= anchorY + 2) {
                return i;
            }
        }
        return 0;
    }

    function getDirectionalNextIndex(currentIndex, direction) {
        // Ein Input-Impuls soll genau einen Snap-Schritt ausloesen.
        // Deshalb wird relativ zum aktuellen Index geschaltet.
        const delta = direction > 0 ? 1 : -1;
        return Math.max(0, Math.min(targets.length - 1, currentIndex + delta));
    }

    function normalizeWheelDelta(event) {
        // Vereinheitlicht Wheel-Deltas fuer Maus, Touchpad und unterschiedliche deltaMode-Werte.
        const lineHeight = 16;
        const pageHeight = window.innerHeight;

        if (event.deltaMode === 1) return event.deltaY * lineHeight;
        if (event.deltaMode === 2) return event.deltaY * pageHeight;
        return event.deltaY;
    }

    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function animateToTarget(index) {
        const clampedIndex = Math.max(0, Math.min(targets.length - 1, index));
        const targetY = getTargetTop(targets[clampedIndex]);
        const startY = window.scrollY;
        const delta = targetY - startY;

        if (Math.abs(delta) < 2) {
            return;
        }

        isAnimating = true;
        const startTime = performance.now();

        function step(now) {
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / animationDurationMs);
            const eased = easeInOutCubic(progress);
            window.scrollTo(0, startY + delta * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                window.setTimeout(() => {
                    isAnimating = false;
                    ignoreWheelUntil = performance.now() + 35;
                }, 60);
            }
        }

        requestAnimationFrame(step);
    }

    function shouldIgnoreGlobalSnap(eventTarget) {
        return Boolean(eventTarget.closest(
            'input, select, textarea, button, a, [contenteditable="true"]'
        ));
    }

    window.addEventListener('wheel', (event) => {
        // Reihenfolge der Entscheidung:
        // 1) nicht waehrend Lock/Cooldown
        // 2) nicht auf interaktiven Controls
        // 3) erst Narrative konsumieren lassen
        // 4) sonst global zum naechsten Snap-Ziel springen
        if (performance.now() < ignoreWheelUntil) {
            event.preventDefault();
            return;
        }
        if (event.defaultPrevented) return;
        if (isAnimating) {
            event.preventDefault();
            return;
        }
        if (shouldIgnoreGlobalSnap(event.target)) return;

        const normalizedDelta = normalizeWheelDelta(event);
        if (Math.abs(normalizedDelta) < 3) return;

        const direction = normalizedDelta > 0 ? 1 : -1;
        const consumedByNarrative = [narrativeControllers.glstu, narrativeControllers.kurzportrait]
            .filter(Boolean)
            .some((controller) => controller.tryStep(direction));
        if (consumedByNarrative) {
            event.preventDefault();
            return;
        }

        event.preventDefault();

        const currentIndex = getCurrentTargetIndex();
        const nextIndex = getDirectionalNextIndex(currentIndex, direction);
        if (nextIndex === currentIndex) return;
        animateToTarget(nextIndex);
    }, { passive: false });

    window.addEventListener('keydown', (event) => {
        if (isAnimating) {
            event.preventDefault();
            return;
        }
        if (event.defaultPrevented) return;
        if (shouldIgnoreGlobalSnap(event.target)) return;

        const key = event.key;
        const isForward = key === 'ArrowDown' || key === 'PageDown' || key === ' ';
        const isBackward = key === 'ArrowUp' || key === 'PageUp';
        if (!isForward && !isBackward) return;

        const direction = isForward ? 1 : -1;
        const consumedByNarrative = [narrativeControllers.glstu, narrativeControllers.kurzportrait]
            .filter(Boolean)
            .some((controller) => controller.tryStep(direction));
        if (consumedByNarrative) {
            event.preventDefault();
            return;
        }

        event.preventDefault();
        const currentIndex = getCurrentTargetIndex();
        const nextIndex = getDirectionalNextIndex(currentIndex, direction);
        if (nextIndex === currentIndex) return;
        animateToTarget(nextIndex);
    });
}

// Startet alle Initialisierer in einer klaren, zentralen Reihenfolge.
function initializeApp() {
    initMobileOrientationGate();
    initMeilesteine();
    initQSTSlideshow();
    initFullscreenSlideshow();
    initTeilzieleFilter();
    initTeilzieleRowSync();
    initTeilzieleChecks();
    initKurzportraitStickyTextObserver();
    initKurzportraitEntranceAnimation();
    // Globales Snap-Scrolling zwischen Abschnitten deaktiviert.
    initWissensspeicherReveal();
    initWissensspeicherSlidein();
// Fullscreen Slideshow: transform-based horizontal slide transitions
function initFullscreenSlideshow() {
    let currentSlide = 1;
    const totalSlides = 4;
    const slides = Array.from(document.querySelectorAll('.fullscreen-slide'));
    const indicators = Array.from(document.querySelectorAll('.fullscreen-indicator'));
    const progressDots = Array.from(document.querySelectorAll('.fullscreen-progress-dot'));
    const progressCount = document.querySelector('.fullscreen-progress-count');
    // Get all prev/next buttons inside slides
    const prevBtns = Array.from(document.querySelectorAll('.fullscreen-slide .fullscreen-prev'));
    const nextBtns = Array.from(document.querySelectorAll('.fullscreen-slide .fullscreen-next'));

    function updateSlides(target) {
        slides.forEach((slide, idx) => {
            slide.classList.remove('active', 'prev', 'next');
            const slideNum = idx + 1;
            if (slideNum === target) {
                slide.classList.add('active');
            } else if (slideNum < target) {
                slide.classList.add('prev');
            } else {
                slide.classList.add('next');
            }
        });
        indicators.forEach((indicator, idx) => {
            indicator.classList.toggle('active', idx + 1 === target);
        });
        progressDots.forEach((dot, idx) => {
            dot.classList.toggle('is-active', idx + 1 === target);
        });
        if (progressCount) {
            progressCount.textContent = `${target}/${totalSlides}`;
        }
        currentSlide = target;
        updateNavState();
    }

    function nextSlide() {
        if (currentSlide < totalSlides) {
            updateSlides(currentSlide + 1);
        }
    }

    function prevSlide() {
        let prev = currentSlide - 1;
        if (prev < 1) prev = 1;
        updateSlides(prev);
    }

    // Attach event listeners to all nav buttons
    nextBtns.forEach(btn => {
        btn.addEventListener('click', nextSlide);
    });
    prevBtns.forEach(btn => {
        btn.addEventListener('click', prevSlide);
    });

    indicators.forEach((indicator, idx) => {
        indicator.addEventListener('click', () => {
            updateSlides(idx + 1);
        });
    });

    document.addEventListener('keydown', (e) => {
        const fullscreenSection = document.querySelector('.fullscreen-section');
        if (!fullscreenSection) return;
        const rect = fullscreenSection.getBoundingClientRect();
        const isInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (!isInView) return;
        if ((e.key === 'ArrowRight' || e.key === ' ') && currentSlide < totalSlides) {
            e.preventDefault();
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevSlide();
        }
    });

    function updateNavState() {
        // Disable only the nav buttons in the active slide
        slides.forEach((slide, idx) => {
            const prev = slide.querySelector('.fullscreen-prev');
            const next = slide.querySelector('.fullscreen-next');
            if (prev) prev.disabled = (idx + 1 === 1);
            if (next) next.disabled = (idx + 1 === totalSlides);
        });
    }

    updateSlides(1);
}
}

// Einheitlicher Bootstrapping-Pfad:
// - Wenn DOM noch laedt, an DOMContentLoaded haengen.
// - Wenn DOM schon fertig ist, direkt starten.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}
