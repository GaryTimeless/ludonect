<!-- TODO Dark Mode funktioniert nicht sauber -->
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Ludonect Lobby</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="lobby-header">
        <img
          src="@/assets/ludonect_combo.png"
          alt="Ludonect Logo"
          class="ludonect-logo"
        />
        <!-- <p> play.connect.grow</p> -->
      </div>
      <!-- ------------- -->
      <!-- Play Buttons  -->
      <!-- ------------- -->
      <div v-if="!roomCode">
        <template v-if="mode === 'start'">
          <div class="lobby-buttons">
            <ion-button expand="block" @click="mode = 'create'">
              Neuen Raum erstellen
            </ion-button>
            <ion-button expand="block" @click="mode = 'join'">
              Trete Raum bei
            </ion-button>
          </div>
          <!-- -------------- -->
          <!-- How to Play    -->
          <!-- -------------- -->
          <ion-button
            expand="block"
            fill="outline"
            size="small"
            color="medium"
            @click="showHowToPlay = !showHowToPlay"
            style="margin-bottom: 10px"
          >
            {{ showHowToPlay ? "Weniger anzeigen" : "How to Play" }}
          </ion-button>
          <transition name="fade">
            <div v-if="showHowToPlay">
              <div class="how-to-play">
                <strong>So funktioniert Ludonect:</strong>

                <ol>
                  <li>Raum erstellen oder beitreten</li>
                  <li>
                    Jede*r beantwortet eine Frage geheim<br />
                    <small
                      >(Einigt euch grob, wie die Frage zu verstehen
                      ist.)</small
                    >
                  </li>
                  <li>
                    Schätzt ein, wie die Antworten der Gruppe zueinander passen
                  </li>
                  <li>Antworten werden aufgedeckt und gemeinsam besprochen</li>
                  <li>Nächste Runde!</li>
                </ol>

                <div class="example-questions">
                  <div><strong>Beispiel-Fragen:</strong></div>
                  <ul>
                    <li>
                      Wie oft schaust du Dokus?<br />
                      <span class="example-scale"
                        >0 = gar nicht | 100 = lieber als alles andere</span
                      >
                    </li>
                    <li>
                      Wie spontan bist du?<br />
                      <span class="example-scale"
                        >0 = gar nicht | 100 = Wer hat Bock auf ein Eis?</span
                      >
                    </li>
                    <li>
                      Wie gerne würdest du für einen Tag unsichtbar sein?<br />
                      <span class="example-scale"
                        >0 = gar nicht | 100 = muhahahaha</span
                      >
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </transition>
          <!-- -------------- -->
          <!-- Admin Options  -->
          <!-- -------------- -->
          <div style="margin-top: 32px; text-align: center">
            <ion-button
              expand="block"
              fill="outline"
              size="small"
              color="medium"
              @click="showAdvanced = !showAdvanced"
              style="margin-bottom: 10px"
            >
              {{ showAdvanced ? "Weniger anzeigen" : "Admin Options" }}
            </ion-button>
            <transition name="fade">
              <div v-if="showAdvanced">
                <DBDelete style="width: 60%; margin: 16px auto" />
                <LocalStorageDelete style="width: 60%; margin: 0 auto" />
              </div>
            </transition>
          </div>
        </template>
        <!-- --------------- -->
        <!-- Raum erstellen  -->
        <!-- --------------- -->
        <template v-else-if="mode === 'create'">
          <div class="lobby-room-wrapper">
            <ion-item>
              <ion-label position="floating">Dein Name</ion-label>
              <ion-input v-model="playerName" :maxlength="20" />
            </ion-item>
            <ion-button
              expand="block"
              :disabled="!playerName"
              @click="createRoom"
              >Raum erstellen</ion-button
            >
            <ion-button
              expand="block"
              @click="mode = 'start'"
              color="medium"
              class="inner-button"
              >Zurück</ion-button
            >
          </div>
        </template>
        <!-- ---------- -->
        <!-- Join Room  -->
        <!-- ---------- -->
        <template v-else-if="mode === 'join'">
          <div class="lobby-room-wrapper">
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
            <ion-button
              expand="block"
              @click="mode = 'start'"
              color="medium"
              class="inner-button"
              >Zurück</ion-button
            >
          </div>
        </template>
      </div>
      <!-- ----------------------------- -->
      <!-- After Login / echte Lobby  -->
      <!-- ----------------------------- -->
      <div v-else>
        <div class="lobby-room-wrapper">
          <h2 class="room-code">
            Raumcode: <strong>{{ roomCode }}</strong>
          </h2>
          <p class="player-label">Spieler (Du: {{ localPlayerName }}):</p>
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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
const showAdvanced = ref(false);
const showHowToPlay = ref(false);
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
import LocalStorageDelete from "@/components/localStorageDelete.vue";

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
  setStorage("isHost", "true");

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
  // State of the session from the previous snapshot
  let previousState: string | null = null;
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
    // Zeige Start-Button nur in Lobby (waiting) bei Host mit >=2 Spielern
    showStartGameButton.value =
      amIHost &&
      Array.isArray(data.players) &&
      data.players.length >= 2 &&
      data.state === "waiting";
    // Navigiere zur Frage nur beim Übergang auf 'running'
    if (previousState !== "running" && data.state === "running") {
      router.push(`/question/${code}/${data.currentRound.questionId}`);
    }
    previousState = data.state;
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

  // use the previously declared sessionRef
  await updateDoc(sessionRef, {
    state: "running",
    usedQuestionIds: arrayUnion(question.id),
    currentRound: {
      questionId: question.id,
      phase: "answering",
      answers: {},
      estimations: {},
    },
    phaseUpdatedAt: Timestamp.now(),
  });

  console.log(`[startGame] Navigiere zu: /question/${code}/${question.id}`);
  router.push(`/question/${code}/${question.id}`);
}

