// ============================================
// SNAP DASHBOARD
// FIREBASE FIRESTORE VERSION
// TASKS + NOTES
// ============================================

import { auth, db } from "../firebase/firebase.js";

import {
    collection,
    onSnapshot,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ============================================
// STATE
// ============================================

let tasks = [];
let currentUser = null;
let unsubscribeTasks = null;


// ============================================
// ELEMENTS
// ============================================

const notesGrid =
    document.querySelector(".notes-grid");

const recentNotes =
    document.querySelector(".recent-notes");


// ============================================
// TODAY
// ============================================

function getTodayDate() {

    const today = new Date();

    const year =
        today.getFullYear();

    const month =
        String(today.getMonth() + 1)
            .padStart(2, "0");

    const day =
        String(today.getDate())
            .padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// ============================================
// OVERDUE
// ============================================

function isOverdue(task) {

    if (task.completed === true) {
        return false;
    }

    if (!task.dueDate) {
        return false;
    }

    if (task.dueTime) {

        const dueDateTime =
            new Date(
                `${task.dueDate}T${task.dueTime}:00`
            );

        return dueDateTime < new Date();
    }

    const dueDate =
        new Date(
            `${task.dueDate}T23:59:59`
        );

    return dueDate < new Date();
}


// ============================================
// TASK COUNTS
// ============================================

function getTaskCounts() {

    const today =
        getTodayDate();

    let todayCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;

    tasks.forEach(function (task) {

        if (task.completed === true) {

            completedCount++;

            return;
        }

        if (task.dueDate === today) {

            todayCount++;
        }

        if (!isOverdue(task)) {

            inProgressCount++;
        }

    });

    return {
        today: todayCount,
        inProgress: inProgressCount,
        completed: completedCount
    };
}


// ============================================
// UPDATE DASHBOARD TASK COUNTS
// ============================================

function updateDashboard() {

    const counts =
        getTaskCounts();

    const cards = [
        {
            selector: ".today-card",
            value: counts.today
        },
        {
            selector: ".progress-card",
            value: counts.inProgress
        },
        {
            selector: ".completed-card",
            value: counts.completed
        }
    ];

    cards.forEach(({ selector, value }) => {
        const card =
            document.querySelector(selector);

        if (!card) {
            return;
        }

        const count =
            card.querySelector(".status-count");

        if (count) {
            count.textContent = String(value);
        }

        card.classList.toggle(
            "has-activity",
            Number(value) > 0
        );
    });
}


// ============================================
// TASK FIRESTORE LISTENER
// ============================================

function listenToTasks(uid) {

    if (unsubscribeTasks) {

        unsubscribeTasks();

        unsubscribeTasks = null;
    }


    const tasksCollection =
        collection(
            db,
            "users",
            uid,
            "tasks"
        );


    unsubscribeTasks =
        onSnapshot(
            tasksCollection,

            function (snapshot) {

                tasks =
                    snapshot.docs.map(
                        function (documentSnapshot) {

                            return {
                                id:
                                    documentSnapshot.id,

                                ...documentSnapshot.data()
                            };

                        }
                    );


                updateDashboard();
            },

            function (error) {

                console.error(
                    "Dashboard task error:",
                    error
                );

                tasks = [];

                updateDashboard();
            }
        );
}


// ============================================
// NOTE DATE
// ============================================

function formatNoteDate(timestamp) {

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
// TIMESTAMP
// ============================================

function getTimestampTime(timestamp) {

    if (!timestamp) {

        return 0;
    }


    try {

        if (
            typeof timestamp.toMillis ===
            "function"
        ) {

            return timestamp.toMillis();
        }


        if (
            typeof timestamp.toDate ===
            "function"
        ) {

            return timestamp
                .toDate()
                .getTime();
        }


        const date =
            new Date(timestamp);


        const time =
            date.getTime();


        return Number.isNaN(time)
            ? 0
            : time;

    }
    catch (error) {

        return 0;
    }
}


// ============================================
// STRIP HTML
// ============================================

function stripHTML(html) {

    const temp =
        document.createElement(
            "div"
        );


    temp.innerHTML =
        html || "";


    return temp.innerText
        .replace(/\s+/g, " ")
        .trim();
}


// ============================================
// ESCAPE HTML
// ============================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ============================================
// CLOSE ALL NOTE MENUS
// ============================================

function closeAllDashboardNoteMenus() {

    document
        .querySelectorAll(
            ".dashboard-note-actions"
        )
        .forEach(function (menu) {

            menu.remove();
        });


    document
        .querySelectorAll(
            ".dashboard-note-card.menu-open"
        )
        .forEach(function (card) {

            card.classList.remove(
                "menu-open"
            );
        });
}


// ============================================
// CREATE MODAL
// ============================================

function createDashboardModal(content) {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "dashboard-note-modal-overlay";


    overlay.appendChild(
        content
    );


    document.body.appendChild(
        overlay
    );


    return overlay;
}


// ============================================
// RENAME NOTE
// ============================================

function renameDashboardNote(
    noteId,
    currentTitle
) {

    if (
        !currentUser ||
        !noteId
    ) {

        return;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "dashboard-note-modal";


    modal.innerHTML = `

        <div class="dashboard-note-modal-icon">
            ✏️
        </div>

        <h3>
            Rename note
        </h3>

        <p>
            Give your note a new name.
        </p>

        <label
            class="dashboard-note-modal-label"
            for="dashboard-rename-note-input"
        >
            Note title
        </label>

        <input
            id="dashboard-rename-note-input"
            class="dashboard-note-modal-input"
            type="text"
            maxlength="120"
            value="${escapeHTML(
                currentTitle ||
                "Untitled Note"
            )}"
        >

        <div
            class="dashboard-note-modal-message"
            id="dashboard-rename-note-message"
        ></div>

        <div
            class="dashboard-note-modal-buttons"
        >

            <button
                type="button"
                class="dashboard-note-modal-button dashboard-note-modal-cancel"
                data-dashboard-cancel
            >
                Cancel
            </button>

            <button
                type="button"
                class="dashboard-note-modal-button dashboard-note-modal-save"
                data-dashboard-save
            >
                Rename
            </button>

        </div>
    `;


    const overlay =
        createDashboardModal(
            modal
        );


    const input =
        modal.querySelector(
            "#dashboard-rename-note-input"
        );


    const message =
        modal.querySelector(
            "#dashboard-rename-note-message"
        );


    const cancelButton =
        modal.querySelector(
            "[data-dashboard-cancel]"
        );


    const saveButton =
        modal.querySelector(
            "[data-dashboard-save]"
        );


    async function submitRename() {

        const newTitle =
            input.value.trim();


        if (!newTitle) {

            message.textContent =
                "Please enter a note title.";

            input.focus();

            return;
        }


        saveButton.disabled =
            true;

        saveButton.textContent =
            "Renaming...";


        try {

            const noteRef =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "notes",
                    noteId
                );


            await updateDoc(
                noteRef,
                {
                    title:
                        newTitle,

                    updatedAt:
                        serverTimestamp()
                }
            );


            overlay.remove();

        }
        catch (error) {

            console.error(
                "SNAP DASHBOARD NOTE RENAME ERROR:",
                error
            );


            message.textContent =
                error.message ||
                "Could not rename the note.";


            saveButton.disabled =
                false;

            saveButton.textContent =
                "Rename";
        }
    }


    cancelButton.addEventListener(
        "click",
        function () {

            overlay.remove();
        }
    );


    saveButton.addEventListener(
        "click",
        submitRename
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {

                event.preventDefault();

                submitRename();
            }


            if (event.key === "Escape") {

                overlay.remove();
            }
        }
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                overlay
            ) {

                overlay.remove();
            }
        }
    );


    setTimeout(
        function () {

            input.focus();

            input.select();

        },
        50
    );
}


