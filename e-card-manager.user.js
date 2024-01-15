// ==UserScript==
// @name         京东E卡管理器
// @namespace    https://github.com/OreoProMax/e-card-manager
// @version      1.0
// @description  在京东下单时快捷选择E卡
// @icon         https://www.jd.com/favicon.ico
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @author       OreoProMax
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @resource     pureCss https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css
// @match        https://trade.jd.com/*
// @updateURL        https://github.com/OreoProMax/e-card-manager/raw/main/e-card-manager.user.js
// @downloadURL        https://github.com/OreoProMax/e-card-manager/raw/e-card-manager/e-card-manager.user.js
// @supportURL        https://github.com/OreoProMax/e-card-manager/issues
// ==/UserScript==

(function() {
    'use strict';

    // 加载 Ant Design / Bootstrap / MVP / Bulma CSS 均会影响页面原有元素样式
    // GM_addStyle(GM_getResourceText('antDesignCss'));
    // GM_addStyle(GM_getResourceText('bootstrapCss'));
    // GM_addStyle(GM_getResourceText('mvpCss'));
    // GM_addStyle(GM_getResourceText('bulmaCss'));
    GM_addStyle(GM_getResourceText('pureCss'));

    addButton();
})();

function addButton() {
    // 创建“E卡管理”按钮
    let button = document.createElement('button');
    button.textContent = 'E卡管理';

    // 设置按钮样式
    button.className = 'pure-button pure-button-primary';
    button.style.float = 'right';
    button.style.marginRight = '8.7%';
    button.style.marginTop = '0.5%';

    // 添加按钮点击事件
    button.addEventListener('click', showGiftcardModal);

    // 将按钮添加到页面中
    let addLocation = document.querySelector('div.giftcard-tab.ml20');
    addLocation.appendChild(button);
}

function showGiftcardModal() {
    let giftcardsMap = calculateGiftcardStatistics();
    let amountLeft = queryAmountLeft();

    // 计算礼品卡的总数量和总面值
    let totalBalance = 0, totalCount = 0;
    for (let [balance, count] of giftcardsMap) {
        totalBalance += balance * count;
        totalCount += count;
    }

    // 创建表格
    let tableHtml =
        `<table class="pure-table pure-table-striped" style="width: 75%; margin: 3% auto;">
            <thead style="text-align: center;">
                <tr>
                    <th>余额</th>
                    <th>数量</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>`;
    for (let [balance, count] of giftcardsMap) {
        tableHtml +=
                `<tr>
                    <td>${balance}</td>
                    <td>${count}</td>
                    <td>
                        <button class="pure-button pure-button-primary" data-balance="${balance}">选择</button>
                    </td>
                </tr>`;
    }
    tableHtml +=
            `</tbody>
        </table>`;
    tableHtml +=
        `<table class="pure-table pure-table-striped" style="width: 75%; margin: 0px auto;">
            <thead style="text-align: center;">
                <tr>
                    <th>总余额</th>
                    <th>总数量</th>
                    <th>订单金额</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${totalBalance}</td>
                    <td>${totalCount}</td>
                    <td>${amountLeft}</td>
                </tr>
            </tbody>
        </table>`;

    Swal.fire({
        title: "Operator",
        html: tableHtml,
    });

    // 为按钮添加点击监听器
    let buttons = document.querySelectorAll('div.swal2-html-container button.pure-button.pure-button-primary');
    buttons.forEach(function (button) {
        button.addEventListener('click', function () {
            selectGiftcard(button.getAttribute("data-balance"));
        });
    });
}

function calculateGiftcardStatistics() {
    let giftcards = document.querySelectorAll('div.g-price>strong');

    // 使用 giftcardsMap 来存储所有面值及其对应的张数
    let giftcardsMap = new Map();
    giftcards.forEach(function(giftcard) {
        let balance = extractNumber(giftcard);

        // 若当前面值已存在于 Map 中，则增加数量；若不存在，则将其添加到 Map ，并将数量初始化为 1
        if (giftcardsMap.has(balance)) {
            giftcardsMap.set(balance, giftcardsMap.get(balance) + 1);
        } else {
            giftcardsMap.set(balance, 1);
        }
    });

    // 将 giftcardsMap 转换为数组，并按照面值从小到大排序后转换回 giftcardsMap
    let sortedGiftcardArray = Array.from(giftcardsMap.entries()).sort((a, b) => a[0] - b[0]);
    giftcardsMap = new Map(sortedGiftcardArray);

    return giftcardsMap;
}

async function selectGiftcard(balance) {
    // 查询目前订单中可用于充抵的金额
    let amountLeft = queryAmountLeft();

    if (amountLeft <= 0) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "似乎订单中已经没有可用于充抵的金额！",
        });
    }
    else {
        let giftcards = document.querySelectorAll('div.g-price>strong');

        // 遍历 giftcards ，若当前面值与传入的 balance 相同且订单中尚有剩余金额，则选择该礼品卡
        let count = 0;
        for (let giftcard of giftcards) {
            if (extractNumber(giftcard) === Number(balance) && !isSelected(giftcard)) {
                amountLeft = queryAmountLeft();
                if (amountLeft <= 0) {
                    Swal.fire({
                        icon: "success",
                        title: "Success!",
                        text: "当前已选卡已经全部覆盖订单金额！",
                    });
                    break;
                }
                else {
                    giftcard.parentNode.parentNode.click();
                    let time = Math.round(Math.random() * 1000 + 1000);
                    console.log(`本次已选上第${++count}张面值${balance}的礼品卡，执行睡眠${time}毫秒`);
                    await sleep(time);
                }
            }
        }
    }
}

function extractNumber(element) {
    return Number(element.textContent.replace('￥', ''));
}

function queryAmountLeft() {
    return extractNumber(document.getElementById('sumPayPriceId'));
}

function isSelected(giftcard) {
    return giftcard.parentNode.parentNode.parentNode.className.includes('item-selected');
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}