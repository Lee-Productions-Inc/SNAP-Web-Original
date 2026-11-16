
import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getDocsFromServer,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
  createInviteError,
  hashInviteToken,
  normalizeInviteToken
} from "../chat_invite_link.mjs?v=20261115-mobile-invite-1";

const nameOf = user =>
  (
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "SNAP user"
  ).trim().slice(0, 120);

function safeAppearance(displayName, photoURL) {
  const safeName = String(displayName || "")
    .trim()
    .slice(0, 120) || "SNAP member";
  const safePhotoURL =
    typeof photoURL === "string" &&
    /^https:\/\//i.test(photoURL) &&
    photoURL.length <= 4096
      ? photoURL
      : "";

  return {
    profileDisplayName: safeName,
    profilePhotoUrl: safePhotoURL
  };
}

function memberPhotoURLs(data) {
  if (
    typeof data.profilePhotoUrl === "string" &&
    !data.profilePhotoUrl.trim()
  ) {
    return [];
  }

  const sourceURLs = [
    data.profilePhotoUrl,
    data.profilePhotoURL,
    data.photoUrl,
    data.photoURL
  ];

  return [...new Set(
    sourceURLs
      .filter(value =>
        typeof value === "string" &&
        /^https:\/\//i.test(value) &&
        value.length <= 4096
      )
      .map(value => value.trim())
      .filter(Boolean)
  )];
}

// Create room and host together as required
// by the mobile Firestore security rules.
export async function createRoom(
  db,
  user,
  title,
  type = "shared"
) {
  if (!user) throw Error("Please sign in.");

  if (!["shared", "direct"].includes(type)) {
    throw Error("Invalid room type.");
  }

  title = String(title || "").trim();

  if (!title || title.length > 120) {
    throw Error("Room name must be 1–120 characters.");
  }

  const room = doc(collection(db, "chatRooms"));

  const host = doc(
    db,
    "chatRooms",
    room.id,
    "participants",
    user.uid
  );

  const batch = writeBatch(db);

  batch.set(room, {
    id: room.id,
    type,
    title,
    ownerUid: user.uid,
    participantCount: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    schemaVersion: 1
  });

  batch.set(host, {
    conversationId: room.id,
    userUid: user.uid,
    displayName: nameOf(user),
    role: "host",
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    schemaVersion: 1
  });

  await batch.commit();

  return room.id;
}

// Adapt mobile room fields for the web UI.
export async function roomFromSnapshot(
  db,
  snapshot,
  currentUid = null,
  rosterSnapshot = null
) {
  if (
    !snapshot.exists() ||
    snapshot.data().deletedAt != null
  ) {
    return null;
  }

  const roster = rosterSnapshot || await getDocs(
      collection(
        db,
        "chatRooms",
        snapshot.id,
        "participants"
      )
    );

  const members = roster.docs.filter(
    item => item.data().deletedAt == null
  );
  const membershipEvents = roster.docs.flatMap(item => {
    const data = item.data();
    const displayName =
      data.profileDisplayName ||
      data.displayName ||
      "A member";
    const events = [];

    if (data.joinedAt != null) {
      events.push({
        uid: item.id,
        displayName,
        type: "joined",
        at: data.joinedAt
      });
    }

    if (data.deletedAt != null) {
      events.push({
        uid: item.id,
        displayName,
        type: "left",
        at: data.deletedAt
      });
    }

    return events;
  });
  const memberProfiles = Object.fromEntries(
    members.map(item => {
      const data = item.data();
      const photoURLs = memberPhotoURLs(data);
      return [
        item.id,
        {
          displayName:
            data.profileDisplayName ||
            data.displayName ||
            "SNAP member",
          photoURLs,
          photoURL: photoURLs[0] || ""
        }
      ];
    })
  );

  return {
    ...snapshot.data(),

    id: snapshot.id,

    type:
      snapshot.data().type === "shared"
        ? "group"
        : "direct",

    name: snapshot.data().title,

    createdBy: snapshot.data().ownerUid,

    memberIds: members.map(item => item.id),

    membershipEvents,

    memberNames: Object.fromEntries(
      members.map(item => [
        item.id,
        memberProfiles[item.id].displayName
      ])
    ),

    memberProfiles,

    memberRoles: Object.fromEntries(
      members.map(item => [
        item.id,
        item.data().role || "member"
      ])
    ),

    currentParticipant:
      members.find(
        item => item.id === currentUid
      )?.data() || null
  };
}

