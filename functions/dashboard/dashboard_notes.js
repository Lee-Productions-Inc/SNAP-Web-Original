// ============================================================
// SNAP DASHBOARD - NOTES
// Loads the logged-in user's notes from Firestore
// ============================================================

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ============================================================
// FIREBASE
// ============================================================

const firebaseConfig = {
    apiKey: "AIzaSyDcoFVS7iOCqRjLrIye48aF1yC3rsPvzIo",
    authDomain: "snap-c1519.firebaseapp.com",
    projectId: "snap-c1519",
    storageBucket: "snap-c1519.firebasestorage.app",
    messagingSenderId: "521370478287",
    appId: "1:521370478287:web:67dd6cc5365e3a531a79ba",
    measurementId: "G-LFX734CDTD"
};


const app =
    getApps().length
        ? getApp()
        : initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);


// ============================================================
// ELEMENTS
// ============================================================

const notesGrid =
    document.querySelector(".notes-grid");

const recentNotes =
    document.querySelector(".recent-notes");


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(timestamp) {

    if (!timestamp) {
        return "Recently edited";
    }

    const date =
        timestamp.toDate
            ? timestamp.toDate()
            : new Date(timestamp);

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


// ============================================================
// CREATE NOTE CARD
// ============================================================

function createNoteCard(
    noteId,
    note
) {

    const card =
        document.createElement("button");

    card.type = "button";

    card.className =
        "dashboard-note-card";


    // --------------------------------------------
    // TITLE
    // --------------------------------------------

    const title =
        document.createElement("h3");

    title.className =
        "dashboard-note-title";

    title.textContent =
        note.title ||
        "Untitled Note";


    // --------------------------------------------
    // CONTENT PREVIEW
    // --------------------------------------------

    const preview =
        document.createElement("p");

    preview.className =
        "dashboard-note-preview";

    const plainText =
        note.plainText ||
        stripHTML(note.content || "");

    preview.textContent =
        plainText
            ? plainText.substring(0, 120)
            : "No content";


    // --------------------------------------------
    // DATE
    // --------------------------------------------

    const date =
        document.createElement("span");

    date.className =
        "dashboard-note-date";

    date.textContent =
        formatDate(
            note.updatedAt ||
            note.createdAt
        );


    // --------------------------------------------
    // CONTENT
    // --------------------------------------------

    card.appendChild(title);
    card.appendChild(preview);
    card.appendChild(date);


    // --------------------------------------------
    // OPEN NOTE
    // --------------------------------------------

    card.addEventListener(
        "click",
        function () {

            window.location.href =
                `notes/notes.php?id=${encodeURIComponent(noteId)}`;

        }
    );


    return card;
}


// ============================================================
// REMOVE HTML FROM PREVIEW
// ============================================================

function stripHTML(
    html
) {

    const temp =
        document.createElement("div");

    temp.innerHTML =
        html;

    return temp.innerText
        .replace(/\s+/g, " ")
        .trim();

}


// ============================================================
// EMPTY STATE
// ============================================================

function showEmptyNotes() {

    if (!notesGrid) {
        return;
    }

    notesGrid.innerHTML = `
        <div class="dashboard-notes-empty">
            <div class="dashboard-notes-empty-icon">
                📝
            </div>

            <h3>
                No notes yet
            </h3>

            <p>
                Create your first note and it will appear here.
            </p>

            <a
                href="notes/notes.php"
                class="dashboard-create-note"
            >
                + Create note
            </a>
        </div>
    `;
}


// ============================================================
// LOAD NOTES
// ============================================================

async function loadDashboardNotes(
    user
) {

    if (!notesGrid) {
        return;
    }


    notesGrid.innerHTML = `
        <div class="dashboard-notes-loading">
            Loading notes...
        </div>
    `;


    try {

        const notesRef =
            collection(
                db,
                "users",
                user.uid,
                "notes"
            );


        const notesQuery =
            query(
                notesRef,
                orderBy(
                    "updatedAt",
                    "desc"
                ),
                limit(6)
            );


        const snapshot =
            await getDocs(
                notesQuery
            );


        notesGrid.innerHTML = "";


        if (snapshot.empty) {

            showEmptyNotes();

            return;

        }


        snapshot.forEach(
            function (docSnapshot) {

                const note =
                    docSnapshot.data();


                const card =
                    createNoteCard(
                        docSnapshot.id,
                        note
                    );


                notesGrid.appendChild(
                    card
                );

            }
        );


    }
    catch (error) {

        console.error(
            "SNAP DASHBOARD NOTES ERROR:",
            error
        );


        notesGrid.innerHTML = `
            <div class="dashboard-notes-error">
                <strong>
                    Could not load notes
                </strong>

                <span>
                    ${escapeHTML(
                        error.message ||
                        "Unknown Firestore error"
                    )}
                </span>
            </div>
        `;

    }

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(
    auth,
    function (user) {

        if (!user) {

            console.warn(
                "SNAP Dashboard: no logged-in Firebase user."
            );

            return;

        }


        console.log(
            "SNAP Dashboard: loading notes for",
            user.uid
        );


        loadDashboardNotes(
            user
        );

    }
);