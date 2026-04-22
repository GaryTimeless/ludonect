<template>
  <v-app>
    <header v-if="route.name !== 'Landing'" class="game-navbar">
      <router-link to="/" class="game-navbar-brand">
        <svg class="game-navbar-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Ludonect
      </router-link>
    </header>
    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Global: Host Migration Notification -->
    <v-snackbar
      v-model="showHostMigratedSnackbar"
      color="primary"
      timeout="6000"
      location="top"
      rounded="lg"
    >
      <v-icon start>mdi-crown</v-icon>
      {{ hostMigratedMessage }}
    </v-snackbar>

    <!-- Global: Error Banner (from window.__ludonectShowError) -->
    <v-snackbar
      v-model="showErrorSnackbar"
      color="error"
      timeout="10000"
      location="top"
      rounded="lg"
      multi-line
    >
      <v-icon start>mdi-alert-circle-outline</v-icon>
      {{ errorSnackbarText }}
      <template #actions>
        <v-btn variant="text" color="white" @click="showErrorSnackbar = false">Schließen</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { provide, onMounted, onUnmounted, ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import questions from "@/questions.json";
import { socketService } from '@/services/socketService';

provide("questions", questions);

const router = useRouter();
const route = useRoute();
const showHostMigratedSnackbar = ref(false);
const hostMigratedMessage = ref('');

// Global error toast (wired up by main.ts error handlers)
const showErrorSnackbar = ref(false);
const errorSnackbarText = ref('');

const localPlayerId = computed(() => localStorage.getItem('playerId') ?? socketService.getSocketId() ?? undefined);

// Watch for host migration events
watch(
  () => socketService.hostMigratedEvent.value,
  (event) => {
    if (!event) return;
    if (event.newHostId === localPlayerId.value) {
      hostMigratedMessage.value = '👑 Du bist jetzt der neue Host!';
    } else {
      hostMigratedMessage.value = `${event.newHostName} ist jetzt der neue Host.`;
    }
    showHostMigratedSnackbar.value = true;
    // Reset so the same event can trigger again later if needed
    socketService.hostMigratedEvent.value = null;
  }
);

onMounted(() => {
  // Register global error display hook (called by main.ts error handlers)
  (window as any).__ludonectShowError = (msg: string) => {
    errorSnackbarText.value = msg;
    showErrorSnackbar.value = true;
  };

  // Connect to WebSocket server
  socketService.connect();

  // Listen for server-initiated navigation
  socketService.on('navigateTo', (path: string) => {
    console.log('[App] Navigating to:', path);
    router.push(path);
  });

  console.log('[App] Socket service initialized');
});

onUnmounted(() => {
  // Cleanup socket connection
  socketService.disconnect();
});
</script>

<style>
@import './styles/animations.css';
@import './styles/global.css';
</style>

<style scoped>
.game-navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(89,152,26,0.12);
}
.game-navbar-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #385028;
  text-decoration: none;
  letter-spacing: 0.02em;
}
.game-navbar-brand:hover { opacity: 0.75; }
.game-navbar-arrow {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}
</style>

