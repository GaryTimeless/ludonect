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
          <ion-button expand="block" @click="mode = 'create'"
            >Neuen Raum erstellen</ion-button
          >
          <ion-button expand="block" @click="mode = 'join'"
            >Existierenden Raum beitreten</ion-button
          >
          <DBDelete />
        </template>

        <template v-else-if="mode === 'create'">
          <ion-item>
            <ion-label position="floating">Dein Name</ion-label>
            <ion-input v-model="playerName" :maxlength="20" />
          </ion-item>
          <ion-button expand="block" :disabled="!playerName" @click="createRoom"
            >Raum erstellen</ion-button
          >
          <ion-button expand="block" @click="mode = 'start'" color="medium"
            >Zurück</ion-button
          >
        </template>
        <template v-else-if="mode === 'join'">
          <ion-item>
            <ion-label position="floating">Raumcode eingeben</ion-label>
            <ion-input
              v-model="joinCode"
              :maxlength="4"
              @ionInput="onJoinCodeInput"
            />
          </ion-item>
          <ion-item>
            <ion-label position="floating">Dein Name</ion-label>
            <ion-input v-model="playerName" :maxlength="20" />
          </ion-item>
          <ion-button
            expand="block"
            :disabled="!joinCode || !playerName"
            @click="joinRoom"
            >Beitreten</ion-button
          >
          <ion-button expand="block" @click="mode = 'start'" color="medium"
            >Zurück</ion-button
          >
        </template>
      </div>

      <div v-else>
        <h2>
          Raumcode: <strong>{{ roomCode }}</strong>
        </h2>
        <p>Spieler (Du: {{ localPlayerName }}):</p>
        <ion-list>
          <ion-item v-for="player in playersInRoom" :key="player.id">
            <ion-label>
              {{ player.name }}
              <span v-if="player.id === currentPlayerId"> (Du)</span>
            </ion-label>
            <ion-icon slot="end" name="home" v-if="player.isHost"></ion-icon>
          </ion-item>
        </ion-list>
        <ion-button v-if="canStartGame" expand="block" @click="startGame">
          Spiel starten
        </ion-button>

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
  IonIcon,
  IonList,
} from "@ionic/vue";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import questions from "@/questions.json";
import { db } from "@/firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import FunButton from "@/components/FunButton.vue";
import DBDelete from "@/components/DBDelete.vue";

// Helper to abstract storage (fallback to sessionStorage if localStorage is unavailable)
function setStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    sessionStorage.setItem(key, value);
  }
}
function getStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return sessionStorage.getItem(key);
  }
}

const router = useRouter();

function getRandomQuestion() {
  const index = Math.floor(Math.random() * questions.length);
  return questions[index];
}

function generatePlayerId() {
  return "p_" + Math.random().toString(36).substring(2, 8);
}

interface Player {
  id: string;
  name: string;
  isHost: boolean;
}

const roomCode = ref("");
const joinCode = ref("");
const playerName = ref("");
const mode = ref<"start" | "create" | "join">("start");

const showStartGameButton = ref(false);
const playersInRoom = ref<Player[]>([]);
const currentPlayerId = ref(getStorage("playerId") || "");

// Local display name of this client
const localPlayerName = ref(getStorage("playerName") || "");
// True if the current client is the host
const isHost = computed(() =>
  playersInRoom.value.some((p) => p.id === currentPlayerId.value && p.isHost)
);
// Allow starting the game once the host and at least two players are in the lobby
const canStartGame = computed(
  () => isHost.value && playersInRoom.value.length >= 2
);

async function createRoom() {
  if (!playerName.value.trim()) {
    alert("Bitte gib einen Namen ein");
    return;
  }
  const code = generateRoomCode();
  roomCode.value = code;

  const player: Player = {
    id: generatePlayerId(),
    name: playerName.value ? `${playerName.value} (Host)` : "Du (Host)",
    isHost: true,
  };

  setStorage("playerId", player.id);
  currentPlayerId.value = player.id;
  if (!getStorage("playerName")) {
    setStorage("playerName", player.name);
    localPlayerName.value = player.name;
  }

  const sessionRef = doc(db, "gameSessions", code);
  await setDoc(sessionRef, {
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    phaseUpdatedAt: Timestamp.now(),
    hostId: player.id,
    state: "waiting",
    usedQuestionIds: [],
    players: [
      {
        ...player,
        joinedAt: Timestamp.now(),
      },
    ],
  });

  listenToRoom(code);
  listenToGame(code);
  console.log("[createRoom] Raum erstellt mit Code:", code);
}

