// Inline-Laden und Scroll-Rotation der Ziele-SVG
function initZieleSVGScrollRotation() {
    fetch('assets/images/svg/Ziele.svg')
        .then(response => response.text())
        .then(svgText => {
            const container = document.getElementById('ziele-svg-container');
            if (!container) return;
            // IDs und Klassen eindeutig machen
            const svg = isolateInlineSvg(svgText, 'ziele');
            if (!svg) return;
            container.replaceChildren(svg);

            // Ziel-Ebene selektieren
            const zieleGroup = svg.querySelector('[data-orig-id="Ziele"], [id^="ziele-Ziele"]');
            if (!zieleGroup) return;

            let renderedAngle = 0;
            let targetAngle = 0;
            let rotationRafId = null;

            // Scroll-Listener für Rotation
            function updateRotation() {
                const section = document.getElementById('ziele-meilensteine');
                if (!section) return 0;
                const cards = Array.from(document.querySelectorAll('#ziele-meilensteine .meilensteine-slide-card'));
                const visual = document.querySelector('#ziele-meilensteine .meilensteine-visual');
                if (cards.length < 3) return 0;

                const viewportCenter = window.innerHeight * 0.5;
                const viewportHeight = window.innerHeight;
                const currentScrollY = window.scrollY;
                const sectionStartY = section.offsetTop;
                const anchorAngles = [85, 190, 337];

                const cardMetrics = cards.map((card) => {
                    const rect = card.getBoundingClientRect();
                    const cardCenterInViewport = rect.top + rect.height * 0.5;
                    return {
                        card,
                        cardCenterInViewport,
                        anchorY: currentScrollY + cardCenterInViewport - viewportCenter
                    };
                });

                const anchorScrollY = cardMetrics.map((metric) => metric.anchorY);

                let nearestCardIndex = -1;
                let nearestCardDistance = Number.POSITIVE_INFINITY;
                cardMetrics.forEach((metric, index) => {
                    const distance = Math.abs(metric.cardCenterInViewport - viewportCenter);
                    if (distance < nearestCardDistance) {
                        nearestCardDistance = distance;
                        nearestCardIndex = index;
                    }
                });

                const activationWindow = viewportHeight * 0.16;
                cards.forEach((card, index) => {
                    const isActive = index === nearestCardIndex && nearestCardDistance <= activationWindow;
                    card.classList.toggle('meilensteine-card-active', isActive);
                });

                // Start der Rotation, sobald die rechte Grafik sichtbar wird.
                let rotationStartY = sectionStartY;
                if (visual) {
                    const visualRect = visual.getBoundingClientRect();
                    const visualEnterViewportY = viewportHeight * 0.8;
                    rotationStartY = currentScrollY + visualRect.top - visualEnterViewportY;
                }

                function clamp01(value) {
                    return Math.max(0, Math.min(1, value));
                }

                function lerp(a, b, t) {
                    return a + (b - a) * t;
                }

                let angle = 0;
                const firstAnchorY = Math.max(anchorScrollY[0], rotationStartY + viewportHeight * 0.28);
                const secondAnchorY = Math.max(anchorScrollY[1], firstAnchorY + 120);
                const thirdAnchorY = Math.max(anchorScrollY[2], secondAnchorY + 120);

                if (currentScrollY <= rotationStartY) {
                    angle = 0;
                } else if (currentScrollY < firstAnchorY) {
                    const denom = Math.max(1, firstAnchorY - rotationStartY);
                    const t = clamp01((currentScrollY - rotationStartY) / denom);
                    angle = lerp(0, anchorAngles[0], t);
                } else if (currentScrollY < secondAnchorY) {
                    const denom = Math.max(1, secondAnchorY - firstAnchorY);
                    const t = clamp01((currentScrollY - firstAnchorY) / denom);
                    angle = lerp(anchorAngles[0], anchorAngles[1], t);
                } else if (currentScrollY < thirdAnchorY) {
                    const denom = Math.max(1, thirdAnchorY - secondAnchorY);
                    const t = clamp01((currentScrollY - secondAnchorY) / denom);
                    angle = lerp(anchorAngles[1], anchorAngles[2], t);
                } else {
                    angle = anchorAngles[2];
                }

                return angle;
            }

            function renderRotationFrame() {
                const diff = targetAngle - renderedAngle;
                renderedAngle += diff * 0.16;
                if (Math.abs(diff) < 0.05) {
                    renderedAngle = targetAngle;
                }

                // SVG center from viewBox/ellipse: (365.65, 268.86)
                zieleGroup.setAttribute('transform', `rotate(${-renderedAngle} 365.65 268.86)`);

                if (Math.abs(targetAngle - renderedAngle) >= 0.05) {
                    rotationRafId = window.requestAnimationFrame(renderRotationFrame);
                } else {
                    rotationRafId = null;
                }
            }

            function scheduleRotationUpdate() {
                targetAngle = updateRotation();
                if (rotationRafId === null) {
                    rotationRafId = window.requestAnimationFrame(renderRotationFrame);
                }
            }

            window.addEventListener('scroll', scheduleRotationUpdate, { passive: true });
            window.addEventListener('resize', scheduleRotationUpdate);
            scheduleRotationUpdate();
        });
}
// Timeline-Menü Scroll-Tracking
function initMobileOrientationGate() {
    const gate = document.getElementById('orientation-gate');
    if (!gate || !document.body) return;

    // Auf kleinen Touch-Geraeten wird das problematische Hochformat gezielt abgefangen.
    // So bleibt die Seite in den Viewports lesbar, fuer die das Layout gedacht ist.
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const smallDeviceWidthQuery = window.matchMedia('(max-width: 64rem)');
    const portraitQuery = window.matchMedia('(orientation: portrait)');

    function isPortraitFallback() {
        return window.innerHeight >= window.innerWidth;
    }

    function shouldBlockPortraitView() {
        return coarsePointerQuery.matches
            && smallDeviceWidthQuery.matches
            && (portraitQuery.matches || isPortraitFallback());
    }

    function updateOrientationGate() {
        const blocked = shouldBlockPortraitView();
        document.body.classList.toggle('mobile-portrait-blocked', blocked);
        gate.setAttribute('aria-hidden', blocked ? 'false' : 'true');
    }

    if (document.body.dataset.orientationGateBound !== 'true') {
        document.body.dataset.orientationGateBound = 'true';

        [coarsePointerQuery, smallDeviceWidthQuery, portraitQuery].forEach((query) => {
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
    const desktopSteps = Array.from(document.querySelectorAll('.timeline-step'));
    const mobileSteps = Array.from(document.querySelectorAll('.timeline-mobile-step'));
    const steps = [...desktopSteps, ...mobileSteps];
    const sectionIds = Array.from(new Set(steps.map(step => step.getAttribute('data-section')).filter(Boolean)));
    const sections = sectionIds.map(id => document.getElementById(id));

    // Desktop- und Mobile-Links springen identisch in die Zielabschnitte.
    steps.forEach((step) => {
        const link = step.querySelector('a[href^="#"]');
        const sectionId = step.getAttribute('data-section');
        if (!link || !sectionId) return;

        link.addEventListener('click', (event) => {
            event.preventDefault();
            smoothScrollToSectionById(sectionId);
        });
    });

    function updateTimeline() {
        let activeIdx = 0;
        for (let i = 0; i < sections.length; i++) {
            const rect = sections[i]?.getBoundingClientRect();
            if (rect && rect.top - 80 < window.innerHeight * 0.33) {
                activeIdx = i;
            }
        }
        steps.forEach((step) => {
            const sectionId = step.getAttribute('data-section');
            const i = sectionIds.indexOf(sectionId);
            if (i < 0) return;
            step.classList.remove('active', 'completed');
            if (i < activeIdx) step.classList.add('completed');
            if (i === activeIdx) step.classList.add('active');
        });
    }
    window.addEventListener('scroll', updateTimeline, { passive: true });
    updateTimeline();
}

function initMobileTimelineMenu() {
    const header = document.querySelector('.sticky-header');
    const burger = document.querySelector('.timeline-burger');
    const panel = document.getElementById('timeline-mobile-panel');
    if (!header || !burger || !panel) return;
    if (header.dataset.mobileMenuBound === 'true') return;

    header.dataset.mobileMenuBound = 'true';
    const mobileWidthQuery = window.matchMedia('(max-width: 56.3125rem)');

    function setMenuOpen(nextOpen) {
        burger.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        panel.hidden = !nextOpen;
        panel.classList.toggle('is-open', nextOpen);
        document.body.classList.toggle('mobile-menu-open', nextOpen);
    }

    burger.addEventListener('click', () => {
        const isOpen = burger.getAttribute('aria-expanded') === 'true';
        setMenuOpen(!isOpen);
    });

    panel.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener('click', () => setMenuOpen(false));
    });

    // Ein offenes Mobile-Menue schliesst sich beim Scrollen automatisch.
    window.addEventListener('scroll', () => {
        if (burger.getAttribute('aria-expanded') === 'true') {
            setMenuOpen(false);
        }
    }, { passive: true });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        setMenuOpen(false);
    });

    const closeIfDesktop = () => {
        if (!mobileWidthQuery.matches) {
            setMenuOpen(false);
        }
    };

    if (typeof mobileWidthQuery.addEventListener === 'function') {
        mobileWidthQuery.addEventListener('change', closeIfDesktop);
    } else if (typeof mobileWidthQuery.addListener === 'function') {
        mobileWidthQuery.addListener(closeIfDesktop);
    }

    setMenuOpen(false);
}

