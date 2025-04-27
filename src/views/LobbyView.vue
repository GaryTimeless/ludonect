<template>
    <ion-page>
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Ludonect Lobby</ion-title>
        </ion-toolbar>
      </ion-header>
  
      <ion-content class="ion-padding">
        <div v-if="!roomCode">
          <template v-if="mode === 'start'">
            <ion-button expand="block" @click="mode = 'create'">Neuen Raum erstellen</ion-button>
            <ion-button expand="block" @click="mode = 'join'">Existierenden Raum beitreten</ion-button>
            <ion-button expand="block" color="danger" @click="resetDatabase">
            🔥 Datenbank zurücksetzen
          </ion-button>
          </template>
  
          <template v-else-if="mode === 'create'">
            <ion-item>
              <ion-label position="floating">Dein Name</ion-label>
              <ion-input v-model="playerName" :maxlength="20" />
            </ion-item>
            <ion-button expand="block" :disabled="!playerName" @click="createRoom">Raum erstellen</ion-button>
            <ion-button expand="block" @click="mode = 'start'" color="medium">Zurück</ion-button>
          </template>
          <template v-else-if="mode === 'join'">
            <ion-item>
              <ion-label position="floating">Raumcode eingeben</ion-label>
              <ion-input v-model="joinCode" :maxlength="4" @ionInput="onJoinCodeInput" />
            </ion-item>
            <ion-item>
              <ion-label position="floating">Dein Name</ion-label>
              <ion-input v-model="playerName" :maxlength="20" />
            </ion-item>
            <ion-button expand="block" :disabled="!joinCode || !playerName" @click="joinRoom">Beitreten</ion-button>
            <ion-button expand="block" @click="mode = 'start'" color="medium">Zurück</ion-button>

          

          </template>
        </div>
  
        <div v-else>
          <h2>Raumcode: <strong>{{ roomCode }}</strong></h2>
          <p>Spieler:</p>
          <ion-list>
            <ion-item v-for="player in players" :key="player.id">
              {{ player.name }}
            </ion-item>
          </ion-list>
          <ion-button v-if="isLocalPlayerHost" expand="block" :disabled="!canStartGame" @click="startGame">
            Spiel starten
          </ion-button>
          <ion-button expand="block" @click="addBot">Bot hinzufügen</ion-button>
          
          <FunButton />
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
  import { db } from '@/firebaseConfig'
  import { doc, setDoc, updateDoc, arrayUnion, getDoc, onSnapshot, Timestamp } from 'firebase/firestore'
  import FunButton from '@/components/FunButton.vue';
  import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

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
  const mode = ref<'start' | 'create' | 'join'>('start');

  const canStartGame = computed(() => players.value.length >= 2)

  const isLocalPlayerHost = computed(() => {
    const playerId = localStorage.getItem('playerId');
    const currentPlayer = players.value.find(p => p.id === playerId);
    return currentPlayer?.isHost || false;
  });

  async function createRoom() {
    if (!playerName.value.trim()) { alert('Bitte gib einen Namen ein'); return; }
    const code = generateRoomCode()
    roomCode.value = code

    const player: Player = {
      id: generatePlayerId(),
      name: playerName.value ? `${playerName.value} (Host)` : 'Du (Host)',
      isHost: true
    }
    
    
    localStorage.setItem('playerId', player.id);

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
    
    
    localStorage.setItem('playerId', player.id);

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
    listenToGame(code)
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

  function listenToGame(code: string) {
    const gameRef = doc(db, 'games', code)
    onSnapshot(gameRef, (docSnap) => {
      console.log('%clistenToGame: Neue Snapshot-Aktualisierung', 'color: cyan; font-weight: bold;');
      console.log('[listenToGame] Snapshot Inhalt:', docSnap.data());

      if (!docSnap.exists()) {
        console.warn('%clistenToGame: Dokument existiert nicht!', 'color: orange; font-weight: bold;');
        return;
      }

      const data = docSnap.data();
      console.log('[listenToGame] Daten empfangen:', data);

      const playerId = localStorage.getItem('playerId');
      const isHost = players.value.find(p => p.id === playerId)?.isHost;
      console.log('[listenToGame] Spieler-ID:', playerId, '| Host:', isHost);

      if (!isHost) {
        console.log('%c[listenToGame] Weiterleitung zu Frage...', 'color: green; font-weight: bold;', `/question/${code}/${data.currentQuestion}`);
        router.push(`/question/${code}/${data.currentQuestion}`);
      } else {
        console.log('%c[listenToGame] Host bleibt auf aktueller Seite.', 'color: grey; font-style: italic;');
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
    console.log('[startGame] Aktueller roomCode:', code);

    if (!code) {
      console.warn('[startGame] Kein roomCode gefunden – Abbruch');
      return;
    }

    const question = getRandomQuestion();
    console.log('[startGame] Gewählte Frage:', question);

    if (!question || typeof question.id !== 'number') {
      console.error('[startGame] Ungültige oder fehlende Frage-ID:', question);
      alert('Fehler beim Starten des Spiels – ungültige Frage');
      return;
    }

    const gameRef = doc(db, 'games', code);
    console.log('[startGame] Spiel wird angelegt unter ID:', code);

    await setDoc(gameRef, {
      createdAt: Timestamp.now(),
      phase: 'question',
      currentQuestion: question.id
    });

    console.log(`[startGame] Navigiere zu: /question/${code}/${question.id}`);
    router.push(`/question/${code}/${question.id}`);
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

  async function resetDatabase() {
    if (!confirm("Willst du wirklich alle Spiele und Räume löschen? Das kann nicht rückgängig gemacht werden!")) {
      return;
    }

    const db = getFirestore();

    try {
      const gamesSnapshot = await getDocs(collection(db, 'games'));
      for (const docSnap of gamesSnapshot.docs) {
        await deleteDoc(doc(db, 'games', docSnap.id));
      }

      const roomsSnapshot = await getDocs(collection(db, 'rooms'));
      for (const docSnap of roomsSnapshot.docs) {
        await deleteDoc(doc(db, 'rooms', docSnap.id));
      }

      alert('Alle Spiele und Räume wurden erfolgreich gelöscht.');
      console.log('Reset der Datenbank abgeschlossen.');
    } catch (error) {
      console.error('Fehler beim Löschen:', error);
      alert('Fehler beim Löschen der Daten. Details in der Konsole.');
    }
  }
  </script>