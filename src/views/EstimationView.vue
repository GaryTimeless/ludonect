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
        {{ playerCount }} / {{ players.length }} answers received
      </ion-text>

      <!-- Anzeige der Spieler Namen um eine Reihenfolge zu bestimmen -->
      <div v-if="players.length > 0" style="padding: 16px">
        <h3>Spieler: {{ currentPlayerName }}</h3>
        <ion-text
          v-if="localPlayerId === activePlayer?.id"
          color="success"
          class="info-text"
        >
          🎯 Du bist jetzt an der Reihe!
        </ion-text>
        <p>zeige Daten aus localen PLAYER</p>
        <p>Spieleranzahl: {{ players.length }}</p>
        <ul>
          <li v-for="player in players" :key="player.id">
            {{ player.name }} – ID: {{ player.id }} – Antwort:
            {{ player.estimation }}
          </li>
        </ul>

        <!-- ----------------------------- -->
        <!-- SPIEER Reihenfolge bestimmen  -->
        <!-- ----------------------------- -->

        <VueDraggable
          v-model="players"
          :key="players.map((p) => p.id).join('-')"
          item-key="id"
          :disabled="!isHost"
          tag="div"
        >
          <template #item="{ element }">
            <ion-item
              v-if="element.estimation"
              :key="element.id"
              :style="{
                backgroundColor:
                  element.id === activePlayer?.id ? '#d0f0c0' : 'inherit',
              }"
            >
              <ion-label>
                {{
                  players
                    .filter((p) => p.estimation !== undefined)
                    .indexOf(element) + 1
                }}. {{ element.name }}
                <br />
                <ion-badge
                  color="primary"
                  v-if="element.isHost"
                  style="margin-top: 4px"
                  >Host</ion-badge
                >
                <ion-badge color="medium" v-else style="margin-top: 4px"
                  >Player</ion-badge
                >
              </ion-label>
            </ion-item>
          </template>
        </VueDraggable>
      </div>

      <ion-button
        v-if="isHost && !sortingStarted"
        expand="full"
        @click="submitReorder"
      >
        Reihenfolge Speichern
      </ion-button>

      <ion-button
        v-if="isHost && !sortingStarted"
        expand="full"
        @click="startGame"
      >
        Spiel starten
      </ion-button>

    

      

      <!-- -------------- -->
      <!-- SPIEL STARTEN -->
      <!-- -------------- -->
      <div v-if="sortingStarted && !sortingFinished" style="padding: 16px">
        <h3>Sortiere Spieler:</h3>
        <p>
          {{ "lokaler Spieler: " + localPlayerId + " - " + currentPlayerName }}
        </p>
        <p>
          {{
            "Aktiver Spieler: " + activePlayer?.id + " - " + activePlayer?.name
          }}
        </p>
        <p>{{ "Sorting Startet: " + sortingStarted }}</p>

        <!-- MOVE BUTTONS -->
        <div
          v-if="localPlayerId === activePlayer?.id"
          style="
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 8px;
          "
        >
          <ion-button @click="movePlayer(-1)">⬆️</ion-button>
          <ion-button @click="movePlayer(1)">⬇️</ion-button>
        </div>

        <!-- 
        PLACEDPLAyERS 
        Aktuelle Reihenfolge der platzierten Spieler anzeigen 
        -->
        <h3 style="margin-top: 24px">Spielerreihenfolge laut placedPlayer:</h3>
        <ul style="text-align: left; padding: 0 16px">
          <li v-for="player in placedPlayerObjects" :key="player.id">
            {{ player.name }}
          </li>
        </ul>

        <!-- Reihenfolge aus players (order) anzeigen -->
        <h3 style="margin-top: 24px">Spielerreihenfolge laut Order:</h3>
        <ul style="text-align: left; padding: 0 16px">
          <li v-for="player in order" :key="player.id">
            {{ player.name }}
          </li>
        </ul>
        <p>{{ "order array: " + order }}</p>

        <!-- Liste der spieler um die Antwort zu sortieren -->
        <ion-list>
          <ion-item
            v-for="(player, index) in placedPlayerObjects"
            :key="player.id"
            :disabled="localPlayerId !== activePlayer?.id"
          >
            <ion-label> {{ index + 1 }}. {{ player.name }} </ion-label>
          </ion-item>
        </ion-list>

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

      <div v-if="sortingFinished" style="padding: 16px">
        <h3>🎉 Finale Reihenfolge:</h3>
        <ion-list>
          <ion-item v-for="(player, index) in placedPlayers" :key="player.id">
            <ion-label>
              {{ index + 1 }}. {{ player.name }}
              <br />
              <strong>Antwort:</strong>
              {{ player.estimation?.answerValue ?? "Keine Antwort" }}
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import FunButton from "@/components/FunButton.vue";
import VueDraggable from "vuedraggable";
import { ref, onMounted, computed, watchEffect } from "vue";
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
import { Timestamp } from "firebase/firestore";

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  estimation?: {
    answerValue: string;
  };
}

