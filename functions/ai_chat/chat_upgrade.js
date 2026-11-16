
import {
  app,
  auth,
  db
} from "../firebase/firebase.js";

import {
  deleteObject,
  getStorage,
  ref
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-storage.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
  createRoom,
  createInvite,
  joinInvite,
  watchRooms,
  updateRoomInfo,
  clearChatForUser,
  leaveRoom
} from "./ai_chat/chat_mobile_adapter.js?v=20261115-chat-profile-2";

import {
  parseInviteInput
} from "./chat_invite_link.mjs?v=20261115-mobile-invite-1";
import {
  facebookPhotoSources
} from "../settings/profile_photo_utils.js?v=20261115-chat-profile-2";

const $ = selector =>
  document.querySelector(selector);

let cloudinaryUploaderPromise = null;
async function uploadCloudinaryAsset(options) {
  cloudinaryUploaderPromise ||= import(
    "./ai_chat/chat_cloudinary_upload.js?v=20261115a"
  )
    .then(module => module.uploadCloudinaryAsset)
    .catch(exception => {
      cloudinaryUploaderPromise = null;
      throw exception;
    });
  const upload = await cloudinaryUploaderPromise;
  return upload(options);
}

const storage = getStorage(app);
const isChat = Boolean($(".chats-panel"));
const isHub = Boolean($(".ai-hub-page"));

let signedIn = null;
let routeHandled = false;

function btn(label, handler, className = "") {
  const button =
    document.createElement("button");

  button.type = "button";
  button.className = className;
  button.textContent = label;

  button.addEventListener(
    "click",
    handler
  );

  return button;
}

function dialog(title, description = "") {
  const element =
    document.createElement("dialog");

  element.className =
    "snap-social-dialog";

  const header =
    document.createElement("header");

  const name =
    document.createElement("h2");

  name.textContent = title;

  header.append(
    name,
    btn(
      "×",
      () => {
        if (element.dataset.busy !== "true") {
          element.close();
        }
      },
      "snap-social-close"
    )
  );

  element.append(header);

  if (description) {
    const paragraph =
      document.createElement("p");

    paragraph.className =
      "snap-social-lede";

    paragraph.textContent =
      description;

    element.append(paragraph);
  }

  element.addEventListener(
    "close",
    () => element.remove()
  );

  document.body.append(element);

  element.showModal();

  return element;
}

function confirmAction(
  title,
  description,
  {
    confirmLabel = "Continue",
    pendingLabel = "Working…",
    danger = false,
    onConfirm = null
  } = {}
) {
  const modal = dialog(title, description);
  modal.classList.add("snap-social-confirm-dialog");

  const status = document.createElement("p");
  status.className = "snap-social-confirm-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.hidden = true;

  const errorMessage = document.createElement("p");
  errorMessage.className =
    "snap-social-error snap-social-confirm-error";
  errorMessage.setAttribute("role", "alert");
  errorMessage.hidden = true;

  const actions = document.createElement("div");
  actions.className = "snap-social-confirm-actions";

  const cancel = btn(
    "Cancel",
    () => modal.close("cancel"),
    "snap-social-confirm-cancel"
  );
  const confirm = btn(
    confirmLabel,
    () => {
      if (typeof onConfirm !== "function") {
        modal.close("confirm");
      }
    },
    danger
      ? "snap-social-confirm-danger"
      : "snap-social-confirm-primary"
  );

  actions.append(cancel, confirm);
  modal.append(status, errorMessage, actions);

  return new Promise(resolve => {
    modal.addEventListener(
      "close",
      () => resolve(modal.returnValue === "confirm"),
      { once: true }
    );

    if (typeof onConfirm === "function") {
      const closeButton = modal.querySelector(".snap-social-close");

      modal.addEventListener("cancel", event => {
        if (modal.dataset.busy === "true") {
          event.preventDefault();
        }
      });

      confirm.addEventListener("click", async () => {
        if (modal.dataset.busy === "true") return;

        modal.dataset.busy = "true";
        closeButton.disabled = true;
        cancel.disabled = true;
        confirm.disabled = true;
        confirm.textContent = pendingLabel;
        status.textContent = "Please wait while this action completes.";
        status.hidden = false;
        errorMessage.hidden = true;

        try {
          await onConfirm();
          modal.close("confirm");
        } catch (exception) {
          console.error("Confirmed chat action failed:", {
            code: exception?.code,
            message: exception?.message,
            name: exception?.name
          });
          status.hidden = true;
          errorMessage.textContent =
            `Could not complete this action: ${
              exception?.code
                ? `${exception.code}: `
                : ""
            }${exception?.message || String(exception) || "Unknown error"}`;
          errorMessage.hidden = false;
          delete modal.dataset.busy;
          closeButton.disabled = false;
          cancel.disabled = false;
          confirm.disabled = false;
          confirm.textContent = confirmLabel;
          confirm.focus();
        }
      });
    }

    confirm.focus();
  });
}

function showNotice(message, bad = false) {
  const host = $("#snap-social-notice");

  if (host) {
    host.textContent = message;
    host.hidden = !message;
    host.dataset.error = String(bad);
    return;
  }

  const toast = document.createElement("p");
  toast.className = "snap-social-toast";
  toast.setAttribute("role", bad ? "alert" : "status");
  toast.dataset.error = String(bad);
  toast.textContent = message;
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 5000);
}

