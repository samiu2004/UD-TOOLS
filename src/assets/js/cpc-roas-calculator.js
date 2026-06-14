(function () {
  const spendInput = document.getElementById("adSpend");
  const clicksInput = document.getElementById("clicks");
  const conversionsInput = document.getElementById("conversions");
  const revenueInput = document.getElementById("revenue");

  if (!spendInput || !clicksInput || !conversionsInput || !revenueInput) return;

  const clearBtn = document.getElementById("cpcClearBtn");
  const sampleBtn = document.getElementById("cpcSampleBtn");

  const cpcEl = document.getElementById("calcCpc");
  const cpaEl = document.getElementById("calcCpa");
  const convRateEl = document.getElementById("calcConvRate");
  const roasEl = document.getElementById("calcRoas");
  const roasPercentEl = document.getElementById("calcRoasPercent");
  const profitEl = document.getElementById("calcProfit");
  const summaryEl = document.getElementById("cpcSummary");

  function getNumber(value) {
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : 0;
  }

  function money(value) {
    return value.toFixed(2);
  }

  function percent(value) {
    return `${value.toFixed(2)}%`;
  }

  function updateSummary(spend, clicks, conversions, revenue, cpc, cpa, convRate, roas, profit) {
    if (!spend && !clicks && !conversions && !revenue) {
      summaryEl.innerHTML = '<p class="muted">Campaign guidance will appear here as you fill in the fields.</p>';
      return;
    }

    const notes = [];

    if (clicks > 0) {
      notes.push(`<p><strong>CPC:</strong> You are paying ${money(cpc)} per click.</p>`);
    } else {
      notes.push("<p><strong>CPC:</strong> Add clicks to calculate cost per click.</p>");
    }

    if (conversions > 0) {
      notes.push(`<p><strong>CPA:</strong> Your current cost per acquisition is ${money(cpa)}.</p>`);
    } else {
      notes.push("<p><strong>CPA:</strong> Add conversions to calculate cost per acquisition.</p>");
    }

    if (clicks > 0) {
      notes.push(`<p><strong>Conversion rate:</strong> ${percent(convRate)} of clicks are converting.</p>`);
    }

    if (spend > 0) {
      notes.push(`<p><strong>ROAS:</strong> Your campaign is returning ${roas.toFixed(2)}x (${percent(roas * 100)}).</p>`);
    } else {
      notes.push("<p><strong>ROAS:</strong> Add ad spend to calculate return on ad spend.</p>");
    }

    if (spend > 0 && revenue > 0) {
      if (profit > 0) {
        notes.push(`<p><strong>Revenue minus spend:</strong> You are ahead by ${money(profit)} before other business costs.</p>`);
      } else if (profit < 0) {
        notes.push(`<p><strong>Revenue minus spend:</strong> You are behind by ${money(Math.abs(profit))} before other business costs.</p>`);
      } else {
        notes.push("<p><strong>Revenue minus spend:</strong> Revenue and ad spend are currently equal.</p>");
      }
    }

    summaryEl.innerHTML = notes.join("");
  }

  function calculate() {
    const spend = getNumber(spendInput.value);
    const clicks = getNumber(clicksInput.value);
    const conversions = getNumber(conversionsInput.value);
    const revenue = getNumber(revenueInput.value);

    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;
    const convRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const roas = spend > 0 ? revenue / spend : 0;
    const roasPercent = roas * 100;
    const profit = revenue - spend;

    cpcEl.textContent = money(cpc);
    cpaEl.textContent = money(cpa);
    convRateEl.textContent = percent(convRate);
    roasEl.textContent = `${roas.toFixed(2)}x`;
    roasPercentEl.textContent = percent(roasPercent);
    profitEl.textContent = money(profit);

    updateSummary(spend, clicks, conversions, revenue, cpc, cpa, convRate, roas, profit);
  }

  function clearAll() {
    spendInput.value = "";
    clicksInput.value = "";
    conversionsInput.value = "";
    revenueInput.value = "";
    calculate();
  }

  function loadSample() {
    spendInput.value = "1200";
    clicksInput.value = "800";
    conversionsInput.value = "32";
    revenueInput.value = "4800";
    calculate();
  }

  [spendInput, clicksInput, conversionsInput, revenueInput].forEach((input) => {
    input.addEventListener("input", calculate);
  });

  clearBtn.addEventListener("click", clearAll);
  sampleBtn.addEventListener("click", loadSample);

  calculate();
})();