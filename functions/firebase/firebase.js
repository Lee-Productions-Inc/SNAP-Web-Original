// functions/firebase/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDcoFVS7iOCqRjLrIye48aF1yC3rsPvzIo",
    authDomain: "snap-c1519.firebaseapp.com",
    projectId: "snap-c1519",
    storageBucket: "snap-c1519.firebasestorage.app",
    messagingSenderId: "521370478287",
    appId: "1:521370478287:web:67dd6cc5365e3a531a79ba",
    measurementId: "G-LFX734CDTD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firebase Authentication
const auth = getAuth(app);

// Cloud Firestore
const db = getFirestore(app);

export { app, auth, db };