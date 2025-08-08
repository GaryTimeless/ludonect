

<template>
  <div style="padding: 16px; text-align: center;">
    <ion-button expand="block" color="danger" @click="resetDatabase">
      🔥 Datenbank zurücksetzen
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { supabase } from "@/supabaseClient";
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

  try {
    console.log('🗑️ [resetDatabase] Starte Datenbank-Reset...');
    
    // Lösche alle Einträge aus game_session Tabelle
    const { error: deleteError } = await supabase
      .from('game_session')
      .delete()
      .neq('id', ''); // Lösche alle Einträge (id ist nie leer)
    
    if (deleteError) {
      console.error('🗑️ [resetDatabase] Fehler beim Löschen:', deleteError);
      alert('Fehler beim Löschen der Daten. Details in der Konsole.');
      return;
    }

    console.log('🗑️ [resetDatabase] Alle Spiele und Räume erfolgreich gelöscht.');
    alert('Alle Spiele und Räume wurden erfolgreich gelöscht.');
    
    // Optional: Seite neu laden
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
  } catch (error) {
    console.error('🗑️ [resetDatabase] Fehler beim Löschen:', error);
    alert('Fehler beim Löschen der Daten. Details in der Konsole.');
  }
}
</script>