<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
// z.B. in App.vue oder einer globalen Store-Datei:
import questions from "@/questions.json";
provide("questions", questions);
</script>
