import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

createApp(App)
  .use(ElementPlus, {
    locale: zhCn,
  })
  .mount(
  (() => {
    const app = document.createElement('div');
    document.body.append(app);
    return app;
  })(),
);
