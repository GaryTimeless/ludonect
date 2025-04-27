<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Estimate the Order</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div style="padding: 16px; text-align: center">
        <FunButton />
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
        <h3>Spieler: {{currentPlayerName}}</h3>
        <ion-text v-if="localPlayerId === activePlayer?.id" color="success" class="info-text">
          🎯 Du bist jetzt an der Reihe!
        </ion-text>
        <VueDraggable
          v-model="players"
          :key="players.map(p => p.id).join('-')"
          item-key="id"
          @update="onListUpdated"
          :disabled="!isHost"
          tag="transition-group"
          :component-data="{
            name: 'fade',
            type: 'transition',
            mode: 'out-in'
          }"
        >
          <ion-item
            v-for="player in players.filter(p => p.estimation !== undefined)"
            :key="player.id"
            :style="{ backgroundColor: player.id === activePlayer?.id ? '#d0f0c0' : 'inherit' }"
          >
            <ion-label>
              {{ players.filter(p => p.estimation !== undefined).indexOf(player) + 1 }}. {{ player.name }}
              <br />
              <ion-badge color="primary" v-if="player.isHost" style="margin-top: 4px;">Host</ion-badge>
              <ion-badge color="medium" v-else style="margin-top: 4px;">Player</ion-badge>
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
          v-model="placedPlayers"
          item-key="id"
          :disabled="localPlayerId !== activePlayer?.id || placedPlayers.length <= 1"
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

      <div v-if="sortingFinished" style="padding: 16px;">
        <h3>🎉 Finale Reihenfolge:</h3>
        <ion-list>
          <ion-item v-for="(player, index) in placedPlayers" :key="player.id">
            <ion-label>
              {{ index + 1 }}. {{ player.name }}
              <br />
              <strong>Antwort:</strong> {{ player.estimation !== undefined ? player.estimation : 'Keine Antwort' }}
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup>
import FunButton from '@/components/FunButton.vue';
import { ref, onMounted, computed, } from "vue";
import { useRoute } from "vue-router";
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonText,
  IonBadge,
  IonItem,
  IonLabel,
  IonList,
  
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

const activePlayer = ref(null);
const sortingFinished = ref(false);

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
          sortingStarted.value = snapshot.data().sortingStarted || false;
          sortingFinished.value = snapshot.data().sortingFinished || false;
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

  placedPlayers.value = finalOrder.length > 1 ? [finalOrder[0], finalOrder[1]] : [finalOrder[0]];
  activePlayer.value = finalOrder.length > 1 ? finalOrder[1] : null;

  console.log("StartGame -> PlacedPlayers:", placedPlayers.value.map(p => p.name));
  console.log("StartGame -> ActivePlayer:", activePlayer.value?.name);

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

  const nextPlayer = players.value.find(p => !placedPlayers.value.includes(p));

  if (nextPlayer) {
    placedPlayers.value.push(nextPlayer);
  }

  console.log("Aktuelle Reihenfolge nach Platzierung:");
  placedPlayers.value.forEach((p, index) => {
    console.log(`${index + 1}. ${p.name}`);
  });

  activePlayer.value = nextPlayer || null;

  if (activePlayer.value) {
    console.log("Nächster aktiver Spieler:", activePlayer.value.name);
  } else {
    console.log("Alle Spieler wurden platziert. 🎉");
  }
  if (!activePlayer.value) {
  sortingFinished.value = true;

  const roomRef = doc(db, `rooms/${gameId.value}`);
  await updateDoc(roomRef, {
    sortingFinished: true,
  });
  console.log("Das Spiel ist abgeschlossen, alle Spieler platziert!");
  return;
}
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

.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
