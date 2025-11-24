// js/cash.js
// Cash Tracker – balance, transactions, and rent.

(function () {
  const app          = document.getElementById("cash-app");
  const balanceEl    = document.getElementById("cash-balance");
  const historyEl    = document.getElementById("cash-history");
  const payRentBtn   = document.getElementById("cash-pay-rent");
  const rentAmtEl    = document.getElementById("cash-rent-amount");
  const rentStatusEl = document.getElementById("cash-rent-status");

  if (!app || !balanceEl || !historyEl) return;

  const STORAGE_KEY = "gd_cash_state_v1";

  // -------- state --------
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn("cash: failed to load state", e);
      return null;
    }
  }

  const defaultState = {
    balance: 0,
    history: [],              // {id, type: 'income'|'expense', amount, label, source, time}
    rentAmount: 300,
    rentPaidThisCycle: false,
    jobsCompleted: 0,
    jobsSinceRent: 0
  };

  let state = Object.assign({}, defaultState, loadState() || {});
  save();
  render();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("cash: failed to save state", e);
    }
  }

  function money(n) {
    n = Number(n) || 0;
    return "$" + n.toFixed(2);
  }

  // -------- rendering --------
  function render() {
    balanceEl.textContent = money(state.balance);
    if (rentAmtEl) rentAmtEl.textContent = money(state.rentAmount);

    if (rentStatusEl) {
      rentStatusEl.textContent = state.rentPaidThisCycle
        ? "Status: Rent paid for this cycle."
        : `Status: Rent not paid. Jobs this cycle: ${state.jobsSinceRent}`;
    }

    historyEl.innerHTML = "";
    if (!state.history.length) {
      const p = document.createElement("p");
      p.className = "cash-history-empty";
      p.textContent = "No transactions yet. Finish a job or pay an expense to get started.";
      historyEl.appendChild(p);
      return;
    }

    // newest first
    const items = state.history.slice().reverse();
    items.forEach((tx) => {
      const row = document.createElement("div");
      row.className = "cash-tx cash-tx-" + tx.type;

      const signedAmount = tx.type === "expense" ? -tx.amount : tx.amount;

      row.innerHTML = `
        <div class="cash-tx-main">
          <span class="cash-tx-label">${tx.label}</span>
          <span class="cash-tx-amount">${money(signedAmount)}</span>
        </div>
        <div class="cash-tx-meta">
          ${tx.type === "income" ? "Income" : "Expense"}
          ${tx.source ? " • " + tx.source : ""}
        </div>
      `;

      historyEl.appendChild(row);
    });
  }

  // -------- core helpers --------
  function addTransaction(type, amount, label, source) {
    amount = Number(amount) || 0;
    if (!amount) return;

    const tx = {
      id: "tx-" + Date.now() + "-" + Math.random().toString(16).slice(2),
      type,
      amount: Math.abs(amount),
      label: label || (type === "income" ? "Income" : "Expense"),
      source: source || "",
      time: Date.now()
    };

    if (type === "income") {
      state.balance += tx.amount;
      state.jobsCompleted += source === "job" ? 1 : 0;
      if (source === "job") {
        state.jobsSinceRent += 1;
        state.rentPaidThisCycle = false;
      }
    } else {
      state.balance -= tx.amount;
    }

    state.history.push(tx);
    save();
    render();
  }

  function payRent() {
    const amt = state.rentAmount;
    if (state.balance < amt) {
      alert("You don't have enough money to pay rent yet.");
      return;
    }

    addTransaction("expense", amt, "Rent", "rent");
    state.jobsSinceRent = 0;
    state.rentPaidThisCycle = true;
    save();
    render();
  }

  // -------- wire UI --------
  payRentBtn?.addEventListener("click", payRent);

  // -------- public API for other game systems --------

  // Called when a job pays out (Flower Haus, commissions, etc.)
  window.cashAddIncome = function (amount, label, sourceType) {
    addTransaction("income", amount, label, sourceType || "job");
  };

  // Optional: manual expenses if you ever want them
  window.cashAddExpense = function (amount, label, sourceType) {
    addTransaction("expense", amount, label, sourceType || "manual");
  };

  // Optional direct rent call
  window.cashPayRent = payRent;
})();
