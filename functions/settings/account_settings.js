import { auth, db } from "../firebase/firebase.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged,
    updatePassword,
    updateProfile,
    verifyBeforeUpdateEmail
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    resolveProfilePhotoCandidates
} from "./profile_photo_utils.js?v=20261115-chat-profile-2";

const fields = [
    "first-name",
    "middle-name",
    "last-name",
    "university",
    "email",
    "username"
];

const card = document.querySelector("#account-settings-card");
const editButton = document.querySelector("#edit-button");
const saveButton = document.querySelector("#save-button");
const cancelButton = document.querySelector("#cancel-button");
const accountProfileAvatar = document.querySelector("#account-profile-avatar");

const deleteButton = document.querySelector("#delete-account-button");
const deleteModal = document.querySelector("#delete-modal");
const deleteCancel = document.querySelector("#delete-cancel");
const deleteConfirm = document.querySelector("#delete-confirm");

let currentUser = null;
let originalValues = {};

function notify(message) {
    let notice = document.querySelector("#account-notice");

    if (!notice) {
        notice = document.createElement("p");
        notice.id = "account-notice";
        notice.setAttribute("role", "status");

        Object.assign(notice.style, {
            padding: "12px",
            borderRadius: "10px",
            background: "#edf4ff",
            color: "#244b84",
            fontSize: "13px"
        });

        card.insertAdjacentElement("afterend", notice);
    }

    notice.textContent = message;
}

function getField(id) {
    return document.getElementById(id);
}

function captureValues() {
    const values = {};

    fields.forEach(id => {
        values[id] = getField(id)?.value.trim() || "";
    });

    values.password = getField("password")?.value || "";

    return values;
}

function populateFields(profile, user) {
    const facebookProfile = user.providerData?.find(
        provider => provider.providerId === "facebook.com"
    );
    const values = {
        "first-name": profile.firstName || user.displayName || "",
        "middle-name": profile.middleName || "",
        "last-name": profile.lastName || "",
        university: profile.university || "",
        email: user.email || profile.email || facebookProfile?.email || "",
        username: profile.username || ""
    };

    Object.entries(values).forEach(([id, value]) => {
        const input = getField(id);
        const display = document.querySelector(`[data-display="${id}"]`);

        if (input) input.value = value;
        if (display) display.textContent = value || "—";
    });

    const passwordInput = getField("password");
    if (passwordInput) passwordInput.value = "";

    const passwordDisplay = document.querySelector('[data-display="password"]');
    if (passwordDisplay) passwordDisplay.textContent = "••••••••";
}

async function renderAccountAvatar(profile, user) {
    if (!accountProfileAvatar) return;
    const name = profile.displayName ||
        [profile.firstName, profile.middleName, profile.lastName]
            .filter(Boolean)
            .join(" ") ||
        user.displayName ||
        user.email ||
        "SNAP User";
    const photoURLs =
        await resolveProfilePhotoCandidates(profile, user);
    if (auth.currentUser?.uid !== user.uid) return;

    accountProfileAvatar.replaceChildren();
    if (photoURLs.length) {
        const image = document.createElement("img");
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        let photoIndex = 0;
        image.addEventListener("error", () => {
            if (!accountProfileAvatar.contains(image)) return;
            if (photoIndex < photoURLs.length) {
                image.src = photoURLs[photoIndex++];
                return;
            }
            accountProfileAvatar.textContent =
                String(name).trim().charAt(0).toUpperCase() || "S";
        });
        accountProfileAvatar.append(image);
        image.src = photoURLs[photoIndex++];
    } else {
        accountProfileAvatar.textContent =
            String(name).trim().charAt(0).toUpperCase() || "S";
    }
}

function setEditing(editing) {
    card?.classList.toggle("editing", editing);

    fields.forEach(id => {
        const input = getField(id);
        const display = document.querySelector(`[data-display="${id}"]`);

        if (input) input.hidden = !editing;
        if (display) display.hidden = editing;
    });

    const passwordInput = getField("password");
    const passwordDisplay = document.querySelector('[data-display="password"]');

    if (passwordInput) {
        passwordInput.hidden = !editing;
        passwordInput.value = "";
    }

    if (passwordDisplay) passwordDisplay.hidden = editing;

    editButton?.classList.toggle("hidden", editing);
    saveButton?.classList.toggle("hidden", !editing);
    cancelButton?.classList.toggle("hidden", !editing);
}

