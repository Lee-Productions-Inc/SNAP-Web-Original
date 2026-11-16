// ============================================
// SNAP — RECENTLY DELETED
// FIREBASE FIRESTORE VERSION
// ============================================

import {
    auth,
    db
} from "../firebase/firebase.js";


import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    deleteDoc,
    doc,
    getDocsFromServer,
    writeBatch,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


/* ============================================
   DOM ELEMENTS
============================================ */

const deletedNotesGrid =
    document.getElementById(
        "deletedNotesGrid"
    );


const deletedLoading =
    document.getElementById(
        "deletedLoading"
    );


const deletedEmpty =
    document.getElementById(
        "deletedEmpty"
    );


const deletedSearch =
    document.getElementById(
        "deletedSearch"
    );


const emptyTrashButton =
    document.getElementById(
        "emptyTrashButton"
    );


const deletedStatus =
    document.getElementById(
        "deletedStatus"
    );


const deletedActionOverlay =
    document.getElementById(
        "deletedActionOverlay"
    );


const deletedModalIcon =
    document.getElementById(
        "deletedModalIcon"
    );


const deletedModalTitle =
    document.getElementById(
        "deletedModalTitle"
    );


const deletedModalMessage =
    document.getElementById(
        "deletedModalMessage"
    );


const confirmDeletedAction =
    document.getElementById(
        "confirmDeletedAction"
    );


const cancelDeletedAction =
    document.getElementById(
        "cancelDeletedAction"
    );


const closeDeletedModal =
    document.getElementById(
        "closeDeletedModal"
    );


/* ============================================
   STATE
============================================ */

let currentUser = null;

let deletedNotes = [];

let deletedTasks = [];

let deletedItems = [];

let unsubscribeNotes = null;

let unsubscribeTasks = null;

let pendingAction = null;


/* ============================================
   FIRESTORE PATH
============================================ */

function getNotesCollection() {

    if (!currentUser) {

        return null;

    }


    return collection(
        db,
        "users",
        currentUser.uid,
        "notes"
    );

}


function getTasksCollection() {

    if (!currentUser) {

        return null;

    }


    return collection(
        db,
        "users",
        currentUser.uid,
        "tasks"
    );

}


/* ============================================
   TIMESTAMP
============================================ */

