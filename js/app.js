// ── app.js ──
import { watchAuth, loginGoogle, loginEmail, signupEmail, logout } from "./auth.js";
import { saveEntry, getAllEntries, getTodayPrompt, updateStreak, getUserProfile } from "./firestore.js";
import { uploadImage } from "./cloudinary.js";

// ═══════════════════════════════
//  NAVIGATION
// ═══════════════════════════════
const SCREENS_WITH_NAV = ["home", "editor", "journal", "profile"];

export function showScreen(name) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById("screen-" + name).classList.add("active");

  const nav = document.getElementById("bottom-nav");
  nav.style.display = SCREENS_WITH_NAV.includes(name) ? "flex" : "none";

  // Sync nav active
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.screen === name);
  });

  if (name === "home")    buildMiniCal();
  if (name === "journal") loadJournal();
  if (name === "profile") loadProfile();
  if (name === "editor")  loadEditorPrompt();
}

// ═══════════════════════════════
//  HOME
// ═══════════════════════════════
export async function renderHome(user) {
  // Date en français
  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  document.getElementById("greeting-date").textContent = dateStr;

  // Nom
  const name = user.displayName ? user.displayName.split(" ")[0] : "Créatif";
  document.getElementById("greeting-name").textContent = `Bonjour, ${name} 👋`;

  // Prompt du jour
  document.getElementById("daily-prompt").textContent = `"${getTodayPrompt()}"`;

  // Streak
  try {
    const streak = await updateStreak();
    document.getElementById("streak-count").textContent = streak;
  } catch (_) {}

  buildMiniCal();
}

// ═══════════════════════════════
//  MINI CALENDRIER (Home)
// ═══════════════════════════════
async function buildMiniCal() {
  const el = document.getElementById("mini-cal");
  if (!el) return;

  let filledDays = [];
  try {
    const entries = await getAllEntries();
    filledDays = entries.map(e => parseInt(e.id.split("-")[2]));
  } catch (_) {}

  const today = new Date().getDate();
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  el.innerHTML = "";

  for (let d = 1; d <= daysInMonth; d++) {
    const div = document.createElement("div");
    div.className = "cal-day"
      + (filledDays.includes(d) ? " filled" : "")
      + (d === today ? " today" : "");
    div.textContent = d;
    el.appendChild(div);
  }
}

// ═══════════════════════════════
//  ÉDITEUR
// ═══════════════════════════════
function loadEditorPrompt() {
  const el = document.getElementById("editor-prompt-text");
  if (el) el.textContent = `"${getTodayPrompt()}"`;
}

let selectedMood = "";
let selectedFile = null;

function initEditor() {
  // Mood pills
  document.querySelectorAll(".mood-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      document.querySelectorAll(".mood-pill").forEach(p => p.classList.remove("selected"));
      pill.classList.add("selected");
      selectedMood = pill.dataset.mood;
    });
  });

  // Upload image
  const zone  = document.getElementById("upload-zone");
  const input = document.getElementById("img-input");
  zone.addEventListener("click", () => input.click());
  input.addEventListener("change", () => {
    selectedFile = input.files[0];
    if (!selectedFile) return;
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById("preview-img").src = e.target.result;
      document.getElementById("img-preview").style.display = "block";
    };
    reader.readAsDataURL(selectedFile);
  });

  // Sauvegarder
  document.getElementById("btn-save-entry").addEventListener("click", async () => {
    const text = document.getElementById("entry-text").value.trim();
    if (!text) { showToast("Écris quelque chose d'abord 📝"); return; }

    showToast("Sauvegarde en cours...");
    let imageUrl = null;

    try {
      if (selectedFile) imageUrl = await uploadImage(selectedFile);
      await saveEntry({ text, mood: selectedMood, imageUrl });
      showToast("Entrée publiée ✦");
      document.getElementById("entry-text").value = "";
      selectedMood = "";
      selectedFile = null;
      document.getElementById("img-preview").style.display = "none";
      document.querySelectorAll(".mood-pill").forEach(p => p.classList.remove("selected"));
      setTimeout(() => showScreen("journal"), 800);
    } catch (e) {
      showToast("Erreur : " + e.message);
    }
  });
}

