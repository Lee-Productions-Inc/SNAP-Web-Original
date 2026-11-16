<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Folder | SNAP</title>
    <link rel="stylesheet" href="../../../designs/dashboard.css">
    <link rel="stylesheet" href="../../../designs/all_folders.css">
    <link rel="stylesheet" href="../../../designs/settings/theme.css">
    <link rel="stylesheet" href="../../../designs/folder_detail.css">
    <script>
        try {
            document.documentElement.dataset.theme =
                localStorage.getItem("snap-theme") ||
                (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        } catch (error) {
            console.error("Unable to restore SNAP theme:", error);
        }
    </script>
</head>
<body>
    <div class="dashboard-shell">
        <aside class="sidebar" aria-label="Main navigation">
            <a class="brand" href="../dashboard.php" aria-label="SNAP home">
                <span class="brand-mark">S</span>
                <span><strong>SNAP</strong><small>Workspace</small></span>
            </a>
            <nav class="primary-nav" aria-label="Sidebar navigation">
                <a class="nav-item active" href="../dashboard.php">
                    <img class="nav-icon" src="../../../assets/main icons/Vector.svg" alt="">
                    Home
                </a>
                <a class="nav-item" href="../tasks.php">
                    <img class="nav-icon" src="../../../assets/main icons/check-square.svg" alt="">
                    Tasks
                </a>
                <a class="nav-item" href="../ai and chat/ai_and_chat.php">
                    <img class="nav-icon" src="../../../assets/main icons/message-circle.svg" alt="">
                    AI Chat
                </a>
                <a class="nav-item" href="../badges.php">
                    <img class="nav-icon" src="../../../assets/main icons/badge-check.svg" alt="">
                    Badge
                </a>
                <a class="nav-item" href="../profile/profile.php">
                    <img class="nav-icon" src="../../../assets/main icons/user.svg" alt="">
                    Profile
                </a>
            </nav>
            <div class="recent-notes">
                <h2>Recent Notes</h2>
                <div class="empty-recent" aria-hidden="true"></div>
            </div>
        </aside>

        <main class="folders-main folder-detail-main">
            <header class="dashboard-header">
                <label class="search-box">
                    <span aria-hidden="true">⌕</span>
                    <input id="folder-note-search" type="search"
                        placeholder="Search notes in this folder..." aria-label="Search notes in this folder">
                </label>
                <div class="header-actions">
                    <a class="text-action" href="all_folders.php">All folders</a>
                    <a class="profile-placeholder" href="../profile/profile.php" aria-label="Open profile"></a>
                </div>
            </header>

            <section class="folder-detail-panel" aria-labelledby="folder-title">
                <div class="folder-detail-heading">
                    <a class="folder-detail-back" href="all_folders.php" aria-label="Back to folders">‹</a>
                    <div class="folder-detail-title">
                        <p class="folder-detail-eyebrow">YOUR NOTES</p>
                        <h1 id="folder-title">Loading folder…</h1>
                        <p id="folder-note-count" role="status">Loading notes…</p>
                    </div>
                    <a id="folder-new-note" class="folder-detail-new-note" href="../notes/notes.php">
                        + New note
                    </a>
                </div>
                <p id="folder-detail-message" class="folder-detail-message" role="status" hidden></p>
                <div id="folder-note-list" class="folder-note-list" aria-live="polite">
                    <p class="folder-note-state">Loading notes…</p>
                </div>
            </section>
        </main>
    </div>
    <script src="../../../functions/settings/global_preferences.js"></script>
    <script type="module" src="../../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
    <script type="module" src="../../../functions/folders/folder_detail.js"></script>
</body>
</html>
