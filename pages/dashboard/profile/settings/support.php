<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Help &amp; Support | SNAP</title>
        <link rel="stylesheet" href="../../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../../designs/settings/common.css?v=20261115-settings-unified">
        <link rel="stylesheet" href="../../../../designs/settings/support.css?v=20261115-settings-unified">
        <link rel="stylesheet" href="../../../../designs/settings/theme.css">
        <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
    </head>
    <body>
        <div class="dashboard-shell profile-page">
            <aside class="sidebar" aria-label="Main navigation">
                <a class="brand" href="../../dashboard.php" aria-label="SNAP home">
                    <span class="brand-mark">S</span>
                    <span>
                        <strong>SNAP</strong>
                        <small>Workspace</small>
                    </span>
                </a>
                <nav class="primary-nav">
                    <a class="nav-item" href="../../dashboard.php">
                        <img class="nav-icon" src="../../../../assets/main icons/Vector.svg" alt="">Home
                    </a>
                    <a class="nav-item" href="../../tasks.php">
                        <img class="nav-icon" src="../../../../assets/main icons/check-square.svg" alt="">Tasks
                    </a>
                    <a class="nav-item" href="../../ai and chat/ai_and_chat.php">
                        <img class="nav-icon" src="../../../../assets/main icons/message-circle.svg" alt="">AI &amp; Chat
                    </a>
                    <a class="nav-item" href="../../badges.php">
                        <img class="nav-icon" src="../../../../assets/main icons/badge-check.svg" alt="">Badge
                    </a>
                    <a class="nav-item active" href="../profile.php">
                        <img class="nav-icon-active" src="../../../../assets/main icons/user.svg" alt="">Profile
                    </a>
                </nav>
                <div class="recent-notes">
                    <div class="recent-heading">
                        <h2>Recent Notes</h2>
                    </div>
                    <div class="empty-recent" aria-hidden="true"></div>
                </div>
            </aside>

            <main class="dashboard-main profile-main settings-main">
                <div class="settings-header">
                    <a class="back-link" href="../profile.php" aria-label="Back to profile">
                        <img class="back-icon" src="../../../../assets/eva_arrow-ios-back-outline.svg" alt="Back icon">
                    </a>
                    <h1>Help &amp; Support</h1>
                </div>

                <section class="settings-panel" aria-label="Help and support">
                    <div class="settings-card support-card">
                        <h2>About SNAP Workspace</h2>
                        <p>A workspace for productivity, task management, and learning.</p>
                        <h3>Features</h3>
                        <p>Organize notes and folders, manage tasks and achievements, and use study chat tools.</p>
                    </div>

                    <div class="settings-card support-card">
                        <h2>Contact support</h2>
                        <p><a href="mailto:contact@leeproductionsinc@gmail.com">leeproductionsinc@gmail.com</a></p>
                    </div>

                    <div class="settings-card support-card">
                        <h2>Policies and data requests</h2>
                        <p>
                            <a href="../../../legal/terms-privacy.php">Terms &amp; Privacy Policy</a>
                            <span aria-hidden="true"> · </span>
                            <a href="../../../legal/data-deletion.php">Data deletion instructions</a>
                        </p>
                    </div>

                    <div class="settings-card support-card">
                        <h2>Frequently asked questions</h2>
                        <div class="support-faq">
                            <section class="faq-item">
                                <h3>How do I organize my work?</h3>
                                <p>Use Notes and Folders to keep study material together, and Tasks to track work.</p>
                            </section>
                            <section class="faq-item">
                                <h3>How do I use SNAP AI and Chat?</h3>
                                <p>Open AI &amp; Chat from the sidebar to access the study assistant and conversations.</p>
                            </section>
                            <section class="faq-item">
                                <h3>My changes or preferences are not appearing.</h3>
                                <p>Check that you are online and signed in. Refresh the page; device-only preferences remain in this browser.</p>
                            </section>
                            <section class="faq-item">
                                <h3>A page is not loading correctly.</h3>
                                <p>Try refreshing, check your connection, and sign in again if your session has expired.</p>
                            </section>
                        </div>
                    </div>
                </section>
            </main>
        </div>
        <script src="../../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../../functions/settings/protect_page.js"></script>
    </body>
</html>
