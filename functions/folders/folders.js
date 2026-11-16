// ============================================
// SNAP FOLDERS
// FIREBASE FIRESTORE VERSION
// SNAP STYLE FOLDER MENUS
// ============================================

import { auth, db } from "../firebase/firebase.js";

import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ============================================
// STATE
// ============================================

let currentUser = null;
let folders = [];
let unsubscribeFolders = null;
let editMode = false;


// ============================================
// ELEMENTS
// ============================================

const folderCards =
    document.querySelector(".folder-cards");

const newFolderButton =
    document.querySelector(".new-folder-button");

const editButton =
    document.querySelector(".edit-button");


// ============================================
// CREATE EDIT MENU
// ============================================

function createEditMenu() {

    if (document.querySelector(".folder-edit-overlay")) {
        return;
    }

    const overlay =
        document.createElement("div");

    overlay.className =
        "folder-edit-overlay";

    overlay.innerHTML = `
        <div
            class="folder-edit-menu"
            role="dialog"
            aria-modal="true"
            aria-labelledby="folder-edit-title"
        >

            <div class="folder-edit-header">

                <div>

                    <span class="folder-edit-eyebrow">
                        FOLDERS
                    </span>

                    <h3 id="folder-edit-title">
                        Edit folders
                    </h3>

                    <p>
                        Rename or delete your folders.
                    </p>

                </div>

                <button
                    type="button"
                    class="folder-edit-close"
                    aria-label="Close edit folders"
                >
                    ×
                </button>

            </div>

            <div class="folder-edit-list"></div>

            <div class="folder-edit-footer">

                <button
                    type="button"
                    class="folder-edit-done"
                >
                    Done
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);


    const closeButton =
        overlay.querySelector(
            ".folder-edit-close"
        );

    const doneButton =
        overlay.querySelector(
            ".folder-edit-done"
        );


    closeButton.addEventListener(
        "click",
        closeEditMenu
    );


    doneButton.addEventListener(
        "click",
        closeEditMenu
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (event.target === overlay) {
                closeEditMenu();
            }

        }
    );


    renderEditMenu();

}


// ============================================
// RENDER EDIT MENU
// ============================================

function renderEditMenu() {

    const list =
        document.querySelector(
            ".folder-edit-list"
        );

    if (!list) {
        return;
    }


    list.innerHTML = "";


    if (folders.length === 0) {

        list.innerHTML = `
            <div class="folder-edit-empty">

                <div class="folder-edit-empty-icon">

                    <img
                        src="../../../assets/folder.svg"
                        alt=""
                    >

                </div>

                <strong>
                    No custom folders yet
                </strong>

                <span>
                    Create a folder first to rename or delete it.
                </span>

            </div>
        `;

        return;

    }


    folders.forEach(
        function (folder) {

            const item =
                document.createElement("div");

            item.className =
                "folder-edit-item";

            item.innerHTML = `
                <div class="folder-edit-item-info">

                    <span class="folder-edit-item-icon">

                        <img
                            src="../../../assets/folder.svg"
                            alt=""
                        >

                    </span>

                    <div class="folder-edit-item-text">

                        <strong>
                            ${escapeHTML(folder.name)}
                        </strong>

                        <span>
                            Custom folder
                        </span>

                    </div>

                </div>

                <div class="folder-edit-item-actions">

                    <button
                        type="button"
                        class="folder-rename-button"
                        data-folder-id="${escapeHTML(folder.id)}"
                    >
                        Rename
                    </button>

                    <button
                        type="button"
                        class="folder-delete-button"
                        data-folder-id="${escapeHTML(folder.id)}"
                    >
                        Delete
                    </button>

                </div>
            `;

            list.appendChild(item);

        }
    );


    list
        .querySelectorAll(
            ".folder-rename-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const folderId =
                            button.dataset.folderId;

                        openRenameModal(folderId);

                    }
                );

            }
        );


    list
        .querySelectorAll(
            ".folder-delete-button"
        )
        .forEach(
            function (button) {

                button.addEventListener(
                    "click",
                    function () {

                        const folderId =
                            button.dataset.folderId;

                        openDeleteModal(folderId);

                    }
                );

            }
        );

}


// ============================================
// OPEN EDIT MENU
// ============================================

function openEditMenu() {

    if (!currentUser) {

        alert("Please log in first.");

        return;

    }


    editMode = true;

    createEditMenu();


    const overlay =
        document.querySelector(
            ".folder-edit-overlay"
        );


    if (overlay) {

        requestAnimationFrame(
            function () {

                overlay.classList.add(
                    "is-visible"
                );

            }
        );

    }

}


// ============================================
// CLOSE EDIT MENU
// ============================================

function closeEditMenu() {

    const overlay =
        document.querySelector(
            ".folder-edit-overlay"
        );


    if (!overlay) {

        editMode = false;

        return;

    }


    overlay.classList.remove(
        "is-visible"
    );


    setTimeout(
        function () {

            overlay.remove();

            editMode = false;

        },
        180
    );

}


// ============================================
// RENAME MODAL
// ============================================

function openRenameModal(folderId) {

    const folder =
        folders.find(
            function (item) {

                return item.id === folderId;

            }
        );


    if (!folder) {
        return;
    }


    closeEditMenu();


    const overlay =
        document.createElement("div");


    overlay.className =
        "folder-action-overlay";


    overlay.innerHTML = `
        <div
            class="folder-action-modal"
            role="dialog"
            aria-modal="true"
        >

            <div class="folder-action-icon rename-icon">

                <img
                    src="../../../assets/folder.svg"
                    alt=""
                >

            </div>

            <h3>
                Rename folder
            </h3>

            <p>
                Enter a new name for
                <strong>
                    ${escapeHTML(folder.name)}
                </strong>.
            </p>

            <label class="folder-input-label">

                Folder name

                <input
                    type="text"
                    class="folder-name-input"
                    maxlength="60"
                    value="${escapeHTML(folder.name)}"
                    autocomplete="off"
                >

            </label>

            <div class="folder-action-buttons">

                <button
                    type="button"
                    class="folder-cancel-button"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="folder-save-button"
                >
                    Save changes
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(
        overlay
    );


    requestAnimationFrame(
        function () {

            overlay.classList.add(
                "is-visible"
            );

        }
    );


    const input =
        overlay.querySelector(
            ".folder-name-input"
        );

    const cancelButton =
        overlay.querySelector(
            ".folder-cancel-button"
        );

    const saveButton =
        overlay.querySelector(
            ".folder-save-button"
        );


    input.focus();
    input.select();


    cancelButton.addEventListener(
        "click",
        function () {

            closeActionModal(overlay);

        }
    );


    saveButton.addEventListener(
        "click",
        async function () {

            await renameFolder(
                folder,
                input.value,
                overlay
            );

        }
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {
                saveButton.click();
            }

            if (event.key === "Escape") {
                closeActionModal(overlay);
            }

        }
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (event.target === overlay) {
                closeActionModal(overlay);
            }

        }
    );

}


