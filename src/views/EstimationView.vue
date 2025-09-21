<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Estimate the Order</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="center-wrapper">
        <ion-text v-if="sortingStarted" color="primary" class="info-text">
          Spiel gestartet – du bist Spieler: {{ currentPlayerName }}
        </ion-text>

        <!-- Anzeige der Anzahl der Spieler -->
        <ion-text class="info-text" color="medium">
          {{ playerCount }} / {{ players.length }} haben bereits geantwortet
        </ion-text>

        <!-- Anzeige der Spieler Namen um eine Reihenfolge zu bestimmen -->
        <div v-if="players.length > 0" style="padding: 16px">
          <h3>Spieler: {{ currentPlayerName }}</h3>

          <!-- 
        DEV 
        -->
          <!-- <p>zeige Daten aus localen PLAYER</p>
        <p>Spieleranzahl: {{ players.length }}</p>
        <ul>
          <li v-for="player in players" :key="player.id">
            {{ player.name }} – ID: {{ player.id }} – Antwort:
            {{ player.estimation }}
          </li>
        </ul> -->

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
        <p class="info-text">Hier wird die Spielerreihenfolge bestimmt</p>
        <p v-if="!sortingStarted" class="info-text">
          Warte bitte auf den Host um weiter zu machen
        </p>
        <div class="estimation-buttons-wrapper">
          <ion-button
            v-if="isHost && !sortingStarted"
            expand="block"
            @click="submitReorder"
            style="
              --background: #59981a;
              --color: #edffcc;
              --border-radius: 9px;
              font-size: 1.19rem;
              font-weight: 600;
              letter-spacing: 0.03em;
              min-height: 54px;
              margin-top: 16px;
            "
          >
            Reihenfolge Speichern
          </ion-button>
          <ion-button
            v-if="isHost && !sortingStarted"
            expand="block"
            @click="startGame"
            style="
              --background: #59981a;
              --color: #edffcc;
              --border-radius: 9px;
              font-size: 1.19rem;
              font-weight: 600;
              letter-spacing: 0.03em;
              min-height: 54px;
              margin-top: 16px;
            "
          >
            Spiel starten
          </ion-button>
        </div>
        <div style="padding: 16px; text-align: center">
          <FunButton />
        </div>
        <!--<ion-button @click="FinishedViewCompundingFunc" expand="full">
        Entry
      </ion-button> -->

        <!-- -------------- -->
        <!-- SPIEL STARTEN -->
        <!-- -------------- -->
        <div v-if="sortingStarted && !sortingFinished" style="padding: 16px">
          <p class="info-text">
            in der Tabelle unten werden alle Spieler (entsprechend der
            Reihenfolge oben) <br />nach und nach ihren Namen sortieren
          </p>
          <ion-text
            v-if="localPlayerId === activePlayer?.id"
            color="success"
            class="info-text"
          >
            🎯 Du bist jetzt an der Reihe!
          </ion-text>
          <ion-text v-else color="medium" class="info-text">
            ⏳ Bitte warte, bis du an der Reihe bist.
          </ion-text>
          <div class="question-wrapper">
            <template v-if="currentQuestion">
              <h2 class="question-title">Aktuelle Frage:</h2>
              <p class="question-text">
                {{ currentQuestion.text }}
              </p>
            </template>
            <template v-else>
              <h2 class="question-title">Aktuelle Frage:</h2>
              <p class="question-text">Frage wird geladen …</p>
            </template>
            <ul v-if="placedPlayerObjects.length > 0" class="player-order-list">
              <li
                v-for="(player, idx) in placedPlayerObjects"
                :key="player.id"
                :class="{ disabled: localPlayerId !== activePlayer?.id }"
              >
                {{ idx + 1 }}. {{ player.name }}
              </li>
            </ul>
            <p v-else class="info-text">Noch keine Spieler platziert.</p>
            <ion-text
              v-if="showPlacementDebug"
              color="tertiary"
              class="info-text debug-placement"
            >
              Debug placedPlayers ({{ placedPlayerObjects.length }}):
              {{ placementDebugList || "—" }}
            </ion-text>
          </div>
          <!-- 
        DEV 
        -->

          <!-- <p>
          {{ "lokaler Spieler: " + localPlayerId + " - " + currentPlayerName }}
        </p>
        <p>
          {{
            "Aktiver Spieler: " + activePlayer?.id + " - " + activePlayer?.name
          }}
        </p>
        <p>{{ "Sorting Startet: " + sortingStarted }}</p>
        <p>{{ "Sorting Finished: " + sortingFinished }}</p> -->
          <p class="info-text">
            Nutze die Pfeile um deinen Namen neu zu positionieren,<br/> wenn du an der Reihe bist
          </p>
          <!-- MOVE BUTTONS -->
          <div
            v-if="localPlayerId === activePlayer?.id"
            class="move-button-row"
          >
            <ion-button class="icon-button" @click="movePlayer(-1)"
              >⬆️</ion-button
            >
            <ion-button class="icon-button" @click="movePlayer(1)"
              >⬇️</ion-button
            >
          </div>

          <!-- 
        DEV
        PLACEDPLAYERS 
        Aktuelle Reihenfolge der platzierten Spieler anzeigen 
        -->
          <!-- <h3 style="margin-top: 24px">Spielerreihenfolge laut placedPlayer:</h3>
        <ul style="text-align: left; padding: 0 16px">
          <li v-for="player in placedPlayerObjects" :key="player.id">
            {{ player.name }}
          </li>
        </ul> -->

          <!-- Reihenfolge aus players (order) anzeigen -->
          <!-- <h3 style="margin-top: 24px">Spielerreihenfolge laut Order:</h3>
        <ul style="text-align: left; padding: 0 16px">
          <li v-for="player in order" :key="player.id">
            {{ player.name }}
          </li>
        </ul>
        <p>{{ "order array: " + order }}</p> -->

          <!-- Liste der spieler um die Antwort zu sortieren -->
          <!-- <ion-list>
            <ion-item
              v-for="(player, index) in placedPlayerObjects"
              :key="player.id"
              :disabled="localPlayerId !== activePlayer?.id"
            >
              <ion-label> {{ index + 1 }}. {{ player.name }} </ion-label>
            </ion-item>
          </ion-list> -->

          <!-- Fertig-Button nur für den aktiven Spieler sichtbar -->
          <div
            class="finish-button-wrapper"
            v-if="localPlayerId === activePlayer?.id"
          >
            <ion-button
              style="margin-top: 16px"
              @click="onFinishPlacement"
              class="finish-button"
            >
              Fertig
            </ion-button>
          </div>
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
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">