async function loadAccount(user) {
    const snapshot = await getDoc(doc(db, "users", user.uid));
    const profile = snapshot.exists() ? snapshot.data() : {};

    populateFields(profile, user);
    await renderAccountAvatar(profile, user);
    originalValues = captureValues();
    setEditing(false);
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace("../../../Login/login.php");
        return;
    }

    currentUser = user;

    try {
        await loadAccount(user);
    } catch (error) {
        console.error("Unable to load account settings:", error);
        notify("Unable to load your account information.");
    }
});

editButton?.addEventListener("click", () => {
    originalValues = captureValues();
    setEditing(true);
    getField("first-name")?.focus();
});

cancelButton?.addEventListener("click", () => {
    fields.forEach(id => {
        const input = getField(id);
        if (input) input.value = originalValues[id] || "";
    });

    if (getField("password")) getField("password").value = "";

    setEditing(false);
});

saveButton?.addEventListener("click", async () => {
    if (!currentUser) return;

    const values = captureValues();

    if (!values["first-name"]) {
        notify("Please enter your first name.");
        return;
    }

    if (values.email && !getField("email").checkValidity()) {
        notify("Please enter a valid email address.");
        return;
    }

    if (values["first-name"].length > 80 || values["last-name"].length > 80 ||
        values["middle-name"].length > 80 || values.university.length > 120 ||
        values.username.length > 40) {
        notify("Please shorten the profile fields to fit their limits.");
        return;
    }

    if (values.password && values.password.length < 6) {
        notify("Your new password must contain at least 6 characters.");
        return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    let emailVerificationSent = false;
    try {
        const displayName = [
            values["first-name"],
            values["last-name"]
        ].filter(Boolean).join(" ");

        if (displayName !== (currentUser.displayName || "")) {
            await updateProfile(currentUser, { displayName: displayName });
            await currentUser.getIdToken(true);
        }

        if (values.email && values.email !== originalValues.email) {
            await verifyBeforeUpdateEmail(currentUser, values.email);
            emailVerificationSent = true;
        }

        if (values.password) {
            await updatePassword(currentUser, values.password);
        }

        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                firstName: values["first-name"],
                middleName: values["middle-name"],
                lastName: values["last-name"],
                displayName: displayName,
                university: values.university,
                username: values.username,
                ...(currentUser.email ? { email: currentUser.email } : {}),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        let publicProfileSaved = true;
        try {
            await currentUser.getIdToken(true);
            await setDoc(
                doc(db, "publicUsers", currentUser.uid),
                {
                    displayName: displayName,
                    searchName: displayName.toLowerCase(),
                    updatedAt: serverTimestamp()
                },
                { merge: true }
            );
        }
        catch (profileError) {
            publicProfileSaved = false;
            console.error(
                "Unable to update the minimal public chat profile:",
                profileError
            );
        }

        await loadAccount(currentUser);
        notify(
            emailVerificationSent
                ? "Your profile was saved. Check your new email address to verify the email change."
                : publicProfileSaved
                    ? "Your account information has been saved."
                    : "Your account information was saved, but your name could not be updated in SNAP user search."
        );
    } catch (error) {
        console.error("Unable to save account settings:", error);

        if (error.code === "auth/requires-recent-login") {
            notify("For security, sign in again before changing your email or password.");
        } else if (error.code === "auth/email-already-in-use") {
            notify("That email address is already being used by another account.");
        } else if (error.code === "auth/invalid-email") {
            notify("Please enter a valid email address.");
        } else {
            notify("Unable to save changes. Please try again.");
        }
    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save changes";
    }
});

deleteButton?.addEventListener("click", () => {
    if (deleteModal) deleteModal.hidden = false;
});

deleteCancel?.addEventListener("click", () => {
    if (deleteModal) deleteModal.hidden = true;
});

deleteModal?.addEventListener("click", event => {
    if (event.target === deleteModal) {
        deleteModal.hidden = true;
    }
});

deleteConfirm?.addEventListener("click", () => {
    if (deleteModal) deleteModal.hidden = true;

    notify(
        "Account deletion is not enabled yet. Your account has not been deleted."
    );
});
