import { auth, db } from "../firebase/firebase.js";

import {
    collection,
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const folderId =
    new URLSearchParams(window.location.search).get("id");
const folderTitle =
    document.getElementById("folder-title");
const noteCount =
    document.getElementById("folder-note-count");
const noteList =
    document.getElementById("folder-note-list");
const message =
    document.getElementById("folder-detail-message");
const searchInput =
    document.getElementById("folder-note-search");
const newNoteLink =
    document.getElementById("folder-new-note");

let notes = [];
let stopFolder = null;
let stopNotes = null;

function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
}

function timestampValue(value) {
    if (value && typeof value.toMillis === "function") {
        return value.toMillis();
    }

    const time = value instanceof Date
        ? value.getTime()
        : new Date(value || 0).getTime();

    return Number.isNaN(time) ? 0 : time;
}

function notePreview(note) {
    const source = note.plainText ||
        String(note.content || "").replace(/<[^>]*>/g, " ");
    return source.replace(/\s+/g, " ").trim() ||
        "No preview available.";
}

function renderNotes() {
    const search = searchInput.value.trim().toLocaleLowerCase();
    const visibleNotes = notes.filter(note =>
        !search ||
        `${note.title || ""} ${notePreview(note)}`
            .toLocaleLowerCase()
            .includes(search)
    );

    noteCount.textContent =
        `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
    noteList.replaceChildren();

    if (!visibleNotes.length) {
        const empty = document.createElement("p");
        empty.className = "folder-note-state";
        empty.textContent = notes.length
            ? "No notes match your search."
            : "This folder is empty. Create a note to get started.";
        noteList.appendChild(empty);
        return;
    }

    for (const note of visibleNotes) {
        const link = document.createElement("a");
        link.className = "folder-note-card";
        link.href =
            `../notes/notes.php?id=${encodeURIComponent(note.id)}`;

        const title = document.createElement("h2");
        title.textContent = note.title || "Untitled Note";

        const preview = document.createElement("p");
        preview.textContent = notePreview(note);

        const updated = document.createElement("time");
        const date = new Date(
            timestampValue(note.updatedAt || note.createdAt)
        );
        if (!Number.isNaN(date.getTime())) {
            updated.dateTime = date.toISOString();
            updated.textContent = date.toLocaleDateString();
        }

        link.append(title, preview, updated);
        noteList.appendChild(link);
    }
}

searchInput.addEventListener("input", renderNotes);

onAuthStateChanged(auth, user => {
    stopFolder?.();
    stopNotes?.();
    stopFolder = null;
    stopNotes = null;
    notes = [];

    if (!user) {
        window.location.replace("../../Login/login.php");
        return;
    }

    if (!folderId) {
        folderTitle.textContent = "Folder not found";
        noteCount.textContent = "";
        noteList.replaceChildren();
        showMessage("This folder link is missing its folder ID.");
        return;
    }

    newNoteLink.href =
        `../notes/notes.php?folderId=${encodeURIComponent(folderId)}`;

    const folderReference =
        doc(db, "users", user.uid, "folders", folderId);
    const notesReference =
        collection(db, "users", user.uid, "notes");

    stopFolder = onSnapshot(
        folderReference,
        snapshot => {
            if (!snapshot.exists()) {
                folderTitle.textContent = "Folder not found";
                showMessage(
                    "This folder may have been deleted or is not available to your account."
                );
                return;
            }

            folderTitle.textContent =
                snapshot.data().name || "Untitled folder";
        },
        error => {
            console.error("Could not load this folder:", error);
            showMessage(
                "Could not load this folder. Check your connection and try again."
            );
        }
    );

    stopNotes = onSnapshot(
        notesReference,
        snapshot => {
            notes = snapshot.docs
                .map(item => ({ id: item.id, ...item.data() }))
                .filter(note =>
                    note.deleted !== true &&
                    note.folderId === folderId
                )
                .sort((a, b) =>
                    timestampValue(b.updatedAt || b.createdAt) -
                    timestampValue(a.updatedAt || a.createdAt)
                );

            renderNotes();
        },
        error => {
            console.error("Could not load notes in this folder:", error);
            noteList.replaceChildren();
            showMessage(
                "Could not load this folder’s notes. Check your connection and try again."
            );
        }
    );
});
