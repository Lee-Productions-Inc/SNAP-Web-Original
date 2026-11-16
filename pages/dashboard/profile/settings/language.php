<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Language | SNAP</title>
        <link rel="stylesheet" href="../../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../../designs/settings/common.css?v=20261115-settings-unified">
        <link rel="stylesheet" href="../../../../designs/settings/language.css?v=20261115-settings-unified">
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
                    <h1>Language</h1>
                </div>

                <section class="settings-panel" aria-label="Language settings panel">
                    <div class="settings-card">
                        <h2>Preferred language</h2>
                        <div class="language-options" id="language-options" role="radiogroup" aria-label="Preferred language">
                            <button class="language-option" type="button" role="radio" data-language="en" aria-checked="false"><span lang="en" data-no-translate>English</span><span class="language-check" aria-hidden="true">✓</span></button>
                            <button class="language-option" type="button" role="radio" data-language="fil" aria-checked="false"><span lang="fil" data-no-translate>Filipino</span><span class="language-check" aria-hidden="true">✓</span></button>
                            <button class="language-option" type="button" role="radio" data-language="es" aria-checked="false"><span lang="es" data-no-translate>Español</span><span class="language-check" aria-hidden="true">✓</span></button>
                            <button class="language-option" type="button" role="radio" data-language="ja" aria-checked="false"><span lang="ja" data-no-translate>日本語</span><span class="language-check" aria-hidden="true">✓</span></button>
                            <button class="language-option" type="button" role="radio" data-language="zh-CN" aria-checked="false"><span lang="zh-CN" data-no-translate>简体中文</span><span class="language-check" aria-hidden="true">✓</span></button>
                        </div>
                        <p class="language-status" id="language-status" role="status" aria-live="polite"></p>
                    </div>

                    <div class="action-row">
                        <button class="secondary-button" id="cancel-language" type="button">Cancel</button>
                        <button class="primary-button" id="save-language" type="button">Save changes</button>
                    </div>
                </section>
            </main>
        </div>
        <script src="../../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../../functions/settings/language.js"></script>
    </body>
</html>
