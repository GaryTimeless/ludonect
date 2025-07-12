<!-- TODO neue LandingPage, oder die lobby page, vllt Faben -->

<template>
  <ion-page>
    <ion-content>
      <div class="landing-page">
        <!-- 1. Hero Section -->
        <section class="hero-section">
          <div class="container hero-content">
            <div class="hero-text">
              <h1>Entdecke Ludonect!</h1>
              <p class="subtitle">{{ selectedSubtitle }}</p>
              <button class="cta-button primary" @click="goToLobby">Jetzt loslegen</button>
              <button class="cta-button secondary">Mehr erfahren</button>
            </div>
            <div class="hero-image"></div>
          </div>
        </section>

        <!-- 2. Features Section -->
        <section class="features-section">
          <div class="container">
            <h2>Unsere Top-Features</h2>
            <div class="features-grid">
              <div class="feature-item">
                <div class="feature-icon">💬</div>
                <h3>Intuitive Fragen – für echte Oha-Momente</h3>
                <p>Unsere neutralen, aber cleveren Fragen fördern Spaß, Überraschung und Selbstreflexion – perfekt für Teams, Freunde und Coaching-Sessions.</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">🔗</div>
                <h3>Verbindungen schaffen – zwischen Generationen  </h3>
                <p>Ludonect bringt Freunde, Familien und Teams spielerisch zusammen – geeignet für (fast) jedes Alter und Gruppen von 3 bis 8 Personen.</p>
              </div>
              <div class="feature-item">
                <div class="feature-icon">📱</div>
                <h3>Geräteübergreifend spielen – wo immer ihr seid</h3>
                <p>Ob Smartphone, Tablet oder Laptop – Ludonect funktioniert überall. Einfach starten, gemeinsam erleben, jederzeit und überall.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 3. Call to Action (CTA) Section -->
        <section class="cta-section">
          <div class="container">
            <h2>Bereit anzufangen?</h2>
            <p>Warte  nicht länger. Frage deine Freund und genießt die Zeit.</p>
            <button class="cta-button primary large">Kostenlos registrieren</button>
          </div>
        </section>

        <!-- 4. Footer -->
        <footer class="footer-section">
          <div class="container">
            <p>&copy; {{ currentYear }} Dein Firmenname. Alle Rechte vorbehalten.</p>
            <!-- Hier könnten noch Links zu Impressum, Datenschutz etc. hin -->
          </div>
        </footer>
      </div>
    </ion-content>
  </ion-page>
</template>
  
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { IonPage, IonContent } from '@ionic/vue';

// Einfache Logik, um das aktuelle Jahr für den Footer zu bekommen
const currentYear = ref(new Date().getFullYear());

const router = useRouter();

const subtitles = [
  "Spiele unterhaltsame Runden mit Freunden und entdeckt völlig neue Seiten an euch.",
  "Gemeinsam lachen, raten und überraschen – Ludonect hinterlässt schöne Momente.",
  "Erlebe Spaß, Teamgeist und neue Entdeckungen in jeder Runde.",
  "Wie gut kennt ihr euch wirklich? Findet es spielerisch heraus!"
];

const selectedSubtitle = ref(subtitles[Math.floor(Math.random() * subtitles.length)]);

const goToLobby = () => {
  router.push('/lobby');
};

// Hier könntest du später weitere Logik hinzufügen,
// z.B. für Formular-Handling, API-Aufrufe etc.

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.2 });

  const featureItems = document.querySelectorAll('.feature-item');
  featureItems.forEach(item => observer.observe(item));
});
</script>
  
  <style scoped>
  /* Basis-Styling - Dies sollte stark angepasst werden! */
  .landing-page {
    font-family: sans-serif;
    color: #333;
  }
  
  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  /* Hero Section */
  .hero-section {
    background-color: #F9FAFB;
    padding: 80px 0;
    text-align: center;
  }
  .hero-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .hero-text {
    flex: 1;
    text-align: left;
    min-width: 300px;
  }

  .hero-image {
    flex: 1;
    background: url('@/assets/hero-background.png') no-repeat center center;
    background-size: contain;
    min-height: 250px;
    height: auto;
    min-width: 300px;
    max-width: 500px;
    animation: fadeInUp 1s ease forwards;
  }
  
  .hero-section h1 {
    font-size: 2.8em;
    margin-bottom: 15px;
    color: #2c3e50;
  }
  
  .hero-section .subtitle {
    font-size: 1.2em;
    color: #555;
    margin-bottom: 30px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }
  
  /* Buttons */
  .cta-button {
    padding: 12px 25px;
    border: none;
    border-radius: 5px;
    font-size: 1em;
    cursor: pointer;
    margin: 5px;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  
  .cta-button.primary {
    background-color: #0077FF;
    color: white;
    border-radius: 8px;
  }
  .cta-button.primary:hover {
    background-color: #005FCC;
    transform: translateY(-2px) scale(1.05);
  }

  .cta-button.secondary {
    background-color: transparent;
    color: #0077FF;
    border: 2px solid #0077FF;
    border-radius: 8px;
  }
  .cta-button.secondary:hover {
    background-color: #E6F0FF;
    transform: translateY(-2px) scale(1.05);
  }
  
  .cta-button.large {
      padding: 15px 35px;
      font-size: 1.1em;
  }
  
  
  /* Features Section */
  .features-section {
    background-color: #F9FAFB;
    padding: 60px 0;
    text-align: center;
  }
  
  .features-section h2 {
    font-size: 2.2em;
    margin-bottom: 40px;
    color: #2c3e50;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); /* Responsive Grid */
    gap: 30px;
    text-align: left;
  }
  
  .feature-item {
    background-color: #fff;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.6s ease;
  }
  
  .feature-item.visible {
    opacity: 1;
    transform: translateY(0);
  }
  
  .feature-icon {
    font-size: 1.5em;
    margin-bottom: 15px;
    color: #FFD700;
    /* Ersetze den Text durch echte Icons (z.B. FontAwesome, SVG) */
    font-weight: bold;
  }
  
  .feature-item h3 {
    font-size: 1.4em;
    margin-bottom: 10px;
    color: #2c3e50;
  }
  
  .feature-item p {
    color: #555;
    line-height: 1.6;
  }
  
  /* CTA Section */
  .cta-section {
    background-color: #0077FF;
    color: white;
    padding: 60px 0;
    text-align: center;
  }
  
  .cta-section h2 {
    font-size: 2.2em;
    margin-bottom: 15px;
  }
  
  .cta-section p {
    font-size: 1.1em;
    margin-bottom: 30px;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  
  /* Footer Section */
  .footer-section {
    background-color: #E0E0E0;
    color: #333333;
    padding: 20px 0;
    text-align: center;
    font-size: 0.9em;
    border-top: 1px solid #e7e7e7;
  }
  
  /* Hero Section fadeInUp Animation */
  .hero-section h1,
  .hero-section .subtitle {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.8s ease forwards;
  }

  .hero-section .subtitle {
    animation-delay: 0.3s;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInCta {
    from {
      opacity: 0;
      transform: translateY(40px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Responsive Anpassungen (Beispiel) */
  @media (max-width: 768px) {
    .hero-section h1 {
      font-size: 2.2em;
    }
    .features-grid {
       grid-template-columns: 1fr; /* Untereinander auf kleinen Bildschirmen */
    }
    .hero-content {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .hero-text {
      text-align: center;
    }

    .hero-image {
      margin-top: 30px;
      height: 200px;
    }
  }
  </style>
