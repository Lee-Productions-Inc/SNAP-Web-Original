
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
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
  createRoom,
  readRoom,
  roomFromSnapshot,
  watchRooms,
  sendText,
  editTextMessage,
  deleteChatMessage,
  bumpMessage,
  toggleReaction,
  clearChatForUser,
  leaveRoom,
  syncParticipantAppearance
} from "./ai_chat/chat_mobile_adapter.js?v=20261115-chat-profile-2";
import {
  facebookPhotoSources,
  resolveProfilePhotoCandidates
} from "../settings/profile_photo_utils.js?v=20261115-chat-profile-2";

const el = id => document.getElementById(id);

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
const messageInput = el("message-input");
const sendButton = el("send-message-button");
const messageStream = el("message-stream");
const roomList = el("conversation-list");
const roomListStatus = el("chat-list-status");
const roomListRetryButton = el("chat-list-retry");
const chatWorkspace = el("chat-workspace");
const threadContent = el("thread-content");
const threadParticipants = el("thread-participants");
const threadInfoBackdrop = el("thread-info-backdrop");
const errorBox = el("chats-error");
const groupDialog = el("group-dialog");
const groupForm = el("group-form");
const replyPreview = el("reply-preview");
const replyPreviewSender = el("reply-preview-sender");
const replyPreviewBody = el("reply-preview-body");
const attachmentComposerPreview = el("attachment-composer-preview");
const attachmentPreviewImage = el("attachment-preview-image");
const attachmentPreviewFileIcon = el("attachment-preview-file-icon");
const attachmentPreviewName = el("attachment-preview-name");
const attachmentPreviewStatus = el("attachment-preview-status");
const attachmentUploadProgress = el("attachment-upload-progress");
const attachmentPreviewCancelButton = el("attachment-preview-cancel");
const attachmentPreviewSendButton = el("attachment-preview-send");
const attachmentPublicConsent = el("attachment-public-consent");
const attachmentPublicConsentCheck = el("attachment-public-consent-check");
const audioComposerPreview = el("audio-composer-preview");
const audioPreviewPlayer = el("audio-preview-player");
const audioPreviewStatus = el("audio-preview-status");
const audioPreviewProgress = el("audio-upload-progress");
const audioPreviewSendButton = el("audio-preview-send");
const audioPreviewCancelButton = el("audio-preview-cancel");
const attachmentInputs = {
  image: el("photo-input"),
  file: el("file-input"),
  audio: el("audio-input")
};
const attachmentButtons = {
  image: el("send-photo-button"),
  file: el("send-file-button"),
  audio: el("send-audio-button")
};

let currentUser = null;
let currentProfileAppearance = null;
let profileAppearanceLoadedFromServer = false;
let roomDiscoveryReady = false;
let lastProfileAppearanceSyncKey = "";
let currentRoom = null;
let rooms = [];
let selectedTab = "direct";
let infoPanelReturnFocus = false;

let messages = [];
let bumps = [];
let reactions = [];
let attachments = [];
let attachmentsLoaded = false;

let stopRooms = null;
let stopAuth = null;
let stopProfile = null;
let profileAppearanceVersion = 0;
let stopRoom = null;
let stopMessages = null;
let stopBumps = null;
let stopReactions = null;
let stopAttachments = null;

let sending = false;
let replyingTo = null;
let editingMessage = null;
let audioRecorder = null;
let audioStream = null;
let audioChunks = [];
let audioStarting = false;
let discardAudioRecording = false;
let audioRecordingStartedAt = 0;
let audioRecordingDurationTimer = null;
let audioPreview = null;
let activeAudioUpload = null;
let attachmentDraft = null;
let activeAttachmentUpload = null;
const audioPlayers = new Map();

const timeOf = value =>
  value?.toMillis?.() || 0;

const initials = value =>
  String(value || "S")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(word =>
      word[0]?.toUpperCase() || ""
    )
    .join("");

