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
import { inject } from "vue";

import {
  getFirestore,
  doc,
  updateDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore";

console.log("Welcome to QuestionView");
const questions = inject("questions", []) as any[];
const route = useRoute();
const router = useRouter();

const db = getFirestore();

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
  const question = questions.find((q) => q.id === questionId);
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

  const dbRef = doc(db, "gameSessions", gameId);
  const docSnap = await getDoc(dbRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    players.value = data.players;
  }
});

async function submitAnswer() {
  console.log(" [QUESTIONVIEW] Antwort abgesendet:", answer.value);
  console.log(" [QUESTIONVIEW] Spielername (lokal):", userName);
  localStorage.setItem(
    `answer-${gameId}-${questionId}`,
    answer.value.toString()
  );

  const playerId = localStorage.getItem("playerId");
  // Update the answer in the gameSessions document
  const sessionRef = doc(db, "gameSessions", gameId);

  // Vor updateDoc: hole aktuelle Spieler aus der DB
  const freshSnap = await getDoc(sessionRef);
  const freshPlayers = freshSnap.data()?.players || [];

  console.log(userName)
  console.log(freshPlayers)


  const updatedPlayers = freshPlayers.map((p: Player) => {
    if (p.id === playerId) {
  return { ...p, estimation: true };
} else {
  return p;
}
  });

  try {
    await updateDoc(sessionRef, {
      [`currentRound.answers.${playerId}`]: {
        answerValue: answer.value,
        answeredAt: Timestamp.now(),
      },
      players: updatedPlayers,
      "currentRound.phase": "estimation",

    });
    console.log("Antwort erfolgreich gespeichert.");
    // Debug: Nach Update erneut Spieler aus der DB holen
    const updatedSnap = await getDoc(sessionRef);
    if (updatedSnap.exists()) {
      const updatedData = updatedSnap.data();
      console.log(" [QUESTIONVIEW] Spieler nach dem Speichern:", updatedData.players);
    } else {
      console.warn("Fehler: Session-Dokument nach Update nicht gefunden.");
    }
  } catch (error) {
    console.error("Fehler beim Speichern der Antwort:", error);
  }

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