window.SNAPChatConfirm = confirmAction;
window.SNAPChatNotify = showNotice;

function notice(message, bad = false) {
  const host = $("#snap-social-notice");

  if (!host) {
    showNotice(message, bad);
    return;
  }

  host.textContent = message;
  host.hidden = !message;

  host.dataset.error =
    String(bad);
}

function firebaseRoomPhotoPath(room) {
  const path =
    room.avatarStoragePath ||
    room.avatarPublicId ||
    "";

  return room.avatarStorageProvider === "firebase_storage" &&
    path.startsWith(`chatRooms/${room.id}/roomPhotos/`)
    ? path
    : "";
}

function refreshRoomInfo(room) {
  const refresh = window.SNAPChatBridge?.refreshCurrentRoom?.();
  refresh?.catch(error => {
    console.error("Could not refresh the open chat after room-info update:", {
      code: error.code,
      message: error.message,
      name: error.name
    });
  });
  document.dispatchEvent(
    new CustomEvent("snap-chat-room-info-updated", {
      detail: { room }
    })
  );
}

function setSocialAvatar(
  element,
  photoURL,
  name,
  fallbackPhotoURLs = []
) {
  element.replaceChildren();

  const photoURLs = [...new Set(
    [photoURL, ...fallbackPhotoURLs]
      .filter(value =>
        typeof value === "string" &&
        /^https:\/\//i.test(value) &&
        value.length <= 4096
      )
  )];

  if (photoURLs.length) {
    const image =
      document.createElement("img");

    image.alt = "";
    image.loading = "lazy";
    let photoIndex = 0;
    const loadNextPhoto = () => {
      if (!element.contains(image)) return;
      if (photoIndex >= photoURLs.length) {
        element.textContent =
          String(name || "S")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part[0]?.toUpperCase() || "")
            .join("");
        return;
      }

      const source = photoURLs[photoIndex++];
      image.src =
        facebookPhotoSources(source)?.displayURL || source;
    };

    image.addEventListener("error", loadNextPhoto);
    element.append(image);
    loadNextPhoto();
    return;
  }

  element.textContent = String(name || "S")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || "")
    .join("");
}

async function copyInviteLink(roomId, kind) {
  if (!signedIn) {
    return notice("Please sign in first.", true);
  }

  const room = window.SNAPChatBridge?.getRoom();
  const isHost =
    room?.id === roomId &&
    room.ownerUid === signedIn.uid &&
    room.memberRoles?.[signedIn.uid] === "host";

  if (!isHost) {
    return notice("Only the chat host can create an invitation link.", true);
  }

  try {
    const value = shareUrl(
      await createInvite(
        db,
        signedIn,
        roomId,
        kind
      )
    );

    try {
      await navigator.clipboard.writeText(value);
      notice("Invitation link copied.");
    } catch (error) {
      const modal = dialog(
        "Invitation link",
        "Copy this link to invite someone to the chat."
      );
      const input =
        document.createElement("input");
      input.className = "snap-social-link";
      input.readOnly = true;
      input.value = value;

      const copy = btn(
        "Copy link",
        async () => {
          try {
            await navigator.clipboard.writeText(value);
            copy.textContent = "Copied!";
          } catch (copyError) {
            console.error(
              "Clipboard access failed:",
              copyError
            );
            input.select();
            copy.textContent = "Select and copy the link";
          }
        },
        "snap-social-primary"
      );

      modal.append(input, copy);
      input.select();
      console.warn("Clipboard access failed:", error);
    }
  } catch (error) {
    notice(
      `Could not create an invitation: ${
        error.code || error.message
      }`,
      true
    );
  }
}

// ==========================================
// START SOMETHING NEW
// ==========================================

function newMenu() {
  const modal = dialog(
    "Start something new"
  );

  const actions =
    document.createElement("div");

  actions.className =
    "snap-social-choices";

  function row(
    symbol,
    title,
    description,
    action
  ) {
    const button = btn(
      "",
      () => {
        modal.close();
        action();
      },
      "snap-social-choice"
    );

    const icon =
      document.createElement("span");

    icon.className =
      "snap-social-choice-icon";

    icon.textContent = symbol;

    const text =
      document.createElement("span");

    const strong =
      document.createElement("strong");

    strong.textContent = title;

    const small =
      document.createElement("small");

    small.textContent = description;

    text.append(strong, small);

    const arrow =
      document.createElement("span");

    arrow.textContent = "›";

    button.append(icon, text, arrow);

    return button;
  }

  actions.append(
    row(
      "✦",
      "New AI chat",
      "Talk to SNAP AI.",
      () => location.assign(
        "ai.php?new=1"
      )
    ),

    row(
      "♧",
      "Create shared chat",
      "Make a room and invite friends by link.",
      () => {
        if (isChat) {
          window.SNAPChatBridge?.newGroup();
        } else {
          location.assign(
            "chats.php?new=group"
          );
        }
      }
    ),

    row(
      "🔗",
      "Join with link",
      "Join a shared or private chat.",
      () => joinDialog()
    ),

    row(
      "♙",
      "Create direct-chat link",
      "Invite one SNAP user privately.",
      () => void newDirect()
    )
  );

  modal.append(actions);
}

