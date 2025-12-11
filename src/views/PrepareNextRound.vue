<template>
  <v-container class="mobile-container fade-in">
    <!-- Host View -->
    <v-card v-if="isHost" class="prepare-card" elevation="3">
      <v-card-title class="text-center">
        <h2>Vorbereitung nächste Runde</h2>
      </v-card-title>

      <v-card-text>
        <v-list class="player-list mb-4">
          <v-list-subheader>Spieler in der Runde</v-list-subheader>
          <v-list-item
            v-for="player in players"
            :key="player.id"
            class="player-item mb-2"
          >
            <template #prepend>
              <v-avatar :color="getPlayerColor(player.id)" size="40">
                <span class="text-white font-weight-bold">
                  {{ player.name.charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
            </template>
            <v-list-item-title>
              {{ player.name }}
            </v-list-item-title>
            <template #append>
              <v-icon v-if="player.isHost" color="accent">mdi-crown</v-icon>
            </template>
          </v-list-item>
        </v-list>

        <v-btn
          color="warning"
          size="large"
          block
          @click="resetCurrentRound"
          :loading="resetting"
          class="btn-press mb-3"
        >
          <v-icon start>mdi-broom</v-icon>
          Runde zurücksetzen
        </v-btn>

        <v-btn
          color="success"
          size="x-large"
          block
          @click="startNextRound"
          :loading="starting"
          class="btn-press"
        >
          <v-icon start>mdi-play</v-icon>
          Neue Frage laden & zur nächsten Runde
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Non-Host View -->
    <v-card v-else class="waiting-card" elevation="3">
      <v-card-text class="text-center">
        <v-icon size="80" color="primary" class="pulse mb-4">mdi-clock-outline</v-icon>
        <h3 class="mb-4">Warte auf den Host...</h3>
        <p class="text-medium-emphasis mb-4">
          Der Host bereitet die nächste Runde vor.
        </p>
        <img
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmwxcjQ3NzR3Nm5wdWd1bjJqZTJteWMxenFubnM2a2ZpMGw5enJzOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WFyqujMJoxIn9qSTf5/giphy.gif"
          alt="Warten auf Host"
          style="max-width: 80%; height: auto; border-radius: 16px"
          class="mt-4"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { inject } from "vue";
import { socketService } from "@/services/socketService";

const questions = inject("questions") as any[];
const router = useRouter();
const route = useRoute();
const gameId = ref<string>(route.params.gameId as string);
const resetting = ref(false);
const starting = ref(false);

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const players = computed(() => gameState.value?.players || []);
const localPlayerId = computed(() => socketService.getSocketId());
const isHost = computed(() => gameState.value?.hostId === localPlayerId.value);
const usedQuestionIds = computed(() => gameState.value?.usedQuestionIds || []);

// Generate consistent colors for players
const playerColors = ['#9C27B0', '#FF9800', '#2196F3', '#4CAF50', '#F44336', '#00BCD4'];
function getPlayerColor(playerId: string): string {
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return playerColors[hash % playerColors.length];
}

onMounted(() => {
  console.log('[PrepareNextRound] Mounted, gameId:', gameId.value);
});

async function resetCurrentRound() {
  resetting.value = true;

  try {
    await socketService.emit('resetRound', {
      roomCode: gameId.value,
    });
    console.log('[PrepareNextRound] Round reset');
  } catch (error: any) {
    console.error('[PrepareNextRound] Reset error:', error);
    alert(error.message || 'Fehler beim Zurücksetzen');
  } finally {
    resetting.value = false;
  }
}

async function startNextRound() {
  const unused = questions.filter((q: any) => !usedQuestionIds.value.includes(q.id));

  if (unused.length === 0) {
    alert('Keine Fragen mehr verfügbar.');
    return;
  }

  const newQuestion = unused[Math.floor(Math.random() * unused.length)];
  starting.value = true;

  try {
    await socketService.emit('startNextQuestion', {
      roomCode: gameId.value,
      questionId: newQuestion.id,
    });
    console.log('[PrepareNextRound] Started next question:', newQuestion.id);
    // Server will emit navigateTo event
  } catch (error: any) {
    console.error('[PrepareNextRound] Start error:', error);
    alert(error.message || 'Fehler beim Starten der nächsten Runde');
  } finally {
    starting.value = false;
  }
}
</script>

<style scoped>
.prepare-card {
  max-width: 500px;
  margin: 24px auto;
}

.prepare-card h2 {
  font-size: 1.3rem;
  color: #385028;
  font-weight: 700;
  padding: 16px;
}

.player-list {
  background: #f5f5f5;
  border-radius: 12px;
  padding: 8px;
}

.player-item {
  background: white;
  border-radius: 8px;
}

.waiting-card {
  max-width: 500px;
  margin: 24px auto;
  padding: 32px 16px;
}

.waiting-card h3 {
  color: #385028;
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
