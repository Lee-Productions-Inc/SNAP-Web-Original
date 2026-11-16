// ============================================================
// SNAP NOTES
// Fully functional note editor
// Firebase + Firestore
// ============================================================


// ============================================================
// FIREBASE
// ============================================================

import {
    initializeApp,
    getApps,
    getApp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================

const firebaseConfig = {

    apiKey:
        "AIzaSyDcoFVS7iOCqRjLrIye48aF1yC3rsPvzIo",

    authDomain:
        "snap-c1519.firebaseapp.com",

    projectId:
        "snap-c1519",

    storageBucket:
        "snap-c1519.firebasestorage.app",

    messagingSenderId:
        "521370478287",

    appId:
        "1:521370478287:web:67dd6cc5365e3a531a79ba",

    measurementId:
        "G-LFX734CDTD"

};


// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app =
    getApps().length > 0
        ? getApp()
        : initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const db =
    getFirestore(app);


// ============================================================
// ELEMENTS
// ============================================================

const titleInput =
    document.getElementById("note-title");

const editor =
    document.getElementById("note-editor");

const saveButton =
    document.getElementById("save-note");

const newNoteButton =
    document.getElementById("new-note");

const saveBadge =
    document.getElementById("save-badge");

const saveStatus =
    document.getElementById("save-status");

const wordTotal =
    document.getElementById("word-total");

const wordMeta =
    document.getElementById("note-word-meta");

const noteDate =
    document.getElementById("note-date");

const noteTime =
    document.getElementById("note-time");

const toolbar =
    document.getElementById("editor-toolbar");

const fontFamily =
    document.getElementById("font-family");

const fontSize =
    document.getElementById("font-size");

const lineSpacing =
    document.getElementById("line-spacing");

const checklistButton =
    document.getElementById("checklist-button");

const microphoneButton =
    document.getElementById("microphone-button");

const imageButton =
    document.getElementById("image-button");

const imageInput =
    document.getElementById("image-input");

const moreMenu =
    document.getElementById("more-menu");

const zoomOut =
    document.getElementById("zoom-out");

const zoomIn =
    document.getElementById("zoom-in");

const zoomLevel =
    document.getElementById("zoom-level");

const recentNotesList =
    document.getElementById("recent-notes-list");


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let currentNoteId = null;

let isSaving = false;

let autosaveTimer = null;

let zoom = 1;

let savedRange = null;

let recognition = null;


// ============================================================
// NOTE PATH
// ============================================================

function getNotesCollection() {

    if (!currentUser) {
        throw new Error(
            "No authenticated Firebase user."
        );
    }

    return collection(
        db,
        "users",
        currentUser.uid,
        "notes"
    );

}


// ============================================================
// URL NOTE ID
// ============================================================

function getNoteIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("id");

}


function getFolderIdFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    return params.get("folderId");

}


// ============================================================
// EDITOR TEXT
// ============================================================

function getEditorText() {

    return editor.innerText
        .replace(/\u00a0/g, " ")
        .trim();

}


// ============================================================
// WORD COUNT
// ============================================================

function updateWordCount() {

    const text =
        getEditorText();

    const words =
        text
            ? text
                .split(/\s+/)
                .filter(Boolean)
                .length
            : 0;

    wordTotal.textContent =
        `${words} words`;

    wordMeta.textContent =
        `${words} words`;

}


// ============================================================
// SAVE SELECTION
// ============================================================

function saveSelection() {

    const selection =
        window.getSelection();

    if (!selection.rangeCount) {
        return;
    }

    const range =
        selection.getRangeAt(0);

    if (
        editor.contains(
            range.commonAncestorContainer
        )
    ) {

        savedRange =
            range.cloneRange();

    }

}


// ============================================================
// RESTORE SELECTION
// ============================================================

function restoreSelection() {

    if (!savedRange) {
        editor.focus();
        return;
    }

    const selection =
        window.getSelection();

    selection.removeAllRanges();

    selection.addRange(
        savedRange
    );

}


/* ==========================================
   SNAP EDITOR TOOLBAR DROPDOWNS
========================================== */

function setupToolbarDropdowns() {
    const dropdowns = [
        {
            button: document.getElementById("list-dropdown-button"),
            menu: document.getElementById("list-dropdown-menu")
        },
        {
            button: document.getElementById("alignment-dropdown-button"),
            menu: document.getElementById("alignment-dropdown-menu")
        },
        {
            button: document.getElementById("highlight-button"),
            menu: document.getElementById("highlight-menu")
        },
        {
            button: document.getElementById("more-button"),
            menu: document.getElementById("more-menu")
        }
    ];

    function closeDropdowns(exceptMenu = null) {
        dropdowns.forEach(({ button, menu }) => {
            if (!button || !menu || menu === exceptMenu) return;

            menu.hidden = true;
            button.setAttribute("aria-expanded", "false");
        });
    }

    dropdowns.forEach(({ button, menu }) => {
        if (!button || !menu) return;

        button.addEventListener("click", event => {
            event.stopPropagation();

            const shouldOpen = menu.hidden;
            closeDropdowns(menu);

            menu.hidden = !shouldOpen;
            button.setAttribute("aria-expanded", String(shouldOpen));
        });
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".toolbar-dropdown")) {
            closeDropdowns();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            closeDropdowns();
        }
    });
}


