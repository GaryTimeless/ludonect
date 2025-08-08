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

          <!-- Test Realtime Button -->
          <ion-button expand="block" @click="testRealtime" color="warning">
            🧪 Test Realtime
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
import { supabase } from "@/supabaseClient";
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

type RoomCode = string;  // 4-stelliger Raumcode (z.B. "ABCD")

interface GameSession {
  id: RoomCode;         // Der Raumcode (z.B. "ABCD")
  host_id: string;      // ID des Host-Spielers
  state: string;        // Spielstatus: "waiting", "running", etc.
  players: Player[];    // Array der Spieler im Raum
  currentRound?: any;   // Aktuelle Runden-Daten
  [key: string]: any;   // Weitere Properties
}

const roomCode = ref("");
const joinCode = ref("");
const playerName = ref("");
const mode = ref<"start" | "create" | "join">("start");

const showStartGameButton = ref(false);
const playersInRoom = ref<Player[]>([]);
const currentPlayerId = ref(getStorage("playerId") || "");

// Polling für Spieler-Updates
let pollingInterval: NodeJS.Timeout | null = null;

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

  const { error } = await supabase.from("game_session").insert([
    {
      id: code,
      created_at: new Date(),
      updated_at: new Date(),
      phase_updated_at: new Date(),
      host_id: player.id,
      state: "waiting",
      used_question_ids: [],
      players: [
        {
          ...player,
          joinedAt: new Date(),
        },
      ],
    },
  ]);

  if (error) {
    console.error("[createRoom] Fehler beim Erstellen:", error);
    alert("Fehler beim Erstellen des Raums");
    return;
  }

  listenToRoom(code);
  listenToGame(code);
  console.log("[createRoom] Raum erstellt mit Code:", code);
}

async function joinRoom() {
  console.log("[joinRoom] Funktion gestartet");
  console.log("[joinRoom] playerName:", playerName.value);
  console.log("[joinRoom] roomCode:", roomCode.value);
  
  if (!playerName.value.trim()) {
    alert("Bitte gib einen Namen ein");
    return;
  }

  const code = joinCode.value.toUpperCase();
  console.log("[joinRoom] Normalisierter Code:", code);

  // 1. Spielsession abrufen
  console.log("[joinRoom] Versuche Raum abzurufen...");
  const { data: existingSession, error } = await supabase
    .from("game_session")
    .select("*")
    .eq("id", code)
    .single();

  console.log("[joinRoom] Supabase Response:", { data: existingSession, error });
  console.log("[joinRoom] Error Details:", error);

  if (error || !existingSession) {
    console.error("[joinRoom] Fehler beim Abrufen des Raums:", error);
    console.log("[joinRoom] existingSession:", existingSession);
    alert("Der Raum existiert nicht");
    return;
  }

  const newPlayer: Player = {
    id: generatePlayerId(),
    name: playerName.value,
    isHost: false,
  };
  console.log("[joinRoom] Neuer Spieler erstellt:", newPlayer);

  // 2. Spielerliste aktualisieren
  const updatedPlayers = [
    ...(existingSession.players || []),
    {
      ...newPlayer,
      joinedAt: new Date(),
    },
  ];
  console.log("[joinRoom] Aktualisierte Spielerliste:", updatedPlayers);

  console.log("[joinRoom] Versuche Spielerliste zu aktualisieren...");
  const { error: updateError } = await supabase
    .from("game_session")
    .update({
      players: updatedPlayers,
      updated_at: new Date(),
    })
    .eq("id", code);

  console.log("[joinRoom] Update Response:", { error: updateError });

  if (updateError) {
    console.error("[joinRoom] Fehler beim Update:", updateError);
    alert("Fehler beim Beitreten");
    return;
  }

  // 3. Lokale Speicherung & Listener aktivieren
  setStorage("playerId", newPlayer.id);
  currentPlayerId.value = newPlayer.id;

  if (!getStorage("playerName")) {
    setStorage("playerName", newPlayer.name);
    localPlayerName.value = newPlayer.name;
  }

  setStorage("isHost", "false");

  listenToRoom(code);
  listenToGame(code);
  
  // Manuelle UI-Aktualisierung
  playersInRoom.value = updatedPlayers;
  roomCode.value = code;
  
  console.log("[joinRoom] Spieler ist dem Raum beigetreten:", newPlayer);
  console.log("[joinRoom] UI aktualisiert - Spielerliste:", playersInRoom.value);
}

