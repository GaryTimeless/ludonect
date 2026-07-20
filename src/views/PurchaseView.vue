<template>
  <div class="purchase-page">
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

    <v-container class="purchase-container">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <h1 class="purchase-title text-center mb-2">Eventpass kaufen</h1>
          <p class="purchase-subtitle text-center mb-8">
            Eigene Fragen, eigener Link, kein Login für deine Gäste.
          </p>

          <v-card class="purchase-card" v-if="!purchaseComplete" elevation="2">
            <v-card-text>
              <v-form @submit.prevent="handlePurchase">
                <v-text-field
                  v-model="form.email"
                  label="Deine Email"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                  placeholder="deine@email.de"
                  required
                />

                <v-text-field
                  v-model="form.subdomain"
                  label="Deine Subdomain"
                  :rules="[rules.required, rules.subdomain]"
                  variant="outlined"
                  color="primary"
                  class="mb-1"
                  placeholder="mein-team"
                  required
                  hint="3–30 Zeichen, nur Buchstaben, Zahlen und Bindestriche"
                  persistent-hint
                >
                  <template #append-inner>
                    <span class="subdomain-suffix">.ludonect.de</span>
                  </template>
                </v-text-field>

                <v-text-field
                  v-model="form.eventName"
                  label="Event-Name"
                  :rules="[rules.required]"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                  placeholder="Julias Teamevent"
                  required
                />

                <v-select
                  v-model="form.duration"
                  label="Laufzeit"
                  :items="durationOptions"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                />

                <v-select
                  v-model="form.questionSet"
                  label="Fragen-Set"
                  :items="questionSetOptions"
                  variant="outlined"
                  color="primary"
                  class="mb-6"
                />

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  rounded="pill"
                  elevation="2"
                  :loading="loading"
                  :disabled="loading"
                >
                  Jetzt einrichten – {{ selectedPrice }}&thinsp;€
                </v-btn>
                <p class="text-center mt-3" style="color: #999; font-size: 0.85rem;">
                  Dummy-Payment — wird nicht belastet.
                </p>

                <p class="text-center mt-4" style="color: #666; font-size: 0.9rem;">
                  Starte mit unseren Standard-Fragen.<br/>
                  Eigene Fragen kannst du nach dem Kauf in deinem Dashboard hochladen.
                </p>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Success -->
          <v-card class="purchase-card success-card" v-else elevation="2">
            <v-card-text class="text-center">
              <v-icon icon="mdi-check-circle" size="64" color="primary" class="mb-4" />
              <h2 class="mb-4">Alles bereit!</h2>

              <div class="instance-details mb-6">
                <div class="detail-row">
                  <span class="detail-label">Event</span>
                  <span class="detail-value">{{ result.eventName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Raum-Code</span>
                  <span class="detail-value code-value">{{ result.code }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Dashboard-Code</span>
                  <span class="detail-value code-value dashboard-code">{{ result.dashboardCode }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Subdomain</span>
                  <span class="detail-value">{{ result.subdomain }}.ludonect.de</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Laufzeit</span>
                  <span class="detail-value">{{ result.duration }}</span>
                </div>
              </div>

              <p class="text-grey mb-2" style="color: #666;">
                Teile den <strong>Raum-Code</strong> mit deinen Gästen.
              </p>
              <p class="text-grey mb-6" style="color: #666; font-size: 0.9rem;">
                Mit dem <strong>Dashboard-Code</strong> und deiner Email kannst du auf<br/>
                <router-link to="/dashboard">ludonect.de/dashboard</router-link> deine Fragen verwalten.
              </p>

              <v-btn color="primary" size="large" rounded="pill" :to="`/join/${result.code}`" block>
                Jetzt spielen
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

interface PurchaseForm {
  email: string;
  subdomain: string;
  eventName: string;
  duration: string;
  questionSet: string;
}

interface PurchaseResult {
  code: string;
  dashboardCode: string;
  subdomain: string;
  eventName: string;
  duration: string;
  questionSet: string;
  expiresAt: number;
}

const form = ref<PurchaseForm>({
  email: '',
  subdomain: '',
  eventName: '',
  duration: '24h',
  questionSet: 'basic',
});

const loading = ref(false);
const purchaseComplete = ref(false);
const result = ref<PurchaseResult>({ code: '', subdomain: '', eventName: '', duration: '', questionSet: '', expiresAt: 0 });
const downloadUrl = ref('');
const error = ref('');

const rules = {
  required: (v: string) => !!v || 'Erforderlich',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Gültige Email-Adresse erforderlich',
  subdomain: (v: string) => {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(v)) return 'Nur Buchstaben, Zahlen und Bindestriche';
    if (v.length < 3 || v.length > 30) return '3–30 Zeichen';
    return true;
  },
};

const durationOptions = [
  { title: '24 Stunden (Event) – 5\u2009€', value: '24h', price: 5 },
  { title: '30 Tage (1 Monat) – 15\u2009€', value: '30d', price: 15 },
];

const selectedPrice = computed(() => durationOptions.find(o => o.value === form.value.duration)?.price ?? 5);

const questionSetOptions = [
  { title: 'Standard-Fragen', value: 'basic' },
  { title: 'SmartCoach Berlin', value: 'SmartCoachBerlin' },
];

async function handlePurchase() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    });

    const data = await response.json();

    if (!data.success) {
      error.value = data.error || 'Unbekannter Fehler';
      return;
    }

    result.value = data.instance;
    downloadUrl.value = data.downloadUrl;
    purchaseComplete.value = true;

    // Auto-download the info file after a short delay
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = `ludonect-${data.instance.code}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 500);
  } catch (err: any) {
    error.value = 'Verbindungsfehler. Bitte versuche es erneut.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.purchase-page {
  min-height: 100vh;
  background: #fff;
  font-family: 'Tenor Sans', Arial, sans-serif;
  color: #385028;
}

/* Navbar — match landing page */
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

.lp-nav-logo {
  height: 36px;
}

.lp-back-link {
  color: #385028;
  text-decoration: none;
  font-size: 0.9rem;
}

.lp-back-link:hover {
  opacity: 0.7;
}

.purchase-container {
  padding-top: 56px;
  padding-bottom: 80px;
}

.purchase-title {
  font-size: 2rem;
  font-weight: 400;
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
}

.purchase-subtitle {
  color: #666;
  font-size: 1.1rem;
  font-family: 'Tenor Sans', Arial, sans-serif;
}

.purchase-card {
  border-radius: 16px !important;
  border: 1px solid #e0e0d8 !important;
}

.purchase-card :deep(.v-card-text) {
  padding: 32px;
}

.subdomain-suffix {
  color: #999;
  font-size: 0.85rem;
  padding-right: 8px;
}

.success-card {
  border: 2px solid #C5E1A5 !important;
}

.instance-details {
  background: #f8f8f4;
  border-radius: 12px;
  padding: 20px;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e8e8e0;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #666;
  font-size: 0.9rem;
}

.detail-value {
  color: #385028;
  font-weight: 600;
}

.code-value {
  color: #59981A;
  font-size: 1.3rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 3px;
}

.dashboard-code {
  color: #7B5EA7;
}

.success-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

h2 {
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-weight: 400;
}
</style>