const db = getFirestore();
const route = useRoute();
// const router = useRouter();
// const questionId = Number(route.params.questionId);
const gameId = ref<string>(route.params.gameId as string);
const playerCount = ref(0);
const players = ref<Player[]>([]);

const sortingStarted = ref(false);
const placedPlayers = ref<Player[]>([]);

const activePlayer = ref<Player | null>(null);
const sortingFinished = ref(false);
const finishedGame = ref(false)

const localPlayerId = localStorage.getItem("playerId");
// const localName = localStorage.getItem('playerName');
const isHost = computed(() => {
  const me = players.value.find((p) => p.id === localPlayerId);
  return me?.isHost || false;
});

const currentPlayerName = computed(() => {
  const me = players.value.find((p) => p.id === localPlayerId);
  return me?.name || "Unbekannt";
});

// Added order ref
const order = ref<Player[]>([]);

const placedPlayerObjects = computed(() =>
  placedPlayers.value
    .map((id: string | Player) => {
      const playerId = typeof id === "string" ? id : id.id;
      return players.value.find((p) => p.id === playerId);
    })
    .filter((p): p is Player => !!p)
);

onMounted(async () => {
  // STEP 1: Game ID aus der Route extrahieren
  gameId.value = route.params.gameId as string;

  try {
    // STEP 2: Firestore-Dokument für die Spielsession holen
    const roomRef = doc(db, "gameSessions", gameId.value);
    const docSnap = await getDoc(roomRef);

    if (docSnap.exists()) {
      // STEP 3: Daten aus dem Dokument extrahieren
      const data = docSnap.data();
      const temp = data.players;

      console.log(" [onMounted] das sind data.players daten: ", temp);

      // STEP 4: Spieler lokal setzen
      players.value = data.players || [];
      // STEP 5: Antworten auslesen und playerCount ermitteln
      const answersMap = data.currentRound?.answers || {};
      playerCount.value = Object.keys(answersMap).length;
      // STEP 6: Aktiven Spieler anhand der ID setzen
      activePlayer.value =
        players.value.find((p) => p.id === data.currentRound?.activePlayerId) ||
        null;
      console.log(
        "[onMounted] activePlayer wurde aktualisiert",
        activePlayer.value
      );

      // STEP 7: Bereits gesetzte Spieler (IDs → Objekte) in placedPlayers übernehmen
      const placedPlayerIds = data.currentRound?.placedPlayers || [];
      placedPlayers.value = players.value.filter((p) =>
        placedPlayerIds.includes(p.id)
      );
      // STEP 8: Statusflags setzen
      sortingStarted.value = data.sortingStarted || false;
      sortingFinished.value = data.sortingFinished || false;
    } else {
      console.error("Room-Dokument nicht gefunden.");
    }

    //------------
    // Listeners
    //------------

    // Hinzufügen des Listeners, um Änderungen in Echtzeit zu verfolgen
    onSnapshot(roomRef, async (snapshot) => {
      // 🔁 Dieser Listener wird bei jedem DB-Update getriggert

      /*
       * Block: Check ob Daten da sind
       * Wenn nicht, wird kein Update gemacht
       */

      console.log("[LISTENER] onSnapshot wurde getriggert");

      // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      // console.log("[LISTENER] Prüfe VOR snapshot :", input);
      if (snapshot.exists()) {
        const data = snapshot.data() as any;

        // auslöser ist die "Reihenfolge Speichern"-Button. + das Sicherstelle, dass die player in der Liste angezeigt werden.

        // 1. Update sortingStarted from currentRound
        // Der Host hat "spiel Starten" geklicked.
        sortingStarted.value = data.currentRound?.sortingStarted || false;
        console.log(
          "[LISTENER]sortingStarted wurde aktualisiert",
          sortingStarted.value
        );

        // 2. wenn eine EstimationOrder bereits existiert, wird sie hier lokal gespeichert.
        const orderIds = data.currentRound?.estimationOrder || [];
        console.log("[LISTENER] orderIds from DB:", orderIds);
        // 2.1 aus den IDs werden playerObjects gemacht
        order.value = orderIds
          .map((id: string) => players.value.find((p) => p.id === id))
          .filter((p: any): p is Player => !!p);
        console.log(" [LISTENER] order.value wurde aktualisiert", order.value);
        //3. wenn es bereits Spieler in placedPlayers gibt, werden sie hier lokal gespeichert
        //3.1 aus den IDs werden playerObjects gemacht
        placedPlayers.value = (data.currentRound?.placedPlayers || [])
          .map((id: string) => players.value.find((p) => p.id === id))
          .filter((p: any): p is Player => !!p);
        console.log(
          "[LISTENER] placedPlayers wurde aktualisiert",
          placedPlayers.value
        );
        // 4. wenn es einen activePlayer gibt, dann wird er hier lokal gespeichert.
        activePlayer.value =
          players.value.find(
            (p) => p.id === data.currentRound?.activePlayerId
          ) || null;
        console.log(
          "[LISTENER] activePlayer wurde aktualisiert",
          activePlayer.value
        );

        //5. playerDaten aktualisieren - wegen der Reihenfolge (answer: true)
        players.value = data.players;
        console.log("[LISTENER] players wurde aktualisiert", players.value);
        // aktualisiere PlayerCount let
        const answersMap = data.currentRound?.answers || {};
        playerCount.value = Object.keys(answersMap).length;
        console.log("[LISTENER] playerCount wurde aktualisiert", playerCount.value);
        // 6. sorting finished aus der DB 
        sortingFinished.value = data.sortingFinished || false;
        console.log(
          "[LISTENER] sortingFinished wurde aktualisiert",
          sortingFinished.value
        );
        
      }
    });
  } catch (error) {
    console.error("Fehler beim Abrufen der Spieler:", error);
  }
});

