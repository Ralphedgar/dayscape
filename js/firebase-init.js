// ── firebase-init.js ──
// Remplace les valeurs ci-dessous par ta config Firebase

import { initializeApp }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }        from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDM3zNA2pAfHTSXEAZ3w4-8e8oVAEFLFSw",
  authDomain: "dayscape-6d3e2.firebaseapp.com",
  projectId: "dayscape-6d3e2",
  storageBucket: "dayscape-6d3e2.firebasestorage.app",
  messagingSenderId: "643660109831",
  appId: "1:643660109831:web:e1d2decc74cf93f8a5b2a2"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db   = getFirestore(app);

