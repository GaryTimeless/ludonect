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
      </div>

      <!-- Play Buttons -->
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

          <!-- How to Play -->
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
                    <small>(Einigt euch grob, wie die Frage zu verstehen ist.)</small>
                  </li>
                  <li>Schätzt ein, wie die Antworten der Gruppe zueinander passen</li>
                  <li>Antworten werden aufgedeckt und gemeinsam besprochen</li>
                  <li>Nächste Runde!</li>
                </ol>

                <div class="example-questions">
                  <div><strong>Beispiel-Fragen:</strong></div>
                  <ul>
                    <li>
                      Wie oft schaust du Dokus?<br />
                      <span class="example-scale">0 = gar nicht | 100 = lieber als alles andere</span>
                    </li>
                    <li>
                      Wie spontan bist du?<br />
                      <span class="example-scale">0 = gar nicht | 100 = Wer hat Bock auf ein Eis?</span>
                    </li>
                    <li>
                      Wie gerne würdest du für einen Tag unsichtbar sein?<br />
                      <span class="example-scale">0 = gar nicht | 100 = muhahahaha</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </transition>
        </template>

        <!-- Raum erstellen -->
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
            >
              Raum erstellen
            </ion-button>
            <ion-button
              expand="block"
              @click="mode = 'start'"
              color="medium"
              class="inner-button"
            >
              Zurück
            </ion-button>
          </div>
        </template>

        <!-- Join Room -->
        <template v-else-if="mode === 'join'">
          <div class="lobby-room-wrapper">
            <ion-item>
              <ion-label position="floating">Raumcode eingeben</ion-label>
              <ion-input
                v-model="joinCode"
                :maxlength="6"
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
            >
              Beitreten
            </ion-button>
            <ion-button
              expand="block"
              @click="mode = 'start'"
              color="medium"
              class="inner-button"
            >
              Zurück
            </ion-button>
          </div>
        </template>
      </div>

      <!-- After Login / echte Lobby -->
      <div v-else>
        <div class="lobby-room-wrapper">
          <h2 class="room-code">
            Raumcode: <strong>{{ roomCode }}</strong>
          </h2>

          <!-- Shareable Link Section -->
          <div v-if="shareLink" class="share-section">
            <p style="margin: 8px 0; font-size: 14px; color: var(--ion-color-medium)">
              Teile diesen Link:
            </p>
            <div class="share-link-container">
              <input
                readonly
                :value="shareLink"
                class="share-link-input"
                @click="selectLinkText"
              />
              <ion-button @click="copyShareLink" size="small" fill="outline">
                <ion-icon :icon="copyOutline" slot="icon-only" />
              </ion-button>
              <ion-button
                v-if="canUseNativeShare"
                @click="nativeShare"
                size="small"
                fill="outline"
                color="secondary"
              >
                <ion-icon :icon="shareSocialOutline" slot="icon-only" />
              </ion-button>
            </div>
          </div>

          <p class="player-label">Spieler:</p>
          <ion-list>
            <ion-item v-for="player in playersInRoom" :key="player.id">
              <ion-label>
                {{ player.name }}
                <span v-if="player.id === currentPlayerId"> (Du)</span>
              </ion-label>
              <ion-icon slot="end" name="home" v-if="player.isHost" />
            </ion-item>
          </ion-list>

          <ion-button v-if="canStartGame" expand="block" @click="startGame">
            Spiel starten
          </ion-button>
          <p v-else-if="isHost" style="text-align: center; color: var(--ion-color-medium); font-size: 14px;">
            Mindestens 2 Spieler benötigt
          </p>

          <FunButton />
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
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
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { copyOutline, shareSocialOutline } from "ionicons/icons";
import questions from "@/questions.json";
import FunButton from "@/components/FunButton.vue";
import { socketService } from "@/services/socketService";
import type { Player } from "../../server/types";

const showHowToPlay = ref(false);
const router = useRouter();
const route = useRoute();

const roomCode = ref("");
const shareLink = ref("");
const joinCode = ref("");
const playerName = ref("");
const mode = ref<"start" | "create" | "join">("start");

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const playersInRoom = computed(() => gameState.value?.players || []);
const currentPlayerId = computed(() => socketService.getSocketId() || "");
const isHost = computed(() => gameState.value?.hostId === currentPlayerId.value);
const canStartGame = computed(() => isHost.value && playersInRoom.value.length >= 2);
const canUseNativeShare = computed(() => 'share' in navigator);