// ============================================================
// FOCUS EDITOR
// ============================================================

function focusEditor() {

    editor.focus();

    restoreSelection();

}


// ============================================================
// EXECUTE COMMAND
// ============================================================

function command(
    name,
    value = null
) {

    focusEditor();

    document.execCommand(
        name,
        false,
        value
    );

    updateWordCount();

    markDirty();

}


// ============================================================
// MARK DIRTY
// ============================================================

function markDirty() {

    saveBadge.textContent =
        "Draft";

    saveStatus.textContent =
        "• Unsaved changes";

    scheduleAutosave();

}


// ============================================================
// AUTOSAVE
// ============================================================

function scheduleAutosave() {

    clearTimeout(
        autosaveTimer
    );

    autosaveTimer =
        setTimeout(
            async function () {

                if (
                    currentUser &&
                    (
                        getEditorText() ||
                        titleInput.value.trim()
                    )
                ) {

                    await saveNote(
                        true
                    );

                }

            },
            1500
        );

}


// ============================================================
// SAVE NOTE
// ============================================================

async function saveNote(
    silent = false
) {

    if (isSaving) {
        return;
    }


    if (!currentUser) {

        if (!silent) {

            alert(
                "You are not logged in. Please log in again."
            );

        }

        return;

    }


    const title =
        titleInput.value.trim() ||
        "Untitled Note";


    const content =
        editor.innerHTML;


    const plainText =
        getEditorText();


    if (!plainText && !title) {

        if (!silent) {

            alert(
                "Please enter something in your note."
            );

        }

        return;

    }


    isSaving = true;


    saveBadge.textContent =
        "Saving";

    saveStatus.textContent =
        "• Saving...";


    try {

        const notesRef =
            getNotesCollection();


        // ========================================
        // UPDATE EXISTING NOTE
        // ========================================

        if (currentNoteId) {

            const noteRef =
                doc(
                    db,
                    "users",
                    currentUser.uid,
                    "notes",
                    currentNoteId
                );


            await updateDoc(
                noteRef,
                {

                    title:
                        title,

                    content:
                        content,

                    plainText:
                        plainText,

                    wordCount:
                        plainText
                            ? plainText
                                .split(/\s+/)
                                .filter(Boolean)
                                .length
                            : 0,

                    updatedAt:
                        serverTimestamp()

                }
            );

        }


        // ========================================
        // CREATE NEW NOTE
        // ========================================

        else {

            const newNote =
                await addDoc(
                    notesRef,
                    {

                        title:
                            title,

                        content:
                            content,

                        plainText:
                            plainText,

                        wordCount:
                            plainText
                                ? plainText
                                    .split(/\s+/)
                                    .filter(Boolean)
                                    .length
                                : 0,

                        folderId:
                            getFolderIdFromURL() || null,

                        deleted:
                            false,

                        createdAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );


            currentNoteId =
                newNote.id;


            window.history.replaceState(
                {},
                "",
                `notes.php?id=${currentNoteId}`
            );

        }


        // ========================================
        // SUCCESS
        // ========================================

        saveBadge.textContent =
            "Saved";

        saveStatus.textContent =
            "• Autosaved";


        updateMetadata(
            new Date()
        );


        await loadRecentNotes();


    }
    catch (error) {

        console.error(
            "SNAP NOTE SAVE ERROR",
            error
        );


        saveBadge.textContent =
            "Error";

        saveStatus.textContent =
            "• Save failed";


        if (!silent) {

            alert(
                "SNAP could not save the note.\n\n" +
                "Error: " +
                (
                    error.message ||
                    error.code ||
                    "Unknown error"
                )
            );

        }

    }
    finally {

        isSaving = false;

    }

}


// ============================================================
// LOAD NOTE
// ============================================================

async function loadNote(
    noteId
) {

    if (!currentUser || !noteId) {
        return;
    }


    try {

        saveBadge.textContent =
            "Loading";

        saveStatus.textContent =
            "• Loading note...";


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

            window.location.href =
                "../dashboard.php";

            return;

        }


        const data =
            snapshot.data();


        // ========================================
        // DO NOT OPEN SOFT-DELETED NOTES
        // ========================================

        if (data.deleted === true) {

            alert(
                "This note is in Recently Deleted."
            );

            window.location.href =
                "notes.php";

            return;

        }


        currentNoteId =
            noteId;


        titleInput.value =
            data.title ||
            "Untitled Note";


        editor.innerHTML =
            data.content ||
            "";


        updateWordCount();


        const updatedAt =
            data.updatedAt?.toDate
                ? data.updatedAt.toDate()
                : new Date();


        updateMetadata(
            updatedAt
        );


        saveBadge.textContent =
            "Saved";

        saveStatus.textContent =
            "• Autosaved";

    }
    catch (error) {

        console.error(
            "SNAP NOTE LOAD ERROR",
            error
        );


        alert(
            "Could not load this note.\n\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}


// ============================================================
// NEW NOTE
// ============================================================

function createNewNote() {

    currentNoteId =
        null;


    titleInput.value =
        "Untitled Note";


    editor.innerHTML =
        "";


    updateWordCount();


    noteDate.textContent =
        "New note";


    noteTime.textContent =
        "--";


    saveBadge.textContent =
        "Draft";


    saveStatus.textContent =
        "• Ready";


    window.history.replaceState(
        {},
        "",
        "notes.php"
    );


    editor.focus();

}


// ============================================================
// METADATA
// ============================================================

function updateMetadata(
    date
) {

    noteDate.textContent =
        date.toLocaleDateString(
            "en-US",
            {
                month: "long",
                day: "numeric"
            }
        );


    noteTime.textContent =
        date.toLocaleTimeString(
            "en-US",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );

}


// ============================================================
// TITLE CHANGE
// ============================================================

titleInput.addEventListener(
    "input",
    function () {

        markDirty();

    }
);


// ============================================================
// EDITOR INPUT
// ============================================================

editor.addEventListener(
    "input",
    function () {

        updateWordCount();

        markDirty();

    }
);


// ============================================================
// SELECTION TRACKING
// ============================================================

editor.addEventListener(
    "keyup",
    saveSelection
);

editor.addEventListener(
    "mouseup",
    saveSelection
);

editor.addEventListener(
    "focus",
    saveSelection
);


// ============================================================
// TOOLBAR BUTTONS
// ============================================================

toolbar.addEventListener(
    "mousedown",
    function (event) {

        const button =
            event.target.closest(
                "[data-command]"
            );


        if (!button) {
            return;
        }


        event.preventDefault();

        saveSelection();


        const commandName =
            button.dataset.command;


        command(
            commandName
        );

    }
);


// ============================================================
// FONT FAMILY
// ============================================================

fontFamily.addEventListener(
    "change",
    function () {

        saveSelection();

        command(
            "fontName",
            fontFamily.value
        );

    }
);


// ============================================================
// FONT SIZE
// ============================================================

fontSize.addEventListener(
    "change",
    function () {

        saveSelection();

        focusEditor();


        document.execCommand(
            "fontSize",
            false,
            "7"
        );


        const fonts =
            editor.querySelectorAll(
                'font[size="7"]'
            );


        fonts.forEach(
            function (font) {

                font.removeAttribute(
                    "size"
                );

                font.style.fontSize =
                    `${fontSize.value}px`;

            }
        );


        markDirty();

    }
);


// ============================================================
// LINE SPACING
// ============================================================

lineSpacing.addEventListener(
    "change",
    function () {

        saveSelection();

        focusEditor();


        const selection =
            window.getSelection();


        if (!selection.rangeCount) {
            return;
        }


        let node =
            selection
                .getRangeAt(0)
                .commonAncestorContainer;


        if (
            node.nodeType ===
            Node.TEXT_NODE
        ) {

            node =
                node.parentElement;

        }


        const block =
            node.closest(
                "div, p, li, h1, h2, h3"
            );


        if (block) {

            block.style.lineHeight =
                lineSpacing.value;

        }
        else {

            editor.style.lineHeight =
                lineSpacing.value;

        }


        markDirty();

    }
);


// ============================================================
// CHECKLIST
// ============================================================

checklistButton.addEventListener(
    "mousedown",
    function (event) {

        event.preventDefault();

        saveSelection();

        focusEditor();


        const selection =
            window.getSelection();


        const text =
            selection.toString();


        if (text.trim()) {

            const lines =
                text.split("\n");


            const html =
                lines
                    .map(
                        function (line) {

                            return `
                                <div class="note-check-item">
                                    <input
                                        type="checkbox"
                                    >
                                    <span>${escapeHTML(line)}</span>
                                </div>
                            `;

                        }
                    )
                    .join("");


            document.execCommand(
                "insertHTML",
                false,
                html
            );

        }
        else {

            document.execCommand(
                "insertHTML",
                false,
                `
                <div class="note-check-item">
                    <input type="checkbox">
                    <span>&nbsp;</span>
                </div>
                `
            );

        }


        markDirty();

    }
);


// ============================================================
// CHECKLIST CLICK
// ============================================================

editor.addEventListener(
    "click",
    function (event) {

        if (
            event.target.matches(
                ".note-check-item input"
            )
        ) {

            markDirty();

        }

    }
);


/* ==========================================
   BULLETED AND NUMBERED LISTS
========================================== */

document
    .getElementById("list-dropdown-menu")
    ?.addEventListener("mousedown", event => {
        const button = event.target.closest("[data-list-command]");
        if (!button) return;

        event.preventDefault();

        saveSelection();
        focusEditor();

        document.execCommand(
            button.dataset.listCommand,
            false,
            null
        );

        markDirty();

        document.getElementById("list-dropdown-menu").hidden = true;
        document
            .getElementById("list-dropdown-button")
            ?.setAttribute("aria-expanded", "false");
    });


/* ==========================================
   ALIGNMENT, INDENTATION AND HORIZONTAL LINE
========================================== */

document
    .getElementById("alignment-dropdown-menu")
    ?.addEventListener("mousedown", event => {
        const button = event.target.closest("[data-align-command]");
        if (!button) return;

        event.preventDefault();

        saveSelection();
        focusEditor();

        const action = button.dataset.alignCommand;

        if (action === "insertHorizontalRule") {
            document.execCommand("insertHorizontalRule", false, null);
        } else {
            document.execCommand(action, false, null);
        }

        markDirty();

        document.getElementById("alignment-dropdown-menu").hidden = true;
        document
            .getElementById("alignment-dropdown-button")
            ?.setAttribute("aria-expanded", "false");
    });


/* ==========================================
   HIGHLIGHT SELECTED TEXT
========================================== */

document
    .getElementById("highlight-menu")
    ?.addEventListener("mousedown", event => {
        const button = event.target.closest("[data-highlight-color]");
        if (!button) return;

        event.preventDefault();

        const color = button.dataset.highlightColor;

        saveSelection();
        focusEditor();

        if (color === "transparent") {
            document.execCommand("removeFormat", false, null);
        } else {
            const supported = document.execCommand(
                "hiliteColor",
                false,
                color
            );

            if (!supported) {
                document.execCommand("backColor", false, color);
            }
        }

        const preview = document.querySelector(".highlight-color-preview");
        if (preview && color !== "transparent") {
            preview.style.backgroundColor = color;
        }

        markDirty();

        document.getElementById("highlight-menu").hidden = true;
        document
            .getElementById("highlight-button")
            ?.setAttribute("aria-expanded", "false");
    });


// ============================================================
// ZOOM
// ============================================================

function updateZoom() {

    editor.style.fontSize =
        `${16 * zoom}px`;


    zoomLevel.textContent =
        `${Math.round(zoom * 100)}%`;

}


zoomOut.addEventListener(
    "click",
    function () {

        zoom =
            Math.max(
                0.7,
                zoom - 0.1
            );

        updateZoom();

    }
);


zoomIn.addEventListener(
    "click",
    function () {

        zoom =
            Math.min(
                1.8,
                zoom + 0.1
            );

        updateZoom();

    }
);


zoomLevel.addEventListener(
    "click",
    function () {

        zoom =
            1;

        updateZoom();

    }
);


// ============================================================
// MICROPHONE
// ============================================================

function setupMicrophone() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

        microphoneButton.addEventListener(
            "click",
            function () {

                alert(
                    "Voice typing is not supported by this browser."
                );

            }
        );

        return;

    }


    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;

    recognition.interimResults =
        false;

    recognition.lang =
        "en-US";


    recognition.onstart =
        function () {

            microphoneButton.classList.add(
                "recording"
            );

            saveStatus.textContent =
                "• Listening...";

        };


    recognition.onend =
        function () {

            microphoneButton.classList.remove(
                "recording"
            );

            saveStatus.textContent =
                "• Ready";

        };


    recognition.onerror =
        function (event) {

            microphoneButton.classList.remove(
                "recording"
            );

            console.error(
                "Speech recognition error:",
                event.error
            );

        };


    recognition.onresult =
        function (event) {

            const transcript =
                event.results[0][0].transcript;


            focusEditor();


            document.execCommand(
                "insertText",
                false,
                transcript + " "
            );


            updateWordCount();

            markDirty();

        };


    microphoneButton.addEventListener(
        "click",
        function () {

            if (
                microphoneButton.classList.contains(
                    "recording"
                )
            ) {

                recognition.stop();

            }
            else {

                saveSelection();

                recognition.start();

            }

        }
    );

}


// ============================================================
// IMAGE INSERT
// ============================================================

imageButton.addEventListener(
    "click",
    function () {

        saveSelection();

        imageInput.click();

    }
);


imageInput.addEventListener(
    "change",
    function () {

        const file =
            imageInput.files[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Please choose an image file."
            );

            return;

        }


        const reader =
            new FileReader();


        reader.onload =
            function () {

                focusEditor();


                document.execCommand(
                    "insertHTML",
                    false,
                    `
                    <img
                        src="${reader.result}"
                        alt="Note image"
                        style="
                            max-width:100%;
                            height:auto;
                            border-radius:12px;
                            margin:12px 0;
                        "
                    >
                    `
                );


                markDirty();

            };


        reader.readAsDataURL(
            file
        );


        imageInput.value =
            "";

    }
);