// ==========================================
// SECURE INVITATION LINK
// ==========================================

function shareUrl(token) {
  const url = new URL(
    "chats.php",
    location.href
  );

  if (window.SNAP_PUBLIC_SITE_URL) {
    const base = new URL(
      window.SNAP_PUBLIC_SITE_URL
    );

    url.protocol = base.protocol;
    url.host = base.host;
  }

  url.searchParams.set(
    "invite",
    token
  );

  return url.href;
}

async function share(roomId, kind) {
  try {
    if (!signedIn) {
      throw Error("Please sign in.");
    }

    const token = await createInvite(
      db,
      signedIn,
      roomId,
      kind
    );

    const value = shareUrl(token);

    const modal = dialog(
      "Invitation link",
      "Only share this with people you want to join the conversation. Expires in 7 days."
    );

    const input =
      document.createElement("input");

    input.className =
      "snap-social-link";

    input.readOnly = true;
    input.value = value;

    const copy = btn(
      "Copy link",
      async () => {
        try {
          await navigator.clipboard.writeText(
            value
          );

          copy.textContent = "Copied!";
        } catch {
          input.select();

          copy.textContent =
            "Select and copy the link";
        }
      },
      "snap-social-primary"
    );

    modal.append(input, copy);

    const hostname =
      new URL(value).hostname;

    if (
      ["localhost", "127.0.0.1"]
        .includes(hostname)
    ) {
      const warning =
        document.createElement("p");

      warning.className =
        "snap-social-warning";

      warning.textContent =
        "Localhost links cannot be used on other devices. Deploy SNAP to an HTTPS website before sharing.";

      modal.append(warning);
    }

  } catch (error) {
    notice(
      `Invite: ${
        error.code ||
        error.message
      }`,
      true
    );
  }
}

async function newDirect() {
  if (!signedIn) {
    return notice(
      "Sign in first.",
      true
    );
  }

  try {
    const roomId = await createRoom(
      db,
      signedIn,
      "Private conversation",
      "direct"
    );

    if (isChat) {
      await window.SNAPChatBridge?.openRoom(
        roomId
      );
    }

    await share(
      roomId,
      "direct"
    );
  } catch (error) {
    notice(
      `Could not create direct chat: ${
        error.code ||
        error.message
      }`,
      true
    );
  }
}

// ==========================================
// JOIN WITH LINK
// ==========================================

function joinDialog(token = "") {
  const modal = dialog(
    "Join with link",
    "Paste a SNAP invitation link or token."
  );

  const form =
    document.createElement("form");

  form.className =
    "snap-social-form";

  const input =
    document.createElement("input");

  input.required = true;
  input.value = token;
  input.placeholder =
    "Paste invitation link";

  const submit =
    document.createElement("button");

  submit.type = "submit";
  submit.textContent =
    "Join conversation";

  const status =
    document.createElement("p");

  status.className =
    "snap-social-error";

  status.setAttribute(
    "role",
    "alert"
  );

  form.append(
    input,
    submit,
    status
  );

  modal.append(form);

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      submit.disabled = true;

      status.textContent =
        "Joining…";

      try {
        const invitation = parseInviteInput(
          input.value
        );

        const result = await joinInvite(
          db,
          signedIn,
          invitation.token,
          invitation.kind
        );

        modal.close();

        if (isHub) {
          const destination = new URL(
            "chats.php",
            location.href
          );
          destination.searchParams.set(
            "room",
            result.roomId
          );
          if (result.alreadyJoined) {
            destination.searchParams.set(
              "inviteResult",
              "already-joined"
            );
          }
          location.assign(destination.href);
        } else {
          await window.SNAPChatBridge?.openRoom(
            result.roomId
          );

          history.replaceState(
            {},
            "",
            "chats.php"
          );

          notice(
            result.alreadyJoined
              ? "You are already a member of this conversation."
              : "Joined successfully."
          );
        }

      } catch (error) {
        status.textContent = inviteErrorMessage(error);
      } finally {
        submit.disabled = false;
      }
    }
  );

  input.focus();
}

function inviteErrorMessage(error) {
  const code = String(error?.code || "")
    .split("/")
    .pop();

  if (
    [
      "unavailable",
      "deadline-exceeded",
      "network-request-failed",
      "webchannel-connection-failed"
    ].includes(code)
  ) {
    return "Connection failed. Check your network and try again.";
  }

  const messages = {
    "invite-malformed":
      "Malformed invitation link or token. Check it and try again.",
    "invite-unsupported":
      "Unsupported invitation format. Paste a SNAP invitation link or token.",
    "invite-not-found":
      "Invitation not found. It may have been removed.",
    "invite-expired":
      "This invitation has expired.",
    "invite-revoked":
      "This invitation has been revoked.",
    "invite-kind-mismatch":
      "This link does not match the invitation type.",
    "invite-rejoin-restricted":
      "This conversation cannot be rejoined with this account.",
    "invite-crypto-unavailable":
      "Secure invitation processing is unavailable in this browser.",
    "unauthenticated":
      "Please sign in before joining a conversation.",
    "permission-denied":
      "Firestore denied permission to join this conversation.",
    banned:
      "You are not allowed to join this conversation.",
    "not-found":
      "The invited conversation is no longer available."
  };

  return messages[code] ||
    "The invitation could not be processed. Please try again.";
}

