import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import LandingPageView from '../views/LandingPageView.vue';
import LobbyView from '../views/LobbyView.vue';
import QuestionView from '../views/QuestionView.vue';
import EstimationView from '../views/EstimationView.vue';
import PrepareNextRound from "@/views/PrepareNextRound.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPageView
  },
  {
    path: '/home',
    redirect: '/'
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: LobbyView
  },
  {
    path: '/question/:gameId/:questionId',
    name: 'question',
    component: QuestionView
  },
  {
    path: '/estimation/:gameId/:questionId',
    name: 'estimation',
    component: EstimationView
  },
  {
    path: "/prepare/:gameId",
    name: "PrepareNextRound",
    component: PrepareNextRound,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;