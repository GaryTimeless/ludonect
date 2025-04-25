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
      <ion-text v-if="sortingStarted" color="primary" class="info-text">
        Spiel gestartet – du bist Spieler: {{ currentPlayerName }}
      </ion-text>
      
      <!-- Anzeige der Anzahl der Spieler -->
      <ion-text class="info-text" color="medium">
        {{ playerCount }} / {{ players.length }} estimations received
      </ion-text>
      <!-- Anzeige der Spieler Namen -->
      <div v-if="players.length > 0" style="padding: 16px">
        <h3>Spieler:</h3>
        <VueDraggable
          v-model="players"
          :key="players.map(p => p.id).join('-')"
          item-key="id"
          @update="onListUpdated"
          :disabled="!isHost"
        >
          <ion-item v-for="player in players.filter(p => p.estimation !== undefined)" :key="player.id">
            <ion-label :style="{ color: isHost ? 'inherit' : 'gray' }">
              {{ players.filter(p => p.estimation !== undefined).indexOf(player) + 1 }}. {{ player.name }}
              <br />
              <small v-if="player.isHost">Host</small>
              <small v-else>Player</small>
            </ion-label>
          </ion-item>
        </VueDraggable>
      </div>

      <ion-button v-if="isHost && !sortingStarted" expand="full" @click="submitReorder"
        >Reihenfolge Speichern</ion-button
      >
      <ion-button expand="full" @click="reloadPlayers"
      >Daten neu laden</ion-button
      >
      
      <ion-button v-if="isHost && !sortingStarted" expand="full" @click="startGame"
        >Spiel starten</ion-button
      >
      <div v-if="sortingStarted" style="padding: 16px">
        <h3>Sortiere Spieler:</h3>
        <VueDraggable
          v-model="sortedPlayers"
          item-key="id"
          :disabled="localPlayerId !== activePlayer?.id"
        >
          <ion-item v-for="player in placedPlayers" :key="player.id">
            <ion-label>
              {{ player.name }}
            </ion-label>
          </ion-item>
        </VueDraggable>

        <!-- Fertig-Button nur für den aktiven Spieler sichtbar -->
        <ion-button
          v-if="localPlayerId === activePlayer?.id"
          expand="full"
          style="margin-top: 16px"
          @click="onFinishPlacement"
        >
          Fertig
        </ion-button>
      </div>

    </ion-content>
  </ion-page>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
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

const sortingStarted = ref(false);
const placedPlayers = ref([]);
const sortedPlayers = ref([]);

const activePlayer = ref(null);

watch(sortingStarted, (newVal) => {
  if (newVal) {
    placedPlayers.value = players.value.length > 0 ? [players.value[0]] : [];
    sortedPlayers.value = placedPlayers.value;
  }
});

const localPlayerId = localStorage.getItem('playerId');
const isHost = computed(() => {
  const me = players.value.find(p => p.id === localPlayerId);
  return me?.isHost || false;
});

const currentPlayerName = computed(() => {
  const me = players.value.find(p => p.id === localPlayerId);
  return me?.name || 'Unbekannt';
});

onMounted(async () => {
  gameId.value = route.params.gameId;

  try {
    const roomRef = doc(db, `rooms/${gameId.value}`);
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      const playersData = docSnap.data().players;
      players.value = playersData || [];
      activePlayer.value = players.value.find(p => p.id === docSnap.data().activePlayerId) || null;
      playerCount.value = players.value.filter(p => p.estimation !== undefined).length;

      const placedPlayerIds = docSnap.data().placedPlayers || [];
      placedPlayers.value = players.value.filter(p => placedPlayerIds.includes(p.id));
      sortedPlayers.value = [...placedPlayers.value];
      sortingStarted.value = docSnap.data().sortingStarted || false;
    } else {
      console.error("Room-Dokument nicht gefunden.");
    }

    // Hinzufügen des Listeners, um Änderungen in Echtzeit zu verfolgen
    onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const playersData = snapshot.data().players;
        if (playersData) {
          players.value = playersData;
          activePlayer.value = players.value.find(p => p.id === snapshot.data().activePlayerId) || null;
          playerCount.value = playersData.filter(p => p.estimation !== undefined).length;

          const placedPlayerIds = snapshot.data().placedPlayers || [];
          placedPlayers.value = players.value.filter(p => placedPlayerIds.includes(p.id));
          sortedPlayers.value = [...placedPlayers.value];
          sortingStarted.value = snapshot.data().sortingStarted || false;
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

const startGame = async () => {
  sortingStarted.value = true;

  const finalOrder = [...players.value];
  placedPlayers.value = [finalOrder[0]];
  sortedPlayers.value = [...placedPlayers.value];
  activePlayer.value = finalOrder.length > 1 ? finalOrder[1] : null;

  const roomRef = doc(db, `rooms/${gameId.value}`);
  await updateDoc(roomRef, {
    activePlayerId: activePlayer.value?.id || null,
    placedPlayers: placedPlayers.value.map(p => p.id),
    sortingStarted: true,
  });
};
//asdasd
const onFinishPlacement = async () => {
  console.log("Fertig geklickt von:", activePlayer.value?.name);
  if (!activePlayer.value) return;

  placedPlayers.value.push(activePlayer.value);
  sortedPlayers.value = [...placedPlayers.value];

  const nextPlayer = players.value.find(p => !placedPlayers.value.includes(p));
  activePlayer.value = nextPlayer || null;

  const roomRef = doc(db, `rooms/${gameId.value}`);
  await updateDoc(roomRef, {
    activePlayerId: activePlayer.value?.id || null,
    placedPlayers: placedPlayers.value.map(p => p.id),
  });
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
