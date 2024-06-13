<template>
  <el-button
    size="small"
    style="margin-top: 0.7%"
    type="primary"
    @click="dialogVisible = true"
  >
    E卡管理
  </el-button>

  <el-dialog :title="scriptTitle" v-model="dialogVisible" @open="countCards">
    <el-table
      :data="tableData"
      show-summary
      :summary-method="getSummary"
      stripe
    >
      <el-table-column type="index" min-width="8%" />
      <el-table-column label="余额" prop="balance" min-width="23%" />
      <el-table-column label="总张数" prop="totalCount" min-width="23%" />
      <el-table-column label="已选" prop="selectedCount" min-width="23%" />
      <el-table-column label="未选" prop="notSelectedCount" min-width="23%" />
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElNotification } from "element-plus";
import type { TableColumnCtx } from "element-plus";
import { onMounted, reactive, ref } from "vue";

const scriptTitle = __SCRIPT_TITLE__;

const dialogVisible = ref(false);

// 创建E卡对象数组，每条记录包含字段有：id、balance、status
interface ECardObject {
  id: string;
  balance: number;
  status: number;
}
const eCards = reactive([] as ECardObject[]);
// 创建E卡表格数组，每条记录包含字段有：balance、totalCount、selectedCount、notSelectedCount
interface ECardTableEntry {
  balance: number;
  totalCount: number;
  selectedCount: number;
  notSelectedCount: number;
}
const tableData = reactive([] as ECardTableEntry[]);

function countCards(): void {
  // 选取页面上所有E卡元素，为class属性包含"g-detail"的div元素
  const cards = document.querySelectorAll('div[class~="g-detail"]');
  // 遍历每个E卡元素，提取E卡的ID、余额、状态
  eCards.length = 0; // 清空eCards数组原有内容
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
        title: scriptTitle,
        message: `E卡信息提取失败，id：${id}，balance：${balance}，status：${status}`,
      });
    }
  });

  // 计算eCards中的数据，转换到tableData中
  tableData.length = 0; // 清空tableData数组原有内容
  eCards.forEach((card) => {
    const { balance, status } = card;
    const index = tableData.findIndex((item) => item.balance === balance);
    if (index === -1) {
      tableData.push({
        balance,
        totalCount: 1,
        selectedCount: status === 0 ? 1 : 0,
        notSelectedCount: status === 1 ? 1 : 0,
      });
    } else {
      tableData[index].totalCount += 1;
      tableData[index].selectedCount += status === 0 ? 1 : 0;
      tableData[index].notSelectedCount += status === 1 ? 1 : 0;
    }
  });
  // 将表格数据按余额从小到大排序
  tableData.sort((a, b) => a.balance - b.balance);
}

interface SummaryMethodProps<T = ECardTableEntry> {
  columns: TableColumnCtx<T>[];
  data: T[];
}

function getSummary(param: SummaryMethodProps): (string | number)[] {
  const { columns, data } = param;
  const result: (string | number)[] = [];
  columns.forEach((column, index) => {
    // 第一列为序号，不需要合计
    if (index === 0) {
      result[index] = "合计";
      return;
    }

    // 将每行的待累加值提取到values数组中
    let values: number[];
    if (index === 1) {
      // 若是余额列，则提取出该行的balance×totalCount
      values = data.map((item) => item.balance * item.totalCount);
    } else {
      // 其他列则直接提取出对应单元格的值
      values = data.map(
        (item) => item[column.property as keyof ECardTableEntry]
      );
    }

    // 只有values数组中的所有元素都是有限数字，才将其累加求和
    if (values.every((value) => Number.isFinite(value))) {
      result[index] = values.reduce((prev, curr) => prev + curr, 0);
    } else {
      ElNotification({
        type: "error",
        title: scriptTitle,
        message: `表格中存在异常项：${values}`,
      });
      result[index] = "";
    }
  });
  return result;
}

function extractNumber(element: Element | null): number {
  if (element && element.textContent !== null) {
    return Number(element.textContent.replace("￥", ""));
  } else {
    ElNotification({
      type: "error",
      title: scriptTitle,
      message: `提取金额时传入的element有误：${element}`,
    });
    return -1;
  }
}

onMounted(() => {
  console.log("CardManager mounted");
});
</script>
