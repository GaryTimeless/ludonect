import { createRouter, createWebHistory } from 'vue-router';
import { RouteRecordRaw } from 'vue-router';
import LandingPageView from '../views/LandingPageView.vue';
import LobbyView from '../views/LobbyView.vue';
import QuestionView from '../views/QuestionView.vue';
import EstimationView from '../views/EstimationView.vue';
import PrepareNextRound from "@/views/PrepareNextRound.vue";
import GameRunningView from "@/views/GameRunningView.vue";
import LegalView from "@/views/LegalView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPageView,
  },
  {
    path: '/play',
    name: 'LobbyRoot',
    component: LobbyView,
  },
  {
    path: '/home',
    redirect: '/play',
  },
  {
    path: '/lobby',
    name: 'Lobby',
    component: LobbyView,
  },
  {
    path: '/join/:roomCode',
    name: 'JoinRoom',
    component: LobbyView,
    props: true,
  },
  {
    path: '/question/:gameId/:questionId',
    name: 'question',
    component: QuestionView,
  },
  {
    path: '/estimation/:gameId/:questionId',
    name: 'estimation',
    component: EstimationView,
  },
  {
    path: "/prepare/:gameId",
    name: "PrepareNextRound",
    component: PrepareNextRound,
  },
  {
    path: "/game-running",
    name: "GameRunning",
    component: GameRunningView,
  },
  {
    path: "/legal",
    name: "Legal",
    component: LegalView,
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

export default router;