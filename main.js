// Lade die SVG und mache Elemente interaktiv
fetch('1_Hauptgrafik.svg')
    .then(response => response.text())
    .then(svgText => {
        document.getElementById('svg-container').innerHTML = svgText;
        applyIntroAnimation();
        initSVGInteractions();
        initSectionReveal();
    });

fetch('GLSTU.svg')
    .then(response => response.text())
    .then(svgText => {
        const glstuContainer = document.getElementById('glstu-svg-container');
        if (!glstuContainer) return;
        glstuContainer.innerHTML = svgText;
        initGLSTUInteractions();
    });

// Lade die Ziel-SVG für die Meilensteine und mache die Ringe interaktiv
fetch('Ziel.svg')
    .then(response => response.text())
    .then(svgText => {
        const zieleContainer = document.getElementById('ziele-svg-container');
        if (!zieleContainer) return;
        zieleContainer.innerHTML = svgText;

        const svg = zieleContainer.querySelector('svg');
        if (svg) {
            svg.style.overflow = 'visible'; // verhindert Abschneiden bei Hover-Scale
        }
        initZielInteractions();
    });

fetch('Karte.svg')
    .then(response => response.text())
    .then(svgText => {
        const karteContainer = document.getElementById('karte-svg-container');
        if (!karteContainer) return;
        karteContainer.innerHTML = svgText;
        initKarteInteractions();
    });

function initKarteInteractions() {
    const cityToCardMap = {
        Holzminden: 'Karte_Holzminden',
        'Göttingen': 'Karte_Göttingen',
        Hildesheim: 'Karte_Hildesheim'
    };

    const gebietLayer = document.getElementById('Gebiet');
    if (gebietLayer) {
        gebietLayer.classList.add('karte-gebiet-hidden');
    }

    const cardIds = Object.values(cityToCardMap);
    cardIds.forEach((cardId) => {
        const cardLayer = document.getElementById(cardId);
        if (!cardLayer) return;
        cardLayer.classList.add('karte-city-card', 'karte-city-card-hidden');
        cardLayer.classList.remove('karte-city-card-visible');
    });

    function showCityCard(targetCardId) {
        const cardLayer = document.getElementById(targetCardId);
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
        const cityLayer = document.getElementById(cityId);
        if (!cityLayer) return;

        cityLayer.classList.add('karte-city-layer');
        cityLayer.style.cursor = 'pointer';

        cityLayer.addEventListener('mouseenter', () => {
            cityLayer.classList.add('karte-city-layer-hover');
        });

        cityLayer.addEventListener('mouseleave', () => {
            cityLayer.classList.remove('karte-city-layer-hover');
        });

        cityLayer.addEventListener('click', (event) => {
            event.stopPropagation();
            showCityCard(cardId);
        });
    });
}

function initSectionReveal() {
    const revealElements = document.querySelectorAll('.reveal-on-scroll');
    if (!revealElements.length) return;

    function updateTransforms() {
        const windowHeight = window.innerHeight;
        const headerOffset = 60; // passend zur sticky-header Hoehe

        revealElements.forEach(el => {
            const section = el.closest('.section');
            if (!section) return;

            const rect = section.getBoundingClientRect();

            // Fortschritt berechnen:
            // 0 wenn der Abschnitt unten am Bildschirmrand auftaucht (rect.top = windowHeight)
            // 1 wenn der Abschnitt oben eingerastet ist (rect.top = headerOffset)
            let progress = (windowHeight - rect.top) / (windowHeight - headerOffset);
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
    const loadingId = 'Gelingendes_Studium';
    const buildGroups = [
        { ids: ['Ziele'], delay: 0 },
        { ids: ['K1', 'K2', 'K3', 'K4'], delay: 0.12 },
        { ids: ['F', 'SGE', 'NHK', 'KIR', 'QST'], delay: 0.24 }
    ];
    const retractIds = ['F', 'SGE', 'KIR', 'NHK'];

    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
        loadingElement.classList.add('loading-symbol-minimal');
    }
    buildGroups.forEach(group => {
        group.ids.forEach(id => {
            const element = document.getElementById(id);
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
                const element = document.getElementById(id);
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
                const element = document.getElementById(id);
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
    // Liste der interaktiven Elemente
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
        const section = document.getElementById(sectionId);
        if (!section) return;

        section.classList.remove('retract-unit', 'intro-hidden', 'intro-unit');
        section.style.animationDelay = '0s';
        void section.getBoundingClientRect();
        section.classList.add('intro-unit');
    }

    function collapseSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (!section) return;

        section.classList.remove('intro-unit', 'intro-hidden', 'retract-unit');
        section.style.animationDelay = '0s';
        void section.getBoundingClientRect();
        section.classList.add('retract-unit');
    }

    function toggleLinkedSection(controlId) {
        const targetId = linkedSections[controlId];
        if (!targetId) return;

        const target = document.getElementById(targetId);
        if (!target) return;

        if (target.classList.contains('retract-unit') || target.classList.contains('intro-hidden')) {
            expandSection(targetId);
            return;
        }

        collapseSection(targetId);
    }

    elements.forEach(id => {
        const element = document.getElementById(id);
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
            const el = document.getElementById(id);
            if (el) el.classList.remove('svg-element-active');
        });
        hideHint();
    });
}

function initGLSTUInteractions() {
    const layerMap = {
        Lehrende: 'O_x5F_Lehrende',
        Studierende: 'O_x5F_Studierende',
        Hochschule: 'O_x5F_Hochschule'
    };
    const overlayIds = Object.values(layerMap);

    overlayIds.forEach(id => {
        const overlay = document.getElementById(id);
        if (overlay) {
            overlay.classList.add('glstu-overlay', 'glstu-overlay-hidden');
        }
    });

    function showOverlay(targetId) {
        const target = document.getElementById(targetId);
        const isVisible = target ? target.classList.contains('glstu-overlay-visible') : false;

        overlayIds.forEach(id => {
            const overlay = document.getElementById(id);
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
        const baseLayer = document.getElementById(baseId);
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
        });
    });
}

// Meilensteine Interaction
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

// Hover-Verknüpfung zwischen Ziel-Ringen und Ziel-Karten
function initZielInteractions() {
    const ringToZielMap = {
        'Außen': '.meilensteine-ziel.ziel-1',
        'Mitte': '.meilensteine-ziel.ziel-2',
        'Innen': '.meilensteine-ziel.ziel-3'
    };

    Object.entries(ringToZielMap).forEach(([ringId, zielSelector]) => {
        const ringGroup = document.getElementById(ringId);
        const zielCard = document.querySelector(zielSelector);
        if (!ringGroup || !zielCard) return;

        ringGroup.style.transformBox = 'fill-box';
        ringGroup.style.transformOrigin = '50% 50%';

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
    });
}

// Querschnittsthemen Slideshow
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

        timeline.scrollLeft += dominantDelta;
        event.preventDefault();
    }, { passive: false });
}

