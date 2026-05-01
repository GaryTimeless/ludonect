# Ludonect – ToDo

## Testing

### Integrationstests für große Feature-Merges
- Bei größeren Branches (z.B. i18n, Reconnect) passieren leicht unbemerkte Regressionen
- Ziel: automatische Tests die nach einem Merge sofort Feedback geben

**Was zu testen wäre:**

- [ ] **Spielfluss E2E** (Cypress): Raum erstellen → beitreten → Frage beantworten → Estimation → nächste Runde
- [ ] **i18n-Smoke-Test**: App lädt in DE und EN ohne fehlende Übersetzungskeys (`$t(...)` gibt nicht den Key zurück)
- [ ] **Reconnect-Flow**: Spieler disconnected und rejoined — Game-State bleibt erhalten (kann per DevTools Network-Offline simuliert werden)
- [ ] **Host-Reconnect**: Host disconnected, Grace Period, Host kommt zurück vs. Host kommt nicht zurück → Migration
- [ ] **Katalog-Auswahl**: Raum mit SmartCoachBerlin-Katalog erstellen, Fragen sind korrekt
- [ ] **Lobby-Snapshot**: `/play` rendert ohne JS-Fehler in beiden Sprachen

**Wann ausführen:** Vor jedem Merge von einem Feature-Branch in `main`

---

## Design

### EstimationView an Demo-Design angleichen
- **Datei:** `src/views/EstimationView.vue`
- **Referenz:** `src/views/DemoView.vue` Screen 4 (Placement-Screen)
- Das Demo-Design (Vuetify-Cards, farbige Avatare, kompakteres Layout) gefällt besser
- Beide Phasen anpassen:
  - Spielerreihenfolge bestimmen (Host-View)
  - Einschätzungsphase (Spieler-View)