function initMobileHeaderAutoHide() {
    const mobileWidthQuery = window.matchMedia('(max-width: 56.3125rem)');
    let lastScrollY = window.scrollY;

    function updateHeaderVisibility() {
        // Auf Mobile wird der Header beim Scrollen nach unten versteckt und beim Zurueckscrollen wieder gezeigt.
        if (!mobileWidthQuery.matches) {
            document.body.classList.remove('mobile-header-hidden');
            lastScrollY = window.scrollY;
            return;
        }

        const currentScrollY = window.scrollY;
        const delta = currentScrollY - lastScrollY;
        const isMenuOpen = document.body.classList.contains('mobile-menu-open');

        if (isMenuOpen) {
            document.body.classList.remove('mobile-header-hidden');
            lastScrollY = currentScrollY;
            return;
        }

        if (currentScrollY <= 12) {
            document.body.classList.remove('mobile-header-hidden');
        } else if (delta > 6) {
            document.body.classList.add('mobile-header-hidden');
        } else if (delta < -6) {
            document.body.classList.remove('mobile-header-hidden');
        }

        lastScrollY = currentScrollY;
    }

    window.addEventListener('scroll', updateHeaderVisibility, { passive: true });
    window.addEventListener('resize', updateHeaderVisibility, { passive: true });

    if (typeof mobileWidthQuery.addEventListener === 'function') {
        mobileWidthQuery.addEventListener('change', updateHeaderVisibility);
    } else if (typeof mobileWidthQuery.addListener === 'function') {
        mobileWidthQuery.addListener(updateHeaderVisibility);
    }

    updateHeaderVisibility();
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

    // Das Logo wirkt wie ein Home-Button zur Hauptgrafik.
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
    initMobileTimelineMenu();
    initMobileHeaderAutoHide();
    initTimelineLogoHomeLink();
    initZieleSVGScrollRotation();
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

function getSectionScrollOffset(sectionId) {
    const stickyHeader = document.querySelector('.sticky-header');
    const headerOffset = stickyHeader ? stickyHeader.offsetHeight : 0;

    // Einige Zielbereiche sollen optisch etwas straffer unter dem Header landen.
    if (
        sectionId === 'querschnittsthemen'
        || sectionId === 'kurzportrait'
        || sectionId === 'ziele-meilensteine'
    ) {
        return Math.max(0, headerOffset - 8);
    }

    return headerOffset;
}

function smoothScrollToSectionById(sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    const targetTop = targetSection.getBoundingClientRect().top + window.scrollY;
    const scrollOffset = getSectionScrollOffset(sectionId);
    const targetY = Math.max(0, targetTop - scrollOffset);

    window.scrollTo({
        top: targetY,
        behavior: 'smooth'
    });
}

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

// Laden der Wissensspeicher-Grafik fuer stufenweises Einblenden von Schritt 1-4.
// Unter 600px wird die mobile 2x2-Variante geladen.
const wissensspeicherMobileQuery = window.matchMedia('(max-width: 600px)');

function loadWissensspeicherSvg() {
    const wsContainer = document.getElementById('wissensspeicher-svg-container');
    if (!wsContainer) return;

    // Mobile nutzt eine eigene SVG-Variante mit einem kompakteren Raster.
    const svgPath = wissensspeicherMobileQuery.matches
        ? 'assets/images/svg/Wissensspeicher_grafik_mobil.svg'
        : 'assets/images/svg/Wissensspeicher_grafik.svg';

    if (wsContainer.dataset.wissensspeicherSvgPath === svgPath && wsContainer.querySelector('svg')) {
        return;
    }

    fetch(svgPath)
        .then(response => response.text())
        .then(svgText => {
            const wsSvg = isolateInlineSvg(svgText, 'wissens');
            if (!wsSvg) return;
            wsContainer.replaceChildren(wsSvg);
            wsContainer.dataset.wissensspeicherSvgPath = svgPath;

            const wrap = wsContainer.closest('.wissensspeicher-svg-wrap');
            if (wrap) {
                wrap.classList.remove('steps-ready');
                delete wrap.dataset.wissensspeicherStepsBound;
            }

            initWissensspeicherStepsReveal();
            initWissensspeicherHotspotInteraction();
        });
}

loadWissensspeicherSvg();
if (typeof wissensspeicherMobileQuery.addEventListener === 'function') {
    wissensspeicherMobileQuery.addEventListener('change', loadWissensspeicherSvg);
} else if (typeof wissensspeicherMobileQuery.addListener === 'function') {
    wissensspeicherMobileQuery.addListener(loadWissensspeicherSvg);
}

function setKarteGebietVisible(karteRoot, isVisible) {
    if (!karteRoot) return;
    const gebietLayer = karteRoot.querySelector('[data-orig-id="Gebiet"], [id="Gebiet"]');
    if (!gebietLayer) return;
    gebietLayer.classList.toggle('karte-gebiet-hidden', !isVisible);
}

function initKarteInteractions() {
    const karteRoot = document.querySelector('#karte-svg-container svg');
    if (!karteRoot) return;
    const kurzportraitSection = document.getElementById('kurzportrait');

    function getKarteLayer(id) {
        return karteRoot.querySelector(`[data-orig-id="${id}"], [id="${id}"]`);
    }

    // Die Stadt-Layer steuern die zugehoerigen Infokarten in derselben SVG.
    const cityToCardMap = {
        Holzminden: 'Karte_Holzminden',
        'Göttingen': 'Karte_Göttingen',
        Hildesheim: 'Karte_Hildesheim'
    };

    setKarteGebietVisible(karteRoot, false);

    const cardIds = Object.values(cityToCardMap);
    let hasCityBeenClicked = false;

    function syncKarteExpandedState() {
        if (!kurzportraitSection) return;
        const hasVisibleCard = cardIds.some((cardId) => {
            const layer = getKarteLayer(cardId);
            return layer && layer.classList.contains('karte-city-card-visible');
        });
        kurzportraitSection.classList.toggle('kurzportrait-map-expanded', hasVisibleCard);
    }

    cardIds.forEach((cardId) => {
        const cardLayer = getKarteLayer(cardId);
        if (!cardLayer) return;
        cardLayer.classList.add('karte-city-card', 'karte-city-card-hidden');
        cardLayer.classList.remove('karte-city-card-visible');
    });

    // Schaltet die zugehoerige Karte ein/aus, ohne andere Layer zu veraendern.
    function showCityCard(targetCardId) {
        const cardLayer = getKarteLayer(targetCardId);
        if (!cardLayer) return;

        const isVisible = cardLayer.classList.contains('karte-city-card-visible');
        if (isVisible) {
            cardLayer.classList.add('karte-city-card-hidden');
            cardLayer.classList.remove('karte-city-card-visible');
            syncKarteExpandedState();
            return;
        }

        cardLayer.classList.add('karte-city-card-visible');
        cardLayer.classList.remove('karte-city-card-hidden');
        syncKarteExpandedState();
    }

    syncKarteExpandedState();

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

    const slowLandscapeReveal = window.matchMedia(
        '(orientation: landscape) and (pointer: coarse) and (max-width: 60rem) and (max-height: 33.75rem)'
    ).matches;

    // Die Intro-Karten gleiten von links ein, sobald ihre Section in den Viewport kommt.
    function updateTransforms() {
        const windowHeight = window.innerHeight;
        const headerOffset = 60; // passend zur sticky-header Hoehe

        revealElements.forEach(el => {
            const section = el.closest('.section');
            if (!section) return;

            const rect = section.getBoundingClientRect();
            let endTop;
            
            if (section.id === 'einleitung') {
                endTop = slowLandscapeReveal ? 0 : 300; // Querformat-Handys deutlich langsamer
            } else if (section.id === 'querschnittsthemen') {
                endTop = slowLandscapeReveal
                    ? headerOffset - 24
                    : headerOffset + (windowHeight * 0.18);
            } else {
                endTop = slowLandscapeReveal ? headerOffset - 16 : headerOffset;
            }

            // Fortschritt berechnen:
            // 0 wenn der Abschnitt unten am Bildschirmrand auftaucht (rect.top = windowHeight)
            // 1 wenn der Abschnitt am definierten Endpunkt ist (rect.top = endTop)
            let progress = (windowHeight - rect.top) / (windowHeight - endTop);
            progress = Math.max(0, Math.min(1, progress));

            if (slowLandscapeReveal) {
                progress = Math.pow(progress, 2.1);
                progress = Math.min(1, progress * 0.78);
            }

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
    // Intro-Choreografie: Ladezustand zeigen, Gruppen aufbauen und Teilbereiche anschliessend einklappen.
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
    // Hauptgrafik: interaktive Layer mit Hover, Klick, Hint und Sprungzielen.
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
        smoothScrollToSectionById(sectionId);
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
    const glstuSection = document.getElementById('gelingendes-studium');
    const mobilePortraitGLSTUQuery = window.matchMedia('(max-width: 53rem) and (orientation: portrait)');
    const mobileLandscapeGLSTUQuery = window.matchMedia('(orientation: landscape) and (max-width: 64rem) and (max-height: 33.75rem)');

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

    function setGLSTUMobileOverflowPadding(pixels) {
        if (!glstuSection) return;
        const safePixels = Number.isFinite(pixels) ? Math.max(0, pixels) : 0;
        glstuSection.style.setProperty('--glstu-expanded-overflow-pad', `${safePixels}px`);
    }

    function updateGLSTUMobileOverflowPadding() {
        const isPortrait = mobilePortraitGLSTUQuery.matches;
        const isLandscape = mobileLandscapeGLSTUQuery.matches;
        // Wenn ein Overlay offen ist, wird der mobile Bereich unten temporaer vergroessert.
        if (!isPortrait && !isLandscape) {
            setGLSTUMobileOverflowPadding(0);
            return;
        }

        const viewBox = glstuRoot.viewBox && glstuRoot.viewBox.baseVal
            ? glstuRoot.viewBox.baseVal
            : null;
        if (!viewBox || !viewBox.height) {
            setGLSTUMobileOverflowPadding(0);
            return;
        }

        let maxOverlayBottom = viewBox.height;
        let hasVisibleOverlay = false;

        overlayIds.forEach((id) => {
            const overlay = getGLSTULayer(id);
            if (!overlay || !overlay.classList.contains('glstu-overlay-visible')) return;
            hasVisibleOverlay = true;
            try {
                const bbox = overlay.getBBox();
                maxOverlayBottom = Math.max(maxOverlayBottom, bbox.y + bbox.height);
            } catch {
                // Ignore non-renderable overlay states and keep fallback padding.
            }
        });

        if (!hasVisibleOverlay) {
            setGLSTUMobileOverflowPadding(0);
            return;
        }

        const overflowInViewBoxUnits = Math.max(0, maxOverlayBottom - viewBox.height);
        const renderedHeight = glstuRoot.getBoundingClientRect().height;
        const unitToPixelScale = renderedHeight > 0 ? renderedHeight / viewBox.height : 0;
        const overflowPixels = Math.ceil(overflowInViewBoxUnits * unitToPixelScale);
        const mobileSafetyPadding = isLandscape ? 90 : 28;
        const maxPadding = isLandscape ? 760 : 320;
        const clampedPadding = Math.min(maxPadding, overflowPixels + mobileSafetyPadding);
        setGLSTUMobileOverflowPadding(clampedPadding);
    }

    overlayIds.forEach(id => {
        const overlay = getGLSTULayer(id);
        if (overlay) {
            overlay.classList.add('glstu-overlay', 'glstu-overlay-hidden');
        }
    });

    // Es ist immer nur ein Overlay sichtbar; ein erneuter Klick blendet wieder alles aus.
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

        if (glstuSection) {
            const anyOverlayVisible = overlayIds.some((id) => {
                const overlay = getGLSTULayer(id);
                return overlay && overlay.classList.contains('glstu-overlay-visible');
            });
            glstuSection.classList.toggle('glstu-overlay-open', anyOverlayVisible);
        }

        updateGLSTUMobileOverflowPadding();
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
            // Das Pulsieren wird nach dem ersten Klick entfernt, damit die Interaktion ruhiger wirkt.
            document.querySelectorAll('.glstu-layer').forEach(layer => {
                layer.style.animation = 'none';
            });
        });
    });

    if (glstuSection && glstuSection.dataset.glstuMobileOverflowObserverBound !== 'true') {
        const refreshOverflowPadding = () => {
            updateGLSTUMobileOverflowPadding();
        };

        window.addEventListener('resize', refreshOverflowPadding, { passive: true });
        if (typeof mobilePortraitGLSTUQuery.addEventListener === 'function') {
            mobilePortraitGLSTUQuery.addEventListener('change', refreshOverflowPadding);
        }
        if (typeof mobileLandscapeGLSTUQuery.addEventListener === 'function') {
            mobileLandscapeGLSTUQuery.addEventListener('change', refreshOverflowPadding);
        }
        glstuSection.dataset.glstuMobileOverflowObserverBound = 'true';
    }

    updateGLSTUMobileOverflowPadding();
}


