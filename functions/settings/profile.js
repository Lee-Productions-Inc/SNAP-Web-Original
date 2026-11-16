import { auth, db } from "../firebase/firebase.js";
import {
    doc,
    deleteField,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    syncParticipantAppearance
} from "../ai_chat/ai_chat/chat_mobile_adapter.js?v=20261115-chat-profile-2";
import {
    facebookPhotoSources,
    getProviderPhotoURL,
    resolveProfilePhotoCandidates,
    resolveProfilePhotoURL
} from "./profile_photo_utils.js?v=20261115-chat-profile-2";

const loginPath = "../../Login/login.php";
const logoutButton = document.querySelector("#logout-button");
const logoutModal = document.querySelector("#logout-modal");
const cancelLogout = document.querySelector("#cancel-logout");
const confirmLogout = document.querySelector(".confirm-logout");
const profilePhotoEditButton = document.querySelector("#profile-photo-edit");
const profilePhotoModal = document.querySelector("#profile-photo-modal");
const profilePhotoDialog = document.querySelector(".profile-photo-dialog");
const profilePhotoCloseButton = document.querySelector("#profile-photo-close");
const profilePhotoCancelButton = document.querySelector("#profile-photo-cancel");
const profilePhotoSaveButton = document.querySelector("#profile-photo-save");
const profilePhotoRemoveButton = document.querySelector("#profile-photo-remove");
const profilePhotoRemoveConfirmation = document.querySelector("#profile-photo-remove-confirmation");
const profilePhotoRemoveCancelButton = document.querySelector("#profile-photo-remove-cancel");
const profilePhotoRemoveConfirmButton = document.querySelector("#profile-photo-remove-confirm");
const profilePhotoChooseButton = document.querySelector("#profile-photo-choose");
const profilePhotoFileInput = document.querySelector("#profile-photo-file");
const profilePhotoPreview = document.querySelector("#profile-photo-crop-preview");
const profilePhotoPreviewImage = document.querySelector("#profile-photo-preview-image");
const profilePhotoFileName = document.querySelector("#profile-photo-file-name");
const profilePhotoPublicConsent = document.querySelector("#profile-photo-public-consent");
const profilePhotoProgress = document.querySelector("#profile-photo-progress");
const profilePhotoUploadStatus = document.querySelector("#profile-photo-upload-status");
let currentUser = null;
let logoutInProgress = false;
let applyingRemoteTheme = false;
let profileLevelText = null;
let currentProfile = {};
let currentProfileName = "SNAP User";
let selectedPhotoFile = null;
let photoPreviewUrl = "";
let uploadedPhoto = null;
let photoUploadRequest = null;
let photoSaveInProgress = false;
let photoRemoveConfirmationClosing = false;
let cloudinaryUploaderPromise = null;

function showMessage(message) {
    let notice = document.querySelector("#profile-notice");
    if (!notice) {
        notice = document.createElement("div");
        notice.id = "profile-notice";
        notice.setAttribute("role", "status");
        Object.assign(notice.style, {
            position: "fixed",
            right: "20px",
            bottom: "20px",
            zIndex: "9999",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "#1b2e4a",
            color: "#ffffff",
            boxShadow: "0 5px 20px rgba(0,0,0,.15)",
            fontSize: "14px"
        });
        document.body.appendChild(notice);
    }
    notice.textContent = message;
    notice.hidden = false;
}

function renderProfileInitials(photoElement, fullName, statusElement, status) {
    photoElement.replaceChildren();
    photoElement.textContent =
        (fullName || "S").charAt(0).toUpperCase();
    photoElement.setAttribute(
        "aria-label",
        status || "Profile photo unavailable; showing initials"
    );
    photoElement.title = status || "Profile photo unavailable";
    Object.assign(photoElement.style, {
        display: "grid",
        placeItems: "center",
        fontSize: "42px",
        fontWeight: "800",
        color: "#285bbd"
    });

    if (statusElement) {
        statusElement.textContent = status;
        statusElement.hidden = !status;
    }
}

