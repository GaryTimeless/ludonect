<template>
  <div class="legal-page">

    <!-- Navbar minimal -->
    <header class="legal-navbar">
      <div class="legal-navbar-inner">
        <router-link to="/" class="lp-logo-link">
          <img src="@/assets/ludonect_combo.png" alt="Ludonect" class="legal-nav-logo" />
        </router-link>
        <v-btn variant="text" color="primary" to="/" size="small">
          <v-icon icon="mdi-arrow-left" class="mr-1" size="16" /> Zurück zur Startseite
        </v-btn>
      </div>
    </header>

    <main class="legal-main">
      <v-container>
        <v-row justify="center">
          <v-col cols="12" md="8" lg="7">

            <!-- Quick Jump -->
            <div class="legal-jump">
              <a href="#impressum">Impressum</a>
              <span class="legal-divider">·</span>
              <a href="#datenschutz">Datenschutzerklärung</a>
            </div>

            <!-- ===== IMPRESSUM ===== -->
            <section id="impressum" class="legal-section">
              <h1 class="legal-h1">Impressum</h1>
              <p class="legal-meta">Angaben gemäß § 5 TMG</p>

              <div class="legal-block">
                <h2 class="legal-h2">Verantwortlich für den Inhalt</h2>
                <p>
                  Gary Schenk<br />
                  [Straße und Hausnummer]<br />
                  [PLZ und Ort]<br />
                  Deutschland
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">Kontakt</h2>
                <p>
                  E-Mail: <a href="mailto:hello@ludonect.de">hello@ludonect.de</a>
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">Hinweis</h2>
                <p>
                  Ludonect ist ein privates Projekt und wird nicht gewerblich im Sinne
                  einer eingetragenen Unternehmung betrieben. Es besteht keine
                  Umsatzsteuer-Identifikationsnummer.
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">Haftung für Inhalte</h2>
                <p>
                  Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte
                  auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir
                  sind nicht verpflichtet, übermittelte oder gespeicherte fremde
                  Informationen zu überwachen oder nach Umständen zu forschen, die auf
                  eine rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">Haftung für Links</h2>
                <p>
                  Unser Angebot enthält ggf. Links zu externen Webseiten Dritter, auf
                  deren Inhalte wir keinen Einfluss haben. Für die Inhalte der
                  verlinkten Seiten ist stets der jeweilige Anbieter verantwortlich.
                </p>
              </div>
            </section>

            <div class="legal-separator"></div>

            <!-- ===== DATENSCHUTZ ===== -->
            <section id="datenschutz" class="legal-section">
              <h1 class="legal-h1">Datenschutzerklärung</h1>
              <p class="legal-meta">Stand: März 2026</p>

              <div class="legal-highlight">
                <v-icon icon="mdi-shield-check" color="primary" size="20" class="mr-2" />
                <strong>Kurzfassung:</strong> Ludonect speichert keine personenbezogenen Daten
                auf Servern. Es gibt keine Nutzerkonten, keine Cookies und kein Tracking.
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">1. Verantwortlicher</h2>
                <p>
                  Verantwortlicher im Sinne der DSGVO ist Gary Schenk
                  (Kontakt: <a href="mailto:hello@ludonect.de">hello@ludonect.de</a>).
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">2. Welche Daten werden verarbeitet?</h2>
                <p>
                  Ludonect ist so konzipiert, dass so wenig Daten wie möglich anfallen.
                  Im Einzelnen:
                </p>
                <ul class="legal-list">
                  <li>
                    <strong>Spielname:</strong> Der im Spiel eingegebene Name wird
                    ausschließlich im Arbeitsspeicher des Servers für die Dauer der
                    Spielsitzung gehalten. Er wird weder gespeichert noch protokolliert.
                  </li>
                  <li>
                    <strong>Sitzungs-ID (UUID):</strong> Eine zufällig generierte, anonyme
                    ID wird im <code>localStorage</code> des Browsers gespeichert,
                    ausschließlich um bei einem versehentlichen Neuladen der Seite eine
                    Reconnect-Funktion zu ermöglichen. Diese ID enthält keine
                    Rückschlüsse auf die Person.
                  </li>
                  <li>
                    <strong>Server-Logs:</strong> Der Hosting-Anbieter (Railway / GitHub Pages)
                    kann technische Verbindungsdaten (IP-Adresse, Zeitstempel) für einen
                    begrenzten Zeitraum protokollieren. Dies liegt außerhalb unserer
                    Kontrolle und entspricht der üblichen Praxis jedes Webhosting-Dienstes.
                  </li>
                </ul>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">3. Sitzungs-Ende & Datenlöschung</h2>
                <p>
                  Sobald der Host eine Spielsitzung schließt oder die Verbindung
                  abbricht und kein anderer Spieler übernimmt, werden <strong>alle
                  Spieldaten sofort aus dem Arbeitsspeicher des Servers gelöscht</strong>.
                  Es findet keine persistente Speicherung auf Servern statt.
                </p>
                <p class="mt-3">
                  Die lokale Sitzungs-ID im Browser (<code>localStorage</code>) kann
                  jederzeit manuell über die Browser-Einstellungen gelöscht werden.
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">4. Keine Cookies, kein Tracking</h2>
                <p>
                  Ludonect verwendet <strong>keine Cookies</strong> und keine
                  Analyse- oder Tracking-Tools (kein Google Analytics, kein Meta Pixel,
                  keine vergleichbaren Dienste).
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">5. Betroffenenrechte (DSGVO)</h2>
                <p>
                  Da keine personenbezogenen Daten dauerhaft gespeichert werden, sind
                  Anfragen auf Auskunft, Berichtigung oder Löschung nach Sitzungsende in
                  aller Regel gegenstandslos. Für Rückfragen wende dich an:
                  <a href="mailto:hello@ludonect.de">hello@ludonect.de</a>
                </p>
              </div>

              <div class="legal-block">
                <h2 class="legal-h2">6. Änderungen dieser Erklärung</h2>
                <p>
                  Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf
                  anzupassen, um sie stets der aktuellen Rechtslage zu entsprechen.
                </p>
              </div>
            </section>

          </v-col>
        </v-row>
      </v-container>
    </main>

    <!-- Footer minimal -->
    <footer class="legal-footer">
      <p>© {{ new Date().getFullYear() }} Ludonect · Made with 🦦 in Germany ·
        <a href="mailto:hello@ludonect.de">hello@ludonect.de</a>
      </p>
    </footer>

  </div>
