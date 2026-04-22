<template>
  <div class="demo-wrapper">
    <!-- Close Button -->
    <button class="demo-close" @click="closeDemo" aria-label="Demo schließen">✕</button>

    <!-- ===== SCREEN 0: INTRO ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 0" class="demo-screen screen-intro" key="s0">
        <div class="demo-otter">🦦</div>
        <h2 class="demo-title">Probier's aus!</h2>
        <p class="demo-text">
          Du steigst in eine laufende Runde ein.<br />
          Vier andere haben schon gespielt – jetzt bist du dran.
        </p>
        <p class="demo-hint">Dauert nur 30 Sekunden.</p>
        <button class="demo-btn-primary" @click="goToScreen(1)">
          Los geht's →
        </button>
      </div>
    </transition>

    <!-- ===== SCREEN 1: FRAGE ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 1" class="demo-screen screen-question" key="s1">
        <div class="demo-round-label">Runde 1</div>
        <div class="question-card">
          <h2 class="question-text">Wie sehr lebst du nach Plan?</h2>
        </div>

        <div class="slider-value-display">
          <span class="slider-value">{{ userAnswer }}</span>
        </div>

        <div class="slider-section">
          <div class="slider-poles">
            <span>total chaotisch</span>
            <span>durchgetaktet</span>
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

        <div v-if="!sliderMoved" class="demo-hint-inline">
          ← Zieh den Slider auf deine Zahl
        </div>

        <button
          class="demo-btn-primary"
          :class="{ 'btn-disabled': !sliderMoved }"
          :disabled="!sliderMoved"
          @click="submitAnswer"
        >
          Antwort absenden ✓
        </button>

        <div class="hint-card">
          💡 Kein Richtig oder Falsch – nur deine ehrliche Einschätzung.
        </div>
      </div>
    </transition>

    <!-- ===== SCREEN 2: WARTEN ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 2" class="demo-screen screen-wait" key="s2">
        <h2 class="demo-title">Warte auf die anderen...</h2>

        <div class="player-status-list">
          <div v-for="player in waitingPlayers" :key="player.name" class="player-status-item">
            <span v-if="player.done" class="status-icon done">✓</span>
            <span v-else class="status-icon pending pulse-dot">⏳</span>
            <span class="player-status-name">{{ player.name }}</span>
            <span class="player-status-label">{{ player.done ? 'hat geantwortet' : 'antwortet...' }}</span>
          </div>
          <div class="player-status-item you-row">
            <span class="status-icon done">✓</span>
            <span class="player-status-name you-name">Du</span>
            <span class="player-status-label">hast geantwortet</span>
          </div>
        </div>

        <div class="progress-section">
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="{ width: waitProgress + '%' }"></div>
          </div>
          <p class="progress-label">
            {{ waitDone ? '5/5 – Alle sind fertig! ✓' : '4/5 haben geantwortet' }}
          </p>
        </div>

        <transition name="fade">
          <button
            v-if="waitDone"
            class="demo-btn-primary"
            @click="goToScreen(3)"
          >
            Weiter zur Einschätzung →
          </button>
        </transition>
      </div>
    </transition>

    <!-- ===== SCREEN 3: ERKLÄRUNG ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 3" class="demo-screen screen-explain" key="s3">
        <h2 class="demo-title">Jetzt wird's spannend.</h2>
        <p class="demo-text">
          Die anderen haben sich bereits in eine Rangliste eingeordnet –
          nur anhand ihrer Einschätzung, wer wohl höher oder niedriger geantwortet hat.
        </p>
        <p class="demo-highlight">Keine Zahlen. Nur Bauchgefühl.</p>
        <p class="demo-text">
          Du bist als Letzter dran.<br />
          Platziere dich in der Liste.
        </p>
        <button class="demo-btn-primary" @click="goToScreen(4)">
          Verstanden →
        </button>
      </div>
    </transition>

    <!-- ===== SCREEN 4: EINSCHÄTZUNG ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 4" class="demo-screen screen-rank" key="s4">
        <h2 class="demo-title">Wo stehst du?</h2>
        <p class="demo-subtitle">Platziere dich in der Liste.</p>

        <p class="rank-pole-label top">↑ lebt mehr nach Plan</p>

        <div class="rank-list">
          <template v-for="(item, index) in rankList" :key="item.id">
            <div
              class="rank-item"
              :class="{
                'rank-item-you': item.id === 'you',
                'rank-item-other': item.id !== 'you'
              }"
              :draggable="item.id === 'you'"
              @dragstart="onDragStart(index)"
              @dragover.prevent="onDragOver(index)"
              @dragend="onDragEnd"
            >
              <span class="rank-number">{{ index + 1 }}.</span>
              <span v-if="item.id === 'you'" class="rank-you-avatar">🟢</span>
              <span class="rank-name">{{ item.id === 'you' ? 'DU' : item.name }}</span>
              <!-- Mobile move buttons only for "you" -->
              <div v-if="item.id === 'you'" class="rank-move-btns">
                <button @click="moveYouUp" :disabled="index === 0" class="move-btn" aria-label="Nach oben">▲</button>
                <button @click="moveYouDown" :disabled="index === rankList.length - 1" class="move-btn" aria-label="Nach unten">▼</button>
              </div>
            </div>
            <!-- Drop zone between items -->
            <div
              v-if="index < rankList.length - 1"
              class="drop-zone"
              @dragover.prevent="onDragOver(index + 0.5)"
              @drop="onDrop(index + 1)"
            ></div>
          </template>
        </div>

        <p class="rank-pole-label bottom">↓ lebt weniger nach Plan</p>

        <div class="placement-status">
          {{ placementDescription }}
        </div>

        <div v-if="!hasPlaced" class="demo-hint-inline">
          Zieh „DU" oder nutze ▲▼ um dich einzuordnen
        </div>

        <button
          class="demo-btn-primary"
          :class="{ 'btn-disabled': !hasPlaced }"
          :disabled="!hasPlaced"
          @click="submitPlacement"
        >
          Fertig ✓
        </button>
      </div>
    </transition>

    <!-- ===== SCREEN 5: AUFLÖSUNG ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 5" class="demo-screen screen-reveal" key="s5">
        <h2 class="demo-title">🎉 Die Auflösung!</h2>
        <p class="demo-subtitle">So habt ihr euch eingeschätzt:</p>

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
            <span class="reveal-name">{{ item.id === 'you' ? 'DU' : item.name }}</span>
            <span class="reveal-arrow">→</span>
            <span class="reveal-answer" :class="{ 'reveal-answer-you': item.id === 'you' }">
              {{ revealedCount > index ? item.answer : '?' }}
            </span>
            <span v-if="item.id !== 'you' && revealedCount > index" class="reveal-check">✓</span>
          </div>
        </div>

        <transition name="fade">
          <div v-if="revealedCount >= revealList.length" class="reveal-comment-box">
            <div class="reveal-fact">
              😮 Hättest du gedacht, dass Markus nur 12 gesagt hat? Total spontan!
            </div>
            <div class="reveal-feedback">
              📍 {{ placementFeedback }}
            </div>
          </div>
        </transition>

        <transition name="fade">
          <button
            v-if="revealedCount >= revealList.length"
            class="demo-btn-primary"
            @click="goToScreen(6)"
          >
            Weiter →
          </button>
        </transition>
      </div>
    </transition>

    <!-- ===== SCREEN 6: OUTRO ===== -->
    <transition name="screen-fade">
      <div v-if="currentScreen === 6" class="demo-screen screen-outro" key="s6">
        <div class="demo-otter outro-otter">🦦</div>
        <h2 class="demo-title">Stell dir das jetzt mit deinen Leuten vor.</h2>
        <p class="demo-text">
          Freunde, Team, Klasse, Verein &ndash;
          eine Frage reicht und ihr wisst mehr übereinander
          als nach 10 Smalltalks.
        </p>

        <!-- Question catalog -->
        <div class="q-catalog">
          <button class="q-catalog-toggle" @click="catalogOpen = !catalogOpen">
            <span>{{ catalogOpen ? '📕 Fragenkatalog schließen' : '📚 Was kann man fragen? 15 Beispiele' }}</span>
            <span class="q-catalog-chevron" :class="{ open: catalogOpen }">&#9660;</span>
          </button>
          <transition name="catalog-expand">
            <div v-if="catalogOpen" class="q-catalog-list">
              <div
                v-for="q in sampleQuestions"
                :key="q.id"
                class="q-catalog-item"
              >
                {{ q.text }}
              </div>
            </div>
          </transition>
        </div>

        <button class="demo-btn-primary" @click="goToPlay">
          🚀 Jetzt Raum erstellen – kostenlos
        </button>

        <div class="outro-trust">
          <span>✅ Kein Login</span>
          <span>✅ Kein Download</span>
          <span>✅ In 60 Sekunden startklar</span>
        </div>

        <button class="demo-btn-secondary" @click="resetDemo">
          ↺ Nochmal spielen
        </button>
        <button class="demo-btn-link" @click="closeDemo">
          ← Zurück zur Übersicht
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import allQuestions from '@/questions.json';

