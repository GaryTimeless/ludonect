<template>
  <div class="landing-page">

    <!-- ===== NAVBAR ===== -->
    <header class="lp-navbar">
      <div class="lp-navbar-inner">
        <router-link to="/" class="lp-logo-link">
          <img src="@/assets/ludonect_otter_logo-removebg.png" alt="Ludonect" class="lp-nav-logo" />
        </router-link>
        <nav class="lp-nav-links">
          <a href="#how-it-works">So funktioniert's</a>
          <a href="#b2b">Eigene Fragen</a>
          <a href="#pricing">Preise</a>
        </nav>
        <div class="lp-nav-actions">
          <v-btn color="primary" variant="elevated" rounded="pill" size="small" to="/play">
            Jetzt spielen
          </v-btn>
        </div>
        <button class="lp-hamburger" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = !mobileMenuOpen" aria-label="Menü öffnen">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="lp-mobile-menu" :class="{ open: mobileMenuOpen }" @click="mobileMenuOpen = false">
        <a href="#how-it-works">So funktioniert's</a>
        <a href="#b2b">Eigene Fragen</a>
        <a href="#pricing">Preise</a>
      </div>
    </header>

    <!-- ===== SEKTION 1: HERO ===== -->
    <section class="hero-section">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="7" class="text-center">

            <img src="@/assets/ludonect_combo.png" alt="Ludonect" class="hero-combo-logo mb-8" />

            <div class="hero-badge mb-6">
              <v-icon icon="mdi-check-circle" size="16" color="primary" class="mr-1" />
              Kostenlos · Ab 3 Spieler · Schnell erklärt
            </div>

            <h1 class="hero-headline">
              <span class="hero-headline-nowrap">Eine Frage. Eine Zahl.</span><br />
              <span class="hero-headline-accent hero-headline-nowrap">So entstehen Insider.</span>
            </h1>

            <p class="hero-subheadline mt-6">
              Ludonect ist ein Kennenlernspiel fürs Handy. Alle beantworten eine Frage
              mit einer Zahl von 0 bis 100, dann schätzt ihr euch gegenseitig ein —
              der Rest passiert von allein.
            </p>

            <div class="hero-cta mt-10">
              <v-btn
                color="primary"
                variant="elevated"
                size="x-large"
                rounded="pill"
                elevation="0"
                class="hero-btn-primary"
                to="/demo"
              >
                🎮 Demo spielen – 30 Sek.
              </v-btn>
              <v-btn
                color="primary"
                variant="outlined"
                size="large"
                rounded="pill"
                elevation="0"
                class="hero-btn-secondary"
                to="/play"
              >
                <v-icon icon="mdi-rocket-launch" class="mr-2" />
                Jetzt Raum erstellen
              </v-btn>
            </div>

            <div class="hero-trust mt-12">
              <span><v-icon icon="mdi-lock-open-outline" color="primary" size="18" /> Kein Login</span>
              <span><v-icon icon="mdi-timer-outline" color="primary" size="18" /> In 60 Sekunden loslegen</span>
            </div>
            <div class="hero-trust mt-2">
              <span><v-icon icon="mdi-cards-playing-outline" color="primary" size="18" /> Egal ob Spieleabend oder Workshop</span>
            </div>

          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ===== SEKTION 2: HOW IT WORKS ===== -->
    <section id="how-it-works" class="section-white">
      <v-container>
        <div class="section-label">So funktioniert's</div>
        <h2 class="section-title">Drei Schritte. Clevere Fragen. Echte Oha-Momente.</h2>

        <v-row class="mt-10" justify="center">
          <v-col v-for="step in steps" :key="step.number" cols="12" sm="4">
            <v-card class="step-card" elevation="0">
              <div class="step-number">{{ step.number }}</div>
              <div class="step-icon-wrap">
                <v-icon :icon="step.icon" size="32" color="primary" />
              </div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-text">{{ step.text }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ===== SEKTION 4: B2B ===== -->
    <section id="b2b" class="section-cream">
      <v-container>
        <v-row align="center" justify="center">
          <v-col cols="12" md="6" class="pr-md-12">
            <div class="section-label">Eigene Fragen. Eigenes Branding.</div>
            <h2 class="section-title text-left">Dein Spiel.<br />Deine Fragen.</h2>
            <p class="b2b-text mt-4">
              Erstell eigene Fragen, die zu eurem Kontext passen — ob Team-Workshop,
              Onboarding oder Spieleabend. Mit eigenem Logo und Farben wird Ludonect
              zu deinem Format.
            </p>

            <div class="b2b-features mt-8">
              <div v-for="f in b2bFeatures" :key="f.text" class="b2b-feature-item">
                <v-icon :icon="f.icon" color="primary" size="20" class="mr-3" />
                <span>{{ f.text }}</span>
              </div>
            </div>

            <v-btn
              href="mailto:hello@ludonect.de"
              color="primary"
              variant="outlined"
              rounded="pill"
              class="mt-8"
              size="large"
            >
              <v-icon icon="mdi-email-outline" class="mr-2" />
              Business-Anfrage stellen
            </v-btn>
          </v-col>

          <v-col cols="12" md="5" class="mt-8 mt-md-0">
            <div class="b2b-visual">
              <div class="b2b-carousel">
                <div class="b2b-carousel-track" :style="{ transform: `translateX(-${carouselIndex * 100}%)` }">
                  <div v-for="slide in carouselSlides" :key="slide.label" class="b2b-carousel-slide">
                    <div class="b2b-carousel-label">
                      <v-icon :icon="slide.icon" size="16" />
                      {{ slide.label }}
                    </div>
                    <div class="b2b-card-mock">
                      <div class="mock-header">
                        <div class="mock-logo-placeholder">
                          <v-icon icon="mdi-office-building" size="20" color="primary" />
                          <span>Dein Logo</span>
                        </div>
                      </div>
                      <div class="mock-question">{{ slide.question }}</div>
                      <div class="mock-scale">
                        <span class="mock-scale-label">0</span>
                        <div class="mock-scale-bar">
                          <div class="mock-scale-fill" :style="{ width: slide.fill + '%' }"></div>
                        </div>
                        <span class="mock-scale-label">100</span>
                      </div>
                      <div class="mock-players">
                        <span v-for="emoji in ['🦊','🐼','🦁','🐨']" :key="emoji" class="mock-avatar">{{ emoji }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="b2b-carousel-dots">
                  <button
                    v-for="(_, i) in carouselSlides"
                    :key="i"
                    class="b2b-carousel-dot"
                    :class="{ active: carouselIndex === i }"
                    @click="goToSlide(i)"
                  ></button>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ===== SEKTION 5: PRICING ===== -->
    <section id="pricing" class="section-white">
      <v-container>
        <div class="section-label">Preise</div>
        <h2 class="section-title">Einfach losspielen. Zahlen nur wenn du mehr willst.</h2>


        <v-row class="mt-10" justify="center">
          <v-col v-for="plan in pricingPlans" :key="plan.name" cols="12" sm="6" md="3">
            <v-card
              class="pricing-card"
              :class="{ 'pricing-card-featured': plan.featured }"
              elevation="0"
            >
              <div v-if="plan.badge" class="pricing-badge">{{ plan.badge }}</div>
              <div class="pricing-icon-wrap">
                <v-icon :icon="plan.icon" size="28" :color="plan.featured ? 'white' : 'primary'" />
              </div>
              <h3 class="pricing-name">{{ plan.name }}</h3>
              <div class="pricing-price">
                <span class="pricing-amount">{{ plan.price }}</span>
                <span class="pricing-period" v-if="plan.period">{{ plan.period }}</span>
              </div>
              <p class="pricing-tagline">{{ plan.tagline }}</p>
              <ul class="pricing-features">
                <li v-for="f in plan.features" :key="f">
                  <v-icon icon="mdi-check" size="16" :color="plan.featured ? 'white' : 'primary'" />
                  {{ f }}
                </li>
              </ul>
              <v-btn
                :color="plan.featured ? 'white' : 'primary'"
                :variant="plan.featured ? 'elevated' : 'outlined'"
                :class="{ 'text-primary': plan.featured }"
                rounded="pill"
                block
                elevation="0"
                class="mt-auto"
                  :to="plan.cta === '/play' ? '/play' : undefined"
                @click="plan.cta !== '/play' ? openContactPopup(plan) : undefined"
              >
                {{ plan.ctaLabel }}
              </v-btn>
            </v-card>
          </v-col>
        </v-row>

        <p class="pricing-disclaimer mt-8">
          Keine Kreditkarte für Free erforderlich. Jederzeit kündbar. MwSt. ggf. zzgl.
        </p>
      </v-container>
    </section>

    <!-- ===== SEKTION 6: FOOTER ===== -->
    <footer class="lp-footer">
      <v-container>
        <div class="footer-inner">
          <div class="footer-brand">
            <img src="@/assets/ludonect_combo.png" alt="Ludonect" class="footer-logo" />
            <p class="footer-tagline">play. connect. grow.</p>
            <p class="footer-made">Made with 🦦 in Germany</p>
          </div>
          <div class="footer-links">
            <a href="/legal#impressum">Impressum</a>
            <a href="/legal#datenschutz">Datenschutz</a>
            <a href="mailto:hello@ludonect.de">hello@ludonect.de</a>
          </div>
        </div>
        <p class="footer-copy">© {{ new Date().getFullYear() }} Ludonect. Alle Rechte vorbehalten.</p>
      </v-container>
    </footer>

  <!-- ===== KONTAKT POPUP ===== -->
  <v-dialog v-model="contactPopup" max-width="420">
    <v-card rounded="xl">
      <v-card-title class="pt-6 px-6 text-h6 font-weight-bold" style="color:#385028">
        {{ contactPopupPlan?.ctaLabel }}
      </v-card-title>
      <v-card-text class="px-6 pb-2" style="color:#5a7042">
        Schreib uns eine kurze Mail — wir melden uns innerhalb von 24 Stunden bei dir.
      </v-card-text>
      <v-card-actions class="px-6 pb-6 gap-3 flex-column">
        <v-btn
          color="primary"
          variant="elevated"
          rounded="pill"
          block
          :href="`mailto:hello@ludonect.de?subject=${encodeURIComponent(contactPopupPlan?.name + ' Anfrage')}`"
          @click="contactPopup = false"
        >
          <v-icon start>mdi-email-outline</v-icon>
          hello@ludonect.de schreiben
        </v-btn>
        <v-btn
          variant="text"
          color="secondary"
          rounded="pill"
          block
          @click="contactPopup = false"
        >
          Schließen
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const mobileMenuOpen = ref(false)

const contactPopup = ref(false)
const contactPopupPlan = ref<any>(null)
function openContactPopup(plan: any) {
  contactPopupPlan.value = plan
  contactPopup.value = true
}

const steps = [
  {
    number: '01',
    icon: 'mdi-comment-question-outline',
    title: 'Frage beantworten',
    text: 'Eine Frage erscheint — zum Beispiel: „Wie gut kochst du ohne Rezept?" Jeder gibt geheim eine Zahl von 0 bis 100 ab. Kein Richtig oder Falsch, nur deine ehrliche Einschätzung.',
  },
  {
    number: '02',
    icon: 'mdi-sort-variant',
    title: 'Gegenseitig einschätzen',
    text: 'Die Zahlen sind verdeckt. Nacheinander platziert sich jeder in einer Rangliste — nur anhand der Einschätzung: Wer hat wohl höher, wer niedriger geantwortet?',
  },
  {
    number: '03',
    icon: 'mdi-lightbulb-on-outline',
    title: 'Auflösung & Oha-Momente',
    text: 'Die Wahrheit kommt raus — und mit ihr die besten Gespräche. So entstehen Verbindungen, die bleiben. Von Praktikant bis Partner.',
  },
]

const usps = [
  {
    icon: 'mdi-emoticon-cool-outline',
    title: 'Cringe-Free & Inklusiv',
    text: 'Zahlen sind objektiv. Kein soziales Spotlighting, kein Zwang zur persönlichen Offenbarung — perfekt für introvertierte und internationale Teams.',
  },
  {
    icon: 'mdi-shield-account-outline',
    title: 'Psychologische Sicherheit',
    text: 'Das kooperative Raten kollektiviert den „Fehler". Niemand steht allein da. Ein sicherer Raum, in dem jeder mitmacht.',
  },
  {
    icon: 'mdi-laptop-off',
    title: 'Zoom-Fatigue Killer',
    text: 'Kognitiv leichtgewichtig, keine chaotischen Avatare oder 3D-Welten. Ludonect läuft im Browser — ohne IT-Freigabe, ohne Installations-Chaos.',
  },
  {
    icon: 'mdi-wifi',
    title: '100% Browserbasiert',
    text: 'Keine App-Downloads. Kein firmeneigener IT-Freigabeprozess. Einfach Link teilen — und alle sind dabei. In 60 Sekunden.',
  },
  {
    icon: 'mdi-earth',
    title: 'Remote & Hybrid',
    text: 'Ob alle im Raum sitzen oder verteilt über drei Zeitzonen: Ludonect funktioniert nahtlos für in-person und remote gleichzeitig.',
  },
  {
    icon: 'mdi-chart-timeline-variant',
    title: 'Für L&D & Advisory',
    text: 'Pulse-Checks, Retrospektiven, Onboardings, Kick-offs — Ludonect passt sich jedem Format an, ohne wie ein Kinderspiel auszusehen.',
  },
]

const b2bFeatures = [
  { icon: 'mdi-file-question-outline', text: 'Eigene Fragen erstellen' },
  { icon: 'mdi-palette-outline', text: 'Eigene Markenfarben & Logo' },
  { icon: 'mdi-account-multiple-plus-outline', text: 'Unbegrenzte Teilnehmer' },
]

// Carousel
const carouselSlides = [
  { label: 'Consulting', icon: 'mdi-briefcase-outline', question: '„Wie sicher fühlst du dich, im Meeting zu widersprechen?"', fill: 45 },
  { label: 'Software Engineering', icon: 'mdi-code-tags', question: '„Wie sehr magst du Code Reviews?"', fill: 62 },
  { label: 'Finance & Accounting', icon: 'mdi-calculator-variant', question: '„Wie wohl fühlst du dich mit Deadlines?"', fill: 80 },
  { label: 'Spieleabend', icon: 'mdi-cards-playing-outline', question: '„Wie gut kochst du ohne Rezept?"', fill: 35 },
]

const carouselIndex = ref(0)
let carouselInterval: ReturnType<typeof setInterval> | null = null

function goToSlide(i: number) {
  carouselIndex.value = i
  if (carouselInterval) { clearInterval(carouselInterval); startCarousel() }
}

function startCarousel() {
  carouselInterval = setInterval(() => {
    carouselIndex.value = (carouselIndex.value + 1) % carouselSlides.length
  }, 4000)
}

onMounted(startCarousel)
onBeforeUnmount(() => { if (carouselInterval) clearInterval(carouselInterval) })

const pricingPlans = [
  {
    name: 'Free',
    icon: 'mdi-sprout',
    price: '0 €',
    period: '/ immer',
    tagline: 'Perfekt zum Ausprobieren. Keine Kreditkarte.',
    features: [
      'Unbegrenzte Spieler',
      'Standard-Fragenkatalog',
      'Unbegrenzte Runden',
      'Sofort startbereit',
    ],
    cta: '/play',
    ctaLabel: 'Kostenlos starten',
    featured: false,
    badge: null,
  },
  {
    name: 'Event Pass',
    icon: 'mdi-ticket-outline',
    price: '5 €',
    period: '/ 24 Stunden',
    tagline: 'Für Workshops & Trainings. Einmal zahlen, 24h nutzen.',
    features: [
      'Voller Premium-Zugriff',
      'Eigene Fragen erstellen',
      'Custom Branding',
      'Als „Digitale Materialien" abrechenbar',
    ],
    cta: 'mailto:hello@ludonect.de',
    ctaLabel: 'Event Pass kaufen',
    featured: true,
    badge: '🏆 Bestseller',
  },
  {
    name: 'Pro',
    icon: 'mdi-briefcase-outline',
    price: '15 €',
    period: '/ Monat',
    tagline: 'Für Trainer mit regelmäßigen Workshops.',
    features: [
      'Alles aus Event Pass',
      'Fragen dauerhaft speichern',
      'Unbegrenzte Premium-Räume',
      'Prioritäts-Support',
    ],
    cta: 'mailto:hello@ludonect.de',
    ctaLabel: 'Pro kaufen',
    featured: false,
    badge: null,
  },
  {
    name: 'Enterprise',
    icon: 'mdi-office-building-outline',
    price: 'Auf Anfrage',
    period: '',
    tagline: 'Full-Whitelabel für Beratungshäuser & Konzerne.',
    features: [
      'Full Whitelabel',
      'SSO-Integration',
      'Dedizierter Kundenbetreuer',
      'SLA & Datenschutzvertrag',
    ],
    cta: 'mailto:hello@ludonect.de',
    ctaLabel: 'Kontakt aufnehmen',
    featured: false,
    badge: null,
  },
]
</script>

<style scoped>
/* ===== BASE ===== */
.landing-page {
  font-family: 'Tenor Sans', Arial, sans-serif;
  color: #385028;
  background: #fff;
}

/* ===== NAVBAR ===== */
.lp-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(89,152,26,0.12);
}
.lp-navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lp-logo-link { text-decoration: none; flex-shrink: 0; }
.lp-nav-logo { height: 40px; width: auto; object-fit: contain; display: block; }
.lp-nav-links {
  display: flex;
  align-items: center;
  gap: 36px;
}
.lp-nav-links a {
  color: #385028;
  text-decoration: none;
  font-size: 1rem;
  opacity: 0.75;
  transition: opacity 0.2s;
  letter-spacing: 0.01em;
}
.lp-nav-links a:hover { opacity: 1; }

