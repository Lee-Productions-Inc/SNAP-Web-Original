<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Recently Deleted | SNAP</title>

    <link
        rel="stylesheet"
        href="../../../designs/dashboard.css"
    >

    <link
        rel="stylesheet"
        href="../../../designs/recently_deleted.css?v=20261111b"
    >
    <link rel="stylesheet" href="../../../designs/settings/theme.css?v=20261111e">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>

</head>


<body>

<div class="dashboard-shell">


    <!-- =========================================
         SIDEBAR
    ========================================== -->

    <aside
        class="sidebar"
        aria-label="Main navigation"
    >

        <a
            class="brand"
            href="../dashboard.php"
            aria-label="SNAP home"
        >

            <span class="brand-mark">
                S
            </span>

            <span>

                <strong>
                    SNAP
                </strong>

                <small>
                    Workspace
                </small>

            </span>

        </a>


        <nav class="primary-nav">


            <a
                class="nav-item active"
                href="../dashboard.php"
            >

                <img
                    class="nav-icon"
                    src="../../../assets/main icons/Vector.svg"
                    alt="Home icon"
                >

                Home

            </a>


            <a
                class="nav-item"
                href="../tasks.php"
            >

                <img
                    class="nav-icon"
                    src="../../../assets/main icons/check-square.svg"
                    alt="Tasks icon"
                >

                Tasks

            </a>


            <a
                class="nav-item"
                href="../ai%20and%20chat/ai_and_chat.php"
            >

                <img
                    class="nav-icon"
                    src="../../../assets/main icons/message-circle.svg"
                    alt="AI chat icon"
                >

                AI Chat

            </a>


            <a
                class="nav-item"
                href="../badges.php"
            >

                <img
                    class="nav-icon"
                    src="../../../assets/main icons/badge-check.svg"
                    alt="Badge icon"
                >

                Badge

            </a>


            <a
                class="nav-item"
                href="../profile/profile.php"
            >

                <img
                    class="nav-icon"
                    src="../../../assets/main icons/user.svg"
                    alt="Profile icon"
                >

                Profile

            </a>

        </nav>


        <!-- RECENT NOTES -->

        <div class="recent-notes">

            <h2>
                Recent Notes
            </h2>

            <div
                class="empty-recent"
                aria-hidden="true"
            ></div>

        </div>

    </aside>



    <!-- =========================================
         MAIN CONTENT
    ========================================== -->

    <main class="recently-deleted-main">


        <!-- HEADER -->

        <header class="dashboard-header">


            <label
                class="search-box"
                aria-label="Search deleted notes"
            >

                <span aria-hidden="true">
                    ⌕
                </span>

                <input
                    id="deletedSearch"
                    type="search"
                    placeholder="Search deleted notes..."
                    aria-label="Search deleted notes"
                >

            </label>


            <div class="header-actions">


                <a
                    class="text-action"
                    href="../notes/notes.php"
                >

                    <img
                        class="text-action-icon"
                        src="../../../assets/file-text.svg"
                        alt=""
                    >

                    New note

                </a>


                <a
                    class="text-action"
                    href="../dashboard.php"
                >

                    All notes

                </a>


                <a
                    class="text-action folder-action"
                    href="all_folders.php"
                >

                    <img
                        class="text-action-icon"
                        src="../../../assets/folder.svg"
                        alt=""
                    >

                    Folders

                </a>


                <a
                    class="profile-placeholder"
                    href="../profile/profile.php"
                    aria-label="Open profile"
                ></a>


            </div>

        </header>



        <!-- =========================================
             RECENTLY DELETED PANEL
        ========================================== -->

        <section
            class="recently-deleted-panel"
            aria-label="Recently Deleted"
        >


            <!-- TITLE -->

            <div class="deleted-title-row">


                <div class="deleted-heading">


                    <div class="deleted-title-icon">

                        <span>
                            🗑
                        </span>

                    </div>


                    <div>

                        <span class="deleted-eyebrow">
                            TRASH
                        </span>

                        <h1>
                            Recently Deleted
                        </h1>

                        <p>
                            Notes you delete will appear here.
                        </p>

                    </div>

                </div>


                <button
                    id="emptyTrashButton"
                    class="empty-trash-button"
                    type="button"
                    disabled
                >

                    Empty Trash

                </button>


            </div>



            <!-- STATUS -->

            <div
                id="deletedStatus"
                class="deleted-status"
                aria-live="polite"
            ></div>



            <!-- LOADING -->

            <div
                id="deletedLoading"
                class="deleted-loading"
            >

                <div class="loading-spinner"></div>

                <span>
                    Loading deleted notes...
                </span>

            </div>



            <!-- NOTES -->

            <div
                id="deletedNotesGrid"
                class="deleted-notes-grid"
            ></div>



            <!-- EMPTY STATE -->

            <div
                id="deletedEmpty"
                class="deleted-empty"
                hidden
            >

                <div class="deleted-empty-icon">
                    🗑
                </div>

                <h2>
                    Nothing here
                </h2>

                <p>
                    Deleted notes will appear here so you can restore them later.
                </p>

                <a
                    href="../notes/notes.php"
                    class="deleted-empty-button"
                >

                    Create a note

                </a>

            </div>


        </section>


    </main>

</div>



<!-- =========================================
     ACTION MODAL
========================================== -->

<div
    id="deletedActionOverlay"
    class="deleted-action-overlay"
    aria-hidden="true"
>


    <div
        id="deletedActionModal"
        class="deleted-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="deletedModalTitle"
    >


        <button
            id="closeDeletedModal"
            class="deleted-modal-close"
            type="button"
            aria-label="Close"
        >

            ×

        </button>


        <div
            id="deletedModalIcon"
            class="deleted-modal-icon"
        >

            🗑

        </div>


        <h2 id="deletedModalTitle">
            Delete note?
        </h2>


        <p id="deletedModalMessage">
            Are you sure you want to continue?
        </p>


        <div class="deleted-modal-buttons">


            <button
                id="cancelDeletedAction"
                class="deleted-cancel-button"
                type="button"
            >

                Cancel

            </button>


            <button
                id="confirmDeletedAction"
                class="deleted-confirm-button"
                type="button"
            >

                Continue

            </button>


        </div>


    </div>

</div>



<!-- =========================================
     JAVASCRIPT
========================================== -->

<script src="../../../functions/settings/global_preferences.js"></script>
<script type="module" src="../../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
<script
    type="module"
    src="../../../functions/recently_deleted/recently_deleted.js"
></script>


</body>

</html>