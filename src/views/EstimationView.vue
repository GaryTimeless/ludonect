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
            {{ answeredCount }} / {{ totalPlayers }} haben schon geantwortet
          </div>
        </v-alert>

        <p class="text-center mb-4 text-medium-emphasis">
          Ziehe die Spieler in die richtige Reihenfolge
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
            Reihenfolge aktualisieren
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
          {{ isMyTurn ? 'Ziehe deinen Namen an die richtige Position' : 'Warte auf die anderen Spieler' }}
        </p>

        <!-- Current placement order with drag and drop -->
        <VueDraggable
          v-model="placedPlayersLocal"
          :disabled="!isMyTurn"
          item-key="id"
          class="player-drag-list"
          @end="onDragEnd"
        >
          <template #item="{ element, index }">
            <v-card
              class="placement-drag-item mb-2"
              :class="{
                'active-player': element === localPlayerId && isMyTurn,
                'my-turn': isMyTurn
              }"
              elevation="2"
            >
              <v-card-text class="d-flex align-center py-2">
                <v-icon v-if="isMyTurn" class="drag-handle mr-3" size="small">
                  mdi-drag
                </v-icon>
                <v-avatar :color="getPlayerColor(element)" size="36" class="mr-3">
                  <span class="text-white font-weight-bold text-caption">
                    {{ getPlayerName(element).charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="font-weight-medium">
                    {{ index + 1 }}. {{ getPlayerName(element) }}
                  </div>
                </div>
                <v-chip
                  v-if="element === localPlayerId && isMyTurn"
                  size="small"
                  color="success"
                >
                  Du
                </v-chip>
              </v-card-text>
            </v-card>
          </template>
        </VueDraggable>

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

    <!-- Results: Show each player's ordering side-by-side -->
    <v-card v-else class="results-card" elevation="3">
      <v-card-title class="text-center">
        <h2>🎉 Finale Reihenfolge</h2>
      </v-card-title>

      <v-card-text>
        <p class="text-center text-medium-emphasis mb-2">
          So hat jeder die Spieler sortiert:
        </p>

        <!-- Scroll hint for mobile -->
        <div class="scroll-hint text-center mb-4">
          <v-icon color="primary" size="small">mdi-arrow-left-right</v-icon>
          <span class="text-caption text-medium-emphasis ml-1">Wische nach links/rechts</span>
        </div>

        <!-- Horizontal scroll container for cards -->
        <div class="cards-scroll-container">
          <div class="player-cards-wrapper">
            <div
              v-for="player in allPlayers"
              :key="player.id"
              class="player-ordering-card scale-in"
            >
              <!-- Player header with answer -->
              <div class="card-header" :style="{ background: getPlayerColor(player.id) }">
                <v-avatar color="white" size="40" class="mb-2">
                  <span class="font-weight-bold" :style="{ color: getPlayerColor(player.id) }">
                    {{ player.name.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
                <div class="card-player-name">{{ player.name }}</div>
                <div class="card-answer-chip">
                  Antwort: <strong>{{ getPlayerAnswer(player.id) }}</strong>
                </div>
              </div>

              <!-- Ordering list -->
              <div class="card-ordering-list">
                <div
                  v-for="(_, rank) in maxPlayers"
                  :key="rank"
                  class="ordering-row"
                >
                  <div class="rank-badge">{{ rank + 1 }}</div>
                  <v-avatar
                    :color="getPlayerColor(getPlayerOrderingAtRank(player.id, rank))"
                    size="32"
                    class="mx-2"
                  >
                    <span class="text-white font-weight-bold text-caption">
                      {{ getPlayerNameShort(getPlayerOrderingAtRank(player.id, rank)) }}
                    </span>
                  </v-avatar>
                  <span class="ordering-player-name">
                    {{ getPlayerName(getPlayerOrderingAtRank(player.id, rank)) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scroll indicator dots -->
        <div class="scroll-indicators" v-if="allPlayers.length > 1">
          <div
            v-for="player in allPlayers"
            :key="player.id"
            class="indicator-dot"
            :style="{ background: getPlayerColor(player.id) }"
          ></div>
        </div>

        <v-btn
          v-if="isHost"
          color="success"
          size="x-large"
          block
          @click="prepareNextRound"
          class="btn-press mt-6"
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

// Local copy of placed players for drag and drop
const placedPlayersLocal = ref<string[]>([]);

// Track if we've modified local during our turn (to preserve drag changes)
const hasLocalChanges = ref(false);

// Watch for changes in placedPlayers from server and sync to local
watch(
  () => placedPlayers.value,
  (newPlayers) => {
    // Sync if: local is empty, OR it's not our turn, OR we haven't made local changes yet
    if (placedPlayersLocal.value.length === 0 || !isMyTurn.value || !hasLocalChanges.value) {
      placedPlayersLocal.value = [...newPlayers];
    }
  },
  { immediate: true, deep: true }
);

// When our turn starts, reset the local changes flag and sync latest state
watch(
  () => activePlayerId.value,
  (newActiveId, oldActiveId) => {
    if (newActiveId === localPlayerId.value) {
      // Our turn just started - sync latest state from server
      hasLocalChanges.value = false;
      placedPlayersLocal.value = [...placedPlayers.value];
      console.log('[Estimation] Turn started, synced placedPlayers:', placedPlayersLocal.value);
    }
  }
);

const currentQuestion = computed(() => {
  if (!currentRound.value?.questionId) return null;
  return questions.find((q: any) => q.id === currentRound.value.questionId);
});

const activePlayerName = computed(() => {
  if (!activePlayerId.value) return '';
  return getPlayerName(activePlayerId.value);
});

const playerOrderings = computed(() => {
  const orderings = currentRound.value?.playerOrderings || {};
  console.log('[EstimationView] playerOrderings:', orderings);
  return orderings;
});

const allPlayers = computed(() => gameState.value?.players || []);

const maxPlayers = computed(() => allPlayers.value.length);

function getPlayerAnswer(playerId: string): string {
  const answer = answers.value[playerId];
  console.log(`[EstimationView] getPlayerAnswer(${playerId}):`, answer, 'all answers:', answers.value);
  return answer !== undefined ? String(answer) : 'Keine Antwort';
}

function getPlayerOrderingAtRank(playerId: string, rankIndex: number): string {
  const ordering = playerOrderings.value[playerId];
  if (!ordering || rankIndex >= ordering.length) {
    return '';
  }
  return ordering[rankIndex];
}

function getPlayerNameShort(playerId: string): string {
  if (!playerId) return '?';
  const player = gameState.value?.players.find((p: any) => p.id === playerId);
  return player?.name?.charAt(0).toUpperCase() || '?';
}

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

function onDragEnd() {
  // Mark that we've made local changes (prevents server sync overwriting our drag)
  hasLocalChanges.value = true;
  console.log('[Estimation] Player dragged to new position');
}

async function finishPlacement() {
  finishing.value = true;
  try {
    await socketService.emit('finishPlayerTurn', {
      roomCode: gameId.value,
      placedPlayers: placedPlayersLocal.value,
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

.placement-drag-item {
  background: #f5f5f5;
  transition: all 0.2s;
}

.placement-drag-item.my-turn {
  cursor: grab;
}

.placement-drag-item.my-turn:active {
  cursor: grabbing;
}

.placement-drag-item.active-player {
  background: linear-gradient(135deg, #d0f0c0 0%, #e8f5e9 100%);
  box-shadow: 0 4px 12px rgba(89, 152, 26, 0.3);
  transform: scale(1.02);
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

.scroll-hint {
  animation: pulse 2s ease-in-out infinite;
}

.cards-scroll-container {
  overflow-x: auto;
  overflow-y: visible;
  margin: 0 -16px;
  padding: 0 16px 16px 16px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.cards-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.player-cards-wrapper {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  min-width: min-content;
}

.player-ordering-card {
  flex: 0 0 auto;
  width: 280px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  scroll-snap-align: center;
  transition: transform 0.2s;
}

.player-ordering-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  padding: 20px;
  color: white;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-player-name {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.card-answer-chip {
  background: rgba(255, 255, 255, 0.95);
  color: #2d4a0e;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-ordering-list {
  padding: 16px;
}

.ordering-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #f9ffe6 0%, #ffffff 100%);
  border-radius: 12px;
  border: 2px solid #e8f5e9;
  transition: all 0.2s;
}

.ordering-row:hover {
  border-color: #59981A;
  transform: translateX(4px);
}

.rank-badge {
  background: linear-gradient(135deg, #59981A 0%, #7CB342 100%);
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9rem;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(89, 152, 26, 0.3);
}

.ordering-player-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2d4a0e;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-indicators {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  margin-bottom: 8px;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.5;
  transition: all 0.3s;
}

@media (max-width: 600px) {
  .estimation-card h2,
  .results-card h2 {
    font-size: 1.1rem;
  }

  .finish-button-container {
    padding: 12px;
  }

  .player-ordering-card {
    width: 260px;
  }

  .card-player-name {
    font-size: 1rem;
  }

  .card-answer-chip {
    font-size: 0.85rem;
    padding: 6px 12px;
  }

  .ordering-row {
    padding: 8px 10px;
  }

  .rank-badge {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }

  .ordering-player-name {
    font-size: 0.85rem;
  }
}
</style>