async function renderProfilePhoto(user, profile, fullName) {
    const photoElement = document.querySelector(".profile-photo");
    const statusElement = document.querySelector("#profile-photo-status");
    if (!photoElement) return "";

    const requestedPhotoURL =
        profile.photoUrl ||
        profile.photoURL ||
        getProviderPhotoURL(user);
    if (facebookPhotoSources(requestedPhotoURL)) {
        renderProfileInitials(photoElement, fullName, statusElement, "");
    }
    const photoURLs = await resolveProfilePhotoCandidates(profile, user);
    if (photoURLs.length) {
        const image = document.createElement("img");
        image.alt = "Profile photo";
        image.referrerPolicy = "no-referrer";
        Object.assign(image.style, {
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "50%"
        });
        let photoIndex = 0;
        image.addEventListener("error", () => {
            if (!photoElement.contains(image)) return;
            if (photoIndex < photoURLs.length) {
                image.src = photoURLs[photoIndex++];
                return;
            }
            renderProfileInitials(
                photoElement,
                fullName,
                statusElement,
                "The profile photo could not be loaded. Showing initials instead."
            );
        });
        photoElement.removeAttribute("style");
        photoElement.replaceChildren(image);
        image.src = photoURLs[photoIndex++];
        photoElement.setAttribute("aria-label", `Profile photo of ${fullName}`);
        photoElement.title = `Profile photo of ${fullName}`;
        if (statusElement) statusElement.hidden = true;
    } else {
        const providerPhoto = getProviderPhotoURL(user);
        const status = providerPhoto
            ? "No usable provider profile photo is available. Upload a SNAP photo to add one."
            : "No profile photo is available. Showing initials instead.";
        renderProfileInitials(photoElement, fullName, statusElement, status);
    }

    profilePhotoRemoveButton.hidden =
        ![profile.photoUrl, profile.photoURL].some(
            value => typeof value === "string" && value.trim()
        );
    return photoURLs[0] || "";
}

async function loadProfile(user) {
    let snapshot;
    try {
        snapshot = await getDoc(doc(db, "users", user.uid));
    } catch (error) {
        console.error("SNAP profile read failed:", {
            phase: "read",
            code: error.code || null,
            name: error.name || null
        });
        throw error;
    }
    const profile = snapshot.exists() ? snapshot.data() : {};
    const facebookProfile = user.providerData?.find(
        provider => provider.providerId === "facebook.com"
    );
    const savedName = [
        profile.firstName || "",
        profile.middleName || "",
        profile.lastName || ""
    ].filter(Boolean).join(" ").trim();
    const fullName = profile.displayName || savedName ||
        user.displayName || facebookProfile?.displayName || "SNAP User";
    currentProfile = profile;
    currentProfileName = fullName;
    const expectedFields = [
        "uid", "firstName", "middleName", "lastName", "suffix",
        "displayName", "university", "email", "photoUrl", "photoURL",
        "photoPublicId", "photoUpdatedAt",
        "createdAt", "updatedAt"
    ];
    console.info("SNAP profile diagnostics:", {
        documentRead: true,
        documentExists: snapshot.exists(),
        fieldsPresent: expectedFields.filter(field =>
            Object.prototype.hasOwnProperty.call(profile, field)
        ),
        uidMatches: !profile.uid || profile.uid === user.uid,
        authFields: {
            displayName: Boolean(user.displayName),
            email: Boolean(user.email),
            photoURL: Boolean(user.photoURL)
        },
        facebookProvider: {
            present: Boolean(facebookProfile),
            displayName: Boolean(facebookProfile?.displayName),
            email: Boolean(facebookProfile?.email),
            photoURL: Boolean(facebookProfile?.photoURL)
        }
    });

    const nameElement = document.querySelector(".profile-intro h2");
    const universityElement = document.querySelector(".profile-intro strong");
    const emailElement = document.querySelector(".email-value strong");
    const levelElement = document.querySelector(".profile-intro p");
    if (nameElement) nameElement.textContent = fullName;
    if (universityElement) universityElement.textContent = profile.university || "University not set";
    if (emailElement) emailElement.textContent =
        user.email || profile.email || facebookProfile?.email ||
        "No email provided; add one in Account Settings.";

    try {
        const progression = await getDoc(
            doc(db, "users", user.uid, "achievements", "progression")
        );
        const progressionData = progression.exists()
            ? progression.data()
            : {};
        console.info("SNAP progression diagnostics:", {
            documentRead: true,
            documentExists: progression.exists(),
            totalXPFieldPresent: Object.prototype.hasOwnProperty.call(
                progressionData,
                "totalXP"
            ),
            effectiveXPIsZero: !progression.exists() ||
                Number(progressionData.totalXP) === 0,
            xpSource: progression.exists()
                ? "progression"
                : "default"
        });
        const totalXP = progression.exists()
            ? Math.max(0, Number(progressionData.totalXP) || 0)
            : 0;
        const level = Math.min(100, Math.floor(totalXP / 100));
        profileLevelText = function () {
            return window.snapPreferences.translate("Level") + " " + level +
                " · " + totalXP.toLocaleString() + " " +
                window.snapPreferences.translate("XP");
        };
        if (levelElement) levelElement.textContent = profileLevelText();
    } catch (error) {
        console.error("SNAP progression read failed:", {
            phase: "read",
            code: error.code || null,
            name: error.name || null
        });
        if (levelElement) levelElement.textContent = "Level unavailable";
    }

    await renderProfilePhoto(user, profile, fullName);
}

