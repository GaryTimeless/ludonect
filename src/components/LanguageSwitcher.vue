<template>
  <div class="lang-switcher">
    <button
      class="lang-btn"
      :class="{ active: locale === 'de' }"
      @click="setLocale('de')"
      aria-label="Deutsch"
    >
      DE
    </button>
    <span class="lang-sep">|</span>
    <button
      class="lang-btn"
      :class="{ active: locale === 'en' }"
      @click="setLocale('en')"
      aria-label="English"
    >
      EN
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

function setLocale(lang: string) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}
</script>

<style scoped>
.lang-switcher {
  display: flex;
  align-items: center;
  gap: 4px;
}

.lang-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  color: #5a7042;
  letter-spacing: 0.04em;
  padding: 4px 6px;
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}

.lang-btn:hover {
  color: #59981A;
  background: rgba(89, 152, 26, 0.08);
}

.lang-btn.active {
  color: #59981A;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.lang-sep {
  font-size: 0.75rem;
  color: #b0c8a0;
  user-select: none;
}
</style>

