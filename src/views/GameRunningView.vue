<template>
  <v-container class="game-running-container">
    <div class="game-running-content">
      <!-- Animated icon -->
      <div class="emoji-bounce">🎉</div>

      <h1 class="game-running-title">{{ t('gameRunning.title') }}</h1>

      <p class="game-running-subtitle" style="white-space: pre-line;">
        {{ t('gameRunning.subtitle') }}
      </p>

      <v-divider class="my-6" color="primary" opacity="0.3" />

      <p class="game-running-hint">{{ t('gameRunning.hint') }}</p>

      <v-btn
        color="primary"
        variant="elevated"
        size="large"
        class="mt-4"
        elevation="3"
        @click="router.push('/')"
      >
        {{ t('gameRunning.startOwn') }}
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
const router = useRouter();
const { t } = useI18n();
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
