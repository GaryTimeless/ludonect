<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Estimate the Order</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div style="padding: 16px; text-align: center;">
        <p>Hier würde später das Reordering passieren.</p>
      </div>

      <!-- Anzeige der Spieler Namen -->
      <div v-if="players.length > 0" style="padding: 16px;">
        <h3>Spieler:</h3>
        <ion-reorder-group disabled="false">
          <ion-item v-for="(player, index) in players" :key="player.id" :class="{'reordered': index === players.indexOf(player)}">
            <ion-label>{{ player.name }}</ion-label>
            <ion-reorder slot="end"></ion-reorder>
          </ion-item>
        </ion-reorder-group>
      </div>

      <!-- Anzeige der Anzahl der Spieler -->
      <ion-text class="info-text" color="medium">
        {{ playerCount }} / {{ players.length }} estimations received
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
} from "@ionic/vue";

import {
  getFirestore,
  doc,
  getDoc,
} from "firebase/firestore";

const db = getFirestore();
const route = useRoute();
const gameId = ref(null);
const playerCount = ref(0);
const players = ref([]);

onMounted(async () => {
  // Spiel-ID aus den Route-Parametern holen
  gameId.value = route.params.gameId;
  console.log("[EstimationView] gameId gesetzt:", gameId.value);

  try {
    // Abfrage des Room-Dokuments der entsprechenden roomId
    const roomRef = doc(db, `rooms/${gameId.value}`);
    const docSnap = await getDoc(roomRef);
    console.log("[EstimationView] Dokument-Daten:", docSnap.data());

    if (docSnap.exists()) {
      // Spieler aus dem players-Array holen
      const playersData = docSnap.data().players;
      players.value = playersData || [];
      playerCount.value = players.value.length;
      console.log("[EstimationView] Spieler geladen:", players.value);
    } else {
      console.error("[EstimationView] Room-Dokument nicht gefunden.");
    }
  } catch (error) {
    console.error("[EstimationView] Fehler beim Abrufen der Spieler:", error);
  }
});
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
