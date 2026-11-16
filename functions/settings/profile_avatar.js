import { auth, db } from "../firebase/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    resolveProfilePhotoCandidates
} from "./profile_photo_utils.js?v=20261115-chat-profile-2";

function getProfileAvatars() {
    return document.querySelectorAll(".profile-placeholder, .avatar-button");
}

function getInitials(name) {
    return String(name || "S")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join("") || "S";
}

function renderAvatar(element, photoURLs, name) {
    element.replaceChildren();
    element.setAttribute("aria-label", `Open ${name || "user"} profile`);
    element.title = name || "Open profile";
    element.style.display = "grid";
    element.style.placeItems = "center";
    element.style.overflow = "hidden";
    element.style.textDecoration = "none";
    element.style.color = "#ffffff";
    element.style.fontWeight = "700";

    if (photoURLs.length) {
        const image = document.createElement("img");
        image.alt = "";
        image.referrerPolicy = "no-referrer";
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.borderRadius = "inherit";
        image.style.objectFit = "cover";
        let photoIndex = 0;
        image.addEventListener("error", () => {
            if (!element.contains(image)) return;
            if (photoIndex < photoURLs.length) {
                image.src = photoURLs[photoIndex++];
                return;
            }
            element.textContent = getInitials(name);
        });
        element.append(image);
        image.src = photoURLs[photoIndex++];
        return;
    }

    element.textContent = getInitials(name);
}

onAuthStateChanged(auth, async user => {
    const avatars = getProfileAvatars();
    if (!avatars.length) return;

    if (!user) {
        avatars.forEach(element => renderAvatar(element, [], "SNAP User"));
        return;
    }

    let profile = {};
    try {
        const snapshot = await getDoc(doc(db, "users", user.uid));
        if (snapshot.exists()) profile = snapshot.data();
    } catch (error) {
        console.error("Unable to load the profile avatar:", error);
    }

    const name = [
        profile.firstName || user.displayName || "",
        profile.middleName || "",
        profile.lastName || ""
    ].filter(Boolean).join(" ").trim() || user.email || "SNAP User";
    const userStillSignedIn = auth.currentUser?.uid === user.uid;
    if (!userStillSignedIn) return;
    const photoURLs =
        await resolveProfilePhotoCandidates(profile, user);
    if (auth.currentUser?.uid !== user.uid) return;

    getProfileAvatars().forEach(element => {
        renderAvatar(element, photoURLs, name);
    });
});