// ============================================
// RENAME FOLDER
// ============================================

async function renameFolder(
    folder,
    newName,
    overlay
) {

    const trimmedName =
        newName.trim();


    if (!trimmedName) {

        showModalMessage(
            overlay,
            "Please enter a folder name."
        );

        return;

    }


    if (trimmedName.length > 60) {

        showModalMessage(
            overlay,
            "Folder name must be 60 characters or less."
        );

        return;

    }


    const duplicate =
        folders.some(
            function (item) {

                return (
                    item.id !== folder.id &&
                    item.name.toLowerCase() ===
                    trimmedName.toLowerCase()
                );

            }
        );


    if (duplicate) {

        showModalMessage(
            overlay,
            "A folder with that name already exists."
        );

        return;

    }


    const folderReference =
        doc(
            db,
            "users",
            currentUser.uid,
            "folders",
            folder.id
        );


    const saveButton =
        overlay.querySelector(
            ".folder-save-button"
        );


    saveButton.disabled = true;
    saveButton.textContent = "Saving...";


    try {

        await updateDoc(
            folderReference,
            {
                name: trimmedName,
                updatedAt: serverTimestamp()
            }
        );


        closeActionModal(overlay);


        setTimeout(
            function () {
                openEditMenu();
            },
            200
        );


    } catch (error) {

        console.error(
            "Error renaming folder:",
            error
        );


        saveButton.disabled = false;
        saveButton.textContent = "Save changes";


        showModalMessage(
            overlay,
            "Unable to rename the folder."
        );

    }

}


