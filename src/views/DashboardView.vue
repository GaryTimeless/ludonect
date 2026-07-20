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
        <v-col cols="12" md="8" lg="5">

          <!-- Login form -->
          <template v-if="!authenticated">
            <h1 class="dashboard-title text-center mb-2">Event-Dashboard</h1>
            <p class="dashboard-subtitle text-center mb-8">
              Verwalte deine Fragen und Einstellungen.
            </p>

            <v-card class="dashboard-card" elevation="2">
              <v-card-text>
                <v-form @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="loginEmail"
                    label="Deine Email"
                    type="email"
                    variant="outlined"
                    color="primary"
                    class="mb-4"
                    required
                  />
                  <v-text-field
                    v-model="loginCode"
                    label="Dashboard-Code"
                    variant="outlined"
                    color="primary"
                    class="mb-4"
                    placeholder="z.B. XK9M"
                    hint="Den Dashboard-Code findest du in deiner Kauf-Bestätigung."
                    persistent-hint
                    required
                  />
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    rounded="pill"
                    elevation="2"
                    :loading="loading"
                  >
                    Dashboard öffnen
                  </v-btn>
                  <v-alert v-if="error" type="error" variant="tonal" class="mt-4" density="compact">
                    {{ error }}
                  </v-alert>
                </v-form>
              </v-card-text>
            </v-card>
          </template>

          <!-- Dashboard content -->
          <template v-else>
            <h1 class="dashboard-title text-center mb-2">Dein Dashboard</h1>
            <p class="dashboard-subtitle text-center mb-8">
              {{ instance.eventName }}
            </p>

            <!-- Räume -->
            <v-card class="dashboard-card mb-6" elevation="2">
              <v-card-text>
                <div class="room-header">
                  <h3 class="mb-0">Räume ({{ rooms.length }}/{{ instance.maxRooms }})</h3>
                  <v-btn
                    v-if="rooms.length < instance.maxRooms"
                    color="primary"
                    variant="elevated"
                    size="small"
                    rounded="pill"
                    :loading="creatingRoom"
                    @click="createRoom"
                  >
                    + Neuer Raum
                  </v-btn>
                </div>

                <div v-if="rooms.length === 0" style="color: #666; padding: 16px 0;">
                  Noch keine Räume. Erstelle einen, um loszulegen.
                </div>

                <div v-for="(code, i) in rooms" :key="code" class="room-item">
                  <div class="room-num">Raum {{ i + 1 }}</div>
                  <div class="room-code">{{ code }}</div>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    size="small"
                    rounded="pill"
                    :to="`/join/${code}`"
                  >
                    Beitreten
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>

            <!-- Fragen -->
            <v-card class="dashboard-card mb-6" elevation="2">
              <v-card-text>
                <h3 class="mb-4">Fragen</h3>
                <p style="color: #666;">
                  Aktuell: Standard-Fragen (51 Stück).<br/>
                  Eigene Fragen: in Arbeit.
                </p>
              </v-card-text>
            </v-card>

            <!-- Details -->
            <v-card class="dashboard-card" elevation="2">
              <v-card-text>
                <h3 class="mb-4">Details</h3>
                <div class="detail-grid">
                  <div class="detail-row">
                    <span class="detail-label">Subdomain</span>
                    <span class="detail-value">{{ instance.subdomain }}.ludonect.de</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Dashboard-Code</span>
                    <span class="detail-value code-value" style="color: #7B5EA7;">{{ dashboardCode }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Laufzeit</span>
                    <span class="detail-value">{{ instance.duration }}</span>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </template>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const loginEmail = ref('');
const loginCode = ref('');
const loading = ref(false);
const error = ref('');
const authenticated = ref(false);
const dashboardCode = ref('');
const instance = ref<any>(null);
const rooms = ref<string[]>([]);
const creatingRoom = ref(false);

async function handleLogin() {
  loading.value = true;
  error.value = '';

  try {
    const resp = await fetch(`/api/dashboard/login?email=${encodeURIComponent(loginEmail.value)}&code=${encodeURIComponent(loginCode.value.toUpperCase())}`);
    const data = await resp.json();

    if (!data.success) {
      error.value = data.error || 'Zugriff verweigert';
      return;
    }

    instance.value = data.instance;
    rooms.value = data.instance.roomCodes || [];
    dashboardCode.value = loginCode.value.toUpperCase();
    authenticated.value = true;
  } catch {
    error.value = 'Verbindungsfehler';
  } finally {
    loading.value = false;
  }
}

async function createRoom() {
  creatingRoom.value = true;
  try {
    const resp = await fetch('/api/dashboard/create-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: loginEmail.value, dashboardCode: dashboardCode.value }),
    });
    const data = await resp.json();
    if (data.success) {
      rooms.value.push(data.roomCode);
    }
  } catch { /* silently fail */ }
  finally { creatingRoom.value = false; }
}
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

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.room-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #e8e8e0;
}

.room-item:last-child { border-bottom: none; }

.room-num {
  color: #666;
  font-size: 0.9rem;
  min-width: 60px;
}

.room-code {
  font-family: 'Courier New', monospace;
  font-size: 1.2rem;
  color: #59981A;
  letter-spacing: 2px;
  flex: 1;
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
