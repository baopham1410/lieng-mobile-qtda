import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/assets/styles/main.css'
import { vTilt3D } from './directives/vTilt3D'

const app = createApp(App)

app.directive('tilt-3d', vTilt3D)
app.use(createPinia())
app.use(router)
app.mount('#app')