</template>

<script setup lang="ts">
// no logic needed
</script>

<style scoped>
.legal-page {
  font-family: 'Tenor Sans', Arial, sans-serif;
  color: #385028;
  background: #fff;
  min-height: 100vh;
}

/* NAVBAR */
.legal-navbar {
  border-bottom: 1px solid rgba(89,152,26,0.12);
  background: #fff;
}
.legal-navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 10px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.lp-logo-link { text-decoration: none; }
.legal-nav-logo { height: 36px; }

/* MAIN */
.legal-main {
  padding: 56px 0 80px;
}

/* QUICK JUMP */
.legal-jump {
  margin-bottom: 48px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 10px;
}
.legal-jump a {
  color: #59981A;
  text-decoration: none;
  font-weight: 600;
}
.legal-jump a:hover { text-decoration: underline; }
.legal-divider { color: #aaa; }

/* SECTIONS */
.legal-section { margin-bottom: 16px; }

.legal-h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 4px;
  color: #385028;
}
.legal-meta {
  font-size: 0.82rem;
  color: #5a7042;
  opacity: 0.7;
  margin-bottom: 32px;
}
.legal-h2 {
  font-size: 1.05rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: #385028;
}
.legal-block {
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid rgba(89,152,26,0.08);
}
.legal-block p, .legal-block ul { font-size: 0.93rem; line-height: 1.75; color: #4a6030; }
.legal-block a { color: #59981A; }

.legal-list {
  margin: 12px 0 0 0;
  padding-left: 20px;
}
.legal-list li { margin-bottom: 10px; }

code {
  background: rgba(89,152,26,0.08);
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.85em;
  font-family: monospace;
}

.legal-highlight {
  display: flex;
  align-items: flex-start;
  background: rgba(89,152,26,0.07);
  border: 1px solid rgba(89,152,26,0.2);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 28px;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #385028;
}

.legal-separator {
  border: none;
  border-top: 2px solid rgba(89,152,26,0.1);
  margin: 48px 0;
}

/* FOOTER */
.legal-footer {
  text-align: center;
  padding: 24px;
  border-top: 1px solid rgba(89,152,26,0.1);
  font-size: 0.82rem;
  color: #5a7042;
  opacity: 0.8;
}
.legal-footer a { color: #59981A; text-decoration: none; }
</style>
