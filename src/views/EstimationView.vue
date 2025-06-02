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
      <!--<ion-button @click="FinishedViewCompundingFunc" expand="full">
        Entry
      </ion-button> -->

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
        <p>{{ "Sorting Finished: " + sortingFinished }}</p>

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
          <ion-item
            v-for="(entry, index) in finishedViewAnswerValue"
            :key="entry.Player.id"
          >
            <ion-label>
              {{ index + 1 }}. {{ entry.Player.name }}
              <br />
              <strong>Antwort:</strong>
              {{ entry.answerValue ?? "Keine Antwort" }}
            </ion-label>
          </ion-item>
        </ion-list>
        <ion-button v-if="isHost" expand="full" @click="goToPrepareNextRound">
          Prepare Next Round
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import FunButton from "@/components/FunButton.vue";
import VueDraggable from "vuedraggable";
import { ref, onMounted, computed, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useRouter } from "vue-router";
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

interface Player {
  id: string;
  name: string;
  isHost: boolean;
  estimation?: {
    answerValue: string;
  };
}
interface FinishedViewCompunding {
  Player: Player;
  answerValue: string;
}
const router = useRouter();

const db = getFirestore();
const route = useRoute();
// const router = useRouter();
// const questionId = Number(route.params.questionId);
const gameId = ref<string>(route.params.gameId as string);
const playerCount = ref(0);
const players = ref<Player[]>([]);

const sortingStarted = ref(false);

const PrepNextRound = ref(false);
const placedPlayers = ref<Player[]>([]);

const activePlayer = ref<Player | null>(null);
const sortingFinished = ref(false);
const secondTurnStartPlayer = ref(false);
const finishedViewAnswerValue = ref<FinishedViewCompunding[]>([]);

