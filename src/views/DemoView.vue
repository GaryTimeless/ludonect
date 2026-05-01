<template>
  <div class="demo-wrapper">
    <!-- Close Button -->
    <button class="demo-close" @click="closeDemo" :aria-label="t('demo.close')">✕</button>
    <!-- Language switcher -->
    <div class="demo-lang">
      <LanguageSwitcher />
    </div>

    <!-- ===== SCREEN 0: INTRO ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 0" class="demo-screen screen-intro" key="s0">
        <div class="demo-otter">🦦</div>
        <h2 class="demo-title">{{ t('demo.introTitle') }}</h2>
        <p class="demo-text">
          {{ t('demo.introText1') }}<br />
          {{ t('demo.introText2') }}
        </p>
        <p class="demo-hint">{{ t('demo.introHint') }}</p>
        <button class="demo-btn-primary" @click="goToScreen(1)">{{ t('demo.introCta') }}</button>
      </div>
    </transition>

    <!-- ===== SCREEN 1: QUESTION ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 1" class="demo-screen screen-question" key="s1">
        <div class="demo-round-label">{{ t('demo.round') }}</div>
        <div class="question-card">
          <h2 class="question-text">{{ t('demo.questionText') }}</h2>
        </div>

        <div class="slider-value-display">
          <span class="slider-value">{{ userAnswer }}</span>
        </div>

        <div class="slider-section">
          <div class="slider-poles">
            <span>{{ t('demo.sliderLow') }}</span>
            <span>{{ t('demo.sliderHigh') }}</span>
          </div>
          <div class="slider-track-wrap">
            <input
              id="demo-slider"
              type="range"
              min="0"
              max="100"
              v-model.number="userAnswer"
              @input="sliderMoved = true"
              class="demo-slider"
              :style="{ '--val': userAnswer }"
            />
          </div>
          <div class="slider-poles">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        <div v-if="!sliderMoved" class="demo-hint-inline">{{ t('demo.sliderHint') }}</div>

        <button
          class="demo-btn-primary"
          :class="{ 'btn-disabled': !sliderMoved }"
          :disabled="!sliderMoved"
          @click="submitAnswer"
        >
          {{ t('demo.submitAnswer') }}
        </button>

        <div class="hint-card">{{ t('demo.noRightWrong') }}</div>
      </div>
    </transition>

    <!-- ===== SCREEN 2: WAIT ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 2" class="demo-screen screen-wait" key="s2">
        <h2 class="demo-title">{{ t('demo.waitTitle') }}</h2>

        <div class="player-status-list">
          <div v-for="player in waitingPlayers" :key="player.name" class="player-status-item">
            <span v-if="player.done" class="status-icon done">✓</span>
            <span v-else class="status-icon pending pulse-dot">⏳</span>
            <span class="player-status-name">{{ player.name }}</span>
            <span class="player-status-label">{{ player.done ? t('demo.hasAnswered') : t('demo.isAnswering') }}</span>
          </div>
          <div class="player-status-item you-row">
            <span class="status-icon done">✓</span>
            <span class="player-status-name you-name">{{ t('demo.youLabel') }}</span>
            <span class="player-status-label">{{ t('demo.youAnswered') }}</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="{ width: waitProgress + '%' }"></div>
          </div>
          <p class="progress-label">
            {{ waitDone ? t('demo.progress5of5') : t('demo.progress4of5') }}
          </p>
        </div>

        <transition name="fade">
          <button v-if="waitDone" class="demo-btn-primary" @click="goToScreen(3)">
            {{ t('demo.nextToEstimation') }}
          </button>
        </transition>
      </div>
    </transition>

    <!-- ===== SCREEN 3: EXPLAIN ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 3" class="demo-screen screen-explain" key="s3">
        <h2 class="demo-title">{{ t('demo.explainTitle') }}</h2>
        <p class="demo-text">{{ t('demo.explainText1') }}</p>
        <p class="demo-highlight">{{ t('demo.explainHighlight') }}</p>
        <p class="demo-text">{{ t('demo.explainText2') }}</p>
        <button class="demo-btn-primary" @click="goToScreen(4)">{{ t('demo.explainCta') }}</button>
      </div>
    </transition>

    <!-- ===== SCREEN 4: RANK ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 4" class="demo-screen screen-rank" key="s4">
        <v-card class="estimation-card" elevation="3">
          <v-card-title class="text-center pt-4">
            <h2 style="font-size:1.2rem;color:#385028">{{ t('demo.rankTitle') }}</h2>
          </v-card-title>
          <v-card-text>
            <v-alert type="success" variant="tonal" class="mb-4" icon="mdi-account-arrow-right">
              <span style="color:#385028;font-weight:600">{{ t('demo.rankSubtitle') }}</span>
            </v-alert>

            <p class="text-center mb-4 text-medium-emphasis">{{ t('demo.rankHint') }}</p>

            <VueDraggable
              v-model="rankList"
              item-key="id"
              handle=".drag-handle"
              class="player-drag-list"
              @end="onDragEnd"
            >
              <template #item="{ element, index }">
                <v-card
                  class="placement-drag-item mb-2"
                  :class="{ 'my-turn': element.id === 'you' }"
                  elevation="2"
                >
                  <v-card-text class="d-flex align-center py-2">
                    <v-avatar :color="element.id === 'you' ? '#59981A' : getPlayerColor(element.id)" size="36" class="mr-3">
                      <span class="text-white font-weight-bold text-caption">
                        {{ (element.id === 'you' ? t('demo.youLabelUpper') : element.name).charAt(0) }}
                      </span>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="font-weight-medium">{{ index + 1 }}. {{ element.id === 'you' ? t('demo.youLabelUpper') : element.name }}</div>
                    </div>
                    <v-chip v-if="element.id === 'you'" size="small" color="success" class="mr-2">{{ t('common.you') }}</v-chip>
                    <v-icon v-if="element.id === 'you'" class="drag-handle" size="small">mdi-swap-vertical</v-icon>
                    <span v-else style="width:20px;display:inline-block" />
                  </v-card-text>
                </v-card>
              </template>
            </VueDraggable>

            <div v-if="!hasPlaced" class="text-center mt-3" style="color:#59981A;font-size:0.9rem">
              {{ t('demo.rankHint') }}
            </div>

            <v-btn
              color="success"
              size="x-large"
              block
              :disabled="!hasPlaced"
              @click="submitPlacement"
              class="mt-4"
            >
              <v-icon start>mdi-check</v-icon>
              {{ t('demo.rankDone') }}
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </transition>

    <!-- ===== SCREEN 5: REVEAL ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 5" class="demo-screen screen-reveal" key="s5">
        <h2 class="demo-title">{{ t('demo.revealTitle') }}</h2>
        <p class="demo-subtitle">{{ t('demo.revealSubtitle') }}</p>

        <div class="reveal-list">
          <div
            v-for="(item, index) in revealList"
            :key="item.id"
            class="reveal-item"
            :class="{
              'reveal-you': item.id === 'you',
              'reveal-visible': revealedCount > index
            }"
          >
            <span class="reveal-rank">{{ index + 1 }}.</span>
            <span class="reveal-name">{{ item.id === 'you' ? t('demo.youLabelUpper') : item.name }}</span>
            <span class="reveal-arrow">→</span>
            <span class="reveal-answer" :class="{ 'reveal-answer-you': item.id === 'you' }">
              {{ revealedCount > index ? item.answer : '?' }}
            </span>
            <span v-if="item.id !== 'you' && revealedCount > index" class="reveal-check">✓</span>
          </div>
        </div>

        <transition name="fade">
          <div v-if="revealedCount >= revealList.length" class="reveal-comment-box">
            <div class="reveal-fact">{{ t('demo.revealFact') }}</div>
            <div class="reveal-feedback">📍 {{ placementFeedback }}</div>
          </div>
        </transition>

        <transition name="fade">
          <button v-if="revealedCount >= revealList.length" class="demo-btn-primary" @click="goToScreen(6)">
            {{ t('demo.next') }}
          </button>
        </transition>
      </div>
    </transition>

    <!-- ===== SCREEN 6: OUTRO ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 6" class="demo-screen screen-outro" key="s6">
        <div class="demo-otter outro-otter">🦦</div>
        <h2 class="demo-title">{{ t('demo.outroTitle') }}</h2>
        <p class="demo-text">{{ t('demo.outroText') }}</p>

        <div class="q-catalog">
          <button class="q-catalog-toggle" @click="catalogOpen = !catalogOpen">
            <span>{{ catalogOpen ? t('demo.catalogClose') : t('demo.catalogOpen') }}</span>
            <span class="q-catalog-chevron" :class="{ open: catalogOpen }">&#9660;</span>
          </button>
          <transition name="catalog-expand">
            <div v-if="catalogOpen" class="q-catalog-list">
              <div v-for="q in sampleQuestions" :key="q.id" class="q-catalog-item">
                {{ getQuestionText(q) }}
              </div>
            </div>
          </transition>
        </div>

        <button class="demo-btn-primary" @click="goToPlay">{{ t('demo.playCta') }}</button>

        <div class="outro-trust">
          <span>{{ t('demo.trustNoLogin') }}</span>
          <span>{{ t('demo.trustNoDownload') }}</span>
          <span>{{ t('demo.trustReady60') }}</span>
        </div>

        <button class="demo-btn-secondary" @click="resetDemo">{{ t('demo.playAgain') }}</button>
        <button class="demo-btn-link" @click="closeDemo">{{ t('demo.backToOverview') }}</button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useLocaleQuestion } from '@/composables/useLocaleQuestion';
