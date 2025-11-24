// js/commissions.js
// Paid Commissions app – one active job at a time.

(function () {
  const appEl        = document.getElementById("commissions-app");
  const listEl       = document.getElementById("comm-list");
  const detailMainEl = document.getElementById("comm-detail-main");
  const acceptBtn    = document.getElementById("comm-accept");
  const declineBtn   = document.getElementById("comm-decline");

  if (!appEl || !listEl || !detailMainEl || !acceptBtn || !declineBtn) return;

  // Global "active commission" lock shared with other scripts
  window.activeCommissionId = window.activeCommissionId || null;

  // --- DATA: up to 10 briefs ---
  const COMMISSIONS = [
    {
      id: "aqua-tech-logo",
      from: "Aqua Tech",
      title: "New logo",
      client: "Aqua Tech",
      project: "New logo",
      deadline: "3 days",
      deliverable: "1 Logo",
      body:
        "We’re Aqua Tech, a surfboard company built on the blend of precision engineering and ocean-born creativity. Our current logo doesn’t fully capture who we’ve grown into, and we’re looking for a fresh mark that reflects the heart of our brand.",
      status: "open",
      payout: 450
    },
    {
      id: "luna-skate-poster",
      from: "Luna Skate Co.",
      title: "Night skate event poster",
      client: "Luna Skate Co.",
      project: "Event poster",
      deadline: "1 week",
      deliverable: "1 Poster (print + digital)",
      body:
        "We’re hosting a night skate jam under blacklight. We want a bold, high-contrast poster that feels electric and rebellious, but still clearly communicates date, time, and location.",
      status: "open",
      payout: 300
    },
    {
      id: "neon-diner-menu",
      from: "Neon Diner",
      title: "Menu redesign",
      client: "Neon Diner",
      project: "Menu redesign",
      deadline: "10 days",
      deliverable: "Print-ready menu PDF",
      body:
        "Our current menu feels cluttered and hard to read. We’d love a cleaner layout that still leans into our neon, retro-futurist vibe. Strong hierarchy for categories and prices is key.",
      status: "open",
      payout: 350
    },
    {
      id: "shorebreak-hostel-brand",
      from: "Shorebreak Hostel",
      title: "Mini brand refresh",
      client: "Shorebreak Hostel",
      project: "Brand refresh",
      deadline: "2 weeks",
      deliverable: "Logo update + simple brand sheet",
      body:
        "We’re a small surf hostel that has grown a loyal community. We want a refreshed logo and a small brand sheet that helps us stay consistent across our website, stickers, and merch.",
      status: "open",
      payout: 400
    },
    {
      id: "midnight-radio-cover",
      from: "Midnight Radio",
      title: "Podcast cover art",
      client: "Midnight Radio",
      project: "Cover art",
      deadline: "5 days",
      deliverable: "Square cover art (3000×3000px)",
      body:
        "Our show is about late-night creativity, music, and conversations. We’re looking for cover art that feels moody but inviting — something that looks great both small in a feed and full-size.",
      status: "open",
      payout: 275
    }
  ];
  

  let current = null;
  const itemById = new Map();

  // -------- helpers --------

  function hasAnyActiveJob() {
    // Email brief (Flower Haus) counts as an active job
    const flowerActive =
      !!window.flowerHausJobActive && !window.flowerHausJobComplete;

    const commissionActive = !!window.activeCommissionId;

    return flowerActive || commissionActive;
  }

  function renderList() {
    listEl.innerHTML = "";
    itemById.clear();

    COMMISSIONS.forEach((c) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "comm-item";
      btn.dataset.id = c.id;

      btn.innerHTML = `
        <div class="comm-item-from">From: ${c.from}</div>
        <div class="comm-item-title">${c.title}</div>
      `;

      btn.addEventListener("click", () => {
        selectCommission(c.id);
      });

      listEl.appendChild(btn);
      itemById.set(c.id, btn);
    });

    updateActiveState();
  }

  function selectCommission(id) {
    const c = COMMISSIONS.find((x) => x.id === id);
    if (!c) return;
    current = c;
    renderDetail(c);
    updateActiveState();
  }

  function renderDetail(c, opts) {
    opts = opts || {};

    let statusLabel = "Open";
    let note = "";

    if (c.status === "accepted") {
      statusLabel = "In progress";
      note =
        "This job is currently active. Finish your design in the Design app and hit Upload to complete it.";
    } else if (c.status === "completed") {
      statusLabel = "Completed";
      note = opts.showCongrats
        ? "🎉 Job completed! Great work on this commission."
        : "This commission has been completed.";
    } else if (c.status === "declined") {
      statusLabel = "Declined";
      note = "You turned this commission down.";
    }

    detailMainEl.innerHTML = `
      <div class="comm-detail-lines">
        <p><strong>Client:</strong> ${c.client}</p>
        <p><strong>Project:</strong> ${c.project}</p>
        <p><strong>Deadline:</strong> ${c.deadline}</p>
        <p><strong>Deliverable:</strong> ${c.deliverable}</p>
      </div>

      <p class="comm-detail-body">
        ${c.body}
      </p>

      <p class="comm-detail-status">
        <strong>Status:</strong> ${statusLabel}
      </p>

      ${note ? `<p class="comm-detail-note">${note}</p>` : ""}
    `;

    // Button state based on status
    if (c.status === "completed") {
      acceptBtn.disabled = true;
      declineBtn.disabled = true;
    } else if (c.status === "accepted") {
      acceptBtn.disabled = true;
      declineBtn.disabled = true; // locked in; finish via Upload
    } else if (c.status === "declined") {
      acceptBtn.disabled = false;
      declineBtn.disabled = true;
    } else {
      // open
      acceptBtn.disabled = false;
      declineBtn.disabled = false;
    }
  }

  function updateActiveState() {
    itemById.forEach((btn, id) => {
      btn.classList.toggle("is-active", current && current.id === id);
    });
  }

  function findCommissionById(id) {
    return COMMISSIONS.find((c) => c.id === id) || null;
  }

  // -------- accept / decline handlers --------

  acceptBtn.addEventListener("click", () => {
    if (!current) return;
  
    if (current.status !== "open") {
      alert("This commission is not open to accept.");
      return;
    }
  
    // global lock: only one job (brief OR commission) at a time
    if (hasAnyActiveJob()) {
      alert(
        "You already have an active job. Finish that project and upload your design before accepting another commission."
      );
      return;
    }
  
    current.status = "accepted";
  
    // ⭐ IMPORTANT ⭐  
    window.activeCommissionId = current.id;
  
    renderDetail(current);
    updateActiveState();
  });
  

  declineBtn.addEventListener("click", () => {
    if (!current) return;

    if (current.status === "accepted" && window.activeCommissionId === current.id) {
      alert(
        "You already accepted this commission. Finish it through the Design app upload to complete the job."
      );
      return;
    }

    if (current.status === "completed") {
      alert("This commission is already completed.");
      return;
    }

    current.status = "declined";
    if (window.activeCommissionId === current.id) {
      window.activeCommissionId = null;
    }
    renderDetail(current);
    updateActiveState();
  });

  // -------- API for other scripts (Design app upload) --------

// Called from the Design app when the player hits Upload.
window.markActiveCommissionCompleted = function () {
  if (!window.activeCommissionId) {
    alert("No active commission found to complete.");
    return null;
  }

  const c = findCommissionById(window.activeCommissionId);
  window.activeCommissionId = null;

  if (!c) {
    alert("Something went wrong finding that commission.");
    return null;
  }

  c.status = "completed";

      // pay the player for the job
      if (typeof window.cashAddIncome === "function") {
        const label = `${c.client} – ${c.title}`;
        window.cashAddIncome(c.payout || 0, label, "job");
      }
  
  // Hide the design window and bring Commissions to the front
  const designWin = document.getElementById("win-design");
  const commWin   = document.getElementById("win-commissions");

  if (designWin) {
    designWin.classList.add("hidden");
  }

  if (commWin) {
    commWin.classList.remove("hidden");
    commWin.style.display = "block";
  }

  current = c;
  renderDetail(c, { showCongrats: true });
  updateActiveState();

  // Extra feedback so you KNOW it fired
  alert("Job completed! Your commission has been submitted.");

  return c;
};


  // Initial render
  renderList();
})();
