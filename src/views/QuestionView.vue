<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Frage</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="question-wrapper">
        <h2>{{ questionText }}</h2>
        <ion-item>
          <ion-label position="stacked">
            Deine Antwort ({{ min }}–{{ max }})
          </ion-label>
          <ion-range :min="min" :max="max" v-model="answer" />
        </ion-item>
        <p>
          Deine Auswahl: <strong>{{ answer }}</strong>
        </p>

        <p class="info-text" style="margin-top: 24px;">
          {{ answeredCount }} / {{ totalPlayers }} haben bereits geantwortet
        </p>

        <ion-button
          expand="block"
          @click="submitAnswer"
          :disabled="hasAnswered"
        >
          {{ hasAnswered ? 'Antwort abgesendet' : 'Antwort absenden' }}
        </ion-button>

        <p v-if="hasAnswered" class="waiting-text">
          Warte auf andere Spieler...
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonRange,
  IonButton,
} from "@ionic/vue";
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

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const currentPlayerId = computed(() => socketService.getSocketId());
const totalPlayers = computed(() => gameState.value?.players.length || 0);
const answeredCount = computed(() => {
  if (!gameState.value?.currentRound) return 0;
  return Object.keys(gameState.value.currentRound.answers).length;
});

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
  if (gameState.value?.currentRound?.answers[currentPlayerId.value]) {
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

  try {
    await socketService.emit('submitAnswer', {
      roomCode: gameId,
      answer: answer.value,
    });

    console.log('[QuestionView] Antwort abgesendet:', answer.value);
    hasAnswered.value = true;

    // Navigate to estimation view automatically
    // (or wait for server to send navigation event)
    // For now, let's wait for the host to proceed
  } catch (error: any) {
    console.error('[QuestionView] Fehler beim Speichern der Antwort:', error);
    alert(error.message || 'Fehler beim Speichern der Antwort');
  }
}
</script>

<style scoped>
ion-toolbar {
  --background: #59981a;
  --color: #edffcc;
  --min-height: 54px;
  --padding-start: 0;
  --padding-end: 0;
  box-shadow: none;
  border-bottom: none;
  font-family: "Tenor Sans", Arial, sans-serif;
}

ion-title {
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: #edffcc;
  text-align: center;
  letter-spacing: 0.01em;
  padding: 0;
  margin: 0;
  width: 100%;
  display: block;
}

.question-wrapper {
  max-width: 420px;
  margin: 0 auto;
  padding: 0 16px 32px 16px;
  background: #f9ffe6;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.question-wrapper h2 {
  text-align: center;
  font-size: 1.5rem;
  margin: 24px 0;
  color: #2d4a0e;
}

.info-text {
  text-align: center;
  color: var(--ion-color-medium);
  font-size: 14px;
}

.waiting-text {
  text-align: center;
  color: var(--ion-color-success);
  font-weight: 600;
  margin-top: 16px;
}

ion-button {
  --background: #59981a;
  --color: #edffcc;
  --border-radius: 9px;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  min-height: 48px;
  margin-top: 16px;
}

ion-button[disabled] {
  --background: var(--ion-color-medium);
  --color: white;
}
</style>
