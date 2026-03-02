<template>
  <v-container class="game-running-container">
    <div class="game-running-content">
      <!-- Animated icon -->
      <div class="emoji-bounce">🎉</div>

      <h1 class="game-running-title">Die Party läuft schon!</h1>

      <p class="game-running-subtitle">
        Du warst leider einen Tick zu spät.<br />
        Das Spiel in diesem Raum hat bereits begonnen<br />
        und die Tür ist verschlossen.
      </p>

      <v-divider class="my-6" color="primary" opacity="0.3" />

      <p class="game-running-hint">
        Aber kein Problem — starte einfach dein eigenes Spiel!
      </p>

      <v-btn
        color="primary"
        variant="elevated"
        size="large"
        class="mt-4"
        elevation="3"
        @click="router.push('/')"
      >
        Eigenes Spiel gründen
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
</script>

<style scoped>
.game-running-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.game-running-content {
  width: 100%;
  max-width: 420px;
  text-align: center;
  padding: 24px 16px;
}

.emoji-bounce {
  font-size: 72px;
  display: block;
  margin-bottom: 16px;
  animation: bounce 1.2s infinite alternate ease-in-out;
}

@keyframes bounce {
  from { transform: translateY(0); }
  to   { transform: translateY(-14px); }
}

.game-running-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #385028;
  margin-bottom: 16px;
}

.game-running-subtitle {
  font-size: 1rem;
  color: #385028;
  line-height: 1.6;
  opacity: 0.85;
}

.game-running-hint {
  font-size: 0.95rem;
  color: #59981A;
  font-weight: 600;
}
</style>
