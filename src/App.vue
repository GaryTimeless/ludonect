<template>
  <v-app>
    <!-- Global game header with Ludonect logo -->
    <v-app-bar v-if="showGameHeader" flat height="52" color="white" border="b">
      <v-app-bar-title>
        <span class="ludonect-header-logo" @click="confirmLeave">ludonect</span>
      </v-app-bar-title>
    </v-app-bar>

    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <!-- Leave session confirmation dialog -->
    <v-dialog v-model="showLeaveDialog" max-width="340" persistent>
      <v-card rounded="xl">
        <v-card-title class="text-center pt-6">Session verlassen?</v-card-title>
        <v-card-text class="text-center text-medium-emphasis">
          Du verlässt die aktuelle Spielrunde. Die anderen Spieler können weitermachen.
        </v-card-text>
        <v-card-actions class="pb-5 px-5 flex-column gap-2">
          <v-btn color="error" variant="tonal" block rounded="lg" @click="leaveSession">
            Ja, verlassen
          </v-btn>
          <v-btn variant="text" block rounded="lg" @click="showLeaveDialog = false">
            Abbrechen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
import { useRouter, useRoute } from 'vue-router';
import questions from "@/questions.json";
import { socketService } from '@/services/socketService';

provide("questions", questions);

const router = useRouter();
const route = useRoute();
const showHostMigratedSnackbar = ref(false);
const hostMigratedMessage = ref('');
const showLeaveDialog = ref(false);

const GAME_ROUTES = ['question', 'estimation', 'PrepareNextRound'];
const showGameHeader = computed(() => GAME_ROUTES.includes(route.name as string));

const localPlayerId = computed(() => localStorage.getItem('playerId') ?? socketService.getSocketId() ?? undefined);

function confirmLeave() {
  showLeaveDialog.value = true;
}

function leaveSession() {
  showLeaveDialog.value = false;
  localStorage.removeItem('roomCode');
  socketService.gameState.value = null;
  router.push('/');
}

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

.ludonect-header-logo {
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.25rem;
  color: #385028;
  cursor: pointer;
  user-select: none;
  letter-spacing: 0.04em;
}

.ludonect-header-logo:hover {
  opacity: 0.7;
}
</style>