// ============================================================
// EDITOR MORE MENU
// ============================================================

moreMenu.addEventListener(
    "click",
    function (event) {

        const button =
            event.target.closest(
                "[data-more-command]"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.moreCommand;


        moreMenu.hidden =
            true;


        saveSelection();


        if (
            action ===
            "paragraph"
        ) {

            command(
                "formatBlock",
                "p"
            );

            return;

        }


        command(
            action
        );

    }
);


// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

editor.addEventListener(
    "keydown",
    function (event) {

        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "s"
        ) {

            event.preventDefault();

            saveNote();

        }


        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "b"
        ) {

            event.preventDefault();

            command("bold");

        }


        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "i"
        ) {

            event.preventDefault();

            command("italic");

        }


        if (
            (event.ctrlKey ||
                event.metaKey) &&
            event.key.toLowerCase() === "u"
        ) {

            event.preventDefault();

            command("underline");

        }

    }
);


// ============================================================
// SAVE BUTTON
// ============================================================

saveButton.addEventListener(
    "click",
    function () {

        saveNote();

    }
);


// ============================================================
// NEW NOTE BUTTON
// ============================================================

newNoteButton.addEventListener(
    "click",
    function () {

        const hasContent =
            getEditorText() ||
            titleInput.value.trim() !==
                "Untitled Note";


        if (hasContent) {

            const leave =
                confirm(
                    "Create a new note?\n\nMake sure your current note is saved first."
                );


            if (!leave) {
                return;
            }

        }


        createNewNote();

    }
);


