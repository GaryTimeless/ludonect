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
    path: '/question',
    name: 'question',
    component: QuestionView
  },
  {
    path: '/estimation',
    name: 'estimation',
    component: EstimationView
  },
  {
    path: '/reveal',
    name: 'reveal',
    component: RevealView
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
