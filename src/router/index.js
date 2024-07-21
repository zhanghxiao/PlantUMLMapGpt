import Vue from 'vue'
import VueRouter from 'vue-router'

const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push (location) {
  return originalPush.call(this, location).catch(err => err)
}

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Manager',
    component: () => import('../views/Manager.vue'),
    redirect: '/home',  // 重定向到主页
    children: [
      { path: 'home', name: 'Home', meta: { name: '思维导图' }, component: () => import('../views/manager/Home') },
      { path: 'about', name: 'About', meta: { name: '关于' }, component: () => import('../views/manager/About') },
      { path: 'home1', name: 'Home1', meta: { name: '流程图' }, component: () => import('../views/manager/Home1') },
      { path: 'home2', name: 'Home2', meta: { name: '用例图' }, component: () => import('../views/manager/Home2') },
      { path: 'home3', name: 'Home3', meta: { name: '时序图' }, component: () => import('../views/manager/Home3') },
      { path: 'home4', name: 'Home4', meta: { name: 'Home4' }, component: () => import('../views/manager/Home4') },
      { path: 'home5', name: 'Home5', meta: { name: 'Home5' }, component: () => import('../views/manager/Home5') },
    ]
  },
]

const router = new VueRouter({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes
})

export default router