// ==========================================
// CONVERSATION INFORMATION
// ==========================================

function info() {
  const room =
    window.SNAPChatBridge?.getRoom();

  if (!room) {
    return notice(
      "Open a conversation first.",
      true
    );
  }

  const host =
    room.ownerUid === signedIn?.uid;

  const editable =
    room.type === "group" &&
    (
      host ||
      room.membersCanEditInfo === true
    );

  const modal = dialog(
    "Conversation info"
  );

  const area =
    document.createElement("div");

  area.className =
    "snap-social-info";

  const banner =
    document.createElement("div");

  banner.className =
    "snap-social-room-banner";

  const avatar =
    document.createElement("span");

  avatar.className =
    "snap-social-room-avatar";

  setSocialAvatar(
    avatar,
    room.avatarUrl,
    room.name
  );

  const meta =
    document.createElement("div");

  const title =
    document.createElement("strong");

  title.textContent =
    room.name || "Direct chat";

  const count =
    document.createElement("small");

  count.textContent =
    `${room.memberIds.length} participants`;

  meta.append(title, count);

  banner.append(avatar, meta);
  area.append(banner);

  if (room.type === "group") {
    const tools =
      document.createElement("section");

    tools.className =
      "snap-social-info-tools";

    const photoDescription =
      document.createElement("div");
    photoDescription.className =
      "snap-social-room-photo-description";
    const photoHeading =
      document.createElement("strong");
    photoHeading.textContent = "Chat info";
    const photoText =
      document.createElement("small");
    photoText.textContent =
      "You can change this chat name and photo.";
    photoDescription.append(photoHeading, photoText);
    tools.append(photoDescription);

    if (editable) {
      const renameButton = btn(
        "✎ Rename chat",
        () => {
          renameForm.hidden = !renameForm.hidden;
          if (!renameForm.hidden) {
            nameInput.value = room.title || room.name || "";
            nameInput.focus();
            nameInput.select();
          }
        },
        "snap-social-info-action"
      );

      const renameForm = document.createElement("form");
      renameForm.className = "snap-social-rename-form";
      renameForm.hidden = true;

      const nameLabel = document.createElement("label");
      nameLabel.className = "snap-social-field-label";
      nameLabel.htmlFor = `snap-room-name-${room.id}`;
      nameLabel.textContent = "Group name";

      const nameInput = document.createElement("input");
      nameInput.id = nameLabel.htmlFor;
      nameInput.name = "title";
      nameInput.type = "text";
      nameInput.required = true;
      nameInput.maxLength = 120;
      nameInput.autocomplete = "off";
      nameInput.value = room.title || room.name || "";
      nameInput.setAttribute(
        "aria-describedby",
        `snap-room-name-help-${room.id}`
      );

      const nameHint = document.createElement("small");
      nameHint.id = `snap-room-name-help-${room.id}`;
      nameHint.className = "snap-social-field-hint";
      nameHint.textContent = "Use 1–120 characters.";

      const renameError = document.createElement("p");
      renameError.className = "snap-social-error";
      renameError.setAttribute("role", "alert");
      renameError.hidden = true;

      const renameActions = document.createElement("div");
      renameActions.className = "snap-social-form-actions";

      const cancelRename = btn(
        "Cancel",
        () => {
          renameForm.hidden = true;
          renameError.hidden = true;
        },
        "snap-social-secondary"
      );

      const saveRename = document.createElement("button");
      saveRename.type = "submit";
      saveRename.className = "snap-social-primary";
      saveRename.textContent = "Save changes";

      renameActions.append(cancelRename, saveRename);
      renameForm.append(
        nameLabel,
        nameInput,
        nameHint,
        renameError,
        renameActions
      );
      renameForm.addEventListener("submit", async event => {
        event.preventDefault();
        const name = nameInput.value.trim();

        if (!name || name.length > 120) {
          renameError.textContent =
            "Enter a group name between 1 and 120 characters.";
          renameError.hidden = false;
          nameInput.focus();
          return;
        }

        saveRename.disabled = true;
        cancelRename.disabled = true;
        renameButton.disabled = true;
        renameError.hidden = true;

        try {
          await updateRoomInfo(db, room, { title: name });
          room.title = name;
          room.name = name;
          title.textContent = name;
          renameButton.textContent = "✓ Name updated";
          renameForm.hidden = true;
          refreshRoomInfo(room);
          notice("Group name updated.");
        } catch (error) {
          console.error("Room name update failed:", {
            code: error.code,
            message: error.message,
            name: error.name
          });
          renameError.textContent =
            error.code === "permission-denied"
              ? "You don’t have permission to change this group name."
              : `Could not save the group name: ${
                  error.code || error.message
                }`;
          renameError.hidden = false;
        } finally {
          saveRename.disabled = false;
          cancelRename.disabled = false;
          renameButton.disabled = false;
        }
      });

      tools.append(renameButton, renameForm);

      const photoInput =
        document.createElement("input");
      photoInput.type = "file";
      photoInput.accept = "image/png,image/jpeg,image/webp";
      photoInput.hidden = true;
      photoInput.setAttribute(
        "aria-label",
        "Choose a room photo"
      );

      const photoButton = btn(
        "▧ Change room photo",
        () => photoInput.click(),
        "snap-social-info-action"
      );

      const photoPreview = document.createElement("div");
      photoPreview.className = "snap-social-photo-preview";
      photoPreview.hidden = true;
      photoPreview.setAttribute("aria-live", "polite");

      const photoPreviewImage = document.createElement("img");
      photoPreviewImage.alt = "";

      const photoPreviewText = document.createElement("span");
      photoPreview.append(photoPreviewImage, photoPreviewText);

      const photoProgress = document.createElement("progress");
      photoProgress.className = "snap-social-photo-progress";
      photoProgress.max = 100;
      photoProgress.value = 0;
      photoProgress.hidden = true;
      photoProgress.setAttribute("aria-label", "Uploading room photo");

      const photoRetryButton = btn(
        "Retry upload",
        () => void uploadRoomPhoto(),
        "snap-social-info-action"
      );
      photoRetryButton.hidden = true;

      const photoCancelButton = btn(
        "Discard photo",
        () => {
          if (photoUploadRequest) {
            photoUploadRequest.abort();
            return;
          }
          clearPhotoDraft();
        },
        "snap-social-secondary"
      );
      photoCancelButton.hidden = true;

      let photoDraftFile = null;
      let photoDraftUrl = "";
      let photoUploadResult = null;
      let photoUploadRequest = null;
      let photoUploading = false;

      function clearPhotoDraft() {
        if (photoDraftUrl) URL.revokeObjectURL(photoDraftUrl);
        photoDraftFile = null;
        photoDraftUrl = "";
        photoUploadResult = null;
        photoPreview.hidden = true;
        photoProgress.hidden = true;
        photoRetryButton.hidden = true;
        photoCancelButton.hidden = true;
        photoPreviewImage.removeAttribute("src");
        photoPreviewText.textContent = "";
      }

      async function uploadRoomPhoto() {
        const file = photoDraftFile;
        if (!file || photoUploading) return;

        const config = window.SNAP_CLOUDINARY_CONFIG || {};
        const cloudName = String(config.cloudName || "").trim();
        const uploadPreset = String(config.uploadPreset || "").trim();
        if (!cloudName || !uploadPreset) {
          photoPreviewText.textContent =
            "Cloudinary is not configured. Select Discard photo or configure the server.";
          photoRetryButton.hidden = false;
          photoCancelButton.hidden = false;
          notice(
            "Cloudinary is not configured for SNAP Web. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET on the web server.",
            true
          );
          return;
        }

        photoUploading = true;
        photoButton.disabled = true;
        photoRetryButton.hidden = true;
        photoCancelButton.hidden = false;
        photoCancelButton.disabled = false;
        photoCancelButton.textContent = "Cancel upload";
        photoProgress.value = 0;
        photoProgress.hidden = !photoUploadResult;
        photoButton.textContent = "Uploading photo…";
        let metadataSaved = false;
        const oldPath = firebaseRoomPhotoPath(room);
        let previousPhotoCleanupFailed = false;

        try {
          if (!photoUploadResult) {
            photoUploadResult = await uploadCloudinaryAsset({
              file,
              cloudName,
              uploadPreset,
              resourceType: "image",
              publicId: crypto.randomUUID(),
              onRequest: xhr => {
                photoUploadRequest = xhr;
              },
              onProgress: (loaded, total) => {
                photoProgress.hidden = false;
                photoProgress.value =
                  total > 0
                    ? Math.round(loaded / total * 100)
                    : 0;
                photoPreviewText.textContent =
                  total > 0
                    ? `Uploading ${file.name} · ${Math.round(loaded / total * 100)}%`
                    : `Uploading ${file.name}…`;
              }
            });
          }
          photoUploadRequest = null;
          photoProgress.hidden = true;
          photoPreviewText.textContent = "Saving group photo…";
          photoCancelButton.disabled = true;
          photoCancelButton.textContent = "Saving…";

          await updateRoomInfo(
            db,
            room,
            {
              avatarUrl: photoUploadResult.secureUrl,
              avatarStoragePath: photoUploadResult.publicId,
              avatarStorageProvider: "cloudinary",
              avatarStorageEnvironmentId: cloudName
            }
          );
          metadataSaved = true;

          room.avatarUrl = photoUploadResult.secureUrl;
          room.avatarPublicId = photoUploadResult.publicId;
          room.avatarStorageProvider = "cloudinary";
          room.avatarStorageEnvironmentId = cloudName;
          room.avatarStoragePath = photoUploadResult.publicId;
          photoPreviewImage.src = photoUploadResult.secureUrl;
          photoPreviewText.textContent = "Group photo updated.";
          setSocialAvatar(avatar, room.avatarUrl, room.name);

          const roomAvatar = document.querySelector(
            ".thread-header #thread-avatar"
          );
          if (roomAvatar) {
            setSocialAvatar(roomAvatar, room.avatarUrl, room.name);
          }

          const profileAvatar = document.querySelector(
            "#thread-group-avatar"
          );
          if (profileAvatar) {
            setSocialAvatar(profileAvatar, room.avatarUrl, room.name);
          }

          if (oldPath && oldPath !== photoUploadResult.publicId) {
            try {
              await deleteObject(ref(storage, oldPath));
            } catch (cleanupError) {
              console.error(
                "Previous room photo cleanup failed:",
                cleanupError
              );
              previousPhotoCleanupFailed = true;
            }
          }

          refreshRoomInfo(room);
          notice(
            previousPhotoCleanupFailed
              ? "Room photo changed, but the previous photo could not be removed."
              : "Room photo updated.",
            previousPhotoCleanupFailed
          );
          clearPhotoDraft();
        } catch (error) {
          photoUploadRequest = null;
          console.error("Room photo update failed:", error);
          photoPreviewText.textContent =
            error.name === "AbortError"
              ? "Upload canceled. Retry or discard this photo."
              : metadataSaved
                ? "Photo saved. A later update failed."
                : photoUploadResult
                  ? "Photo uploaded, but the room update failed. Retry to save it without uploading again."
                  : `Upload failed: ${error.message || error.code || "Unknown error"}`;
          photoRetryButton.textContent =
            photoUploadResult ? "Retry save" : "Retry upload";
          photoRetryButton.hidden = false;
          photoCancelButton.textContent = "Discard photo";
          photoCancelButton.hidden = false;
          photoCancelButton.disabled = false;
          photoProgress.hidden = true;
          notice(
            error.code === "permission-denied"
              ? "You no longer have permission to change this group photo."
              : `Could not update the room photo: ${
                  error.code || error.message
                }`,
            true
          );
        } finally {
          photoUploading = false;
          photoButton.disabled = false;
          photoButton.textContent = "▧ Change room photo";
        }
      }

      photoInput.addEventListener(
        "change",
        () => {
          const file = photoInput.files?.[0];
          photoInput.value = "";

          if (!file) return;

          if (
            !["image/png", "image/jpeg", "image/webp"]
              .includes(file.type) ||
            file.size > 5 * 1024 * 1024
          ) {
            notice(
              "Choose a PNG, JPEG, or WebP image up to 5 MB.",
              true
            );
            return;
          }

          clearPhotoDraft();
          photoDraftFile = file;
          photoDraftUrl = URL.createObjectURL(file);
          photoPreviewImage.src = photoDraftUrl;
          photoPreviewText.textContent = file.name;
          photoPreview.hidden = false;
          photoRetryButton.hidden = true;
          photoCancelButton.hidden = false;
          photoProgress.value = 0;
          void uploadRoomPhoto();
        }
      );

      tools.append(
        photoButton,
        photoInput,
        photoPreview,
        photoProgress,
        photoRetryButton,
        photoCancelButton
      );

      if (room.avatarUrl) {
        tools.append(
          btn(
            "▧ Remove room photo",
            async event => {
              const removeButton = event.currentTarget;
              removeButton.disabled = true;

              const oldPath = firebaseRoomPhotoPath(room);

              try {
                await updateRoomInfo(
                  db,
                  room,
                  {
                    avatarUrl: null,
                    avatarStoragePath: null
                  }
                );
                removeButton.hidden = true;

                room.avatarUrl = "";
                room.avatarPublicId = null;
                room.avatarStorageProvider = null;
                room.avatarStorageEnvironmentId = null;
                room.avatarStoragePath = "";
                setSocialAvatar(
                  avatar,
                  "",
                  room.name
                );

                const roomAvatar =
                  document.querySelector(
                    ".thread-header #thread-avatar"
                  );
                if (roomAvatar) {
                  setSocialAvatar(
                    roomAvatar,
                    "",
                    room.name
                  );
                }

                const profileAvatar =
                  document.querySelector(
                    "#thread-group-avatar"
                  );
                if (profileAvatar) {
                  setSocialAvatar(
                    profileAvatar,
                    "",
                    room.name
                  );
                }

                refreshRoomInfo(room);

                if (oldPath) {
                  try {
                    await deleteObject(
                      ref(storage, oldPath)
                    );
                  } catch (cleanupError) {
                    console.error(
                      "Removed room photo cleanup failed:",
                      cleanupError
                    );
                    notice(
                      "Room photo was removed, but its stored file could not be deleted.",
                      true
                    );
                    return;
                  }
                }

                notice("Room photo removed.");
              } catch (error) {
                console.error("Room photo removal failed:", error);
                notice(
                  `Could not remove the room photo: ${
                    error.code || error.message
                  }`,
                  true
                );
              } finally {
                removeButton.disabled = false;
              }
            }
          ),
          "snap-social-info-action snap-social-remove-photo"
        );
      }
    }

    if (host && room.memberRoles?.[signedIn?.uid] === "host") {
      tools.append(
        btn(
          "▣ Copy invite link",
          () => void copyInviteLink(
            room.id,
            "shared"
          )
        )
      );
    } else {
      const inviteNotice =
        document.createElement("div");
      inviteNotice.className =
        "snap-social-room-photo-description";

      const inviteHeading =
        document.createElement("strong");
      inviteHeading.textContent = "Invitations";

      const inviteDescription =
        document.createElement("small");
      inviteDescription.textContent =
        "Only the chat host can create an invitation link. Ask the host to invite someone.";

      inviteNotice.append(inviteHeading, inviteDescription);
      tools.append(inviteNotice);
    }

    area.append(tools);

    if (host) {
      const label =
        document.createElement("label");

      label.className =
        "snap-social-toggle";

      const box =
        document.createElement("input");

      box.type = "checkbox";

      box.checked =
        room.membersCanEditInfo === true;

      box.addEventListener(
        "change",
        async () => {
          box.disabled = true;

          try {
            await updateRoomInfo(
              db,
              room,
              {
                membersCanEditInfo:
                  box.checked
              }
            );

            notice(
              "Permissions updated."
            );
          } catch (error) {
            box.checked =
              !box.checked;

            notice(
              `Update failed: ${
                error.code ||
                error.message
              }`,
              true
            );
          } finally {
            box.disabled = false;
          }
        }
      );

      label.append(
        box,
        document.createTextNode(
          " Allow members to edit room info"
        )
      );

      area.append(label);
    }
  }

  const heading =
    document.createElement("h3");

  heading.textContent =
    "Participants";

  area.append(heading);

  const list =
    document.createElement("div");

  list.className =
    "snap-social-participants";

  for (const uid of room.memberIds) {
    const row =
      document.createElement("div");

    row.className =
      "snap-social-person";

    const avatar =
      document.createElement("span");

    avatar.className =
      "snap-social-person-avatar";

    const profile =
      room.memberProfiles?.[uid] || {};
    const name =
      profile.displayName ||
      room.memberNames?.[uid] ||
      "SNAP member";

    setSocialAvatar(
      avatar,
      profile.photoURL,
      name,
      profile.photoURLs?.slice(1)
    );

    const label =
      document.createElement("span");

    label.textContent =
      uid === signedIn?.uid
        ? `${name} (You)`
        : name;

    const role =
      document.createElement("small");

    role.textContent =
      room.memberRoles?.[uid] === "host" ||
      uid === room.ownerUid
        ? "Host"
        : "Member";

    row.append(
      avatar,
      label,
      role
    );

    list.append(row);
  }

  area.append(list);

  const actions =
    document.createElement("section");
  actions.className =
    "snap-social-chat-actions";

  const actionsHeading =
    document.createElement("h3");
  actionsHeading.textContent = "Chat actions";

  const actionsDescription =
    document.createElement("p");
  actionsDescription.textContent =
    "Deleting only clears this chat for you. Other participants are not affected.";

  const deleteButton = btn(
    "▢ Delete chat",
    async () => {
      if (!(await confirmAction(
        "Clear this chat?",
        "This removes the messages from your view only. Other participants will not be affected.",
        {
          confirmLabel: "Clear chat",
          pendingLabel: "Clearing…",
          danger: true,
          onConfirm: () =>
            clearChatForUser(
              db,
              signedIn,
              room.id
            )
        }
      ))) {
        return;
      }

      modal.close();
      try {
        await window.SNAPChatBridge?.refreshCurrentRoom();
        notice("Chat cleared for you.");
      } catch (error) {
        console.error(
          "Chat was cleared, but the open view could not refresh:",
          error
        );
        notice(
          `Chat cleared, but the view could not refresh: ${
            error.code || error.message
          }`,
          true
        );
      }
    },
    "snap-social-danger-outline"
  );

  const leaveButton = btn(
    "↪ Leave chat",
    async () => {
      let confirmationTitle = "Leave this chat?";
      let confirmationMessage =
        "This chat will disappear from your conversations. You can rejoin with a valid invitation.";

      if (
        room.type === "direct" &&
        room.ownerUid === signedIn?.uid
      ) {
        if (room.memberIds?.length === 1) {
          confirmationTitle = "Close private chat?";
          confirmationMessage =
            "You are the only participant. Leaving will close this conversation for everyone.";
        } else {
          confirmationMessage =
            "The other participant will become the host before you leave.";
        }
      } else if (
        room.type === "group" &&
        room.ownerUid === signedIn?.uid
      ) {
        confirmationMessage =
          room.memberIds?.length > 1
            ? "The first active member will become the host before you leave."
            : "A group host cannot leave while they are the only participant. Add another member first.";
      }

      if (!(await confirmAction(
        confirmationTitle,
        confirmationMessage,
        {
          confirmLabel: "Leave chat",
          pendingLabel: "Leaving…",
          danger: true,
          onConfirm: () =>
            leaveRoom(
              db,
              signedIn,
              room.id
            )
        }
      ))) {
        return;
      }

      modal.close();
      window.SNAPChatBridge?.closeRoom();
      const url = new URL(location.href);
      if (url.searchParams.has("room")) {
        url.searchParams.delete("room");
        history.replaceState(
          {},
          "",
          `${url.pathname}${url.search}${url.hash}`
        );
      }
      notice(
        room.type === "direct" &&
          room.ownerUid === signedIn?.uid &&
          room.memberIds?.length === 1
          ? "Private chat closed."
          : "You left the chat."
      );
    },
    "snap-social-danger"
  );

  actions.append(
    actionsHeading,
    actionsDescription,
    deleteButton,
    leaveButton
  );

  area.append(actions);
  modal.append(area);
}

