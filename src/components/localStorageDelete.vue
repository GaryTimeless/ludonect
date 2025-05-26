

<template>
  <div style="padding: 16px; text-align: center;">
    <ion-button expand="block" color="medium" @click="clearLocalStorage">
      Lokalen Speicher löschen
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton } from '@ionic/vue';
function clearLocalStorage() {
  localStorage.clear();
  alert('Lokaler Speicher wurde gelöscht.');
}
</script>