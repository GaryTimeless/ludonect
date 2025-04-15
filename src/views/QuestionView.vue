<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="secondary">
        <ion-title>Frage</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>{{ questionText }}</h2>
      <ion-item>
        <ion-label position="stacked">Deine Antwort ({{ min }}–{{ max }})</ion-label>
        <ion-range :min="min" :max="max" v-model="answer" />
      </ion-item>
      <p>Deine Auswahl: <strong>{{ answer }}</strong></p>
      <ion-button expand="block" @click="submitAnswer">Antwort absenden</ion-button>
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
  IonItem,
  IonLabel,
  IonRange,
  IonButton
} from '@ionic/vue'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const questionText = ref<string>(route.query.text as string)
const min = ref<number>(parseInt(route.query.min as string) || 0)
const max = ref<number>(parseInt(route.query.max as string) || 100)
const answer = ref<number>(Math.floor((min.value + max.value) / 2))

function submitAnswer() {
  alert(`Antwort gespeichert: ${answer.value}`)
}
</script>
