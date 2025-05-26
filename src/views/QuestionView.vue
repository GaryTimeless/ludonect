<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-title>Frage</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>{{ questionText }}</h2>
      <ion-item>
        <ion-label position="stacked">Deine Antwort ({{ min }}–{{ max }})</ion-label>
        <ion-range :min="min" :max="max" v-model="answer" />
      </ion-item>
      <p>Deine Auswahl: <strong>{{ answer }}</strong></p>
      <ion-button expand="block" @click="submitAnswer">Antwort absenden</ion-button>
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
  IonButton
} from '@ionic/vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import questions from '@/questions.json'
import { getFirestore, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';

console.log("Welcome to QuestionView")
const route = useRoute()
const router = useRouter()

const db = getFirestore();

// Spielername lokal auslesen (kann später nützlich sein für Feedback oder Debugging)
const userName = localStorage.getItem('playerName');
const gameId = route.params.gameId as string
const rawQuestionId = route.params.questionId
const questionId = Number(rawQuestionId)

if (isNaN(questionId)) {
  console.warn('Ungültige questionId – Weiterleitung zur Lobby.')
  router.push(`/lobby/${gameId}`)
}

const questionText = ref('')
const min = ref(0)
const max = ref(100)
const answer = ref(50)
interface Player {
  id: string;
  name: string;
  isHost: boolean;
  estimation?: boolean;
}

const players = ref<Player[]>([])


onMounted(async () => {
  console.log('[Debug] Suche Frage mit ID:', questionId, '| Typ:', typeof questionId)
  const question = questions.find(q => q.id === questionId)
  console.log('[Debug] Gefundene Frage:', question)

  if (question) {
    questionText.value = question.text
    min.value = question.min
    max.value = question.max
  } else {
    console.warn('Fehlende oder ungültige gameId/questionId – Weiterleitung zur Lobby.')
    router.push(`/lobby/${gameId}`)
  }

  const dbRef = doc(db, 'gameSessions', gameId);
  const docSnap = await getDoc(dbRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    players.value = data.players;
  }
})

async function submitAnswer() {
  console.log('Antwort abgesendet:', answer.value);
  console.log('Spielername (lokal):', userName);
  localStorage.setItem(`answer-${gameId}-${questionId}`, answer.value.toString());

  const playerId = localStorage.getItem('playerId');
  if (!playerId) {
    console.error('Keine lokale Player-ID gefunden.');
    return;
  }
  // Update the answer in the gameSessions document
  const sessionRef = doc(db, 'gameSessions', gameId);
  // Write answer under currentRound.answers
  // estimation: true zeigt nur, dass der Spieler eine Antwort abgegeben hat (reine Anzeige-Logik, keine echten Werte)
  try {
    await updateDoc(sessionRef, {
      [`currentRound.answers.${playerId}`]: {
        answerValue: answer.value,
        answeredAt: Timestamp.now()
      },
      players: players.value.map((p) =>
        p.id === playerId
          ? { ...p, estimation: true }
          : p
      )
    });
    console.log("Antwort erfolgreich gespeichert.");
  } catch (error) {
    console.error("Fehler beim Speichern der Antwort:", error);
  }

  router.push(`/estimation/${gameId}/${questionId}`);
}
</script>