let unsubscribeFn: (() => void) | null = null;

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

  // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
  // console.log("[LISTENER] Prüfe VOR aufbau onMounted :", input);
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
    unsubscribeFn = onSnapshot(roomRef, async (snapshot) => {
      // 🔁 Dieser Listener wird bei jedem DB-Update getriggert

      /*
       * Block: Check ob Daten da sind
       * Wenn nicht, wird kein Update gemacht
       */

      console.log("[LISTENER START] onSnapshot wurde getriggert");

      // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      // console.log("[LISTENER] Prüfe VOR snapshot :", input);
      if (snapshot.exists()) {
        const data = snapshot.data() as any;

        // auslöser ist die "Reihenfolge Speichern"-Button. + das Sicherstelle, dass die player in der Liste angezeigt werden.

        // 1. Update sortingStarted from currentRound
        // Der Host hat "spiel Starten" geklicked.
        sortingStarted.value = data.currentRound?.sortingStarted || false;
        console.log(
          "[LISTENER 1]sortingStarted wurde aktualisiert",
          sortingStarted.value
        );

        // 2. wenn eine EstimationOrder bereits existiert, wird sie hier lokal gespeichert.
        const orderIds = data.currentRound?.estimationOrder || [];
        console.log("[LISTENER 2] orderIds from DB:", orderIds);
        // 2.1 aus den IDs werden playerObjects gemacht
        order.value = orderIds
          .map((id: string) => players.value.find((p) => p.id === id))
          .filter((p: any): p is Player => !!p);
        console.log(
          " [LISTENER 3] order.value wurde aktualisiert",
          order.value
        );
        //3. wenn es bereits Spieler in placedPlayers gibt, werden sie hier lokal gespeichert
        //3.1 aus den IDs werden playerObjects gemacht
        placedPlayers.value = (data.currentRound?.placedPlayers || [])
          .map((id: string) => players.value.find((p) => p.id === id))
          .filter((p: any): p is Player => !!p);
        console.log(
          "[LISTENER 4] placedPlayers wurde aktualisiert",
          placedPlayers.value
        );
        // 4. wenn es einen activePlayer gibt, dann wird er hier lokal gespeichert.
        activePlayer.value =
          players.value.find(
            (p) => p.id === data.currentRound?.activePlayerId
          ) || null;
        console.log(
          "[LISTENER 5] activePlayer wurde aktualisiert",
          activePlayer.value
        );

        //5. playerDaten aktualisieren - wegen der Reihenfolge (answer: true)
        players.value = data.players;
        console.log("[LISTENER 6] players wurde aktualisiert", players.value);
        // aktualisiere PlayerCount let
        const answersMap = data.currentRound?.answers || {};
        playerCount.value = Object.keys(answersMap).length;
        console.log(
          "[LISTENER 7] playerCount wurde aktualisiert",
          playerCount.value
        );
        // 6. sorting finished aus der DB
        sortingFinished.value = data.currentRound?.sortingFinished || false;
        console.log(
          "[LISTENER 8] sortingFinished wurde aktualisiert",
          sortingFinished.value
        );
        console.log(
          "[LISTENER 9] secondTurnStartPlayer wurde aktualisiert",
          secondTurnStartPlayer.value
        );
        if (sortingFinished.value) {
          await FinishedViewCompundingFunc();
          console.log(
            " [FLAST TURN 999] FinishedViewCompundingFunc() triggerd"
          );
        }
        // 7. secondTurnStartPlayer aus der DB
        secondTurnStartPlayer.value =
          data.currentRound?.secondTurnStartPlayer || false;
        console.log(
          "[LISTENER 10] secondTurnStartPlayer wurde aktualisiert",
          secondTurnStartPlayer.value
        );

        PrepNextRound.value = data.currentRound?.PrepNextRound || false;
        if (PrepNextRound.value) {
          console.log(
            "[LISTENER 11] PrepNextRound wurde aktualisiert",
            PrepNextRound.value
          );
          if (!isHost.value) {
            unsubscribeFn?.();
            console.log(
              "[LISTENER 11.1] unsubscribeFn() wurde aufgerufen (Client, nicht Host)"
            );
          }
          router.push(`/prepare/${gameId.value}`);
        }

        console.log("[Listener LAST] ENDE aller aktualisierungen");
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

  // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
  // console.log("[StartGame] prompt zur manuellen Prüfung von order :", input);

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
  console.log(
    "[FINISED TURN 00]  Fertig geklickt von:",
    activePlayer.value?.name
  );
  const roomRef = doc(db, "gameSessions", gameId.value);
  console.log(
    "[FINISED TURN 000] sortingFinished value:",
    sortingFinished.value
  );
  console.log(
    "[FINISED TURN 000] secondTurnStartPlayer value:",
    secondTurnStartPlayer.value
  );

  if (
    activePlayer.value?.id == players.value[0].id &&
    secondTurnStartPlayer.value
  ) {
    sortingFinished.value = true;
    console.log(
      "[LAST TRUN 000] sortingFinished wurde aktualisiert auf true",
      sortingFinished.value
    );
    await updateDoc(roomRef, {
      "currentRound.sortingFinished": sortingFinished.value,
    });
  }

  if (!sortingFinished.value) {
    // 1. spieler hat ggf änderungen in der reihenfolge on placedPlayers vorgenommen
    await updateDoc(roomRef, {
      "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
    });
    console.log(
      "[FINISED TURN 01] lokale änderungen an placedPlayers in die DB gespeichert:",
      placedPlayers.value.map((p) => p.name)
    );

    // 2. Nächster Spieler ist an der Reihe.
    const freshData = await getDoc(roomRef);
    order.value = freshData.data()?.currentRound?.estimationOrder;

    console.log("[FINISED TURN 02] Order aus der DB geholt", order.value);

    order.value = order.value.slice(1);

    console.log("[FINISED TURN 03] order lokal aktualisiert", order.value);
    console.log("[FINISED TURN 04] update von order -> START");
    // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

    await updateDoc(roomRef, {
      "currentRound.estimationOrder": order.value,
    });
    console.log("[FINISED TURN 05] update von order -> END");

    // 3. Aktiver Spieler wird aktualisiert
    activePlayer.value =
      order.value.length > 0 ? order.value[0] : players.value[0];

    console.log(
      "[FINISED TURN 06] activePlayer wurde lokal aktualisiert",
      activePlayer.value
    );

    console.log("[FINISED TURN 07] update von activePlayerId -> START");
    // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

    await updateDoc(roomRef, {
      "currentRound.activePlayerId": activePlayer.value?.id || null,
    });
    console.log("[FINISED TURN 08] update von activePlayer -> END");

    // 4. Der aktive Spieler legt sein Plättchen in die Tischmitte
    if (order.value.length > 1) {
      placedPlayers.value.push(order.value[0]);
      console.log(
        "[FINISED TURN 09] placedPlayer wurde lokal aktualisiert",
        placedPlayers.value
      );

      console.log("[FINISED TURN 11] update von placedPlayer -> START");
      // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

      await updateDoc(roomRef, {
        "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
      });
      console.log("[FINISED TURN 12] update von activePlayer -> END");
    } else {
      // wenn order => [p0], weil order>1 = false
      console.log("[FLAST TURN 101] Startspieler darf letzten Zug machen.");
      console.log("[FLAST TURN 102] update von secondTurnStartPlayer -> START");

      secondTurnStartPlayer.value = true;
      await updateDoc(roomRef, {
        "currentRound.secondTurnStartPlayer": secondTurnStartPlayer.value,
      });
      console.log("[FLAST TURN 103] update von sortingFinished -> END");
      const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      console.log("[FLAST TURN 104] Prüfe VOR update DB? :", input);
    }
    console.log("[FINISED TURN 13] RETURNING");
    return;
  }

  console.log("[FLAST TURN 105] Update lokal changes placedPlayer -> START");

  await updateDoc(roomRef, {
    "currentRound.placedPlayers": placedPlayers.value.map((p) => p.id),
  });
  console.log(
    "[FLAST TURN 106] lokale änderungen an placedPlayers in die DB gespeichert:",
    placedPlayers.value.map((p) => p.name)
  );

  console.log("[FLAST TURN 107] Update lokal changes placedPlayer -> END");
  console.log("[FLAST TURN 108] Alle Spieler wurden platziert. 🎉");
  console.log(
    "[FLAST TURN 109] update von sortingFinished & sortingStarted -> START"
  );
  await updateDoc(roomRef, {
    "currentRound.sortingFinished": sortingFinished.value,
    "currentRound.sortingStarted": sortingStarted.value,
  });
  FinishedViewCompundingFunc();
  console.log(
    "[FLAST TURN 110] update von sortingFinished & sortingStarted -> END"
  );
};

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
//TODO  alle Werte müssen in die Listener geupdated werden >.>
// der letzte Spieler muss iwie zweimal fertig klicken
// sonst ok
async function FinishedViewCompundingFunc() {
  console.log("[FinishedView] Funktion gestartet");

  const roomRef = doc(db, "gameSessions", gameId.value);
  const freshDataSnap = await getDoc(roomRef);

  if (!freshDataSnap.exists()) {
    console.error("[FinishedView] Dokument nicht gefunden:", gameId.value);
    return;
  }

  const freshData = freshDataSnap.data();
  console.log("[FinishedView] Daten geladen:", freshData);

  const playersData = freshData.players || [];
  const answers = freshData.currentRound?.answers || {};
  const placedIds = freshData.currentRound?.placedPlayers || [];

  console.log("[FinishedView] Spieler-Daten:", playersData);
  console.log("[FinishedView] Antworten:", answers);
  console.log("[FinishedView] Platzierte Spieler-IDs:", placedIds);

  const mapped: FinishedViewCompunding[] = placedIds
    .map((id: string) => {
      const player = playersData.find((p: Player) => p.id === id);
      const answerValue = answers[id]?.answerValue ?? "Keine Antwort";
      if (!player) {
        console.warn("[FinishedView] Kein Spieler gefunden für ID:", id);
        return null;
      }
      return { Player: player, answerValue };
    })
    .filter((entry: any): entry is FinishedViewCompunding => entry !== null);

  console.log("[FinishedView] Gemappte Ergebnisliste:", mapped);

  finishedViewAnswerValue.value = mapped;
  console.log(
    "[FinishedView] Ergebnisliste gesetzt:",
    finishedViewAnswerValue.value
  );
}

const goToPrepareNextRound = async () => {
  const roomRef = doc(db, "gameSessions", gameId.value);
  const docSnap = await getDoc(roomRef);
  if (docSnap.exists()) {
    await updateDoc(roomRef, {
      "currentRound.PrepNextRound": true,
      "currentRound.phase": "prepaire",
    });
  }

  console.log("[FinishedView] unsubscribe -> Start");

  router.push(`/prepare/${gameId.value}`);
  unsubscribeFn?.();
};

onBeforeUnmount(() => {
  console.log("[FinishedView] Unsubscribe called (onBeforeUnmount)");

  if (unsubscribeFn) {
    unsubscribeFn();
    console.log("[Estimation] Unsubscribed on leave");
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
