<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Notification Settings | SNAP</title>
        <link rel="stylesheet" href="../../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../../designs/settings/common.css?v=20261115-settings-unified">
        <link rel="stylesheet" href="../../../../designs/settings/notification_settings.css?v=20261115-settings-unified">
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
                    <h1>Notification Settings</h1>
                </div>

                <section class="settings-panel" aria-label="Notification settings panel">
                    <div class="settings-card">
                        <label class="switch-field" for="task-reminders">
                            <span>Task reminders <small>Runs while the Tasks page is open and browser notifications are allowed.</small></span>
                            <span class="switch">
                                <input id="task-reminders" type="checkbox" checked>
                                <span class="slider"></span>
                            </span>
                        </label>
                        <label class="switch-field" for="task-completions">
                            <span>Task completion updates <small>Preference only; completion notifications are not currently sent.</small></span>
                            <span class="switch">
                                <input id="task-completions" type="checkbox">
                                <span class="slider"></span>
                            </span>
                        </label>
                        <label class="switch-field" for="achievement-updates">
                            <span>Achievement and badge updates <small>Preference only; achievement notifications are not currently sent.</small></span>
                            <span class="switch">
                                <input id="achievement-updates" type="checkbox">
                                <span class="slider"></span>
                            </span>
                        </label>
                        <label class="switch-field" for="general-updates">
                            <span>General updates <small>Preference only; general update notifications are not currently sent.</small></span>
                            <span class="switch">
                                <input id="general-updates" type="checkbox">
                                <span class="slider"></span>
                            </span>
                        </label>
                        <div class="setting-field select-field">
                            <label for="reminder-time">Default reminder lead time</label>
                            <select id="reminder-time">
                                <option value="5 minutes">5 minutes before</option>
                                <option value="15 minutes">15 minutes before</option>
                                <option value="30 minutes">30 minutes before</option>
                                <option value="1 hour">1 hour before</option>
                                <option value="1 day">1 day before</option>
                            </select>
                            <small>Applies to new tasks; existing tasks keep their selected reminder.</small>
                        </div>
                    </div>

                    <p id="notification-status" role="status" aria-live="polite"></p>
                    <div class="action-row">
                        <button class="secondary-button" id="cancel-notifications" type="button">Cancel</button>
                        <button class="primary-button" id="save-notifications" type="button">Save changes</button>
                    </div>
                </section>
            </main>
        </div>
        <script src="../../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../../functions/settings/notification_settings.js"></script>
    </body>
</html>
