

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

<script setup>
import { ref, onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonButton
} from '@ionic/vue'

import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'

const db = getFirestore()
// const gameId = 'test-room'
const players = ref([])
const sortedPlayers = ref([])

async function loadAnswers() {
  const snapshot = await getDocs(collection(db, 'games', gameId, 'players'))
  players.value = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  // Sort by actual answer (ascending)
  sortedPlayers.value = [...players.value].sort((a, b) => a.answer - b.answer)
}

function goToNextRound() {
  const gameRef = doc(db, 'games', gameId)
  updateDoc(gameRef, { phase: 'question' }) // Trigger next question phase
}

onMounted(() => {
  loadAnswers()
})
</script>