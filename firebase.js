import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAXXt6pg-H09RfkgUhnAlZKMsZU8-9oeqw",
  authDomain: "kasir-10280.firebaseapp.com",
  projectId: "kasir-10280",
  storageBucket: "kasir-10280.firebasestorage.app",
  messagingSenderId: "170037480150",
  appId: "1:170037480150:web:45d084d73d9f9834401777",
  measurementId: "G-W4XHNJ2PCH"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
