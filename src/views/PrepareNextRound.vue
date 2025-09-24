<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Vorbereitung nächste Runde</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="prepare-center-wrapper">
        <div class="p-4" v-if="isHost">
          <h2 class="text-lg font-bold mb-2">Aktueller Spielstand (currentRound)</h2>
          <pre>{{ currentRound }}</pre>

          <div class="p-4">
            <h2 class="text-lg font-bold mb-2">Spieler in der Runde</h2>
            <ul class="list-disc list-inside space-y-2">
              <li v-for="player in players" :key="player.id">
                <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                  <h3 class="text-lg font-semibold text-gray-800 mb-1">
                    {{ player.name }}
                  </h3>
                  <p class="text-sm text-gray-600 mb-1">
                    <strong>ID:</strong> {{ player.id }}
                  </p>
                  <p class="text-sm text-gray-600 mb-1">
                    <strong>Host:</strong>
                    <span v-if="player.isHost">Ja 👑</span>
                    <span v-else>Nein</span>
                  </p>
                  <p class="text-sm text-gray-600 mb-1">
                    <strong>Schätzung:</strong>
                    <span v-if="player.estimation">✅ Abgegeben</span>
                    <span v-else>❌ Offen</span>
                  </p>
                  <p class="text-sm text-gray-600 mb-1">
                    <strong>joinDate:</strong>
                    <span>{{ player.joinedAt }}</span>
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div class="prepare-buttons-wrapper">
            <ion-button expand="block" @click="resetCurrentRound">
              🧹 currentRound bereinigen
            </ion-button>
            <p>{{ CheckCleanDB ? "wurde bereinigt " : "" }}</p>
            <ion-button expand="block" color="medium" @click="startNextRound">
              ➕ Neue Frage laden & ▶️ Weiter zur nächsten Spielrunde
            </ion-button>
          </div>
        </div>

        <div class="p-4" v-else>
          <div class="prepare-center-wrapper">
            <div class="player-list-wrapper" style="text-align: center">
              <h3 class="player-list-title">🕒 Warte auf den Host...</h3>
              <p class="player-list-title">Der Host bereitet die nächste Runde vor.</p>
              <img
                src="https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExbmwxcjQ3NzR3Nm5wdWd1bjJqZTJteWMxenFubnM2a2ZpMGw5enJzOSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/WFyqujMJoxIn9qSTf5/giphy.gif"
                alt="Warten auf Host"
                style="max-width: 80%; height: auto; border-radius: 8px"
              />
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount, inject } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from "@ionic/vue";
import { supabase } from "@/supabaseClient";

const CheckCleanDB = ref(false);
const questions = inject("questions") as any[];

const route = useRoute();
const router = useRouter();

const gameId = ref<string>(route.params.gameId as string);
const currentRound = ref<any>({});
const players = ref<any[]>([]);
const phase = ref("");

const localPlayerId = localStorage.getItem("playerId");
const isHost = computed(() => {
  const me = players.value.find((p) => p.id === localPlayerId);
  return me?.isHost || false;
});

let unsubscribeFn: (() => void) | null = null;

const loadSession = async () => {
  const { data, error } = await supabase
    .from("game_session")
    .select("*")
    .eq("id", gameId.value)
    .single();

  if (error || !data) {
    console.error("[PREPARE] Fehler beim Laden der Session:", error);
    return;
  }

  players.value = data.players || [];
  currentRound.value = data.current_round || {};
  phase.value = currentRound.value?.phase || "";
};

onMounted(async () => {
  gameId.value = route.params.gameId as string;
  await loadSession();

  const realtimeChannel = supabase
    .channel(`prepare-next-${gameId.value}-${Date.now()}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_session",
        filter: `id=eq.${gameId.value}`,
      },
      (payload) => {
        const data = payload.new as any;
        if (!data) return;

        players.value = data.players || [];
        currentRound.value = data.current_round || {};
        phase.value = currentRound.value?.phase || "";

        const questionId = currentRound.value?.questionId;
        if (
          !isHost.value &&
          phase.value === "question" &&
          questionId &&
          route.name !== "QuestionView"
        ) {
          console.log("[PREPARE] push to QuestionView");
          router.push(`/question/${gameId.value}/${questionId}`);
        }
      }
    )
    .subscribe();

  unsubscribeFn = () => {
    supabase.removeChannel(realtimeChannel);
    console.log("[PREPARE] Unsubscribed on leave");
  };
});

onBeforeUnmount(() => {
  unsubscribeFn?.();
});

const resetCurrentRound = async () => {
  const { data, error } = await supabase
    .from("game_session")
    .select("current_round, players")
    .eq("id", gameId.value)
    .single();

  if (error || !data) {
    console.error("[PREPAIRE] Fehler beim Lesen der Runde:", error);
    return;
  }

  const updatedRound = {
    ...(data.current_round || {}),
    answers: {},
    estimationOrder: [],
    placedPlayers: [],
    sortingFinished: false,
    sortingStarted: false,
    secondTurnStartPlayer: false,
    PrepNextRound: false,
  };

  const updatedPlayers = (data.players || []).map((player: any) => ({
    ...player,
    estimation: false,
  }));

  const { error: updateError } = await supabase
    .from("game_session")
    .update({
      current_round: updatedRound,
      players: updatedPlayers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId.value);

  if (updateError) {
    console.error("[PREPAIRE] Fehler beim Bereinigen der Runde:", updateError);
    return;
  }

  CheckCleanDB.value = true;
  console.log("[PREPAIRE] currentRound wurde bereinigt.");
};

const startNextRound = async () => {
  console.log("[PREPAIRE] startNextRound -> START");
  const { data, error } = await supabase
    .from("game_session")
    .select("current_round, used_question_ids")
    .eq("id", gameId.value)
    .single();

  if (error || !data) {
    console.error("[PREPAIRE] Fehler beim Laden vor Start der neuen Runde:", error);
    return;
  }

  const used = data.used_question_ids || [];
  const unused = questions?.filter((q: any) => !used.includes(q.id)) || [];
  if (unused.length === 0) {
    alert("Keine Fragen mehr verfügbar.");
    return;
  }

  const newQuestion = unused[Math.floor(Math.random() * unused.length)];
  const newRound = {
    ...(data.current_round || {}),
    questionId: newQuestion.id,
    phase: "question",
  };

  const { error: updateError } = await supabase
    .from("game_session")
    .update({
      current_round: newRound,
      used_question_ids: [...used, newQuestion.id],
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId.value);

  if (updateError) {
    console.error("[PREPAIRE] Fehler beim Setzen der neuen Frage:", updateError);
    return;
  }

  CheckCleanDB.value = false;
  console.log("[PREPAIRE] Weiterleitung zur nächsten Frage.");
  router.push(`/question/${gameId.value}/${newQuestion.id}`);
};
</script>

<style scoped>
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

.prepare-center-wrapper {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 18px;
  width: 100%;
  box-sizing: border-box;
  color: #385028;
}

.player-list-wrapper {
  background: #f7fbe9;
  border-radius: 14px;
  box-shadow: 0 2px 12px 0 #d3e9b633;
  margin-bottom: 18px;
  padding: 20px 20px 10px 20px;
  text-align: left;
}

.player-list-title {
  color: #59981a;
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 6px;
}

.player-order-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.player-order-list li {
  color: #385028;
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.02rem;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.host-label {
  font-size: 0.92em;
  color: #b7d065;
  margin-left: 5px;
}

.prepare-buttons-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  margin: 0 auto;
  align-items: center;
}
</style>
