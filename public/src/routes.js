import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import ApiDoc from './pages/ApiDoc.vue'

export default [{
  path: '/',
  name: 'Home',
  component: Home
}, {
  path: '/login',
  name: 'Login',
  component: Login
}, {
  path: '/api-doc',
  name: 'ApiDoc',
  component: ApiDoc
}]
