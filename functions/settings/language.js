import { auth, db } from "../firebase/firebase.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const options = Array.from(document.querySelectorAll("[data-language]"));
const saveButton = document.querySelector("#save-language");
const cancelButton = document.querySelector("#cancel-language");
const status = document.querySelector("#language-status");
const supported = new Set(["en", "fil", "es", "ja", "zh-CN"]);
let savedLanguage = window.snapPreferences.getLanguage();
let selectedLanguage = savedLanguage;
let currentUser = null;

function updateSelection(language) {
    selectedLanguage = supported.has(language) ? language : "en";
    options.forEach(option => {
        const selected = option.dataset.language === selectedLanguage;
        option.setAttribute("aria-checked", String(selected));
        option.tabIndex = selected ? 0 : -1;
        option.classList.toggle("selected", selected);
    });
}

function showStatus(message, isError) {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
}

updateSelection(selectedLanguage);

onAuthStateChanged(auth, async user => {
    currentUser = user;
    if (!user) {
        window.location.replace("../../../Login/login.php");
        return;
    }

    try {
        const localLanguage = localStorage.getItem("snap-language");
        if (localLanguage) {
            savedLanguage = localLanguage;
            updateSelection(localLanguage);
            return;
        }

        const snapshot = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
        const remoteLanguage = snapshot.exists() ? snapshot.data().language : null;
        if (supported.has(remoteLanguage)) {
            window.snapPreferences.setLanguage(remoteLanguage, false);
            savedLanguage = remoteLanguage;
            updateSelection(remoteLanguage);
        }
    } catch (error) {
        console.error("Unable to load language preference:", error);
        showStatus("The saved language preference could not be loaded.", true);
    }
});

options.forEach(option => {
    option.addEventListener("click", () => {
        updateSelection(option.dataset.language);
        window.snapPreferences.setLanguage(selectedLanguage);
        showStatus("Language preview updated. Save to sync this choice to your account.", false);
    });
    option.addEventListener("keydown", event => {
        const currentIndex = options.indexOf(option);
        let nextIndex = currentIndex;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (currentIndex + 1) % options.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = options.length - 1;
        else return;
        event.preventDefault();
        options[nextIndex].focus();
        options[nextIndex].click();
    });
});

saveButton.addEventListener("click", async () => {
    if (!supported.has(selectedLanguage)) {
        showStatus("Choose a supported language.", true);
        return;
    }

    saveButton.disabled = true;
    options.forEach(option => { option.disabled = true; });
    const language = selectedLanguage;
    window.snapPreferences.setLanguage(language);
    savedLanguage = language;

    try {
        if (currentUser) {
            await setDoc(
                doc(db, "users", currentUser.uid, "settings", "preferences"),
                { language: language, updatedAt: serverTimestamp() },
                { merge: true }
            );
        }
        showStatus("Language preference saved.", false);
    } catch (error) {
        console.error("Unable to sync language preference:", error);
        showStatus("Language is active and saved on this device, but could not be synced to your account.", true);
    } finally {
        saveButton.disabled = false;
        options.forEach(option => { option.disabled = false; });
    }
});

cancelButton.addEventListener("click", () => {
    updateSelection(savedLanguage);
    window.snapPreferences.setLanguage(savedLanguage);
    showStatus("Language selection restored.", false);
});