export async function readRoom(db, id, currentUid = null) {
  return roomFromSnapshot(
    db,
    await getDoc(doc(db, "chatRooms", id)),
    currentUid
  );
}

// Discover only rooms the current user has joined.
export function watchRooms(
  db,
  user,
  onChange,
  onError
) {
  const records = new Map();
  const listeners = new Map();

  let stopped = false;

  const notify = () => {
    if (!stopped) {
      onChange([...records.values()]);
    }
  };

  const reportError = (stage, error) => {
    console.error(`Chat room discovery failed during ${stage}:`, {
      code: error.code,
      message: error.message,
      name: error.name
    });

    const detailedError = new Error(
      `${stage}: ${error.message || error.code || "Unknown error"}`
    );
    detailedError.code = error.code;
    onError(detailedError);
  };

  const search = query(
    collectionGroup(db, "participants"),
    where("userUid", "==", user.uid)
  );

  const stopMembership = onSnapshot(
    search,
    snapshot => {
      const wanted = new Set(
        snapshot.docs
          .filter(item =>
            item.ref.parent.parent?.parent.id ===
              "chatRooms" &&
            item.id === user.uid &&
            item.data().deletedAt == null
          )
          .map(item => item.ref.parent.parent.id)
      );

      for (const [id, stop] of listeners) {
        if (!wanted.has(id)) {
          stop();
          listeners.delete(id);
          records.delete(id);
        }
      }

      for (const id of wanted) {
        if (listeners.has(id)) continue;

        let version = 0;
        let roomActive = true;
        let roomSnapshot = null;
        let rosterSnapshot = null;

        const refreshRoom = async () => {
          if (!roomSnapshot || !rosterSnapshot) return;
          const currentVersion = ++version;

          try {
            const room = await roomFromSnapshot(
              db,
              roomSnapshot,
              user.uid,
              rosterSnapshot
            );

            if (
              stopped ||
              !roomActive ||
              currentVersion !== version
            ) {
              return;
            }

            if (room) {
              records.set(id, room);
            } else {
              records.delete(id);
            }
            notify();
          } catch (error) {
            if (!stopped && roomActive) {
              reportError(
                `loading room ${id} and its participants`,
                error
              );
            }
          }
        };

        const stopRoom = onSnapshot(
          doc(db, "chatRooms", id),
          snapshot => {
            roomSnapshot = snapshot;
            void refreshRoom();
          },
          error => reportError(`listening to room ${id}`, error)
        );

        const stopRoster = onSnapshot(
          collection(db, "chatRooms", id, "participants"),
          snapshot => {
            rosterSnapshot = snapshot;
            void refreshRoom();
          },
          error => reportError(`listening to participants in room ${id}`, error)
        );

        listeners.set(id, () => {
          roomActive = false;
          version += 1;
          stopRoom();
          stopRoster();
        });
      }

      notify();
    },

    error =>
      reportError("searching your participant records", error)
  );

  return () => {
    stopped = true;

    stopMembership();

    for (const stop of listeners.values()) {
      stop();
    }

    listeners.clear();
    records.clear();
  };
}

