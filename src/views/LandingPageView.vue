<template>
  <div class="landing-page">

    <!-- ===== NAVBAR ===== -->
    <header class="lp-navbar">
      <div class="lp-navbar-inner">
        <router-link to="/" class="lp-logo-link">
          <img src="@/assets/ludonect_otter_logo-removebg.png" alt="Ludonect" class="lp-nav-logo" />
        </router-link>
        <nav class="lp-nav-links">
          <a href="#how-it-works">Wie es funktioniert</a>
          <a href="#pricing">Preise</a>
          <a href="#b2b">Für Teams</a>
          <v-btn color="primary" variant="elevated" rounded="pill" size="small" to="/play">
            Jetzt spielen
          </v-btn>
        </nav>
      </div>
    </header>

    <!-- ===== SEKTION 1: HERO ===== -->
    <section class="hero-section">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="7" class="text-center">

            <div class="hero-badge mb-6">
              <v-icon icon="mdi-check-circle" size="16" color="primary" class="mr-1" />
              Keine App. Kein Login. 100% Browserbasiert.
            </div>

            <h1 class="hero-headline">
              Schluss mit Small Talk.<br />
              <span class="hero-headline-accent">Lernt euch wirklich kennen.</span>
            </h1>

            <p class="hero-subheadline mt-6">
              Die Engine für professionelle Team-Synchronisation.<br />
              Verbindet Hierarchien in unter 5 Minuten — perfekt für
              Workshops, Remote-Meetings und Onboardings.
            </p>

            <div class="hero-cta mt-10">
              <v-btn
                color="primary"
                variant="elevated"
                size="x-large"
                rounded="pill"
                elevation="0"
                class="hero-btn-primary"
                to="/play"
              >
                <v-icon icon="mdi-rocket-launch" class="mr-2" />
                Jetzt Raum erstellen
              </v-btn>
              <a href="#how-it-works" class="hero-link-secondary">
                Wie funktioniert's?
                <v-icon icon="mdi-arrow-down" size="16" />
              </a>
            </div>

            <div class="hero-trust mt-12">
              <span><v-icon icon="mdi-shield-check" color="primary" size="18" /> Cringe-Free</span>
              <span><v-icon icon="mdi-account-group" color="primary" size="18" /> Bis zu 20 Spieler</span>
              <span><v-icon icon="mdi-wifi" color="primary" size="18" /> Remote-Ready</span>
              <span><v-icon icon="mdi-timer-outline" color="primary" size="18" /> Startbereit in 60s</span>
            </div>

          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ===== WAVES DIVIDER ===== -->
    <div class="wave-divider">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill="#ffffff" />
      </svg>
    </div>

    <!-- ===== SEKTION 2: HOW IT WORKS ===== -->
    <section id="how-it-works" class="section-white">
      <v-container>
        <div class="section-label">Spielmechanik</div>
        <h2 class="section-title">In 3 Schritten zum echten Gespräch.</h2>
        <p class="section-subtitle">
          Kein Vortrag. Kein Warm-Up mit peinlichen Eiswürfeln. Nur Daten, Neugier und überraschende Erkenntnisse.
        </p>

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

    <!-- ===== SEKTION 3: USPs ===== -->
    <section class="section-cream">
      <v-container>
        <div class="section-label">Für wen ist Ludonect?</div>
        <h2 class="section-title">Professionell. Inklusiv. Ohne Cringe.</h2>
        <p class="section-subtitle">
          Ludonect wurde mit Blick auf Advisory, Tax, L&amp;D und Consulting entwickelt —
          Umgebungen, in denen andere Tools schnell als „zu verspielt" gelten.
        </p>

        <v-row class="mt-10" justify="center">
          <v-col v-for="usp in usps" :key="usp.title" cols="12" sm="6" md="4">
            <div class="usp-card">
              <div class="usp-icon-wrap">
                <v-icon :icon="usp.icon" size="28" color="primary" />
              </div>
              <h3 class="usp-title">{{ usp.title }}</h3>
              <p class="usp-text">{{ usp.text }}</p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ===== SEKTION 4: B2B WHITELABEL ===== -->
    <section id="b2b" class="section-white">
      <v-container>
        <v-row align="center" justify="center">
          <v-col cols="12" md="6" class="pr-md-12">
            <div class="section-label">Für Unternehmen & Trainer</div>
            <h2 class="section-title text-left">Dein Workshop.<br />Dein Branding.</h2>
            <p class="b2b-text mt-4">
              Stell dir vor: Du startest dein nächstes Team-Meeting mit einer Runde Ludonect —
              aber die Fragen kommen nicht von uns. Sie kommen von dir.
            </p>
            <p class="b2b-quote mt-4">
              <em>„Wie sehr freust du dich auf das neue Quartal?"<br />
              „Wie klar ist dir deine aktuelle Priorität?"<br />
              „Wie sicher fühlst du dich, Feedback zu geben?"</em>
            </p>
            <p class="b2b-text mt-4">
              Das ist kein Icebreaker. Das ist ein <strong>Pulse-Check mit Spielspaß.</strong>
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
              <div class="b2b-card-mock">
                <div class="mock-header">
                  <div class="mock-logo-placeholder">
                    <v-icon icon="mdi-office-building" size="20" color="primary" />
                    <span>Dein Logo</span>
                  </div>
                </div>
                <div class="mock-question">
                  „Wie sehr fühlst du dich im Team gehört?"
                </div>
                <div class="mock-scale">
                  <span class="mock-scale-label">0</span>
                  <div class="mock-scale-bar">
                    <div class="mock-scale-fill" style="width: 72%"></div>
                  </div>
                  <span class="mock-scale-label">100</span>
                </div>
                <div class="mock-players">
                  <span v-for="icon in ['🦊','🐼','🦁','🐨']" :key="icon" class="mock-avatar">{{ icon }}</span>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- ===== SEKTION 5: PRICING ===== -->
    <section id="pricing" class="section-cream">
      <v-container>
        <div class="section-label">Preise</div>
        <h2 class="section-title">Transparent. Fair. Kein Abo-Zwang.</h2>
        <p class="section-subtitle">
          Besonders für Freelancer und Trainer: Rechne den <strong>Event Pass</strong> einfach
          als „Digitale Materialien" ab — 5 € pro Workshop, keine Abonnement-Falle.
        </p>

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
                :href="plan.cta !== '/play' ? plan.cta : undefined"
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

  </div>