const router = useRouter();

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
  { id: 'you',    name: 'Du' },
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
  if (idx === 0) return 'Du platzierst dich auf Platz 1 – ganz oben';
  const above = rankList.value[idx - 1]?.name;
  const below = rankList.value[idx + 1]?.name;
  if (!below) return `Du platzierst dich auf Platz ${idx + 1} – hinter ${above}`;
  return `Du platzierst dich auf Platz ${idx + 1} (zwischen ${above} und ${below})`;
});

// Reveal list: the ranking order the user created, with 'you' showing user answer
const revealList = computed(() => {
  return rankList.value.map(p => {
    if (p.id === 'you') return { id: 'you', name: 'DU', answer: userAnswer.value };
    const player = demoPlayers.find(dp => dp.id === p.id);
    return { id: p.id, name: p.name, answer: player?.answer ?? 0 };
  });
});

const placementFeedback = computed(() => {
  if (userPlacement.value === null) return '';
  const actual = getActualPosition(userAnswer.value);
  const diff = Math.abs(userPlacement.value - actual);
  if (diff === 0) return 'Du hast dich genau richtig eingeschätzt! Starkes Bauchgefühl.';
  if (diff === 1) return 'Knapp! Du lagst nur einen Platz daneben. Im echten Spiel mit Freunden wird das noch spannender.';
  return 'Überraschung! Du hast dich ganz anders eingeschätzt als deine Zahl vermuten lässt. Genau DAS sind die Oha-Momente!';
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
    { id: 'you',    name: 'Du' },
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

function onDragEnd() {
  dragIndex.value = null;
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