// Man sieht die reihenfolge, die erklärung, den "langweilig button" die aktuelle spieler Fläche usw. ich bin damit noch etwas unzufrieden. 
// würde vllt reichen wenn man es anders fargbig gestlatet. 

import FunButton from "@/components/FunButton.vue";
import VueDraggable from "vuedraggable";
import { ref, onMounted, computed, onBeforeUnmount, inject, watch } from "vue";
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
import { supabase } from "@/supabaseClient";

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

// Supabase client bereits importiert
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
const currentRound = ref<any | null>(null);
const questions = inject("questions", []) as any[];
const currentQuestion = computed(() => {
  if (!questions || !currentRound.value?.questionId) return null;
  return questions.find((q) => q.id === currentRound.value.questionId);
});
console.log("current Question", currentQuestion);

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

const placedPlayerObjects = computed(() => placedPlayers.value);
const placedPlayerNames = computed(() =>
  placedPlayers.value.map((player) => player.name)
);
const placementDebugList = computed(() =>
  placedPlayerObjects.value
    .map((player) => `${player.name} (${player.id})`)
    .join(", ")
);
const showPlacementDebug = computed(() => import.meta.env.DEV && isHost.value);

if (import.meta.env.DEV) {
  watch(
    placedPlayers,
    (newVal) => {
      const ids = newVal.map((player) => player?.id ?? "<missing>");
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log("[DEBUG placement] placedPlayers ->", ids);
      if (duplicates.length > 0) {
        console.warn(
          "[DEBUG placement] Duplicate IDs detected in placedPlayers:",
          duplicates
        );
      }
    },
    { deep: true }
  );

  watch(
    placedPlayerObjects,
    (newVal) => {
      const summary = newVal.map((player) => player?.name ?? "<missing>");
      console.log(
        "[DEBUG placement] placedPlayerObjects computed ->",
        summary
      );
    },
    { deep: true }
  );
}