// Check if joining via link (URL parameter)
onMounted(() => {
  const roomCodeFromRoute = route.params.roomCode as string;
  if (roomCodeFromRoute) {
    joinCode.value = roomCodeFromRoute.toUpperCase();
    mode.value = 'join';
  }
});

// Watch for game state changes to update room code
watch(gameState, (newState) => {
  if (newState && newState.roomCode) {
    roomCode.value = newState.roomCode;
  }
});

function onJoinCodeInput(event: any) {
  joinCode.value = event.target.value.toUpperCase();
}

async function createRoom() {
  if (!playerName.value.trim()) {
    alert("Bitte gib einen Namen ein");
    return;
  }

  try {
    const response = await socketService.emit('createRoom', playerName.value.trim());
    roomCode.value = response.roomCode;
    shareLink.value = response.shareLink;
    console.log('[Lobby] Room created:', response);
  } catch (error: any) {
    console.error('[Lobby] Create room error:', error);
    alert(error.message || 'Fehler beim Erstellen des Raums');
  }
}

async function joinRoom() {
  if (!playerName.value.trim()) {
    alert("Bitte gib einen Namen ein");
    return;
  }

  if (!joinCode.value.trim()) {
    alert("Bitte gib einen Raumcode ein");
    return;
  }

  try {
    const code = joinCode.value.toUpperCase().trim();
    await socketService.emit('joinRoom', {
      roomCode: code,
      playerName: playerName.value.trim(),
    });
    roomCode.value = code;
    console.log('[Lobby] Joined room:', code);
  } catch (error: any) {
    console.error('[Lobby] Join room error:', error);
    alert(error.message || 'Raum existiert nicht!');
  }
}

async function startGame() {
  try {
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    await socketService.emit('startGame', {
      roomCode: roomCode.value,
      questionId: randomQuestion.id,
    });
    console.log('[Lobby] Game started with question:', randomQuestion.id);
  } catch (error: any) {
    console.error('[Lobby] Start game error:', error);
    alert(error.message || 'Fehler beim Starten des Spiels');
  }
}

function selectLinkText(event: Event) {
  const input = event.target as HTMLInputElement;
  input.select();
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(shareLink.value);
    alert('Link kopiert!');
  } catch (error) {
    console.error('Copy failed:', error);
    // Fallback: select the text
    const input = document.querySelector('.share-link-input') as HTMLInputElement;
    if (input) {
      input.select();
      document.execCommand('copy');
      alert('Link kopiert!');
    }
  }
}

async function nativeShare() {
  if (!navigator.share) {
    copyShareLink();
    return;
  }

  try {
    await navigator.share({
      title: 'Ludonect Spiel',
      text: `Tritt meinem Ludonect Raum bei! Code: ${roomCode.value}`,
      url: shareLink.value,
    });
  } catch (error: any) {
    // User cancelled or error occurred
    if (error.name !== 'AbortError') {
      console.error('Share failed:', error);
      copyShareLink();
    }
  }
}
</script>

<style scoped>
.lobby-header {
  text-align: center;
  margin-bottom: 24px;
}

.ludonect-logo {
  max-width: 200px;
  height: auto;
}

.lobby-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.lobby-room-wrapper {
  max-width: 500px;
  margin: 0 auto;
}

.room-code {
  text-align: center;
  margin: 16px 0;
}

.player-label {
  font-weight: 600;
  margin: 16px 0 8px;
}

.share-section {
  background: var(--ion-color-light);
  padding: 12px;
  border-radius: 8px;
  margin: 16px 0;
}

.share-link-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-link-input {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--ion-color-medium);
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.how-to-play {
  background: var(--ion-color-light);
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.how-to-play ol,
.how-to-play ul {
  margin: 12px 0;
  padding-left: 24px;
}

.how-to-play li {
  margin: 8px 0;
}

.example-questions {
  margin-top: 16px;
}

.example-scale {
  font-size: 12px;
  color: var(--ion-color-medium);
}

.inner-button {
  margin-top: 8px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
