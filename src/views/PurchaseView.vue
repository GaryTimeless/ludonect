<template>
  <div class="purchase-page">
    <header class="lp-navbar">
      <div class="lp-navbar-inner">
        <router-link to="/" class="lp-logo-link">
          <img src="@/assets/ludonect_combo.png" alt="Ludonect" class="lp-nav-logo" />
        </router-link>
        <nav class="lp-nav-links">
          <LanguageSwitcher />
          <router-link to="/" class="lp-back-link">{{ t('common.back') }}</router-link>
        </nav>
      </div>
    </header>

    <v-container class="purchase-container">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <h1 class="purchase-title text-center mb-2">{{ t('purchase.title') }}</h1>
          <p class="purchase-subtitle text-center mb-8">{{ t('purchase.subtitle') }}</p>

          <v-card class="purchase-card" v-if="!purchaseComplete" elevation="2">
            <v-card-text>
              <v-form @submit.prevent="handlePurchase">
                <v-text-field
                  v-model="form.email"
                  :label="t('purchase.email')"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                  :placeholder="t('purchase.emailPlaceholder')"
                  required
                />

                <v-text-field
                  v-model="form.subdomain"
                  :label="t('purchase.subdomain')"
                  :rules="[rules.required, rules.subdomain]"
                  variant="outlined"
                  color="primary"
                  class="mb-1"
                  placeholder="mein-team"
                  :hint="t('purchase.subdomainHint')"
                  persistent-hint
                  required
                >
                  <template #append-inner>
                    <span class="subdomain-suffix">{{ t('purchase.subdomainSuffix') }}</span>
                  </template>
                </v-text-field>

                <v-text-field
                  v-model="form.eventName"
                  :label="t('purchase.eventName')"
                  :rules="[rules.required]"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
                  :placeholder="t('purchase.eventNamePlaceholder')"
                  required
                />

                <v-select
                  v-model="form.duration"
                  :label="t('purchase.duration')"
                  :items="durationOptions"
                  variant="outlined"
                  color="primary"
                  class="mb-4"
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
                  {{ t('purchase.submit') }} – {{ selectedPrice }}&thinsp;€
                </v-btn>
                <p class="text-center mt-3 dummy-note">{{ t('purchase.dummyNote') }}</p>

                <p class="text-center mt-4 standard-note">
                  {{ t('purchase.standardNote') }}<br/>
                  {{ t('purchase.dashboardHint') }}
                </p>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Success -->
          <v-card class="purchase-card success-card" v-else elevation="2">
            <v-card-text class="text-center">
              <v-icon icon="mdi-check-circle" size="64" color="primary" class="mb-4" />
              <h2 class="mb-4">{{ t('purchase.success') }}</h2>

              <div class="instance-details mb-6">
                <div class="detail-row">
                  <span class="detail-label">{{ t('purchase.event') }}</span>
                  <span class="detail-value">{{ result.eventName }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ t('purchase.roomCode') }}</span>
                  <span class="detail-value code-value">{{ result.code }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ t('purchase.dashboardCode') }}</span>
                  <span class="detail-value code-value dashboard-code">{{ result.dashboardCode }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Subdomain</span>
                  <span class="detail-value">{{ result.subdomain }}.ludonect.de</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">{{ t('purchase.duration') }}</span>
                  <span class="detail-value">{{ result.duration }}</span>
                </div>
              </div>

              <p class="text-grey mb-2 detail-note" v-html="t('purchase.shareCode')" />
              <p class="text-grey mb-6 detail-note-small">
                {{ t('purchase.dashboardAccess') }}
                <router-link to="/dashboard">ludonect.de/dashboard</router-link>
                {{ t('purchase.manageQuestions') }}
              </p>

              <v-btn color="primary" size="large" rounded="pill" :to="`/join/${result.code}`" block>
                {{ t('purchase.playNow') }}
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
import { useI18n } from 'vue-i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const { t } = useI18n();

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
const result = ref<PurchaseResult>({ code: '', dashboardCode: '', subdomain: '', eventName: '', duration: '', questionSet: '', expiresAt: 0 });
const downloadUrl = ref('');

const rules = {
  required: (v: string) => !!v || 'Erforderlich',
  email: (v: string) => /.+@.+\..+/.test(v) || 'Gültige Email-Adresse erforderlich',
  subdomain: (v: string) => {
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(v)) return 'Nur Buchstaben, Zahlen und Bindestriche';
    if (v.length < 3 || v.length > 30) return '3–30 Zeichen';
    return true;
  },
};

const durationOptions = computed(() => [
  { title: `${t('purchase.durations.h24')} – 5\u2009€`, value: '24h', price: 5 },
  { title: `${t('purchase.durations.d30')} – 15\u2009€`, value: '30d', price: 15 },
]);

const selectedPrice = computed(() => durationOptions.value.find(o => o.value === form.value.duration)?.price ?? 5);

async function handlePurchase() {
  loading.value = true;
  try {
    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    });
    const data = await response.json();
    if (!data.success) return;
    result.value = data.instance;
    downloadUrl.value = data.downloadUrl;
    purchaseComplete.value = true;
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = data.downloadUrl;
      a.download = `ludonect-${data.instance.code}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }, 500);
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

.lp-navbar { padding: 12px 24px; border-bottom: 1px solid #e8e8e0; background: #fff; }
.lp-navbar-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.lp-nav-logo { height: 36px; }
.lp-nav-links { display: flex; align-items: center; gap: 16px; }
.lp-back-link { color: #385028; text-decoration: none; font-size: 0.9rem; }
.lp-back-link:hover { opacity: 0.7; }

.purchase-container { padding-top: 56px; padding-bottom: 80px; }
.purchase-title { font-size: 2rem; font-weight: 400; color: #385028; font-family: 'Tenor Sans', Arial, sans-serif; }
.purchase-subtitle { color: #666; font-size: 1.1rem; font-family: 'Tenor Sans', Arial, sans-serif; }

.purchase-card { border-radius: 16px !important; border: 1px solid #e0e0d8 !important; }
.purchase-card :deep(.v-card-text) { padding: 32px; }

.subdomain-suffix { color: #999; font-size: 0.85rem; padding-right: 8px; }
.dummy-note { color: #999; font-size: 0.85rem; }
.standard-note { color: #666; font-size: 0.9rem; }

.success-card { border: 2px solid #C5E1A5 !important; }

.instance-details { background: #f8f8f4; border-radius: 12px; padding: 20px; text-align: left; }
.detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e8e8e0; }
.detail-row:last-child { border-bottom: none; }
.detail-label { color: #666; font-size: 0.9rem; }
.detail-value { color: #385028; font-weight: 600; }

.code-value { color: #59981A; font-size: 1.3rem; font-family: 'Courier New', monospace; letter-spacing: 3px; }
.dashboard-code { color: #7B5EA7; }

.detail-note { color: #666; }
.detail-note-small { color: #666; font-size: 0.9rem; }

h2 { color: #385028; font-family: 'Tenor Sans', Arial, sans-serif; font-weight: 400; }
</style>