// ============================================
// DELETE MODAL
// ============================================

function openDeleteModal(folderId) {

    const folder =
        folders.find(
            function (item) {

                return item.id === folderId;

            }
        );


    if (!folder) {
        return;
    }


    closeEditMenu();


    const overlay =
        document.createElement("div");


    overlay.className =
        "folder-action-overlay";


    overlay.innerHTML = `
        <div
            class="folder-action-modal delete-modal"
            role="dialog"
            aria-modal="true"
        >

            <div class="folder-action-icon delete-icon">

                <span>
                    ×
                </span>

            </div>

            <h3>
                Delete folder?
            </h3>

            <p>
                Are you sure you want to delete
                <strong>
                    ${escapeHTML(folder.name)}
                </strong>?
            </p>

            <span class="delete-warning">
                This removes the folder itself.
                Your notes will not be deleted.
            </span>

            <div class="folder-action-buttons">

                <button
                    type="button"
                    class="folder-cancel-button"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="folder-confirm-delete"
                >
                    Delete folder
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(overlay);


    requestAnimationFrame(
        function () {

            overlay.classList.add(
                "is-visible"
            );

        }
    );


    const cancelButton =
        overlay.querySelector(
            ".folder-cancel-button"
        );

    const deleteButton =
        overlay.querySelector(
            ".folder-confirm-delete"
        );


    cancelButton.addEventListener(
        "click",
        function () {

            closeActionModal(overlay);

        }
    );


    deleteButton.addEventListener(
        "click",
        async function () {

            await deleteFolder(
                folder,
                overlay
            );

        }
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (event.target === overlay) {
                closeActionModal(overlay);
            }

        }
    );

}


// ============================================
// DELETE FOLDER
// ============================================

async function deleteFolder(
    folder,
    overlay
) {

    const folderReference =
        doc(
            db,
            "users",
            currentUser.uid,
            "folders",
            folder.id
        );


    const deleteButton =
        overlay.querySelector(
            ".folder-confirm-delete"
        );


    deleteButton.disabled = true;
    deleteButton.textContent = "Deleting...";


    try {

        await deleteDoc(folderReference);

        closeActionModal(overlay);

    } catch (error) {

        console.error(
            "Error deleting folder:",
            error
        );


        deleteButton.disabled = false;
        deleteButton.textContent = "Delete folder";


        showModalMessage(
            overlay,
            "Unable to delete the folder."
        );

    }

}


// ============================================
// CREATE FOLDER MODAL
// ============================================

function openCreateFolderModal() {

    if (!currentUser) {

        alert("Please log in first.");

        return;

    }


    const overlay =
        document.createElement("div");


    overlay.className =
        "folder-action-overlay";


    overlay.innerHTML = `
        <div
            class="folder-action-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-folder-title"
        >

            <div class="folder-action-icon rename-icon">

                <img
                    src="../../../assets/folder.svg"
                    alt=""
                >

            </div>

            <h3 id="create-folder-title">
                Create new folder
            </h3>

            <p>
                Give your new folder a name to keep your notes organized.
            </p>

            <label class="folder-input-label">

                Folder name

                <input
                    type="text"
                    class="folder-name-input"
                    maxlength="60"
                    placeholder="e.g. School, Projects, Personal..."
                    autocomplete="off"
                >

            </label>

            <div class="folder-action-buttons">

                <button
                    type="button"
                    class="folder-cancel-button"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="folder-save-button"
                >
                    Create folder
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(overlay);


    requestAnimationFrame(
        function () {

            overlay.classList.add(
                "is-visible"
            );

        }
    );


    const input =
        overlay.querySelector(
            ".folder-name-input"
        );

    const cancelButton =
        overlay.querySelector(
            ".folder-cancel-button"
        );

    const saveButton =
        overlay.querySelector(
            ".folder-save-button"
        );


    setTimeout(
        function () {
            input.focus();
        },
        50
    );


    cancelButton.addEventListener(
        "click",
        function () {

            closeActionModal(overlay);

        }
    );


    saveButton.addEventListener(
        "click",
        async function () {

            await createFolder(
                input.value,
                overlay
            );

        }
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Enter") {
                saveButton.click();
            }

            if (event.key === "Escape") {
                closeActionModal(overlay);
            }

        }
    );


    overlay.addEventListener(
        "click",
        function (event) {

            if (event.target === overlay) {
                closeActionModal(overlay);
            }

        }
    );

}


