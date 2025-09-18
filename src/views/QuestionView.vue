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
          <ion-label position="stacked"
            >Deine Antwort ({{ min }}–{{ max }})</ion-label
          >
          <ion-range :min="min" :max="max" v-model="answer" />
        </ion-item>
        <p>
          Deine Auswahl: <strong>{{ answer }}</strong>
        </p>
        <ion-button expand="block" @click="submitAnswer"
          >Antwort absenden</ion-button
        >
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
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import questions from "@/questions.json";
import { supabase } from "@/supabaseClient";

console.log("Welcome to QuestionView");
const route = useRoute();
const router = useRouter();

// Spielername lokal auslesen (kann später nützlich sein für Feedback oder Debugging)
const userName = localStorage.getItem("playerName");
const gameId = route.params.gameId as string;
const rawQuestionId = route.params.questionId;
const questionId = Number(rawQuestionId);

if (isNaN(questionId)) {
  console.warn("Ungültige questionId – Weiterleitung zur Lobby.");
  router.push(`/lobby/${gameId}`);
}

const questionText = ref("");
const min = ref(0);
const max = ref(100);
const answer = ref(50);
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  estimation?: boolean;
}

const players = ref<Player[]>([]);

onMounted(async () => {
  console.log(
    "[QUESTIONVIEW] Suche Frage mit ID:",
    questionId,
    "| Typ:",
    typeof questionId
  );
  const question = (questions as any[]).find((q) => q.id === questionId);
  console.log("[QUESTIONVIEW] Gefundene Frage:", question);

  if (question) {
    questionText.value = question.text;
    min.value = question.min;
    max.value = question.max;
  } else {
    console.warn(
      "Fehlende oder ungültige gameId/questionId – Weiterleitung zur Lobby."
    );
    router.push(`/lobby/${gameId}`);
  }
  // Spieler aus Supabase laden (derzeit nicht benötigt für diese View)
  // const { data: session, error } = await supabase
  //   .from("game_session")
  //   .select("players, current_round")
  //   .eq("id", gameId)
  //   .single();
  // if (error) {
  //   console.warn("[QUESTIONVIEW] Fehler beim Laden der Session:", error);
  // }
  // if (session?.players) {
  //   players.value = session.players as Player[];
  // }
});

async function submitAnswer() {
  console.log(" [QUESTIONVIEW] Antwort abgesendet:", answer.value);
  console.log(" [QUESTIONVIEW] Spielername (lokal):", userName);
  localStorage.setItem(
    `answer-${gameId}-${questionId}`,
    answer.value.toString()
  );

  const playerId = localStorage.getItem("playerId");
  // Aktuelle Session aus Supabase lesen
  const { data: session, error: loadError } = await supabase
    .from("game_session")
    .select("players, current_round")
    .eq("id", gameId)
    .single();
  if (loadError || !session) {
    console.error("Fehler beim Laden der Session:", loadError);
    return;
  }

  const freshPlayers: Player[] = (session.players || []) as Player[];
  const updatedPlayers = freshPlayers.map((p: Player) =>
    p.id === playerId ? { ...p, estimation: true } : p
  );

  const existingRound = session.current_round || {};
  const existingAnswers = existingRound.answers || {};
  const newAnswers = {
    ...existingAnswers,
    [playerId as string]: {
      answerValue: answer.value,
      answeredAt: new Date().toISOString(),
    },
  };

  const updatedRound = {
    ...existingRound,
    answers: newAnswers,
    phase: "estimation",
  };

  const { error: updateError } = await supabase
    .from("game_session")
    .update({
      players: updatedPlayers,
      current_round: updatedRound,
      updated_at: new Date().toISOString(),
      phase_updated_at: new Date().toISOString(),
    })
    .eq("id", gameId);
  if (updateError) {
    console.error("Fehler beim Speichern der Antwort:", updateError);
    return;
  }
  console.log("Antwort erfolgreich gespeichert.");

  router.push(`/estimation/${gameId}/${questionId}`);
  console.log("[QUESTIONVIEW] Weiterleitung zur EstimationView");
  
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
  /* display, align-items, justify-content entfernen! */
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
  border-radius: 18px;
  box-shadow: 0 2px 10px 0 #d3e9b6a0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

h2 {
  color: #59981a;
  font-size: 1.35rem;
  text-align: center;
  font-family: 'Tenor Sans', Arial, sans-serif;
  margin: 16px 0 24px 0;
}

ion-item {
  background: transparent;
  margin: 16px 0 10px 0;
  border-radius: 12px;
  --color: #385028;
}

ion-label {
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.1rem;
}

p {
  color: #385028;
  text-align: center;
  font-size: 1.04rem;
  margin: 12px 0 20px 0;
}

ion-button {
  --background: #59981a;
  --color: #edffcc;
  --border-radius: 18px;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  margin-top: 12px;
}

@media (max-width: 520px) {
  .question-wrapper {
    max-width: 95vw;
    padding: 0 4vw 24px 4vw;
  }
  h2 {
    font-size: 1.13rem;
  }
}


.question-wrapper {
  max-width: 420px;
  margin: 0 auto;
  padding: 0 16px 32px 16px;
  background: #f9ffe6;
  border-radius: 24px;
  box-shadow: 0 2px 16px 0 #d3e9b6a0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

ion-item {
  --background: #e4f9ce !important;
  background: #e4f9ce !important; /* Fallback, aber Custom Property ist besser */
  margin: 16px 0 10px 0;
  border-radius: 18px;
  --color: #385028;
}

ion-label {
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.1rem;
}
</style>