// Querschnittsthemen als manuelle Slideshow: Buttons, Dots und Tastatur reagieren nur im sichtbaren Bereich.
function initQSTSlideshow() {
    let currentSlide = 1;
    const totalSlides = 4;

    function showSlide(slideNumber) {
        // Sichtbare Slide umschalten.
        document.querySelectorAll('.qst-slide').forEach(slide => {
            slide.classList.remove('active');
        });
        const activeSlide = document.querySelector(`.qst-slide[data-slide="${slideNumber}"]`);
        if (activeSlide) {
            activeSlide.classList.add('active');
        }

        // Dots und Slide-Indikatoren synchron halten.
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

    // Beim Laden startet immer die erste Slide.
    showSlide(1);
}

// Teilziele Timeline: vertikales Mausrad wird in horizontalen Timeline-Scroll umgelenkt.
function initTeilzieleTimeline() {
    const matrix = document.querySelector('.teilziele-matrix');
    const timeline = document.querySelector('.teilziele-timeline');
    if (!matrix || !timeline) return;

    if (matrix.dataset.wheelBound === 'true') return;
    matrix.dataset.wheelBound = 'true';

    matrix.addEventListener('wheel', (event) => {
        // Ctrl/Cmd+Wheel wird oft fuer Zoom/Gesten genutzt und soll nicht abgefangen werden.
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

        // An den horizontalen Kanten nicht blockieren, damit das globale vertikale Scrolling weiter greifen kann.
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
    const goalTabs = Array.from(document.querySelectorAll('.teilziele-goal-tab[data-goal-tab]'));
    const teilzieleSection = document.getElementById('teilziele-bereich');
    const goalTriggers = Array.from(document.querySelectorAll('.meilensteine-ziel[data-goal-target], .meilensteine-slide-card[data-goal-target]'));
    const zieleSvgContainer = document.getElementById('ziele-svg-container');
    const yearCards = Array.from(document.querySelectorAll('.teilziele-year'));
    if (!matrix) return;

    const allowedValues = new Set(['1', '2', '3']);
        // Prioritaet: Select -> vorhandener Matrix-Status -> aktiver Tab -> Default.
    const selectInitialValue = filterSelect && allowedValues.has(filterSelect.value)
        ? filterSelect.value
        : null;
    const matrixInitialValue = allowedValues.has(matrix.dataset.goalFilter)
        ? matrix.dataset.goalFilter
        : null;
    const activeTab = goalTabs.find((tab) => tab.classList.contains('is-active'));
    const tabInitialValue = activeTab ? activeTab.getAttribute('data-goal-tab') : null;
    const initialValue = selectInitialValue || matrixInitialValue || tabInitialValue || '1';

    function applyFilter(value) {
        const selectedValue = allowedValues.has(value) ? value : '1';
        matrix.dataset.goalFilter = selectedValue;

        if (filterSelect) {
            filterSelect.value = selectedValue;
        }

        goalTabs.forEach((tab) => {
            const isActive = tab.getAttribute('data-goal-tab') === selectedValue;
            tab.classList.toggle('is-active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
            tab.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Jahreskarten ohne passende Zielspalte werden ausgeblendet.
        yearCards.forEach((yearCard) => {
            const goalCell = yearCard.querySelector(`.teilziele-cell-${selectedValue}`);
            if (!goalCell) {
                yearCard.classList.add('teilziele-year-hidden');
                yearCard.setAttribute('aria-hidden', 'true');
                return;
            }

            const hasListEntries = goalCell.querySelectorAll('li').length > 0;
            const hasEmptyMarker = Boolean(goalCell.querySelector('.teilziele-cell-empty'));
            const hasContent = hasListEntries && !hasEmptyMarker;

            yearCard.classList.toggle('teilziele-year-hidden', !hasContent);
            yearCard.setAttribute('aria-hidden', hasContent ? 'false' : 'true');
        });

        matrix.dispatchEvent(new Event('teilziele:filter-change'));
    }

    applyFilter(initialValue);

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            applyFilter(filterSelect.value);
        });
    }

    goalTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            applyFilter(tab.getAttribute('data-goal-tab'));
        });

        tab.addEventListener('keydown', (event) => {
            let nextIndex = index;

            if (event.key === 'ArrowRight') {
                nextIndex = (index + 1) % goalTabs.length;
            } else if (event.key === 'ArrowLeft') {
                nextIndex = (index - 1 + goalTabs.length) % goalTabs.length;
            } else if (event.key === 'Home') {
                nextIndex = 0;
            } else if (event.key === 'End') {
                nextIndex = goalTabs.length - 1;
            } else {
                return;
            }

            event.preventDefault();
            const nextTab = goalTabs[nextIndex];
            if (!nextTab) return;
            nextTab.focus();
            applyFilter(nextTab.getAttribute('data-goal-tab'));
        });
    });

    function jumpToGoal(value) {
        applyFilter(value);
        if (teilzieleSection) {
            teilzieleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function bindGoalTrigger(trigger, targetValue) {
        if (!trigger || !allowedValues.has(targetValue)) return;
        if (trigger.dataset.goalJumpBound === 'true') return;

        trigger.dataset.goalJumpBound = 'true';
        trigger.setAttribute('role', 'button');
        trigger.setAttribute('tabindex', '0');
        trigger.classList.add('goal-jump-trigger');

        trigger.addEventListener('click', () => {
            jumpToGoal(targetValue);
        });

        trigger.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            jumpToGoal(targetValue);
        });
    }

    // Klick auf Zielkarten oberhalb der Timeline setzt den Filter und springt zur Teilziele-Sektion.
    goalTriggers.forEach((trigger) => {
        const targetValue = trigger.getAttribute('data-goal-target');
        bindGoalTrigger(trigger, targetValue);
    });

    function bindSvgGoalTriggers() {
        if (!zieleSvgContainer) return;
        const svg = zieleSvgContainer.querySelector('svg');
        if (!svg) return;

        [1, 2, 3].forEach((goal) => {
            const layer = svg.querySelector(`[data-orig-id="Ziel${goal}"], [id$="-Ziel${goal}"]`);
            if (!layer) return;
            layer.classList.add('ziele-goal-jump-trigger');
            bindGoalTrigger(layer, String(goal));
        });
    }

    bindSvgGoalTriggers();
    if (zieleSvgContainer && zieleSvgContainer.dataset.goalSvgObserverBound !== 'true') {
        zieleSvgContainer.dataset.goalSvgObserverBound = 'true';
        const observer = new MutationObserver(() => {
            bindSvgGoalTriggers();
        });
        observer.observe(zieleSvgContainer, { childList: true, subtree: true });
    }
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

    function formatTeilzielItems() {
        goalItems.forEach((item) => {
            if (item.dataset.teilzielFormatted === 'true') return;

            const rawText = (item.textContent || '').trim();
            const match = rawText.match(/^(Z\.?\s*\d+\.\d+)\s*:\s*(.+)$/i);
            if (!match) {
                item.dataset.teilzielFormatted = 'true';
                return;
            }

            const code = match[1].replace(/\s+/g, ' ').trim();
            const body = match[2].trim();

            item.textContent = '';

            const codeEl = document.createElement('span');
            codeEl.className = 'teilziel-code';
            codeEl.textContent = code;

            const bodyEl = document.createElement('span');
            bodyEl.className = 'teilziel-body';
            bodyEl.textContent = body;

            item.appendChild(codeEl);
            item.appendChild(bodyEl);
            item.dataset.teilzielFormatted = 'true';
        });
    }

    function applyChecks(checks) {
        // Der JSON-Status markiert die Listenpunkte visuell als erledigt.
        goalItems.forEach((item, index) => {
            const key = extractKey(item.textContent || '', index);
            item.dataset.checkKey = key;
            const isChecked = checks[key] === true;
            item.classList.toggle('teilziel-checked', isChecked);
        });
    }

    formatTeilzielItems();

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

    const stickyGoalsWrap = matrix.querySelector('.teilziele-sticky-goals');
    const stickyGoals = Array.from(matrix.querySelectorAll('.teilziele-sticky-goal'));
    const rowSelectors = ['.teilziele-cell-1', '.teilziele-cell-2', '.teilziele-cell-3'];
    const compactMobileQuery = window.matchMedia('(max-width: 900px)');

    let scheduled = false;

    // Hoehen werden nur fuer die Jahreszellen synchronisiert.
    // Die Sticky-Zielkarten behalten eine getrennt gemessene, feste Hoehe.
    function syncHeights() {
        scheduled = false;

        if (compactMobileQuery.matches) {
            stickyGoals.forEach((goal) => {
                goal.style.height = '';
                goal.style.minHeight = '';
                goal.style.maxHeight = '';
            });

            rowSelectors.forEach((selector) => {
                matrix.querySelectorAll(selector).forEach((cell) => {
                    cell.style.minHeight = '';
                });
            });

            return;
        }

        // Sticky-Zielkarten: einheitliche Hoehe anhand der laengsten Karte.
        const stickyColumnWidth = stickyGoalsWrap?.clientWidth || 0;
        if (stickyGoals.length > 0 && stickyColumnWidth > 0) {
            const measureLayer = document.createElement('div');
            measureLayer.style.position = 'absolute';
            measureLayer.style.left = '-9999px';
            measureLayer.style.top = '0';
            measureLayer.style.visibility = 'hidden';
            measureLayer.style.pointerEvents = 'none';
            measureLayer.style.width = `${stickyColumnWidth}px`;
            document.body.appendChild(measureLayer);

            let maxStickyHeight = 0;
            stickyGoals.forEach((goal) => {
                const clone = goal.cloneNode(true);
                clone.style.display = 'grid';
                clone.style.height = 'auto';
                clone.style.minHeight = '0';
                clone.style.maxHeight = 'none';
                clone.style.width = '100%';
                measureLayer.appendChild(clone);
                maxStickyHeight = Math.max(maxStickyHeight, clone.offsetHeight);
            });

            measureLayer.remove();

            if (maxStickyHeight > 0) {
                stickyGoals.forEach((goal) => {
                    goal.style.height = `${maxStickyHeight}px`;
                    goal.style.minHeight = `${maxStickyHeight}px`;
                    goal.style.maxHeight = `${maxStickyHeight}px`;
                });
            }
        }

        // Vor dem Messen die natuerlichen Hoehen wieder freigeben.
        rowSelectors.forEach((selector) => {
            matrix.querySelectorAll(selector).forEach((cell) => {
                cell.style.minHeight = '';
            });
        });

        rowSelectors.forEach((selector) => {
            let maxHeight = 0;

            const cells = Array.from(matrix.querySelectorAll(selector));
            cells.forEach((cell) => {
                maxHeight = Math.max(maxHeight, cell.offsetHeight);
            });

            if (!maxHeight) return;
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

function initMeilensteineCardsReveal() {
    const section = document.getElementById('ziele-meilensteine');
    const cards = document.querySelectorAll('#ziele-meilensteine .meilensteine-slide-card');
    if (!section || !cards.length) return;
    if (section.dataset.meilensteineObserverBound === 'true') return;

    section.dataset.meilensteineObserverBound = 'true';

    if (typeof IntersectionObserver !== 'function') {
        cards.forEach(card => card.classList.add('meilensteine-card-visible'));
        return;
    }

    cards.forEach((card, idx) => {
        card.classList.add('meilensteine-reveal-ready');
        card.classList.remove('meilensteine-card-visible');
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
                    card.classList.add('meilensteine-card-visible');
                    obs.unobserve(card);
                }
            });
        }, {
            threshold: [0.12, 0.28, 0.55],
            rootMargin: '-6% 0px -14% 0px'
        });
        observer.observe(card);
    });
}