function onJoinCodeInput(event: any) {
  joinCode.value = event.target.value.toUpperCase();
}
</script>
<style scoped>
.lobby-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32px;
  margin-bottom: 40px;
}

.ludonect-logo {
  width: 320px;
  max-width: 92vw;
  margin-bottom: 0;
}

ion-content {
  --background: var(--ion-background-color, #edffcc);
}

.lobby-buttons {
  width: 100%;
  max-width: 250px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 32px;
}

ion-button {
  --background: #59981a;
  --color: #edffcc;
  --border-radius: 18px;
  --box-shadow: none;
  --border-width: 0;
  width: 100%;
  min-height: 40px;
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.01em;
  padding: 0;
  margin: 0;
  transition: transform 0.08s;
  font-family: "Tenor Sans", Arial, sans-serif;
}

ion-button[color="medium"] {
  --background: #91a095; /* Ein sanftes, modernes Grau-Grün */
  --color: #fff;
}

ion-button:active {
  transform: scale(0.97);
}

@media (max-width: 150px) {
  .lobby-buttons {
    max-width: 90vw;
  }
  ion-button {
    font-size: 0.93rem;
    min-height: 36px;
    --border-radius: 18px;
  }
}

ion-item {
  --background: transparent;
  --color: #385028;
  font-size: 1.08rem;
  margin-bottom: 18px;
  margin-top: 18px;
  --border-radius: 18px;
  /* Für mehr Luft oben/unten am Input: */
  padding-top: 8px;
  padding-bottom: 6px;
}

ion-input {
  --color: #385028;
  padding-top: 10px !important;
  font-size: 1.1rem;
}
ion-label {
  font-size: 1.05rem; /* Etwas größer */
  padding-bottom: 6px;
  padding-left: 2px;
  color: #385028;
}

p {
  font-family: "Tenor Sans", Arial, sans-serif;
  color: #385028;
}

.inner-button {
  margin-top: 14px;
}
ion-toolbar {
  --background: #59981a;
  --color: #edffcc;
  --min-height: 54px;
  --padding-start: 0;
  --padding-end: 0;
  box-shadow: none;
  border-bottom: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: "Tenor Sans", Arial, sans-serif;
}

ion-title {
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  color: #edffcc;
  text-align: center;
  letter-spacing: 0.01em;
  padding: 0;
  margin: 0;
}

/* Optional: Abstand zum oberen Bildschirmrand auf Mobilgeräten */
ion-header {
  margin-bottom: 8px;
}

body {
  font-family: "Tenor Sans", Arial, sans-serif;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (prefers-color-scheme: dark) {
  :root {
    --ion-background-color: #edffcc !important;
    --ion-toolbar-background: #59981a !important;
    --ion-color-primary: #59981a !important;
    --ion-color-primary-contrast: #edffcc !important;
    --ion-color-medium: #91a095 !important;
    /* Alle weiteren Farben */
  }

  body,
  ion-content,
  ion-toolbar,
  .lobby-header,
  .ludonect-logo {
    background: #edffcc !important;
    color: #385028 !important;
  }
}

.how-to-play {
  background: #f9ffe6; /* etwas heller als dein Hauptgrün */
  border-radius: 18px;
  padding: 18px 16px;
  margin: 16px auto 18px auto;
  box-shadow: 0 2px 10px 0 #d3e9b6a0; /* zarter Schatten */
  max-width: 400px;
  font-family: "Tenor Sans", Arial, sans-serif;
  color: #385028 !important;
}
.how-to-play strong,
.how-to-play ol,
.how-to-play ul,
.how-to-play li,
.how-to-play div,
.how-to-play span,
.how-to-play small {
  color: #385028 !important;
}
.how-to-play .example-scale {
  color: #91a095 !important;
}
.how-to-play ol {
  margin: 8px 0 14px 18px;
  padding: 0;
}
.how-to-play li {
  margin-bottom: 8px;
  line-height: 1.5;
}
.how-to-play .example-questions ul {
  margin-left: 0;
  padding-left: 18px;
}
.example-scale {
  font-size: 0.96em;
  color: #91a095;
  display: block;
  margin-top: 2px;
}

ion-list {
  background: #f9ffe6;
  border-radius: 18px;
  box-shadow: 0 2px 10px 0 #d3e9b6a0;
  padding: 16px 0;
  margin-bottom: 18px;
  margin-top: 16px;
}

ion-item {
  --background: transparent;
  --color: #385028;
  font-size: 1.08rem;
  border-bottom: 1px solid #d3e9b6a0;
  /* Kein margin, das Ion-List regelt den Rahmen */
}

.room-code {
  color: #59981a;
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.player-label {
  color: #385028;
  font-size: 1.08rem;
  margin-bottom: 0;
}
.lobby-room-wrapper {
  max-width: 500px;
  margin: 0 auto;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
</style>