// -------------
// Reihenfolge speichern "Button"
// -------------
const submitReorder = async () => {
  try {
    // der Host hat die Reihenfolge der localen "players" variable verändert und möchte sie allen zugänglich machen.
    const roomRef = doc(db, "gameSessions", gameId.value);
    await updateDoc(roomRef, {
      players: players.value,
    });
    console.log(
      "[SUBMIT REORDER] Schätzreihenfolge gespeichert:",
      players.value.map((p) => p.id)
    );
  } catch (error) {
    console.error(
      " [SUBMIT REORDER] Fehler beim Speichern der Schätzreihenfolge:",
      error
    );
  }
  const proofRef = doc(db, "gameSessions", gameId.value);
  const proofSnap = await getDoc(proofRef);

  if (proofSnap.exists()) {
    const data = proofSnap.data();
    console.log("[SUBMIT REORDER] proof:", data.players); // ✅ Hier bekommst du die Spieler aus der DB
  } else {
    console.log("[SUBMIT REORDER] Dokument existiert nicht.");
  }
};
// TODO Hier weiter machen. Start game UPDATE funktioniert iwie nicht. und die onFinishedPlacement muss erstmal warten.
// -------------
// START GAME
// -------------

const startGame = async () => {
  // 1.Spiel vorbereitung
  sortingStarted.value = true;
  console.log(
    "[StartGame] -> PlacedPlayers:",
    placedPlayers.value.map((p) => p.name)
  );

  //Alle Spieler werden in eine const Order gespeichert
  order.value = [...players.value];
  order.value.push(players.value[0]); // Spieler p0 kommt nochmal ans Ende, laut Spielregeln
  console.log(
    "[StartGame] order.value:",
    order.value.map((p) => p.name)
  );

  const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
  console.log("[StartGame] prompt zur manuellen Prüfung von order :", input);

  //Spieler order[0] - p0 beginnt und ist somit aktiver Spieler
  activePlayer.value = order.value.length > 1 ? order.value[0] : null;
  console.log("[StartGame] activePlayer.value:", activePlayer.value);

  // activer spieler legt sein plättchen
  placedPlayers.value = order.value.length > 0 ? [order.value[0]] : [];
  console.log("[StartGame] placedPlayers.value:", placedPlayers.value);

  const roomRef = doc(db, "gameSessions", gameId.value);
  await updateDoc(roomRef, {
    "currentRound.sortingStarted": sortingStarted.value,
    "currentRound.estimationOrder": order.value.map((p) => p.id),
    "currentRound.activePlayerId": activePlayer.value?.id || null,
    "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
  });

  console.log(
    "[StartGame] END -> PlacedPlayers:",
    placedPlayers.value.map((p) => p.name)
  );
};

