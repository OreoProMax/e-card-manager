import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";

import ElementPlus from "element-plus";
import "element-plus/theme-chalk/index.css";
import zhCn from "element-plus/es/locale/lang/zh-cn";

import { ElNotification } from "element-plus";
createApp(App)
  .use(ElementPlus, {
    locale: zhCn,
  })
  .mount(
    (() => {
      // 选择挂载位置
      const mountLocation = document.querySelector("div.giftcard-tab.ml20");
      // 创建一个div元素
      const app = document.createElement("div");
      // 将创建的div元素添加到选择的元素中
      if (mountLocation) {
        mountLocation.appendChild(app);
      } else {
        ElNotification({
          type: "error",
          title: __SCRIPT_TITLE__,
          message: "挂载位置不存在，脚本可能已经失效！",
        });
      }
      return app;
    })()
  );