function initKurzportraitStickyTextObserver() {
    // Textwechsel im Kurzportrait: die sichtbare Anzeige wird aus den Quellseiten gespeist.
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

        // Im zweiten Kurzportrait-Schritt soll die Gebietsebene sichtbar sein.
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

function initWissensspeicherEntranceAnimation() {
    const section = document.getElementById('wissensspeicher');
    if (!section) return;
    if (section.dataset.wissensspeicherEntranceBound === 'true') return;

    const mainBlock = section.querySelector('.wissensspeicher-main');
    const slideCard = section.querySelector('.wissensspeicher-fakultaeten-card');
    if (!mainBlock || !slideCard) return;

    section.dataset.wissensspeicherEntranceBound = 'true';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const isActive = entry.isIntersecting && entry.intersectionRatio >= 0.18;
            section.classList.toggle('wissensspeicher-entered', isActive);
        });
    }, {
        threshold: [0.08, 0.18, 0.4],
        rootMargin: '0px 0px -10% 0px'
    });

    observer.observe(mainBlock);
}

function initWissensspeicherStepsReveal() {
    const wrap = document.querySelector('#wissensspeicher-inhalte .wissensspeicher-svg-wrap');
    const svgRoot = document.querySelector('#wissensspeicher-svg-container svg');
    if (!wrap || !svgRoot) return;
    if (wrap.dataset.wissensspeicherStepsBound === 'true') return;

    const stepIds = ['Schritt1', 'Schritt2', 'Schritt3', 'Schritt4'];
    const stepLayers = stepIds
        .map((id) => svgRoot.querySelector(`[data-orig-id="${id}"]`))
        .filter(Boolean);

    if (!stepLayers.length) return;

    wrap.dataset.wissensspeicherStepsBound = 'true';
    wrap.classList.add('steps-ready');

    function revealSteps() {
        // Die Schritte erscheinen gestaffelt, damit der Aufbau der Grafik klar lesbar bleibt.
        stepLayers.forEach((layer, index) => {
            window.setTimeout(() => {
                layer.classList.add('wissensspeicher-step-visible');
            }, index * 180);
        });
    }

    if (typeof IntersectionObserver !== 'function') {
        revealSteps();
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting || entry.intersectionRatio < 0.22) return;
            revealSteps();
            obs.disconnect();
        });
    }, {
        threshold: [0.12, 0.22, 0.45],
        rootMargin: '-4% 0px -14% 0px'
    });

    observer.observe(wrap);
}