import LanguageSwitcher from '@/components/LanguageSwitcher.vue';
import VueDraggable from 'vuedraggable';
import allQuestions from '@/questions.json';

const router = useRouter();
const { t } = useI18n();
const { getQuestionText } = useLocaleQuestion();

// ── State ──────────────────────────────────────────────────────────────────
const currentScreen = ref(0);
const userAnswer = ref(50);
const sliderMoved = ref(false);
const userPlacement = ref<number | null>(null); // 1-indexed position in final list
const hasPlaced = ref(false);
const dragIndex = ref<number | null>(null);

// Wait screen
const waitDone = ref(false);
const waitProgress = ref(80);

// Reveal animation
const revealedCount = ref(0);

// Catalog
const catalogOpen = ref(false);
const sampleQuestions = allQuestions.slice(0, 15);

// ── Fictive players ────────────────────────────────────────────────────────
const demoPlayers = [
  { id: 'leila',  name: 'Leila',  answer: 91 },
  { id: 'jonas',  name: 'Jonas',  answer: 78 },
  { id: 'anna',   name: 'Anna',   answer: 45 },
  { id: 'markus', name: 'Markus', answer: 12 },
];

const waitingPlayers = ref([
  { name: 'Leila',  done: true },
  { name: 'Jonas',  done: true },
  { name: 'Anna',   done: true },
  { name: 'Markus', done: false },
]);