// -------------
// FINISH PLACEMENT
// -------------
const onFinishPlacement = async () => {
  //**
  // Drehbuch
  // 1. Lokale änderungen an placedPlayers in die DB gespeichert
  // 2. Nächster Spieler ist an der Reihe.-> order aus der DB holen und .slice(1) + upload.
  // 3. Aktiver Spieler ist dann order[0] -> Activer spieler local ändern + upload
  // 4. Der aktive spieler leht sein Plättchen in die Tischmitte -> placedPlayer.push(Order[0]) + upload
  // 4.1 AUSNAHME: der erste Spieler ist 2 mal dran, aber keine zwei plättchen.
  // 5. wenn alle Spieler gespielt haben, wird das ergebnis gezeigt.
  //  */
  console.log("[FINISED TURN]  Fertig geklickt von:", activePlayer.value?.name);
  const roomRef = doc(db, "gameSessions", gameId.value);
  if (!finishedGame.value) {
    // 1. spieler hat ggf änderungen in der reihenfolge on placedPlayers vorgenommen
    await updateDoc(roomRef, {
      "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
    });
    console.log(
      "[FINISED TURN] lokale änderungen an placedPlayers in die DB gespeichert:",
      placedPlayers.value.map((p) => p.name)
    );

    // 2. Nächster Spieler ist an der Reihe.
    const freshData = await getDoc(roomRef);
    order.value = freshData.data()?.currentRound?.estimationOrder;

    console.log("[FINISED TURN] Order aus der DB geholt", order.value);

    order.value = order.value.slice(1);

    console.log("[FINISED TURN] order lokal aktualisiert", order.value);
    console.log("[FINISED TURN] update von order -> START");
    // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

    await updateDoc(roomRef, {
      "currentRound.estimationOrder": order.value,
    });
    console.log("[FINISED TURN] update von order -> END");
    console.log("Check for LastRound -> players", players.value);
    

    // 3. Aktiver Spieler wird aktualisiert
    activePlayer.value = order.value.length > 0 ? order.value[0] : players.value[0];

    console.log(
      "[FINISED TURN] activePlayer wurde lokal aktualisiert",
      activePlayer.value
    );

    console.log("[FINISED TURN] update von activePlayerId -> START");
    // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

    await updateDoc(roomRef, {
      "currentRound.activePlayerId": activePlayer.value?.id || null,
    });
    console.log("[FINISED TURN] update von activePlayer -> END");

    // 4. Der aktive Spieler legt sein Plättchen in die Tischmitte
    if (order.value.length > 1) {
      placedPlayers.value.push(order.value[0]);
      console.log(
        "[FINISED TURN] placedPlayer wurde lokal aktualisiert",
        placedPlayers.value
      );

      console.log("[FINISED TURN] update von placedPlayer -> START");
      // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

      await updateDoc(roomRef, {
        "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
      });
      console.log("[FINISED TURN] update von activePlayer -> END");
    } else {
      console.log("[FINISED TURN] Startspieler darf letzten Zug machen.");
      finishedGame.value = true;
    const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    console.log("[FINISED TURN] Prüfe VOR update DB? :", input);
    }
    console.log("[FINISED TURN] RETURNING");
    return;
  }
  
  console.log("[FINISED TURN] Alle Spieler wurden platziert. 🎉");
  console.log("[FINISED TURN] update von sortingFinished & sortingStarted -> START");
  await updateDoc(roomRef, {
    sortingFinished: true,
    sortingStarted: false
  });
  console.log("update von sortingFinished & sortingStarted -> END");
};

// const onFinishPlacement = async () => {
//   console.log("Fertig geklickt von:", activePlayer.value?.name);

//   // spieler hat ggf änderungen in der reihenfolge on placedPlayers vorgenommen
//   const roomRef = doc(db, "gameSessions", gameId.value);
//   await updateDoc(roomRef, {
//     "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
//   });
//   if (order.value.length > 0) {
//     // aktueller Spieler hat gespielt
//     order.value = order.value.slice(1);
//     //neuer aktueller Spieler wird zugewiesen
//     activePlayer.value = order.value.length > 1 ? order.value[0] : null;
//     // neuer aktiver Spieler fügt sein Plättchen hinzu
//     placedPlayers.value = order.value.length > 0 ? [order.value[0]] : [];
//     console.log(
//       "placedPlayer wurde hinzugefügt",
//       placedPlayers.value.map((p) => p.name)
//     );