// ============================================
// DELETE NOTE
// ============================================

function deleteDashboardNote(
    noteId,
    noteTitle
) {

    if (
        !currentUser ||
        !noteId
    ) {

        return;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "dashboard-note-modal";


    modal.innerHTML = `

        <div
            class="dashboard-note-modal-icon delete"
        >
            🗑
        </div>

        <h3>
            Move to Recently Deleted?
        </h3>

        <p>
            <strong>
                ${escapeHTML(
                    noteTitle ||
                    "Untitled Note"
                )}
            </strong>
            will be moved to Recently Deleted.
            You can restore it later.
        </p>

        <div
            class="dashboard-note-modal-buttons"
        >

            <button
                type="button"
                class="dashboard-note-modal-button dashboard-note-modal-cancel"
                data-dashboard-delete-cancel
            >
                Cancel
            </button>

            <button
                type="button"
                class="dashboard-note-modal-button dashboard-note-modal-delete"
                data-dashboard-delete-confirm
            >
                Move to Trash
            </button>

        </div>
    `;


    const overlay =
        createDashboardModal(
            modal
        );


    const cancelButton =
        modal.querySelector(
            "[data-dashboard-delete-cancel]"
        );


    const deleteButton =
        modal.querySelector(
            "[data-dashboard-delete-confirm]"
        );


    async function confirmDelete() {

        deleteButton.disabled =
            true;

        deleteButton.textContent =
            "Moving...";


        try {

            const noteRef =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "notes",
                    noteId
                );


            await updateDoc(
                noteRef,
                {
                    deleted:
                        true,

                    deletedAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                }
            );


            overlay.remove();

        }
        catch (error) {

            console.error(
                "SNAP DASHBOARD NOTE DELETE ERROR:",
                error
            );


            deleteButton.disabled =
                false;

            deleteButton.textContent =
                "Move to Trash";


            alert(
                "Could not move this note to Recently Deleted.\n\n" +
                (
                    error.message ||
                    "Unknown error"
                )
            );
        }
    }


    cancelButton.addEventListener(
        "click",
        function () {

            overlay.remove();
        }
    );


    deleteButton.addEventListener(
        "click",
        confirmDelete
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                overlay
            ) {

                overlay.remove();
            }
        }
    );
}


