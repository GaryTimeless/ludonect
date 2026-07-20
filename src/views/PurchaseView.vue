<template>
  <div class="purchase-page">
    <header class="lp-navbar">
      <div class="lp-navbar-inner">
        <router-link to="/" class="lp-logo-link">
          <img src="@/assets/ludonect_otter_logo-removebg.png" alt="Ludonect" class="lp-nav-logo" />
        </router-link>
        <nav class="lp-nav-links">
          <router-link to="/" class="lp-back-link">← Zurück</router-link>
        </nav>
      </div>
    </header>

    <v-container class="purchase-container">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <h1 class="purchase-title text-center mb-2">Dein eigener Spieleabend</h1>
          <p class="purchase-subtitle text-center mb-8">
            Eigene Fragen, eigener Link, kein Login für deine Gäste.
          </p>

          <v-card class="purchase-card" v-if="!purchaseComplete">
            <v-card-text>
              <v-form @submit.prevent="handlePurchase">
                <v-text-field
                  v-model="form.email"
                  label="Deine Email"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  class="mb-4"
                  placeholder="deine@email.de"
                  required
                />

                <v-text-field
                  v-model="form.subdomain"
                  label="Deine Subdomain"
                  :rules="[rules.required, rules.subdomain]"
                  variant="outlined"
                  class="mb-1"
                  placeholder="mein-team"
                  required
                  hint="3-30 Zeichen, nur Buchstaben, Zahlen und Bindestriche"
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
                  class="mb-4"
                  placeholder="Julias Teamevent"
                  required
                />

                <v-select
                  v-model="form.duration"
                  label="Laufzeit"
                  :items="durationOptions"
                  variant="outlined"
                  class="mb-4"
                  required
                />

                <v-select
                  v-model="form.questionSet"
                  label="Fragen-Set"
                  :items="questionSetOptions"
                  variant="outlined"
                  class="mb-6"
                />

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  :disabled="loading"
                >
                  Jetzt einrichten – 19 €
                </v-btn>
                <p class="text-center mt-3 text-grey">Dummy-Payment — wird nicht belastet.</p>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Success -->
          <v-card class="purchase-card success-card" v-else>
            <v-card-text class="text-center">
              <v-icon icon="mdi-check-circle" size="64" color="success" class="mb-4" />
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
                  <span class="detail-label">Subdomain</span>
                  <span class="detail-value">{{ result.subdomain }}.ludonect.de</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Laufzeit</span>
                  <span class="detail-value">{{ result.duration }}</span>
                </div>
              </div>

              <p class="text-grey mb-6">
                Eine Info-Datei mit allen Zugangsdaten wurde heruntergeladen.<br/>
                Teile den Code oder Link mit deinen Freunden!
              </p>

              <div class="success-actions">
                <v-btn color="primary" size="large" :to="`/join/${result.code}`" class="mr-3">
                  Jetzt spielen
                </v-btn>
                <v-btn variant="outlined" :href="downloadUrl" download>
                  Erneut herunterladen
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

interface PurchaseForm {
  email: string;
  subdomain: string;
  eventName: string;
  duration: string;
  questionSet: string;
}

interface PurchaseResult {
  code: string;
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
  duration: '48h',
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
    if (v.length < 3 || v.length > 30) return '3-30 Zeichen';
    return true;
  },
};

const durationOptions = [
  { title: '48 Stunden (Event)', value: '48h' },
  { title: '7 Tage', value: '7d' },
  { title: '30 Tage', value: '30d' },
];

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

    // Auto-download the info file
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
  background: linear-gradient(180deg, #0d1117 0%, #161b22 100%);
}

.lp-navbar {
  padding: 12px 24px;
  border-bottom: 1px solid #21262d;
}

.lp-navbar-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lp-nav-logo {
  height: 40px;
}

.lp-back-link {
  color: #8b949e;
  text-decoration: none;
  font-size: 0.9rem;
}

.lp-back-link:hover {
  color: #c9d1d9;
}

.purchase-container {
  padding-top: 48px;
}

.purchase-title {
  font-size: 2rem;
  font-weight: 700;
  color: #f0f6fc;
}

.purchase-subtitle {
  color: #8b949e;
  font-size: 1.1rem;
}

.purchase-card {
  background: #161b22 !important;
  border: 1px solid #30363d !important;
  border-radius: 12px !important;
}

.subdomain-suffix {
  color: #8b949e;
  font-size: 0.85rem;
  padding-right: 8px;
}

.success-card {
  background: #161b22 !important;
  border: 1px solid #238636 !important;
}

.instance-details {
  background: #0d1117;
  border-radius: 8px;
  padding: 16px;
  text-align: left;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #21262d;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  color: #8b949e;
  font-size: 0.9rem;
}

.detail-value {
  color: #c9d1d9;
  font-weight: 600;
}

.code-value {
  color: #58a6ff;
  font-size: 1.2rem;
  font-family: monospace;
  letter-spacing: 2px;
}

.success-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
