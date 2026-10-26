import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import DailyLogView from '../views/DailyLogView.vue'
import ChallengeView from '../views/ChallengeView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import RegisterView from '../views/RegisterView.vue'
import BadgesView from '../views/BadgesView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'
import AdminTipsView from '../views/AdminTipsView.vue'
import AdminChallengesView from '../views/AdminChallengesView.vue'
import AdminBadgesView from '../views/AdminBadgesView.vue'
import AdminFactorsView from '../views/AdminFactorsView.vue'
import AdminSettingsView from '../views/AdminSettingsView.vue'
import { useAuthStore } from '@/stores/auth'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: LoginView },
    { path: '/dashboard', component: DashboardView },
    { path: '/log', component: DailyLogView },
    { path: '/challenges', component: ChallengeView },
    { path: '/admin', component: AdminDashboardView },
    { path: '/register', component: RegisterView },
    { path: '/badges', component: BadgesView },

      // Admin Role routes
    { path: '/admin/users', component: AdminUsersView },
    { path: '/admin/tips', component: AdminTipsView },
    { path: '/admin/challenges', component: AdminChallengesView },
    { path: '/admin/badges', component: AdminBadgesView },
    { path: '/admin/factors', component: AdminFactorsView },
    { path: '/admin/settings', component: AdminSettingsView },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()
  const isLoggedIn = !!authStore.token
  const isAdmin = authStore.user?.role === 'admin'

  if (to.path === '/login' || to.path === '/register') {
    if (isLoggedIn) {
      return isAdmin ? '/admin' : '/dashboard'
    }
    return true
  }

  const protectedPaths = ['/dashboard', '/admin', '/log', '/challenges', '/badges']
  const isProtected = protectedPaths.some((prefix) => to.path.startsWith(prefix))

  if (isProtected && !isLoggedIn) {
    return '/login'
  }

  if (to.path.startsWith('/admin') && !isAdmin) {
    return '/dashboard'
  }

  return true
})

export default router
