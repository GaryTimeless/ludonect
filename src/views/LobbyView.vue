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
        <ion-button expand="block" color="medium" @click="testFirestoreWrite">
          🔌 Firestore-Verbindung testen
        </ion-button>
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
  import { db } from '@/firebaseConfig'
  import { doc, setDoc, updateDoc, arrayUnion, getDoc, onSnapshot, Timestamp } from 'firebase/firestore'

  const router = useRouter()

  function getRandomQuestion() {
    const index = Math.floor(Math.random() * questions.length)
    return questions[index]
  }

  function generatePlayerId() {
    return 'p_' + Math.random().toString(36).substring(2, 8)
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

  async function createRoom() {
    if (!playerName.value.trim()) { alert('Bitte gib einen Namen ein'); return; }
    const code = generateRoomCode()
    roomCode.value = code

    const player: Player = {
      id: generatePlayerId(),
      name: playerName.value ? `${playerName.value} (Host)` : 'Du (Host)',
      isHost: true
    }
    
    localStorage.setItem('userId', player.id)

    players.value = [player]

    const roomRef = doc(db, 'rooms', code)
    await setDoc(roomRef, {
      createdAt: Timestamp.now(),
      players: [player]
    })
    
    listenToRoom(code)
    console.log('[createRoom] Raum erstellt mit Code:', code)
  }
  
  async function joinRoom() {
    if (!playerName.value.trim()) { alert('Bitte gib einen Namen ein'); return; }
    const code = joinCode.value.toUpperCase()
    roomCode.value = code

    const player: Player = {
      id: generatePlayerId(),
      name: playerName.value || 'Du',
      isHost: false
    }
    
    localStorage.setItem('userId', player.id)

    const roomRef = doc(db, 'rooms', code)
    const roomSnap = await getDoc(roomRef)

    if (roomSnap.exists()) {
      await updateDoc(roomRef, {
        players: arrayUnion(player)
      })
      console.log('[joinRoom] Beigetreten zu Raum:', code)
    } else {
      alert('Raum existiert nicht!')
      console.warn('[joinRoom] Raum existiert nicht:', code)
    }
    
    listenToRoom(code)
  }
  
  function listenToRoom(code: string) {
    const roomRef = doc(db, 'rooms', code)
    onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        players.value = docSnap.data().players || []
        console.log('[listenToRoom] Spieler im Raum:', docSnap.data().players)
      }
    })
  }

  function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  }
  
  async function startGame() {
    const code = roomCode.value;
    if (!code) return;
    const gameRef = doc(db, 'games', code);

    await setDoc(gameRef, {
      createdAt: Timestamp.now(),
      phase: 'question',
      currentQuestion: null
    }, { merge: true });

    const freshSnap = await getDoc(doc(db, 'rooms', code))
    const currentPlayers = freshSnap.data()?.players || []

    for (const player of currentPlayers) {
      const playerRef = doc(db, 'games', code, 'players', player.id)
      await setDoc(playerRef, {
        name: player.name,
        score: 0
      })
    }

    const question = getRandomQuestion()
    console.log('[startGame] Frage gewählt:', question)

    await updateDoc(gameRef, {
      currentQuestion: question.id
    })

    window.open(`/question?gameId=${code}&id=${question.id}`, '_blank')
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

  async function testFirestoreWrite() {
    try {
      const testRef = doc(db, 'test', 'ping')
      await setDoc(testRef, {
        timestamp: Timestamp.now(),
        message: 'Testverbindung erfolgreich'
      })
      console.log('[Test] Firestore-Schreibvorgang erfolgreich.')
      alert('Testverbindung zu Firestore erfolgreich!')
    } catch (error) {
      console.error('[Test] Fehler beim Schreiben in Firestore:', error)
      alert('Fehler beim Testen der Firestore-Verbindung. Siehe Konsole für Details.')
    }
  }
  </script>