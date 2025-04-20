import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import LobbyView from '../views/LobbyView.vue'
import QuestionView from '../views/QuestionView.vue'
import EstimationView from '../views/EstimationView.vue'
import RevealView from '../views/RevealView.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
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
    path: '/reveal/:gameId',
    name: 'reveal',
    component: RevealView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
