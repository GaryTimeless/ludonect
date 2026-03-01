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
  </v-app>
</template>

<script setup lang="ts">
import { provide, onMounted, onUnmounted, ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import questions from "@/questions.json";
import { socketService } from '@/services/socketService';

provide("questions", questions);

const router = useRouter();
const showHostMigratedSnackbar = ref(false);
const hostMigratedMessage = ref('');

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