function getTimestampTime(
    timestamp
) {

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


/* ============================================
   DATE FORMAT
============================================ */

function formatDeletedDate(
    timestamp
) {

    if (!timestamp) {

        return "Recently deleted";

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

        return "Recently deleted";

    }

}


/* ============================================
   STRIP HTML
============================================ */

function stripHTML(
    html
) {

    const temp =
        document.createElement(
            "div"
        );


    temp.innerHTML =
        html || "";


    return temp.innerText
        .replace(
            /\s+/g,
            " "
        )
        .trim();

}


/* ============================================
   GET NOTE PREVIEW
============================================ */

function getItemTitle(
    item
) {

    if (!item) {
        return "Untitled";
    }

    if (item.type === "task") {
        return item.title || "Untitled Task";
    }

    return item.title || "Untitled Note";

}


function getItemPreview(
    item
) {

    if (!item) {
        return "";
    }

    if (item.type === "task") {

        const description =
            item.description
                ? item.description
                    .replace(
                        /\s+/g,
                        " "
                    )
                    .trim()
                : "";

        if (description) {
            return description;
        }

        return item.category
            ? `Category: ${item.category}`
            : "No description";

    }

    if (
        item.plainText &&
        item.plainText.trim()
    ) {

        return item.plainText
            .replace(
                /\s+/g,
                " "
            )
            .trim();

    }


    return stripHTML(
        item.content || ""
    );

}


/* ============================================
   ESCAPE HTML
============================================ */

function escapeHTML(
    value
) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================
   SET STATUS
============================================ */

function setStatus(
    message,
    type = ""
) {

    if (!deletedStatus) {

        return;

    }


    deletedStatus.textContent =
        message;


    deletedStatus.className =
        "deleted-status";


    if (type) {

        deletedStatus.classList.add(
            type
        );

    }


    if (message) {

        window.clearTimeout(
            setStatus.timeout
        );


        setStatus.timeout =
            window.setTimeout(
                function () {

                    deletedStatus.textContent =
                        "";

                    deletedStatus.className =
                        "deleted-status";

                },
                3500
            );

    }

}


/* ============================================
   CLOSE MODAL
============================================ */

function closeActionModal() {

    if (!deletedActionOverlay) {

        return;

    }


    deletedActionOverlay.classList.remove(
        "is-visible"
    );


    deletedActionOverlay.setAttribute(
        "aria-hidden",
        "true"
    );


    pendingAction = null;


    if (confirmDeletedAction) {

        confirmDeletedAction.disabled =
            false;

    }

}


/* ============================================
   OPEN MODAL
============================================ */

function openActionModal(
    action,
    item = null
) {

    pendingAction = {
        type: action,
        item: item
    };

    const itemType =
        item && item.type === "task"
            ? "task"
            : "note";

    const itemTitle =
        getItemTitle(item);


    if (
        action ===
        "restore"
    ) {

        deletedModalIcon.textContent =
            "↩";

        deletedModalTitle.textContent =
            `Restore ${itemType}?`;

        deletedModalMessage.textContent =
            item
                ? `Restore "${itemTitle}" back to your ${itemType === "task" ? "tasks" : "notes"}?`
                : `Restore this ${itemType} back to your ${itemType === "task" ? "tasks" : "notes"}?`;

        confirmDeletedAction.textContent =
            "Restore";

        confirmDeletedAction.classList.add(
            "restore-mode"
        );

    }
    else if (
        action ===
        "permanent"
    ) {

        deletedModalIcon.textContent =
            "🗑";

        deletedModalTitle.textContent =
            "Delete permanently?";

        deletedModalMessage.textContent =
            item
                ? `"${itemTitle}" will be permanently deleted. This cannot be undone.`
                : `This ${itemType} will be permanently deleted. This cannot be undone.`;

        confirmDeletedAction.textContent =
            "Delete Permanently";

        confirmDeletedAction.classList.remove(
            "restore-mode"
        );

    }
    else if (
        action ===
        "empty"
    ) {

        deletedModalIcon.textContent =
            "🗑";

        deletedModalTitle.textContent =
            "Empty Trash?";

        deletedModalMessage.textContent =
            `Permanently delete all ${deletedItems.length} deleted items? This cannot be undone.`;

        confirmDeletedAction.textContent =
            "Empty Trash";

        confirmDeletedAction.classList.remove(
            "restore-mode"
        );

    }


    deletedActionOverlay.classList.add(
        "is-visible"
    );


    deletedActionOverlay.setAttribute(
        "aria-hidden",
        "false"
    );


    window.setTimeout(
        function () {

            confirmDeletedAction.focus();

        },
        50
    );

}


/* ============================================
   RESTORE NOTE
============================================ */

async function restoreNote(
    noteId
) {

    if (!currentUser) {

        setStatus(
            "Sign in to restore this note.",
            "error"
        );

        return false;

    }


    try {

        const noteReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "notes",
                noteId
            );


        await updateDoc(
            noteReference,
            {
                deleted: false,
                deletedAt: null,
                updatedAt: serverTimestamp()
            }
        );


        setStatus(
            "Note restored successfully.",
            "success"
        );

        return true;

    }
    catch (error) {

        console.error(
            "Error restoring note:",
            error
        );


        setStatus(
            "Unable to restore the note.",
            "error"
        );

        return false;

    }

}


async function restoreTask(
    taskId
) {

    if (!currentUser) {

        setStatus(
            "Sign in to restore this task.",
            "error"
        );

        return false;

    }


    try {

        const taskReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "tasks",
                taskId
            );


        await updateDoc(
            taskReference,
            {
                deleted: false,
                deletedAt: null,
                updatedAt: serverTimestamp()
            }
        );


        setStatus(
            "Task restored successfully.",
            "success"
        );

        return true;

    }
    catch (error) {

        console.error(
            "Error restoring task:",
            error
        );


        setStatus(
            "Unable to restore the task.",
            "error"
        );

        return false;

    }

}