function initWissensspeicherHotspotInteraction() {
    const svgRoot = document.querySelector('#wissensspeicher-svg-container svg');
    const legacyLink = document.querySelector('#wissensspeicher-inhalte .wissensspeicher-step1-link');
    if (!svgRoot || !legacyLink) return;

    const targetUrl = legacyLink.getAttribute('href');
    if (!targetUrl) return;

    // Ebenennamen-Reihenfolge: zuerst künftiger Name, dann aktueller Fallback.
    // Wenn die finale SVG vorliegt, kann der Fallback entfernt werden.
    const hotspotLayerNames = ['Pfeil', 'Schritt1'];
    const hotspotLayer = hotspotLayerNames
        .map((name) => svgRoot.querySelector(`[data-orig-id="${name}"], [id="${name}"]`))
        .find(Boolean);

    if (!hotspotLayer) return;
    if (hotspotLayer.dataset.wissensHotspotBound === 'true') return;

    hotspotLayer.dataset.wissensHotspotBound = 'true';
    hotspotLayer.classList.add('wissensspeicher-hotspot-layer');
    hotspotLayer.style.cursor = 'pointer';
    hotspotLayer.setAttribute('role', 'link');
    hotspotLayer.setAttribute('tabindex', '0');

    const openTarget = () => {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    hotspotLayer.addEventListener('click', (event) => {
        event.stopPropagation();
        openTarget();
    });

    hotspotLayer.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openTarget();
    });
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
    initMeilensteineCardsReveal();
    initQSTSlideshow();
    initFullscreenSlideshow();
    initTeilzieleFilter();
    initTeilzieleRowSync();
    initTeilzieleChecks();
    initKurzportraitStickyTextObserver();
    initKurzportraitEntranceAnimation();
    initWissensspeicherEntranceAnimation();
    initWissensspeicherStepsReveal();
    // Globales Snap-Scrolling bleibt bewusst deaktiviert; die gefuehrte Navigation laeuft ueber die Abschnittscontroller.
}

