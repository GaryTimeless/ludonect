<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Estimate the Order</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        <ion-reorder-group @ionItemReorder="handleReorder" :disabled="false">
          <ion-item v-for="player in players" :key="player.id">
            <ion-label>{{ player.name }}</ion-label>
            <ion-reorder slot="end"></ion-reorder>
          </ion-item>
        </ion-reorder-group>
      </ion-list>
      <ion-text class="info-text" color="medium">
        {{ estimationsCount }} / {{ players.length }} estimations received
      </ion-text>
      <ion-button expand="full" @click="submitEstimation">Submit Order</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonReorderGroup, IonReorder, IonButton
} from '@ionic/vue'

import { getFirestore, collection, getDocs, doc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore'

const db = getFirestore()
const players = ref([])
const estimationsCount = ref(0)

// Replace this with dynamic game ID logic later
const gameId = 'test-room'

async function loadPlayers() {
  const snapshot = await getDocs(collection(db, 'games', gameId, 'players'))
  players.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

onMounted(() => {
  loadPlayers()
  watch(players, (newPlayers) => {
    if (newPlayers.length > 0) {
      watchEstimationProgress()
    }
  })
})

function watchEstimationProgress() {
  const estimationRef = collection(db, 'games', gameId, 'estimations')
  const gameDocRef = doc(db, 'games', gameId)

  onSnapshot(estimationRef, async (snapshot) => {
    estimationsCount.value = snapshot.size
    if (snapshot.size === players.value.length) {
      console.log('All estimations received! Advancing to reveal phase...')
      await updateDoc(gameDocRef, { phase: 'reveal' })
    }
  })
}

function handleReorder(event) {
  const from = event.detail.from
  const to = event.detail.to
  const movedItem = players.value.splice(from, 1)[0]
  players.value.splice(to, 0, movedItem)
  event.detail.complete()
}

async function submitEstimation() {
  const userId = localStorage.getItem('userId')
  if (!userId) {
    console.error('No userId found in localStorage')
    return
  }

  const estimationRef = collection(db, 'games', gameId, 'estimations')
  await setDoc(doc(estimationRef, userId), {
    order: players.value.map(p => p.id),
    timestamp: Date.now()
  })

  console.log('Estimation submitted:', players.value.map(p => p.id))
}
</script>

<style scoped>
ion-reorder-group {
  margin-bottom: 16px;
}
.info-text {
  display: block;
  text-align: center;
  margin: 12px 0;
  font-size: 16px;
}
</style>
