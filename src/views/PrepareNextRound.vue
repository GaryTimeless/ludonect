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
        <div style="text-align: center;">
          <img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYThkYjc4ZDI2MGYxYTMyM2UwZDcxN2RlZjBlOTZiYzZhZmZhMDhiMiZjdD1n/3o7TKxOHtSIVjvNQZq/giphy.gif"
               alt="Warten auf Host"
               style="max-width: 80%; height: auto; border-radius: 8px;" />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { doc, getFirestore, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useRoute } from "vue-router";
const db = getFirestore();
const router = useRouter();
const route = useRoute();
const gameId = ref<string>(route.params.gameId as string);
const currentRound = ref<any>({});

const players = ref<any[]>([]);
const localPlayerId = localStorage.getItem("playerId");
const isHost = computed(() => {
  const me = players.value.find(p => p.id === localPlayerId);
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
    "currentRound.estimations": {},
    "currentRound.estimationOrder": [],
    "currentRound.placedPlayers": [],
    "currentRound.sortingFinished": false,
    "currentRound.sortingStarted": false,
    "currentRound.secondTurnStartPlayer": false,
    "currentRound.phase": "answering",
    "currentRound.phaseUpdatedAt": serverTimestamp(),
    "currentRound.activePlayerId": null,
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
