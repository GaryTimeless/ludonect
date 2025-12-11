<template>
  <v-container class="mobile-container fade-in">
    <!-- Pre-game: Host arranges player order -->
    <v-card v-if="!sortingStarted" class="estimation-card" elevation="3">
      <v-card-title class="text-center">
        <h2>Spielerreihenfolge bestimmen</h2>
      </v-card-title>

      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            {{ answeredCount }} / {{ totalPlayers }} haben geantwortet
          </div>
        </v-alert>

        <p class="text-center mb-4 text-medium-emphasis">
          Ziehe die Spieler in die richtige Reihenfolge (niedrigste Antwort oben)
        </p>

        <VueDraggable
          v-model="players"
          :disabled="!isHost"
          item-key="id"
          class="player-drag-list"
        >
          <template #item="{ element, index }">
            <v-card
              class="player-drag-item mb-2"
              :class="{ 'host-item': isHost }"
              elevation="2"
            >
              <v-card-text class="d-flex align-center py-2">
                <v-icon v-if="isHost" class="drag-handle mr-3" size="small">
                  mdi-drag
                </v-icon>
                <v-avatar :color="getPlayerColor(element.id)" size="36" class="mr-3">
                  <span class="text-white font-weight-bold text-caption">
                    {{ element.name.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-medium">
                    {{ index + 1 }}. {{ element.name }}
                  </div>
                </div>
                <v-chip v-if="element.isHost" size="small" color="accent">
                  Host
                </v-chip>
              </v-card-text>
            </v-card>
          </template>
        </VueDraggable>

        <div v-if="isHost" class="mt-4">
          <v-btn
            color="primary"
            size="large"
            block
            @click="savePlayerOrder"
            :loading="saving"
            class="btn-press mb-2"
          >
            <v-icon start>mdi-content-save</v-icon>
            Reihenfolge speichern
          </v-btn>

          <v-btn
            color="success"
            size="x-large"
            block
            @click="startEstimation"
            :loading="starting"
            class="btn-press"
          >
            <v-icon start>mdi-play</v-icon>
            Spiel starten
          </v-btn>
        </div>

        <p v-else class="text-center text-medium-emphasis mt-4">
          Warte auf den Host...
        </p>

        <div class="text-center mt-4">
          <FunButton />
        </div>
      </v-card-text>
    </v-card>

    <!-- During game: Turn-based placement -->
    <v-card v-else-if="!sortingFinished" class="estimation-card" elevation="3">
      <v-card-title class="text-center">
        <h2 v-if="currentQuestion">{{ currentQuestion.text }}</h2>
      </v-card-title>

      <v-card-text>
        <v-alert
          :type="isMyTurn ? 'success' : 'info'"
          variant="tonal"
          class="mb-4"
          :class="{ pulse: isMyTurn }"
        >
          <div class="d-flex align-center">
            <v-icon :color="isMyTurn ? 'success' : 'info'" class="mr-2">
              {{ isMyTurn ? 'mdi-account-arrow-right' : 'mdi-clock-outline' }}
            </v-icon>
            <div>
              <div class="font-weight-bold">
                {{ isMyTurn ? '🎯 Du bist an der Reihe!' : '⏳ Warte auf deinen Zug' }}
              </div>
              <div v-if="activePlayerName && !isMyTurn" class="text-caption">
                {{ activePlayerName }} platziert sich gerade
              </div>
            </div>
          </div>
        </v-alert>

        <p class="text-center mb-4 text-medium-emphasis">
          Nutze die Pfeile um deinen Namen neu zu positionieren
        </p>

        <!-- Current placement order -->
        <v-list class="placement-list mb-4">
          <v-list-item
            v-for="(playerId, idx) in placedPlayers"
            :key="playerId"
            class="placement-item mb-2"
            :class="{ 'active-player': playerId === localPlayerId && isMyTurn }"
          >
            <template #prepend>
              <v-avatar :color="getPlayerColor(playerId)" size="36">
                <span class="text-white font-weight-bold text-caption">
                  {{ getPlayerName(playerId).charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
            </template>
            <v-list-item-title>
              {{ idx + 1 }}. {{ getPlayerName(playerId) }}
            </v-list-item-title>
          </v-list-item>
        </v-list>

        <!-- Move controls (only for active player) -->
        <div v-if="isMyTurn" class="move-controls mb-4">
          <v-btn
            icon="mdi-arrow-up"
            size="large"
            color="primary"
            @click="movePlayer(-1)"
            :disabled="!canMoveUp"
            class="btn-press"
          />
          <v-btn
            icon="mdi-arrow-down"
            size="large"
            color="primary"
            @click="movePlayer(1)"
            :disabled="!canMoveDown"
            class="btn-press"
          />
        </div>

        <!-- Finish button (sticky at bottom for mobile) -->
        <div v-if="isMyTurn" class="finish-button-container safe-bottom">
          <v-btn
            color="success"
            size="x-large"
            block
            @click="finishPlacement"
            :loading="finishing"
            class="btn-press"
          >
            <v-icon start>mdi-check</v-icon>
            Fertig
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Results: Show final order with answers -->
    <v-card v-else class="results-card" elevation="3">
      <v-card-title class="text-center">
        <h2>🎉 Finale Reihenfolge</h2>
      </v-card-title>

      <v-card-text>
        <v-list class="results-list">
          <v-list-item
            v-for="(result, index) in finalResults"
            :key="result.playerId"
            class="result-item mb-2 scale-in"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <template #prepend>
              <v-avatar :color="getPlayerColor(result.playerId)" size="40">
                <span class="text-white font-weight-bold">
                  {{ result.playerName.charAt(0).toUpperCase() }}
                </span>
              </v-avatar>
            </template>
            <v-list-item-title>
              {{ index + 1 }}. {{ result.playerName }}
            </v-list-item-title>
            <template #append>
              <v-chip color="primary" size="large">
                {{ result.answer }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>

        <v-btn
          v-if="isHost"
          color="success"
          size="x-large"
          block
          @click="prepareNextRound"
          class="btn-press mt-4"
        >
          <v-icon start>mdi-arrow-right</v-icon>
          Nächste Runde vorbereiten
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import VueDraggable from "vuedraggable";
import FunButton from "@/components/FunButton.vue";
import { socketService } from "@/services/socketService";

const route = useRoute();
const router = useRouter();
const questions = inject("questions", []) as any[];

const gameId = ref<string>(route.params.gameId as string);
const players = ref<any[]>([]);
const saving = ref(false);
const starting = ref(false);
const finishing = ref(false);

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const localPlayerId = computed(() => socketService.getSocketId());
const isHost = computed(() => gameState.value?.hostId === localPlayerId.value);
const currentRound = computed(() => gameState.value?.currentRound);

const sortingStarted = computed(() => currentRound.value?.sortingStarted || false);
const sortingFinished = computed(() => currentRound.value?.sortingFinished || false);
const placedPlayers = computed(() => currentRound.value?.placedPlayers || []);
const activePlayerId = computed(() => currentRound.value?.activePlayerId);
const answers = computed(() => currentRound.value?.answers || {});

const totalPlayers = computed(() => gameState.value?.players.length || 0);
const answeredCount = computed(() => Object.keys(answers.value).length);

const isMyTurn = computed(() => activePlayerId.value === localPlayerId.value);
const myPositionIndex = computed(() =>
  placedPlayers.value.findIndex((id: string) => id === localPlayerId.value)
);
const canMoveUp = computed(() => myPositionIndex.value > 0);
const canMoveDown = computed(() => myPositionIndex.value < placedPlayers.value.length - 1);

const currentQuestion = computed(() => {
  if (!currentRound.value?.questionId) return null;
  return questions.find((q: any) => q.id === currentRound.value.questionId);
});

const activePlayerName = computed(() => {
  if (!activePlayerId.value) return '';
  return getPlayerName(activePlayerId.value);
});

const finalResults = computed(() => {
  return placedPlayers.value.map((playerId: string) => ({
    playerId,
    playerName: getPlayerName(playerId),
    answer: answers.value[playerId] || 'Keine Antwort',
  }));
});

// Generate consistent colors
const playerColors = ['#9C27B0', '#FF9800', '#2196F3', '#4CAF50', '#F44336', '#00BCD4'];
function getPlayerColor(playerId: string): string {
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return playerColors[hash % playerColors.length];
}

function getPlayerName(playerId: string): string {
  const player = gameState.value?.players.find((p: any) => p.id === playerId);
  return player?.name || 'Unknown';
}

// Watch for game state changes to update local players
watch(
  () => gameState.value?.players,
  (newPlayers) => {
    if (newPlayers && !sortingStarted.value) {
      players.value = [...newPlayers];
    }
  },
  { immediate: true, deep: true }
);

async function savePlayerOrder() {
  saving.value = true;
  try {
    await socketService.emit('savePlayerOrder', {
      roomCode: gameId.value,
      order: players.value.map(p => p.id),
    });
    console.log('[Estimation] Player order saved');
  } catch (error: any) {
    console.error('[Estimation] Save order error:', error);
    alert(error.message || 'Fehler beim Speichern');
  } finally {
    saving.value = false;
  }
}

async function startEstimation() {
  starting.value = true;
  try {
    await socketService.emit('startEstimationGame', {
      roomCode: gameId.value,
    });
    console.log('[Estimation] Game started');
  } catch (error: any) {
    console.error('[Estimation] Start error:', error);
    alert(error.message || 'Fehler beim Starten');
  } finally {
    starting.value = false;
  }
}

function movePlayer(direction: number) {
  const newPlaced = [...placedPlayers.value];
  const index = myPositionIndex.value;
  const newIndex = index + direction;

  if (newIndex < 0 || newIndex >= newPlaced.length) return;

  const [moved] = newPlaced.splice(index, 1);
  newPlaced.splice(newIndex, 0, moved);

  // Update immediately via socket
  socketService.emit('updatePlacedPlayers', {
    roomCode: gameId.value,
    placedPlayers: newPlaced,
  }).catch((error: any) => {
    console.error('[Estimation] Move error:', error);
  });
}

async function finishPlacement() {
  finishing.value = true;
  try {
    await socketService.emit('finishPlayerTurn', {
      roomCode: gameId.value,
      placedPlayers: placedPlayers.value,
    });
    console.log('[Estimation] Turn finished');
  } catch (error: any) {
    console.error('[Estimation] Finish error:', error);
    alert(error.message || 'Fehler beim Beenden');
  } finally {
    finishing.value = false;
  }
}

async function prepareNextRound() {
  try {
    await socketService.emit('prepareNextRound', {
      roomCode: gameId.value,
    });
    // Server will emit navigateTo
  } catch (error: any) {
    console.error('[Estimation] Prepare next round error:', error);
    alert(error.message || 'Fehler');
  }
}
</script>

<style scoped>
.estimation-card,
.results-card {
  max-width: 600px;
  margin: 24px auto;
}

.estimation-card h2,
.results-card h2 {
  font-size: 1.3rem;
  color: #385028;
  font-weight: 700;
  padding: 8px;
}

.player-drag-list {
  max-width: 500px;
  margin: 0 auto;
}

.player-drag-item {
  background: #f5f5f5;
  transition: all 0.2s;
}

.player-drag-item.host-item {
  cursor: grab;
}

.player-drag-item.host-item:active {
  cursor: grabbing;
}

.drag-handle {
  cursor: grab;
  color: #59981A;
}

.placement-list {
  max-width: 500px;
  margin: 0 auto;
  background: transparent;
}

.placement-item {
  background: #f5f5f5;
  border-radius: 12px;
  transition: all 0.3s;
}

.placement-item.active-player {
  background: linear-gradient(135deg, #d0f0c0 0%, #e8f5e9 100%);
  box-shadow: 0 4px 12px rgba(89, 152, 26, 0.3);
  transform: scale(1.02);
}

.move-controls {
  display: flex;
  justify-content: center;
  gap: 60px;
}

.finish-button-container {
  position: sticky;
  bottom: 0;
  background: #EDFFCC;
  padding: 16px;
  margin: 0 -16px;
  border-top: 1px solid #e0e0e0;
  z-index: 10;
}

.results-list {
  max-width: 500px;
  margin: 0 auto;
}

.result-item {
  background: linear-gradient(135deg, #f9ffe6 0%, #ffffff 100%);
  border-radius: 12px;
}

@media (max-width: 600px) {
  .estimation-card h2,
  .results-card h2 {
    font-size: 1.1rem;
  }

  .move-controls {
    gap: 40px;
  }

  .finish-button-container {
    padding: 12px;
  }
}
</style>
