// email.js – brief-style inbox matching the mockup

(function () {
  const listEl    = document.getElementById("m-list");
  const subjEl    = document.getElementById("m-subj");
  const bodyEl    = document.getElementById("m-body");
  const actionsEl = document.getElementById("m-actions");
  const appEl     = document.getElementById("email-app");

  if (!listEl || !bodyEl || !appEl) return;

  // ----- DATA: Flower Haus brief -----
  const EMAILS = [
    {
      id: "flower-haus-issue-1",
      subject: 'New Brief: Design the cover for Griffin\'s first issue of "Flower Haus" magazine.',
      body: [
        "Client: Griffin Flowers",
        "Project: Flower Haus – Issue 1 Cover Design",
        "Deadline: 3 days",
        "Deliverable: 1 digital cover file",
        "",
        "Hey, I’m Griffin nice to meet you. I’m finally ready to release the first issue of my magazine,",
        "Flower Haus, and I need a cover that really sets the tone.",
        "Its basically sports illustrated for Graphic Designers",
        "I want the layout to have a clear visual hierarchy",
        "so the title, issue info, and main headline stand out.",
        "",
        "Use an Analogous color palette that feels cohesive and intentional,",
        "not random. Everything on the cover should feel like it belongs",
        "together strong Unity between type, imagery, and background.",
        "You can get experimental with everything else just make sure it",
        "Stays on theme."
      ].join("\n")
    }
  ];

  const statusById = {};
  let currentId = null;

  // ----- RENDER LEFT COLUMN -----
  function renderList() {
    listEl.innerHTML = "";

    EMAILS.forEach(email => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "email-card";
      btn.dataset.id = email.id;
      btn.textContent = email.subject;

      btn.addEventListener("click", () => selectEmail(email.id));

      listEl.appendChild(btn);
    });

    // three blank placeholders
    for (let i = 0; i < 3; i++) {
      const empty = document.createElement("button");
      empty.type = "button";
      empty.className = "email-card email-card--empty";
      empty.disabled = true;
      listEl.appendChild(empty);
    }
  }

  // ----- WHEN PLAYER CLICKS A BRIEF -----
  function selectEmail(id) {
    currentId = id;

    listEl.querySelectorAll(".email-card").forEach(btn => {
      const isSelected = btn.dataset.id === id;
      btn.classList.toggle("email-card--selected", isSelected);
    });

    const email = EMAILS.find(e => e.id === id);
    if (!email) return;

    appEl.classList.add("email-has-selection");

    subjEl.textContent = email.subject;
    bodyEl.textContent = email.body;

    renderActions();
  }

  // ----- ACCEPT / DECLINE BUTTONS -----
  function renderActions() {
    actionsEl.innerHTML = "";
    if (!currentId) return;

    const acceptBtn = document.createElement("button");
    acceptBtn.type = "button";
    acceptBtn.className = "email-btn email-btn-accept";
    acceptBtn.textContent = "Accept Brief";

    const declineBtn = document.createElement("button");
    declineBtn.type = "button";
    declineBtn.className = "email-btn email-btn-decline";
    declineBtn.textContent = "Decline";

    acceptBtn.addEventListener("click", () => {
      statusById[currentId] = "accepted";
      if (window.onBriefAccepted) window.onBriefAccepted(currentId);
      acceptBtn.textContent = "Accepted!";

      // Trigger Griffin dialogue when Flower Haus brief is accepted
      if (
        currentId === "flower-haus-issue-1" &&
        typeof window.startFlowerHausDialogue === "function"
      ) {
        window.startFlowerHausDialogue();
      }
    });

    declineBtn.addEventListener("click", () => {
      statusById[currentId] = "declined";
      if (window.onBriefDeclined) window.onBriefDeclined(currentId);
      declineBtn.textContent = "Declined";
    });

    actionsEl.appendChild(acceptBtn);
    actionsEl.appendChild(declineBtn);
  }

  // ----- INITIAL STATE: no text until click -----
  function init() {
    renderList();
    currentId = null;
    appEl.classList.remove("email-has-selection");
    subjEl.textContent = "(no message selected)";
    bodyEl.textContent = "";
    actionsEl.innerHTML = "";
  }

  init();
})();