function listenToRoom(code: string) {
  console.log("[listenToRoom] Listener wird gestartet für Raum:", code);
  
  // Stoppe vorheriges Polling
  stopPolling();
  
  supabase
    .channel(`room-${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_session', filter: `id=eq.${code}` },
      (payload) => {
        console.log("[listenToRoom] Realtime Event empfangen:", payload);
        const data = payload.new as GameSession | null;
        console.log("[listenToRoom] Payload data:", data);
        if (data && data.players) {
          console.log("[listenToRoom] Alte Spielerliste:", playersInRoom.value);
          playersInRoom.value = data.players;
          console.log("[listenToRoom] Neue Spielerliste:", playersInRoom.value);
        } else {
          console.warn("[listenToRoom] Keine gültigen Daten:", data);
        }
      }
    )
    .subscribe((status) => {
      console.log("[listenToRoom] Subscription Status:", status);
      
      // Fallback: Wenn Realtime nicht funktioniert, starte Polling
      if (status === 'SUBSCRIBED') {
        console.log("[listenToRoom] Realtime erfolgreich verbunden");
        
        // Test: Sende ein Test-Event
        setTimeout(() => {
          console.log("[listenToRoom] Teste Realtime-Verbindung...");
          supabase
            .from("game_session")
            .update({ updated_at: new Date() })
            .eq("id", code);
        }, 1000);
        
      } else {
        console.warn("[listenToRoom] Realtime nicht verfügbar, starte Polling");
        startPolling(code);
      }
    });
}

function listenToGame(code: string) {
  console.log("[listenToGame] Listener wird gestartet für Raum:", code);
  let previousState: string | null = null;

  supabase
    .channel(`game-${code}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_session', filter: `id=eq.${code}` },
      (payload) => {
        console.log("[listenToGame] Realtime Event empfangen:", payload);
        const data = payload.new as GameSession | null;
        if (!data) {
          console.warn("[listenToGame] Session nicht gefunden!");
          showStartGameButton.value = false;
          return;
        }

        const playerId = currentPlayerId.value;
        const amIHost = data.host_id === playerId;

        showStartGameButton.value =
          amIHost &&
          Array.isArray(data.players) &&
          data.players.length >= 2 &&
          data.state === "waiting";

        if (previousState !== "running" && data.state === "running") {
          router.push(`/question/${code}/${data.currentRound?.questionId}`);
        }

        previousState = data.state;
      }
    )
    .subscribe();
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

// Polling-Funktion für Spieler-Updates
function startPolling(code: string) {
  console.log("[startPolling] Polling gestartet für Raum:", code);
  
  // Stoppe vorheriges Polling
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  pollingInterval = setInterval(async () => {
    try {
      const { data, error } = await supabase
        .from("game_session")
        .select("players, state")
        .eq("id", code)
        .single();
      
      if (error) {
        console.warn("[polling] Fehler beim Abrufen:", error);
        return;
      }
      
      if (data?.players) {
        console.log("[polling] Neue Spielerliste gefunden:", data.players);
        playersInRoom.value = data.players;
      }
      
      // Update Start-Button Status
      if (data?.state) {
        const playerId = currentPlayerId.value;
        const amIHost = data.players?.some((p: any) => p.id === playerId && p.isHost);
        
        showStartGameButton.value =
          amIHost &&
          Array.isArray(data.players) &&
          data.players.length >= 2 &&
          data.state === "waiting";
      }
      
    } catch (err) {
      console.error("[polling] Fehler:", err);
    }
  }, 2000); // Alle 2 Sekunden
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log("[stopPolling] Polling gestoppt");
  }
}

// Test Realtime Funktion
async function testRealtime() {
  console.log("🧪 [testRealtime] Button geklickt!");
  console.log("🧪 [testRealtime] Aktueller roomCode:", roomCode.value);
  
  if (!roomCode.value) {
    console.warn("[testRealtime] Kein Raumcode verfügbar");
    return;
  }
  
  // Erst prüfen, ob der Raum existiert
  console.log("🧪 [testRealtime] Prüfe ob Raum existiert...");
  const { data: existingRoom, error: checkError } = await supabase
    .from("game_session")
    .select("id")
    .eq("id", roomCode.value)
    .single();
  
  console.log("🧪 [testRealtime] Raum-Check:", { existingRoom, checkError });
  
  if (checkError || !existingRoom) {
    console.error("[testRealtime] Raum nicht gefunden:", roomCode.value);
    return;
  }
  
  try {
    // Sende ein Test-Update an die Datenbank (nur existierende Spalten)
    const { error } = await supabase
      .from("game_session")
      .update({ 
        updated_at: new Date()
      })
      .eq("id", roomCode.value);
    
    if (error) {
      console.error("[testRealtime] Fehler beim Update:", error);
    } else {
      console.log("🧪 [testRealtime] Test-Update gesendet!");
    }
  } catch (err) {
    console.error("[testRealtime] Fehler:", err);
  }
}

async function startGame() {
  const code = roomCode.value;
  console.log("[startGame] Aktueller roomCode:", code);

  if (!code) {
    console.warn("[startGame] Kein roomCode gefunden – Abbruch");
    return;
  }
// 1. Ohne Destructuring (länger) NUR UM ES ZU VESTEHEN
// const response = await supabase.from("game_sessions")...
// const sessionData = response.data;
// const fetchError = response.error;

  // 1. Spielsession aus Supabase abrufen
  const { data: sessionData, error: fetchError } = await supabase
    .from("game_session")
    .select("*")
    .eq("id", code)
    .single();

  if (fetchError || !sessionData) {
    alert("Raum existiert nicht!");
    console.warn("[startGame] Raum existiert nicht:", code);
    return;
  }

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

  // 2. Spielsession in Supabase aktualisieren
  const { error: updateError } = await supabase
    .from("game_session")
    .update({
      state: "running",
      used_question_ids: [...(sessionData.used_question_ids || []), question.id],
      current_round: {
        question_id: question.id,
        phase: "answering",
        answers: {},
        estimations: {},
      },
      phase_updated_at: new Date().toISOString(),
    })
    .eq("id", code);

  if (updateError) {
    console.error("[startGame] Fehler beim Aktualisieren:", updateError);
    alert("Fehler beim Starten des Spiels");
    return;
  }

  console.log(`[startGame] Navigiere zu: /question/${code}/${question.id}`);
  router.push(`/question/${code}/${question.id}`);
}
// just for orientation
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