// ==========================================
// PAGE EVENT CONNECTIONS
// ==========================================

if (isChat) {
  const message =
    document.createElement("p");

  message.id =
    "snap-social-notice";

  message.className =
    "snap-social-notice";

  message.hidden = true;

  $(".chats-page-header")?.after(
    message
  );

  $(".chats-page-header")?.append(
    btn(
      "＋ New",
      newMenu,
      "snap-social-header-new"
    )
  );

  const infoToggle = btn(
    "ⓘ Info",
    () => document.dispatchEvent(
      new CustomEvent("snap-chat-toggle-info")
    ),
    "snap-social-header-info"
  );
  infoToggle.id = "thread-info-toggle";
  infoToggle.setAttribute("aria-controls", "thread-participants");
  infoToggle.setAttribute(
    "aria-expanded",
    String(
      $(".thread-content")?.classList.contains("info-panel-open") || false
    )
  );
  $(".thread-header")?.append(infoToggle);

  document.addEventListener(
    "snap-chat-info-panel-changed",
    event => {
      infoToggle.setAttribute(
        "aria-expanded",
        String(event.detail.open)
      );
    }
  );
  document.addEventListener("snap-chat-open-info", info);

  document.addEventListener(
    "snap-chat-group-created",
    event => {
      void share(
        event.detail.roomId,
        "shared"
      );
    }
  );
}