// Fullscreen Slideshow: transform-basierte horizontale Slide-Wechsel mit synchronen Indikatoren.
function initFullscreenSlideshow() {
    let currentSlide = 1;
    const totalSlides = 4;
    const slides = Array.from(document.querySelectorAll('.fullscreen-slide'));
    const indicators = Array.from(document.querySelectorAll('.fullscreen-indicator'));
    const progressDots = Array.from(document.querySelectorAll('.fullscreen-progress-dot'));
    const progressCount = document.querySelector('.fullscreen-progress-count');
    // Alle Prev/Next-Buttons innerhalb der Slides erfassen.
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
        // Nur die Nav-Buttons der aktiven Slide werden deaktiviert, damit die Grenzen klar bleiben.
        slides.forEach((slide, idx) => {
            const prev = slide.querySelector('.fullscreen-prev');
            const next = slide.querySelector('.fullscreen-next');
            if (prev) prev.disabled = (idx + 1 === 1);
            if (next) next.disabled = (idx + 1 === totalSlides);
        });
    }

    updateSlides(1);
}

// Einheitlicher Bootstrapping-Pfad:
// - Wenn DOM noch laedt, an DOMContentLoaded haengen.
// - Wenn DOM schon fertig ist, direkt starten.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp, { once: true });
} else {
    initializeApp();
}
