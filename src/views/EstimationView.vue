<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Estimate the Order</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div style="padding: 16px; text-align: center">
        <p>Hier würde später das Reordering passieren.</p>
      </div>

      <!-- Anzeige der Spieler Namen -->
      <div v-if="players.length > 0" style="padding: 16px">
        <h3>Spieler:</h3>
        <VueDraggable v-model="players" item-key="id" @update="onListUpdated">
          <ion-item v-for="player in players" :key="player.id">
            <ion-label>{{ player.name }}</ion-label>
          </ion-item>
        </VueDraggable>
      </div>

      <!-- Submit Button zum Speichern der Änderungen -->
      <ion-button expand="full" @click="submitReorder"
        >Reihenfolge Speichern</ion-button
      >
      <ion-button expand="full" @click="reloadPlayers"
        >Daten neu laden</ion-button
      >

      <!-- Anzeige der Anzahl der Spieler -->
      <ion-text class="info-text" color="medium">
        {{ playerCount }} / {{ players.length }} estimations received
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  
  IonItem,
  IonLabel,
  
} from "@ionic/vue";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";
import { VueDraggable } from "vue-draggable-plus";


const db = getFirestore();
const route = useRoute();
const gameId = ref(null);
const playerCount = ref(0);
const players = ref([]);

onMounted(async () => {
  gameId.value = route.params.gameId;

  try {
    const roomRef = doc(db, `rooms/${gameId.value}`);
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      const playersData = docSnap.data().players;
      players.value = playersData || [];
      playerCount.value = players.value.filter(p => p.estimation !== undefined).length;
    } else {
      console.error("Room-Dokument nicht gefunden.");
    }

    // Hinzufügen des Listeners, um Änderungen in Echtzeit zu verfolgen
    onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.data().players;
        if (playersData) {
          players.value = playersData;
          playerCount.value = playersData.filter(p => p.estimation !== undefined).length;
        }
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Spieler:", error);
  }
});


// Funktion um die Änderungen zu speichern
const submitReorder = async () => {
  try {
    const roomRef = doc(db, `rooms/${gameId.value}`);
    await updateDoc(roomRef, {
      players: players.value,
    });
    console.log("Reihenfolge gespeichert:", players.value);
  } catch (error) {
    console.error("Fehler beim Speichern der Reihenfolge:", error);
  }
};

// Funktion um die Spieler neu zu laden
const reloadPlayers = async () => {
  try {
    const roomRef = doc(db, `rooms/${gameId.value}`);
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      const playersData = docSnap.data().players;
      players.value = playersData || [];
      playerCount.value = players.value.filter(p => p.estimation !== undefined).length;
      console.log("Spieler neu geladen:", players.value);
      alert("Spieler erfolgreich neu geladen!");
    } else {
      console.error("Room-Dokument nicht gefunden.");
    }
  } catch (error) {
    console.error("Fehler beim Laden der Spieler:", error);
  }
};
const onListUpdated = () => {
  console.log("Neue Reihenfolge nach Drag:", players.value.map(p => p.name));
};
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
