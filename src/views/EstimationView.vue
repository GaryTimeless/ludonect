<template>
  <v-container class="mobile-container fade-in">
    <!-- Pre-game: Host arranges player order -->
    <v-card v-if="!sortingStarted" class="estimation-card" elevation="3">
      <v-card-title class="text-center">
        <h2>{{ t('estimation.determineOrder') }}</h2>
      </v-card-title>

      <v-card-text>
        <v-alert type="info" variant="tonal" class="mb-4">
          <div class="text-body-2">
            {{ t('estimation.answeredCount', { count: answeredCount, total: totalPlayers }) }}
          </div>
        </v-alert>

        <p class="text-center mb-4 text-medium-emphasis">
          {{ t('estimation.dragInstruction') }}
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
            {{ t('estimation.updateOrder') }}
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
            {{ t('estimation.startGame') }}
          </v-btn>
        </div>

        <p v-else class="text-center text-medium-emphasis mt-4">
          {{ t('estimation.waitForHost') }}
        </p>

        <div class="text-center mt-4">
          <FunButton />
        </div>
      </v-card-text>
    </v-card>

    <!-- During game: Turn-based placement -->
    <v-card v-else-if="!sortingFinished" class="estimation-card" elevation="3">
      <v-card-title class="text-center">
        <h2 v-if="currentQuestion">{{ getQuestionText(currentQuestion) }}</h2>
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
                {{ isMyTurn ? t('estimation.itsYourTurn', { name: localPlayerName }) : t('estimation.waitYourTurn', { name: localPlayerName }) }}
              </div>
              <div v-if="activePlayerName && !isMyTurn" class="text-caption">
                {{ t('estimation.placing', { name: activePlayerName }) }}
              </div>
            </div>
          </div>
        </v-alert>

        <p class="text-center mb-4 text-medium-emphasis">
          {{ isMyTurn ? t('estimation.dragYourName') : t('estimation.waitOthers') }}
        </p>

        <!-- Current placement order with drag and drop -->
        <VueDraggable
          v-model="placedPlayersLocal"
          :disabled="!isMyTurn"
          handle=".drag-handle"
          item-key="id"
          class="player-drag-list"
          @end="onDragEnd"
        >
          <template #item="{ element, index }">
            <v-card
              class="placement-drag-item mb-2"
              :class="{
                'active-player': element === localPlayerId && isMyTurn,
                'my-turn': element === localPlayerId && isMyTurn,
              }"
              elevation="2"
            >
              <v-card-text class="d-flex align-center py-2">
                <!-- Only show drag handle for own card -->
                <v-icon
                  v-if="element === localPlayerId && isMyTurn"
                  class="drag-handle mr-3"
                  size="small"
                >
                  mdi-drag
                </v-icon>
                <!-- Spacer so layout stays consistent when no handle shown -->
                <span v-else-if="isMyTurn" class="drag-handle-spacer mr-3" />
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
                  {{ t('common.you') }}
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
            {{ t('estimation.done') }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Results: Final order with revealed answers -->
    <v-card v-else class="results-card" elevation="3">
      <v-card-title class="text-center results-title">
        <h2>{{ t('estimation.finalOrder') }}</h2>
        <p v-if="currentQuestion" class="results-question">
          {{ getQuestionText(currentQuestion) }}
        </p>
      </v-card-title>

      <v-card-text>
        <!-- Final placement list -->
        <div class="results-list">
          <div
            v-for="(playerId, index) in placedPlayers"
            :key="playerId"
            class="results-list-item scale-in"
          >
            <div class="rank-badge">{{ index + 1 }}</div>
            <v-avatar :color="getPlayerColor(playerId)" size="40" class="mx-3">
              <span class="text-white font-weight-bold">
                {{ getPlayerName(playerId).charAt(0).toUpperCase() }}
              </span>
            </v-avatar>
            <div class="results-player-info">
              <div class="results-player-name">{{ getPlayerName(playerId) }}</div>
            </div>
            <v-chip color="primary" variant="tonal" class="results-answer-chip">
              {{ getPlayerAnswer(playerId) }}
            </v-chip>
          </div>
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
          {{ t('estimation.nextRound') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import VueDraggable from "vuedraggable";
import FunButton from "@/components/FunButton.vue";
import { useLocaleQuestion } from "@/composables/useLocaleQuestion";
import { socketService } from "@/services/socketService";

const { t } = useI18n();
const { getQuestionText } = useLocaleQuestion();

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
const localPlayerId = computed(() => localStorage.getItem('playerId') ?? socketService.getSocketId() ?? undefined);
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
const localPlayerName = computed(() => localPlayerId.value ? getPlayerName(localPlayerId.value) : '');

// Local copy for drag-and-drop during our turn
const placedPlayersLocal = ref<string[]>([]);

// Sync server placedPlayers → local whenever turn changes
watch(
  () => activePlayerId.value,
  (newActiveId) => {
    if (newActiveId === localPlayerId.value) {
      // Our turn just started.
      // Seed local list with current server list + append our own ID so we can drag it.
      const myId = localPlayerId.value ?? '';
      const serverList = placedPlayers.value.filter(id => id !== myId);
      placedPlayersLocal.value = myId ? [...serverList, myId] : [...serverList];
      console.log('[Estimation] Turn started, seeded placedPlayersLocal:', placedPlayersLocal.value);
    }
  },
  { immediate: true }
);

// Also sync when not our turn (spectators see live list from server)
watch(
  () => placedPlayers.value,
  (newList) => {
    if (!isMyTurn.value) {
      placedPlayersLocal.value = [...newList];
    }
  },
  { deep: true }
);

const currentQuestion = computed(() => {
  if (!currentRound.value?.questionId) return null;
  return questions.find((q: any) => q.id === currentRound.value?.questionId);
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
  return answer !== undefined ? String(answer) : t('common.noAnswer');
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
  console.log('[Estimation] Player dragged to new position:', placedPlayersLocal.value);
}

async function finishPlacement() {
  finishing.value = true;
  try {
    const order = currentRound.value?.estimationOrder || [];
    const isP1 = localPlayerId.value === order[0];
    const isSecondTurn = isP1 && placedPlayersLocal.value.length === order.length;

    await socketService.emit('finishPlayerTurn', {
      roomCode: gameId.value,
      placedPlayers: placedPlayersLocal.value,
      ...(isSecondTurn ? { isSecondTurn: true } : {}),
    });
    console.log('[Estimation] Turn finished', isSecondTurn ? '(P1 second turn)' : '');
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
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
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

.drag-handle-spacer {
  display: inline-block;
  width: 20px; /* matches mdi-drag icon size */
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
  cursor: default; /* only the handle has grab cursor */
}

.placement-drag-item.my-turn:active {
  cursor: default;
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

.results-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
  white-space: normal !important;
}

.results-question {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  margin-top: 4px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.results-list {
  max-width: 500px;
  margin: 0 auto;
}

.results-list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 10px;
  background: linear-gradient(135deg, #f9ffe6 0%, #ffffff 100%);
  border-radius: 14px;
  border: 2px solid #e8f5e9;
  transition: all 0.2s;
}

.results-list-item:hover {
  border-color: #59981A;
  transform: translateX(4px);
}

.results-player-info {
  flex: 1;
  min-width: 0;
}

.results-player-name {
  font-size: 1rem;
  font-weight: 600;
  color: #2d4a0e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.results-answer-chip {
  font-weight: 700;
  flex-shrink: 0;
}

@media (max-width: 600px) {
  .estimation-card h2,
  .results-card h2 {
    font-size: 1.1rem;
  }

  .finish-button-container {
    padding: 12px;
  }
}
</style>
