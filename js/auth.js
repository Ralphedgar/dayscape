// ── auth.js ──
import { auth } from "./firebase-init.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { showScreen, renderHome } from "./app.js";

const provider = new GoogleAuthProvider();

// ── Surveille l'état de connexion ──
export function watchAuth() {
  onAuthStateChanged(auth, user => {
    if (user) {
      renderHome(user);
      showScreen("home");
    } else {
      showScreen("onboarding");
    }
  });
}

// ── Google ──
export async function loginGoogle() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    console.error("Google login:", e.message);
    throw e;
  }
}

// ── Email : connexion ──
export async function loginEmail(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (e) {
    console.error("Email login:", e.message);
    throw e;
  }
}

// ── Email : inscription ──
export async function signupEmail(email, password) {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (e) {
    console.error("Signup:", e.message);
    throw e;
  }
}

// ── Déconnexion ──
export async function logout() {
  await signOut(auth);
}