export async function syncParticipantAppearance(
  db,
  userUid,
  { displayName, photoURL }
) {
  const appearance = safeAppearance(displayName, photoURL);

  const participantQuery = query(
    collectionGroup(db, "participants"),
    where("userUid", "==", userUid)
  );
  const snapshot = await getDocsFromServer(
    participantQuery
  ).catch(error => {
    if (firestoreCode(error) === "permission-denied") {
      error.operation =
        "list collectionGroup(participants) where userUid == currentUid";
    }
    throw error;
  });
  const failures = [];
  let updatedCount = 0;

  for (const item of snapshot.docs) {
    const roomReference = item.ref.parent.parent;
    const data = item.data();
    if (
      item.id !== userUid ||
      data.userUid !== userUid ||
      data.deletedAt !== null ||
      roomReference?.parent?.id !== "chatRooms"
    ) {
      continue;
    }

    const roomId = roomReference.id;
    const roomSnapshot = await getDocFromServer(roomReference).catch(error => {
      if (firestoreCode(error) !== "permission-denied") {
        throw error;
      }

      failures.push({
        roomId,
        operation: `read chatRooms/${roomId}`
      });
      return null;
    });

    if (
      !roomSnapshot?.exists() ||
      roomSnapshot.data().deletedAt !== null
    ) {
      continue;
    }

    if (
      data.profileDisplayName === appearance.profileDisplayName &&
      data.profilePhotoUrl === appearance.profilePhotoUrl
    ) {
      continue;
    }

    try {
      await updateDoc(item.ref, {
        ...appearance,
        profileUpdatedAt: serverTimestamp()
      });
      updatedCount += 1;
    } catch (error) {
      if (firestoreCode(error) !== "permission-denied") {
        throw error;
      }

      failures.push({
        roomId,
        operation:
          `update chatRooms/${roomId}/participants/${userUid} appearance`
      });
    }
  }

  if (failures.length) {
    const error = new Error(
      "Firestore denied profile appearance access for one or more chats."
    );
    error.code = "permission-denied";
    error.failures = failures;
    throw error;
  }

  return updatedCount;
}

