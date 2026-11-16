<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unclassified | SNAP</title>
        <link rel="stylesheet" href="../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../designs/unclassified.css">
        <link rel="stylesheet" href="../../../designs/settings/theme.css">
        <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
    </head>
    <body>
        <div class="dashboard-shell">
            <aside class="sidebar" aria-label="Main navigation">
                <a class="brand" href="../dashboard.php" aria-label="SNAP home">
                    <span class="brand-mark">S</span>
                    <span>
                        <strong>SNAP</strong>
                        <small>Workspace</small>
                    </span>
                </a>

                <nav class="primary-nav" aria-label="Sidebar navigation">
                    <a class="nav-item active" href="../dashboard.php">
                        <img class="nav-icon" src="../../../assets/main icons/Vector.svg" alt="Home icon">
                        Home
                    </a>
                    <a class="nav-item" href="../tasks.php">
                        <img class="nav-icon" src="../../../assets/main icons/check-square.svg" alt="Tasks icon">
                        Tasks
                    </a>
                    <a class="nav-item" href="../ai%20and%20chat/ai_and_chat.php">
                        <img class="nav-icon" src="../../../assets/main icons/message-circle.svg" alt="AI chat icon">
                        AI Chat
                    </a>
                    <a class="nav-item" href="../badges.php">
                        <img class="nav-icon" src="../../../assets/main icons/badge-check.svg" alt="Badge icon">
                        Badge
                    </a>
                    <a class="nav-item" href="../profile/profile.php">
                        <img class="nav-icon" src="../../../assets/main icons/user.svg" alt="Profile icon">
                        Profile
                    </a>
                </nav>

                <div class="recent-notes">
                    <h2>Recent Notes</h2>
                    <div class="empty-recent" aria-hidden="true"></div>
                </div>
            </aside>

            <main class="unclassified-main">
                <header class="dashboard-header">
                    <label class="search-box" aria-label="Search notes and tasks">
                        <span aria-hidden="true">⌕</span>
                        <input type="search" placeholder="Search notes, tasks..." aria-label="Search notes and tasks">
                    </label>

                    <div class="header-actions">
                        <button class="new-note" type="button">New note</button>
                        <a class="profile-placeholder" href="../profile/profile.php" aria-label="Open profile"
                            title="Open profile"></a>
                    </div>
                </header>

                <section class="unclassified-panel" aria-label="Unclassified notes">
                    <div class="folder-header-row">
                        <a class="back-button" href="all_folders.php" aria-label="Go back">‹</a>
                        <h1>Unclassified</h1>
                        <button class="edit-button" type="button">Edit</button>
                    </div>

                    <div class="ghost-note-grid" aria-label="Unclassified notes template">
                        <article class="ghost-note-card" aria-label="Blank note item">
                            <div class="ghost-card-head">
                                <span class="ghost-file-icon" aria-hidden="true"></span>
                                <span class="ghost-menu" aria-hidden="true"></span>
                            </div>
                            <div class="ghost-card-body">
                                <span class="ghost-line ghost-line-large"></span>
                                <span class="ghost-line ghost-line-medium"></span>
                            </div>
                        </article>

                        <article class="ghost-note-card" aria-label="Blank note item">
                            <div class="ghost-card-head">
                                <span class="ghost-file-icon" aria-hidden="true"></span>
                                <span class="ghost-menu" aria-hidden="true"></span>
                            </div>
                            <div class="ghost-card-body">
                                <span class="ghost-line ghost-line-large"></span>
                                <span class="ghost-line ghost-line-medium"></span>
                            </div>
                        </article>

                        <article class="ghost-note-card" aria-label="Blank note item">
                            <div class="ghost-card-head">
                                <span class="ghost-file-icon" aria-hidden="true"></span>
                                <span class="ghost-menu" aria-hidden="true"></span>
                            </div>
                            <div class="ghost-card-body">
                                <span class="ghost-line ghost-line-large"></span>
                                <span class="ghost-line ghost-line-medium"></span>
                            </div>
                        </article>

                        <article class="ghost-note-card" aria-label="Blank note item">
                            <div class="ghost-card-head">
                                <span class="ghost-file-icon" aria-hidden="true"></span>
                                <span class="ghost-menu" aria-hidden="true"></span>
                            </div>
                            <div class="ghost-card-body">
                                <span class="ghost-line ghost-line-large"></span>
                                <span class="ghost-line ghost-line-medium"></span>
                            </div>
                        </article>

                        <article class="ghost-note-card" aria-label="Blank note item">
                            <div class="ghost-card-head">
                                <span class="ghost-file-icon" aria-hidden="true"></span>
                                <span class="ghost-menu" aria-hidden="true"></span>
                            </div>
                            <div class="ghost-card-body">
                                <span class="ghost-line ghost-line-large"></span>
                                <span class="ghost-line ghost-line-medium"></span>
                            </div>
                        </article>

                        <article class="ghost-note-card" aria-label="Blank note item">
                            <div class="ghost-card-head">
                                <span class="ghost-file-icon" aria-hidden="true"></span>
                                <span class="ghost-menu" aria-hidden="true"></span>
                            </div>
                            <div class="ghost-card-body">
                                <span class="ghost-line ghost-line-large"></span>
                                <span class="ghost-line ghost-line-medium"></span>
                            </div>
                        </article>
                    </div>
                </section>
            </main>
        </div>
        <script src="../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
    </body>
</html>