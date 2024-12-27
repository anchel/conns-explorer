import { createApp } from 'vue';

import { createPinia } from 'pinia';
import router from './router';

import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'element-plus/theme-chalk/dark/css-vars.css';
import './styles/app.css';
import './styles/dark/css-vars.css';

import App from './App.vue';
import { registerInit } from '@/utils/register.ts';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(ElementPlus);
app.mount('#app').$nextTick(() => {
  registerInit();
});
