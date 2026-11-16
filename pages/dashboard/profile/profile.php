<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Profile | SNAP</title>
        <link rel="stylesheet" href="../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../designs/profile.css?v=20261115-profile-photo-modal2">
        <link rel="stylesheet" href="../../../designs/settings/theme.css">
        <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
        <?php
        $cloudinaryCloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
        $cloudinaryUploadPreset = getenv('CLOUDINARY_UPLOAD_PRESET') ?: '';
        ?>
        <script>
            window.SNAP_CLOUDINARY_CONFIG = <?= json_encode(
                ['cloudName' => $cloudinaryCloudName, 'uploadPreset' => $cloudinaryUploadPreset],
                JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
            ) ?>;
        </script>
    </head>
    <body>
        <div class="dashboard-shell profile-page">
            <aside class="sidebar" aria-label="Main navigation">
                <a class="brand" href="../dashboard.php" aria-label="SNAP home">
                    <span class="brand-mark">S</span>
                    <span>
                        <strong>SNAP</strong>
                        <small>Workspace</small>
                    </span>
                </a>
                <nav class="primary-nav">
                    <a class="nav-item" href="../dashboard.php">
                        <img class="nav-icon" src="../../../assets/main icons/Vector.svg" alt="">Home
                    </a>
                    <a class="nav-item" href="../tasks.php">
                        <img class="nav-icon" src="../../../assets/main icons/check-square.svg" alt="">Tasks
                    </a>
                    <a class="nav-item" href="../ai and chat/ai_and_chat.php">
                        <img class="nav-icon" src="../../../assets/main icons/message-circle.svg" alt="">AI & Chat
                    </a>
                    <a class="nav-item" href="../badges.php">
                        <img class="nav-icon" src="../../../assets/main icons/badge-check.svg" alt="">Badge
                    </a>
                    <a class="nav-item active" href="profile.php">
                        <img class="nav-icon-active" src="../../../assets/main icons/user.svg" alt="">Profile
                    </a>
                </nav>
                <div class="recent-notes">
                    <div class="recent-heading">
                        <h2>Recent Notes</h2>                        
                    </div>
                    <div class="empty-recent" aria-hidden="true"></div>
                </div>
            </aside>

            <main class="dashboard-main profile-main">
                <header class="profile-intro">
                    <h1>Profile</h1>
                    <div class="profile-photo-wrap">
                        <div class="profile-photo" aria-label="Profile photo"></div>
                        <button
                            class="profile-photo-edit"
                            id="profile-photo-edit"
                            type="button"
                            aria-label="Change profile picture"
                            title="Change profile picture"
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                <path d="M14 4h-4L8.5 6H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.5L14 4Z"/>
                                <circle cx="12" cy="13" r="3.2"/>
                            </svg>
                        </button>
                    </div>
                    <small id="profile-photo-status" class="profile-photo-status" hidden></small>
                    <h2>Loading profile...</h2>
                    <p>Loading progress...</p> <br>
                    <strong>Loading university...</strong>
                </header>
                <section class="email-row" aria-labelledby="email-label">
                    <span id="email-label" class="field-label">Email</span>
                    <div class="email-value">
                        <span class="email-icon" aria-hidden="true">✉</span>
                        <strong>Loading email...</strong>
                    </div>
                </section>
                <section class="settings-card" aria-labelledby="settings-title">
                    <h2 id="settings-title">Settings</h2>
                    <a class="setting-row" href="settings/account_settings.php">
                        <span class="setting-icon">⚙</span>
                        <strong>Account Settings</strong>
                        <span class="chevron">›</span>
                    </a>
                    <a class="setting-row" href="settings/notification_settings.php">
                        <span class="setting-icon">♧</span>
                        <strong>Notification Settings</strong>
                        <span class="chevron">›</span>
                    </a>
                    <a class="setting-row" href="settings/language.php">
                        <span class="setting-icon language-icon">ENG</span>
                        <strong>Language</strong>
                        <span class="chevron">›</span>
                    </a>
                    <div class="setting-row">
                        <span class="setting-icon">◔</span>
                        <strong>Dark Mode</strong>
                        <button class="toggle" type="button" role="switch" aria-label="Dark Mode" aria-checked="false" aria-pressed="false"></button>
                    </div>
                    <a class="setting-row" href="settings/support.php">
                        <span class="setting-icon">?</span>
                        <strong>Help &amp; Support</strong>
                        <span class="chevron">›</span>
                    </a>
                    <a class="setting-row" href="settings/about.php">
                        <span class="setting-icon">i</span>
                        <strong>About</strong>
                        <span class="chevron">›</span>
                    </a>
                </section>
                <button class="logout-button" type="button" id="logout-button"><span aria-hidden="true"></span>Log Out
                </button>
            </main>
        </div>

        <div class="profile-photo-modal" id="profile-photo-modal" hidden>
            <section class="profile-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-photo-title">
                <header class="profile-photo-dialog-header">
                    <h2 id="profile-photo-title">Change profile picture</h2>
                    <button class="profile-photo-close" id="profile-photo-close" type="button" aria-label="Close">×</button>
                </header>
                <p class="profile-photo-description">Choose a JPG, PNG, or WebP image up to 5 MB. It will be centered automatically in the circular preview.</p>
                <div class="profile-photo-editor">
                    <div class="profile-photo-crop-preview" id="profile-photo-crop-preview" hidden>
                        <img id="profile-photo-preview-image" alt="Profile picture preview">
                    </div>
                    <p class="profile-photo-file-name" id="profile-photo-file-name">No image selected</p>
                    <button class="profile-photo-choose" id="profile-photo-choose" type="button">Choose image</button>
                    <input id="profile-photo-file" type="file" accept="image/jpeg,image/png,image/webp" hidden>
                </div>
                <div class="profile-photo-public-warning" role="note">
                    <strong>Public photo notice</strong>
                    <span>Uploads use SNAP’s public Cloudinary image service. Anyone with the image URL may be able to view it. Canceling an upload may leave a file hosted if Cloudinary completed just before cancellation. Replacing or removing a photo only unlinks it from SNAP; it does not delete the public Cloudinary file.</span>
                </div>
                <label class="profile-photo-consent">
                    <input id="profile-photo-public-consent" type="checkbox">
                    <span>I understand this photo may be publicly accessible to anyone with its URL.</span>
                </label>
                <progress class="profile-photo-progress" id="profile-photo-progress" max="100" value="0" hidden></progress>
                <p class="profile-photo-upload-status" id="profile-photo-upload-status" role="status" aria-live="polite"></p>
                <div class="profile-photo-dialog-actions">
                    <button class="profile-photo-remove" id="profile-photo-remove" type="button" hidden>Remove photo</button>
                    <div class="profile-photo-main-actions">
                        <button class="profile-photo-cancel" id="profile-photo-cancel" type="button">Cancel</button>
                        <button class="profile-photo-save" id="profile-photo-save" type="button" disabled>Save photo</button>
                    </div>
                </div>
            </section>
            <section
                class="profile-photo-remove-confirmation"
                id="profile-photo-remove-confirmation"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="profile-photo-remove-title"
                aria-describedby="profile-photo-remove-message"
                tabindex="-1"
                hidden
            >
                <span class="profile-photo-confirmation-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 7h16"/>
                        <path d="M10 11v6M14 11v6"/>
                        <path d="M5 7l1 13h12l1-13"/>
                        <path d="M9 7V4h6v3"/>
                    </svg>
                </span>
                <h2 id="profile-photo-remove-title">Remove Profile Picture?</h2>
                <p id="profile-photo-remove-message">Are you sure you want to remove your profile picture? Your SNAP profile will return to its default avatar.</p>
                <div class="profile-photo-confirmation-actions">
                    <button class="profile-photo-confirm-cancel" id="profile-photo-remove-cancel" type="button">Cancel</button>
                    <button class="profile-photo-confirm-remove" id="profile-photo-remove-confirm" type="button">Remove Photo</button>
                </div>
            </section>
        </div>

        <div class="logout-modal" id="logout-modal" hidden>
            <div class="logout-dialog" role="dialog" aria-modal="true" aria-labelledby="logout-title">
                <h2 id="logout-title">Are you sure?</h2>
                <div class="logout-actions">
                    <button class="confirm-logout" type="button">Log Out</button>
                    <button class="cancel-logout" type="button" id="cancel-logout">Cancel</button>
                </div>
            </div>
        </div>

        <script src="../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../functions/settings/profile.js?v=20261115-chat-profile-2"></script>
    </body>
</html>