function initTeilzieleRowSync() {
    const matrix = document.querySelector('.teilziele-matrix');
    if (!matrix) return;

    if (matrix.dataset.rowSyncBound === 'true') return;
    matrix.dataset.rowSyncBound = 'true';

    const stickyGoals = Array.from(matrix.querySelectorAll('.teilziele-sticky-goal'));
    const rowSelectors = ['.teilziele-cell-1', '.teilziele-cell-2', '.teilziele-cell-3'];

    let scheduled = false;

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
}

function initWissensspeicherReveal() {
    const stepsWrap = document.querySelector('.wissensspeicher-steps');
    if (!stepsWrap) return;
    if (stepsWrap.dataset.revealBound === 'true') return;

    stepsWrap.dataset.revealBound = 'true';

    const steps = Array.from(stepsWrap.querySelectorAll('.wissensspeicher-step'));
    steps.forEach((step, index) => {
        step.style.transitionDelay = `${index * 0.12}s`;
    });

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            stepsWrap.classList.add('wissensspeicher-steps-visible');
            steps.forEach((step) => {
                step.classList.add('wissensspeicher-step-visible');
            });
            obs.unobserve(entry.target);
        });
    }, {
        threshold: 0.25,
        rootMargin: '0px 0px -8% 0px'
    });

    observer.observe(stepsWrap);
}

function initWissensspeicherSlidein() {
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

function initKurzportraitScrollNarrative() {
    const section = document.getElementById('kurzportrait');
    if (!section) return;
    if (section.dataset.narrativeBound === 'true') return;

    const pages = Array.from(section.querySelectorAll('.kurzportrait-text-page'));
    if (pages.length < 2) return;

    section.dataset.narrativeBound = 'true';

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const maxProgress = pages.length - 1;
    let progress = 0;

    function applyStaticMobileState() {
        pages.forEach((page) => {
            page.style.transform = '';
            page.style.opacity = '';
        });
    }

    function render() {
        if (mediaQuery.matches) {
            applyStaticMobileState();
            return;
        }

        pages.forEach((page, index) => {
            const relative = index - progress;
            const translateY = relative * 120;
            const opacity = Math.max(0, 1 - Math.min(1, Math.abs(relative)));

            page.style.transform = `translateY(${translateY}%)`;
            page.style.opacity = opacity.toFixed(3);
        });
    }

    function isSectionActive() {
        const rect = section.getBoundingClientRect();
        const viewportMid = window.innerHeight * 0.5;
        return rect.top <= viewportMid && rect.bottom >= viewportMid;
    }

    window.addEventListener('wheel', (event) => {
        if (mediaQuery.matches) return;
        if (!isSectionActive()) return;

        const delta = event.deltaY;
        const atStart = progress <= 0.001;
        const atEnd = progress >= maxProgress - 0.001;

        if ((delta > 0 && !atEnd) || (delta < 0 && !atStart)) {
            event.preventDefault();
            progress += delta / 700;
            progress = Math.max(0, Math.min(maxProgress, progress));
            render();
        }
    }, { passive: false });

    mediaQuery.addEventListener('change', render);
    window.addEventListener('resize', render, { passive: true });
    render();
}

// Initialize slideshow when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initMeilesteine();
    initQSTSlideshow();
    initTeilzieleTimeline();
    initTeilzieleRowSync();
    initKurzportraitScrollNarrative();
    initWissensspeicherReveal();
    initWissensspeicherSlidein();
});

// Also run if script is loaded after DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initMeilesteine();
        initQSTSlideshow();
        initTeilzieleTimeline();
        initTeilzieleRowSync();
        initKurzportraitScrollNarrative();
        initWissensspeicherReveal();
        initWissensspeicherSlidein();
    });
} else {
    initMeilesteine();
    initQSTSlideshow();
    initTeilzieleTimeline();
    initTeilzieleRowSync();
    initKurzportraitScrollNarrative();
    initWissensspeicherReveal();
    initWissensspeicherSlidein();
}
