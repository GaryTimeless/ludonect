<template>
  <v-container class="mobile-container fade-in">
    <!-- Host View -->
    <v-card v-if="isHost" class="prepare-card" elevation="3">
      <v-card-title class="text-center">
        <h2>{{ t('prepareNext.chooseQuestion') }}</h2>
      </v-card-title>

      <v-card-text>
        <p class="text-center mb-4 text-medium-emphasis">
          {{ t('prepareNext.chooseSub') }}
        </p>

        <v-alert
          v-if="availableQuestions.length === 0"
          type="info"
          variant="tonal"
          class="mb-4"
          icon="mdi-check-circle-outline"
        >
          {{ t('prepareNext.allAnswered') }}
        </v-alert>

        <template v-else>
          <v-list class="question-selection-list mb-6">
            <v-list-item
              v-for="question in suggestedQuestions"
              :key="question.id"
              class="question-option mb-3"
              @click="startNextRound(question.id)"
              :disabled="starting"
            >
              <template #prepend>
                <v-icon color="primary">mdi-chat-question</v-icon>
              </template>
              <v-list-item-title class="text-wrap py-2">
                {{ getQuestionText(question) }}
              </v-list-item-title>
              <template #append>
                <v-btn icon="mdi-chevron-right" variant="text" color="primary"></v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-btn
            color="secondary"
            variant="tonal"
            block
            @click="refreshSuggestions"
            :disabled="starting"
            class="btn-press"
          >
            <v-icon start>mdi-refresh</v-icon>
            {{ t('prepareNext.otherSuggestions') }}
          </v-btn>
        </template>
      </v-card-text>
    </v-card>

    <!-- Non-Host View -->
    <v-card v-else class="waiting-card" elevation="3">
      <v-card-text class="text-center">
        <v-icon size="80" color="primary" class="pulse mb-4">mdi-clock-outline</v-icon>
        <h3 class="mb-4">{{ t('prepareNext.waitingForHost') }}</h3>
        <p class="text-medium-emphasis mb-4">
          {{ t('prepareNext.hostChoosing') }}
        </p>
        <img
          src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmwxcjQ3NzR3Nm5wdWd1bjJqZTJteWMxenFubnM2a2ZpMGw5enJzOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WFyqujMJoxIn9qSTf5/giphy.gif"
          alt="Waiting"
          style="max-width: 80%; height: auto; border-radius: 16px"
          class="mt-4"
        />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { inject } from "vue";
import { useI18n } from "vue-i18n";
import { useLocaleQuestion } from "@/composables/useLocaleQuestion";
import { socketService } from "@/services/socketService";

const { t } = useI18n();
const { getQuestionText } = useLocaleQuestion();

const questions = inject("questions") as any[];
const router = useRouter();
const route = useRoute();
const gameId = ref<string>(route.params.gameId as string);
const starting = ref(false);
const suggestedQuestions = ref<any[]>([]);

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const players = computed(() => gameState.value?.players || []);
const localPlayerId = computed(() => localStorage.getItem('playerId') ?? socketService.getSocketId() ?? undefined);
const isHost = computed(() => gameState.value?.hostId === localPlayerId.value);
const usedQuestionIds = computed(() => gameState.value?.usedQuestionIds || []);
const availableQuestions = computed(() =>
  questions.filter((q: any) => !usedQuestionIds.value.includes(q.id))
);

// Watch: validate we are in the right room once socket is connected
watch(
  () => ({ connected: socketService.connected.value, roomCode: gameState.value?.roomCode }),
  ({ connected, roomCode }) => {
    if (!connected) return;
    if (!roomCode) {
      router.push('/');
      return;
    }
    if (roomCode !== gameId.value) {
      router.push('/');
    }
  }
);

// Generate consistent colors for players
const playerColors = ['#9C27B0', '#FF9800', '#2196F3', '#4CAF50', '#F44336', '#00BCD4'];
function getPlayerColor(playerId: string): string {
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return playerColors[hash % playerColors.length];
}

onMounted(() => {
  console.log('[PrepareNextRound] Mounted, gameId:', gameId.value);
  refreshSuggestions();
});

function refreshSuggestions() {
  const unused = questions.filter((q: any) => !usedQuestionIds.value.includes(q.id));
  
  if (unused.length === 0) {
    suggestedQuestions.value = [];
    return;
  }

  // Pick up to 3 random questions
  const shuffled = [...unused].sort(() => 0.5 - Math.random());
  suggestedQuestions.value = shuffled.slice(0, 3);
}

async function startNextRound(questionId: number) {
  starting.value = true;

  try {
    await socketService.emit('startNextQuestion', {
      roomCode: gameId.value,
      questionId: questionId,
    });
    console.log('[PrepareNextRound] Started round with question:', questionId);
  } catch (error: any) {
    console.error('[PrepareNextRound] Start error:', error);
    alert(error.message || 'Fehler beim Starten der nächsten Runde');
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

.question-selection-list {
  background: transparent;
}

.question-option {
  background: white;
  border-radius: 12px;
  border: 2px solid #e8f5e9;
  transition: all 0.2s;
  cursor: pointer;
}

.question-option:hover {
  border-color: #59981A;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(89, 152, 26, 0.15);
}

.text-wrap {
  white-space: normal;
  line-height: 1.4;
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
