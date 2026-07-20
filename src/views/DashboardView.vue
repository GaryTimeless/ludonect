<template>
  <div class="dashboard-page">
    <header class="lp-navbar">
      <div class="lp-navbar-inner">
        <router-link to="/" class="lp-logo-link">
          <img src="@/assets/ludonect_combo.png" alt="Ludonect" class="lp-nav-logo" />
        </router-link>
        <nav class="lp-nav-links">
          <router-link to="/" class="lp-back-link">← Zurück</router-link>
        </nav>
      </div>
    </header>

    <v-container class="dashboard-container">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <h1 class="dashboard-title text-center mb-2">Dein Dashboard</h1>
          <p class="dashboard-subtitle text-center mb-8">
            Event: <strong>{{ instanceName }}</strong> · Code: <strong class="code-inline">{{ code }}</strong>
          </p>

          <v-card class="dashboard-card mb-6" elevation="2">
            <v-card-text>
              <h3 class="mb-4">Fragen verwalten</h3>
              <p style="color: #666; margin-bottom: 24px;">
                Aktuell spielst du mit unseren Standard-Fragen (51 Stück).<br/>
                Bald kannst du hier eigene Fragen hochladen oder direkt eingeben.
              </p>

              <v-alert type="info" variant="tonal" class="mb-4">
                Die eigene-Fragen-Funktion ist in Arbeit. Bei dringendem Bedarf: <a href="mailto:hello@ludonect.de">hello@ludonect.de</a>
              </v-alert>

              <v-btn color="primary" rounded="pill" :to="`/join/${code}`" class="mr-3">
                Jetzt spielen
              </v-btn>
            </v-card-text>
          </v-card>

          <v-card class="dashboard-card" elevation="2">
            <v-card-text>
              <h3 class="mb-4">Event-Details</h3>
              <div class="detail-grid">
                <div class="detail-row">
                  <span class="detail-label">Subdomain</span>
                  <span class="detail-value">{{ subdomain }}.ludonect.de</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Raum-Code</span>
                  <span class="detail-value code-value">{{ code }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Laufzeit</span>
                  <span class="detail-value">{{ duration }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fragen-Set</span>
                  <span class="detail-value">Standard (51 Fragen)</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';

const route = useRoute();
const code = (route.params.code as string || '').toUpperCase();
const subdomain = route.query.subdomain as string || '—';
const instanceName = route.query.name as string || 'Dein Event';
const duration = route.query.duration as string || '—';
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  background: #fff;
  font-family: 'Tenor Sans', Arial, sans-serif;
  color: #385028;
}

.lp-navbar {
  padding: 12px 24px;
  border-bottom: 1px solid #e8e8e0;
  background: #fff;
}

.lp-navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-nav-logo { height: 36px; }

.lp-back-link { color: #385028; text-decoration: none; font-size: 0.9rem; }
.lp-back-link:hover { opacity: 0.7; }

.dashboard-container { padding-top: 56px; padding-bottom: 80px; }

.dashboard-title {
  font-size: 2rem;
  font-weight: 400;
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
}

.dashboard-subtitle { color: #666; font-size: 1.1rem; }

.code-inline {
  font-family: 'Courier New', monospace;
  letter-spacing: 2px;
  color: #59981A;
}

.dashboard-card {
  border-radius: 16px !important;
  border: 1px solid #e0e0d8 !important;
}

.dashboard-card :deep(.v-card-text) { padding: 32px; }

h3 {
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-weight: 400;
  font-size: 1.2rem;
}

.detail-grid { background: #f8f8f4; border-radius: 12px; padding: 20px; }

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e8e8e0;
}

.detail-row:last-child { border-bottom: none; }

.detail-label { color: #666; font-size: 0.9rem; }
.detail-value { color: #385028; font-weight: 600; }

.code-value {
  color: #59981A;
  font-family: 'Courier New', monospace;
  letter-spacing: 3px;
}
</style>