// ============================================
// DUPLICATE NOTE
// ============================================

async function duplicateDashboardNote(
    noteId
) {

    if (
        !currentUser ||
        !noteId
    ) {

        return;
    }


    try {

        const noteRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "notes",
                noteId
            );


        const snapshot =
            await getDoc(
                noteRef
            );


        if (!snapshot.exists()) {

            alert(
                "This note no longer exists."
            );

            return;
        }


        const data =
            snapshot.data();


        if (
            data.deleted ===
            true
        ) {

            return;
        }


        const originalTitle =
            data.title ||
            "Untitled Note";


        await addDoc(
            collection(
                db,
                "users",
                currentUser.uid,
                "notes"
            ),
            {
                title:
                    `${originalTitle} Copy`,

                content:
                    data.content ||
                    "",

                plainText:
                    data.plainText ||
                    "",

                wordCount:
                    data.wordCount ||
                    0,

                folderId:
                    data.folderId ||
                    null,

                deleted:
                    false,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );

    }
    catch (error) {

        console.error(
            "SNAP DASHBOARD NOTE DUPLICATE ERROR:",
            error
        );


        alert(
            "Could not duplicate this note.\n\n" +
            (
                error.message ||
                "Unknown error"
            )
        );
    }
}


// ============================================
// NOTE ACTION MENU
// IMPORTANT:
// The menu is appended to BODY.
// This prevents it from being trapped
// underneath another note card.
// ============================================