// ============================================
// CREATE FOLDER
// ============================================

async function createFolder(
    folderName,
    overlay
) {

    const name =
        folderName.trim();


    if (!name) {

        showModalMessage(
            overlay,
            "Please enter a folder name."
        );

        return;

    }


    if (name.length > 60) {

        showModalMessage(
            overlay,
            "Folder name must be 60 characters or less."
        );

        return;

    }


    const duplicate =
        folders.some(
            function (folder) {

                return (
                    folder.name.toLowerCase() ===
                    name.toLowerCase()
                );

            }
        );


    if (duplicate) {

        showModalMessage(
            overlay,
            "A folder with that name already exists."
        );

        return;

    }


    const saveButton =
        overlay.querySelector(
            ".folder-save-button"
        );


    saveButton.disabled = true;
    saveButton.textContent = "Creating...";


    try {

        const foldersReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "folders"
            );


        await addDoc(
            foldersReference,
            {
                name: name,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );


        closeActionModal(overlay);


    } catch (error) {

        console.error(
            "Error creating folder:",
            error
        );


        saveButton.disabled = false;
        saveButton.textContent = "Create folder";


        showModalMessage(
            overlay,
            "Unable to create the folder. Please try again."
        );

    }

}


// ============================================
// CLOSE ACTION MODAL
// ============================================

function closeActionModal(
    overlay
) {

    overlay.classList.remove(
        "is-visible"
    );


    setTimeout(
        function () {

            if (overlay) {
                overlay.remove();
            }

        },
        180
    );

}


// ============================================
// MODAL MESSAGE
// ============================================

function showModalMessage(
    overlay,
    message
) {

    let messageElement =
        overlay.querySelector(
            ".folder-modal-message"
        );


    if (!messageElement) {

        messageElement =
            document.createElement("div");

        messageElement.className =
            "folder-modal-message";


        const modal =
            overlay.querySelector(
                ".folder-action-modal"
            );


        const buttons =
            overlay.querySelector(
                ".folder-action-buttons"
            );


        modal.insertBefore(
            messageElement,
            buttons
        );

    }


    messageElement.textContent =
        message;

}


// ============================================
// RENDER FOLDERS
// ============================================