onMounted(async () => {
  // STEP 1: Game ID aus der Route extrahieren
  gameId.value = route.params.gameId as string;

  // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
  // console.log("[LISTENER] Prüfe VOR aufbau onMounted :", input);
  try {
    // STEP 2: Supabase-Dokument für die Spielsession holen
    const { data: sessionData, error } = await supabase
      .from("game_session")
      .select("*")
      .eq("id", gameId.value)
      .single();

    if (error) {
      console.error("Fehler beim Laden der Session:", error);
      return;
    }

    if (sessionData) {
      // STEP 3: Daten aus dem Dokument extrahieren
      const temp = sessionData.players;
      currentRound.value = sessionData.current_round;
      console.log(" [onMounted] das sind data.players daten: ", temp);

      // STEP 4: Spieler lokal setzen
      players.value = sessionData.players || [];
      // STEP 5: Antworten auslesen und playerCount ermitteln
      const answersMap = sessionData.current_round?.answers || {};
      playerCount.value = Object.keys(answersMap).length;
      // STEP 6: Aktiven Spieler anhand der ID setzen
      activePlayer.value =
        players.value.find((p) => p.id === sessionData.current_round?.activePlayerId) ||
        null;
      console.log(
        "[onMounted] activePlayer wurde aktualisiert",
        activePlayer.value
      );

      // STEP 7: Bereits gesetzte Spieler (IDs) in placedPlayers übernehmen
      const dbPlacedPlayers = sessionData.current_round?.placedPlayers || [];
      placedPlayers.value = dbPlacedPlayers
        .map((entry: any) =>
          typeof entry === "string"
            ? players.value.find((player: Player) => player.id === entry)
            : (entry as Player)
        )
        .filter((player: Player | undefined): player is Player => !!player);
      // STEP 8: Statusflags setzen
      sortingStarted.value = sessionData.current_round?.sortingStarted || false;
      sortingFinished.value = sessionData.current_round?.sortingFinished || false;
    } else {
      console.error("Room-Dokument nicht gefunden.");
    }

    //------------
    // Listeners
    //------------

    // Hinzufügen des Supabase Listeners, um Änderungen in Echtzeit zu verfolgen
    const realtimeChannel = supabase
      .channel(`estimation-${gameId.value}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_session',
          filter: `id=eq.${gameId.value}`
        },
        async (payload) => {
          console.log("[LISTENER START] postgres_changes wurde getriggert");
          
          const data = payload.new as any;
          if (!data) return;
          // keep currentRound in sync so currentQuestion (computed) can update
          currentRound.value = data.current_round || null;
          console.log("[LISTENER 0] currentRound synchronisiert", currentRound.value);

          // 1. Update sortingStarted from currentRound
          // Der Host hat "spiel Starten" geklicked.
          sortingStarted.value = data.current_round?.sortingStarted || false;
          console.log(
            "[LISTENER 1]sortingStarted wurde aktualisiert",
            sortingStarted.value
          );

          // 2. Spieler-Liste ZUERST aktualisieren (wichtig für Mappings)
          players.value = data.players;
          console.log("[LISTENER 2] players wurde aktualisiert", players.value);

          // 3. EstimationOrder laden und in Player-Objekte mappen
          const orderEntries = data.current_round?.estimationOrder || [];
          console.log("[LISTENER 3] orderIds from DB:", orderEntries);
          order.value = orderEntries
            .map((entry: any) =>
              typeof entry === "string"
                ? players.value.find((player: Player) => player.id === entry)
                : (entry as Player)
            )
            .filter((player: Player | undefined): player is Player => !!player);
          console.log("[LISTENER 4] order.value wurde aktualisiert", order.value);

          // 4. placedPlayers laden (IDs)
          const placedIdsFromDb = data.current_round?.placedPlayers || [];
          placedPlayers.value = placedIdsFromDb
            .map((entry: any) =>
              typeof entry === "string"
                ? players.value.find((player: Player) => player.id === entry)
                : (entry as Player)
            )
            .filter((player: Player | undefined): player is Player => !!player);
          console.log(
            "[LISTENER 6] placedPlayers IDs aktualisiert",
            placedPlayers.value.map((player) => player.id)
          );

          // 5. aktiven Spieler aktualisieren
          activePlayer.value =
            players.value.find((p) => p.id === data.current_round?.activePlayerId) || null;
          console.log("[LISTENER 7] activePlayer wurde aktualisiert", activePlayer.value);
          // aktualisiere PlayerCount let
          const answersMap = data.current_round?.answers || {};
          playerCount.value = Object.keys(answersMap).length;
          console.log(
            "[LISTENER 7] playerCount wurde aktualisiert",
            playerCount.value
          );
          // 6. sorting finished aus der DB
          sortingFinished.value = data.current_round?.sortingFinished || false;
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
            data.current_round?.secondTurnStartPlayer || false;
          console.log(
            "[LISTENER 10] secondTurnStartPlayer wurde aktualisiert",
            secondTurnStartPlayer.value
          );

          PrepNextRound.value = data.current_round?.PrepNextRound || false;
          if (PrepNextRound.value) {
            console.log(
              "[LISTENER 11] PrepNextRound wurde aktualisiert",
              PrepNextRound.value
            );
            if (!isHost.value) {
              supabase.removeChannel(realtimeChannel);
              console.log(
                "[LISTENER 11.1] realtimeChannel entfernt (Client, nicht Host)"
              );
            }
            router.push(`/prepare/${gameId.value}`);
          }

          console.log("[Listener LAST] ENDE aller aktualisierungen");
        }
      )
      .subscribe();

    // unsubscribeFn für onBeforeUnmount setzen
    unsubscribeFn = () => {
      supabase.removeChannel(realtimeChannel);
    };
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
    const { error } = await supabase
      .from("game_session")
      .update({
        players: players.value,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gameId.value);
    
    if (error) {
      console.error(
        " [SUBMIT REORDER] Fehler beim Speichern der Schätzreihenfolge:",
        error
      );
      return;
    }
    
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
  
  // Proof: Session erneut laden
  const { data: proofData, error: proofError } = await supabase
    .from("game_session")
    .select("players")
    .eq("id", gameId.value)
    .single();

  if (proofError) {
    console.log("[SUBMIT REORDER] Fehler beim Laden der Session:", proofError);
  } else {
    console.log("[SUBMIT REORDER] proof:", proofData?.players); // ✅ Hier bekommst du die Spieler aus der DB
  }
};
// -------------
// START GAME
// -------------

const startGame = async () => {
  // 1.Spiel vorbereitung
  sortingStarted.value = true;
  console.log(
    "[StartGame] -> PlacedPlayers:",
    placedPlayerNames.value
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
  activePlayer.value = order.value.length > 0 ? order.value[0] : null;
  console.log("[StartGame] activePlayer.value:", activePlayer.value);

  // activer spieler legt sein plättchen
  placedPlayers.value = order.value.length > 0 ? [order.value[0]] : [];
  console.log("[StartGame] placedPlayers.value:", placedPlayers.value);

  // Aktuelle Session laden um current_round zu mergen
  const { data: currentSession, error: loadError } = await supabase
    .from("game_session")
    .select("current_round")
    .eq("id", gameId.value)
    .single();

  if (loadError) {
    console.error("Fehler beim Laden der Session:", loadError);
    return;
  }

  const existingRound = currentSession?.current_round || {};
  const updatedRound = {
    ...existingRound,
    sortingStarted: sortingStarted.value,
    estimationOrder: order.value,
    activePlayerId: activePlayer.value?.id || null,
    placedPlayers: placedPlayers.value.map((p) => p.id),
  };

  const { error } = await supabase
    .from("game_session")
    .update({
      current_round: updatedRound,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId.value);

  if (error) {
    console.error("Fehler beim Aktualisieren der Session:", error);
    return;
  }

  console.log(
    "[StartGame] END -> PlacedPlayers:",
    placedPlayerNames.value
  );
  console.log("unnessesaryFunction");
  unnessesaryFunction();
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
  const roomRef = gameId.value;
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
    // Save placedPlayers IDs in a temp variable before update
    const tempPlacedIds = placedPlayers.value.map((p) => p.id);
    // Schritt 1: sortingFinished speichern
    const { data: sortingFinishedSnapshot } = await supabase
      .from("game_session")
      .select("current_round")
      .eq("id", roomRef)
      .single();
    await supabase
      .from("game_session")
      .update({
        current_round: {
          ...((sortingFinishedSnapshot?.current_round as any) || {}),
          sortingFinished: sortingFinished.value,
        },
      })
      .eq("id", roomRef);
    // Schritt 2: placedPlayers aus temp erneut speichern
    const { data: placedPlayersSnapshot } = await supabase
      .from("game_session")
      .select("current_round")
      .eq("id", roomRef)
      .single();
    await supabase
      .from("game_session")
      .update({
        current_round: {
          ...((placedPlayersSnapshot?.current_round as any) || {}),
          placedPlayers: tempPlacedIds,
        },
      })
      .eq("id", roomRef);
  }

  if (!sortingFinished.value) {
    // 1. spieler hat ggf änderungen in der reihenfolge on placedPlayers vorgenommen
    const { data: placedPlayersBeforeUpdate } = await supabase
      .from("game_session")
      .select("current_round")
      .eq("id", roomRef)
      .single();
    await supabase
      .from("game_session")
      .update({
        current_round: {
          ...((placedPlayersBeforeUpdate?.current_round as any) || {}),
          placedPlayers: placedPlayers.value.map((p) => p.id),
        },
      })
      .eq("id", roomRef);
    console.log(
      "[FINISED TURN 01] lokale änderungen an placedPlayers in die DB gespeichert:",
      placedPlayers.value.map((p) => p.name)
    );

    // 2. Nächster Spieler ist an der Reihe.
    const { data: freshData } = await supabase
      .from("game_session")
      .select("current_round")
      .eq("id", roomRef)
      .single();
    order.value = (freshData?.current_round?.estimationOrder || []) as Player[];

    console.log("[FINISED TURN 02] Order aus der DB geholt", order.value);

    const trimmedOrder = order.value.slice(1);
    order.value = trimmedOrder;

    console.log("[FINISED TURN 03] order lokal aktualisiert", order.value);
    console.log("[FINISED TURN 04] update von order -> START");
    // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

    const { data: orderSnapshot } = await supabase
      .from("game_session")
      .select("current_round")
      .eq("id", roomRef)
      .single();
    const orderPayload = trimmedOrder.map((player) => ({ ...player }));
    await supabase
      .from("game_session")
      .update({
        current_round: {
          ...((orderSnapshot?.current_round as any) || {}),
          estimationOrder: orderPayload,
        },
      })
      .eq("id", roomRef);
    console.log("[FINISED TURN 05] update von order -> END");

    // 3. Aktiver Spieler wird aktualisiert
    //HIER MUSS MAN PRÜFEN wieso man activePlayer.value = players.value[0] setzt und nicht activePlayer.value = order.value[0]

    console.log("[FINISED TURN 05.1] order.value:", order.value);
    console.log("[FINISED TURN 05.2] player.value:", players.value);
    const nextActivePlayer =
      trimmedOrder.length > 0 ? trimmedOrder[0] : players.value[0];
    if (nextActivePlayer) {
      console.log("[FINISED TURN 05.3] order.value[0] wird aktualisiert und ist nicht leer");
      activePlayer.value = nextActivePlayer;
    } else {
      console.log("FINISED TURN 05.4]Order ist leer, players.value[0] wird aktualisiert");
      activePlayer.value = players.value[0];
    }

    console.log(
      "[FINISED TURN 06] activePlayer wurde lokal aktualisiert",
      activePlayer.value
    );

    console.log("[FINISED TURN 07] update von activePlayerId -> START");
    // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
    // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

    const { data: activePlayerSnapshot } = await supabase
      .from("game_session")
      .select("current_round")
      .eq("id", roomRef)
      .single();
    await supabase
      .from("game_session")
      .update({
        current_round: {
          ...((activePlayerSnapshot?.current_round as any) || {}),
          activePlayerId: activePlayer.value?.id || null,
        },
      })
      .eq("id", roomRef);
    console.log("[FINISED TURN 08] update von activePlayer -> END");

    // 4. Der aktive Spieler legt sein Plättchen in die Tischmitte
    if (trimmedOrder.length > 1) {
      const nextPlacedPlayer = trimmedOrder[0];
      if (nextPlacedPlayer) {
        placedPlayers.value.push(nextPlacedPlayer);
      }
      console.log(
        "[FINISED TURN 09] placedPlayer wurde lokal aktualisiert",
        placedPlayers.value
      );

      console.log("[FINISED TURN 11] update von placedPlayer -> START");
      // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      // console.log("[FINISED TURN] Prüfe VOR update DB? :", input);

      const { data: placedPlayersAfterPush } = await supabase
        .from("game_session")
        .select("current_round")
        .eq("id", roomRef)
        .single();
      await supabase
        .from("game_session")
        .update({
          current_round: {
            ...((placedPlayersAfterPush?.current_round as any) || {}),
            placedPlayers: placedPlayers.value.map((p) => p.id),
          },
        })
        .eq("id", roomRef);
      console.log("[FINISED TURN 12] update von placedPlayer -> END");
    } else {
      // wenn order => [p0], weil order>1 = false
      console.log("[FLAST TURN 101] Startspieler darf letzten Zug machen.");
      console.log("[FLAST TURN 102] update von secondTurnStartPlayer -> START");

      secondTurnStartPlayer.value = true;
      const { data: secondTurnSnapshot } = await supabase
        .from("game_session")
        .select("current_round")
        .eq("id", roomRef)
        .single();
      await supabase
        .from("game_session")
        .update({
          current_round: {
            ...((secondTurnSnapshot?.current_round as any) || {}),
            secondTurnStartPlayer: secondTurnStartPlayer.value,
          },
        })
        .eq("id", roomRef);
      console.log("[FLAST TURN 103] update von sortingFinished -> END");
      // const input = prompt("Bitte gib etwas ein, bevor es weitergeht:");
      // console.log("[FLAST TURN 104] Prüfe VOR update DB? :", input);
    }
    console.log("[FINISED TURN 13] RETURNING");
    return;
  }

  console.log("[FLAST TURN 105] Update lokal changes placedPlayer -> START");

  const { data: placedPlayersFinalSnapshot } = await supabase
    .from("game_session")
    .select("current_round")
    .eq("id", roomRef)
    .single();
  await supabase
    .from("game_session")
    .update({
      current_round: {
        ...((placedPlayersFinalSnapshot?.current_round as any) || {}),
        placedPlayers: placedPlayers.value.map((p) => p.id),
      },
    })
    .eq("id", roomRef);
  console.log(
    "[FLAST TURN 106] lokale änderungen an placedPlayers in die DB gespeichert:",
    placedPlayers.value.map((p) => p.name)
  );

  console.log("[FLAST TURN 107] Update lokal changes placedPlayer -> END");
  console.log("[FLAST TURN 108] Alle Spieler wurden platziert. 🎉");
  console.log(
    "[FLAST TURN 109] update von sortingFinished & sortingStarted -> START"
  );
  const { data: sortingFlagsSnapshot } = await supabase
    .from("game_session")
    .select("current_round")
    .eq("id", roomRef)
    .single();
  await supabase
    .from("game_session")
    .update({
      current_round: {
        ...((sortingFlagsSnapshot?.current_round as any) || {}),
        sortingFinished: sortingFinished.value,
        sortingStarted: sortingStarted.value,
      },
    })
    .eq("id", roomRef);
  FinishedViewCompundingFunc();
  console.log(
    "[FLAST TURN 110] update von sortingFinished & sortingStarted -> END"
  );
};

function unnessesaryFunction() {
  console.log("inFinishedPlacement ausgeführt");
  onFinishPlacement();
}
// -------------
// Move Button Funktion
// -------------
// Move player up or down in placedPlayers list
function movePlayer(direction: number) {
  const index = placedPlayers.value.findIndex((player) => player.id === localPlayerId);
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
    placedPlayers.value
  );
}

async function FinishedViewCompundingFunc() {
  console.log("[FinishedView] Funktion gestartet");

  const { data: freshData, error } = await supabase
    .from("game_session")
    .select("*")
    .eq("id", gameId.value)
    .single();

  if (error || !freshData) {
    console.error("[FinishedView] Dokument nicht gefunden:", gameId.value, error);
    return;
  }

  console.log("[FinishedView] Daten geladen:", freshData);

  const playersData = freshData.players || [];
  const answers = freshData.current_round?.answers || {};
  const placedIds = freshData.current_round?.placedPlayers || [];

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
  // Aktuelle Session laden um current_round zu mergen
  const { data: currentSession, error: loadError } = await supabase
    .from("game_session")
    .select("current_round")
    .eq("id", gameId.value)
    .single();

  if (loadError) {
    console.error("Fehler beim Laden der Session:", loadError);
    return;
  }

  const existingRound = currentSession?.current_round || {};
  const updatedRound = {
    ...existingRound,
    PrepNextRound: true,
    phase: "prepaire",
  };

  const { error } = await supabase
    .from("game_session")
    .update({
      current_round: updatedRound,
      updated_at: new Date().toISOString(),
    })
    .eq("id", gameId.value);

  if (error) {
    console.error("Fehler beim Aktualisieren der Session:", error);
    return;
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
ion-list {
  background: transparent;
  max-width: 440px;
  margin: 0 auto 16px auto;
  border-radius: 18px;
  padding: 0;
  box-shadow: none;
}

ion-item {
  --background: #e4f9ce !important; /* Helles, freundliches Grün */
  background: #e4f9ce !important;
  margin: 8px 0;
  border-radius: 16px;
  --color: #385028;
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.07rem;
  min-height: 42px;
  box-shadow: 0 2px 8px 0 #d3e9b6a0;
}

ion-label {
  color: #385028;
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.08rem;
  padding-left: 2px;
  padding-bottom: 2px;
  line-height: 1.3;
}

ion-badge {
  font-size: 0.89rem;
  font-weight: 600;
  padding: 5px 14px;
  border-radius: 8px;
  margin-left: 12px;
  margin-top: 2px;
  letter-spacing: 0.02em;
}

/* Info: bei dunklem Hintergrund Badge ggf. invertieren */
ion-badge[color="primary"] {
  --background: #59981a !important;
  --color: #edffcc !important;
}
ion-badge[color="medium"] {
  --background: #91a095 !important;
  --color: #fff !important;
}

@media (max-width: 520px) {
  ion-list {
    max-width: 97vw;
    border-radius: 12px;
  }
  ion-item {
    border-radius: 10px;
    font-size: 1.01rem;
  }
}
h3,
p.green {
  color: #59981a;
  font-family: "Tenor Sans", Arial, sans-serif;
}

ion-reorder-group {
  margin-bottom: 16px;
}
.info-text {
  display: block;
  text-align: center;
  margin: 12px 0;
  font-size: 16px;
  color: #59981a;
  font-family: "Tenor Sans", Arial, sans-serif;
}

.center-wrapper {
  max-width: 700px; /* Oder 540px, je nach Geschmack */
  margin: 0 auto;
  padding: 0 18px; /* für mobile etwas Abstand */
  width: 100%;
  box-sizing: border-box;
}
@media (max-width: 750px) {
  .center-wrapper {
    max-width: 98vw;
    padding: 0 6px;
  }
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

ion-toolbar {
  --background: #59981a;
  --color: #edffcc;
  --min-height: 54px;
  --padding-start: 0;
  --padding-end: 0;
  box-shadow: none;
  border-bottom: none;
  font-family: "Tenor Sans", Arial, sans-serif;
  /* display, align-items, justify-content entfernen! */
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
  width: 100%;
  display: block;
}

ion-button {
  --background: #59981a;
  --color: #edffcc;
  --border-radius: 9px;
  --box-shadow: none;
  --border-width: 0;
  width: 100%;
  min-height: 54px;
  font-size: 1.19rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  padding: 0;
  margin: 16px 0 0 0;
  transition: transform 0.08s;
}
.buttons {
  --background: #59981a !important;
  --color: #edffcc !important;
  --border-radius: 9px !important;
  font-size: 1.19rem !important;
  font-weight: 600 !important;
  letter-spacing: 0.03em !important;
  min-height: 54px !important;
  margin-top: 16px !important;
  width: 100%;
}

ion-button:active {
  transform: scale(0.97);
}

ion-button[color="medium"] {
  --background: #91a095;
  --color: #fff;
}
.estimation-buttons-wrapper {
  max-width: 440px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.question-wrapper {
  max-width: 440px;
  margin: 0 auto 20px auto;
  padding: 18px 18px 12px 18px;
  background:#e4f9ce;
  border-radius: 14px;
  box-shadow: 0 2px 12px 0 #d3e9b633;
  text-align: center;
}
.question-title {
  color: #59981a;
  font-family: "Tenor Sans", Arial, sans-serif;
  font-size: 1.14rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: 0.01em;
}
.question-text {
  color: #385028;
  font-size: 1.12rem;
  font-family: "Tenor Sans", Arial, sans-serif;
  font-style: italic;
  margin-bottom: 8px;
}
.player-order-list {
  list-style: none;
  padding: 0;
  margin: 12px 0 0 0;
  text-align: left;
  color: #385028;
  
}
.player-order-list li.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
  color: #385028;
}
.player-order-list li {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #385028 !important;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.02rem;
  margin: 0 0 8px 0;
}
.host-label {
  font-size: 0.92em;
  color: #b7d065;
  margin-left: 5px;
}

.move-button-row {
  display: flex;
  justify-content: center;
  gap: 80px;
  margin-bottom: 8px;
}

.icon-button {
  min-width: 44px !important;
  min-height: 44px !important;
  width: 44px;
  height: 44px;
  max-width: 44px;
  max-height: 44px;
  border-radius: 12px;
  padding: 0;
  font-size: 1.6rem;
  --background: #59981a;
  --color: #edffcc;
  --box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.finish-button {
  width: 200px;
  /* ...restliche Styles */
}
.finish-button-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px; /* Abstand zu den Move-Buttons */
  width: 100%; /* Breite auf 100% für flexbox zentrierung */
}

@media (max-width: 520px) {
  .finish-button {
    width: 100% !important;
    min-width: 0;
  }
  .finish-button-wrapper {
    padding: 0 18px;
  }
}
.prepare-center-wrapper {
  max-width: 540px;
  margin: 0 auto;
  padding: 0 18px;
  width: 100%;
  box-sizing: border-box;
}
.player-list-wrapper {
  background: #f7fbe9;
  border-radius: 14px;
  box-shadow: 0 2px 12px 0 #d3e9b633;
  margin-bottom: 18px;
  padding: 20px 20px 10px 20px;
  text-align: left;
}
.player-list-title {
  color: #59981a;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.15rem;
  font-weight: 700;
  margin-bottom: 6px;
}
.player-order-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.player-order-list li {
  color: #385028;
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 1.02rem;
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.host-label {
  font-size: 0.92em;
  color: #b7d065;
  margin-left: 5px;
}
.prepare-buttons-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  margin: 0 auto 0 auto;
  align-items: center;
}
</style>
