<template>
  <div class="fun-button-wrapper">
    <v-btn block class="fun-button btn-press" color="#d7e770" @click="onClick">
      {{ t('funButton.label') }}
    </v-btn>
    <div v-if="funMessage" class="fun-message fade-in">
      <p class="text-medium-emphasis">
        {{ funMessage }} ({{ funClickCount }} {{ t('funButton.clicks') }})
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const funClickCount = ref(0);
const funMessage = ref('');

const funMessagesDE = [
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
  'Vielleicht solltest du einfach Kaffee trinken gehen.',
];

const funMessagesEN = [
  'Ask again later!',
  'Very likely!',
  'Better not!',
  'Focus on the game!',
  'Your fate is uncertain...',
  'Maybe... maybe not.',
  'Only 1000 more clicks until the prize!',
  'Patience is a virtue... sadly not yours.',
  'Magic costs extra!',
  'The more you click, the less happens!',
  'Don\'t you have anything better to do?',
  'Only 327 more clicks until enlightenment!',
  'The answer lies deep in your heart... or not.',
  'Try again later – or never.',
  'In a parallel universe you might have already won!',
  'If you stop clicking now, something might happen... maybe.',
  'Patience you must have, young Padawan.',
  'Hmm... No.',
  'Of course! (Not.)',
  'The stars are not in your favor.',
  'Every click takes you further from the truth.',
  'What you seek, you won\'t find here.',
  'Today is not a good day for answers.',
  'Sure, sure... keep clicking.',
  'Only 42 more clicks until the ultimate revelation!',
  'Maybe yes, maybe no. Maybe pizza.',
  'Click. Click. Click. Keep going.',
  'This button has more patience than you.',
  'Sometimes no answer is also an answer.',
  'Your fate is in a queue.',
  'Closed today. Try tomorrow!',
  'Make a wish! But expect nothing.',
  'Statistically, the next click will bring luck!',
  'The magic conch has nothing to say.',
  'One click for you, one laugh for us!',
  'Every click builds your fingers – and your frustration.',
  'Karma is watching you right now.',
  'Your click has been registered. In the list of useless actions.',
  'If you click three times, a wizard might appear!',
  'Listen to your heart, not this button.',
  'You are very, very close... to nothing.',
  'Believe in yourself – but stop clicking.',
  'Maybe you should just go get a coffee.',
];

const funMessages = computed(() => locale.value === 'en' ? funMessagesEN : funMessagesDE);

function onClick() {
  funClickCount.value++;
  const randomIndex = Math.floor(Math.random() * funMessages.value.length);
  funMessage.value = funMessages.value[randomIndex];
}
</script>

<style scoped>
.fun-button-wrapper {
  text-align: center;
  margin-top: 16px;
}

.fun-button {
  font-weight: 600;
  font-size: 1rem;
  letter-spacing: 0.01em;
  color: #385028 !important;
}

.fun-message {
  margin-top: 10px;
  color: #385028;
  font-size: 1.01rem;
  opacity: 0.9;
}
</style>
