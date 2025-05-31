<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Reveal Answers</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-item v-for="player in sortedPlayers" :key="player.id">
          <ion-label>
            <h2>{{ player.name }}</h2>
            <p>Answer: {{ player.answer }}</p>
            <p v-if="player.points !== undefined">Points: {{ player.points }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
      <ion-button expand="full" @click="goToNextRound">Next Round</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { doc, onSnapshot, updateDoc, getFirestore } from 'firebase/firestore'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton
} from '@ionic/vue'

interface Player {
  id: string
  name: string
  points?: number
}
interface SortedPlayer extends Player {
  answer: number | null
}

const db = getFirestore()
const route = useRoute()
const router = useRouter()
const gameId = route.params.gameId as string
const questionId = Number(route.params.questionId)
const gameRef = doc(db, 'gameSessions', gameId)

const players = ref<Player[]>([])
const sortedPlayers = ref<SortedPlayer[]>([])

onMounted(() => {
  onSnapshot(gameRef, (snapshot) => {
    if (!snapshot.exists()) return
    const data = snapshot.data() as any
    // Pull players array from currentRound
    players.value = data.currentRound?.players || []
    // Merge in each player's answer and sort
    const answersMap = data.currentRound?.answers || {}
    sortedPlayers.value = players.value.map(p => ({
      ...p,
      answer: answersMap[p.id]?.answerValue ?? null,
      points: p.points
    })).sort((a, b) => (a.answer ?? 0) - (b.answer ?? 0))
  })
})

async function goToNextRound() {
  await updateDoc(gameRef, {
    'currentRound.estimations.phase': 'answering',
    'currentRound.estimations.questionId': questionId + 1,
    'currentRound.sortingStarted': false,
    'currentRound.sortingFinished': false,
    'currentRound.answers': {},
    'currentRound.placedPlayers': []
  })
  router.push(`/game/${gameId}/${questionId + 1}`)
}
</script>