if (isHub) {
  for (const selector of [
    ".hub-new-chat",
    ".new-chat-button"
  ]) {
    $(selector)?.addEventListener(
      "click",
      event => {
        event.preventDefault();

        newMenu();
      }
    );
  }

  const area =
    $(".ai-hub-recent");

  if (area) {
    const title =
      document.createElement("h3");

    title.className =
      "snap-social-recent-heading";

    title.textContent =
      "Shared & direct chats";

    const list =
      document.createElement("div");

    list.className =
      "snap-social-recent-list";

    area.append(
      title,
      list
    );

    let stop = null;

    onAuthStateChanged(
      auth,
      user => {
        stop?.();
        list.replaceChildren();

        if (!user) return;

        stop = watchRooms(
          db,
          user,

          rooms => {
            list.replaceChildren();

            const recent = rooms
              .sort(
                (a, b) =>
                  (
                    b.updatedAt
                      ?.toMillis?.() || 0
                  ) -
                  (
                    a.updatedAt
                      ?.toMillis?.() || 0
                  )
              )
              .slice(0, 8);

            if (!recent.length) {
              const p =
                document.createElement("p");

              p.textContent =
                "No shared or direct chats yet.";

              list.append(p);
            }

            for (const room of recent) {
              const other =
                room.memberIds.find(
                  id => id !== user.uid
                );

              const name =
                room.type === "group"
                  ? room.name
                  : room.memberNames?.[other] ||
                    "Direct chat";

              const link =
                document.createElement("a");

              link.className =
                "snap-social-recent-item";

              link.href =
                `chats.php?room=${encodeURIComponent(room.id)}`;

              const avatar =
                document.createElement("span");

              avatar.className =
                "snap-social-recent-avatar";

              const otherProfile =
                room.memberProfiles?.[other] || {};
              setSocialAvatar(
                avatar,
                room.type === "group"
                  ? room.avatarUrl
                  : otherProfile.photoURL || room.avatarUrl,
                name,
                room.type === "group"
                  ? []
                  : [
                      ...(otherProfile.photoURLs?.slice(1) || []),
                      room.avatarUrl
                    ]
              );

              const meta =
                document.createElement("span");

              const strong =
                document.createElement("strong");

              strong.textContent = name;

              const small =
                document.createElement("small");

              small.textContent =
                `${room.memberIds.length} participants`;

              meta.append(
                strong,
                small
              );

              const arrow =
                document.createElement("span");

              arrow.textContent = "›";

              link.append(
                avatar,
                meta,
                arrow
              );

              list.append(link);
            }
          },

          error => {
            list.textContent =
              `Could not load chats: ${
                error.code ||
                error.message
              }`;
          }
        );
      }
    );

    window.addEventListener(
      "pagehide",
      () => stop?.()
    );
  }
}