function openDashboardNoteMenu(
    noteId,
    noteTitle,
    menuButton
) {

    closeAllDashboardNoteMenus();


    const card =
        menuButton.closest(
            ".dashboard-note-card"
        );


    if (card) {

        card.classList.add(
            "menu-open"
        );
    }


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "dashboard-note-actions";


    menu.innerHTML = `

        <button
            type="button"
            class="dashboard-note-action"
            data-dashboard-note-action="open"
        >
            <span class="dashboard-note-action-icon">
                📖
            </span>

            <span>
                Open
            </span>
        </button>

        <button
            type="button"
            class="dashboard-note-action"
            data-dashboard-note-action="rename"
        >
            <span class="dashboard-note-action-icon">
                ✏️
            </span>

            <span>
                Rename
            </span>
        </button>

        <button
            type="button"
            class="dashboard-note-action"
            data-dashboard-note-action="duplicate"
        >
            <span class="dashboard-note-action-icon">
                📄
            </span>

            <span>
                Duplicate
            </span>
        </button>

        <button
            type="button"
            class="dashboard-note-action delete"
            data-dashboard-note-action="delete"
        >
            <span class="dashboard-note-action-icon">
                🗑
            </span>

            <span>
                Delete
            </span>
        </button>
    `;


    /*
     * Append directly to BODY.
     * This removes the menu from the card's
     * stacking context completely.
     */
    document.body.appendChild(
        menu
    );


    /*
     * Position the menu using the
     * three-dot button's viewport position.
     */
    const buttonRect =
        menuButton.getBoundingClientRect();


    menu.style.visibility =
        "hidden";


    const menuRect =
        menu.getBoundingClientRect();


    const spacing = 7;

    let top =
        buttonRect.bottom +
        spacing;

    let left =
        buttonRect.right -
        menuRect.width;


    /*
     * If the menu would go below
     * the viewport, open it upward.
     */
    if (
        top +
        menuRect.height >
        window.innerHeight - 10
    ) {

        top =
            buttonRect.top -
            menuRect.height -
            spacing;
    }


    /*
     * Keep menu inside left/right
     * edges of the screen.
     */
    if (left < 10) {

        left = 10;
    }


    if (
        left +
        menuRect.width >
        window.innerWidth - 10
    ) {

        left =
            window.innerWidth -
            menuRect.width -
            10;
    }


    menu.style.left =
        `${left}px`;


    menu.style.top =
        `${top}px`;


    menu.style.visibility =
        "visible";


    menu.addEventListener(
        "click",
        async function (event) {

            event.stopPropagation();


            const button =
                event.target.closest(
                    "[data-dashboard-note-action]"
                );


            if (!button) {

                return;
            }


            const action =
                button.dataset
                    .dashboardNoteAction;


            closeAllDashboardNoteMenus();


            if (
                action ===
                "open"
            ) {

                window.location.href =
                    `notes/notes.php?id=${encodeURIComponent(
                        noteId
                    )}`;

                return;
            }


            if (
                action ===
                "rename"
            ) {

                renameDashboardNote(
                    noteId,
                    noteTitle
                );

                return;
            }


            if (
                action ===
                "duplicate"
            ) {

                await duplicateDashboardNote(
                    noteId
                );

                return;
            }


            if (
                action ===
                "delete"
            ) {

                deleteDashboardNote(
                    noteId,
                    noteTitle
                );
            }

        }
    );
}


// ============================================
// CREATE DASHBOARD NOTE CARD
// ============================================

function createNoteCard(
    noteId,
    note
) {

    /*
     * IMPORTANT:
     * This is now an ARTICLE instead of a BUTTON.
     *
     * The old version had:
     *
     * <button>
     *     ...
     *     <button>⋮</button>
     * </button>
     *
     * which is invalid HTML because buttons
     * cannot contain other buttons.
     */
    const card =
        document.createElement(
            "article"
        );


    card.className =
        "dashboard-note-card";


    card.setAttribute(
        "tabindex",
        "0"
    );


    card.setAttribute(
        "role",
        "link"
    );


    // ========================================
    // TITLE
    // ========================================

    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "dashboard-note-title";


    title.textContent =
        note.title ||
        "Untitled Note";


    // ========================================
    // PREVIEW
    // ========================================

    const preview =
        document.createElement(
            "p"
        );


    preview.className =
        "dashboard-note-preview";


    const plainText =
        note.plainText ||
        stripHTML(
            note.content ||
            ""
        );


    preview.textContent =
        plainText
            ? plainText.substring(
                0,
                120
            )
            : "No content";


    // ========================================
    // DATE
    // ========================================

    const date =
        document.createElement(
            "span"
        );


    date.className =
        "dashboard-note-date";


    date.textContent =
        formatNoteDate(
            note.updatedAt ||
            note.createdAt
        );


    // ========================================
    // THREE DOT MENU
    // ========================================

    const menuWrap =
        document.createElement(
            "div"
        );


    menuWrap.className =
        "dashboard-note-menu-wrap";


    const menuButton =
        document.createElement(
            "button"
        );


    menuButton.type =
        "button";


    menuButton.className =
        "dashboard-note-menu-button";


    menuButton.setAttribute(
        "aria-label",
        `Actions for ${
            note.title ||
            "Untitled Note"
        }`
    );


    menuButton.setAttribute(
        "aria-haspopup",
        "menu"
    );


    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );


    menuButton.innerHTML =
        "⋮";


    menuButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            event.stopPropagation();


            const existingMenu =
                document.querySelector(
                    ".dashboard-note-actions"
                );


            if (existingMenu) {

                closeAllDashboardNoteMenus();

                return;
            }


            openDashboardNoteMenu(
                noteId,
                note.title ||
                    "Untitled Note",
                menuButton
            );

        }
    );


    menuWrap.appendChild(
        menuButton
    );


    // ========================================
    // BUILD CARD
    // ========================================

    card.appendChild(
        title
    );


    card.appendChild(
        preview
    );


    card.appendChild(
        date
    );


    card.appendChild(
        menuWrap
    );


    // ========================================
    // OPEN NOTE
    // ========================================

    function openNote() {

        window.location.href =
            `notes/notes.php?id=${encodeURIComponent(
                noteId
            )}`;
    }


    card.addEventListener(
        "click",
        function (event) {

            /*
             * Don't open the note when the
             * three-dot button was clicked.
             */
            if (
                event.target.closest(
                    ".dashboard-note-menu-wrap"
                )
            ) {

                return;
            }


            openNote();
        }
    );


    card.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                openNote();
            }

        }
    );


    return card;
}


