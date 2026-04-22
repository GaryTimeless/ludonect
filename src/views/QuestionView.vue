<template>
  <v-container class="mobile-container fade-in">
    <v-card class="question-card" elevation="3">
      <v-card-title class="question-title text-center">
        <h2>{{ questionText }}</h2>
      </v-card-title>

      <v-card-text>
        <div class="slider-container">
          <p class="slider-label text-center mb-4">
            Deine Antwort ({{ min }}–{{ max }})
          </p>

          <div class="slider-value-display mb-4">
            <v-chip color="primary" size="large" class="value-chip">
              {{ answer }}
            </v-chip>
          </div>

          <v-slider
            v-model="answer"
            :min="min"
            :max="max"
            :step="1"
            color="primary"
            track-color="grey-lighten-2"
            class="question-slider"
          />
        </div>

        <v-progress-linear
          :model-value="(answeredCount / totalPlayers) * 100"
          color="primary"
          bg-color="primary-lighten-1"
          bg-opacity="0.15"
          height="10"
          rounded
          class="mt-6 mb-2"
        />
        <p class="text-center text-caption text-medium-emphasis">
          {{ answeredCount }} / {{ totalPlayers }} haben bereits geantwortet
        </p>

        <v-btn
          color="success"
          size="x-large"
          block
          @click="submitAnswer"
          :disabled="hasAnswered"
          :loading="submitting"
          class="btn-press mt-6"
        >
          <v-icon start v-if="hasAnswered">mdi-check-circle</v-icon>
          {{ hasAnswered ? 'Antwort abgesendet' : 'Antwort absenden' }}
        </v-btn>

        <transition name="fade">
          <div v-if="hasAnswered" class="waiting-message mt-4 pulse">
            <v-icon color="success" size="small">mdi-clock-outline</v-icon>
            <span class="ml-2">Warte auf andere Spieler...</span>
          </div>
        </transition>

        <!-- Host can proceed when all have answered -->
        <v-btn
          v-if="isHost && allPlayersAnswered"
          color="primary"
          size="x-large"
          block
          @click="proceedToEstimation"
          :loading="proceeding"
          class="btn-press mt-6"
        >
          <v-icon start>mdi-arrow-right</v-icon>
          Zur Schätzung
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { inject } from "vue";
import { socketService } from "@/services/socketService";

const questions = inject("questions", []) as any[];
const route = useRoute();
const router = useRouter();

const gameId = route.params.gameId as string;
const rawQuestionId = route.params.questionId;
const questionId = Number(rawQuestionId);

const questionText = ref("");
const min = ref(0);
const max = ref(100);
const answer = ref(50);
const hasAnswered = ref(false);
const submitting = ref(false);
const proceeding = ref(false);

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const currentPlayerId = computed(() => localStorage.getItem('playerId') ?? socketService.getSocketId() ?? undefined);
const isHost = computed(() => gameState.value?.hostId === currentPlayerId.value);
const totalPlayers = computed(() => gameState.value?.players.length || 0);
const answeredCount = computed(() => {
  if (!gameState.value?.currentRound) return 0;
  return Object.keys(gameState.value.currentRound.answers).length;
});
const allPlayersAnswered = computed(() => answeredCount.value === totalPlayers.value && totalPlayers.value > 0);

onMounted(async () => {
  console.log('[QuestionView] Mounted with question ID:', questionId);

  if (isNaN(questionId)) {
    console.warn('Ungültige questionId – Weiterleitung zur Lobby.');
    router.push('/lobby');
    return;
  }

  const question = questions.find((q) => q.id === questionId);
  console.log('[QuestionView] Gefundene Frage:', question);

  if (question) {
    questionText.value = question.text;
    min.value = question.min;
    max.value = question.max;
    answer.value = Math.floor((question.min + question.max) / 2);
  } else {
    console.warn('Frage nicht gefunden – Weiterleitung zur Lobby.');
    router.push('/lobby');
  }

  // Check if this player has already answered
  const pid = currentPlayerId.value;
  if (pid && gameState.value?.currentRound?.answers[pid]) {
    hasAnswered.value = true;
  }
});

// Watch for game state changes
watch(
  () => gameState.value?.currentRound?.answers,
  (newAnswers) => {
    if (newAnswers && currentPlayerId.value && newAnswers[currentPlayerId.value]) {
      hasAnswered.value = true;
    }
  },
  { deep: true }
);

async function submitAnswer() {
  if (hasAnswered.value) return;

  submitting.value = true;

  try {
    await socketService.emit('submitAnswer', {
      roomCode: gameId,
      answer: answer.value,
    });

    console.log('[QuestionView] Antwort abgesendet:', answer.value);
    hasAnswered.value = true;
  } catch (error: any) {
    console.error('[QuestionView] Fehler beim Speichern der Antwort:', error);
    alert(error.message || 'Fehler beim Speichern der Antwort');
  } finally {
    submitting.value = false;
  }
}

async function proceedToEstimation() {
  proceeding.value = true;
  try {
    // Tell server to navigate all clients to estimation view
    await socketService.emit('proceedToEstimation', {
      roomCode: gameId,
    });
    console.log('[QuestionView] Proceeding to estimation view');
  } catch (error: any) {
    console.error('[QuestionView] Fehler beim Weiterleiten:', error);
    alert(error.message || 'Fehler beim Weiterleiten');
  } finally {
    proceeding.value = false;
  }
}
</script>

<style scoped>
.question-card {
  max-width: 500px;
  margin: 24px auto;
  background: linear-gradient(135deg, #f9ffe6 0%, #ffffff 100%);
}

.question-title h2 {
  font-size: 1.5rem;
  color: #2d4a0e;
  font-weight: 700;
  padding: 16px;
  line-height: 1.4;
  white-space: normal;
  overflow-wrap: break-word;
  word-break: break-word;
}

.slider-container {
  padding: 24px 16px;
}

.slider-label {
  font-size: 1.1rem;
  color: #385028;
  font-weight: 600;
}

.question-slider {
  margin: 32px 0;
}

.slider-thumb-value {
  font-weight: 700;
  font-size: 14px;
}

.slider-value-display {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.value-chip {
  font-size: 1.5rem;
  font-weight: 700;
  padding: 24px;
}

.waiting-message {
  text-align: center;
  color: #4CAF50;
  font-weight: 600;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Gradient slider track */
:deep(.v-slider-track__fill) {
  background: #59981A;
}

@media (max-width: 600px) {
  .question-title h2 {
    font-size: 1.25rem;
  }

  .value-chip {
    font-size: 1.25rem;
    padding: 20px;
  }
}
</style>
