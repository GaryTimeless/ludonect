<template>
  <v-app>
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
        <v-btn variant="text" color="white" @click="showErrorSnackbar = false">{{ t('common.close') }}</v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { provide, onMounted, onUnmounted, ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import questions from "@/questions.json";
import { socketService } from '@/services/socketService';

const { t, locale } = useI18n();

provide("questions", questions);

const router = useRouter();
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
      hostMigratedMessage.value = t('app.youAreNewHost');
    } else {
      hostMigratedMessage.value = t('app.newHost', { name: event.newHostName });
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

