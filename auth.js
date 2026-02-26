// js/auth.js
import { auth, provider } from "./firebase.js";
import { signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.googleLogin = async function() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        localStorage.setItem("user", JSON.stringify({ uid: user.uid, email: user.email, name: user.displayName }));
        window.location.href = "pos.html";
    } catch (err) {
        alert("Login gagal: " + err.message);
    }
}

onAuthStateChanged(auth, user => {
    if(user && window.location.pathname.includes("index.html")){
        window.location.href = "pos.html";
    }
});
