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
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';

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

onMounted(() => {
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
})

async function submitAnswer() {
  console.log('Antwort abgesendet:', answer.value);
  console.log('Spielername (lokal):', userName);
  localStorage.setItem(`answer-${gameId}-${questionId}`, answer.value.toString());

  const roomRef = doc(db, 'rooms', gameId);
  const roomSnap = await getDoc(roomRef);
  const roomData = roomSnap.data();

  if (!roomData || !roomData.players) {
    console.error('Raum oder Spielerdaten nicht gefunden.');
    return;
  }

  const playerId = localStorage.getItem('playerId');
  console.log('Lokale Player-ID:', playerId);
  console.log('Player-IDs im Raum:', roomData.players.map((p: any) => p.id));
  const updatedPlayers = roomData.players.map((player: any) => {
    if (player.id === playerId) {
      return {
        ...player,
        estimation: answer.value
      };
    }
    return player;
  });

  await updateDoc(roomRef, {
    players: updatedPlayers
  });
  console.log("Spielerdaten nach Update:", updatedPlayers);

  router.push(`/estimation/${gameId}/${questionId}`);
}
</script>
