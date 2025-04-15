<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Ludonect Lobby</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <div v-if="!roomCode">
          <ion-button expand="block" @click="createRoom">Neuen Raum erstellen</ion-button>
          <ion-item>
            <ion-label position="floating">Raumcode eingeben</ion-label>
            <ion-input v-model="joinCode" maxlength="4" @ionInput="onJoinCodeInput" />
          </ion-item>
          <ion-item>
            <ion-label position="floating">Dein Name</ion-label>
            <ion-input v-model="playerName" maxlength="20" />
          </ion-item>
          <ion-button expand="block" :disabled="!joinCode || !playerName" @click="joinRoom">Beitreten</ion-button>
        </div>
  
        <div v-else>
          <h2>Raumcode: <strong>{{ roomCode }}</strong></h2>
          <p>Spieler:</p>
          <ion-list>
            <ion-item v-for="player in players" :key="player.id">
              {{ player.name }}
            </ion-item>
          </ion-list>
          <ion-button expand="block" :disabled="!canStartGame" @click="startGame">Spiel starten</ion-button>
          <ion-button expand="block" @click="addBot">Bot hinzufügen</ion-button>
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
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonList
  } from '@ionic/vue'
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import questions from '@/questions.json'

  const router = useRouter()

  function getRandomQuestion() {
    const index = Math.floor(Math.random() * questions.length)
    return questions[index]
  }

  interface Player {
    id: string
    name: string
    isHost: boolean
  }
  
  const roomCode = ref('')
  const joinCode = ref('')
  const playerName = ref('')
  const players = ref<Player[]>([])
  
  const canStartGame = computed(() => players.value.length >= 2)

  function createRoom() {
    roomCode.value = generateRoomCode()
    players.value = [{
      id: crypto.randomUUID(),
      name: playerName.value ? `${playerName.value} (Host)` : 'Du (Host)',
      isHost: true
    }]
  }
  
  function joinRoom() {
    roomCode.value = joinCode.value.toUpperCase()
    players.value = [{
      id: crypto.randomUUID(),
      name: playerName.value || 'Du',
      isHost: false
    }]
  }
  
  function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }
  
  function startGame() {
    const question = getRandomQuestion()
    router.push({ name: 'question', query: { text: question.text, min: question.min, max: question.max } })
  }

  function addBot() {
    const botId = `npc-${players.value.length}`
    players.value.push({
      id: botId,
      name: `Bot ${players.value.length}`,
      isHost: false
    })
  }

  function onJoinCodeInput(event: any) {
    joinCode.value = event.target.value.toUpperCase()
  }
  </script>