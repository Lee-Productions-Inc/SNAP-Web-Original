<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>About | SNAP</title>
        <link rel="stylesheet" href="../../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../../designs/settings/common.css?v=20261115-settings-unified">
        <link rel="stylesheet" href="../../../../designs/settings/about.css?v=20261115-settings-unified">
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
                    <h1>About</h1>
                </div>

                <section class="settings-panel" aria-label="About page panel">
                    <div class="settings-card info-card">
                        <div class="info-item">
                            <span class="field-label">App version</span>
                            <strong>SNAP 1.0</strong>
                        </div>
                        <div class="info-item">
                            <span class="field-label">Build</span>
                            <strong>Front-end prototype</strong>
                        </div>
                        <div class="info-item">
                            <span class="field-label">Developed for</span>
                            <strong>Daily planning and focus</strong>
                        </div>
                        <div class="info-item">
                            <span class="field-label">Support</span>
                            <a href="#">help@snapworkspace.com</a>
                        </div>
                    </div>

                    <div class="settings-card info-card compact-card">
                        <div class="info-item">
                            <span class="field-label">Policies</span>
                            <a href="../../../legal/terms-privacy.php">Terms &amp; Privacy Policy</a>
                        </div>
                        <div class="info-item">
                            <span class="field-label">Data requests</span>
                            <a href="../../../legal/data-deletion.php">Data deletion instructions</a>
                        </div>
                    </div>

                    <div class="settings-card info-card compact-card">
                        <div class="info-item">
                            <span class="field-label">Developed by</span>
                            <strong>Team SNAP</strong>
                        </div>
                        <div class="info-item">
                            <span class="field-label">Contact</span>
                            <a href="mailto:contact@leeproductionsinc@gmail.com">leeproductionsinc@gmail.com</a>
                            <a href="tel:0909090909">0909090909</a>
                        </div>
                    </div>

                    <div class="settings-card info-card compact-card">
                        <div class="info-item">
                            <span class="field-label">Copyright</span>
                            <strong>© 2024 Lee Productions Inc.</strong>
                        </div>
                    </div>

                    <div class="settings-card info-card compact-card">
                        <div class="info-item">
                            <span class="field-label">About</span>
                            <strong>SNAP is an app and web application designed for daily planning and focus. <br> It helps users organize their tasks and stay focused on their goals.</strong>
                        </div>
                    </div>
                </section>
            </main>
        </div>
        <script src="../../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../../functions/settings/protect_page.js"></script>
    </body>
</html>
