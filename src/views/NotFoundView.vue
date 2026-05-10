<template>
  <div class="not-found">
    <v-container class="not-found-container">
      <v-row justify="center">
        <v-col cols="12" md="6" lg="4" class="text-center">

          <img
            src="@/assets/ludonect_combo.png"
            alt="Ludonect"
            class="not-found-logo mb-8"
          />

          <h1 class="not-found-title">404</h1>
          <p class="not-found-text">
            Diese Seite gibt's nicht.<br />Der Link ist wahrscheinlich falsch oder veraltet.
          </p>

          <v-btn
            color="primary"
            variant="elevated"
            size="large"
            rounded="pill"
            to="/"
            class="mt-6"
          >
            <v-icon icon="mdi-arrow-left" class="mr-2" />
            Zurück zur Startseite
          </v-btn>

        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed — pure presentation
</script>

<style scoped>
.not-found {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-container {
  padding-top: 2rem;
  padding-bottom: 2rem;
}

.not-found-logo {
  max-width: 220px;
  width: 100%;
  height: auto;
}

.not-found-title {
  font-family: 'Tenor Sans', Arial, sans-serif;
  font-size: 4rem;
  font-weight: 700;
  color: #385028;
  line-height: 1;
  margin-bottom: 0.5rem;
}

.not-found-text {
  font-size: 1.1rem;
  color: #666;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .not-found-title {
    font-size: 3rem;
  }

  .not-found-logo {
    max-width: 160px;
  }
}
</style>