setupToolbarDropdowns();


// ============================================================
// ESCAPE HTML
// ============================================================

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


// ============================================================
// NOTE ACTION UI
// ============================================================

function addNoteActionStyles() {

    if (
        document.getElementById(
            "snap-note-action-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "snap-note-action-styles";


    style.textContent = `

        .snap-note-item {
            position: relative;
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
        }

        .snap-note-item .recent-note-link {
            flex: 1;
            min-width: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .snap-note-menu-wrap {
            position: relative;
            flex: 0 0 auto;
        }

        .snap-note-menu-button {
            width: 30px;
            height: 30px;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: #777;
            cursor: pointer;
            font-size: 20px;
            line-height: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            transition:
                background 0.15s ease,
                color 0.15s ease;
        }

        .snap-note-menu-button:hover {
            background: #f1f1f1;
            color: #222;
        }

        .snap-note-actions {
            position: absolute;
            right: 0;
            top: calc(100% + 6px);
            z-index: 9999;
            width: 170px;
            padding: 6px;
            background: #fff;
            border: 1px solid #e8e8e8;
            border-radius: 12px;
            box-shadow:
                0 12px 35px rgba(0, 0, 0, 0.14);
        }

        .snap-note-action {
            width: 100%;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 0;
            background: transparent;
            padding: 10px 11px;
            border-radius: 8px;
            color: #222;
            font-size: 13px;
            text-align: left;
            cursor: pointer;
        }

        .snap-note-action:hover {
            background: #f5f5f5;
        }

        .snap-note-action.delete {
            color: #d93025;
        }

        .snap-note-action.delete:hover {
            background: #fff1f1;
        }

        .snap-note-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 100000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(15, 15, 20, 0.42);
            backdrop-filter: blur(5px);
        }

        .snap-note-modal {
            width: min(420px, 100%);
            background: #fff;
            border-radius: 18px;
            padding: 24px;
            box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.22);
            animation: snapNoteModalIn 0.16s ease-out;
        }

        @keyframes snapNoteModalIn {
            from {
                opacity: 0;
                transform: translateY(8px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        .snap-note-modal-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 14px;
            background: #f2eaff;
            color: #6b35c8;
            font-size: 21px;
        }

        .snap-note-modal-icon.delete {
            background: #fff0f0;
            color: #d93025;
        }

        .snap-note-modal h3 {
            margin: 0 0 7px;
            color: #1e1e1e;
            font-size: 19px;
            font-weight: 700;
        }

        .snap-note-modal p {
            margin: 0 0 18px;
            color: #707070;
            font-size: 14px;
            line-height: 1.5;
        }

        .snap-note-modal-label {
            display: block;
            margin-bottom: 7px;
            color: #333;
            font-size: 13px;
            font-weight: 600;
        }

        .snap-note-modal-input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #dedede;
            border-radius: 10px;
            padding: 11px 12px;
            outline: none;
            color: #222;
            background: #fff;
            font-size: 14px;
        }

        .snap-note-modal-input:focus {
            border-color: #8c5bd6;
            box-shadow:
                0 0 0 3px rgba(140, 91, 214, 0.12);
        }

        .snap-note-modal-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 9px;
            margin-top: 20px;
        }

        .snap-note-modal-button {
            border: 0;
            border-radius: 9px;
            padding: 10px 15px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }

        .snap-note-modal-cancel {
            background: #f2f2f2;
            color: #444;
        }

        .snap-note-modal-cancel:hover {
            background: #e9e9e9;
        }

        .snap-note-modal-save {
            background: #6b35c8;
            color: #fff;
        }

        .snap-note-modal-save:hover {
            background: #5b2caf;
        }

        .snap-note-modal-delete {
            background: #d93025;
            color: #fff;
        }

        .snap-note-modal-delete:hover {
            background: #c5221f;
        }

        .snap-note-modal-message {
            min-height: 18px;
            margin-top: 9px;
            color: #d93025;
            font-size: 12px;
        }

        @media (max-width: 520px) {

            .snap-note-modal {
                padding: 20px;
            }

            .snap-note-modal-buttons {
                flex-direction: column-reverse;
            }

            .snap-note-modal-button {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(style);

}


// ============================================================
// CLOSE NOTE ACTION MENUS
// ============================================================

function closeAllNoteMenus() {

    document
        .querySelectorAll(
            ".snap-note-actions"
        )
        .forEach(
            function (menu) {

                menu.remove();

            }
        );

}


// ============================================================
// CREATE MODAL
// ============================================================

function createNoteModal(
    content
) {

    const overlay =
        document.createElement(
            "div"
        );


    overlay.className =
        "snap-note-modal-overlay";


    overlay.appendChild(
        content
    );


    document.body.appendChild(
        overlay
    );


    return overlay;

}


// ============================================================
// CLOSE MODAL
// ============================================================

function closeNoteModal(
    overlay
) {

    if (overlay) {

        overlay.remove();

    }

}


// ============================================================
// RENAME NOTE
// ============================================================

function renameNote(
    noteId,
    currentTitle
) {

    if (!currentUser || !noteId) {
        return;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "snap-note-modal";


    modal.innerHTML = `
        <div class="snap-note-modal-icon">
            ✏️
        </div>

        <h3>Rename note</h3>

        <p>
            Give your note a new name.
        </p>

        <label
            class="snap-note-modal-label"
            for="snap-rename-note-input"
        >
            Note title
        </label>

        <input
            id="snap-rename-note-input"
            class="snap-note-modal-input"
            type="text"
            maxlength="120"
            value="${escapeHTML(currentTitle || "Untitled Note")}"
        >

        <div
            class="snap-note-modal-message"
            id="snap-rename-note-message"
        ></div>

        <div class="snap-note-modal-buttons">

            <button
                type="button"
                class="snap-note-modal-button snap-note-modal-cancel"
                data-modal-cancel
            >
                Cancel
            </button>

            <button
                type="button"
                class="snap-note-modal-button snap-note-modal-save"
                data-modal-save
            >
                Rename
            </button>

        </div>
    `;


    const overlay =
        createNoteModal(
            modal
        );


    const input =
        modal.querySelector(
            "#snap-rename-note-input"
        );

    const message =
        modal.querySelector(
            "#snap-rename-note-message"
        );

    const cancelButton =
        modal.querySelector(
            "[data-modal-cancel]"
        );

    const saveButton =
        modal.querySelector(
            "[data-modal-save]"
        );


    function submitRename() {

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


        const noteRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "notes",
                noteId
            );


        updateDoc(
            noteRef,
            {
                title:
                    newTitle,

                updatedAt:
                    serverTimestamp()
            }
        )
            .then(
                function () {

                    if (
                        currentNoteId ===
                        noteId
                    ) {

                        titleInput.value =
                            newTitle;

                        saveBadge.textContent =
                            "Saved";

                        saveStatus.textContent =
                            "• Renamed";

                    }


                    closeNoteModal(
                        overlay
                    );


                    loadRecentNotes();

                }
            )
            .catch(
                function (error) {

                    console.error(
                        "SNAP NOTE RENAME ERROR:",
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
            );

    }


    cancelButton.addEventListener(
        "click",
        function () {

            closeNoteModal(
                overlay
            );

        }
    );


    saveButton.addEventListener(
        "click",
        submitRename
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Enter"
            ) {

                event.preventDefault();

                submitRename();

            }


            if (
                event.key ===
                "Escape"
            ) {

                closeNoteModal(
                    overlay
                );

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

                closeNoteModal(
                    overlay
                );

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


// ============================================================
// DELETE NOTE
// SOFT DELETE → RECENTLY DELETED
// ============================================================

function deleteNote(
    noteId,
    noteTitle
) {

    if (!currentUser || !noteId) {
        return;
    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "snap-note-modal";


    modal.innerHTML = `
        <div class="snap-note-modal-icon delete">
            🗑
        </div>

        <h3>Move to Recently Deleted?</h3>

        <p>
            <strong>${escapeHTML(noteTitle || "Untitled Note")}</strong>
            will be moved to Recently Deleted. You can restore it later.
        </p>

        <div class="snap-note-modal-buttons">

            <button
                type="button"
                class="snap-note-modal-button snap-note-modal-cancel"
                data-delete-cancel
            >
                Cancel
            </button>

            <button
                type="button"
                class="snap-note-modal-button snap-note-modal-delete"
                data-delete-confirm
            >
                Move to Trash
            </button>

        </div>
    `;


    const overlay =
        createNoteModal(
            modal
        );


    const cancelButton =
        modal.querySelector(
            "[data-delete-cancel]"
        );

    const deleteButton =
        modal.querySelector(
            "[data-delete-confirm]"
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


            // ========================================
            // IF CURRENT NOTE WAS DELETED
            // ========================================

            if (
                currentNoteId ===
                noteId
            ) {

                currentNoteId =
                    null;


                titleInput.value =
                    "Untitled Note";


                editor.innerHTML =
                    "";


                updateWordCount();


                noteDate.textContent =
                    "New note";


                noteTime.textContent =
                    "--";


                saveBadge.textContent =
                    "Draft";


                saveStatus.textContent =
                    "• Ready";


                window.history.replaceState(
                    {},
                    "",
                    "notes.php"
                );

            }


            closeNoteModal(
                overlay
            );


            await loadRecentNotes();

        }
        catch (error) {

            console.error(
                "SNAP NOTE DELETE ERROR:",
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

            closeNoteModal(
                overlay
            );

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

                closeNoteModal(
                    overlay
                );

            }

        }
    );


    document.addEventListener(
        "keydown",
        function handleEscape(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeNoteModal(
                    overlay
                );

                document.removeEventListener(
                    "keydown",
                    handleEscape
                );

            }

        }
    );

}


// ============================================================
// DUPLICATE NOTE
// ============================================================

async function duplicateNote(
    noteId
) {

    if (!currentUser || !noteId) {
        return;
    }


    try {

        const originalRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "notes",
                noteId
            );


        const snapshot =
            await getDoc(
                originalRef
            );


        if (!snapshot.exists()) {

            alert(
                "This note no longer exists."
            );

            return;

        }


        const data =
            snapshot.data();


        if (data.deleted === true) {

            alert(
                "This note is already in Recently Deleted."
            );

            return;

        }


        const originalTitle =
            data.title ||
            "Untitled Note";


        const duplicateTitle =
            `${originalTitle} Copy`;


        await addDoc(
            getNotesCollection(),
            {

                title:
                    duplicateTitle,

                content:
                    data.content ||
                    "",

                plainText:
                    data.plainText ||
                    "",

                wordCount:
                    data.wordCount ||
                    0,

                deleted:
                    false,

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()

            }
        );


        await loadRecentNotes();


        saveStatus.textContent =
            "• Note duplicated";

    }
    catch (error) {

        console.error(
            "SNAP NOTE DUPLICATE ERROR:",
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


// ============================================================
// NOTE THREE-DOT MENU
// ============================================================

function openNoteMenu(
    noteId,
    noteTitle,
    menuWrap
) {

    closeAllNoteMenus();


    const menu =
        document.createElement(
            "div"
        );


    menu.className =
        "snap-note-actions";


    menu.innerHTML = `

        <button
            type="button"
            class="snap-note-action"
            data-note-action="open"
        >
            <span>📖</span>
            <span>Open</span>
        </button>

        <button
            type="button"
            class="snap-note-action"
            data-note-action="rename"
        >
            <span>✏️</span>
            <span>Rename</span>
        </button>

        <button
            type="button"
            class="snap-note-action"
            data-note-action="duplicate"
        >
            <span>📄</span>
            <span>Duplicate</span>
        </button>

        <button
            type="button"
            class="snap-note-action delete"
            data-note-action="delete"
        >
            <span>🗑</span>
            <span>Delete</span>
        </button>

    `;


    menuWrap.appendChild(
        menu
    );


    menu.addEventListener(
        "click",
        async function (event) {

            const actionButton =
                event.target.closest(
                    "[data-note-action]"
                );


            if (!actionButton) {
                return;
            }


            const action =
                actionButton.dataset.noteAction;


            closeAllNoteMenus();


            if (
                action ===
                "open"
            ) {

                window.location.href =
                    `notes.php?id=${encodeURIComponent(noteId)}`;

                return;

            }


            if (
                action ===
                "rename"
            ) {

                renameNote(
                    noteId,
                    noteTitle
                );

                return;

            }


            if (
                action ===
                "duplicate"
            ) {

                await duplicateNote(
                    noteId
                );

                return;

            }


            if (
                action ===
                "delete"
            ) {

                deleteNote(
                    noteId,
                    noteTitle
                );

            }

        }
    );

}


// ============================================================
// RECENT NOTES
// ============================================================

async function loadRecentNotes() {

    if (!currentUser) {
        return;
    }


    addNoteActionStyles();


    try {

        const notesQuery =
            query(
                getNotesCollection(),
                orderBy(
                    "updatedAt",
                    "desc"
                ),
                limit(20)
            );


        const snapshot =
            await getDocs(
                notesQuery
            );


        recentNotesList.innerHTML =
            "";


        const activeNotes =
            [];


        snapshot.forEach(
            function (item) {

                const data =
                    item.data();


                // ========================================
                // HIDE SOFT-DELETED NOTES
                // ========================================

                if (
                    data.deleted ===
                    true
                ) {

                    return;

                }


                activeNotes.push(
                    {
                        id:
                            item.id,

                        data:
                            data
                    }
                );

            }
        );


        if (
            activeNotes.length ===
            0
        ) {

            recentNotesList.innerHTML =
                `
                <li class="recent-empty">
                    No notes yet.
                </li>
                `;

            return;

        }


        activeNotes
            .slice(0, 8)
            .forEach(
                function (item) {

                    const data =
                        item.data;


                    const li =
                        document.createElement(
                            "li"
                        );


                    li.className =
                        "recent-item snap-note-item";


                    const link =
                        document.createElement(
                            "a"
                        );


                    link.href =
                        `notes.php?id=${encodeURIComponent(item.id)}`;


                    link.className =
                        "recent-note-link";


                    link.textContent =
                        data.title ||
                        "Untitled Note";


                    const menuWrap =
                        document.createElement(
                            "div"
                        );


                    menuWrap.className =
                        "snap-note-menu-wrap";


                    const menuButton =
                        document.createElement(
                            "button"
                        );


                    menuButton.type =
                        "button";


                    menuButton.className =
                        "snap-note-menu-button";


                    menuButton.setAttribute(
                        "aria-label",
                        `Actions for ${data.title || "Untitled Note"}`
                    );


                    menuButton.setAttribute(
                        "aria-haspopup",
                        "true"
                    );


                    menuButton.innerHTML =
                        "⋮";


                    menuButton.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();

                            event.stopPropagation();


                            const existingMenu =
                                menuWrap.querySelector(
                                    ".snap-note-actions"
                                );


                            if (existingMenu) {

                                closeAllNoteMenus();

                                return;

                            }


                            openNoteMenu(
                                item.id,
                                data.title ||
                                    "Untitled Note",
                                menuWrap
                            );

                        }
                    );


                    menuWrap.appendChild(
                        menuButton
                    );


                    li.appendChild(
                        link
                    );


                    li.appendChild(
                        menuWrap
                    );


                    recentNotesList.appendChild(
                        li
                    );

                }
            );

    }
    catch (error) {

        console.error(
            "Could not load recent notes:",
            error
        );


        recentNotesList.innerHTML =
            `
            <li class="recent-empty">
                Could not load notes.
            </li>
            `;

    }

}


// ============================================================
// CLOSE NOTE MENUS WHEN CLICKING OUTSIDE
// ============================================================

document.addEventListener(
    "click",
    function (event) {

        if (
            !event.target.closest(
                ".snap-note-menu-wrap"
            )
        ) {

            closeAllNoteMenus();

        }

    }
);


// ============================================================
// AUTH
// ============================================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (!user) {

            window.location.href =
                "../../Login/login.php";

            return;

        }


        currentUser =
            user;


        const noteId =
            getNoteIdFromURL();


        if (noteId) {

            await loadNote(
                noteId
            );

        }
        else {

            createNewNote();

        }


        await loadRecentNotes();

    }
);


// ============================================================
// START
// ============================================================

setupMicrophone();

updateZoom();

updateWordCount();
