<template>
  <el-button
    size="small"
    style="margin-top: 0.7%"
    type="primary"
    @click="showManager"
  >
    E卡管理器
  </el-button>
</template>

<script setup lang="ts">
import { ElNotification } from "element-plus";
import { onMounted, reactive } from "vue";

// 创建一个空E卡对象数组，每条记录包含字段有：id、balance、status
const eCards = reactive([{ id: "", balance: 0, status: 0 }]);

function showManager() {
  countCards();
}

function countCards() {
  // 清空eCards数组原有内容
  eCards.length = 0;

  // 选取页面上所有E卡元素，为class属性包含"g-detail"的div元素
  const cards = document.querySelectorAll('div[class~="g-detail"]');

  // 遍历每个E卡元素，提取E卡的ID、余额、状态
  cards.forEach((card) => {
    // 提取E卡的ID，为E卡元素的data-gift-id属性的值
    const id = card.getAttribute("data-gift-id");

    // 提取E卡的余额，为E卡元素中【class="g-price"】的div元素中的strong子代元素的文本内容
    const balanceElement = card.querySelector("div.g-price>strong");
    const balance = extractNumber(balanceElement);

    // 提取E卡的状态，如果E卡元素的class属性包含"item-selected"，则状态为0，否则为1
    const status = card.className.includes("item-selected") ? 0 : 1;

    // 将E卡的信息存入eCards数组中
    if (id !== null && balance !== -1) {
      eCards.push({ id, balance, status });
    } else {
      ElNotification({
        type: "error",
        title: __SCRIPT_TITLE__,
        message: `E卡信息提取失败，id：${id}，balance：${balance}，status：${status}`,
      });
    }
  });

  console.log(eCards);
}

function extractNumber(element: Element | null): number {
  if (element && element.textContent !== null) {
    return Number(element.textContent.replace("￥", ""));
  } else {
    ElNotification({
      type: "error",
      title: __SCRIPT_TITLE__,
      message: `提取金额时传入的element有误：${element}`,
    });
    return -1;
  }
}

onMounted(() => {
  console.log("CardManager mounted");
});
</script>