//     const testSnapBefore = await getDoc(roomRef);
//     console.log(
//       "[DEBUG] aktueller Stand von currentRound VOR UPDATE:",
//       testSnapBefore.data()?.currentRound
//     );

//     await updateDoc(roomRef, {
//       "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
//       "currentRound.estimationOrder": order.value.map((p) => p.id),
//       "currentRound.activePlayerId": activePlayer.value?.id || null,
//     });

//     const testSnapAFTER = await getDoc(roomRef);
//     console.log(
//       "[DEBUG] aktueller Stand von currentRound: NACH UPDATE",
//       testSnapAFTER.data()?.currentRound
//     );
//     console.log(
//       "placedPlayer wurde in der DB aktualisiert",
//       placedPlayers.value.map((p) => p.name)
//     );

//     console.log(
//       "order wurde in der DB aktualisiert",
//       order.value.map((p) => p.name)
//     );

//     console.log(
//       "activePlayer wurde in der DB aktualisiert",
//       activePlayer.value?.name
//     );
//   } else {
//     console.log(
//       "Order ist leer -> ",
//       order.value.map((p) => p.name)
//     );
//     activePlayer.value = players.value[0] || null;
//     sortingStarted.value = false;
//     sortingFinished.value = true;
//     await updateDoc(roomRef, {
//       "currentRound.sortingStarted": false,
//       "currentRound.sortingFinished": true,
//     });
//     console.log("DB update");
//   }

// der aktuelle Spieler legt sein plättchen aus

// TODO hier liegt ein gedanklicher fehler vor. eigentlich würde ich jetzt Order[0] entfernen. aber wenn ich das richtig verstehe, hat p0 seinen Zug gemacht und p2 ist jetzt dran.
// das bedeutet, ich habe die rekursion hie rnoch nicht richzig zu ende gedacht.
// wenn ich fertig bin, passiert: onFinishedPlacement.
// - update die position der "plättchen" an alle -
// - activer spieler fliegt aus order[] raus.
// - neuer aktiver spieler wird gesetzt.
// - nächstes plättchen wird gesetzt.
//
//
//
//
//
//
//
//

// // 2. Determine next player
// const unplaced = players.value.filter(
//   (p) => !placedPlayers.value.some((pp) => pp.id === p.id)
// );
// //players [player0, player1, player2]
// //placedPalyer [player0, player1]
// //unplaced [player2] -> quasi als gefilterte players Liste.

// //order [player0, player1, player2, player0]

// if (unplaced.length > 0) {
//   const next = unplaced[0];
//   placedPlayers.value.push(next);
//   activePlayer.value = next;
//   console.log("Nächster aktiver Spieler:", next.name);
//   console.log(
//     "Aktuelle Reihenfolge nach Platzierung:",
//     placedPlayers.value.map((p) => p.name).join(" → ")
//   );

// 3. Update with new active player and full order
// await updateDoc(roomRef, {
//   activePlayerId: next.id,
//   placedPlayers: placedPlayers.value.map((p) => p.id),
// });
// return;
//}

// all done
// sortingFinished.value = true;
// console.log("Alle Spieler wurden platziert. 🎉");
// await updateDoc(roomRef, {
//   sortingFinished: true,
//   placedPlayers: placedPlayers.value.map((p) => p.id),
// });
// };

// -------------
// Move Button Funktion
// -------------
// Move player up or down in placedPlayers list
function movePlayer(direction: number) {
  const index = placedPlayers.value.findIndex((p) => p.id === localPlayerId);
  if (index === -1) {
    console.log("Aktueller Spieler nicht in der Liste.");
    return;
  }
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= placedPlayers.value.length) return;
  const updated = [...placedPlayers.value];
  const [moved] = updated.splice(index, 1);
  updated.splice(newIndex, 0, moved);
  placedPlayers.value = updated;
  console.log(
    "Reihenfolge geändert:",
    placedPlayers.value.map((p) => p.name)
  );
}

// Removed handlePlayerClick function

const testUpdate = () => {
  onFinishPlacement();
  console.log("onFinishedPlacement wurde aufgerufen");
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