// Send mobile-compatible schema-v1 text message.
export async function sendText(
  db,
  user,
  roomId,
  text,
  replyTo = null,
  attachment = null
) {
  const body = String(text || "").trim();

  if ((!body && !attachment) || body.length > 10000) {
    throw Error("Invalid message length.");
  }

  const messageCollection = collection(
    db,
    "chatRooms",
    roomId,
    "messages"
  );
  let reference = attachment?.messageId
    ? doc(db, "chatRooms", roomId, "messages", attachment.messageId)
    : doc(messageCollection);
  let createMessage = true;

  if (attachment?.messageId) {
    const existingMessage = await getDoc(reference);
    if (existingMessage.exists()) {
      const existing = existingMessage.data();
      if (
        existing.conversationId !== roomId ||
        existing.senderUid !== user.uid
      ) {
        throw Error("The attachment message ID is already in use.");
      }

      if (existing.deletedAt == null) {
        if (
          existing.body !== body ||
          (existing.replyToMessageId || null) !==
            (replyTo?.id || null)
        ) {
          throw Error(
            "The pending attachment message changed. Keep its text and reply unchanged, then retry."
          );
        }

        const existingAttachmentReference = attachment.id
          ? doc(
              db,
              "chatRooms",
              roomId,
              "attachments",
              attachment.id
            )
          : null;
        const existingAttachment = existingAttachmentReference
          ? await getDoc(existingAttachmentReference)
          : null;

        if (existingAttachment?.exists()) {
          const saved = existingAttachment.data();
          if (
            saved.messageId === reference.id &&
            saved.remoteUrl === attachment.url &&
            saved.remotePublicId === attachment.path &&
            saved.deletedAt == null
          ) {
            return reference.id;
          }
          attachment.id = crypto.randomUUID();
        }

        createMessage = false;
      } else {
        const oldAttachment = attachment.id
          ? await getDoc(
              doc(
                db,
                "chatRooms",
                roomId,
                "attachments",
                attachment.id
              )
            )
          : null;
        if (oldAttachment?.exists()) {
          attachment.id = crypto.randomUUID();
        }
        reference = doc(messageCollection);
        attachment.messageId = reference.id;
      }
    } else {
      attachment.messageId = reference.id;
    }
  }

  const message = {
    id: reference.id,
    conversationId: roomId,
    senderUid: user.uid,
    senderDisplayName: nameOf(user),
    body,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    deletedAt: null,
    schemaVersion:
      replyTo || attachment?.schemaVersion === 2
        ? 2
        : 1
  };

  if (replyTo || attachment?.schemaVersion === 2) {
    message.replyToMessageId = replyTo?.id || null;
  }

  if (createMessage) {
    await setDoc(reference, message);
  }

  if (attachment) {
    const attachmentReference = attachment.id
      ? doc(
          db,
          "chatRooms",
          roomId,
          "attachments",
          attachment.id
        )
      : doc(collection(db, "chatRooms", roomId, "attachments"));

    try {
      await setDoc(attachmentReference, {
        id: attachmentReference.id,
        conversationId: roomId,
        messageId: reference.id,
        kind: attachment.kind,
        fileName: attachment.name,
        remoteUrl: attachment.url,
        remotePublicId: attachment.path,
        storageProvider:
          attachment.storageProvider || "firebase_storage",
        storageEnvironmentId:
          attachment.storageEnvironmentId || null,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.size,
        metadataJson: attachment.metadataJson || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
        schemaVersion: 1
      });
    } catch (error) {
      try {
        await updateDoc(reference, {
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        if (attachment.messageId) {
          attachment.messageId = crypto.randomUUID();
          attachment.id = crypto.randomUUID();
        }
      } catch (cleanupError) {
        console.error(
          "Could not tombstone an attachment message after metadata write failed:",
          cleanupError
        );
      }

      throw error;
    }
  }

  return reference.id;
}

export async function editTextMessage(
  db,
  roomId,
  messageId,
  text
) {
  const body = String(text || "").trim();
  if (!body || body.length > 10000) {
    throw Error("Message text must be 1–10,000 characters.");
  }

  await updateDoc(
    doc(db, "chatRooms", roomId, "messages", messageId),
    {
      body,
      editedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  );
}

export async function deleteChatMessage(
  db,
  roomId,
  messageId
) {
  await updateDoc(
    doc(db, "chatRooms", roomId, "messages", messageId),
    {
      deletedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }
  );
}

export async function bumpMessage(
  db,
  user,
  roomId,
  message
) {
  if (!message?.id || !message?.senderUid) {
    throw Error("Cannot bump this message.");
  }

  const reference = doc(
    collection(db, "chatRooms", roomId, "messages")
  );

  await setDoc(reference, {
    id: reference.id,
    conversationId: roomId,
    senderUid: user.uid,
    senderDisplayName: nameOf(user),
    body: "",
    kind: "bump",
    replyToMessageId: null,
    bumpTargetMessageId: message.id,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    editedAt: null,
    deletedAt: null,
    schemaVersion: 3
  });

  return reference.id;
}

// Create a securely random, hashed invitation.
const token = () =>
  btoa(
    String.fromCharCode(
      ...crypto.getRandomValues(
        new Uint8Array(32)
      )
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

export async function createInvite(
  db,
  user,
  roomId,
  kind
) {
  if (!["shared", "direct"].includes(kind)) {
    throw Error("Invalid invitation type.");
  }

  const value = token();

  await setDoc(
    doc(
      db,
      "chatInvites",
      await hashInviteToken(value)
    ),
    {
      conversationId: roomId,
      kind,
      createdByUid: user.uid,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(
        Date.now() + 7 * 86400000
      ),
      revokedAt: null,
      schemaVersion: 1
    }
  );

  return value;
}

export async function clearChatForUser(
  db,
  user,
  roomId
) {
  await updateDoc(
    doc(
      db,
      "chatRooms",
      roomId,
      "participants",
      user.uid
    ),
    {
      clearedAt: serverTimestamp(),
      clearMutationId: crypto.randomUUID(),
      updatedAt: serverTimestamp(),
      schemaVersion: 2
    }
  );
}

export async function leaveRoom(
  db,
  user,
  roomId
) {
  if (!user?.uid) {
    throw Error("Please sign in first.");
  }

  const room = await readRoom(db, roomId, user.uid);
  if (!room) {
    throw Error("This conversation is no longer available.");
  }

  const roomReference = doc(db, "chatRooms", roomId);
  const now = serverTimestamp();
  const activeMembers = room.memberIds || [];

  if (
    activeMembers.length !== room.participantCount ||
    !activeMembers.includes(user.uid)
  ) {
    throw Error(
      "Chat membership changed. Refresh the conversation and try again."
    );
  }

  if (room.ownerUid === user.uid) {
    if (
      room.memberRoles?.[user.uid] !== "host"
    ) {
      throw Error(
        "Your host membership is out of date. Refresh the conversation and try again."
      );
    }

    if (
      room.participantCount === 1 &&
      activeMembers[0] === user.uid
    ) {
      if (room.type !== "direct") {
        throw Error(
          "A group host cannot leave while they are the only participant. Add another member first."
        );
      }

      await updateDoc(roomReference, {
        deletedAt: now,
        updatedAt: now
      });
      return;
    }

    const nextOwnerUid = activeMembers
      .filter(participantUid => participantUid !== user.uid)
      .sort()[0];

    if (
      !nextOwnerUid ||
      room.memberRoles?.[nextOwnerUid] !== "member"
    ) {
      throw Error(
        "No eligible active member can become host. Refresh the conversation and try again."
      );
    }

    const batch = writeBatch(db);

    batch.update(roomReference, {
      ownerUid: nextOwnerUid,
      participantCount: increment(-1),
      updatedAt: now
    });

    batch.update(
      doc(db, "chatRooms", roomId, "participants", user.uid),
      {
        role: "member",
        deletedAt: now,
        updatedAt: now,
        schemaVersion: 2
      }
    );

    batch.update(
      doc(
        db,
        "chatRooms",
        roomId,
        "participants",
        nextOwnerUid
      ),
      {
        role: "host",
        updatedAt: now,
        schemaVersion: 2
      }
    );

    await batch.commit();
    return;
  }

  if (room.memberRoles?.[user.uid] !== "member") {
    throw Error(
      "Your participant record is out of date. Refresh the conversation and try again."
    );
  }

  const batch = writeBatch(db);

  batch.update(
    doc(db, "chatRooms", roomId, "participants", user.uid),
    {
      deletedAt: now,
      updatedAt: now,
      schemaVersion: 2
    }
  );

  batch.update(roomReference, {
    participantCount: increment(-1),
    updatedAt: now
  });

  await batch.commit();
}

const firestoreCode = error =>
  String(error?.code || "").split("/").pop();

const joinedInviteResult = (roomId, kind) => ({
  roomId,
  kind,
  alreadyJoined: true
});

// Join using the mobile-compatible invite and membership records.
export async function joinInvite(
  db,
  user,
  rawToken,
  expectedKind = null
) {
  if (!user?.uid) {
    throw createInviteError(
      "unauthenticated",
      "Please sign in before joining a conversation."
    );
  }

  const value = normalizeInviteToken(rawToken);

  if (
    expectedKind !== null &&
    !["shared", "direct"].includes(expectedKind)
  ) {
    throw createInviteError(
      "invite-unsupported",
      "This invitation format is not supported."
    );
  }

  const id = await hashInviteToken(value);
  const inviteReference = doc(db, "chatInvites", id);
  const invite = await getDocFromServer(inviteReference);

  if (!invite.exists()) {
    throw createInviteError(
      "invite-not-found",
      "Invitation not found."
    );
  }

  const data = invite.data();
  const hasRevokedAt =
    Object.prototype.hasOwnProperty.call(data, "revokedAt");

  if (
    data.schemaVersion !== 1 ||
    typeof data.conversationId !== "string" ||
    !data.conversationId.trim() ||
    !["shared", "direct"].includes(data.kind) ||
    typeof data.createdByUid !== "string" ||
    !data.createdByUid.trim() ||
    typeof data.createdAt?.toMillis !== "function" ||
    typeof data.expiresAt?.toMillis !== "function" ||
    !hasRevokedAt ||
    (
      data.revokedAt != null &&
      typeof data.revokedAt.toMillis !== "function"
    )
  ) {
    throw createInviteError(
      "invite-malformed",
      "Invitation details are invalid."
    );
  }

  if (expectedKind && expectedKind !== data.kind) {
    throw createInviteError(
      "invite-kind-mismatch",
      "This link does not match the invitation type."
    );
  }

  if (data.revokedAt != null) {
    throw createInviteError(
      "invite-revoked",
      "This invitation has been revoked."
    );
  }

  if (data.expiresAt.toMillis() <= Date.now()) {
    throw createInviteError(
      "invite-expired",
      "This invitation has expired."
    );
  }

  const roomId = data.conversationId.trim();
  const kind = data.kind;
  const banReference = doc(
    db,
    "chatRooms",
    roomId,
    "bans",
    user.uid
  );
  const ban = await getDocFromServer(banReference);

  if (ban.exists()) {
    const banData = ban.data();
    const deletedAt = banData.deletedAt;

    if (
      banData.conversationId !== roomId ||
      banData.userUid !== user.uid ||
      banData.schemaVersion !== 1 ||
      (
        deletedAt != null &&
        typeof deletedAt.toMillis !== "function"
      )
    ) {
      throw createInviteError(
        "invite-malformed",
        "Chat membership information is invalid."
      );
    }

    if (deletedAt == null) {
      throw createInviteError(
        "banned",
        "You are not allowed to join this conversation."
      );
    }
  }

  const member = doc(
    db,
    "chatRooms",
    roomId,
    "participants",
    user.uid
  );

  // Missing participant documents may be unreadable
  // under the current mobile rules.
  let existing = null;

  try {
    existing = await getDocFromServer(member);
  } catch (error) {
    if (firestoreCode(error) !== "permission-denied") {
      throw error;
    }
  }

  const rejoining = Boolean(existing?.exists());

  if (rejoining) {
    const participant = existing.data();

    if (
      participant.conversationId !== roomId ||
      participant.userUid !== user.uid
    ) {
      throw createInviteError(
        "invite-malformed",
        "Chat membership information is invalid."
      );
    }

    if (participant.deletedAt == null) {
      return joinedInviteResult(roomId, kind);
    }

    if (participant.role !== "member") {
      throw createInviteError(
        "invite-rejoin-restricted",
        "This conversation cannot be rejoined with this account."
      );
    }
  }

  const batch = writeBatch(db);
  const displayName = nameOf(user);
  const joinEventId =
    `chat-system-join-${Date.now()}-${id.slice(0, 12)}-${crypto.randomUUID()}`;

  batch.set(
    doc(
      db,
      "chatRooms",
      roomId,
      "joinClaims",
      user.uid
    ),
    {
      conversationId: roomId,
      userUid: user.uid,
      inviteId: id,
      kind: data.kind,
      claimedAt: serverTimestamp(),
      schemaVersion: 1
    }
  );

  if (rejoining) {
    batch.update(member, {
      displayName: nameOf(user),
      role: "member",
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      clearedAt: null,
      clearMutationId: null,
      deletedAt: null,
      schemaVersion: 2
    });
  } else {
    batch.set(member, {
      conversationId: roomId,
      userUid: user.uid,
      displayName,
      role: "member",
      joinedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      clearedAt: null,
      clearMutationId: null,
      deletedAt: null,
      schemaVersion: 2
    });
  }

  batch.update(
    doc(db, "chatRooms", roomId),
    {
      participantCount: increment(1),
      updatedAt: serverTimestamp()
    }
  );

  batch.set(
    doc(db, "chatRooms", roomId, "messages", joinEventId),
    {
      id: joinEventId,
      conversationId: roomId,
      senderUid: user.uid,
      senderDisplayName: displayName,
      body: "",
      kind: "system_join",
      replyToMessageId: null,
      bumpTargetMessageId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      editedAt: null,
      deletedAt: null,
      schemaVersion: 4
    }
  );

  try {
    await batch.commit();
  } catch (error) {
    if (firestoreCode(error) !== "permission-denied") {
      throw error;
    }

    try {
      const latestMember = await getDocFromServer(member);
      if (
        latestMember.exists() &&
        latestMember.data().deletedAt == null
      ) {
        return joinedInviteResult(roomId, kind);
      }
    } catch (membershipError) {
      if (firestoreCode(membershipError) !== "permission-denied") {
        throw membershipError;
      }
    }

    const latestInvite = await getDocFromServer(inviteReference);
    if (!latestInvite.exists()) {
      throw createInviteError(
        "invite-not-found",
        "Invitation not found."
      );
    }

    const latestData = latestInvite.data();
    if (latestData.revokedAt != null) {
      throw createInviteError(
        "invite-revoked",
        "This invitation has been revoked."
      );
    }

    if (
      typeof latestData.expiresAt?.toMillis === "function" &&
      latestData.expiresAt.toMillis() <= Date.now()
    ) {
      throw createInviteError(
        "invite-expired",
        "This invitation has expired."
      );
    }

    const latestBan = await getDocFromServer(banReference);
    if (latestBan.exists() && latestBan.data().deletedAt == null) {
      throw createInviteError(
        "banned",
        "You are not allowed to join this conversation."
      );
    }

    throw error;
  }

  return {
    roomId,
    kind,
    alreadyJoined: false
  };
}

// Reactions belong in their own mobile subcollection.
export async function toggleReaction(
  db,
  user,
  roomId,
  messageId,
  emoji
) {
  if (
    ![
      "👍",
      "❤️",
      "😂",
      "😮",
      "😢",
      "🙏"
    ].includes(emoji)
  ) {
    throw Error("Unsupported emoji.");
  }

  const reference = doc(
    db,
    "chatRooms",
    roomId,
    "reactions",
    `${messageId}_${user.uid}`
  );

  const existing = await getDoc(reference);

  if (existing.exists()) {
    if (existing.data().emoji === emoji) {
      return deleteDoc(reference);
    }

    return updateDoc(reference, {
      emoji,
      updatedAt: serverTimestamp()
    });
  }

  return setDoc(reference, {
    messageId,
    userUid: user.uid,
    emoji,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
}

// Update room info using the mobile schema.
export async function updateRoomInfo(
  db,
  room,
  changes
) {
  if (room.type !== "group") {
    throw Error(
      "Only shared rooms can be renamed."
    );
  }

  const title = String(
    changes.title ??
      room.title ??
      room.name
  ).trim();

  if (!title || title.length > 120) {
    throw Error("Invalid room name.");
  }

  const updates = {
    title: String(changes.title ?? room.title ?? room.name).trim(),
    avatarUrl: room.avatarUrl ?? null,
    avatarPublicId:
      room.avatarPublicId ??
      room.avatarStoragePath ??
      null,
    avatarStorageProvider:
      room.avatarStorageProvider ??
      (room.avatarUrl ? "firebase_storage" : null),
    avatarStorageEnvironmentId:
      room.avatarStorageEnvironmentId ?? null,
    membersCanEditInfo:
      room.membersCanEditInfo === true,
    infoMutationId: crypto.randomUUID(),
    infoUpdatedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  if ("membersCanEditInfo" in changes) {
    updates.membersCanEditInfo =
      changes.membersCanEditInfo === true;
  }

  if ("avatarUrl" in changes) {
    updates.avatarUrl = changes.avatarUrl;
    updates.avatarPublicId = changes.avatarUrl
      ? changes.avatarPublicId ||
        changes.avatarStoragePath ||
        room.avatarPublicId ||
        ""
      : null;
    updates.avatarStorageProvider = changes.avatarUrl
      ? changes.avatarStorageProvider ||
        "firebase_storage"
      : null;
    updates.avatarStorageEnvironmentId = changes.avatarUrl
      ? changes.avatarStorageEnvironmentId ?? null
      : null;
  } else if ("avatarStoragePath" in changes && room.avatarUrl) {
    updates.avatarPublicId = changes.avatarStoragePath;
  }

  await updateDoc(
    doc(db, "chatRooms", room.id),
    updates
  );
}
