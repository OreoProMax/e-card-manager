<template>
  <el-button
    size="small"
    style="margin-top: 0.7%"
    type="primary"
    @click="dialogVisible = true"
  >
    E卡管理
  </el-button>

  <el-dialog v-model="dialogVisible" :title="scriptTitle" @open="countCards">
    <el-table
      :data="tableData"
      show-summary
      :summary-method="getSummary"
      stripe
      v-loading="loading && { text: loadingText }"
      :element-loading-text="loadingText"
    >
      <el-table-column type="index" min-width="9%" />
      <el-table-column label="余额" prop="balance" min-width="15%" />
      <el-table-column label="总张数" prop="totalCount" min-width="12%" />
      <el-table-column label="已选" prop="selectedCount" min-width="10%" />
      <el-table-column label="未选" prop="notSelectedCount" min-width="10%" />
      <el-table-column label="操作" min-width="44%">
        <template #default="scope">
          <el-input-number
            v-model="scope.row.operationNum"
            :min="0"
            :max="scope.row.totalCount"
            size="small"
            style="width: 40%"
          />

          张

          <el-button
            size="small"
            type="success"
            @click="handleOperation(scope.row, 1)"
          >
            选择
          </el-button>

          <el-button
            size="small"
            type="danger"
            @click="handleOperation(scope.row, 0)"
          >
            反选
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>

<script setup lang="ts">
import { ElMessage, ElNotification } from "element-plus";
import type { TableColumnCtx } from "element-plus";
import { onMounted, reactive, ref } from "vue";

const scriptTitle = __SCRIPT_TITLE__;

const dialogVisible = ref(false);

// E卡对象，字段：element（表示该E卡的HTML元素）、id、balance、status
interface Card {
  element: HTMLElement;
  id: string;
  balance: number;
  status: number;
}
const cards = reactive([] as Card[]);

/**
 * 提取页面上所有E卡元素，存入cards数组中
 */
function countCards(): void {
  // 选取页面上所有E卡元素，为class属性包含"g-detail"的div元素
  const cardElements = document.querySelectorAll('div[class~="g-detail"]');

  // 遍历每个E卡元素，提取E卡的ID、余额、状态
  cards.length = 0; // 清空cards数组原有内容
  cardElements.forEach((cardElement) => {
    // 提取E卡的ID，为E卡元素的data-gift-id属性的值
    const id = cardElement.getAttribute("data-gift-id");

    // 提取E卡的余额，为E卡元素中【class="g-price"】的div元素中的strong子代元素的文本内容
    const balanceElement = cardElement.querySelector("div.g-price>strong");
    const balance = extractNumber(balanceElement);

    // 提取E卡的状态，如果E卡元素的class属性包含"item-selected"，则状态为0，否则为1
    const status = cardElement.className.includes("item-selected") ? 0 : 1;

    // 将E卡的信息存入cards数组中
    if (cardElement !== null && id !== null && balance !== -1) {
      cards.push({
        element: cardElement as HTMLElement,
        id: id,
        balance: balance,
        status: status,
      });
    } else {
      ElNotification({
        type: "error",
        title: scriptTitle,
        message: `E卡信息提取失败，id：${id}，balance：${balance}，status：${status}`,
      });
    }
  });

  countTableData();
}

// E卡表格条目对象，字段：balance、totalCount、selectedCount、notSelectedCount、operationNum（表示本次操作的数量）
interface CardTableEntry {
  balance: number;
  totalCount: number;
  selectedCount: number;
  notSelectedCount: number;
  operationNum: number;
}
const tableData = reactive([] as CardTableEntry[]);

/**
 * 计算cards数组中的数据，转换到tableData中
 */
function countTableData(): void {
  tableData.length = 0; // 清空tableData数组原有内容
  cards.forEach((card) => {
    const { balance, status } = card;
    const index = tableData.findIndex((item) => item.balance === balance);
    if (index === -1) {
      tableData.push({
        balance,
        totalCount: 1,
        selectedCount: status === 0 ? 1 : 0,
        notSelectedCount: status === 1 ? 1 : 0,
        operationNum: 0,
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

interface SummaryMethodProps<T = CardTableEntry> {
  columns: TableColumnCtx<T>[];
  data: T[];
}

/**
 * 计算表格各列的合计值
 */
function getSummary(param: SummaryMethodProps): string[] {
  const { columns, data } = param;
  const result: string[] = [];
  columns.forEach((column, index) => {
    // 第一列为序号列，不需要合计
    if (index === 0) {
      result[index] = "合计";
      return;
    }

    // 最后一列为操作列，不需要合计
    if (index === columns.length - 1) {
      result[index] = "";
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
        (item) => item[column.property as keyof CardTableEntry]
      );
    }

    // 只有values数组中的所有元素都是有限的数字，才将其累加求和
    if (values.every((value) => Number.isFinite(value))) {
      result[index] = values.reduce((prev, curr) => prev + curr, 0).toString();
    } else {
      ElNotification({
        type: "error",
        title: scriptTitle,
        message: `表格中第${index}列"${column.label}"的待累加数据存在异常项：${values}`,
      });
      result[index] = "";
    }
  });
  return result;
}

const loading = ref(false);
const loadingText = ref("");

/**
 * 操作E卡
 */
async function handleOperation(
  row: CardTableEntry,
  operation: number
): Promise<void> {
  const { balance, operationNum } = row;

  loading.value = true;
  loadingText.value = `操作中...0/${operationNum}`;

  const filteredCards = cards.filter((card) => card.balance === balance);

  let count = 0;
  const operationName = operation === 1 ? "选择" : "反选";
  // forEach()方法不支持await，因此使用for循环
  for (const card of filteredCards) {
    // 需要操作的E卡是status字段的值与传入的operation相等的E卡
    if (card.status === operation) {
      // 点击元素
      card.element.click();

      // 随机睡眠1~2秒
      const sleepTime = Math.round(Math.random() * 1000 + 1000);
      await sleep(sleepTime);

      // 更新E卡状态
      const currentElement = document.querySelector(
        `div[data-gift-id="${card.id}"]`
      );
      card.element = currentElement as HTMLElement;
      card.status = card.element.className.includes("item-selected") ? 0 : 1;

      if (card.status !== operation) {
        ElMessage({
          type: "success",
          message: `E卡${card.id}（面值${card.balance}）${operationName}成功，睡眠${sleepTime}ms。`,
        });
        count++;
        loadingText.value = `操作中...${count}/${operationNum}`;
      }
    }

    if (count === operationNum) {
      ElMessage({
        type: "success",
        message: `面值${balance}的${operationNum}张E卡${operationName}完成！`,
      });
      break;
    }
  }

  if (count < operationNum) {
    ElMessage({
      type: "warning",
      message: `只有${count}张面值${balance}的E卡可供${operationName}，目前已全部${operationName}完成！`,
    });
  }

  countCards();

  loading.value = false;
  loadingText.value = "";
}

/**
 * 从文本值形如“￥123.45”的HTML元素中提取金额
 */
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

/**
 * 睡眠指定毫秒数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

onMounted(() => {
  console.log("CardManager mounted");
});
</script>