function renderFolders() {

    if (!folderCards) {
        return;
    }


    // Clear the existing cards because
    // Firestore is the source of truth.
    folderCards.innerHTML = "";


    // ========================================
    // ALL NOTES
    // ========================================

    const allNotes =
        document.createElement("a");

    allNotes.className =
        "folder-card active-card";

    allNotes.href =
        "../dashboard.php";

    allNotes.setAttribute(
        "aria-label",
        "All notes folder"
    );

    allNotes.innerHTML = `
        <span class="folder-label">

            <img
                class="folder-icon"
                src="../../../assets/folder.svg"
                alt="Folder icon"
            >

            <strong>
                All notes
            </strong>

        </span>

        <span
            class="folder-arrow"
            aria-hidden="true"
        >
            ›
        </span>
    `;

    folderCards.appendChild(
        allNotes
    );


    // ========================================
    // UNCLASSIFIED
    // ========================================

    const unclassified =
        document.createElement("a");

    unclassified.className =
        "folder-card";

    unclassified.href =
        "unclassified.php";

    unclassified.setAttribute(
        "aria-label",
        "Unclassified folder"
    );

    unclassified.innerHTML = `
        <span class="folder-label">

            <img
                class="folder-icon"
                src="../../../assets/folder.svg"
                alt="Folder icon"
            >

            <strong>
                Unclassified
            </strong>

        </span>

        <span
            class="folder-arrow"
            aria-hidden="true"
        >
            ›
        </span>
    `;

    folderCards.appendChild(
        unclassified
    );


    // ========================================
    // USER FOLDERS
    // ========================================

    folders.forEach(
        function (folder) {

            const card =
                document.createElement("a");

            card.className =
                "folder-card";

            card.href =
                `folder.php?id=${encodeURIComponent(folder.id)}`;

            card.setAttribute(
                "aria-label",
                `${folder.name} folder`
            );

            card.innerHTML = `
                <span class="folder-label">

                    <img
                        class="folder-icon"
                        src="../../../assets/folder.svg"
                        alt="Folder icon"
                    >

                    <strong>
                        ${escapeHTML(folder.name)}
                    </strong>

                </span>

                <span
                    class="folder-arrow"
                    aria-hidden="true"
                >
                    ›
                </span>
            `;

            folderCards.appendChild(
                card
            );

        }
    );

}


// ============================================
// LISTEN TO FOLDERS
// ============================================

function listenToFolders(
    uid
) {

    if (unsubscribeFolders) {

        unsubscribeFolders();

        unsubscribeFolders = null;

    }


    const foldersReference =
        collection(
            db,
            "users",
            uid,
            "folders"
        );


    unsubscribeFolders =
        onSnapshot(
            foldersReference,

            function (snapshot) {

                folders =
                    snapshot.docs.map(
                        function (
                            documentSnapshot
                        ) {

                            return {

                                id:
                                    documentSnapshot.id,

                                ...documentSnapshot.data()

                            };

                        }
                    );


                folders.sort(
                    function (a, b) {

                        return (
                            getTimestampTime(
                                a.createdAt
                            )
                            -
                            getTimestampTime(
                                b.createdAt
                            )
                        );

                    }
                );


                renderFolders();


                if (
                    document.querySelector(
                        ".folder-edit-overlay"
                    )
                ) {

                    renderEditMenu();

                }

            },

            function (error) {

                console.error(
                    "SNAP Folders Firestore error:",
                    error
                );

            }
        );

}


// ============================================
// TIMESTAMP
// ============================================

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


// ============================================
// ESCAPE HTML
// ============================================

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


// ============================================
// BUTTONS
// ============================================

if (newFolderButton) {

    newFolderButton.addEventListener(
        "click",
        openCreateFolderModal
    );

}


if (editButton) {

    editButton.addEventListener(
        "click",
        openEditMenu
    );

}


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,

    function (user) {

        currentUser =
            user;


        if (!user) {

            folders = [];


            if (unsubscribeFolders) {

                unsubscribeFolders();

                unsubscribeFolders = null;

            }


            renderFolders();

            return;

        }


        listenToFolders(
            user.uid
        );

    }
);