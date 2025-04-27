<template>
    <div style="text-align: center; margin-top: 16px;">
      <ion-button expand="block" color="tertiary" @click="onClick">
        Drück mich, wenn du ungeduldig bist!
      </ion-button>
      <div v-if="funMessage" style="margin-top: 8px;">
        <ion-text color="medium">
          {{ funMessage }} ({{ funClickCount }} Klicks)
        </ion-text>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue';
  import { IonButton, IonText } from '@ionic/vue';
  
  const funClickCount = ref(0);
  const funMessage = ref('');
  
  const funMessages = [
  'Frag später nochmal!',
  'Sehr wahrscheinlich!',
  'Besser nicht!',
  'Konzentriere dich aufs Spiel!',
  'Dein Schicksal ist ungewiss...',
  'Vielleicht... vielleicht auch nicht.',
  'Noch 1000 Klicks bis zum Preis!',
  'Geduld ist eine Tugend... du hast sie leider nicht.',
  'Magie kostet extra!',
  'Je öfter du klickst, desto weniger passiert!',
  'Hast du nichts Besseres zu tun?',
  'Nur noch 327 Klicks bis zur Erleuchtung!',
  'Die Antwort liegt tief in deinem Herzen... oder auch nicht.',
  'Versuch\'s später nochmal – oder nie.',
  'In einer anderen Realität hast du vielleicht schon gewonnen!',
  'Wenn du jetzt aufhörst zu klicken, passiert etwas... vielleicht.',
  'Geduld du haben musst, junger Padawan.',
  'Hmm... Nein.',
  'Natürlich! (Nicht.)',
  'Die Sterne sind dir nicht wohlgesonnen.',
  'Mit jedem Klick entfernst du dich weiter von der Wahrheit.',
  'Was du suchst, findest du nicht hier.',
  'Heute ist kein guter Tag für Antworten.',
  'Sicher, sicher... klick ruhig weiter.',
  'Noch 42 Klicks bis zur ultimativen Erkenntnis!',
  'Vielleicht ja, vielleicht nein. Vielleicht Pizza.',
  'Klick. Klick. Klick. Immer weiter.',
  'Dieser Button hat mehr Geduld als du.',
  'Manchmal ist keine Antwort auch eine Antwort.',
  'Dein Schicksal ist in einer Warteschlange.',
  'Heute leider geschlossen. Versuchs morgen!',
  'Wünsche dir etwas! Aber erwarte nichts.',
  'Statistisch gesehen bringt der nächste Klick Glück!',
  'Die magische Muschel schweigt.',
  'Ein Klick für dich, ein Lacher für uns!',
  'Jeder Klick stärkt deine Finger – und deinen Frust.',
  'Karma beobachtet dich gerade.',
  'Dein Klick wurde registriert. In der Liste der nutzlosen Taten.',
  'Wenn du drei Mal klickst, erscheint vielleicht ein Zauberer!',
  'Höre auf dein Herz, nicht auf diesen Button.',
  'Du bist sehr, sehr nah... an nichts.',
  'Glaub an dich – aber hör auf zu klicken.',
  'Vielleicht solltest du einfach Kaffee trinken gehen.'
];
  
  function onClick() {
    funClickCount.value++;
    const randomIndex = Math.floor(Math.random() * funMessages.length);
    funMessage.value = funMessages[randomIndex];
  }
  </script>