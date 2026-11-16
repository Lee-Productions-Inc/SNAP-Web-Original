import { auth } from "../firebase/firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

onAuthStateChanged(auth, user => {
    if (!user) window.location.replace("../../../Login/login.php");
});
