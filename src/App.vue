<template>
  <v-app>
    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { provide, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import questions from "@/questions.json";
import { socketService } from '@/services/socketService';

provide("questions", questions);

const router = useRouter();

onMounted(() => {
  // Connect to WebSocket server
  socketService.connect();

  // Listen for server-initiated navigation
  socketService.on('navigateTo', (path: string) => {
    console.log('[App] Navigating to:', path);
    router.push(path);
  });

  console.log('[App] Socket service initialized');
});

onUnmounted(() => {
  // Cleanup socket connection
  socketService.disconnect();
});
</script>

<style>
@import './styles/animations.css';
@import './styles/global.css';
</style>