function setPhotoStatus(message, isError = false) {
    profilePhotoUploadStatus.textContent = message;
    profilePhotoUploadStatus.dataset.error = String(isError);
}

function updatePhotoSaveButton() {
    profilePhotoSaveButton.disabled =
        photoSaveInProgress ||
        !selectedPhotoFile ||
        (!uploadedPhoto && !profilePhotoPublicConsent.checked);
    profilePhotoChooseButton.disabled = photoSaveInProgress;
    const canCancel = !photoSaveInProgress || Boolean(photoUploadRequest);
    profilePhotoCloseButton.disabled = !canCancel;
    profilePhotoCancelButton.disabled = !canCancel;
    profilePhotoRemoveButton.disabled = photoSaveInProgress;
}

function resetPhotoDraft() {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    selectedPhotoFile = null;
    photoPreviewUrl = "";
    uploadedPhoto = null;
    profilePhotoPreviewImage.removeAttribute("src");
    profilePhotoPreview.hidden = true;
    profilePhotoFileName.textContent = "No image selected";
    profilePhotoPublicConsent.checked = false;
    profilePhotoProgress.hidden = true;
    profilePhotoProgress.value = 0;
    profilePhotoFileInput.value = "";
    setPhotoStatus("");
    updatePhotoSaveButton();
}