async function joinRoom() {
  if (!playerName.value.trim()) {
    alert("Bitte gib einen Namen ein");
    return;
  }
  const code = joinCode.value.toUpperCase();
  roomCode.value = code;

  const player: Player = {
    id: generatePlayerId(),
    name: playerName.value || "Du",
    isHost: false,
  };

  setStorage("playerId", player.id);
  if (!getStorage("playerName")) {
    setStorage("playerName", player.name);
  }

  const sessionRef = doc(db, "gameSessions", code);
  const roomSnap = await getDoc(sessionRef);

  if (roomSnap.exists()) {
    await updateDoc(sessionRef, {
      updatedAt: Timestamp.now(),
      players: arrayUnion({
        ...player,
        joinedAt: Timestamp.now(),
      }),
    });
    console.log("[joinRoom] Beigetreten zu Raum:", code);
  } else {
    alert("Raum existiert nicht!");
    console.warn("[joinRoom] Raum existiert nicht:", code);
  }

  listenToRoom(code);
  listenToGame(code);
}

function listenToRoom(code: string) {
  const sessionRef = doc(db, "gameSessions", code);
  onSnapshot(sessionRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      playersInRoom.value = data.players || [];
      console.log("[listenToRoom] Spieler im Raum:", playersInRoom.value);
    }
  });
}

function listenToGame(code: string) {
  // Hör auf das Session-Dokument in gameSessions
  const sessionRef = doc(db, "gameSessions", code);
  onSnapshot(sessionRef, (snap) => {
    if (!snap.exists()) {
      console.warn("[listenToGame] Session existiert nicht!");
      showStartGameButton.value = false;
      return;
    }
    const data = snap.data();
    const playerId = currentPlayerId.value;
    const amIHost = data.hostId === playerId;
    // Button nur anzeigen, wenn ich Host bin, mindestens 2 Spieler da sind und state == 'waiting'
    showStartGameButton.value =
      amIHost &&
      Array.isArray(data.players) &&
      data.players.length >= 2 &&
      data.state === "waiting";
    // Nicht-Hosts direkt zur Frage weiterleiten, sobald state auf 'running' wechselt
    if (!amIHost && data.state === "running") {
      router.push(`/question/${code}/${data.currentRound.questionId}`);
    }
  });
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

async function startGame() {
  const code = roomCode.value;
  console.log("[startGame] Aktueller roomCode:", code);

  if (!code) {
    console.warn("[startGame] Kein roomCode gefunden – Abbruch");
    return;
  }

  const sessionRef = doc(db, "gameSessions", code);
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) {
    alert("Raum existiert nicht!");
    console.warn("[startGame] Raum existiert nicht:", code);
    return;
  }
  const sessionData = sessionSnap.data();
  const roomPlayers = sessionData.players || [];

  if (roomPlayers.length < 2) {
    alert(
      "Mindestens zwei Spieler sind erforderlich, um das Spiel zu starten."
    );
    return;
  }

  const playerId = localStorage.getItem("playerId");
  const currentPlayer = roomPlayers.find((p: any) => p.id === playerId);
  if (!currentPlayer?.isHost) {
    alert("Nur der Host kann das Spiel starten.");
    return;
  }

  const question = getRandomQuestion();
  console.log("[startGame] Gewählte Frage:", question);

  if (!question || typeof question.id !== "number") {
    console.error("[startGame] Ungültige oder fehlende Frage-ID:", question);
    alert("Fehler beim Starten des Spiels – ungültige Frage");
    return;
  }

  const gameRef = doc(db, "games", code);
  console.log("[startGame] Spiel wird angelegt unter ID:", code);

  await setDoc(gameRef, {
    createdAt: Timestamp.now(),
    state: "running",
    hostId: playerId,
    players: roomPlayers,
    usedQuestionIds: [question.id],
    currentRound: {
      questionId: question.id,
      phase: "answering",
      answers: {},
      estimationOrder: [],
      estimations: {},
      points: {},
    },
    totalScores: Object.fromEntries(roomPlayers.map((p: any) => [p.id, 0])),
  });

  console.log(`[startGame] Navigiere zu: /question/${code}/${question.id}`);
  router.push(`/question/${code}/${question.id}`);
}

function onJoinCodeInput(event: any) {
  joinCode.value = event.target.value.toUpperCase();
}
</script>
