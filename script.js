// 期数信息
let PERIODS = [];
// 每期期的数据缓存：{ periodId: { fid: result, ... } }
const periodDataCache = {};
// 当前选择的期数
let selectedPeriodId = null;

// 祝福语
const winBlessTexts = [
  "恭喜老板喜提好运，财源滚滚、票票开花！",
  "这单开开心心入账，祝老板年年红火、单单爆奖！",
  "大奖已到账，后面还有更大的在路上～",
  "好运挡不住，恭喜老板笔笔有惊喜！"
];

const missBlessTexts = [
  "这次没中也没关系，老板福气正积累，后面大奖一并来。",
  "小小遗憾挡不住大好运，祝老板下期一发入魂！",
  "今天是“攒人品”的一天，大奖在下一期等你～",
  "好运在路上，老板保持心情红红火火就对了。"
];

function getRandomBless(isHit) {
  const list = isHit ? winBlessTexts : missBlessTexts;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

// 加载期数列表：periods.json
function loadPeriods() {
  return fetch("periods.json?t=" + Date.now())
    .then((res) => {
      if (!res.ok) {
        throw new Error("加载 periods.json 失败");
      }
      return res.json();
    })
    .then((json) => {
      PERIODS = json || [];
      const select = document.getElementById("period-select");
      select.innerHTML = "";

      if (!PERIODS.length) {
        const option = document.createElement("option");
        option.value = "";
        option.textContent = "暂无期数数据";
        select.appendChild(option);
        return;
      }

      // 按 id 排序（假设是数字字符串）
      PERIODS.sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        if (isNaN(na) || isNaN(nb)) return String(a.id).localeCompare(String(b.id));
        return na - nb;
      });

      // 默认选最新一期（最后一项）
      PERIODS.forEach((p, index) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.label || `第${p.id}期`;
        if (index === PERIODS.length - 1) {
          option.selected = true;
          selectedPeriodId = p.id;
        }
        select.appendChild(option);
      });
    })
    .catch((err) => {
      console.error("加载 periods.json 出错：", err);
      alert("期数数据加载失败，请稍后刷新页面重试。");
    });
}

// 加载某一期的数据：data_period_{id}.json
function loadDataForPeriod(periodId) {
  if (!periodId) {
    return Promise.reject(new Error("未选择期数"));
  }

  if (periodDataCache[periodId]) {
    return Promise.resolve(periodDataCache[periodId]);
  }

  const fileName = `data_period_${periodId}.json`;
  return fetch(fileName + "?t=" + Date.now())
    .then((res) => {
      if (!res.ok) {
        throw new Error("加载 " + fileName + " 失败");
      }
      return res.json();
    })
    .then((json) => {
      periodDataCache[periodId] = json || {};
      console.log(
        `期数 ${periodId} 数据加载完成：`,
        Object.keys(periodDataCache[periodId]).length,
        "条"
      );
      return periodDataCache[periodId];
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const input = document.getElementById("invoice-input");
  const btn = document.getElementById("search-btn");
  const resultCard = document.getElementById("result-card");
  const resultEmoji = document.getElementById("result-emoji");
  const resultTitle = document.getElementById("result-title");
  const resultMain = document.getElementById("result-main");
  const resultBless = document.getElementById("result-bless");
  const periodSelect = document.getElementById("period-select");

  // 先加载期数列表
  loadPeriods().then(() => {
    // 默认加载当前选中的那一期的数据（可选）
    if (selectedPeriodId) {
      loadDataForPeriod(selectedPeriodId).catch(() => {});
    }
  });

  // 切换期数时，更新当前选择，并清空结果展示
  periodSelect.addEventListener("change", function (e) {
    selectedPeriodId = e.target.value || null;
    resultCard.classList.add("hidden");
  });

  function showResult(isHit, mainText) {
    resultCard.classList.remove("hidden", "win", "miss");

    if (isHit) {
      resultCard.classList.add("win");
      resultEmoji.textContent = "🎉";
      resultTitle.textContent = "恭喜老板中奖！";
      resultMain.textContent = mainText;
      resultBless.textContent = getRandomBless(true);
    } else {
      resultCard.classList.add("miss");
      resultEmoji.textContent = "🍀";
      resultTitle.textContent = "这期缘分未到～";
      resultMain.textContent = mainText;
      resultBless.textContent = getRandomBless(false);
    }
  }

  function handleSearch() {
    const raw = (input.value || "").trim();

    if (!selectedPeriodId) {
      alert("请先选择期数");
      return;
    }

    if (!raw) {
      alert("请输入发票号码");
      return;
    }

    loadDataForPeriod(selectedPeriodId)
      .then((DATA) => {
        const result = DATA[raw];
        if (result) {
          showResult(true, `【第${selectedPeriodId}期】查询成功：${result}`);
        } else {
          showResult(
            false,
            `【第${selectedPeriodId}期】未查询到该发票的记录（可能未匹配到活动或尚未录入）。`
          );
        }
      })
      .catch((err) => {
        console.error("加载期数数据失败：", err);
        alert("期数数据加载失败，请稍后重试。");
      });
  }

  btn.addEventListener("click", handleSearch);

  // 回车键也可以触发查询
  input.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  });
});