// ── Ranking list for Screen 4 ──────────────────────────────────────────────
// Initial order: Leila, Jonas, Anna, Markus, DU (at end so user must move)
const rankList = ref([
  { id: 'leila',  name: 'Leila' },
  { id: 'jonas',  name: 'Jonas' },
  { id: 'anna',   name: 'Anna' },
  { id: 'markus', name: 'Markus' },
  { id: 'you',    name: 'you' },
]);

// ── Helper: calculate actual position ─────────────────────────────────────
function getActualPosition(answer: number): number {
  const all = [...demoPlayers.map(p => p.answer), answer].sort((a, b) => b - a);
  return all.indexOf(answer) + 1;
}

// ── Computed ───────────────────────────────────────────────────────────────
const youIndex = computed(() => rankList.value.findIndex(p => p.id === 'you'));

const placementDescription = computed(() => {
  const idx = youIndex.value;
  if (idx < 0) return '';
  if (idx === 0) return t('demo.placementTop');
  const above = rankList.value[idx - 1]?.name;
  const below = rankList.value[idx + 1]?.name;
  if (!below) return t('demo.placementBehind', { pos: idx + 1, above });
  return t('demo.placementBetween', { pos: idx + 1, above, below });
});

const placementFeedback = computed(() => {
  if (userPlacement.value === null) return '';
  const actual = getActualPosition(userAnswer.value);
  const diff = Math.abs(userPlacement.value - actual);
  if (diff === 0) return t('demo.feedbackExact');
  if (diff === 1) return t('demo.feedbackClose');
  return t('demo.feedbackSurprise');
});