function setAvatar(
  element,
  photoURL,
  label,
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
    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    let photoIndex = 0;
    const loadNextPhoto = () => {
      if (!element.contains(image)) return;
      if (photoIndex >= photoURLs.length) {
        element.textContent = initials(label);
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

  element.textContent = initials(label);
}

function applyCurrentProfileAppearance(room) {
  const uid = currentUser?.uid;
  if (
    !room ||
    !uid ||
    !currentProfileAppearance ||
    !room.memberIds?.includes(uid)
  ) {
    return room;
  }

  return {
    ...room,
    memberNames: {
      ...room.memberNames,
      [uid]: currentProfileAppearance.displayName
    },
    memberProfiles: {
      ...room.memberProfiles,
      [uid]: {
        ...room.memberProfiles?.[uid],
        ...currentProfileAppearance
      }
    }
  };
}

function syncCurrentProfileAppearanceIfNeeded() {
  const uid = currentUser?.uid;
  if (
    !uid ||
    !profileAppearanceLoadedFromServer ||
    !roomDiscoveryReady ||
    !currentProfileAppearance
  ) {
    return;
  }

  const roomIds = rooms
    .filter(room => room.memberIds?.includes(uid))
    .map(room => room.id)
    .sort();
  if (!roomIds.length) return;

  const syncKey = JSON.stringify([
    uid,
    currentProfileAppearance.displayName,
    currentProfileAppearance.photoURL,
    roomIds
  ]);
  if (syncKey === lastProfileAppearanceSyncKey) return;
  lastProfileAppearanceSyncKey = syncKey;

  void syncParticipantAppearance(
    db,
    uid,
    {
      displayName: currentProfileAppearance.displayName,
      photoURL: currentProfileAppearance.photoURL
    }
  ).catch(exception => {
    console.error(
      "Could not sync chat participant appearance:",
      {
        code: exception.code || null,
        name: exception.name || null,
        operation: exception.operation || null,
        failures: exception.failures || []
      }
    );
  });
}

function watchProfileAppearance(user) {
  stopProfile?.();
  const listenerVersion = ++profileAppearanceVersion;
  let appearanceUpdateVersion = 0;
  const avatar = el("profile-avatar");
  const fallbackName = user.displayName || user.email || "SNAP User";
  const facebookProfile = user.providerData?.find(
    provider => provider.providerId === "facebook.com"
  );
  setAvatar(
    avatar,
    facebookProfile ? "" : user.photoURL,
    fallbackName
  );

  stopProfile = onSnapshot(
    doc(db, "users", user.uid),
    async snapshot => {
      if (auth.currentUser?.uid !== user.uid) return;
      const version = ++appearanceUpdateVersion;
      const profile = snapshot.exists()
        ? snapshot.data()
        : {};
      const savedName = [
        profile.firstName || "",
        profile.middleName || "",
        profile.lastName || ""
      ].filter(Boolean).join(" ").trim();
      const name =
        profile.displayName ||
        savedName ||
        user.displayName ||
        fallbackName;
      const photoURLs =
        await resolveProfilePhotoCandidates(profile, user);
      if (
        auth.currentUser?.uid !== user.uid ||
        listenerVersion !== profileAppearanceVersion ||
        version !== appearanceUpdateVersion
      ) {
        return;
      }

      currentProfileAppearance = {
        displayName: name,
        photoURL: photoURLs[0] || "",
        photoURLs
      };
      setAvatar(
        avatar,
        currentProfileAppearance.photoURL,
        name,
        photoURLs.slice(1)
      );
      rooms = rooms.map(applyCurrentProfileAppearance);
      renderRoomList();

      if (currentRoom) {
        currentRoom =
          applyCurrentProfileAppearance(currentRoom);
        renderHeader(currentRoom);
        refreshVisibleMessageAuthors(currentRoom);
      }

      if (snapshot.metadata?.fromCache === false) {
        profileAppearanceLoadedFromServer = true;
        syncCurrentProfileAppearanceIfNeeded();
      }
    },
    exception => {
      console.error("Could not watch chat profile appearance:", {
        code: exception.code,
        message: exception.message,
        name: exception.name
      });
      error(
        `Could not load your profile for chats: ${
          exception.code || exception.message || "Unknown error"
        }`
      );
    }
  );
}

function error(message = "") {
  errorBox.hidden = !message;
  errorBox.textContent = message;

  if (message) {
    console.warn("SNAP chat:", message);
  }
}

function closeListeners() {
  cancelAudioCapture();
  clearAudioPreview();
  cancelAttachmentDraft({ abort: true, discard: true });
  clearUnusedAudioPlayers(new Set());
  attachmentsLoaded = false;

  for (const stop of [
    stopRoom,
    stopMessages,
    stopBumps,
    stopReactions,
    stopAttachments
  ]) {
    stop?.();
  }

  stopRoom = null;
  stopMessages = null;
  stopBumps = null;
  stopReactions = null;
  stopAttachments = null;
}

function emptyThread() {
  closeListeners();

  currentRoom = null;
  infoPanelReturnFocus = false;
  setInfoPanelOpen(false, { returnFocus: false });
  threadParticipants.hidden = true;
  messages = [];
  bumps = [];
  reactions = [];
  attachments = [];
  setReplyingTo(null);

  el("thread-empty").hidden = false;
  el("thread-content").hidden = true;

  el("chat-workspace").classList.remove(
    "thread-open"
  );

  messageInput.disabled = true;
  sendButton.disabled = true;
  Object.values(attachmentButtons).forEach(button => {
    button.disabled = true;
  });

  document.dispatchEvent(
    new CustomEvent("snap-chat-room-changed", {
      detail: {
        room: null
      }
    })
  );
}

function selectTab(type) {
  selectedTab = type;
  sessionStorage.setItem("snapChatSelectedTab", type);

  el("direct-tab").classList.toggle(
    "active",
    type === "direct"
  );

  el("groups-tab").classList.toggle(
    "active",
    type === "group"
  );

  el("direct-tab").setAttribute(
    "aria-selected",
    String(type === "direct")
  );

  el("groups-tab").setAttribute(
    "aria-selected",
    String(type === "group")
  );

  roomList.setAttribute(
    "aria-labelledby",
    type === "direct"
      ? "direct-tab"
      : "groups-tab"
  );

  el("create-group-button").hidden =
    type !== "group";

  // User search from the old web version requires
  // a separate directory system.
  el("user-search-form").hidden = true;

  // Invitations are handled through secure links.
  el("group-invitations").hidden = true;

  renderRoomList();
}

function roomTitle(room) {
  if (room.type === "group") {
    return room.name || "Shared chat";
  }

  const other = room.memberIds?.find(
    id => id !== currentUser?.uid
  );

  return other
    ? room.memberNames?.[other] ||
        "SNAP member"
    : "Direct chat (invite pending)";
}

function renderRoomList() {
  roomList.replaceChildren();

  const visible = rooms
    .filter(
      room => room.type === selectedTab
    )
    .sort(
      (a, b) =>
        timeOf(b.updatedAt) -
        timeOf(a.updatedAt)
    );

  if (!visible.length) {
    const info = document.createElement("p");

    info.className = "list-empty";

    info.textContent =
      selectedTab === "group"
        ? "No shared chats yet. Create a group to get started."
        : "No direct chats yet. Use + New to create a direct-chat link.";

    roomList.append(info);
    return;
  }

  for (const room of visible) {
    const item = document.createElement(
      "button"
    );

    item.type = "button";
    item.className = "chat-item";

    item.classList.toggle(
      "active",
      room.id === currentRoom?.id
    );

    item.addEventListener(
      "click",
      () => void openRoom(room.id)
    );

    const avatar =
      document.createElement("span");

    avatar.className = "avatar";
    const otherUid = room.memberIds?.find(
      id => id !== currentUser?.uid
    );
    const otherProfile =
      room.memberProfiles?.[otherUid] || {};
    const otherPhotoURL =
      room.type === "direct"
        ? otherProfile.photoURL || room.avatarUrl
        : room.avatarUrl || otherProfile.photoURL;
    setAvatar(
      avatar,
      otherPhotoURL,
      roomTitle(room),
      room.type === "direct"
        ? [
            ...(otherProfile.photoURLs?.slice(1) || []),
            room.avatarUrl
          ]
        : otherProfile.photoURLs?.slice(1)
    );

    const meta =
      document.createElement("span");

    meta.className = "chat-meta";

    const title =
      document.createElement("strong");

    title.textContent = roomTitle(room);

    const sub =
      document.createElement("small");

    sub.textContent =
      `${room.memberIds?.length || 1} participant(s)`;

    meta.append(title, sub);

    item.append(avatar, meta);

    roomList.append(item);
  }
}

function startRoomDiscovery(user) {
  stopRooms?.();
  stopRooms = null;
  roomDiscoveryReady = false;
  rooms = [];
  roomListStatus.textContent = "Loading conversations…";
  roomListRetryButton.hidden = true;
  renderRoomList();

  try {
    stopRooms = watchRooms(
      db,
      user,
      newRooms => {
        rooms = newRooms.map(applyCurrentProfileAppearance);
        roomDiscoveryReady = true;
        roomListStatus.textContent =
          `${rooms.length} conversation${rooms.length === 1 ? "" : "s"}`;
        roomListRetryButton.hidden = true;
        renderRoomList();
        syncCurrentProfileAppearanceIfNeeded();

        const updatedCurrentRoom = rooms.find(
          room => room.id === currentRoom?.id
        );
        if (updatedCurrentRoom) {
          currentRoom = updatedCurrentRoom;
          renderHeader(updatedCurrentRoom);
          refreshVisibleMessageAuthors(updatedCurrentRoom);
        }
      },
      exception => {
        console.error("Conversation discovery failed:", {
          code: exception.code,
          message: exception.message,
          name: exception.name
        });
        roomListStatus.textContent =
          "Could not load conversations.";
        roomListRetryButton.hidden = false;
        error(
          `Conversation discovery failed: ${
            exception.message || "Unknown error"
          }${exception.code ? ` (${exception.code})` : ""}`
        );
      }
    );
  } catch (exception) {
    console.error("Could not start conversation discovery:", exception);
    roomListStatus.textContent = "Could not load conversations.";
    roomListRetryButton.hidden = false;
    error(
      `Could not start conversation discovery: ${
        exception.message || exception
      }`
    );
  }
}

function renderHeader(room) {
  room = applyCurrentProfileAppearance(room);
  const sameRoom = currentRoom?.id === room.id;
  const panelWasOpen =
    sameRoom && threadContent.classList.contains("info-panel-open");
  currentRoom = room;

  const name = roomTitle(room);
  const isGroup = room.type === "group";

  el("thread-title").textContent = name;

  el("thread-members").textContent =
    isGroup
      ? `${room.memberIds.length} participants`
      : "Private conversation";

  const otherUid = room.memberIds?.find(
    id => id !== currentUser?.uid
  );
  const otherProfile =
    room.memberProfiles?.[otherUid] || {};
  setAvatar(
    el("thread-avatar"),
    isGroup ? room.avatarUrl : otherProfile.photoURL,
    name,
    isGroup ? [] : otherProfile.photoURLs?.slice(1)
  );

  threadContent.classList.toggle(
    "has-participants",
    isGroup
  );
  threadParticipants.hidden = !isGroup;

  if (isGroup) {
    el("thread-group-name").textContent = name;
    el("thread-group-count").textContent =
      `${room.memberIds.length} people in this chat`;

    setAvatar(
      el("thread-group-avatar"),
      room.avatarUrl,
      name
    );

    renderParticipantList(room);
    setInfoPanelOpen(
      sameRoom
        ? panelWasOpen
        : !usesInfoDrawer(),
      { returnFocus: false }
    );
  } else {
    setInfoPanelOpen(false, { returnFocus: false });
  }

  messageInput.placeholder =
    `Message ${name}…`;

  // Link invitations are in Conversation Info.
  el("add-group-members-button").hidden =
    true;

  document.dispatchEvent(
    new CustomEvent("snap-chat-room-changed", {
      detail: {
        room
      }
    })
  );
}

function renderParticipantList(room) {
  const list = el("thread-participant-list");
  list.replaceChildren();

  for (const uid of room.memberIds || []) {
    const profile =
      room.memberProfiles?.[uid] || {};
    const name =
      profile.displayName ||
      room.memberNames?.[uid] ||
      "SNAP member";

    const row = document.createElement("div");
    row.className = "thread-participant";

    const avatar = document.createElement("span");
    avatar.className = "thread-participant-avatar";
    setAvatar(
      avatar,
      profile.photoURL,
      name,
      profile.photoURLs?.slice(1)
    );

    const details = document.createElement("span");
    details.className = "thread-participant-details";

    const label = document.createElement("strong");
    label.textContent =
      uid === currentUser?.uid
        ? `${name} (You)`
        : name;

    const role = document.createElement("small");
    role.textContent =
      room.memberRoles?.[uid] === "host" ||
      uid === room.ownerUid
        ? "Group admin"
        : "Member";

    details.append(label, role);
    row.append(avatar, details);
    list.append(row);
  }
}

function refreshVisibleMessageAuthors(room) {
  for (const row of messageStream.querySelectorAll(".message-row")) {
    const uid = row.dataset.senderUid;
    const profile = room.memberProfiles?.[uid] || {};
    const name =
      profile.displayName ||
      messages.find(message => message.id === row.dataset.messageId)
        ?.senderDisplayName ||
      "SNAP member";
    const avatar = row.querySelector(".message-author-avatar");
    if (avatar) {
      setAvatar(
        avatar,
        profile.photoURL,
        name,
        profile.photoURLs?.slice(1)
      );
    }

    const sender = row.querySelector(".message-sender");
    if (sender) sender.textContent = name;
  }
}

function usesInfoDrawer() {
  return chatWorkspace.getBoundingClientRect().width <= 940;
}

function setInfoPanelOpen(open, { focus = false, returnFocus = true } = {}) {
  const isOpen = Boolean(open && currentRoom?.type === "group");
  threadContent.classList.toggle("info-panel-open", isOpen);
  threadParticipants.setAttribute("aria-hidden", String(!isOpen));
  threadInfoBackdrop.hidden = !isOpen || !usesInfoDrawer();

  const toggle = el("thread-info-toggle");
  toggle?.setAttribute("aria-expanded", String(isOpen));
  document.dispatchEvent(
    new CustomEvent("snap-chat-info-panel-changed", {
      detail: { open: isOpen }
    })
  );

  if (focus && isOpen && usesInfoDrawer()) {
    infoPanelReturnFocus = true;
    el("thread-info-close").focus();
  } else if (!isOpen) {
    const shouldRestoreFocus = infoPanelReturnFocus && returnFocus;
    infoPanelReturnFocus = false;
    if (shouldRestoreFocus) toggle?.focus();
  }
}

document.addEventListener("snap-chat-toggle-info", () => {
  if (!currentRoom) return;
  if (currentRoom.type !== "group") {
    document.dispatchEvent(new CustomEvent("snap-chat-open-info"));
    return;
  }
  const opening = !threadContent.classList.contains("info-panel-open");
  setInfoPanelOpen(opening, { focus: opening });
});

el("thread-info-close").addEventListener("click", () =>
  setInfoPanelOpen(false)
);

threadInfoBackdrop.addEventListener("click", () =>
  setInfoPanelOpen(false)
);

el("thread-manage-info").addEventListener("click", () => {
  setInfoPanelOpen(false, { returnFocus: false });
  document.dispatchEvent(new CustomEvent("snap-chat-open-info"));
});

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    threadContent.classList.contains("info-panel-open") &&
    usesInfoDrawer()
  ) {
    setInfoPanelOpen(false);
  }
});

window.addEventListener("resize", () => {
  if (threadContent.classList.contains("info-panel-open")) {
    threadInfoBackdrop.hidden = !usesInfoDrawer();
  }
});