// ============================================
// EMPTY NOTES
// ============================================

function showEmptyNotes() {

    if (!notesGrid) {

        return;
    }


    notesGrid.innerHTML = `

        <div class="dashboard-notes-empty">

            <div
                class="dashboard-notes-empty-icon"
            >
                📝
            </div>

            <h3>
                No notes yet
            </h3>

            <p>
                Create your first note
                and it will appear here.
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


// ============================================
// UPDATE RECENT NOTES SIDEBAR
// ============================================

function updateRecentNotes(
    notes
) {

    if (!recentNotes) {

        return;
    }


    /*
     * Completely rebuild the sidebar.
     * This prevents old/static items from
     * getting mixed with the new ones.
     */
    recentNotes.innerHTML = "";


    const heading =
        document.createElement(
            "h2"
        );


    heading.textContent =
        "Recent Notes";


    recentNotes.appendChild(
        heading
    );


    const list =
        document.createElement(
            "div"
        );


    list.className =
        "recent-notes-list";


    recentNotes.appendChild(
        list
    );


    if (
        notes.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-recent";


        empty.textContent =
            "No recent notes";


        list.appendChild(
            empty
        );


        return;
    }


    notes
        .slice(0, 5)
        .forEach(
            function (note) {

                const item =
                    document.createElement(
                        "a"
                    );


                item.className =
                    "recent-note-item";


                item.href =
                    `notes/notes.php?id=${encodeURIComponent(
                        note.id
                    )}`;


                const title =
                    document.createElement(
                        "span"
                    );


                title.className =
                    "recent-note-title";


                title.textContent =
                    note.title ||
                    "Untitled Note";


                item.appendChild(
                    title
                );


                list.appendChild(
                    item
                );

            }
        );
}


// ============================================
// LOAD DASHBOARD NOTES
// ============================================

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


        const snapshot =
            await getDocs(
                notesRef
            );


        notesGrid.innerHTML =
            "";


        if (
            snapshot.empty
        ) {

            showEmptyNotes();

            updateRecentNotes([]);

            return;
        }


        const notes =
            snapshot.docs
                .map(
                    function (
                        documentSnapshot
                    ) {

                        return {
                            id:
                                documentSnapshot.id,

                            ...documentSnapshot.data()
                        };
                    }
                )
                .filter(
                    function (note) {

                        /*
                         * Recently Deleted notes
                         * must NOT appear on Dashboard.
                         */
                        return (
                            note.deleted !==
                            true
                        );
                    }
                );


        notes.sort(
            function (a, b) {

                const aTime =
                    getTimestampTime(
                        a.updatedAt ||
                        a.createdAt
                    );


                const bTime =
                    getTimestampTime(
                        b.updatedAt ||
                        b.createdAt
                    );


                return bTime - aTime;
            }
        );


        if (
            notes.length ===
            0
        ) {

            showEmptyNotes();

            updateRecentNotes([]);

            return;
        }


        // ========================================
        // DISPLAY DASHBOARD CARDS
        // ========================================

        const visibleNotes =
            notes.slice(
                0,
                6
            );


        visibleNotes.forEach(
            function (note) {

                const card =
                    createNoteCard(
                        note.id,
                        note
                    );


                notesGrid.appendChild(
                    card
                );
            }
        );


        // ========================================
        // SIDEBAR RECENT NOTES
        // ========================================

        updateRecentNotes(
            visibleNotes
        );

    }
    catch (error) {

        console.error(
            "SNAP DASHBOARD NOTES ERROR:",
            error
        );


        notesGrid.innerHTML = `

            <div
                class="dashboard-notes-error"
            >

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


// ============================================
// CLOSE MENU WHEN CLICKING OUTSIDE
// ============================================

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".dashboard-note-menu-wrap"
            ) &&
            !event.target.closest(
                ".dashboard-note-actions"
            )
        ) {

            closeAllDashboardNoteMenus();
        }
    }
);