// Reveal list: the ranking order the user created, with 'you' showing user answer
const revealList = computed(() => {
  return rankList.value.map(p => {
    if (p.id === 'you') return { id: 'you', name: 'DU', answer: userAnswer.value };
    const player = demoPlayers.find(dp => dp.id === p.id);
    return { id: p.id, name: p.name, answer: player?.answer ?? 0 };
  });
});

// ── Navigation ─────────────────────────────────────────────────────────────
function goToScreen(n: number) {
  currentScreen.value = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeDemo() {
  logAnalytics('demo_exited', { screen: currentScreen.value });
  router.push('/');
}

function goToPlay() {
  logAnalytics('demo_cta_clicked');
  router.push('/play');
}

function resetDemo() {
  userAnswer.value = 50;
  sliderMoved.value = false;
  userPlacement.value = null;
  hasPlaced.value = false;
  waitDone.value = false;
  waitProgress.value = 80;
  revealedCount.value = 0;
  waitingPlayers.value = waitingPlayers.value.map(p =>
    p.name === 'Markus' ? { ...p, done: false } : p
  );
  rankList.value = [
    { id: 'leila',  name: 'Leila' },
    { id: 'jonas',  name: 'Jonas' },
    { id: 'anna',   name: 'Anna' },
    { id: 'markus', name: 'Markus' },
    { id: 'you',    name: 'you' },
  ];
  goToScreen(0);
}

// ── Screen actions ─────────────────────────────────────────────────────────
function submitAnswer() {
  if (!sliderMoved.value) return;
  logAnalytics('demo_answered', { answer: userAnswer.value });
  goToScreen(2);
  startWaitSimulation();
}

function startWaitSimulation() {
  setTimeout(() => {
    waitingPlayers.value = waitingPlayers.value.map(p =>
      p.name === 'Markus' ? { ...p, done: true } : p
    );
    waitProgress.value = 100;
    waitDone.value = true;
  }, 2000);
}

function submitPlacement() {
  if (!hasPlaced.value) return;
  userPlacement.value = youIndex.value + 1;
  logAnalytics('demo_placed', { placement: userPlacement.value });
  goToScreen(5);
  startRevealAnimation();
}

function startRevealAnimation() {
  revealedCount.value = 0;
  const total = revealList.value.length;
  for (let i = 0; i < total; i++) {
    setTimeout(() => {
      revealedCount.value = i + 1;
      if (i === total - 1) {
        logAnalytics('demo_completed');
      }
    }, i * 600 + 400);
  }
}

// ── Drag & Drop (Screen 4) ─────────────────────────────────────────────────
function onDragStart(index: number) {
  dragIndex.value = index;
}

function onDragOver(index: number) {
  // highlight handled via CSS :dragover if needed
}

const playerColors = ['#FF9800', '#2196F3', '#4CAF50', '#F44336', '#00BCD4'];
function getPlayerColor(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return playerColors[hash % playerColors.length];
}

function onDragEnd() {
  dragIndex.value = null;
  hasPlaced.value = true;
}

// Drop zones call this with target index (insert-before position)
function onDrop(targetIndex: number) {
  if (dragIndex.value === null) return;
  const from = dragIndex.value;
  if (from === targetIndex || from === targetIndex - 1) return;

  const list = [...rankList.value];
  const [moved] = list.splice(from, 1);
  const insertAt = from < targetIndex ? targetIndex - 1 : targetIndex;
  list.splice(insertAt, 0, moved);
  rankList.value = list;

  if (moved.id === 'you') {
    hasPlaced.value = true;
  }
  dragIndex.value = null;
}

// Mobile move buttons
function moveYouUp() {
  const idx = youIndex.value;
  if (idx <= 0) return;
  const list = [...rankList.value];
  [list[idx - 1], list[idx]] = [list[idx], list[idx - 1]];
  rankList.value = list;
  hasPlaced.value = true;
}

function moveYouDown() {
  const idx = youIndex.value;
  if (idx >= rankList.value.length - 1) return;
  const list = [...rankList.value];
  [list[idx], list[idx + 1]] = [list[idx + 1], list[idx]];
  rankList.value = list;
  hasPlaced.value = true;
}

// ── Analytics stub ─────────────────────────────────────────────────────────
function logAnalytics(event: string, data?: object) {
  console.log(`[Demo Analytics] ${event}`, data ?? '');
}

// ── Lifecycle ──────────────────────────────────────────────────────────────
onMounted(() => {
  logAnalytics('demo_started');
});
</script>

<style scoped>
/* ── Layout ── */
.demo-wrapper {
  min-height: 100vh;
  background: linear-gradient(160deg, #EDFFCC 0%, #f5ffe0 60%, #ffffff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px 48px;
  position: relative;
  font-family: 'Tenor Sans', Arial, sans-serif;
  color: #385028;
}

.demo-screen {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  animation: fadeUp 0.35s ease both;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Close button ── */
.demo-close {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(56,80,40,0.08);
  color: #385028;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 200;
}
.demo-close:hover { background: rgba(56,80,40,0.18); }

.demo-lang {
  position: fixed;
  top: 22px;
  left: 20px;
  z-index: 200;
}

/* ── Typography ── */
.demo-otter {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 4px;
}
.outro-otter { font-size: 5rem; }

.demo-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 700;
  color: #385028;
  margin: 0;
  line-height: 1.3;
}
.demo-subtitle {
  font-size: 1rem;
  color: #5a7042;
  margin: 0;
}
.demo-text {
  font-size: 1.05rem;
  color: #385028;
  line-height: 1.7;
  max-width: 420px;
  margin: 0;
}
.demo-hint {
  font-size: 0.9rem;
  color: #5a7042;
  opacity: 0.8;
}
.demo-highlight {
  font-size: 1.15rem;
  font-weight: 700;
  color: #59981A;
  margin: 0;
}

/* ── Buttons ── */
.demo-btn-primary {
  background: #59981A;
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 14px 32px;
  font-size: 1.05rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
  box-shadow: 0 4px 16px rgba(89,152,26,0.25);
  min-width: 220px;
  font-family: inherit;
}
.demo-btn-primary:hover:not(:disabled) {
  background: #4a7d14;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(89,152,26,0.35);
}
.demo-btn-primary.btn-disabled,
.demo-btn-primary:disabled {
  background: #c0d9a0;
  box-shadow: none;
  cursor: not-allowed;
  transform: none;
}
.demo-btn-secondary {
  background: transparent;
  border: 2px solid #59981A;
  color: #59981A;
  border-radius: 99px;
  padding: 12px 28px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.demo-btn-secondary:hover { background: rgba(89,152,26,0.07); }
.demo-btn-link {
  background: transparent;
  border: none;
  color: #5a7042;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  font-family: inherit;
  padding: 4px;
}
.demo-btn-link:hover { color: #385028; }

/* ── Question card ── */
.demo-round-label {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #59981A;
}
.question-card {
  background: #fff;
  border: 1.5px solid rgba(89,152,26,0.2);
  border-radius: 20px;
  padding: 24px 28px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(89,152,26,0.08);
}
.question-text {
  font-size: 1.35rem;
  font-weight: 700;
  color: #2d4a0e;
  margin: 0;
  line-height: 1.4;
}

/* ── Slider ── */
.slider-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.slider-poles {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  color: #5a7042;
  opacity: 0.85;
}
.slider-track-wrap { padding: 0 4px; }
.demo-slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 99px;
  background: linear-gradient(to right, #59981A 0%, #59981A calc(var(--val, 50) * 1%), rgba(89,152,26,0.15) calc(var(--val, 50) * 1%));
  outline: none;
  cursor: pointer;
}
.demo-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #59981A;
  box-shadow: 0 2px 8px rgba(89,152,26,0.4);
  cursor: grab;
  border: 3px solid #fff;
}
.demo-slider::-moz-range-thumb {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #59981A;
  border: 3px solid #fff;
  cursor: grab;
}
.slider-value-display {
  text-align: center;
  margin-top: 4px;
}
.slider-value {
  display: inline-block;
  background: #59981A;
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  width: 64px;
  height: 64px;
  line-height: 64px;
  border-radius: 50%;
  text-align: center;
  box-shadow: 0 4px 16px rgba(89,152,26,0.25);
}
.hint-card {
  background: rgba(89,152,26,0.07);
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 0.9rem;
  color: #5a7042;
  width: 100%;
  text-align: left;
}
.demo-hint-inline {
  font-size: 0.85rem;
  color: #59981A;
  font-weight: 600;
}

/* ── Wait screen ── */
.player-status-list {
  width: 100%;
  background: #fff;
  border-radius: 18px;
  border: 1.5px solid rgba(89,152,26,0.15);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(89,152,26,0.07);
}
.player-status-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  gap: 12px;
  border-bottom: 1px solid rgba(89,152,26,0.08);
  font-size: 0.95rem;
}
.player-status-item:last-child { border-bottom: none; }
.you-row { background: rgba(89,152,26,0.05); }
.you-name { font-weight: 700; }
.status-icon { font-size: 1.1rem; width: 24px; text-align: center; }
.status-icon.done { color: #59981A; }
.player-status-name { font-weight: 600; flex: 1; text-align: left; }
.player-status-label { font-size: 0.82rem; color: #5a7042; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}
.pulse-dot { animation: pulse 1.2s infinite; }

.progress-section { width: 100%; }
.progress-bar-wrap {
  height: 10px;
  background: rgba(89,152,26,0.15);
  border-radius: 99px;
  overflow: hidden;
  margin-bottom: 8px;
}
.progress-bar-fill {
  height: 100%;
  background: #59981A;
  border-radius: 99px;
  transition: width 0.8s ease;
}
.progress-label { font-size: 0.9rem; color: #385028; font-weight: 600; text-align: center; }

/* ── Rank screen ── */
.rank-pole-label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #5a7042;
  opacity: 0.85;
  width: 100%;
  text-align: center;
}
.rank-pole-label.top { margin-bottom: -8px; }
.rank-pole-label.bottom { margin-top: -8px; }

.rank-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 14px;
  transition: all 0.2s;
  user-select: none;
}
.rank-item-other {
  background: #fff;
  border: 1.5px solid rgba(89,152,26,0.12);
  margin-bottom: 6px;
}
.rank-item-you {
  background: linear-gradient(135deg, #d0f0c0 0%, #e8f5e9 100%);
  border: 2px solid #59981A;
  box-shadow: 0 4px 16px rgba(89,152,26,0.2);
  cursor: grab;
  margin-bottom: 6px;
}
.rank-item-you:active { cursor: grabbing; }
.rank-number {
  font-weight: 700;
  color: #5a7042;
  font-size: 0.9rem;
  width: 24px;
  flex-shrink: 0;
}
.rank-you-avatar { font-size: 1.1rem; flex-shrink: 0; }
.rank-name { font-weight: 600; flex: 1; text-align: left; color: #2d4a0e; }

.rank-move-btns {
  display: flex;
  gap: 4px;
}
.move-btn {
  background: rgba(89,152,26,0.12);
  border: none;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 0.85rem;
  cursor: pointer;
  color: #385028;
  transition: background 0.15s;
  font-family: inherit;
}
.move-btn:hover:not(:disabled) { background: rgba(89,152,26,0.25); }
.move-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.drop-zone {
  height: 8px;
  border-radius: 4px;
  margin: -4px 0;
  transition: background 0.15s, height 0.15s;
}
.drop-zone:hover, .drop-zone:focus {
  background: rgba(89,152,26,0.3);
  height: 14px;
}

.placement-status {
  font-size: 0.9rem;
  color: #5a7042;
  font-weight: 500;
  min-height: 22px;
}

/* ── Reveal screen ── */
.reveal-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.reveal-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  background: #fff;
  border: 1.5px solid rgba(89,152,26,0.12);
  border-radius: 14px;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.reveal-item.reveal-visible {
  opacity: 1;
  transform: translateY(0);
}
.reveal-you {
  background: linear-gradient(135deg, #d0f0c0 0%, #e8f5e9 100%);
  border-color: #59981A;
  box-shadow: 0 4px 14px rgba(89,152,26,0.15);
}
.reveal-rank { font-weight: 700; color: #5a7042; width: 24px; flex-shrink: 0; }
.reveal-name { font-weight: 600; flex: 1; text-align: left; color: #2d4a0e; }
.reveal-arrow { color: #5a7042; opacity: 0.6; }
.reveal-answer {
  font-weight: 700;
  font-size: 1.1rem;
  color: #385028;
  min-width: 32px;
  text-align: right;
}
.reveal-answer-you { color: #59981A; font-size: 1.2rem; }
.reveal-check { color: #59981A; font-size: 1rem; }

.reveal-comment-box {
  width: 100%;
  background: #fff;
  border: 1.5px solid rgba(89,152,26,0.15);
  border-radius: 18px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 4px 16px rgba(89,152,26,0.07);
}
.reveal-fact { font-size: 0.95rem; color: #385028; line-height: 1.5; }
.reveal-feedback { font-size: 0.95rem; color: #385028; line-height: 1.5; }

/* ── Outro ── */
.outro-trust {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 0.9rem;
  color: #5a7042;
}
.outro-trust span { font-weight: 500; }

/* ── Question catalog ── */
.q-catalog {
  width: 100%;
  border-radius: 18px;
  overflow: hidden;
  border: 1.5px solid rgba(89,152,26,0.2);
  background: #fff;
  box-shadow: 0 4px 16px rgba(89,152,26,0.07);
}
.q-catalog-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: rgba(89,152,26,0.05);
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  color: #385028;
  gap: 8px;
  transition: background 0.2s;
}
.q-catalog-toggle:hover { background: rgba(89,152,26,0.1); }
.q-catalog-chevron {
  font-size: 0.7rem;
  color: #59981A;
  transition: transform 0.25s;
  flex-shrink: 0;
}
.q-catalog-chevron.open { transform: rotate(180deg); }
.q-catalog-list {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.q-catalog-item {
  padding: 11px 20px;
  font-size: 0.88rem;
  color: #385028;
  border-top: 1px solid rgba(89,152,26,0.08);
  text-align: left;
  line-height: 1.5;
  transition: background 0.15s;
}
.q-catalog-item:hover { background: rgba(89,152,26,0.04); }

/* catalog expand transition */
.catalog-expand-enter-active { transition: max-height 0.35s ease, opacity 0.25s ease; }
.catalog-expand-leave-active { transition: max-height 0.3s ease, opacity 0.2s ease; }
.catalog-expand-enter-from,
.catalog-expand-leave-to  { max-height: 0; opacity: 0; }
.catalog-expand-enter-to,
.catalog-expand-leave-from { max-height: 800px; opacity: 1; }

/* ── Transitions ── */
.screen-fade-enter-active,
.screen-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
  position: absolute;
  width: 100%;
  max-width: 560px;
}
.screen-fade-enter-from { opacity: 0; transform: translateX(24px); }
.screen-fade-leave-to  { opacity: 0; transform: translateX(-24px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Mobile ── */
@media (max-width: 600px) {
  .demo-wrapper { padding: 16px 12px 56px; align-items: flex-start; padding-top: 64px; }
  .demo-title { font-size: 1.4rem; }
  .question-text { font-size: 1.15rem; }
  .demo-btn-primary { min-width: 100%; }
}
</style>