/* ============================================
   DELETE NOTE PERMANENTLY
============================================ */

async function permanentlyDeleteNote(
    noteId
) {

    if (!currentUser) {

        setStatus(
            "Sign in to delete this note.",
            "error"
        );

        return false;

    }


    try {

        const noteReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "notes",
                noteId
            );


        await deleteDoc(
            noteReference
        );


        setStatus(
            "Note permanently deleted.",
            "success"
        );

        return true;

    }
    catch (error) {

        console.error(
            "Error permanently deleting note:",
            error
        );


        setStatus(
            "Unable to permanently delete the note.",
            "error"
        );

        return false;

    }

}


async function permanentlyDeleteTask(
    taskId
) {

    if (!currentUser) {

        setStatus(
            "Sign in to delete this task.",
            "error"
        );

        return false;

    }


    try {

        const taskReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "tasks",
                taskId
            );


        await deleteDoc(
            taskReference
        );


        setStatus(
            "Task permanently deleted.",
            "success"
        );

        return true;

    }
    catch (error) {

        console.error(
            "Error permanently deleting task:",
            error
        );

        alert(
            "Unable to permanently delete the task.\n\n" +
            "Error code: " + (error.code || "unknown") +
            "\nMessage: " + (error.message || "No details available")
        );

        setStatus(
            "Unable to permanently delete the task.",
            "error"
        );

        return false;

    }

}


/* ============================================
   EMPTY TRASH
============================================ */

async function emptyTrash() {

    if (!currentUser) {

        setStatus(
            "Sign in to empty the trash.",
            "error"
        );

        return false;

    }


    const userUid =
        currentUser.uid;

    const notesCollection =
        getNotesCollection();

    const tasksCollection =
        getTasksCollection();


    if (
        !notesCollection ||
        !tasksCollection
    ) {

        setStatus(
            "Unable to access the trash.",
            "error"
        );

        return false;

    }

    const originalButtonText =
        emptyTrashButton
            ? emptyTrashButton.textContent
            : "";


    if (emptyTrashButton) {

        emptyTrashButton.disabled =
            true;

        emptyTrashButton.textContent =
            "Emptying...";

    }


    try {

        const [notesSnapshot, tasksSnapshot] =
            await Promise.all([
                getDocsFromServer(
                    query(
                        notesCollection,
                        where(
                            "deleted",
                            "==",
                            true
                        )
                    )
                ),
                getDocsFromServer(
                    query(
                        tasksCollection,
                        where(
                            "deleted",
                            "==",
                            true
                        )
                    )
                )
            ]);


        const taskDocumentSnapshots =
            tasksSnapshot.docs;

        const noteDocumentSnapshots =
            notesSnapshot.docs;

        const documentsToDelete = [
            ...taskDocumentSnapshots,
            ...noteDocumentSnapshots
        ];

        const batchSize = 450;


        for (
            let index = 0;
            index < documentsToDelete.length;
            index += batchSize
        ) {

            const batch =
                writeBatch(db);

            documentsToDelete
                .slice(index, index + batchSize)
                .forEach(
                    function (documentSnapshot) {

                        batch.delete(
                            documentSnapshot.ref
                        );

                    }
                );

            await batch.commit();

        }

        if (
            !currentUser ||
            currentUser.uid !== userUid
        ) {

            return true;

        }


        const deletedTaskIds =
            new Set(
                taskDocumentSnapshots.map(
                    function (item) {

                        return item.id;

                    }
                )
            );

        const deletedNoteIds =
            new Set(
                noteDocumentSnapshots.map(
                    function (item) {

                        return item.id;

                    }
                )
            );

        deletedTasks =
            deletedTasks.filter(
                function (task) {

                    return !deletedTaskIds.has(
                        task.id
                    );

                }
            );

        deletedNotes =
            deletedNotes.filter(
                function (note) {

                    return !deletedNoteIds.has(
                        note.id
                    );

                }
            );

        mergeDeletedItems();

        if (documentsToDelete.length) {

            setStatus(
                "Trash emptied successfully.",
                "success"
            );

        }
        else {

            setStatus(
                "Trash is already empty.",
                "success"
            );

        }

        return true;

    }
    catch (error) {

        console.error(
            "Error emptying Recently Deleted:",
            error
        );

        alert(
            "Unable to empty Recently Deleted.\n\n" +
            "Error code: " + (error.code || "unknown") +
            "\nMessage: " + (error.message || "No details available")
        );

        setStatus(
            "Unable to empty the trash.",
            "error"
        );

        return false;

    }
    finally {

        if (emptyTrashButton) {

            emptyTrashButton.textContent =
                originalButtonText;

            emptyTrashButton.disabled =
                deletedItems.length === 0;

        }

    }

}


