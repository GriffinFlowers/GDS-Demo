// Briefs app — loads a list of design briefs 1–6

const briefs = [
  { id: 1, title: "Brief 1: Magazine Cover", desc: "Create a bold cover design for 'Flower Haus' Issue #1." },
  { id: 2, title: "Brief 2: Logo Redesign", desc: "Redesign the logo for a modern surf apparel brand." },
  { id: 3, title: "Brief 3: Poster Design", desc: "Design an 18x24 poster for a local art festival." },
  { id: 4, title: "Brief 4: Website Hero Banner", desc: "Create a clean hero section for a spa landing page." },
  { id: 5, title: "Brief 5: Product Label", desc: "Design packaging and label for a new cold brew line." },
  { id: 6, title: "Brief 6: Social Campaign", desc: "Develop a set of 3 social media posts for a product launch." },
];

const list = document.getElementById("briefs-list");
if (list) {
  briefs.forEach(b => {
    const card = document.createElement("div");
    card.className = "brief-card";

    const title = document.createElement("div");
    title.className = "brief-title";
    title.textContent = b.title;

    const desc = document.createElement("div");
    desc.className = "brief-desc";
    desc.textContent = b.desc;

    card.appendChild(title);
    card.appendChild(desc);
    card.addEventListener("click", () => {
      alert(`Opening ${b.title}... (this could open a detailed view later)`);
    });

    list.appendChild(card);
  });
}