async function selectProfilePhoto() {
    const file = profilePhotoFileInput.files?.[0];
    profilePhotoFileInput.value = "";
    if (!file) return;

    resetPhotoDraft();
    const allowedTypes = new Set([
        "image/jpeg",
        "image/png",
        "image/webp"
    ]);
    if (!allowedTypes.has(file.type.toLowerCase())) {
        profilePhotoFileName.textContent = file.name;
        setPhotoStatus("Choose a JPG, PNG, or WebP image.", true);
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        profilePhotoFileName.textContent = file.name;
        setPhotoStatus("The selected image exceeds the 5 MB limit.", true);
        return;
    }

    selectedPhotoFile = file;
    photoPreviewUrl = URL.createObjectURL(file);
    profilePhotoPreviewImage.src = photoPreviewUrl;
    try {
        await profilePhotoPreviewImage.decode();
    } catch (error) {
        resetPhotoDraft();
        setPhotoStatus("This image could not be previewed. Choose another file.", true);
        return;
    }

    profilePhotoPreview.hidden = false;
    profilePhotoFileName.textContent =
        `${file.name} · ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    setPhotoStatus("Preview ready. Confirm the public-sharing notice before saving.");
    updatePhotoSaveButton();
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
            } else {
                reject(Error("The selected image could not be prepared for upload."));
            }
        }, type, quality);
    });
}

async function createCroppedPhotoFile() {
    const image = profilePhotoPreviewImage;
    const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
    if (!cropSize) throw Error("The selected image has no usable dimensions.");

    const maxX = image.naturalWidth - cropSize;
    const maxY = image.naturalHeight - cropSize;
    const sourceX = maxX / 2;
    const sourceY = maxY / 2;
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext("2d");
    if (!context) throw Error("Your browser could not prepare the image.");

    context.drawImage(
        image,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        0,
        0,
        canvas.width,
        canvas.height
    );

    let blob = await canvasToBlob(canvas, "image/webp", 0.9);
    let extension = "webp";
    if (blob.type !== "image/webp") {
        context.globalCompositeOperation = "destination-over";
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        blob = await canvasToBlob(canvas, "image/jpeg", 0.9);
        extension = "jpg";
    }
    return new File(
        [blob],
        `snap-profile-picture.${extension}`,
        { type: blob.type }
    );
}

async function uploadCloudinaryAsset(options) {
    cloudinaryUploaderPromise ||= import(
        "../ai_chat/ai_chat/chat_cloudinary_upload.js?v=20261115a"
    )
        .then(module => module.uploadCloudinaryAsset)
        .catch(error => {
            cloudinaryUploaderPromise = null;
            throw error;
        });
    const upload = await cloudinaryUploaderPromise;
    return upload(options);
}

async function syncChatAppearance(user, profile) {
    const photoURL = await resolveProfilePhotoURL(profile, user);
    await syncParticipantAppearance(db, user.uid, {
        displayName: currentProfileName || user.displayName || "SNAP User",
        photoURL
    });
}

function closeProfilePhotoModal() {
    if (photoSaveInProgress && !photoUploadRequest) return;
    if (photoUploadRequest) {
        photoUploadRequest.abort();
        photoUploadRequest = null;
    }
    if (!uploadedPhoto) resetPhotoDraft();
    profilePhotoModal.hidden = true;
    profilePhotoEditButton.focus();
}

function openRemovePhotoConfirmation() {
    if (
        !currentUser ||
        photoSaveInProgress ||
        photoRemoveConfirmationClosing ||
        ![currentProfile.photoUrl, currentProfile.photoURL].some(
            value => typeof value === "string" && value.trim()
        )
    ) {
        return;
    }

    profilePhotoDialog.hidden = true;
    profilePhotoRemoveConfirmation.hidden = false;
    profilePhotoRemoveCancelButton.focus();
}

function closeRemovePhotoConfirmation(returnToEditor = true) {
    if (photoRemoveConfirmationClosing) return Promise.resolve();

    photoRemoveConfirmationClosing = true;
    return new Promise(resolve => {
        let timeoutId = 0;
        let finished = false;
        const finish = () => {
            if (finished) return;
            finished = true;
            profilePhotoRemoveConfirmation.removeEventListener(
                "animationend",
                handleAnimationEnd
            );
            window.clearTimeout(timeoutId);
            profilePhotoRemoveConfirmation.classList.remove("is-closing");
            profilePhotoRemoveConfirmation.hidden = true;
            if (returnToEditor) profilePhotoDialog.hidden = false;
            photoRemoveConfirmationClosing = false;
            resolve();
        };
        const handleAnimationEnd = event => {
            if (event.target === profilePhotoRemoveConfirmation) finish();
        };

        profilePhotoRemoveConfirmation.addEventListener(
            "animationend",
            handleAnimationEnd
        );
        profilePhotoRemoveConfirmation.classList.add("is-closing");
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            finish();
        } else {
            timeoutId = window.setTimeout(finish, 200);
        }
    });
}

async function cancelRemovePhotoConfirmation() {
    if (photoSaveInProgress || photoRemoveConfirmationClosing) return;
    await closeRemovePhotoConfirmation();
    profilePhotoRemoveButton.focus();
}

async function saveProfilePhoto() {
    if (!currentUser || photoSaveInProgress || !selectedPhotoFile) return;
    if (!uploadedPhoto && !profilePhotoPublicConsent.checked) {
        setPhotoStatus("Confirm the public-sharing notice before uploading.", true);
        return;
    }

    photoSaveInProgress = true;
    profilePhotoSaveButton.textContent = "Preparing photo…";
    profilePhotoRemoveButton.disabled = true;
    updatePhotoSaveButton();

    try {
        if (!uploadedPhoto) {
            const config = window.SNAP_CLOUDINARY_CONFIG || {};
            const cloudName = String(config.cloudName || "").trim();
            const uploadPreset = String(config.uploadPreset || "").trim();
            if (!cloudName || !uploadPreset) {
                throw Error(
                    "Profile photo uploads are unavailable because Cloudinary is not configured for this web server."
                );
            }

            const file = await createCroppedPhotoFile();
            profilePhotoProgress.value = 0;
            profilePhotoProgress.hidden = false;
            profilePhotoSaveButton.textContent = "Uploading…";
            setPhotoStatus("Uploading your public profile photo…");
            uploadedPhoto = await uploadCloudinaryAsset({
                file,
                cloudName,
                uploadPreset,
                resourceType: "image",
                publicId: crypto.randomUUID(),
                onRequest: xhr => {
                    photoUploadRequest = xhr;
                    updatePhotoSaveButton();
                },
                onProgress: (loaded, total) => {
                    const percent = total > 0
                        ? Math.round(loaded / total * 100)
                        : 0;
                    profilePhotoProgress.value = percent;
                    setPhotoStatus(
                        total > 0
                            ? `Uploading profile photo… ${percent}%`
                            : "Uploading profile photo…"
                    );
                }
            });
            photoUploadRequest = null;
            updatePhotoSaveButton();
            profilePhotoProgress.value = 100;
            setPhotoStatus("Upload complete. Saving your profile photo…");
        }

        profilePhotoSaveButton.textContent = "Saving…";
        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                photoUrl: uploadedPhoto.secureUrl,
                photoURL: uploadedPhoto.secureUrl,
                photoPublicId: uploadedPhoto.publicId,
                photoUpdatedAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );

        currentProfile.photoUrl = uploadedPhoto.secureUrl;
        currentProfile.photoURL = uploadedPhoto.secureUrl;
        currentProfile.photoPublicId = uploadedPhoto.publicId;
        const visiblePhotoURL = await renderProfilePhoto(
            currentUser,
            currentProfile,
            currentProfileName
        );
        let chatSyncFailed = false;
        let chatSyncPermissionDenied = false;
        try {
            await syncChatAppearance(currentUser, currentProfile);
        } catch (error) {
            chatSyncFailed = true;
            chatSyncPermissionDenied =
                error.code === "permission-denied";
            console.error("Could not sync profile photo to chat participants:", {
                code: error.code || null,
                name: error.name || null,
                operation: error.operation || null,
                failures: error.failures || []
            });
        }

        showMessage(
            chatSyncFailed
                ? chatSyncPermissionDenied
                    ? "Profile photo saved, but Firestore denied updating one or more chat participant appearance records."
                    : "Profile photo saved, but chat participant appearance could not be synchronized."
                : "Profile photo saved and chat avatars updated."
        );
        if (!visiblePhotoURL) {
            setPhotoStatus("The saved profile photo could not be displayed; showing initials instead.", true);
            return;
        }
        profilePhotoModal.hidden = true;
        resetPhotoDraft();
        profilePhotoEditButton.focus();
    } catch (error) {
        if (error.name === "AbortError") {
            setPhotoStatus("Upload canceled. Select the image again and reconfirm public sharing to retry.", true);
        } else if (uploadedPhoto) {
            const code = error.code ? ` (${error.code})` : "";
            const permissionMessage = error.code === "permission-denied"
                ? "Firestore denied saving users/{uid} profile photo metadata."
                : "The profile photo URL could not be saved to Firestore.";
            setPhotoStatus(
                `The public image uploaded, but ${permissionMessage}${code} Retry Save photo to save the association without uploading again.`,
                true
            );
            console.error("Profile photo metadata save failed:", {
                code: error.code || null,
                name: error.name || null
            });
        } else {
            setPhotoStatus(error.message || "Profile photo upload failed. Please retry.", true);
            console.error("Profile photo upload failed:", {
                code: error.code || null,
                name: error.name || null
            });
        }
    } finally {
        photoUploadRequest = null;
        photoSaveInProgress = false;
        profilePhotoSaveButton.textContent = "Save photo";
        profilePhotoRemoveButton.disabled = false;
        profilePhotoProgress.hidden = true;
        updatePhotoSaveButton();
    }
}

async function removeProfilePhoto() {
    if (
        !currentUser ||
        photoSaveInProgress ||
        photoRemoveConfirmationClosing ||
        ![currentProfile.photoUrl, currentProfile.photoURL].some(
            value => typeof value === "string" && value.trim()
        ) ||
        profilePhotoRemoveConfirmation.hidden
    ) {
        return;
    }

    photoSaveInProgress = true;
    profilePhotoRemoveCancelButton.disabled = true;
    profilePhotoRemoveConfirmButton.disabled = true;
    profilePhotoRemoveConfirmButton.textContent = "Removing…";
    profilePhotoRemoveConfirmation.setAttribute("aria-busy", "true");
    profilePhotoRemoveConfirmation.focus();
    updatePhotoSaveButton();
    try {
        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                photoUrl: deleteField(),
                photoURL: deleteField(),
                photoPublicId: deleteField(),
                photoUpdatedAt: deleteField(),
                updatedAt: serverTimestamp()
            },
            { merge: true }
        );
        delete currentProfile.photoUrl;
        delete currentProfile.photoURL;
        delete currentProfile.photoPublicId;
        delete currentProfile.photoUpdatedAt;
        await renderProfilePhoto(currentUser, currentProfile, currentProfileName);

        let chatSyncFailed = false;
        let chatSyncPermissionDenied = false;
        try {
            await syncChatAppearance(currentUser, currentProfile);
        } catch (error) {
            chatSyncFailed = true;
            chatSyncPermissionDenied =
                error.code === "permission-denied";
            console.error("Could not sync removed profile photo to chat participants:", {
                code: error.code || null,
                name: error.name || null,
                operation: error.operation || null,
                failures: error.failures || []
            });
        }
        showMessage(
            chatSyncFailed
                ? chatSyncPermissionDenied
                    ? "Profile photo removed, but Firestore denied updating one or more chat participant appearance records."
                    : "Profile photo removed, but chat participant appearance could not be synchronized."
                : "Profile photo removed."
        );
        await closeRemovePhotoConfirmation(false);
        profilePhotoModal.hidden = true;
        resetPhotoDraft();
        profilePhotoEditButton.focus();
    } catch (error) {
        console.error("Profile photo removal failed:", {
            code: error.code || null,
            name: error.name || null
        });
        await closeRemovePhotoConfirmation();
        setPhotoStatus(
            error.code === "permission-denied"
                ? "Firestore denied removing users/{uid} profile photo metadata. Your saved photo was not changed."
                : `Could not remove your profile photo${error.code ? ` (${error.code})` : ""}.`,
            true
        );
    } finally {
        photoSaveInProgress = false;
        profilePhotoRemoveCancelButton.disabled = false;
        profilePhotoRemoveConfirmButton.disabled = false;
        profilePhotoRemoveConfirmButton.textContent = "Remove Photo";
        profilePhotoRemoveConfirmation.removeAttribute("aria-busy");
        updatePhotoSaveButton();
        if (!profilePhotoModal.hidden) profilePhotoRemoveButton.focus();
    }
}

profilePhotoEditButton?.addEventListener("click", () => {
    profilePhotoDialog.hidden = false;
    profilePhotoRemoveConfirmation.hidden = true;
    profilePhotoModal.hidden = false;
    profilePhotoCloseButton.focus();
});
profilePhotoCloseButton?.addEventListener("click", closeProfilePhotoModal);
profilePhotoCancelButton?.addEventListener("click", closeProfilePhotoModal);
profilePhotoRemoveButton?.addEventListener("click", openRemovePhotoConfirmation);
profilePhotoRemoveCancelButton?.addEventListener("click", () => {
    void cancelRemovePhotoConfirmation();
});
profilePhotoRemoveConfirmButton?.addEventListener("click", () => {
    void removeProfilePhoto();
});
profilePhotoModal?.addEventListener("click", event => {
    if (event.target !== profilePhotoModal) return;
    if (!profilePhotoRemoveConfirmation.hidden) {
        void cancelRemovePhotoConfirmation();
    } else {
        closeProfilePhotoModal();
    }
});
profilePhotoModal?.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
        profilePhotoModal.querySelectorAll("button:not(:disabled), input:not(:disabled)")
    ).filter(element => !element.hidden && element.getClientRects().length);
    if (!focusable.length) {
        if (!profilePhotoRemoveConfirmation.hidden && photoSaveInProgress) {
            event.preventDefault();
            profilePhotoRemoveConfirmation.focus();
        }
        return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});
profilePhotoFileInput?.addEventListener("change", () => {
    void selectProfilePhoto();
});
profilePhotoChooseButton?.addEventListener("click", () => {
    profilePhotoFileInput.click();
});
profilePhotoPublicConsent?.addEventListener("change", updatePhotoSaveButton);
profilePhotoSaveButton?.addEventListener("click", () => {
    void saveProfilePhoto();
});
document.addEventListener("keydown", event => {
    if (event.key === "Escape" && profilePhotoModal && !profilePhotoModal.hidden) {
        if (!profilePhotoRemoveConfirmation.hidden) {
            void cancelRemovePhotoConfirmation();
        } else {
            closeProfilePhotoModal();
        }
    }
});

async function loadPreferences(user) {
    const snapshot = await getDoc(doc(db, "users", user.uid, "settings", "preferences"));
    const preferences = snapshot.exists() ? snapshot.data() : {};
    if (!localStorage.getItem("snap-theme") && typeof preferences.darkMode === "boolean") {
        applyingRemoteTheme = true;
        window.snapPreferences.setTheme(preferences.darkMode ? "dark" : "light", false);
        applyingRemoteTheme = false;
    }
    if (!localStorage.getItem("snap-language") &&
        ["en", "fil", "es", "ja", "zh-CN"].includes(preferences.language)) {
        window.snapPreferences.setLanguage(preferences.language, false);
    }
}

onAuthStateChanged(auth, async user => {
    if (!user) {
        window.location.replace(loginPath);
        return;
    }
    currentUser = user;
    try {
        await Promise.all([loadProfile(user), loadPreferences(user)]);
    } catch (error) {
        console.error("SNAP profile load failed:", {
            code: error.code || null,
            name: error.name || null
        });
        showMessage("Some profile preferences could not be loaded.");
    }
});

window.addEventListener("snap:languagechange", () => {
    const levelElement = document.querySelector(".profile-intro p");
    if (levelElement && profileLevelText) levelElement.textContent = profileLevelText();
});

window.addEventListener("snap:themechange", async event => {
    if (!currentUser || applyingRemoteTheme) return;
    try {
        await setDoc(
            doc(db, "users", currentUser.uid, "settings", "preferences"),
            { darkMode: event.detail.theme === "dark", updatedAt: serverTimestamp() },
            { merge: true }
        );
    } catch (error) {
        console.error("Unable to sync theme preference:", error);
        showMessage("Theme is active on this device, but could not be synced to your account.");
    }
});

function closeLogoutDialog() {
    logoutModal.hidden = true;
    logoutButton.focus();
}

logoutButton.addEventListener("click", () => {
    logoutModal.hidden = false;
    cancelLogout.focus();
});

cancelLogout.addEventListener("click", closeLogoutDialog);
logoutModal.addEventListener("click", event => {
    if (event.target === logoutModal && !logoutInProgress) closeLogoutDialog();
});

logoutModal.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
        logoutModal.querySelectorAll("button:not(:disabled), a[href], input:not(:disabled)")
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !logoutModal.hidden && !logoutInProgress) {
        closeLogoutDialog();
    }
});

confirmLogout.addEventListener("click", async () => {
    if (logoutInProgress) return;
    logoutInProgress = true;
    confirmLogout.disabled = true;
    confirmLogout.setAttribute("aria-busy", "true");
    confirmLogout.textContent = "Signing out…";
    cancelLogout.disabled = true;

    try {
        await signOut(auth);
        window.location.replace(loginPath);
    } catch (error) {
        console.error("Logout failed:", error);
        logoutInProgress = false;
        confirmLogout.disabled = false;
        confirmLogout.removeAttribute("aria-busy");
        confirmLogout.textContent = window.snapPreferences.translate("Log Out");
        cancelLogout.disabled = false;
        showMessage("Unable to log out. Please try again.");
    }
});
