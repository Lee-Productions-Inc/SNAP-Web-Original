<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Settings | SNAP</title>
        <link rel="stylesheet" href="../../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../../designs/settings/common.css?v=20261115-settings-unified">
        <link rel="stylesheet" href="../../../../designs/settings/account_settings.css?v=20261115-settings-unified-legal">
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

            <main class="dashboard-main profile-main settings-main account-settings-main">
                <div class="settings-header">
                    <a class="back-link" href="../profile.php" aria-label="Back to profile">
                        <img class="back-icon" src="../../../../assets/eva_arrow-ios-back-outline.svg" alt="Back icon">
                    </a>
                    <h1>Account Settings</h1>
                    <a class="profile-placeholder account-profile-avatar" id="account-profile-avatar" href="../profile.php" aria-label="View profile">S</a>
                </div>

                <section class="settings-panel" aria-label="Account settings panel">
                    <div class="settings-card" id="account-settings-card">
                        <div class="setting-field">
                            <label for="first-name">First name</label>
                            <div class="field-value" data-display="first-name">—</div>
                            <input id="first-name" class="field-input" type="text" maxlength="80" autocomplete="given-name" required>
                        </div>
                        <div class="setting-field">
                            <label for="middle-name">Middle name/Initial</label>
                            <div class="field-value" data-display="middle-name">—</div>
                            <input id="middle-name" class="field-input" type="text" maxlength="80" autocomplete="additional-name">
                        </div>
                        <div class="setting-field">
                            <label for="last-name">Last name</label>
                            <div class="field-value" data-display="last-name">—</div>
                            <input id="last-name" class="field-input" type="text" maxlength="80" autocomplete="family-name">
                        </div>
                        <div class="setting-field">
                            <label for="university">University</label>
                            <div class="field-value" data-display="university">—</div>
                            <input id="university" class="field-input" type="text" maxlength="120" autocomplete="organization">
                        </div>
                        <div class="setting-field">
                            <label for="email">Email address</label>
                            <div class="field-value" data-display="email">—</div>
                            <input id="email" class="field-input" type="email" autocomplete="email">
                        </div>
                        <div class="setting-field">
                            <label for="username">Username</label>
                            <div class="field-value" data-display="username">—</div>
                            <input id="username" class="field-input" type="text" maxlength="40" autocomplete="nickname">
                        </div>
                        <div class="setting-field">
                            <label for="password">Password</label>
                            <div class="field-value" data-display="password">********</div>
                            <input id="password" class="field-input" type="password" autocomplete="new-password" placeholder="Enter a new password" minlength="6">
                        </div>
                    </div>

                    <div class="action-row">
                        <button class="secondary-button hidden" id="cancel-button" type="button">Cancel</button>
                        <button class="primary-button hidden" id="save-button" type="button">Save changes</button>
                        <button class="primary-button" id="edit-button" type="button">Edit</button>
                    </div>

                    <div class="delete-account-row">
                        <a class="legal-policy-link" href="../../../legal/terms-privacy.php">Terms &amp; Privacy Policy</a>
                        <a class="data-deletion-link" href="../../../legal/data-deletion.php">Data deletion instructions</a>
                        <button class="delete-button" id="delete-account-button" type="button">Delete Account</button>
                    </div>
                </section>
            </main>
        </div>

        <div class="delete-modal" id="delete-modal" hidden>
            <div class="delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title">
                <h2 id="delete-title">Delete Account?</h2>
                <p>This action cannot be undone. This is a front-end confirmation only.</p>
                <div class="delete-actions">
                    <button class="secondary-button" id="delete-cancel" type="button">Cancel</button>
                    <button class="delete-confirm-button" id="delete-confirm" type="button">Delete</button>
                </div>
            </div>
        </div>

        <script src="../../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../../functions/settings/account_settings.js?v=20261115-chat-profile-2"></script>
    </body>
</html>