// ═══════════════════════════════
//  JOURNAL
// ═══════════════════════════════
async function loadJournal() {
  const list = document.getElementById("entries-list");
  const meta = document.getElementById("journal-meta");
  const grid = document.getElementById("month-grid");
  list.innerHTML = "<p style='color:var(--sub);padding:0 24px;'>Chargement...</p>";

  try {
    const entries = await getAllEntries();
    const filledDays = entries.map(e => parseInt(e.id.split("-")[2]));
    const today = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();

    // Grille mensuelle
    grid.innerHTML = "";
    for (let d = 1; d <= daysInMonth; d++) {
      const div = document.createElement("div");
      div.className = "month-day"
        + (filledDays.includes(d) ? " has-entry" : "")
        + (d === today ? " today-day" : "")
        + (d > today ? " empty" : "");
      div.textContent = d;
      grid.appendChild(div);
    }

    // Méta
    const monthName = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    meta.textContent = `${monthName} · ${entries.length} entrée${entries.length > 1 ? "s" : ""}`;

    // Liste
    if (entries.length === 0) {
      list.innerHTML = "<p style='color:var(--sub);padding:0 24px;'>Aucune entrée pour l'instant ✨</p>";
      return;
    }

    list.innerHTML = entries.map(e => {
      const date = new Date(e.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      const preview = e.text.length > 120 ? e.text.slice(0, 120) + "..." : e.text;
      const img = e.imageUrl ? `<img src="${e.imageUrl}" style="width:100%;border-radius:12px;margin-top:10px;" alt=""/>` : "";
      return `
        <div class="entry-card">
          <div class="entry-date">${date}</div>
          <div class="entry-preview">"${preview}"</div>
          ${img}
          <div class="entry-mood">${e.mood || ""}</div>
        </div>`;
    }).join("");

  } catch (e) {
    list.innerHTML = `<p style='color:var(--sub);padding:0 24px;'>Erreur : ${e.message}</p>`;
  }
}

// ═══════════════════════════════
//  PROFIL
// ═══════════════════════════════
async function loadProfile() {
  const user = (await import("./firebase-init.js")).auth.currentUser;
  if (!user) return;

  document.getElementById("profile-name").textContent  = user.displayName || "Créatif";
  document.getElementById("profile-email").textContent = user.email || "";

  try {
    const profile  = await getUserProfile();
    const entries  = await getAllEntries();
    const months   = new Set(entries.map(e => e.id.slice(0, 7))).size;
    document.getElementById("stat-streak").textContent  = profile.streak || 0;
    document.getElementById("stat-entries").textContent = entries.length;
    document.getElementById("stat-months").textContent  = months;
  } catch (_) {}
}

// ═══════════════════════════════
//  TOAST
// ═══════════════════════════════
export function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
}

// ═══════════════════════════════
//  AUTH EVENTS
// ═══════════════════════════════
function initAuth() {
  let mode = "login";

  document.getElementById("btn-start").addEventListener("click", () => showScreen("auth"));

  document.getElementById("tab-login").addEventListener("click", () => {
    mode = "login";
    document.getElementById("tab-login").classList.add("active");
    document.getElementById("tab-signup").classList.remove("active");
    document.getElementById("auth-submit-btn").textContent = "Se connecter";
  });

  document.getElementById("tab-signup").addEventListener("click", () => {
    mode = "signup";
    document.getElementById("tab-signup").classList.add("active");
    document.getElementById("tab-login").classList.remove("active");
    document.getElementById("auth-submit-btn").textContent = "Créer mon compte";
  });

  document.getElementById("auth-submit-btn").addEventListener("click", async () => {
    const email    = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    if (!email || !password) { showToast("Remplis tous les champs 📝"); return; }
    try {
      if (mode === "login") await loginEmail(email, password);
      else                  await signupEmail(email, password);
    } catch (e) {
      showToast("Erreur : " + e.message);
    }
  });

  document.getElementById("btn-google").addEventListener("click", async () => {
    try { await loginGoogle(); }
    catch (e) { showToast("Erreur Google : " + e.message); }
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await logout();
    showScreen("onboarding");
  });
}

// ═══════════════════════════════
//  NAV EVENTS
// ═══════════════════════════════
function initNav() {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });

  document.getElementById("btn-go-editor").addEventListener("click",  () => showScreen("editor"));
  document.getElementById("btn-go-journal").addEventListener("click", () => showScreen("journal"));
  document.getElementById("btn-go-profile").addEventListener("click", () => showScreen("profile"));
  document.getElementById("btn-back-editor").addEventListener("click",() => showScreen("home"));
}

// ═══════════════════════════════
//  INIT
// ═══════════════════════════════
initAuth();
initNav();
initEditor();
watchAuth();
