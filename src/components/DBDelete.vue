

<template>
  <div style="padding: 16px; text-align: center;">
    <ion-button expand="block" color="danger" @click="resetDatabase">
      🔥 Datenbank zurücksetzen
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { IonButton } from '@ionic/vue';

async function resetDatabase() {
  const confirmation = confirm("Willst du wirklich alle Spiele und Räume löschen? Das kann nicht rückgängig gemacht werden!");
  if (!confirmation) {
    return;
  }

  const password = prompt("Bitte Passwort eingeben:");
  if (password !== "Greg") {
    alert("Falsches Passwort. Löschung abgebrochen.");
    return;
  }

  const db = getFirestore();

  try {
    const gamesSnapshot = await getDocs(collection(db, 'games'));
    for (const docSnap of gamesSnapshot.docs) {
      await deleteDoc(doc(db, 'games', docSnap.id));
    }

    const roomsSnapshot = await getDocs(collection(db, 'rooms'));
    for (const docSnap of roomsSnapshot.docs) {
      await deleteDoc(doc(db, 'rooms', docSnap.id));
    }

    alert('Alle Spiele und Räume wurden erfolgreich gelöscht.');
    console.log('Reset der Datenbank abgeschlossen.');
  } catch (error) {
    console.error('Fehler beim Löschen:', error);
    alert('Fehler beim Löschen der Daten. Details in der Konsole.');
  }
}
</script>