function renderMessages() {
  const wasAtBottom =
    messageStream.scrollHeight -
      messageStream.scrollTop -
      messageStream.clientHeight <
    80;
  const fragment = document.createDocumentFragment();
  const renderedAudioIds = new Set();

  const clearedAt = timeOf(
    currentRoom?.currentParticipant?.clearedAt
  );
  const visibleMessages = messages.filter(
    message =>
      !clearedAt ||
      timeOf(message.createdAt) > clearedAt
  );

  const visibleBumps = bumps.filter(
    bump =>
      !clearedAt ||
      timeOf(bump.bumpedAt) > clearedAt
  );
  const timeline = [
    ...visibleMessages.map(message => ({
      kind: "message",
      timestamp: timeOf(message.createdAt),
      value: message
    })),
    ...visibleBumps.map(bump => ({
      kind: "bump",
      timestamp: timeOf(bump.bumpedAt),
      value: bump
    })),
    ...(currentRoom?.type === "group"
      ? (currentRoom.membershipEvents || []).map(event => ({
          kind: "membership",
          timestamp: timeOf(event.at),
          value: event
        }))
      : [])
  ].sort((a, b) => a.timestamp - b.timestamp);

  if (!timeline.length) {
    const empty =
      document.createElement("p");

    empty.className =
      "thread-message-empty";

    empty.textContent =
      "No messages yet. Start the conversation.";

    messageStream.replaceChildren(empty);
    clearUnusedAudioPlayers(renderedAudioIds);
    return;
  }

  for (const entry of timeline) {
    if (entry.kind === "bump") {
      fragment.append(
        renderBump(entry.value, visibleMessages)
      );
      continue;
    }

    if (entry.kind === "membership") {
      fragment.append(renderMembershipEvent(entry.value));
      continue;
    }

    const message = entry.value;
    const mediaItems = attachments.filter(
      item =>
        item.messageId === message.id &&
        item.deletedAt == null
    );
    const documentAttachment =
      getDocumentAttachment(message, mediaItems);

    if (
      !attachmentsLoaded &&
      !message.body &&
      !message.attachmentUrl
    ) {
      continue;
    }

    const mine =
      message.senderUid === currentUser?.uid;

    const row =
      document.createElement("article");

    row.className =
      "message-row " +
      (mine ? "outgoing" : "incoming");
    row.id = `chat-message-${message.id}`;
    row.dataset.messageId = message.id;

    row.dataset.senderUid = message.senderUid || "";
    const profile =
      currentRoom?.memberProfiles?.[
        message.senderUid
      ] || {};
    const senderName =
      profile.displayName ||
      message.senderDisplayName ||
      "SNAP member";
    const author = document.createElement("div");
    author.className = "message-author";

    const avatar = document.createElement("span");
    avatar.className = "message-author-avatar";
    setAvatar(
      avatar,
      profile.photoURL,
      senderName,
      profile.photoURLs?.slice(1)
    );
    author.append(avatar);

    if (currentRoom?.type === "group") {
      const from =
        document.createElement("strong");
      from.className = "message-sender";
      from.textContent = senderName;
      author.append(from);
    }
    row.append(author);

    const bubble =
      document.createElement("div");

    bubble.className = "message-bubble";

    if (message.replyToMessageId) {
      const quote = document.createElement("button");
      quote.type = "button";
      quote.className = "message-reply-quote";
      const repliedMessage = messages.find(
        item => item.id === message.replyToMessageId
      );
      quote.textContent =
        `${repliedMessage?.senderDisplayName || "Replied message"}: ` +
        (repliedMessage?.body || "[Attachment or earlier message]");
      quote.title = "Jump to replied message";
      quote.addEventListener("click", () =>
        scrollToMessage(message.replyToMessageId)
      );
      bubble.append(quote);
    }

    if (message.body) {
      const body = document.createElement("span");
      body.className = "message-body";
      body.textContent = message.body;
      bubble.append(body);
    }

    let hasUnavailableAttachment = false;
    if (message.attachmentUrl) {
      if (
        message.attachmentKind !== "audio" &&
        !isHttpsUrl(message.attachmentUrl)
      ) {
        hasUnavailableAttachment = true;
      } else {
        appendMessageAttachment(bubble, {
          ...message,
          attachmentId: `legacy:${message.id}`
        }, renderedAudioIds);
      }
    }

    for (const media of mediaItems) {
      if (
        media.kind !== "audio" &&
        !isHttpsUrl(media.remoteUrl)
      ) {
        hasUnavailableAttachment = true;
        continue;
      }

      appendMessageAttachment(bubble, {
        attachmentId: media.id,
        attachmentKind: media.kind,
        attachmentUrl: media.remoteUrl,
        attachmentName: media.fileName || "Shared attachment",
        attachmentMimeType: media.mimeType || "",
        attachmentSize: media.sizeBytes || 0,
        storageProvider: media.storageProvider || ""
      }, renderedAudioIds);
    }

    if (hasUnavailableAttachment) {
      const unavailable = document.createElement("span");
      unavailable.className = "message-audio-status";
      unavailable.textContent =
        "An attachment link is unavailable or invalid.";
      bubble.append(unavailable);
    }

    if (
      !message.body &&
      !message.attachmentUrl &&
      !mediaItems.length
    ) {
      const unavailable = document.createElement("span");
      unavailable.className = "message-audio-status";
      unavailable.textContent = "Message attachment unavailable.";
      bubble.append(unavailable);
    }

    if (
      !message.body &&
      !message.replyToMessageId &&
      bubble.childElementCount === 1 &&
      bubble.firstElementChild?.classList.contains("voice-message-player")
    ) {
      bubble.classList.add("message-bubble-audio-only");
    }

    if (
      !message.body &&
      !message.replyToMessageId &&
      bubble.childElementCount === 1 &&
      bubble.querySelector(":scope > .message-attachment-link > .snap-message-image")
    ) {
      bubble.classList.add("message-bubble-image-only");
    }

    if (bubble.querySelector(".message-file")) {
      row.classList.add("message-row-has-file");
    }

    row.append(bubble);

    // Reactions are in a separate collection.
    const bar =
      document.createElement("div");

    bar.className =
      "snap-message-reactions";

    const counts = new Map();

    const messageReactions =
      reactions.filter(
        reaction =>
          reaction.messageId === message.id
      );

    for (const reaction of messageReactions) {
      counts.set(
        reaction.emoji,
        (counts.get(reaction.emoji) || 0) + 1
      );
    }

    for (const [emoji, count] of counts) {
      const button =
        document.createElement("button");

      button.type = "button";

      button.className = "snap-message-reaction";
      button.textContent =
        `${emoji} ${count}`;

      button.setAttribute(
        "aria-pressed",
        String(
          messageReactions.some(
            reaction =>
              reaction.userUid ===
                currentUser.uid &&
              reaction.emoji === emoji
          )
        )
      );

      button.addEventListener(
        "click",
        () => void react(
          message.id,
          emoji
        )
      );

      bar.append(button);
    }

    row.append(bar);

    const actions = document.createElement("div");
    actions.className = "message-hover-actions";
    actions.setAttribute("role", "toolbar");
    actions.setAttribute("aria-label", "Message actions");

    const reactButton = document.createElement("button");
    reactButton.type = "button";
    reactButton.className =
      "message-hover-action snap-message-reaction-add";
    reactButton.textContent = "☺";
    reactButton.title = "React";
    reactButton.setAttribute("aria-label", "React to message");
    reactButton.setAttribute("aria-haspopup", "true");
    reactButton.setAttribute("aria-expanded", "false");
    reactButton.addEventListener("click", () =>
      toggleReactionPicker(row, message.id, reactButton)
    );

    const replyButton = document.createElement("button");
    replyButton.type = "button";
    replyButton.className = "message-hover-action";
    replyButton.textContent = "↶";
    replyButton.title = "Reply";
    replyButton.setAttribute("aria-label", "Reply to message");
    replyButton.addEventListener("click", () => {
      setReplyingTo(message);
      messageInput.focus();
    });

    actions.append(reactButton, replyButton);

    const menuWrap = document.createElement("div");
    menuWrap.className = "message-menu-wrap";

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "message-hover-action message-menu-trigger";
    menuButton.textContent = "⋯";
    menuButton.title = "More message actions";
    menuButton.setAttribute("aria-label", "More message actions");
    menuButton.setAttribute("aria-haspopup", "menu");
    menuButton.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "message-action-menu";
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    const attachedVoice = mediaItems.find(
      item =>
        item.kind === "audio" &&
        isHttpsUrl(item.remoteUrl)
    );
    const voiceAttachment =
      message.attachmentKind === "audio" &&
      isHttpsUrl(message.attachmentUrl)
        ? {
            url: message.attachmentUrl,
            name: message.attachmentName || "",
            storageProvider: message.storageProvider || ""
          }
        : attachedVoice
          ? {
              url: attachedVoice.remoteUrl,
              name: attachedVoice.fileName || "",
              storageProvider: attachedVoice.storageProvider || ""
            }
          : null;
    const downloadAction = documentAttachment
      ? () => downloadFileAttachment(documentAttachment, message.id)
      : voiceAttachment
        ? () => downloadVoiceMessage(voiceAttachment, message.id)
        : () => copyMessage(message);

    const menuAction = (label, action, disabled = false) => {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "message-action-menu-item";
      option.setAttribute("role", "menuitem");
      option.textContent = label;
      option.disabled = disabled;
      option.addEventListener("click", async () => {
        menu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");
        await action();
      });
      return option;
    };

    menu.append(
      menuAction("Bump", () => bump(message)),
      menuAction(
        message.replyToMessageId
          ? "Edit reply"
          : "Edit message",
        () => startEditing(message),
        !mine || !canEditMessage(message)
      ),
      menuAction(
        "Delete message",
        () => deleteMessage(message),
        !mine
      ),
      menuAction(
        documentAttachment || voiceAttachment
          ? "Download"
          : "Copy",
        downloadAction
      )
    );

    menuButton.addEventListener("click", event => {
      event.stopPropagation();
      const opening = menu.hidden;
      closeMessageMenus();
      menu.hidden = !opening;
      menuButton.setAttribute("aria-expanded", String(opening));
    });

    menuWrap.append(menuButton, menu);
    actions.append(menuWrap);
    row.append(actions);

    const time =
      document.createElement("time");

    time.className = "message-time";

    time.textContent =
      timeOf(message.createdAt)
        ? new Date(
            timeOf(message.createdAt)
          ).toLocaleString()
        : "Sending…";
    if (message.editedAt) {
      time.textContent += " · edited";
    }

    row.append(time);

    fragment.append(row);
  }

  if (!fragment.childNodes.length && !attachmentsLoaded) {
    const pending = document.createElement("p");
    pending.className = "thread-message-empty";
    pending.textContent = "Loading message attachments…";
    fragment.append(pending);
  }

  clearUnusedAudioPlayers(renderedAudioIds);
  messageStream.replaceChildren(fragment);

  if (wasAtBottom) {
    messageStream.scrollTop =
      messageStream.scrollHeight;
  }
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function getDocumentAttachment(message, mediaItems) {
  const media = mediaItems.find(
    item => item.kind === "file" || item.kind === "document"
  );
  if (media) {
    return {
      url: media.remoteUrl || "",
      name: media.fileName || message.attachmentName || "",
      storageProvider: media.storageProvider || ""
    };
  }

  const kind = message.attachmentKind;
  if (
    kind === "file" ||
    kind === "document" ||
    (
      message.attachmentUrl &&
      kind !== "audio" &&
      kind !== "image"
    )
  ) {
    return {
      url: message.attachmentUrl || "",
      name: message.attachmentName || "",
      storageProvider: message.storageProvider || ""
    };
  }

  return null;
}

function clearUnusedAudioPlayers(renderedIds) {
  for (const [id, player] of audioPlayers) {
    if (!renderedIds.has(id)) {
      player.wrapper.remove();
      player.audio.pause();
      player.audio.removeAttribute("src");
      audioPlayers.delete(id);
    }
  }
}

function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const remainder = total % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function updateVoicePlayer(player) {
  const { audio, playButton, progress, elapsed, duration } = player;
  const hasDuration =
    Number.isFinite(audio.duration) && audio.duration > 0;
  const canPlay = Boolean(player.url && hasDuration && !audio.error);
  const ended = hasDuration && audio.ended;
  const isPlaying = !audio.paused && !ended;

  playButton.disabled = !canPlay;
  playButton.setAttribute(
    "aria-label",
    ended
      ? "Replay voice message"
      : isPlaying
        ? "Pause voice message"
        : "Play voice message"
  );
  playButton.title = playButton.getAttribute("aria-label");
  playButton.innerHTML = ended || !isPlaying
    ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 5.5v13l10-6.5-10-6.5Z"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 6v12m8-12v12"/></svg>';

  elapsed.textContent = formatAudioTime(audio.currentTime);
  duration.textContent = formatAudioTime(audio.duration);
  progress.max = hasDuration ? audio.duration : 1;
  progress.value = hasDuration ? audio.currentTime : 0;
  progress.disabled = !canPlay;
  progress.style.setProperty(
    "--voice-progress",
    hasDuration
      ? `${(audio.currentTime / audio.duration) * 100}%`
      : "0%"
  );
  progress.setAttribute(
    "aria-valuetext",
    `${formatAudioTime(audio.currentTime)} of ${formatAudioTime(audio.duration)}`
  );
}

function appendMessageAttachment(
  container,
  attachment,
  renderedAudioIds = new Set()
) {
  const url = attachment.attachmentUrl;
  const kind = attachment.attachmentKind || "file";
  const name = attachment.attachmentName || "Shared file";

  if (kind === "audio") {
    const id = String(
      attachment.attachmentId ||
      attachment.messageId ||
      `audio:${url || name}`
    );
    const playerId = `${currentRoom?.id || "closed"}:${id}`;
    renderedAudioIds.add(playerId);

    let player = audioPlayers.get(playerId);
    if (!player) {
      const wrapper = document.createElement("div");
      wrapper.className = "voice-message-player";

      const icon = document.createElement("span");
      icon.className = "voice-message-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML =
        '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"/><path d="M5.5 10.5a6.5 6.5 0 0 0 13 0M12 17v4m-3 0h6"/></svg>';

      const content = document.createElement("div");
      content.className = "voice-message-content";

      const label = document.createElement("span");
      label.className = "voice-message-label";
      label.textContent = "Voice message";

      const controls = document.createElement("div");
      controls.className = "voice-message-controls";

      const playButton = document.createElement("button");
      playButton.type = "button";
      playButton.className = "voice-message-play";
      playButton.setAttribute("aria-label", "Play voice message");

      const timeline = document.createElement("div");
      timeline.className = "voice-message-timeline";

      const times = document.createElement("div");
      times.className = "voice-message-times";

      const elapsed = document.createElement("span");
      elapsed.className = "voice-message-elapsed";
      elapsed.textContent = "0:00";

      const duration = document.createElement("span");
      duration.className = "voice-message-duration";
      duration.textContent = "0:00";

      const progress = document.createElement("input");
      progress.type = "range";
      progress.className = "voice-message-progress";
      progress.min = "0";
      progress.max = "1";
      progress.step = "0.1";
      progress.value = "0";
      progress.disabled = true;
      progress.setAttribute("aria-label", "Voice message playback position");

      times.append(elapsed, duration);
      timeline.append(times, progress);

      const status = document.createElement("span");
      status.className = "voice-message-status";
      status.setAttribute("role", "status");

      const audio = document.createElement("audio");
      audio.controls = false;
      audio.hidden = true;
      audio.preload = "metadata";
      audio.className = "message-audio";

      const fallback = document.createElement("a");
      fallback.className = "message-audio-download";
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.textContent = "Open or download audio";
      fallback.hidden = true;

      playButton.addEventListener("click", async () => {
        if (audio.ended) audio.currentTime = 0;
        if (!audio.paused) {
          audio.pause();
          return;
        }

        try {
          await audio.play();
          status.textContent = "";
        } catch (exception) {
          console.error("Could not play chat voice message:", {
            name: exception.name,
            message: exception.message
          });
          status.textContent =
            "Playback was blocked. Try again or open the recording.";
          fallback.hidden = false;
        }
      });

      progress.addEventListener("input", () => {
        if (Number.isFinite(audio.duration)) {
          audio.currentTime = Number(progress.value);
        }
      });

      for (const eventName of [
        "loadedmetadata",
        "durationchange",
        "timeupdate",
        "play",
        "pause",
        "ended",
        "seeked"
      ]) {
        audio.addEventListener(eventName, () => {
          updateVoicePlayer(player);
        });
      }

      audio.addEventListener("error", () => {
        status.textContent =
          "This recording could not be played in this browser.";
        fallback.hidden = false;
        updateVoicePlayer(player);
      });
      audio.addEventListener("loadedmetadata", () => {
        if (!player.status.textContent.includes("may not support")) {
          status.textContent = "";
        }
        fallback.hidden =
          !player.status.textContent.includes("may not support");
      });

      controls.append(playButton, timeline);
      content.append(label, controls, status, fallback, audio);
      wrapper.append(icon, content);
      player = {
        wrapper,
        audio,
        status,
        fallback,
        playButton,
        progress,
        elapsed,
        duration,
        url: ""
      };
      audioPlayers.set(playerId, player);
      updateVoicePlayer(player);
    }

    if (isHttpsUrl(url)) {
      player.fallback.href = url;
      player.fallback.download = name;

      if (player.url !== url) {
        player.audio.src = url;
        player.url = url;
        player.status.textContent = "";
        player.fallback.hidden = true;
        updateVoicePlayer(player);
      }

      const mimeType = attachment.attachmentMimeType || "";
      const unsupported =
        mimeType &&
        player.audio.canPlayType(mimeType) === "";
      player.status.textContent = unsupported
        ? `This browser may not support ${mimeType}.`
        : "";
      player.fallback.hidden = !unsupported;
    } else {
      player.audio.pause();
      player.audio.removeAttribute("src");
      player.url = "";
      player.status.textContent =
        "The recording link is missing or is not a secure HTTPS URL.";
      player.fallback.removeAttribute("href");
      player.fallback.hidden = true;
      updateVoicePlayer(player);
    }

    container.append(player.wrapper);
    return;
  }

  if (!isHttpsUrl(url)) return;

  if (kind === "image") {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "message-attachment-link";

    const image = document.createElement("img");
    image.src = url;
    image.alt = name;
    image.loading = "lazy";
    image.className = "snap-message-image";
    link.append(image);
    container.append(link);
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.download = name;
  link.className = "message-file";
  const isPublicFile =
    kind === "file" &&
    attachment.storageProvider === "cloudinary";
  const fileSize = formatFileSize(attachment.attachmentSize || 0);
  const extension = name.includes(".")
    ? name.split(".").pop().toUpperCase()
    : "";
  const iconLabel = [
    "PDF", "DOCX", "DOC", "PPTX", "PPT", "XLSX", "XLS", "TXT", "CSV"
  ].includes(extension)
    ? extension
    : "FILE";
  const icon = document.createElement("span");
  icon.className = "message-file-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = iconLabel;

  const details = document.createElement("span");
  details.className = "message-file-details";

  const fileName = document.createElement("strong");
  fileName.className = "message-file-name";
  fileName.textContent = name;

  const metadata = document.createElement("span");
  metadata.className = "message-file-size";
  metadata.textContent = fileSize;
  details.append(fileName, metadata);

  if (isPublicFile) {
    link.title =
      "Public link: anyone who has this URL can access the file.";
    link.classList.add("message-file-public");
    link.setAttribute(
      "aria-label",
      `Open public file ${name}, ${fileSize}. Anyone with the URL can access it.`
    );
    const publicLabel = document.createElement("span");
    publicLabel.className = "message-file-public-label";
    publicLabel.textContent = "Public link · anyone with the URL can access";
    details.append(publicLabel);
  } else {
    link.setAttribute("aria-label", `Open or download ${name}, ${fileSize}.`);
  }
  const action = document.createElement("span");
  action.className = "message-file-action";
  action.setAttribute("aria-hidden", "true");
  action.textContent = "Open ↗";

  link.append(icon, details, action);
  container.append(link);
}

function formatFileSize(size) {
  if (!Number.isFinite(size) || size <= 0) return "File";
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function canEditMessage(message) {
  const createdAt = timeOf(message.createdAt);
  return Boolean(
    message.senderUid === currentUser?.uid &&
    message.deletedAt == null &&
    message.body &&
    createdAt > 0 &&
    Date.now() >= createdAt &&
    Date.now() - createdAt <= 10 * 60 * 1000
  );
}

function startEditing(message) {
  if (!canEditMessage(message)) {
    error("Messages can only be edited by their sender within 10 minutes.");
    return;
  }

  replyingTo = null;
  editingMessage = message;
  replyPreview.hidden = false;
  replyPreviewSender.textContent = "Editing your message";
  replyPreviewBody.textContent = message.body;
  messageInput.value = message.body;
  sendButton.textContent = "Save";
  Object.values(attachmentButtons).forEach(button => {
    button.disabled = true;
  });
  messageInput.focus();
}

async function deleteMessage(message) {
  if (message.senderUid !== currentUser?.uid) {
    return;
  }

  if (typeof window.SNAPChatConfirm !== "function") {
    console.error("Chat confirmation dialog is unavailable.");
    error("Unable to open the confirmation dialog. Please reload and try again.");
    return;
  }

  if (!(await window.SNAPChatConfirm(
    "Delete this message?",
    "This will remove the message for everyone in the chat. This action cannot be undone.",
    { confirmLabel: "Delete message", danger: true }
  ))) {
    return;
  }

  try {
    await deleteChatMessage(
      db,
      currentRoom.id,
      message.id
    );

    if (message.attachmentPath) {
      try {
        await deleteObject(
          ref(storage, message.attachmentPath)
        );
      } catch (cleanupError) {
        console.error(
          "Deleted message attachment cleanup failed:",
          cleanupError
        );
        error("Message deleted, but its attachment could not be removed from storage.");
        return;
      }
    }

    error("");
  } catch (exception) {
    error(
      `Could not delete message: ${
        exception.code || exception.message
      }`
    );
  }
}

async function copyMessage(message) {
  const value =
    message.body ||
    message.attachmentUrl ||
    "";

  if (!value) {
    error("There is no message text or attachment link to copy.");
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    error("Copied to clipboard.");
  } catch (exception) {
    console.error("Could not copy message:", exception);
    error("Clipboard access failed. Allow clipboard permission and try again.");
  }
}

async function downloadFileAttachment(attachment, messageId) {
  const url = attachment.url;
  if (!isHttpsUrl(url)) {
    error("This document is unavailable for download because its link is missing or invalid.");
    return;
  }

  const downloadUrl = new URL(url);
  if (
    downloadUrl.hostname.endsWith(".cloudinary.com") &&
    downloadUrl.pathname.includes("/raw/upload/")
  ) {
    downloadUrl.pathname = downloadUrl.pathname.replace(
      "/raw/upload/",
      "/raw/upload/fl_attachment/"
    );
  }

  const urlName = downloadUrl.pathname.split("/").pop();
  const rawName =
    attachment.name ||
    urlName ||
    `attachment-${messageId}`;
  const filename =
    String(rawName)
      .split(/[\\/]/)
      .pop()
      .replace(/[\u0000-\u001f\u007f]/g, "")
      .trim() ||
    `attachment-${messageId}`;

  const link = document.createElement("a");
  link.href = downloadUrl.href;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.append(link);
  try {
    link.click();
  } finally {
    link.remove();
  }

  try {
    const response = await fetch(downloadUrl.href, {
      method: "HEAD",
      mode: "cors",
      credentials: "omit"
    });
    if (!response.ok) {
      const reason =
        response.status === 404 || response.status === 410
          ? "The file was not found or has expired."
          : response.status === 403
            ? "The file server denied access."
            : `The file server returned HTTP ${response.status}.`;
      throw new Error(reason);
    }

    const disposition =
      response.headers.get("content-disposition") || "";
    if (
      downloadUrl.origin !== window.location.origin &&
      !/attachment/i.test(disposition)
    ) {
      throw new Error("The file server did not provide an attachment download.");
    }

    error("");
  } catch (exception) {
    console.error("Could not download document attachment:", exception);
    const reason =
      exception instanceof Error
        ? exception.message
        : String(exception);
    error(
      `Could not verify the download of ${filename}: ${reason} The file may be missing, expired, or blocked.`
    );
  }
}

function downloadVoiceMessage(attachment, messageId) {
  const url = attachment.url;
  if (!isHttpsUrl(url)) {
    error("This voice message is unavailable for download.");
    return;
  }

  const downloadUrl = new URL(url);
  if (
    attachment.storageProvider === "cloudinary" &&
    downloadUrl.hostname.endsWith(".cloudinary.com")
  ) {
    downloadUrl.pathname = downloadUrl.pathname.replace(
      "/video/upload/",
      "/video/upload/fl_attachment/"
    );
  }

  const link = document.createElement("a");
  link.href = downloadUrl.href;
  link.download =
    attachment.name ||
    downloadUrl.pathname.split("/").pop() ||
    `voice-message-${messageId}`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  error("");
}

function closeMessageMenus() {
  document
    .querySelectorAll(".message-action-menu:not([hidden])")
    .forEach(menu => {
      menu.hidden = true;
      menu.parentElement
        ?.querySelector(".message-menu-trigger")
        ?.setAttribute("aria-expanded", "false");
    });
}

function attachmentPolicy(file, kind) {
  const imageTypes = [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif"
  ];
  const audioTypes = [
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/webm",
    "audio/aac",
    "audio/x-wav"
  ];
  const fileTypes = [
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/rtf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "text/rtf"
  ];
  const fileExtensions = new Map([
    ["pdf", ["application/pdf"]],
    ["txt", ["text/plain"]],
    ["csv", ["text/csv", "application/vnd.ms-excel", "text/plain"]],
    ["rtf", ["application/rtf", "text/rtf"]],
    ["doc", ["application/msword"]],
    ["docx", [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip"
    ]],
    ["xls", ["application/vnd.ms-excel"]],
    ["xlsx", [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/zip"
    ]],
    ["ppt", ["application/vnd.ms-powerpoint"]],
    ["pptx", [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "application/zip"
    ]],
    ["zip", ["application/zip", "application/x-zip-compressed"]]
  ]);
  if (kind === "file") {
    const extension =
      file.name.split(".").pop()?.toLowerCase() || "";
    const compatibleTypes = fileExtensions.get(extension);
    if (
      !compatibleTypes ||
      (
        file.type &&
        file.type !== "application/octet-stream" &&
        !compatibleTypes.includes(file.type)
      )
    ) {
      throw Error("This document type is not supported.");
    }
  }
  const accepted =
    kind === "image"
      ? imageTypes
      : kind === "audio"
        ? audioTypes
        : fileTypes;
  const maxBytes =
    kind === "image"
      ? 10 * 1024 * 1024
      : kind === "audio"
        ? 15 * 1024 * 1024
        : 20 * 1024 * 1024;

  const fileTypeIsUnknown =
    kind === "file" &&
    (!file.type || file.type === "application/octet-stream");
  if (!accepted.includes(file.type) && !fileTypeIsUnknown) {
    throw Error(`This ${kind} file type is not supported.`);
  }
  if (file.size < 1) {
    throw Error("This file is empty.");
  }
  if (file.size > maxBytes) {
    throw Error(`This file exceeds the ${formatFileSize(maxBytes)} limit.`);
  }
}

function clearAttachmentDraft() {
  if (attachmentDraft?.previewUrl) {
    URL.revokeObjectURL(attachmentDraft.previewUrl);
  }
  attachmentDraft = null;
  attachmentComposerPreview.hidden = true;
  attachmentPreviewImage.hidden = true;
  attachmentPreviewImage.removeAttribute("src");
  attachmentPreviewFileIcon.hidden = true;
  attachmentPreviewFileIcon.textContent = "";
  attachmentPreviewName.textContent = "";
  attachmentPreviewStatus.textContent = "";
  attachmentUploadProgress.hidden = true;
  attachmentUploadProgress.value = 0;
  attachmentPublicConsent.hidden = true;
  attachmentPublicConsentCheck.checked = false;
  attachmentPublicConsentCheck.disabled = false;
  attachmentPreviewSendButton.disabled = true;
  attachmentPreviewSendButton.textContent = "Send attachment";
  attachmentPreviewCancelButton.disabled = false;
  attachmentPreviewCancelButton.textContent = "Cancel";
}

function cancelAttachmentDraft({
  abort = false,
  discard = false
} = {}) {
  if (activeAttachmentUpload) {
    if (abort) activeAttachmentUpload.abort();
    if (!discard) return;
  }
  clearAttachmentDraft();
}

function confirmDiscardUploadedPublicDocument() {
  if (
    attachmentDraft?.kind !== "file" ||
    !attachmentDraft.cloudinaryUpload
  ) {
    return true;
  }
  return window.confirm(
    "This document has already been uploaded as a public Cloudinary file. Discarding the preview will not delete it; anyone with its URL can still access it. Continue?"
  );
}

function showAttachmentDraft(kind, file) {
  if (activeAttachmentUpload) return;
  if (!confirmDiscardUploadedPublicDocument()) return;

  try {
    attachmentPolicy(file, kind);
  } catch (exception) {
    error(exception.message);
    return;
  }

  clearAttachmentDraft();
  const previewUrl =
    kind === "image" ? URL.createObjectURL(file) : "";
  attachmentDraft = {
    kind,
    file,
    previewUrl,
    id: crypto.randomUUID(),
    messageId: crypto.randomUUID(),
    cloudinaryPublicId:
      kind === "file"
        ? `${crypto.randomUUID()}.${file.name.split(".").pop().toLowerCase()}`
        : null,
    cloudinaryUpload: null
  };
  attachmentComposerPreview.hidden = false;
  attachmentPreviewName.textContent =
    `${file.name} · ${formatFileSize(file.size)}`;
  attachmentPreviewImage.hidden = kind !== "image";
  attachmentPreviewFileIcon.hidden = kind !== "file";
  if (kind === "image") {
    attachmentPreviewImage.src = previewUrl;
  } else if (kind === "file") {
    attachmentPreviewFileIcon.textContent =
      file.name.split(".").pop()?.toUpperCase().slice(0, 4) || "FILE";
  }
  attachmentUploadProgress.hidden = true;

  if (kind === "file") {
    const config = window.SNAP_CLOUDINARY_CONFIG || {};
    const cloudinaryConfigured =
      Boolean(String(config.cloudName || "").trim()) &&
      Boolean(String(config.uploadPreset || "").trim());
    attachmentPublicConsent.hidden = false;
    attachmentPublicConsentCheck.checked = false;
    attachmentPublicConsentCheck.disabled = false;
    attachmentPreviewStatus.textContent = cloudinaryConfigured
      ? "Public link only. Anyone with the URL can access this file; this unsigned preset has not been verified for raw files."
      : "Unavailable: Cloudinary upload is not configured.";
    attachmentPreviewSendButton.textContent =
      cloudinaryConfigured ? "Upload public file" : "Unavailable";
    attachmentPreviewSendButton.disabled =
      !cloudinaryConfigured ||
      !currentRoom ||
      sending ||
      !attachmentPublicConsentCheck.checked;
    error("");
    return;
  }

  attachmentPreviewStatus.textContent = "Ready to preview and send.";
  attachmentPreviewSendButton.textContent = "Send image";
  attachmentPreviewSendButton.disabled = !currentRoom || sending;
  attachmentPreviewCancelButton.disabled = false;
  error("");
}

async function sendAttachment(kind, file) {
  if (!file || !currentRoom || !currentUser || sending) return;
  if (
    ["image", "file"].includes(kind) &&
    (
      attachmentDraft?.kind !== kind ||
      attachmentDraft.file !== file
    )
  ) {
    error(
      kind === "file"
        ? "Choose a document and preview it before sending."
        : "Choose an image and preview it before sending."
    );
    return;
  }
  if (
    kind === "file" &&
    !attachmentPublicConsentCheck.checked
  ) {
    error(
      "Confirm that this file is non-sensitive and may be accessed by anyone with its public link before uploading."
    );
    return;
  }

  const roomId = currentRoom.id;
  const user = currentUser;
  const body = messageInput.value;
  const replyTo = replyingTo;

  try {
    attachmentPolicy(file, kind);
  } catch (exception) {
    error(exception.message);
    return;
  }

  sending = true;
  sendButton.disabled = true;
  Object.values(attachmentButtons).forEach(button => {
    button.disabled = true;
  });
  if (
    kind === "audio" &&
    audioPreview?.roomId === roomId
  ) {
    audioPreviewStatus.textContent = "Uploading voice message…";
    audioPreviewProgress.hidden = false;
    audioPreviewProgress.removeAttribute("value");
    audioPreviewSendButton.disabled = true;
    audioPreviewSendButton.textContent = "Uploading…";
    audioPreviewCancelButton.disabled = false;
    audioPreviewCancelButton.textContent = "Cancel upload";
  }
  if (kind === "image" || kind === "file") {
    attachmentPreviewSendButton.disabled = true;
    attachmentPreviewSendButton.textContent = "Uploading…";
    attachmentPreviewCancelButton.textContent = "Cancel upload";
    attachmentPublicConsentCheck.disabled = kind === "file";
    attachmentUploadProgress.hidden = false;
    attachmentUploadProgress.removeAttribute("value");
    attachmentPreviewStatus.textContent =
      kind === "file"
        ? "Uploading public document to Cloudinary…"
        : "Uploading image…";
  }

  if (
    kind === "audio" &&
    audioPreview?.file === file &&
    !audioPreview.attachmentId
  ) {
    audioPreview.attachmentId = crypto.randomUUID();
  }

  let sendStage = `uploading the ${kind}`;
  const sendStartedAt = Date.now();

  try {
    let attachment;
    if (kind === "audio") {
      const config = window.SNAP_CLOUDINARY_CONFIG || {};
      const cloudName = String(config.cloudName || "").trim();
      const uploadPreset = String(config.uploadPreset || "").trim();
      if (!cloudName || !uploadPreset) {
        throw Error(
          "Cloudinary is not configured for SNAP Web. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET on the web server."
        );
      }

      const cachedUpload =
        audioPreview?.file === file
          ? audioPreview.cloudinaryUpload
          : null;
      const attachmentId =
        audioPreview?.file === file
          ? audioPreview.attachmentId
          : crypto.randomUUID();
      let upload = cachedUpload;
      if (!upload) {
        sendStage = "uploading the audio to Cloudinary";
        if (audioPreview?.roomId === roomId) {
          audioPreviewStatus.textContent = "Uploading voice message…";
        }
        upload = await uploadCloudinaryAsset({
          file,
          cloudName,
          uploadPreset,
          resourceType: "video",
          publicId: attachmentId,
          onRequest: xhr => {
            activeAudioUpload = xhr;
          },
          onProgress: (loaded, total) => {
            if (audioPreview?.roomId !== roomId) return;
            if (total > 0) {
              const percent = (loaded / total) * 100;
              audioPreviewProgress.value = percent;
              audioPreviewStatus.textContent =
                `Uploading voice message · ${Math.round(percent)}%`;
            } else {
              audioPreviewProgress.removeAttribute("value");
              audioPreviewStatus.textContent =
                "Uploading voice message…";
            }
          }
        });
        activeAudioUpload = null;
        if (audioPreview?.file === file) {
          audioPreview.cloudinaryUpload = upload;
        }
      }

      attachment = {
        id: attachmentId,
        kind,
        url: upload.secureUrl,
        path: upload.publicId,
        name: file.name.slice(0, 255),
        storageProvider: "cloudinary",
        storageEnvironmentId: cloudName,
        mimeType: file.type || "application/octet-stream",
        size: upload.bytes || file.size,
        metadataJson:
          audioPreview?.file === file &&
          Number.isFinite(audioPreview.durationSeconds)
            ? JSON.stringify({
                durationMs: Math.round(
                  audioPreview.durationSeconds * 1000
                )
              })
            : null,
        schemaVersion: 2
      };
    } else {
      const config = window.SNAP_CLOUDINARY_CONFIG || {};
      const cloudName = String(config.cloudName || "").trim();
      const uploadPreset = String(config.uploadPreset || "").trim();
      if (!cloudName || !uploadPreset) {
        throw Error(
          "Cloudinary is not configured for SNAP Web. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET on the web server."
        );
      }

      const isPublicDocument = kind === "file";
      sendStage = isPublicDocument
        ? "uploading the public document to Cloudinary"
        : "uploading the image to Cloudinary";
      const attachmentId =
        attachmentDraft?.file === file
          ? attachmentDraft.id
          : crypto.randomUUID();
      const cloudinaryPublicId =
        isPublicDocument && attachmentDraft?.file === file
          ? attachmentDraft.cloudinaryPublicId
          : attachmentId;
      let upload =
        attachmentDraft?.file === file
          ? attachmentDraft.cloudinaryUpload
          : null;
      if (!upload) {
        upload = await uploadCloudinaryAsset({
          file,
          cloudName,
          uploadPreset,
          resourceType: isPublicDocument ? "raw" : "image",
          publicId: cloudinaryPublicId,
          onRequest: xhr => {
            activeAttachmentUpload = xhr;
            return attachmentDraft?.file === file;
          },
          onProgress: (loaded, total) => {
            if (attachmentDraft?.file !== file) return;
            if (total > 0) {
              const percent = Math.round(loaded / total * 100);
              attachmentUploadProgress.value = percent;
              attachmentPreviewStatus.textContent =
                isPublicDocument
                  ? `Uploading public document · ${percent}%`
                  : `Uploading image · ${percent}%`;
            } else {
              attachmentUploadProgress.removeAttribute("value");
              attachmentPreviewStatus.textContent = isPublicDocument
                ? "Uploading public document…"
                : "Uploading image…";
            }
          }
        });
        activeAttachmentUpload = null;
        if (attachmentDraft?.file === file) {
          attachmentDraft.cloudinaryUpload = upload;
        }
      }
      attachment = {
        id: attachmentId,
        messageId:
          attachmentDraft?.file === file
            ? attachmentDraft.messageId
            : undefined,
        kind,
        url: upload.secureUrl,
        path: upload.publicId,
        name: file.name.slice(0, 255),
        storageProvider: "cloudinary",
        storageEnvironmentId: cloudName,
        mimeType: file.type || "application/octet-stream",
        size: upload.bytes
      };
    }

    sendStage = "saving the message";
    if (
      ["image", "file"].includes(kind) &&
      attachmentDraft?.file === file
    ) {
      attachmentPreviewStatus.textContent =
        kind === "file"
          ? "Saving public document message…"
          : "Saving image message…";
      attachmentPreviewSendButton.textContent = "Saving…";
      attachmentPreviewCancelButton.disabled = true;
      attachmentPreviewCancelButton.textContent = "Saving…";
      attachmentPublicConsentCheck.disabled = kind === "file";
      attachmentUploadProgress.hidden = true;
    }
    if (kind === "audio" && audioPreview?.roomId === roomId) {
      audioPreviewStatus.textContent = "Finishing voice message…";
      audioPreviewCancelButton.disabled = true;
      audioPreviewCancelButton.textContent = "Finishing…";
    }
    await sendText(
      db,
      user,
      roomId,
      body,
      replyTo,
      attachment
    );

    if (
      currentRoom?.id === roomId &&
      messageInput.value === body
    ) {
      messageInput.value = "";
      if (replyingTo === replyTo) setReplyingTo(null);
    }
    if (kind === "audio" && audioPreview?.roomId === roomId) {
      clearAudioPreview();
    }
    if (
      ["image", "file"].includes(kind) &&
      attachmentDraft?.file === file
    ) {
      clearAttachmentDraft();
    }
    error("");
  } catch (exception) {
    console.error("Chat attachment send failed:", {
      kind,
      stage: sendStage,
      elapsedMs: Date.now() - sendStartedAt,
      fileSize: file.size,
      code: exception.code,
      message: exception.message,
      name: exception.name
    });
    if (
      kind === "audio" &&
      audioPreview?.roomId === roomId
    ) {
      audioPreviewStatus.textContent =
        exception.name === "AbortError"
          ? "Upload canceled. Your recording is ready to retry or discard."
          : "Upload failed. Your recording is ready to retry or discard.";
      audioPreviewSendButton.textContent = "Retry send";
      audioPreviewSendButton.disabled = false;
      audioPreviewCancelButton.disabled = false;
      audioPreviewCancelButton.textContent = "Discard";
      audioPreviewProgress.hidden = true;
    }
    if (
      ["image", "file"].includes(kind) &&
      attachmentDraft?.file === file
    ) {
      if (attachment) {
        attachmentDraft.id = attachment.id;
        attachmentDraft.messageId = attachment.messageId;
      }
      attachmentPreviewStatus.textContent =
        exception.name === "AbortError"
          ? kind === "file"
            ? "Upload canceled. The preview is kept; if upload completed, the public file may remain on Cloudinary."
            : "Upload canceled. Your image is kept for retry."
          : sendStage === "saving the message"
            ? kind === "file"
              ? "Public file uploaded; chat save failed. Retry to reuse the upload. The file remains accessible to anyone with its URL."
              : "Image uploaded; message save failed. Retry send to reuse it."
            : kind === "file"
              ? `Cloudinary raw upload failed: ${exception.message || exception.code || "Unknown error"}`
              : "Upload failed. Your image is kept for retry.";
      attachmentPreviewSendButton.textContent =
        sendStage === "saving the message"
          ? kind === "file"
            ? "Retry public send"
            : "Retry send"
          : kind === "file"
            ? "Retry public upload"
            : "Retry upload";
      attachmentPreviewSendButton.disabled = false;
      attachmentPreviewCancelButton.disabled = false;
      attachmentPreviewCancelButton.textContent = "Discard";
      attachmentUploadProgress.hidden = true;
      attachmentPublicConsentCheck.disabled = false;
    }
    if (
      exception.name !== "AbortError" ||
      currentRoom?.id === roomId
    ) {
      error(
        exception.name === "AbortError"
          ? kind === "audio"
            ? "Voice upload canceled. Your recording is still available to retry."
            : kind === "file"
              ? "Public document upload canceled. The preview is still available to retry."
              : "Image upload canceled. Your selected image is still available to retry."
          : exception.code === "permission-denied"
            ? kind === "file" && sendStage === "saving the message"
              ? `The public file uploaded, but Firestore denied saving its chat metadata (${exception.code}). The file remains public on Cloudinary; retry after resolving the permission issue.`
              : "Firestore rejected the attachment message. Check room membership and the message or reply data."
            : sendStage === "saving the message"
              ? `${kind === "file" ? "The public document" : `The ${kind}`} uploaded, but its chat metadata could not be saved. Retry from the preview to reuse the uploaded media: ${
                  exception.code || exception.message
                }`
              : `Could not finish ${kind} while ${sendStage}: ${
                  exception.code || exception.message
                }`
      );
    }
  } finally {
    sending = false;
    sendButton.disabled = !currentRoom;
    Object.values(attachmentButtons).forEach(button => {
      button.disabled =
        !currentRoom ||
        (button === attachmentButtons.audio &&
          (Boolean(audioPreview) || audioStarting));
    });
    audioPreviewSendButton.disabled =
      !audioPreview || sending;
    if (audioPreview && kind === "audio") {
      audioPreviewCancelButton.textContent = "Discard";
    }
    if (kind === "audio") activeAudioUpload = null;
    if (kind === "image" || kind === "file") {
      activeAttachmentUpload = null;
      if (kind === "file" && attachmentDraft?.file === file) {
        attachmentPublicConsentCheck.disabled = false;
        const config = window.SNAP_CLOUDINARY_CONFIG || {};
        const cloudinaryConfigured =
          Boolean(String(config.cloudName || "").trim()) &&
          Boolean(String(config.uploadPreset || "").trim());
        attachmentPreviewSendButton.disabled =
          !cloudinaryConfigured ||
          !attachmentPublicConsentCheck.checked ||
          !currentRoom;
      }
    }
    attachmentInputs[kind].value = "";
  }
}

function updateAudioRecordingUI(recording) {
  const button = attachmentButtons.audio;
  button.classList.toggle("is-recording", recording);
  button.setAttribute("aria-pressed", String(recording));
  button.setAttribute(
    "aria-label",
    recording ? "Stop recording voice message" : "Record a voice message"
  );
  button.title = recording
    ? "Stop recording voice message"
    : "Record a voice message";
  el("audio-recording-status").textContent = recording
    ? "Recording voice message. Select the microphone to stop, or cancel."
    : "";
}

function stopAudioStream() {
  audioStream?.getTracks().forEach(track => track.stop());
  audioStream = null;
}

function formatAudioDuration(seconds) {
  const elapsed = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(elapsed / 60);
  const remainder = elapsed % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function clearAudioPreview() {
  if (audioRecordingDurationTimer) {
    clearInterval(audioRecordingDurationTimer);
    audioRecordingDurationTimer = null;
  }

  audioPreviewPlayer.pause();
  audioPreviewPlayer.removeAttribute("src");
  audioPreviewPlayer.load();
  audioPreviewPlayer.hidden = true;

  if (audioPreview?.url) {
    URL.revokeObjectURL(audioPreview.url);
  }

  audioPreview = null;
  audioComposerPreview.hidden = true;
  audioPreviewProgress.hidden = true;
  audioPreviewProgress.value = 0;
  audioPreviewStatus.textContent = "";
  audioPreviewSendButton.disabled = true;
  audioPreviewSendButton.textContent = "Send voice";
  audioPreviewCancelButton.disabled = false;
  audioPreviewCancelButton.textContent = "Cancel";
}

function cancelAudioCapture() {
  if (activeAudioUpload) {
    activeAudioUpload.abort();
    return;
  }

  discardAudioRecording = true;
  const recorder = audioRecorder;
  if (recorder?.state === "recording") {
    try {
      recorder.stop();
    } catch (exception) {
      console.error("Could not stop the cancelled voice recording:", exception);
    }
  }
  audioRecorder = null;
  audioChunks = [];
  stopAudioStream();
  clearAudioPreview();
  updateAudioRecordingUI(false);
  attachmentButtons.audio.disabled = !currentRoom || audioStarting;
}

function showAudioPreview(file, roomId, durationSeconds) {
  clearAudioPreview();
  const url = URL.createObjectURL(file);
  audioPreview = {
    file,
    roomId,
    url,
    durationSeconds,
    attachmentId: crypto.randomUUID(),
    cloudinaryUpload: null
  };
  audioComposerPreview.hidden = false;
  audioPreviewPlayer.src = url;
  audioPreviewPlayer.hidden = false;
  audioPreviewStatus.textContent =
    `Ready to preview · ${formatAudioDuration(durationSeconds)} · ${formatFileSize(file.size)}`;
  audioPreviewProgress.hidden = true;
  audioPreviewProgress.value = 0;
  audioPreviewCancelButton.disabled = false;
  audioPreviewSendButton.textContent = "Send voice";
  audioPreviewSendButton.disabled = false;
  attachmentButtons.audio.disabled = true;
}

async function toggleAudioRecording() {
  if (audioRecorder?.state === "recording") {
    audioRecorder.stop();
    return;
  }

  if (audioStarting || sending || !currentRoom || !currentUser) return;

  if (
    !navigator.mediaDevices?.getUserMedia ||
    typeof window.MediaRecorder !== "function"
  ) {
    error("Voice recording is unavailable here. Choose an audio file instead.");
    attachmentInputs.audio.click();
    return;
  }

  audioStarting = true;
  const roomId = currentRoom.id;
  attachmentButtons.audio.disabled = true;

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (currentRoom?.id !== roomId) {
      stopAudioStream();
      return;
    }

    const formats = [
      { recorder: "audio/mp4", mime: "audio/mp4", ext: "m4a" },
      { recorder: "audio/ogg;codecs=opus", mime: "audio/ogg", ext: "ogg" },
      { recorder: "audio/webm;codecs=opus", mime: "audio/webm", ext: "webm" },
      { recorder: "audio/webm", mime: "audio/webm", ext: "webm" },
      { recorder: "audio/ogg", mime: "audio/ogg", ext: "ogg" }
    ];
    const format = formats.find(item =>
      MediaRecorder.isTypeSupported(item.recorder)
    );

    if (!format) {
      stopAudioStream();
      error("This browser does not support a chat-compatible voice recording format.");
      return;
    }

    const recorder = new MediaRecorder(audioStream, {
      mimeType: format.recorder,
      audioBitsPerSecond: 32000
    });
    audioRecorder = recorder;
    audioChunks = [];
    discardAudioRecording = false;

    recorder.addEventListener("dataavailable", event => {
      if (event.data.size) audioChunks.push(event.data);
    });

    recorder.addEventListener("error", event => {
      console.error("Voice recording failed:", event.error);
      audioRecorder = null;
      discardAudioRecording = true;
      audioChunks = [];
      stopAudioStream();
      if (audioRecordingDurationTimer) {
        clearInterval(audioRecordingDurationTimer);
        audioRecordingDurationTimer = null;
      }
      audioComposerPreview.hidden = true;
      updateAudioRecordingUI(false);
      attachmentButtons.audio.disabled = !currentRoom;
      error("Voice recording failed. Check microphone permission and try again.");
    }, { once: true });

    recorder.addEventListener("stop", () => {
      if (audioRecorder !== recorder) return;

      const blob = new Blob(audioChunks, { type: format.mime });
      audioChunks = [];
      audioRecorder = null;
      stopAudioStream();
      if (audioRecordingDurationTimer) {
        clearInterval(audioRecordingDurationTimer);
        audioRecordingDurationTimer = null;
      }
      updateAudioRecordingUI(false);

      if (discardAudioRecording) {
        discardAudioRecording = false;
        return;
      }

      const durationSeconds =
        (Date.now() - audioRecordingStartedAt) / 1000;
      if (!blob.size || durationSeconds < 0.3) {
        error("No audio was recorded. Try recording again.");
        attachmentButtons.audio.disabled = !currentRoom;
        audioComposerPreview.hidden = true;
        return;
      }

      const file = new File(
        [blob],
        `voice-clip-${Date.now()}.${format.ext}`,
        { type: format.mime }
      );
      showAudioPreview(file, roomId, durationSeconds);
    }, { once: true });

    recorder.start();
    audioRecordingStartedAt = Date.now();
    audioComposerPreview.hidden = false;
    audioPreviewPlayer.hidden = true;
    audioPreviewSendButton.disabled = false;
    audioPreviewSendButton.textContent = "Stop recording";
    audioPreviewCancelButton.disabled = false;
    audioPreviewProgress.hidden = true;
    updateAudioRecordingUI(true);
    audioPreviewStatus.textContent = "Recording · 00:00";
    audioRecordingDurationTimer = setInterval(() => {
      audioPreviewStatus.textContent =
        `Recording · ${formatAudioDuration(
          (Date.now() - audioRecordingStartedAt) / 1000
        )}`;
    }, 250);
    error("");
  } catch (exception) {
    stopAudioStream();
    audioComposerPreview.hidden = true;
    console.error("Could not start voice recording:", {
      name: exception.name,
      message: exception.message
    });
    error(
      exception.name === "NotAllowedError" || exception.name === "PermissionDeniedError"
        ? "Microphone access was denied. Allow microphone access to record a voice clip."
        : `Could not start recording: ${exception.message || exception.name}`
    );
  } finally {
    audioStarting = false;
    attachmentButtons.audio.disabled =
      !currentRoom ||
      Boolean(audioPreview) ||
      audioRecorder?.state === "recording";
  }
}

function renderBump(bumpRecord, visibleMessages) {
  const row = document.createElement("article");
  row.className =
    "message-bump " +
    (bumpRecord.bumpedByUid === currentUser?.uid
      ? "outgoing"
      : "incoming");
  row.dataset.messageId = bumpRecord.messageId;

  const label = document.createElement("span");
  label.className = "message-bump-label";
  label.textContent =
    `${bumpRecord.bumpedByDisplayName || "A member"} bumped a message`;

  const quote = document.createElement("button");
  quote.type = "button";
  quote.className = "message-bump-quote";
  quote.textContent =
    `${bumpRecord.messageSenderDisplayName || "SNAP member"}: ` +
    (bumpRecord.messageBody || "[Attachment]");
  quote.title = "Jump to original message";
  quote.addEventListener("click", () =>
    scrollToMessage(bumpRecord.messageId)
  );

  if (
    !visibleMessages.some(
      message => message.id === bumpRecord.messageId
    )
  ) {
    quote.disabled = true;
    quote.title = "The original message is no longer available";
  }

  row.append(label, quote);
  return row;
}

function renderMembershipEvent(event) {
  const row = document.createElement("div");
  row.className = "message-system-event";
  row.dataset.eventType = event.type;
  row.setAttribute("role", "status");

  const label = document.createElement("span");
  label.textContent =
    `${event.displayName} ${event.type === "joined" ? "joined" : "left"} the group`;
  row.append(label);

  if (timeOf(event.at)) {
    const time = document.createElement("time");
    const date = new Date(timeOf(event.at));
    time.dateTime = date.toISOString();
    time.textContent = date.toLocaleString();
    row.append(time);
  }

  return row;
}

function scrollToMessage(messageId) {
  const target = document.getElementById(
    `chat-message-${messageId}`
  );

  if (!target) {
    error("That message is not currently loaded.");
    return;
  }

  target.scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
  target.classList.add("message-highlight");
  window.setTimeout(
    () => target.classList.remove("message-highlight"),
    1400
  );
}

function setReplyingTo(message) {
  replyingTo = message;
  editingMessage = null;
  sendButton.textContent = "Send";
  Object.values(attachmentButtons).forEach(button => {
    button.disabled = !currentRoom;
  });
  replyPreview.hidden = !message;

  if (!message) return;

  replyPreviewSender.textContent =
    `Replying to ${message.senderDisplayName || "SNAP member"}`;
  replyPreviewBody.textContent =
    message.body ||
    (message.attachmentKind === "image"
      ? "[Image]"
      : message.attachmentKind === "audio"
        ? "[Audio]"
        : "[Attachment]");
}

function toggleReactionPicker(row, messageId, trigger) {
  const existing =
    row.querySelector(".snap-reaction-picker");

  if (existing) {
    existing.remove();
    trigger.setAttribute("aria-expanded", "false");
    return;
  }

  closeReactionPickers();

  const picker = document.createElement("div");
  picker.className = "snap-reaction-picker";
  picker.setAttribute("role", "group");
  picker.setAttribute("aria-label", "Choose a reaction");

  for (const emoji of [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "🙏"
  ]) {
    const option = document.createElement("button");
    option.type = "button";
    option.textContent = emoji;
    option.setAttribute("aria-label", `React with ${emoji}`);
    option.addEventListener("click", () => {
      picker.remove();
      trigger.setAttribute("aria-expanded", "false");
      void react(messageId, emoji);
    });
    picker.append(option);
  }

  row.append(picker);
  trigger.setAttribute("aria-expanded", "true");
}

function closeReactionPickers() {
  document
    .querySelectorAll(".snap-reaction-picker")
    .forEach(picker => picker.remove());

  document
    .querySelectorAll(
      '.snap-message-reaction-add[aria-expanded="true"]'
    )
    .forEach(button =>
      button.setAttribute("aria-expanded", "false")
    );
}

document.addEventListener("click", event => {
  if (
    event.target instanceof Element &&
    (
      event.target.closest(".snap-reaction-picker") ||
      event.target.closest(".snap-message-reaction-add")
    )
  ) {
    return;
  }

  closeReactionPickers();

  if (
    !(event.target instanceof Element) ||
    !event.target.closest(".message-menu-wrap")
  ) {
    closeMessageMenus();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeReactionPickers();
    closeMessageMenus();
  }
});

async function react(messageId, emoji) {
  try {
    await toggleReaction(
      db,
      currentUser,
      currentRoom.id,
      messageId,
      emoji
    );
  } catch (exception) {
    error(
      `Reaction failed: ${
        exception.code || exception.message
      }`
    );
  }
}

async function openRoom(id) {
  if (!currentUser) return;

  try {
    const room =
      rooms.find(item => item.id === id) ||
      await readRoom(db, id, currentUser.uid);

    if (
      !room ||
      !room.memberIds.includes(
        currentUser.uid
      )
    ) {
      throw Error(
        "You are not a room member."
      );
    }

    const roomTab =
      room.type === "group"
        ? "group"
        : "direct";

    if (selectedTab !== roomTab) {
      selectTab(roomTab);
    }

    closeListeners();
    messages = [];
    bumps = [];
    reactions = [];
    attachments = [];

    renderHeader(room);
    renderRoomList();

    el("thread-empty").hidden = true;
    el("thread-content").hidden = false;

    el("chat-workspace").classList.add(
      "thread-open"
    );

    messageInput.disabled = false;
    sendButton.disabled = false;
    Object.values(attachmentButtons).forEach(button => {
      button.disabled = false;
    });

    messageStream.replaceChildren();

    error("");

    const roomDoc = doc(
      db,
      "chatRooms",
      id
    );

    stopRoom = onSnapshot(
      roomDoc,

      async snapshot => {
        try {
          const updated =
            await roomFromSnapshot(
              db,
              snapshot,
              currentUser.uid
            );

          if (
            !updated ||
            !updated.memberIds.includes(
              currentUser.uid
            )
          ) {
            emptyThread();

            error(
              "You no longer have access to this chat."
            );

            return;
          }

          renderHeader(updated);
        } catch (exception) {
          error(
            `Room update failed: ${
              exception.code ||
              exception.message
            }`
          );
        }
      },

      exception => {
        error(
          `Room listener: ${
            exception.code ||
            exception.message
          }`
        );
      }
    );

    stopMessages = onSnapshot(
      query(
        collection(
          db,
          "chatRooms",
          id,
          "messages"
        ),
        orderBy("createdAt", "desc"),
        limit(100)
      ),

      snapshot => {
        const allMessages = snapshot.docs.map(item => ({
            id: item.id,
            ...item.data()
          }));

        messages = allMessages
          .filter(message =>
            message.deletedAt == null &&
            [1, 2].includes(message.schemaVersion)
          )
          .reverse();

        bumps = allMessages
          .filter(message =>
            message.schemaVersion === 3 &&
            message.kind === "bump" &&
            message.deletedAt == null
          )
          .map(message => {
            const target = allMessages.find(
              item => item.id === message.bumpTargetMessageId
            );
            return {
              id: message.id,
              messageId: message.bumpTargetMessageId,
              bumpedAt: message.createdAt,
              bumpedByUid: message.senderUid,
              bumpedByDisplayName: message.senderDisplayName,
              messageSenderDisplayName:
                target?.senderDisplayName || "SNAP member",
              messageBody: target?.body || "",
              schemaVersion: 1
            };
          })
          .reverse();

        renderMessages();
      },

      exception => {
        error(
          `Messages: ${
            exception.code ||
            exception.message
          }`
        );
      }
    );

    stopReactions = onSnapshot(
      collection(
        db,
        "chatRooms",
        id,
        "reactions"
      ),

      snapshot => {
        reactions = snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );

        renderMessages();
      },

      exception => {
        console.warn(
          "Reactions unavailable:",
          exception
        );
      }
    );

    stopAttachments = onSnapshot(
      collection(
        db,
        "chatRooms",
        id,
        "attachments"
      ),

      snapshot => {
        attachments = snapshot.docs.map(
          item => ({
            id: item.id,
            ...item.data()
          })
        );
        attachmentsLoaded = true;

        renderMessages();
      },

      exception => {
        console.error("Chat attachments could not be loaded:", exception);
        attachmentsLoaded = true;
        renderMessages();
        error(
          `Attachments could not be loaded: ${
            exception.code || exception.message
          }`
        );
      }
    );

  } catch (exception) {
    error(
      `Unable to open chat: ${
        exception.code ||
        exception.message
      }`
    );
  }
}

function openGroupDialog() {
  groupForm.reset();

  el("group-dialog-error").hidden = true;

  groupDialog.showModal();

  el("group-name-input").focus();
}

async function createGroup(event) {
  event.preventDefault();

  const title =
    el("group-name-input").value.trim();

  const submit =
    groupForm.querySelector(
      '[type="submit"]'
    );

  submit.disabled = true;

  el("group-dialog-error").hidden = true;

  try {
    const id = await createRoom(
      db,
      currentUser,
      title,
      "shared"
    );

    groupDialog.close();

    selectTab("group");

    await openRoom(id);

    document.dispatchEvent(
      new CustomEvent(
        "snap-chat-group-created",
        {
          detail: {
            roomId: id
          }
        }
      )
    );

  } catch (exception) {
    console.error("SNAP GROUP CREATE FAILED", {
      code: exception.code,
      message: exception.message,
      name: exception.name
    });

    el("group-dialog-error").textContent =
      exception.code === "permission-denied"
        ? "Firestore denied the shared chat write. Confirm the deployed rules allow mobile-schema room and participant creation."
        : `Create group failed: ${
            exception.code ||
            exception.message
          }`;

    el("group-dialog-error").hidden =
      false;

  } finally {
    submit.disabled = false;
  }
}

async function sendMessage(event) {
  event.preventDefault();

  const text =
    messageInput.value.trim();

  if (
    !text ||
    !currentRoom ||
    sending
  ) {
    return;
  }

  sending = true;
  sendButton.disabled = true;

  try {
    if (editingMessage) {
      await editTextMessage(
        db,
        currentRoom.id,
        editingMessage.id,
        text
      );
    } else {
      await sendText(
        db,
        currentUser,
        currentRoom.id,
        text,
        replyingTo
      );
    }

    messageInput.value = "";
    setReplyingTo(null);

    error("");
  } catch (exception) {
    console.error("Chat message send/edit failed:", {
      code: exception.code,
      message: exception.message,
      name: exception.name
    });
    error(
      exception.code === "permission-denied"
        ? "Firestore rejected this message. Check room membership and the message or reply data."
        : `Send failed: ${
            exception.code ||
            exception.message
          }`
    );
  } finally {
    sending = false;

    sendButton.disabled = false;

    messageInput.focus();
  }
}

async function bump(message) {
  try {
    await bumpMessage(
      db,
      currentUser,
      currentRoom.id,
      message
    );

    messageStream.scrollTop =
      messageStream.scrollHeight;
    error("");
  } catch (exception) {
    error(
      `Could not bump this message: ${
        exception.code ||
        exception.message
      }`
    );
  }
}

// ==========================================
// PAGE BUTTONS
// ==========================================

el("direct-tab").addEventListener(
  "click",
  () => selectTab("direct")
);

el("groups-tab").addEventListener(
  "click",
  () => selectTab("group")
);

el("create-group-button").addEventListener(
  "click",
  openGroupDialog
);

el("cancel-group-button").addEventListener(
  "click",
  () => groupDialog.close()
);

// Mobile rules use link invitations instead
// of the old public-user search.
el("group-member-search-button").disabled =
  true;

el("group-member-search").disabled = true;

el("group-member-search").placeholder =
  "Invite via link after creating the room";

el("add-group-members-button").hidden = true;

groupForm.addEventListener(
  "submit",
  createGroup
);

el("message-form").addEventListener(
  "submit",
  sendMessage
);

el("cancel-reply-button").addEventListener(
  "click",
  () => {
    const wasEditing = Boolean(editingMessage);
    if (wasEditing) messageInput.value = "";
    setReplyingTo(null);
  }
);

for (const kind of ["image", "file"]) {
  attachmentButtons[kind].addEventListener(
    "click",
    () => attachmentInputs[kind].click()
  );
  attachmentInputs[kind].addEventListener(
    "change",
    () => {
      const file = attachmentInputs[kind].files?.[0];
      attachmentInputs[kind].value = "";
      if (file) {
        if (kind === "file" && file.type.startsWith("audio/")) {
          void sendAttachment("audio", file);
        } else {
          showAttachmentDraft(kind, file);
        }
      }
    }
  );
}

attachmentPreviewCancelButton.addEventListener(
  "click",
  () => {
    if (!activeAttachmentUpload && !confirmDiscardUploadedPublicDocument()) {
      return;
    }
    cancelAttachmentDraft({ abort: true });
  }
);

attachmentPreviewSendButton.addEventListener(
  "click",
  () => {
    if (
      attachmentDraft &&
      ["image", "file"].includes(attachmentDraft.kind)
    ) {
      void sendAttachment(
        attachmentDraft.kind,
        attachmentDraft.file
      );
    }
  }
);

attachmentPublicConsentCheck.addEventListener(
  "change",
  () => {
    if (attachmentDraft?.kind !== "file" || sending) return;
    const config = window.SNAP_CLOUDINARY_CONFIG || {};
    const cloudinaryConfigured =
      Boolean(String(config.cloudName || "").trim()) &&
      Boolean(String(config.uploadPreset || "").trim());
    attachmentPreviewSendButton.disabled =
      !cloudinaryConfigured ||
      !attachmentPublicConsentCheck.checked ||
      !currentRoom;
    if (!attachmentPublicConsentCheck.checked) {
      attachmentPreviewStatus.textContent =
        "Confirm the public-sharing risk before upload.";
    } else if (cloudinaryConfigured) {
      attachmentPreviewStatus.textContent =
        "Public file-sharing confirmed. Anyone with the URL can access this file.";
    }
    if (attachmentPublicConsentCheck.checked) error("");
  }
);

attachmentButtons.audio.addEventListener(
  "click",
  () => void toggleAudioRecording()
);

attachmentInputs.audio.addEventListener(
  "change",
  () => {
    const file = attachmentInputs.audio.files?.[0];
    attachmentInputs.audio.value = "";
    if (file) void sendAttachment("audio", file);
  }
);

audioPreviewCancelButton.addEventListener(
"click",
cancelAudioCapture
);

audioPreviewSendButton.addEventListener(
"click",
() => {
  if (audioRecorder?.state === "recording") {
    audioPreviewSendButton.disabled = true;
    audioPreviewSendButton.textContent = "Preparing preview…";
    audioRecorder.stop();
    return;
  }

  if (!audioPreview || audioPreview.roomId !== currentRoom?.id) {
    error("This voice recording no longer matches the open conversation.");
    cancelAudioCapture();
    return;
  }

  void sendAttachment("audio", audioPreview.file);
}
);

el("thread-back-button").addEventListener(
  "click",
  emptyThread
);

el("user-search-form").hidden = true;

// Public bridge for the UI module.
window.SNAPChatBridge = {
  openRoom,

  closeRoom: emptyThread,

  refreshCurrentRoom: async () => {
    if (!currentRoom || !currentUser) return;

    const updated = await readRoom(
      db,
      currentRoom.id,
      currentUser.uid
    );

    if (!updated) {
      emptyThread();
      return;
    }

    renderHeader(updated);
    renderMessages();
  },

  getRoom: () => currentRoom,

  getUser: () => currentUser,

  newGroup: openGroupDialog
};

// ==========================================
// FIREBASE LOGIN & REAL-TIME LISTENER
// ==========================================

function reportAuthFailure(exception) {
  console.error("Firebase Authentication initialization failed:", {
    code: exception.code,
    message: exception.message,
    name: exception.name
  });
  roomListStatus.textContent =
    "Could not check your sign-in status.";
  roomListRetryButton.hidden = false;
  error(
    `Authentication could not be initialized: ${
      exception.message || exception.code || "Unknown error"
    }`
  );
}

function subscribeToAuth() {
  stopAuth?.();
  try {
    stopAuth = onAuthStateChanged(
      auth,
      user => {
        stopRooms?.();
        stopRooms = null;
        stopProfile?.();
        stopProfile = null;

        closeListeners();
        emptyThread();

        rooms = [];
        currentUser = user;
        currentProfileAppearance = null;
        profileAppearanceLoadedFromServer = false;
        roomDiscoveryReady = false;
        lastProfileAppearanceSyncKey = "";

        if (!user) {
          setAvatar(el("profile-avatar"), "", "SNAP");
          roomListStatus.textContent = "Sign in to load conversations.";
          roomListRetryButton.hidden = true;
          if (
            new URLSearchParams(
              location.search
            ).has("invite")
          ) {
            sessionStorage.setItem(
              "snapChatAfterLogin",
              location.href
            );
          }

          location.replace(
            "../../Login/login.php"
          );

          return;
        }

        roomListStatus.textContent = "Loading conversations…";
        roomListRetryButton.hidden = true;
        watchProfileAppearance(user);
        startRoomDiscovery(user);

        selectTab(
          sessionStorage.getItem("snapChatSelectedTab") === "group"
            ? "group"
            : "direct"
        );

        document.dispatchEvent(
          new CustomEvent("snap-chat-ready")
        );
      },
      reportAuthFailure
    );
  } catch (exception) {
    reportAuthFailure(exception);
  }
}

roomListRetryButton.addEventListener("click", () => {
  if (currentUser) {
    startRoomDiscovery(currentUser);
    return;
  }
  subscribeToAuth();
});

subscribeToAuth();

window.addEventListener(
  "pagehide",
  () => {
    if (audioRecorder?.state === "recording") {
      discardAudioRecording = true;
      audioRecorder.stop();
    }
    stopAudioStream();
    stopRooms?.();
    stopAuth?.();
    stopProfile?.();
    closeListeners();
  }
);