.lp-nav-actions {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.lp-hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}
.lp-hamburger span {
  display: block;
  height: 2px;
  background: #385028;
  border-radius: 2px;
  transition: transform 0.25s, opacity 0.25s;
}
.lp-hamburger.open span:nth-child(1) { transform: translateY(9px) rotate(45deg); }
.lp-hamburger.open span:nth-child(2) { opacity: 0; }
.lp-hamburger.open span:nth-child(3) { transform: translateY(-9px) rotate(-45deg); }

.lp-mobile-menu {
  display: none;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px 20px;
  background: #f4f9ee;
  border-bottom: 1px solid rgba(89,152,26,0.15);
}
.lp-mobile-menu a {
  color: #385028;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  padding: 6px 0;
}

@media (max-width: 640px) {
  .lp-navbar-inner { position: relative; }
  .lp-nav-links { display: none; }
  .lp-nav-actions {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }
  .lp-hamburger { display: flex; }
  .lp-mobile-menu.open { display: flex; }
}

/* ===== HERO ===== */
.hero-section {
  background: linear-gradient(180deg, #EDFFCC 0%, #EDFFCC 85%, #ffffff 100%);
  padding: 40px 0 80px;
  min-height: 85vh;
  display: flex;
  align-items: center;
}
.hero-combo-logo {
  display: block;
  margin: 0 auto;
  height: 400px;
  width: auto;
}
@media (max-width: 480px) {
  .hero-combo-logo {
    height: auto;
    width: 90%;
  }
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  background: rgba(89,152,26,0.1);
  border: 1px solid rgba(89,152,26,0.3);
  color: #59981A;
  font-size: 0.82rem;
  padding: 6px 14px;
  border-radius: 99px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.hero-headline {
  font-size: clamp(1rem, 5vw, 3.5rem);
  font-weight: 700;
  line-height: 1.15;
  color: #385028;
}
.hero-headline-nowrap { white-space: nowrap; }
.hero-headline-accent { color: #59981A; }
.hero-subheadline {
  font-size: clamp(1rem, 1.5vw, 1.3rem);
  color: #5a7042;
  line-height: 1.7;
  max-width: 640px;
  margin: 0 auto;
}
.hero-cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28px;
  flex-wrap: wrap;
}
.hero-btn-primary { min-width: 220px; font-size: 1.05rem; }
.hero-btn-secondary { min-width: 180px; font-size: 0.95rem; }
.hero-link-secondary {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #59981A;
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
}
.hero-trust {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 24px;
  font-size: 0.85rem;
  color: #5a7042;
}
.hero-trust span {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ===== WAVE ===== */
.wave-divider svg {
  display: block;
  width: 100%;
  height: 60px;
  background: linear-gradient(160deg, #EDFFCC 0%, #f5ffe0 100%);
}

/* ===== SECTIONS ===== */
.section-white { background: #ffffff; padding: 80px 0; }
.section-cream { background: #f7ffed; padding: 80px 0; }
.section-label {
  text-align: center;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #59981A;
  margin-bottom: 16px;
}
.section-title {
  text-align: center;
  font-size: clamp(1.6rem, 3.5vw, 2.4rem);
  font-weight: 700;
  color: #385028;
  line-height: 1.25;
}
.section-subtitle {
  text-align: center;
  max-width: 600px;
  margin: 16px auto 0;
  color: #5a7042;
  font-size: 1rem;
  line-height: 1.7;
}

/* ===== STEPS ===== */
.step-card {
  background: transparent;
  text-align: center;
  padding: 24px 16px;
}
.step-number {
  font-size: 3rem;
  font-weight: 700;
  color: rgba(89,152,26,0.12);
  line-height: 1;
  margin-bottom: 8px;
}
.step-icon-wrap {
  background: rgba(89,152,26,0.08);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}
.step-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.step-text { font-size: 0.92rem; color: #5a7042; line-height: 1.6; }

/* ===== USPs ===== */
.usp-card {
  padding: 28px 20px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid rgba(89,152,26,0.1);
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
}
.usp-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(89,152,26,0.12); }
.usp-icon-wrap {
  background: rgba(89,152,26,0.08);
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.usp-title { font-size: 1rem; font-weight: 700; margin-bottom: 8px; }
.usp-text { font-size: 0.88rem; color: #5a7042; line-height: 1.6; }

/* ===== B2B ===== */
.b2b-text { color: #385028; line-height: 1.7; }
.b2b-quote {
  background: rgba(89,152,26,0.07);
  border-left: 3px solid #59981A;
  padding: 12px 16px;
  border-radius: 0 10px 10px 0;
  color: #5a7042;
  font-size: 0.92rem;
  line-height: 1.8;
}
.b2b-feature-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(89,152,26,0.1);
  font-size: 0.92rem;
}
.b2b-visual { display: flex; justify-content: center; width: 100%; }

/* Carousel */
.b2b-carousel {
  width: 100%;
  max-width: 360px;
  overflow: hidden;
}
.b2b-carousel-track {
  display: flex;
  transition: transform 0.4s ease;
}
.b2b-carousel-slide {
  min-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.b2b-carousel-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(89,152,26,0.1);
  border: 1px solid rgba(89,152,26,0.3);
  color: #59981A;
  font-size: 0.82rem;
  padding: 6px 14px;
  border-radius: 99px;
  font-weight: 600;
  margin-bottom: 16px;
}
.b2b-carousel-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 20px;
}
.b2b-carousel-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(89,152,26,0.2);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}
.b2b-carousel-dot.active { background: #59981A; }
.b2b-card-mock {
  background: #fff;
  border: 1px solid rgba(89,152,26,0.15);
  border-radius: 20px;
  padding: 28px;
  width: 100%;
  max-width: 340px;
  box-shadow: 0 12px 40px rgba(89,152,26,0.1);
}
.mock-header { display: flex; align-items: center; margin-bottom: 20px; }
.mock-logo-placeholder {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  color: #59981A;
  font-weight: 600;
  background: rgba(89,152,26,0.08);
  padding: 6px 12px;
  border-radius: 10px;
}
.mock-question {
  font-size: 0.95rem;
  font-weight: 600;
  color: #385028;
  margin-bottom: 16px;
  line-height: 1.4;
}
.mock-scale {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.mock-scale-label { font-size: 0.75rem; color: #5a7042; }
.mock-scale-bar { flex: 1; height: 8px; background: rgba(89,152,26,0.15); border-radius: 99px; overflow: hidden; }
.mock-scale-fill { height: 100%; background: #59981A; border-radius: 99px; }
.mock-players { display: flex; gap: 8px; }
.mock-avatar {
  width: 36px;
  height: 36px;
  background: rgba(89,152,26,0.08);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

/* ===== PRICING ===== */
.pricing-card {
  background: #fff;
  border: 1px solid rgba(89,152,26,0.15);
  border-radius: 20px;
  padding: 28px 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: transform 0.2s;
  overflow: visible;
}
.pricing-card:hover { transform: translateY(-4px); }
.pricing-card-featured {
  background: #59981A;
  border-color: #59981A;
  color: #fff;
  box-shadow: 0 16px 40px rgba(89,152,26,0.3);
  transform: scale(1.03);
}
.pricing-card-featured:hover { transform: scale(1.03) translateY(-4px); }
.pricing-card-featured .pricing-name,
.pricing-card-featured .pricing-amount,
.pricing-card-featured .pricing-period,
.pricing-card-featured .pricing-tagline { color: #fff !important; }
.pricing-card-featured .pricing-features li { color: rgba(255,255,255,0.9); }
.pricing-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: #385028;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 99px;
  white-space: nowrap;
}
.pricing-icon-wrap {
  width: 52px;
  height: 52px;
  background: rgba(89,152,26,0.08);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}
.pricing-card-featured .pricing-icon-wrap { background: rgba(255,255,255,0.2); }
.pricing-name { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
.pricing-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 8px; }
.pricing-amount { font-size: 2rem; font-weight: 700; color: #385028; }
.pricing-period { font-size: 0.85rem; color: #5a7042; }
.pricing-tagline { font-size: 0.85rem; color: #5a7042; margin-bottom: 20px; line-height: 1.5; }
.pricing-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px;
  flex: 1;
}
.pricing-features li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 0.87rem;
  padding: 5px 0;
  color: #385028;
  line-height: 1.4;
}
.pricing-disclaimer {
  text-align: center;
  font-size: 0.82rem;
  color: #5a7042;
  opacity: 0.8;
}

/* ===== FOOTER ===== */
.lp-footer {
  background: #385028;
  color: rgba(255,255,255,0.85);
  padding: 48px 0 24px;
}
.footer-inner {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 32px;
  margin-bottom: 32px;
}
.footer-logo { height: 32px; filter: brightness(0) invert(1); }
.footer-tagline { font-size: 0.85rem; opacity: 0.7; margin-top: 8px; }
.footer-made { font-size: 0.82rem; opacity: 0.5; margin-top: 4px; }
.footer-links {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.footer-links a {
  color: rgba(255,255,255,0.7);
  text-decoration: none;
  font-size: 0.88rem;
  transition: color 0.2s;
}
.footer-links a:hover { color: #fff; }
.footer-copy {
  text-align: center;
  font-size: 0.78rem;
  opacity: 0.45;
  border-top: 1px solid rgba(255,255,255,0.1);
  padding-top: 20px;
}
</style>