// ==========================================
// HANDLE NAVIGATION PARAMETERS
// ==========================================

function onReady() {
  if (
    !isChat ||
    routeHandled ||
    !signedIn
  ) {
    return;
  }

  if (
    !window.SNAPChatBridge?.getUser()
  ) {
    return;
  }

  routeHandled = true;

  const query = new URLSearchParams(
    location.search
  );

  if (query.get("invite")) {
    joinDialog(
      query.get("invite")
    );
  } else if (
    query.get("new") === "group"
  ) {
    window.SNAPChatBridge.newGroup();
  } else if (
    query.get("new") === "direct-link"
  ) {
    void newDirect();
  } else if (query.get("room")) {
    const roomId = query.get("room");
    const openResult =
      window.SNAPChatBridge.openRoom(roomId);

    if (query.get("inviteResult") === "already-joined") {
      void Promise.resolve(openResult).then(() =>
        notice("You are already a member of this conversation.")
      );

      const destination = new URL(location.href);
      destination.searchParams.delete("inviteResult");
      history.replaceState(
        {},
        "",
        `${destination.pathname}${destination.search}${destination.hash}`
      );
    }
  }
}

document.addEventListener(
  "snap-chat-ready",
  onReady
);

onAuthStateChanged(
  auth,
  user => {
    signedIn = user;
    onReady();
  }
);