/* ============================================
   CREATE DELETED ITEM CARD
============================================ */

function createDeletedItemCard(
    item
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "deleted-note-card";


    const isTask =
        item.type === "task";


    const top =
        document.createElement(
            "div"
        );


    top.className =
        "deleted-note-card-top";


    const icon =
        document.createElement(
            "div"
        );


    icon.className =
        "deleted-note-icon";


    const iconImage =
        document.createElement(
            "img"
        );


    iconImage.src =
        isTask
            ? "../../../assets/main icons/check-square.svg"
            : "../../../assets/file-text.svg";


    iconImage.alt =
        "";


    icon.appendChild(
        iconImage
    );


    const menuButton =
        document.createElement(
            "button"
        );


    menuButton.type =
        "button";


    menuButton.className =
        "deleted-note-menu";


    menuButton.textContent =
        "⋮";


    menuButton.setAttribute(
        "aria-label",
        isTask ? "Task actions" : "Note actions"
    );


    menuButton.addEventListener(
        "click",
        function () {

            openActionModal(
                "permanent",
                item
            );

        }
    );


    top.appendChild(
        icon
    );


    top.appendChild(
        menuButton
    );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "deleted-note-title";


    title.textContent =
        getItemTitle(item);


    const preview =
        document.createElement(
            "p"
        );


    preview.className =
        "deleted-note-preview";


    const previewText =
        getItemPreview(item);


    preview.textContent =
        previewText
            ? previewText.substring(
                0,
                180
            )
            : isTask
                ? "No description"
                : "No content";


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "deleted-note-meta";


    const metaText =
        document.createElement(
            "span"
        );


    const typeLabel =
        isTask
            ? "Task"
            : "Note";


    metaText.textContent =
        `${typeLabel} • Deleted ${formatDeletedDate(
            item.deletedAt
        )}`;


    meta.appendChild(
        metaText
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "deleted-note-actions";


    const restoreButton =
        document.createElement(
            "button"
        );


    restoreButton.type =
        "button";


    restoreButton.className =
        "deleted-restore-button";


    restoreButton.textContent =
        "Restore";


    restoreButton.addEventListener(
        "click",
        function () {

            openActionModal(
                "restore",
                item
            );

        }
    );


    const permanentButton =
        document.createElement(
            "button"
        );


    permanentButton.type =
        "button";


    permanentButton.className =
        "deleted-permanent-button";


    permanentButton.textContent =
        "Delete Permanently";


    permanentButton.addEventListener(
        "click",
        function () {

            openActionModal(
                "permanent",
                item
            );

        }
    );


    actions.appendChild(
        restoreButton
    );


    actions.appendChild(
        permanentButton
    );


    card.appendChild(
        top
    );


    card.appendChild(
        title
    );


    card.appendChild(
        preview
    );


    card.appendChild(
        meta
    );


    card.appendChild(
        actions
    );


    return card;

}


/* ============================================
   RENDER NOTES
============================================ */

function renderDeletedNotes() {

    if (!deletedNotesGrid) {

        return;

    }


    const search =
        deletedSearch
            ? deletedSearch.value
                .trim()
                .toLowerCase()
            : "";


    let visibleItems =
        deletedItems.slice();


    if (search) {

        visibleItems =
            visibleItems.filter(
                function (item) {

                    const title =
                        getItemTitle(item)
                            .toLowerCase();


                    const content =
                        getItemPreview(item)
                            .toLowerCase();


                    return (
                        title.includes(
                            search
                        ) ||
                        content.includes(
                            search
                        )
                    );

                }
            );

    }


    deletedNotesGrid.innerHTML =
        "";


    if (deletedLoading) {

        deletedLoading.style.display =
            "none";

    }


    if (
        deletedItems.length ===
        0
    ) {

        deletedEmpty.hidden =
            false;

        deletedNotesGrid.style.display =
            "none";

        if (emptyTrashButton) {

            emptyTrashButton.disabled =
                true;

        }

        return;

    }


    if (
        visibleItems.length ===
        0
    ) {

        deletedEmpty.hidden =
            true;

        deletedNotesGrid.style.display =
            "grid";


        const noResults =
            document.createElement(
                "div"
            );


        noResults.className =
            "deleted-error";


        noResults.style.gridColumn =
            "1 / -1";


        noResults.innerHTML = `
            <div class="deleted-error-icon">⌕</div>
            <strong>No deleted items found</strong>
            <span>Try a different search term.</span>
        `;


        deletedNotesGrid.appendChild(
            noResults
        );


        if (emptyTrashButton) {

            emptyTrashButton.disabled =
                false;

        }

        return;

    }


    deletedEmpty.hidden =
        true;


    deletedNotesGrid.style.display =
        "grid";


    if (emptyTrashButton) {

        emptyTrashButton.disabled =
            false;

    }


    visibleItems.forEach(
        function (item) {

            const card =
                createDeletedItemCard(
                    item
                );


            deletedNotesGrid.appendChild(
                card
            );

        }
    );

}


/* ============================================
   LISTEN TO DELETED NOTES
============================================ */

function mergeDeletedItems() {

    deletedItems = [
        ...deletedNotes,
        ...deletedTasks
    ].sort(
        function (
            a,
            b
        ) {

            return (
                getTimestampTime(
                    b.deletedAt
                ) -
                getTimestampTime(
                    a.deletedAt
                )
            );

        }
    );


    renderDeletedNotes();

}


function listenToDeletedNotes(
    uid
) {

    if (unsubscribeNotes) {

        unsubscribeNotes();

        unsubscribeNotes =
            null;

    }


    if (unsubscribeTasks) {

        unsubscribeTasks();

        unsubscribeTasks =
            null;

    }


    const notesCollection =
        collection(
            db,
            "users",
            uid,
            "notes"
        );

    const tasksCollection =
        collection(
            db,
            "users",
            uid,
            "tasks"
        );


    const notesQuery =
        query(
            notesCollection,
            where(
                "deleted",
                "==",
                true
            )
        );

    const tasksQuery =
        query(
            tasksCollection,
            where(
                "deleted",
                "==",
                true
            )
        );


    unsubscribeNotes =
        onSnapshot(
            notesQuery,
            function (snapshot) {

                deletedNotes =
                    snapshot.docs.map(
                        function (
                            documentSnapshot
                        ) {

                            return {
                                type: "note",
                                id: documentSnapshot.id,
                                ...documentSnapshot.data()
                            };

                        }
                    );

                mergeDeletedItems();

            },
            function (error) {

                console.error(
                    "Recently Deleted notes error:",
                    error
                );


                if (deletedLoading) {

                    deletedLoading.style.display =
                        "none";

                }


                if (deletedNotesGrid) {

                    deletedNotesGrid.innerHTML =
                        `
                        <div class="deleted-error"
                             style="grid-column:1 / -1;">

                            <div class="deleted-error-icon">
                                ⚠
                            </div>

                            <strong>
                                Could not load Recently Deleted
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

                setStatus(
                    `Unable to load deleted notes. ${error.message || "Please try again."}`,
                    "error"
                );

            }
        );


    unsubscribeTasks =
        onSnapshot(
            tasksQuery,
            function (snapshot) {

                deletedTasks =
                    snapshot.docs.map(
                        function (
                            documentSnapshot
                        ) {

                            return {
                                type: "task",
                                id: documentSnapshot.id,
                                ...documentSnapshot.data()
                            };

                        }
                    );

                mergeDeletedItems();

            },
            function (error) {

                console.error(
                    "Recently Deleted tasks error:",
                    error
                );

                setStatus(
                    `Unable to load deleted tasks. ${error.message || "Please try again."}`,
                    "error"
                );


                if (deletedLoading) {

                    deletedLoading.style.display =
                        "none";

                }

            }
        );

}


/* ============================================
   SEARCH
============================================ */

if (deletedSearch) {

    deletedSearch.addEventListener(
        "input",
        function () {

            renderDeletedNotes();

        }
    );

}


/* ============================================
   EMPTY TRASH BUTTON
============================================ */

if (emptyTrashButton) {

    emptyTrashButton.addEventListener(
        "click",
        function () {

            if (
                deletedItems.length ===
                0
            ) {

                return;

            }


            openActionModal(
                "empty"
            );

        }
    );

}


/* ============================================
   CONFIRM MODAL ACTION
============================================ */

if (confirmDeletedAction) {

    confirmDeletedAction.addEventListener(
        "click",
        async function () {

            if (!pendingAction) {

                return;

            }


            const action =
                pendingAction.type;


            const item =
                pendingAction.item;


            confirmDeletedAction.disabled =
                true;

            let actionSucceeded = false;


            if (
                action ===
                "restore"
            ) {

                if (
                    item &&
                    item.type ===
                    "task"
                ) {

                    actionSucceeded = await restoreTask(
                        item.id
                    );

                }
                else {

                    actionSucceeded = await restoreNote(
                        item.id
                    );

                }

            }
            else if (
                action ===
                "permanent"
            ) {

                if (
                    item &&
                    item.type ===
                    "task"
                ) {

                    actionSucceeded = await permanentlyDeleteTask(
                        item.id
                    );

                }
                else {

                    actionSucceeded = await permanentlyDeleteNote(
                        item.id
                    );

                }

            }
            else if (
                action ===
                "empty"
            ) {

                actionSucceeded = await emptyTrash();

            }


            if (actionSucceeded) {

                closeActionModal();

            }
            else {

                confirmDeletedAction.disabled =
                    false;

                deletedModalMessage.textContent =
                    deletedStatus.textContent ||
                    "The action could not be completed. Please try again.";

            }

        }
    );

}


/* ============================================
   CLOSE MODAL BUTTONS
============================================ */

if (cancelDeletedAction) {

    cancelDeletedAction.addEventListener(
        "click",
        closeActionModal
    );

}


if (closeDeletedModal) {

    closeDeletedModal.addEventListener(
        "click",
        closeActionModal
    );

}


/* ============================================
   CLICK OUTSIDE MODAL
============================================ */

if (deletedActionOverlay) {

    deletedActionOverlay.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                deletedActionOverlay
            ) {

                closeActionModal();

            }

        }
    );

}


/* ============================================
   ESCAPE KEY
============================================ */

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeActionModal();

        }

    }
);


/* ============================================
   AUTH STATE
============================================ */

onAuthStateChanged(
    auth,
    function (user) {

        currentUser =
            user;

        deletedNotes = [];
        deletedTasks = [];
        deletedItems = [];
        closeActionModal();
        renderDeletedNotes();


        if (!user) {

            if (unsubscribeNotes) {

                unsubscribeNotes();

                unsubscribeNotes =
                    null;

            }

            if (unsubscribeTasks) {

                unsubscribeTasks();

                unsubscribeTasks =
                    null;

            }

            if (deletedLoading) {

                deletedLoading.style.display =
                    "none";

            }


            renderDeletedNotes();


            if (emptyTrashButton) {

                emptyTrashButton.disabled =
                    true;

            }


            return;

        }


        listenToDeletedNotes(
            user.uid
        );

    }
);