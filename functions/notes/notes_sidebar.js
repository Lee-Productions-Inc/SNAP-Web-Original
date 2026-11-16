// ============================================
// SNAP NOTES SIDEBAR
// FIREBASE RECENT NOTES
// ============================================

import {
    auth,
    db
} from "../firebase/firebase.js";

import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ============================================
// GET ELEMENT
// ============================================

const recentNotesList =
    document.getElementById(
        "recentNotesList"
    );


// ============================================
// FORMAT DATE
// ============================================

function formatNoteDate(
    timestamp
) {

    if (!timestamp) {

        return "Recently edited";

    }


    try {

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
    catch (error) {

        return "Recently edited";

    }

}


// ============================================
// SHOW LOADING
// ============================================

function showLoading() {

    if (!recentNotesList) {

        return;

    }


    recentNotesList.innerHTML = `
        <div class="recent-notes-loading">
            Loading notes...
        </div>
    `;

}


// ============================================
// SHOW EMPTY
// ============================================

function showEmpty() {

    if (!recentNotesList) {

        return;

    }


    recentNotesList.innerHTML = `
        <div class="recent-notes-empty">
            No recent notes yet.
        </div>
    `;

}


// ============================================
// SHOW ERROR
// ============================================

function showError() {

    if (!recentNotesList) {

        return;

    }


    recentNotesList.innerHTML = `
        <div class="recent-notes-error">
            Could not load recent notes.
        </div>
    `;

}


// ============================================
// CREATE RECENT NOTE
// ============================================

function createRecentNote(
    note
) {

    const link =
        document.createElement(
            "a"
        );


    link.className =
        "recent-note-link";


    link.href =
        `notes.php?id=${encodeURIComponent(note.id)}`;


    // ========================================
    // TITLE
    // ========================================

    const title =
        document.createElement(
            "span"
        );


    title.className =
        "recent-note-title";


    title.textContent =
        note.title ||
        "Untitled Note";


    // ========================================
    // DATE
    // ========================================

    const date =
        document.createElement(
            "span"
        );


    date.className =
        "recent-note-date";


    date.textContent =
        formatNoteDate(
            note.updatedAt ||
            note.createdAt
        );


    // ========================================
    // ADD
    // ========================================

    link.appendChild(
        title
    );

    link.appendChild(
        date
    );


    return link;

}


// ============================================
// LOAD RECENT NOTES
// ============================================

function loadRecentNotes(
    user
) {

    if (!recentNotesList) {

        return;

    }


    showLoading();


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

            limit(5)
        );


    onSnapshot(
        notesQuery,

        function (snapshot) {

            recentNotesList.innerHTML =
                "";


            if (
                snapshot.empty
            ) {

                showEmpty();

                return;

            }


            snapshot.forEach(
                function (
                    documentSnapshot
                ) {

                    const note =
                        {
                            id:
                                documentSnapshot.id,

                            ...documentSnapshot.data()
                        };


                    const item =
                        createRecentNote(
                            note
                        );


                    recentNotesList.appendChild(
                        item
                    );

                }
            );

        },

        function (error) {

            console.error(
                "Recent Notes error:",
                error
            );


            showError();

        }
    );

}


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,

    function (user) {

        if (!user) {

            showEmpty();

            return;

        }


        loadRecentNotes(
            user
        );

    }
);