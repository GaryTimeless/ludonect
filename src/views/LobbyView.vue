h<template>
  <v-container class="lobby-container fade-in">
    <div class="lobby-content">
    <div class="lobby-header">
      <router-link to="/">
        <img
          src="@/assets/ludonect_combo.png"
          alt="Ludonect Logo"
          class="ludonect-logo scale-in"
        />
      </router-link>
      <div class="lobby-lang-switcher">
        <LanguageSwitcher />
      </div>
    </div>

    <!-- Play Buttons -->
    <div v-if="!roomCode">
      <template v-if="mode === 'start'">
        <!-- Main Action Buttons -->
        <div class="lobby-buttons">
          <!-- Primary CTA -->
          <v-btn
            color="primary"
            variant="elevated"
            size="large"
            block
            rounded="pill"
            elevation="0"
            class="btn-press"
            @click="mode = 'create'"
          >
            {{ t('lobby.createRoom') }}
          </v-btn>

          <!-- Secondary action — white elevated -->
          <v-btn
            color="white"
            variant="elevated"
            size="large"
            block
            rounded="pill"
            elevation="0"
            class="btn-press text-primary"
            @click="mode = 'join'"
          >
            {{ t('lobby.joinRoom') }}
          </v-btn>

          <!-- Tertiary — How to Play -->
          <v-btn
            variant="outlined"
            color="primary"
            block
            rounded="pill"
            elevation="0"
            @click="showHowToPlay = !showHowToPlay"
          >
            {{ showHowToPlay ? t('lobby.showLess') : t('lobby.howToPlay') }}
          </v-btn>

          <transition name="fade">
            <v-card v-if="showHowToPlay" class="mt-2" elevation="2">
              <v-card-text class="how-to-play">
                <strong>{{ t('lobby.howToPlayTitle') }}</strong>

                <ol>
                  <li>{{ t('lobby.howToPlayStep1') }}</li>
                  <li>
                    {{ t('lobby.howToPlayStep2') }}<br />
                    <small>{{ t('lobby.howToPlayStep2sub') }}</small>
                  </li>
                  <li>{{ t('lobby.howToPlayStep3') }}</li>
                  <li>{{ t('lobby.howToPlayStep4') }}</li>
                  <li>{{ t('lobby.howToPlayStep5') }}</li>
                </ol>

                <div class="example-questions">
                  <div><strong>{{ t('lobby.exampleQuestions') }}</strong></div>
                  <ul>
                    <li>
                      {{ t('lobby.exampleQ1') }}<br />
                      <span class="example-scale">{{ t('lobby.exampleQ1scale') }}</span>
                    </li>
                    <li>
                      {{ t('lobby.exampleQ2') }}<br />
                      <span class="example-scale">{{ t('lobby.exampleQ2scale') }}</span>
                    </li>
                    <li>
                      {{ t('lobby.exampleQ3') }}<br />
                      <span class="example-scale">{{ t('lobby.exampleQ3scale') }}</span>
                    </li>
                  </ul>
                </div>
              </v-card-text>
            </v-card>
          </transition>
        </div>
      </template>

      <!-- Raum erstellen -->
      <template v-else-if="mode === 'create'">
        <v-card class="lobby-room-card" elevation="3">
          <v-card-text>
            <v-text-field
              v-model="playerName"
              :label="t('lobby.yourName')"
              variant="outlined"
              :maxlength="20"
              counter
              class="mb-4"
            />
            <v-select
              v-model="selectedCatalog"
              :items="catalogOptions"
              item-title="name"
              item-value="key"
              label="Fragenkatalog"
              variant="outlined"
              class="mb-4"
            />
            <v-btn
              color="primary"
              size="x-large"
              block
              :disabled="!playerName"
              @click="createRoom"
              class="btn-press mb-2"
            >
              {{ t('lobby.create') }}
            </v-btn>
            <v-btn
              variant="outlined"
              color="primary"
              block
              @click="mode = 'start'"
              class="btn-press"
            >
              {{ t('common.back') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </template>

      <!-- Join Room -->
      <template v-else-if="mode === 'join'">
        <v-card class="lobby-room-card" elevation="3">
          <v-card-text>
            <v-text-field
              v-model="joinCode"
              :label="t('lobby.enterRoomCode')"
              variant="outlined"
              :maxlength="6"
              @input="onJoinCodeInput"
              class="mb-4"
            />
            <v-text-field
              v-model="playerName"
              :label="t('lobby.yourName')"
              variant="outlined"
              :maxlength="20"
              counter
              class="mb-4"
            />
            <v-btn
              color="primary"
              size="x-large"
              block
              :disabled="!joinCode || !playerName"
              @click="joinRoom"
              class="btn-press mb-2"
            >
              {{ t('lobby.join') }}
            </v-btn>
            <v-btn
              variant="outlined"
              color="primary"
              block
              @click="mode = 'start'"
              class="btn-press"
            >
              {{ t('common.back') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </template>
    </div>

    <!-- After Login / echte Lobby -->
    <div v-else>
      <v-card class="lobby-room-card" elevation="3">
        <v-card-text>
          <h2 class="room-code text-center text-primary">
            {{ t('lobby.roomCode') }}: <strong>{{ roomCode }}</strong>
          </h2>

          <!-- Shareable Link Section -->
          <v-card v-if="shareLink" class="share-section" color="surface-variant" elevation="0">
            <v-card-text>
              <p class="text-caption text-medium-emphasis mb-2">
                {{ t('lobby.shareLink') }}
              </p>
              <div class="share-link-container">
                <input
                  readonly
                  :value="shareLink"
                  class="share-link-input"
                  @click="selectLinkText"
                />
                <v-btn
                  @click="copyShareLink"
                  icon="mdi-content-copy"
                  size="small"
                  variant="outlined"
                  color="primary"
                />
                <v-btn
                  v-if="canUseNativeShare"
                  @click="nativeShare"
                  icon="mdi-share-variant"
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              </div>
            </v-card-text>
          </v-card>

          <p class="player-label">{{ t('lobby.players') }}</p>
          <v-list class="player-list" bg-color="transparent">
            <v-list-item
              v-for="player in playersInRoom"
              :key="player.id"
              class="player-item"
            >
              <template #prepend>
                <v-avatar size="40" color="transparent">
                  <span v-if="player.animalIcon" class="animal-icon">{{ player.animalIcon }}</span>
                  <span v-else :style="{ background: getPlayerColor(player.id) }" class="avatar-initial">
                    {{ player.name.charAt(0).toUpperCase() }}
                  </span>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ player.name }}
                <v-chip v-if="player.id === currentPlayerId" size="x-small" class="ml-2" color="accent">
                  {{ t('common.you') }}
                </v-chip>
              </v-list-item-title>
              <template #append v-if="player.isHost">
                <v-icon icon="mdi-crown" color="accent" />
              </template>
            </v-list-item>
          </v-list>

          <v-btn
            v-if="canStartGame"
            color="success"
            size="x-large"
            block
            @click="startGame"
            class="btn-press mt-4"
          >
            {{ t('lobby.startGame') }}
          </v-btn>
          <p v-else-if="isHost" class="text-center text-medium-emphasis text-caption mt-4">
            {{ t('lobby.minPlayers') }}
          </p>

          <div class="mt-4">
            <FunButton />
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar v-model="snackbar" :timeout="2000" color="success">
      {{ snackbarText }}
    </v-snackbar>

    <!-- Dev Reset — dezenter Footer-Link -->
    <div class="dev-footer">
      <v-btn
        variant="text"
        size="small"
        color="grey"
        @click="resetLocalPlayer"
      >
        🧪 Dev Reset
      </v-btn>
    </div>
    </div> <!-- end lobby-content -->
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import FunButton from "@/components/FunButton.vue";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";
import { socketService } from "@/services/socketService";
import { catalogs, getCatalogQuestions } from "@/catalogs";

const catalogOptions = catalogs.map(c => ({ key: c.key, name: c.name }));
const selectedCatalog = ref('basic');

const { t } = useI18n();

const showHowToPlay = ref(false);
const router = useRouter();
const route = useRoute();

const roomCode = ref("");
const shareLink = ref("");
const joinCode = ref("");
const playerName = ref("");
const mode = ref<"start" | "create" | "join">("start");
const snackbar = ref(false);
const snackbarText = ref("");

// Get game state from socket service
const gameState = computed(() => socketService.gameState.value);
const playersInRoom = computed(() => gameState.value?.players || []);
const currentPlayerId = computed(() => localStorage.getItem('playerId') ?? socketService.getSocketId() ?? '');
const isHost = computed(() => gameState.value?.hostId === currentPlayerId.value);
const canStartGame = computed(() => isHost.value && playersInRoom.value.length >= 2);
const canUseNativeShare = computed(() => 'share' in navigator);

// iOS 14-compatible UUID generator (crypto.randomUUID requires Safari 15.4+)
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: uses crypto.getRandomValues (available since iOS 8)
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant RFC4122
  return [...bytes].map((b, i) =>
    ([4, 6, 8, 10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0')
  ).join('');
}

// Persistent player ID (UUID from localStorage)
function getOrCreatePlayerId(): string {
  let id = localStorage.getItem('playerId');
  if (!id) {
    id = generateUUID();
    localStorage.setItem('playerId', id);
  }
  return id;
}

// Generate consistent colors for players
const playerColors = ['#9C27B0', '#FF9800', '#2196F3', '#4CAF50', '#F44336', '#00BCD4'];
function getPlayerColor(playerId: string): string {
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return playerColors[hash % playerColors.length];
}

// Check if joining via link (URL parameter)
onMounted(() => {
  getOrCreatePlayerId();
  // Pre-fill name from last session
  const savedName = localStorage.getItem('playerName');
  if (savedName) playerName.value = savedName;

  const roomCodeFromRoute = route.params.roomCode as string;
  if (roomCodeFromRoute) {
    joinCode.value = roomCodeFromRoute.toUpperCase();
    mode.value = 'join';
  }

  // Restore room code if we already have an active game (e.g. after reconnect)
  const existingGame = socketService.gameState.value;
  if (existingGame?.roomCode) {
    roomCode.value = existingGame.roomCode;
  }
});

// Watch for game state changes to update room code
watch(gameState, (newState) => {
  if (newState && newState.roomCode) {
    roomCode.value = newState.roomCode;
  }
});

function onJoinCodeInput(event: Event) {
  const input = event.target as HTMLInputElement;
  joinCode.value = input.value.toUpperCase();
}

async function createRoom() {
  if (!playerName.value.trim()) {
    alert(t('lobby.nameRequired'));
    return;
  }
  const playerId = getOrCreatePlayerId();
  localStorage.setItem('playerName', playerName.value.trim());
  try {
    const response = await socketService.emit('createRoom', {
      playerName: playerName.value.trim(),
      catalog: selectedCatalog.value,
      playerId,
    });
    roomCode.value = response.roomCode;
    socketService.setRoomContext(response.roomCode);
    // Build shareLink dynamically so it works on any domain (localhost / ludonect.de)
    shareLink.value = `${window.location.origin}/join/${response.roomCode}`;
    console.log('[Lobby] Room created:', response);
  } catch (error: any) {
    console.error('[Lobby] Create room error:', error);
    alert(error.message || t('lobby.createError'));
  }
}

async function joinRoom() {
  if (!playerName.value.trim()) {
    alert(t('lobby.nameRequired'));
    return;
  }
  if (!joinCode.value.trim()) {
    alert(t('lobby.codeRequired'));
    return;
  }
  const playerId = getOrCreatePlayerId();
  localStorage.setItem('playerName', playerName.value.trim());
  try {
    const code = joinCode.value.toUpperCase().trim();
    await socketService.emit('joinRoom', {
      roomCode: code,
      playerName: playerName.value.trim(),
      playerId,
    });
    roomCode.value = code;
    socketService.setRoomContext(code);
    console.log('[Lobby] Joined room:', code);
  } catch (error: any) {
    console.error('[Lobby] Join room error:', error);
    if (error.message === 'GAME_ALREADY_STARTED') {
      router.push('/game-running');
    } else {
      alert(error.message || t('lobby.joinError'));
    }
  }
}

function resetLocalPlayer() {
  localStorage.removeItem('playerId');
  localStorage.removeItem('playerName');
  socketService.clearRoomContext();
  window.location.reload();
}

async function startGame() {
  try {
    const catalog = socketService.gameState.value?.catalog ?? 'basic';
    const questions = getCatalogQuestions(catalog);
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
    snackbarText.value = t('lobby.linkCopied');
    snackbar.value = true;
  } catch (error) {
    console.error('Copy failed:', error);
    const input = document.querySelector('.share-link-input') as HTMLInputElement;
    if (input) {
      input.select();
      document.execCommand('copy');
      snackbarText.value = t('lobby.linkCopied');
      snackbar.value = true;
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
      title: 'Ludonect',
      text: `${t('lobby.roomCode')}: ${roomCode.value}`,
      url: shareLink.value,
    });
  } catch (error: any) {
    if (error.name !== 'AbortError') {
      copyShareLink();
    }
  }
}
</script>

<style scoped>
.lobby-header {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
}

.lobby-lang-switcher {
  position: absolute;
  top: 0;
  right: 0;
}

.ludonect-logo {
  width: 320px;
  max-width: 92vw;
  margin-bottom: 0;
  height: auto;
}

.lobby-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

@media (max-height: 700px) {
  .lobby-container {
    align-items: flex-start;
    padding-top: 32px;
  }
}

.lobby-content {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
}


/* Remove router-link underline from logo */
.lobby-header a {
  text-decoration: none;
  display: inline-block;
}

.lobby-buttons {
  width: 100%;
  max-width: 250px;
  margin: 32px auto 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.animal-icon {
  font-size: 22px;
  line-height: 1;
}

.avatar-initial {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  color: white;
  font-weight: bold;
  font-size: 16px;
}

.dev-footer {
  text-align: center;
  margin-top: 32px;
  opacity: 0.5;
}

.lobby-room-card {
  max-width: 500px;
  margin: 0 auto;
}

.room-code {
  margin: 16px 0 24px;
  font-size: 1.5rem;
  color: #59981A;
}

.player-label {
  font-weight: 700;
  margin: 24px 0 8px;
  font-size: 1.1rem;
  color: #385028;
}

.player-list {
  margin-bottom: 16px;
}

.player-item {
  background: #F5F5F5;
  border-radius: 12px;
  margin-bottom: 8px;
}

.share-section {
  margin: 16px 0 24px;
}

.share-link-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

.share-link-input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  font-family: 'Nunito', sans-serif;
}

.how-to-play {
  font-size: 15px;
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
  padding-top: 16px;
  border-top: 1px solid #e0e0e0;
}

.example-scale {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 600px) {
  .room-code {
    font-size: 1.2rem;
  }
}
</style>
