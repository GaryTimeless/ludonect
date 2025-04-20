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
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFirestore, doc, onSnapshot, getDocs, collection, getDoc, setDoc } from 'firebase/firestore'
import questions from "@/questions.json";

const route = useRoute()
const router = useRouter()
const db = getFirestore()
const gameId = route.params.gameId as string
const userId = localStorage.getItem('userId') || 'unknown-user'

const questionIdParam = route.params.id
const questionId = Array.isArray(questionIdParam)
  ? parseInt(questionIdParam[0])
  : parseInt(questionIdParam as string)

if (!gameId || isNaN(questionId)) {
  console.warn('Fehlende oder ungültige gameId/questionId – Weiterleitung zur Lobby.')
  router.push('/home')
}
const question = questions.find(q => q.id === questionId)

if (!question) {
  throw new Error('Frage nicht gefunden')
}

const questionText = ref(question.text)
const min = ref(question.min)
const max = ref(question.max)
const answer = ref(Math.floor((min.value + max.value) / 2))

const gameRef = doc(db, 'games', gameId)

onSnapshot(gameRef, (snapshot) => {
  const data = snapshot.data()
  console.log("Check estimation XXXXXXX");
  if (data?.phase === 'estimation') {
    router.push({ name: 'estimation', params: { gameId } })
  }
})

async function checkIfAllAnswered() {
  const playersSnapshot = await getDocs(collection(db, 'games', gameId, 'players'))
  const allAnswered = playersSnapshot.docs.every(doc => doc.data().answer !== undefined)
  console.log('Anzahl Spieler:', playersSnapshot.docs.length)
  playersSnapshot.docs.forEach((doc) => {
    console.log(`Spieler ${doc.id} Antwort:`, doc.data().answer)
  })
  console.log('Alle Spieler haben geantwortet?', allAnswered)
  if (allAnswered) {
    await setDoc(gameRef, { phase: 'estimation' }, { merge: true })
  }
}

async function submitAnswer() {
  try {
    const playerRef = doc(db, 'games', gameId, 'players', userId)
    const playerSnap = await getDoc(playerRef)

    console.log('Spieler-ID:', userId)
    console.log('PlayerRef:', playerRef.path)
    console.log('PlayerDoc exists?', playerSnap.exists())

    await setDoc(playerRef, {
      answer: answer.value
    }, { merge: true })
    
    console.log('Antwort erfolgreich an Firestore gesendet:', answer.value)

    console.log('Antwort gespeichert:', answer.value)
    await checkIfAllAnswered()
    console.log('Prüfung, ob alle geantwortet haben, abgeschlossen.')
  } catch (err) {
    console.error('Fehler beim Speichern:', err)
  }
}
</script>