</template>

<script setup lang="ts">
const steps = [
  {
    number: '01',
    icon: 'mdi-comment-question-outline',
    title: 'Frage stellen',
    text: 'Jeder beantwortet eine Frage geheim mit einer Zahl von 0–100. Keine peinlichen Storys, purer Datenfokus. Null sozialer Druck.',
  },
  {
    number: '02',
    icon: 'mdi-sort-variant',
    title: 'Gruppe einschätzen',
    text: 'Das Team kooperiert und sortiert die verdeckten Antworten gemeinsam. Wer kennt wen wirklich? Das kollektive Raten beginnt.',
  },
  {
    number: '03',
    icon: 'mdi-lightbulb-on-outline',
    title: 'Auflösen & Wachsen',
    text: 'Abweichungen decken blinde Flecken auf. Überraschungen starten tiefgründige Gespräche, die sonst nie stattgefunden hätten.',
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
  { icon: 'mdi-palette-outline', text: 'Eigene Markenfarben & Logo' },
  { icon: 'mdi-file-question-outline', text: 'Maßgeschneiderte Fragenkataloge' },
  { icon: 'mdi-account-multiple-plus-outline', text: 'Unbegrenzte Teilnehmer' },
  { icon: 'mdi-export-variant', text: 'Auswertungs-Export für Coaches (Roadmap)' },
  { icon: 'mdi-lock-outline', text: 'Passwortgeschützte Räume (Roadmap)' },
]

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
    tagline: 'Der Game-Changer für Freelancer & Trainer.',
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
    ctaLabel: 'Pro testen',
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
  padding: 8px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lp-logo-link { text-decoration: none; }
.lp-nav-logo { height: 44px; width: auto; object-fit: contain; display: block; }
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

/* ===== HERO ===== */
.hero-section {
  background: linear-gradient(160deg, #EDFFCC 0%, #f5ffe0 60%, #ffffff 100%);
  padding: 120px 0 80px;
  min-height: 85vh;
  display: flex;
  align-items: center;
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
  font-size: clamp(2rem, 4.5vw, 4rem);
  font-weight: 700;
  line-height: 1.15;
  color: #385028;
}
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
.b2b-visual { display: flex; justify-content: center; }
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
