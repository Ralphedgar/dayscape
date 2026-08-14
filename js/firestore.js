// ── firestore.js ──
import { db } from "./firebase-init.js";
import { auth } from "./firebase-init.js";
import {
  doc, setDoc, getDoc, collection,
  getDocs, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Clé du jour (ex: "2026-08-14") ──
export function todayKey() {
  return new Date().toISOString().split("T")[0];
}

// ── Sauvegarder une entrée ──
export async function saveEntry({ text, mood, imageUrl }) {
  const uid  = auth.currentUser.uid;
  const date = todayKey();
  const ref  = doc(db, "users", uid, "entries", date);
  await setDoc(ref, {
    text,
    mood,
    imageUrl: imageUrl || null,
    createdAt: new Date().toISOString(),
    prompt: getTodayPrompt()
  });
}

// ── Récupérer une entrée par date ──
export async function getEntry(date) {
  const uid = auth.currentUser.uid;
  const ref = doc(db, "users", uid, "entries", date);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ── Récupérer toutes les entrées ──
export async function getAllEntries() {
  const uid = auth.currentUser.uid;
  const ref = collection(db, "users", uid, "entries");
  const q   = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── Récupérer le profil utilisateur ──
export async function getUserProfile() {
  const uid  = auth.currentUser.uid;
  const ref  = doc(db, "users", uid, "profile", "data");
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : { streak: 0 };
}

// ── Mettre à jour le streak ──
export async function updateStreak() {
  const uid      = auth.currentUser.uid;
  const ref      = doc(db, "users", uid, "profile", "data");
  const snap     = await getDoc(ref);
  const profile  = snap.exists() ? snap.data() : {};
  const today    = todayKey();
  const last     = profile.lastEntry || "";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = yesterday.toISOString().split("T")[0];

  let streak = profile.streak || 0;
  if (last === yKey)  streak += 1;
  else if (last !== today) streak = 1;

  await setDoc(ref, { ...profile, streak, lastEntry: today });
  return streak;
}

// ── Prompts du jour (liste statique pour la v1) ──
const PROMPTS = [
  "Si aujourd'hui était une couleur, laquelle serait-elle et pourquoi ?",
  "Décris ta journée en 3 mots et explique chacun.",
  "Quelle chanson résume ton état d'esprit en ce moment ?",
  "Si tu pouvais changer une chose de cette journée, ce serait quoi ?",
  "Qu'est-ce qui t'a fait sourire aujourd'hui ?",
  "Décris un moment de cette semaine qui t'a surpris.",
  "Si ta créativité était un animal, lequel serait-il aujourd'hui ?",
  "Quelle est la pensée qui revient le plus souvent en ce moment ?",
  "Qu'est-ce que tu apprendrais si tu avais une journée entière libre ?",
  "Décris ton endroit idéal pour créer.",
  "Quelle émotion domines-tu le plus cette semaine ?",
  "Si tu écrivais un titre de chanson sur ta journée, ce serait quoi ?",
  "Qu'est-ce qui t'inspire le plus en ce moment ?",
  "Décris une texture qui représente ton humeur du jour.",
  "Quel petit détail as-tu remarqué aujourd'hui que tu aurais pu rater ?",
  "Si tu devais peindre ce moment, quelles couleurs utiliserais-tu ?",
  "Quelle conversation t'a marqué récemment ?",
  "Qu'est-ce que tu ferais différemment si tu recommençais hier ?",
  "Décris ton énergie du jour comme un phénomène météo.",
  "Quelle est la chose dont tu es le plus fier cette semaine ?",
  "Si ta journée était un film, quel genre serait-il ?",
  "Qu'est-ce que tu veux accomplir demain ?",
  "Quelle est ta pensée la plus créative du moment ?",
  "Décris un rêve que tu as eu récemment.",
  "Qu'est-ce qui te donne de l'énergie en ce moment ?",
  "Si tu pouvais envoyer un message à ton toi d'il y a un an, ce serait quoi ?",
  "Quelle habitude veux-tu adopter ce mois-ci ?",
  "Décris ta journée comme si c'était une recette de cuisine.",
  "Qu'est-ce que tu as découvert sur toi-même cette semaine ?",
  "Si aujourd'hui était une saison, laquelle serait-elle ?"
];

export function getTodayPrompt() {
  const day = new Date().getDate();
  return PROMPTS[(day - 1) % PROMPTS.length];
}
