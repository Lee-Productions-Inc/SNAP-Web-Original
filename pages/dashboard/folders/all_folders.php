<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Folders | SNAP</title>

    <link rel="stylesheet" href="../../../designs/dashboard.css">
    <link rel="stylesheet" href="../../../designs/all_folders.css">
    <link rel="stylesheet" href="../../../designs/settings/theme.css?v=20261111a">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
</head>

<body>

    <div class="dashboard-shell">

        <!-- =========================
             SIDEBAR
        ========================== -->
        <aside class="sidebar" aria-label="Main navigation">

            <a class="brand" href="../dashboard.php" aria-label="SNAP home">
                <span class="brand-mark">S</span>

                <span>
                    <strong>SNAP</strong>
                    <small>Workspace</small>
                </span>
            </a>

            <nav class="primary-nav">

                <a class="nav-item active" href="../dashboard.php">
                    <img
                        class="nav-icon"
                        src="../../../assets/main icons/Vector.svg"
                        alt="Home icon"
                    >
                    Home
                </a>

                <a class="nav-item" href="../tasks.php">
                    <img
                        class="nav-icon"
                        src="../../../assets/main icons/check-square.svg"
                        alt="Tasks icon"
                    >
                    Tasks
                </a>

                <a class="nav-item" href="../ai%20and%20chat/ai_and_chat.php">
                    <img
                        class="nav-icon"
                        src="../../../assets/main icons/message-circle.svg"
                        alt="AI chat icon"
                    >
                    AI Chat
                </a>

                <a class="nav-item" href="../badges.php">
                    <img
                        class="nav-icon"
                        src="../../../assets/main icons/badge-check.svg"
                        alt="Badge icon"
                    >
                    Badge
                </a>

                <a class="nav-item" href="../profile/profile.php">
                    <img
                        class="nav-icon"
                        src="../../../assets/main icons/user.svg"
                        alt="Profile icon"
                    >
                    Profile
                </a>

            </nav>

            <div class="recent-notes">
                <h2>Recent Notes</h2>
                <div class="empty-recent" aria-hidden="true"></div>
            </div>

        </aside>


        <!-- =========================
             MAIN CONTENT
        ========================== -->
        <main class="folders-main">

            <!-- HEADER -->
            <header class="dashboard-header">

                <label
                    class="search-box"
                    aria-label="Search notes and tasks"
                >
                    <span aria-hidden="true">⌕</span>

                    <input
                        type="search"
                        placeholder="Search notes, tasks..."
                        aria-label="Search notes and tasks"
                    >
                </label>


                <div class="header-actions">

                    <button
                        class="new-folder-button"
                        type="button"
                    >
                        New Folder
                    </button>

                    <a
                        class="text-action folder-action"
                        href="../dashboard.php"
                    >
                        All notes
                    </a>

                    <a
                        class="text-action selected-action"
                        href="all_folders.php"
                    >
                        <img
                            class="text-action-icon"
                            src="../../../assets/folder.svg"
                            alt="Folder icon"
                        >
                        Folders
                    </a>

                    <a
                        class="profile-placeholder"
                        href="../profile/profile.php"
                        aria-label="Open profile"
                        title="Open profile"
                    >
                    </a>

                </div>

            </header>


            <!-- =========================
                 FOLDERS PANEL
            ========================== -->
            <section
                class="folders-panel"
                aria-label="Folders area"
            >

                <div class="folders-title-row">

                    <h2>All Folders</h2>

                    <button
                        class="edit-button"
                        type="button"
                    >
                        Edit
                    </button>

                </div>


                <!-- =========================
                     FOLDER CARDS
                ========================== -->
                <div
                    class="folder-cards"
                    aria-label="Folder list"
                >

                    <!-- ALL NOTES -->
                    <a
                        class="folder-card active-card"
                        href="../dashboard.php"
                        aria-label="All notes folder"
                    >
                        <span class="folder-label">

                            <img
                                class="folder-icon"
                                src="../../../assets/folder.svg"
                                alt="Folder icon"
                            >

                            <strong>All notes</strong>

                        </span>

                        <span
                            class="folder-arrow"
                            aria-hidden="true"
                        >
                            ›
                        </span>

                    </a>


                    <!-- UNCLASSIFIED -->
                    <a
                        class="folder-card"
                        href="unclassified.php"
                        aria-label="Unclassified folder"
                    >
                        <span class="folder-label">

                            <img
                                class="folder-icon"
                                src="../../../assets/folder.svg"
                                alt="Folder icon"
                            >

                            <strong>Unclassified</strong>

                        </span>

                        <span
                            class="folder-arrow"
                            aria-hidden="true"
                        >
                            ›
                        </span>

                    </a>



                </div>

            </section>

        </main>

        <a
            class="recently-deleted-bottom"
            href="recently_deleted.php"
            aria-label="Recently Deleted"
        >
            <span class="recently-deleted-bottom-icon" aria-hidden="true">🗑</span>
            <span class="recently-deleted-bottom-text">Recently Deleted</span>
        </a>

    </div>


    <!-- FOLDER JAVASCRIPT -->
    <script src="../../../functions/settings/global_preferences.js"></script>
    <script type="module" src="../../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
    <script
        type="module"
        src="../../../functions/folders/folders.js"
    ></script>

</body>
</html>