// ============================================
// CLOSE MENU ON SCROLL / RESIZE
// ============================================

window.addEventListener(
    "scroll",
    function () {

        closeAllDashboardNoteMenus();
    },
    true
);


window.addEventListener(
    "resize",
    function () {

        closeAllDashboardNoteMenus();
    }
);


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,
    function (user) {

        currentUser =
            user;


        if (!user) {

            tasks = [];


            if (unsubscribeTasks) {

                unsubscribeTasks();

                unsubscribeTasks =
                    null;
            }


            updateDashboard();


            if (notesGrid) {

                showEmptyNotes();
            }


            if (recentNotes) {

                updateRecentNotes([]);
            }


            return;
        }


        listenToTasks(
            user.uid
        );


        loadDashboardNotes(
            user
        );

    }
);


/* ==========================================
   SNAP HOME UI REDESIGN
   ADD BELOW THE EXISTING dashboard.js CODE
========================================== */

const snapHomeUI = {
    notes: [],
    tasks: [],
    search: "",
    notesReady: false,
    unsubs: [],
    uid: null
};

const snapTaskArea = document.getElementById("homeTaskList");
const snapTaskTotal = document.getElementById("homeTaskCount");
const snapNotesTotal = document.getElementById("homeNotesCount");
const snapHomeSearch = document.getElementById("homeSearch");

function snapDueMillis(task) {
    if (!task.dueDate) return Infinity;

    const date = new Date(
        `${task.dueDate}T${task.dueTime || "23:59"}:59.999`
    );

    const time = date.getTime();
    return Number.isFinite(time) ? time : Infinity;
}

function snapPriority(task) {
    return task.priority === true ||
        task.isPriority === true ||
        ["high", "urgent", "priority"].includes(
            String(task.priority || "").toLowerCase()
        );
}

function snapRenderTaskOverview() {
    if (!snapTaskArea) return;

    const liveTasks = snapHomeUI.tasks.filter(
        task => task.deleted !== true
    );

    const today = new Date();

    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const counts = {
        today: liveTasks.filter(
            task => !task.completed && task.dueDate === todayKey
        ).length,

        progress: liveTasks.filter(
            task => !task.completed &&
            snapDueMillis(task) >= Date.now()
        ).length,

        completed: liveTasks.filter(
            task => task.completed === true
        ).length
    };

    for (const [selector, value] of [
        [".today-card", counts.today],
        [".progress-card", counts.progress],
        [".completed-card", counts.completed]
    ]) {
        const card = document.querySelector(selector);
        const count = card?.querySelector(".status-count");

        if (count) count.textContent = String(value);
        if (card) card.classList.toggle("has-activity", Number(value) > 0);
    }

    const active = liveTasks
        .filter(
            task => !task.completed &&
            (
                snapDueMillis(task) >= Date.now() ||
                snapPriority(task)
            )
        )
        .sort(
            (a, b) => snapDueMillis(a) - snapDueMillis(b)
        );

    if (snapTaskTotal) {
        snapTaskTotal.textContent = String(active.length);
    }

    snapTaskArea.replaceChildren();

    const matched = active.filter(
        task => !snapHomeUI.search ||
        [task.title, task.category, task.description]
            .join(" ")
            .toLowerCase()
            .includes(snapHomeUI.search)
    );

    if (!matched.length) {
        const message = document.createElement("p");
        message.className = "snap-overview-empty";

        message.textContent = snapHomeUI.search
            ? "No matching active or priority tasks."
            : "No tasks in progress or marked Priority";

        snapTaskArea.append(message);
        return;
    }

    matched.slice(0, 5).forEach(task => {
        const link = document.createElement("a");

        link.href =
            `tasks.php?task=${encodeURIComponent(task.id)}`;

        link.className = "snap-home-task-item";

        if (snapPriority(task)) {
            link.classList.add("snap-is-priority");
        }

        const name = document.createElement("strong");
        name.textContent = task.title || "Untitled task";

        const details = document.createElement("span");

        details.textContent = [
            task.category || "Task",
            task.dueDate ? `Due ${task.dueDate}` : ""
        ]
            .filter(Boolean)
            .join(" · ");

        link.append(name, details);

        if (snapPriority(task)) {
            const badge = document.createElement("small");

            badge.className = "snap-home-priority";
            badge.textContent = "★ Priority";

            link.append(badge);
        }

        snapTaskArea.append(link);
    });
}

