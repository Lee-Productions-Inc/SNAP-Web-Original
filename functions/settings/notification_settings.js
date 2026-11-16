import { auth, db } from "../firebase/firebase.js";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const controlIds = [
    "task-reminders",
    "task-completions",
    "achievement-updates",
    "general-updates"
];
const controls = Object.fromEntries(
    controlIds.map(id => [id, document.getElementById(id)])
);
const reminderTime = document.getElementById("reminder-time");
const reminderLeadTimes = ["5 minutes", "15 minutes", "30 minutes", "1 hour", "1 day"];
const saveButton = document.getElementById("save-notifications");
const cancelButton = document.getElementById("cancel-notifications");
const status = document.getElementById("notification-status");
let currentUser = null;
let savedValues = null;

function setFormDisabled(disabled) {
    controlIds.forEach(id => {
        controls[id].disabled = disabled;
    });
    reminderTime.disabled = disabled;
    saveButton.disabled = disabled;
    cancelButton.disabled = disabled;
}

function storageKey() {
    return "snap-notification-preferences:" + currentUser.uid;
}

function readControls() {
    return {
        taskReminders: controls["task-reminders"].checked,
        taskCompletions: controls["task-completions"].checked,
        achievementUpdates: controls["achievement-updates"].checked,
        generalUpdates: controls["general-updates"].checked,
        defaultReminderLeadTime: reminderTime.value
    };
}

function applyValues(values) {
    controls["task-reminders"].checked = values.taskReminders === true;
    controls["task-completions"].checked = values.taskCompletions === true;
    controls["achievement-updates"].checked = values.achievementUpdates === true;
    controls["general-updates"].checked = values.generalUpdates === true;
    reminderTime.value = reminderLeadTimes.includes(values.defaultReminderLeadTime)
        ? values.defaultReminderLeadTime
        : "15 minutes";
}

function showStatus(message, isError) {
    status.textContent = message;
    status.dataset.state = isError ? "error" : "success";
}

function readLocalValues() {
    try {
        const raw = currentUser ? localStorage.getItem(storageKey()) : null;
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error("Unable to read local notification preferences:", error);
        showStatus("Device notification preferences could not be read.", true);
        return null;
    }
}

onAuthStateChanged(auth, async user => {
    currentUser = user;
    if (!user) {
        window.location.replace("../../../Login/login.php");
        return;
    }

    try {
        const snapshot = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
        const remoteValues = snapshot.exists() ? snapshot.data().notifications : null;
        const localValues = readLocalValues();
        const values = remoteValues || localValues || {
            taskReminders: true,
            taskCompletions: false,
            achievementUpdates: false,
            generalUpdates: false,
            defaultReminderLeadTime: "15 minutes"
        };
        applyValues(values);
        savedValues = readControls();
    } catch (error) {
        console.error("Unable to load notification preferences:", error);
        const localValues = readLocalValues();
        if (localValues) {
            applyValues(localValues);
            savedValues = readControls();
            showStatus("Showing device preferences; account settings could not be loaded.", true);
        } else {
            showStatus("Unable to load your notification preferences.", true);
        }
    } finally {
        setFormDisabled(false);
    }
});

setFormDisabled(true);

controlIds.forEach(id => {
    controls[id].addEventListener("change", () => {
        showStatus(
            "Unsaved preference. Notification delivery is limited to the types described on this page.",
            false
        );
    });
});
reminderTime.addEventListener("change", () => {
    showStatus("Unsaved preference.", false);
});

cancelButton.addEventListener("click", () => {
    if (savedValues) applyValues(savedValues);
    showStatus("Unsaved changes were discarded.", false);
});

saveButton.addEventListener("click", async () => {
    const values = readControls();
    setFormDisabled(true);

    try {
        localStorage.setItem(storageKey(), JSON.stringify(values));
    } catch (error) {
        console.error("Unable to save local notification preferences:", error);
        showStatus("Unable to save notification preferences on this device.", true);
        setFormDisabled(false);
        return;
    }

    try {
        if (!currentUser) {
            throw new Error("Authentication is required to save account preferences.");
        }
        await setDoc(
            doc(db, "users", currentUser.uid, "settings", "preferences"),
            { notifications: values, updatedAt: serverTimestamp() },
            { merge: true }
        );
        savedValues = values;
        showStatus("Notification preferences saved to your account.", false);
    } catch (error) {
        console.error("Unable to save notification preferences:", error);
        savedValues = values;
        showStatus("Preferences were saved on this device, but could not be synced to your account.", true);
    } finally {
        setFormDisabled(false);
    }
});
