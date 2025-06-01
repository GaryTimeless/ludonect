<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Vorbereitung nächste Runde</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="p-4" v-if="isHost">
        <h2 class="text-lg font-bold mb-2">
          Aktueller Spielstand (currentRound)
        </h2>
        <pre>{{ currentRound }}</pre>
        <div class="p-4">
          <h2 class="text-lg font-bold mb-2">Spieler in der Runde</h2>
          <ul class="list-disc list-inside space-y-2">
            <li v-for="player in players" :key="player.id">
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h3 class="text-lg font-semibold text-gray-800 mb-1">
                  {{ player.name }}
                </h3>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>ID:</strong> {{ player.id }}
                </p>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>Host:</strong>
                  <span v-if="player.isHost">Ja 👑</span>
                  <span v-else>Nein</span>
                </p>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>Schätzung:</strong>
                  <span v-if="player.estimation">✅ Abgegeben</span>
                  <span v-else>❌ Offen</span>
                </p>
                <p class="text-sm text-gray-600 mb-1">
                  <strong>joinDate:</strong>
                  <span> {{ player.joinedAt }}</span>
                </p>
              </div>
            </li>
          </ul>
        </div>

        <ion-button expand="block" @click="UploadData">
          🧹 UploadData
        </ion-button>
        <ion-button expand="block" @click="resetCurrentRound">
          🧹 currentRound bereinigen
        </ion-button>
        <ion-button expand="block" color="secondary" @click="startNextRound">
          ➕ Neue Frage laden
        </ion-button>
        <ion-button expand="block" color="tertiary" @click="goToGameView">
          ▶️ Weiter zur nächsten Spielrunde
        </ion-button>
      </div>
      <div class="p-4" v-else>
        <h2 class="text-lg font-bold mb-2 text-center">
          🕒 Warte auf den Host...
        </h2>
        <p class="text-center mb-4">Der Host bereitet die nächste Runde vor.</p>
        <div style="text-align: center">
          <img
            src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYThkYjc4ZDI2MGYxYTMyM2UwZDcxN2RlZjBlOTZiYzZhZmZhMDhiMiZjdD1n/3o7TKxOHtSIVjvNQZq/giphy.gif"
            alt="Warten auf Host"
            style="max-width: 80%; height: auto; border-radius: 8px"
          />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  doc,
  getFirestore,
  getDoc,
  updateDoc,
  serverTimestamp,
  deleteField,
} from "firebase/firestore";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
} from "@ionic/vue";
const db = getFirestore();
const router = useRouter();
const route = useRoute();
const gameId = ref<string>(route.params.gameId as string);
const currentRound = ref<any>({});

const players = ref<any[]>([]);
const localPlayerId = localStorage.getItem("playerId");
const isHost = computed(() => {
  const me = players.value.find((p) => p.id === localPlayerId);
  return me?.isHost || false;
});

onMounted(async () => {
  const roomRef = doc(db, "gameSessions", gameId.value);
  const snap = await getDoc(roomRef);
  currentRound.value = snap.data()?.currentRound || {};
  players.value = snap.data()?.players || [];
  gameId.value = route.params.gameId as string;
});

const resetCurrentRound = async () => {
  const roomRef = doc(db, "gameSessions", gameId.value);
  await updateDoc(roomRef, {
    "currentRound.answers": {},
    "currentRound.estimationOrder": [],
    "currentRound.placedPlayers": [],
    "currentRound.sortingFinished": false,
    "currentRound.sortingStarted": false,
    "currentRound.secondTurnStartPlayer": false,
    // "currentRound.phase": "answering",
  });
  console.log("[PREPAIRE 01]currentRound wurde bereinigt.");
  console.log("[PREPAIRE 02]currentRound.answers wurde bereinigt.");
  console.log("[PREPAIRE 03]currentRound.estimationOrder wurde bereinigt.");
  console.log("[PREPAIRE 04]currentRound.placedPlayers wurde bereinigt.");
  console.log("[PREPAIRE 05]currentRound.sortingFinished wurde bereinigt.");
  console.log("[PREPAIRE 06]currentRound.sortingStarted wurde bereinigt.");
  console.log("[PREPAIRE 07]currentRound.secondTurnStartPlayer wurde bereinigt.");
  console.log("[PREPAIRE 08]currentRound.phase wurde bereinigt.");

  const docSnap = await getDoc(roomRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const players = data.players || [];

    const updatedPlayers = players.map((player: any) => ({
      ...player,
      estimation: false, // oder `undefined` wenn du das Feld komplett loswerden willst
    }));

    await updateDoc(roomRef, {
      players: updatedPlayers,
    });

    console.log("[PREPAIRE 09] players[] wurde aktualisiert (estimation auf false gesetzt).");
  }

  alert("currentRound wurde bereinigt.");
};

const UploadData = async () => {
  const roomRef = doc(db, "gameSessions", gameId.value);
  await updateDoc(roomRef, {
    // "currentRound.answers": {},
    // "currentRound.estimations": {},
    "currentRound.estimationOrder": [],
    // "currentRound.placedPlayers": [],
    // "currentRound.sortingFinished": false,
    // "currentRound.sortingStarted": false,
    // "currentRound.secondTurnStartPlayer": false,
    // "currentRound.phase": "answering",
    // "currentRound.phaseUpdatedAt": serverTimestamp(),
    // "players.estiation": false
  });
  alert("currentRound wurde bereinigt.");
};

const startNextRound = async () => {
  //   const roomRef = doc(db, "gameSessions", gameId.value);
  //   const snap = await getDoc(roomRef);
  //   const data = snap.data();
  //   const used = data?.usedQuestionIds || [];
  //   const allQuestions = [...]; // z.B. importierte Fragebank
  //     const unused = allQuestions.filter((q) => !used.includes(q.id));
  //    if (unused.length === 0) return alert("Keine Fragen mehr verfügbar.");
  //   const newQuestion = unused[Math.floor(Math.random() * unused.length)];
  //   await updateDoc(roomRef, {
  //     "currentRound.questionId": newQuestion.id,
  //     usedQuestionIds: [...used, newQuestion.id],
  //   });
  //   alert("Neue Frage gesetzt: " + newQuestion.id);
};

const goToGameView = () => {
  router.push("/Frage"); // oder wie deine nächste Spielseite heißt
};
</script>