/* NOTES RENDERING */

const snapNotesObserver = new MutationObserver(() => {
    if (!snapHomeUI.notesReady) return;

    snapNotesObserver.disconnect();
    snapRenderNotesOverview();

    if (notesGrid) {
        snapNotesObserver.observe(
            notesGrid,
            { childList: true }
        );
    }
});

function snapRenderNotesOverview() {
    if (!notesGrid) return;

    snapNotesObserver.disconnect();
    notesGrid.replaceChildren();

    if (snapNotesTotal) {
        snapNotesTotal.textContent = String(
            snapHomeUI.notes.length
        );
    }

    const matches = snapHomeUI.notes.filter(
        note => !snapHomeUI.search ||
        [
            note.title,
            note.plainText,
            stripHTML(note.content || "")
        ]
            .join(" ")
            .toLowerCase()
            .includes(snapHomeUI.search)
    );

    if (!matches.length) {
        if (
            snapHomeUI.notes.length === 0 &&
            !snapHomeUI.search
        ) {
            showEmptyNotes();
        } else {
            const empty = document.createElement("p");

            empty.className = "snap-overview-empty";
            empty.textContent = "No matching notes found.";

            notesGrid.append(empty);
        }
    } else {
        matches.slice(0, 6).forEach(note => {
            notesGrid.append(
                createNoteCard(note.id, note)
            );
        });
    }

    updateRecentNotes(snapHomeUI.notes);

    snapNotesObserver.observe(
        notesGrid,
        { childList: true }
    );
}

/* HOME SEARCH */

snapHomeSearch?.addEventListener("input", () => {
    snapHomeUI.search = snapHomeSearch.value
        .trim()
        .toLowerCase();

    snapRenderTaskOverview();

    if (snapHomeUI.notesReady) {
        snapRenderNotesOverview();
    }
});

document.getElementById("homeSearchShortcut")
    ?.addEventListener("click", () => {
        snapHomeSearch?.focus();
    });

/* FIRESTORE REAL-TIME CONNECTIONS */

onAuthStateChanged(auth, user => {
    snapHomeUI.unsubs.forEach(stop => stop());

    snapHomeUI.unsubs = [];
    snapHomeUI.uid = user?.uid || null;
    snapHomeUI.tasks = [];
    snapHomeUI.notes = [];
    snapHomeUI.notesReady = false;

    if (!user) {
        snapRenderTaskOverview();

        if (snapNotesTotal) {
            snapNotesTotal.textContent = "0";
        }

        return;
    }

    if (unsubscribeTasks) {
        unsubscribeTasks();
        unsubscribeTasks = null;
    }

    const uid = user.uid;

    snapHomeUI.unsubs.push(
        onSnapshot(
            collection(db, "users", uid, "tasks"),

            snapshot => {
                if (snapHomeUI.uid !== uid) return;

                snapHomeUI.tasks = snapshot.docs.map(
                    item => ({
                        id: item.id,
                        ...item.data()
                    })
                );

                snapRenderTaskOverview();
            },

            error => {
                console.error(
                    "Unable to load SNAP tasks:",
                    error
                );

                if (snapTaskArea) {
                    snapTaskArea.textContent =
                        "Could not load tasks. Please try again.";
                }
            }
        )
    );

    snapHomeUI.unsubs.push(
        onSnapshot(
            collection(db, "users", uid, "notes"),

            snapshot => {
                if (snapHomeUI.uid !== uid) return;

                snapHomeUI.notes = snapshot.docs
                    .map(item => ({
                        id: item.id,
                        ...item.data()
                    }))
                    .filter(note => note.deleted !== true)
                    .sort(
                        (a, b) =>
                            getTimestampTime(
                                b.updatedAt || b.createdAt
                            ) -
                            getTimestampTime(
                                a.updatedAt || a.createdAt
                            )
                    );

                snapHomeUI.notesReady = true;
                snapRenderNotesOverview();
            },

            error => {
                console.error(
                    "Unable to load SNAP notes:",
                    error
                );

                if (notesGrid) {
                    notesGrid.textContent =
                        "Could not load notes. Please try again.";
                }
            }
        )
    );
});
