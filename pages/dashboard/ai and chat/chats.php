<?php
$cloudinaryCloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
$cloudinaryUploadPreset = getenv('CLOUDINARY_UPLOAD_PRESET') ?: '';
?>
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chats | SNAP</title>
        <link rel="stylesheet" href="../../../designs/dashboard.css">
        <link rel="stylesheet" href="../../../designs/ai/chats.css?v=20261115b">
        <link rel="stylesheet" href="../../../designs/settings/theme.css">
        <link rel="stylesheet" href="../../../designs/ai/chat_upgrade.css?v=20261115b">
        <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
        <script>window.SNAP_CLOUDINARY_CONFIG=<?= json_encode(['cloudName'=>$cloudinaryCloudName,'uploadPreset'=>$cloudinaryUploadPreset], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
        <script src="../../../functions/settings/global_preferences.js"></script>
        <script type="module" src="../../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
        <script type="module" src="../../../functions/ai_chat/chats.js?v=20261115-chat-profile-2"></script>
        <script type="module" src="../../../functions/ai_chat/chat_upgrade.js?v=20261115-chat-profile-2"></script>
    </head>
    <body>
        <div class="dashboard-shell">
            <div class="dashboard-content">
                <aside class="sidebar" aria-label="Main navigation">
                    <a class="brand" href="../dashboard.php" aria-label="SNAP home">
                        <span class="brand-mark">S</span>
                        <span>
                            <strong>SNAP</strong>
                            <small>Workspace</small>
                        </span>
                    </a>

                    <nav class="primary-nav" aria-label="Workspace">
                        <a class="nav-item" href="../dashboard.php">
                            <img class="nav-icon" src="../../../assets/main icons/Vector.svg" alt="">
                            Home
                        </a>
                        <a class="nav-item" href="../tasks.php">
                            <img class="nav-icon" src="../../../assets/main icons/check-square.svg" alt="">
                            Tasks
                        </a>
                        <a class="nav-item active" href="ai_and_chat.php" aria-current="page">
                            <img class="nav-icon-active" src="../../../assets/main icons/message-circle.svg" alt="">
                            AI &amp; Chat
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
                </aside>

                <main class="dashboard-main chats-panel">
                    <header class="chats-page-header">
                        <a class="back-link" href="ai_and_chat.php" aria-label="Back to AI and Chat">
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M19 12H5m0 0 7 7m-7-7 7-7"></path>
                            </svg>
                            <span>Back</span>
                        </a>
                        <div>
                            <h1>Chats</h1>
                        </div>
                        <a id="profile-avatar" class="profile-placeholder" href="../profile/profile.php"
                            aria-label="Open profile" title="Open profile">S</a>
                    </header>

                    <section id="chat-workspace" class="chat-workspace" aria-label="Chats">
                        <aside class="chat-list-panel" aria-label="Conversation list">
                            <div class="chat-list-header">
                                <div>
                                    <h2>Conversations</h2>
                                    <p id="chat-list-status" role="status">Loading your conversations…</p>
                                    <button id="chat-list-retry" class="inline-action" type="button" hidden>
                                        Retry
                                    </button>
                                </div>
                                <button class="new-chat-mini" id="create-group-button" type="button">
                                    + Group
                                </button>
                            </div>

                            <div class="chat-tabs" role="tablist" aria-label="Conversation type">
                                <button id="direct-tab" class="chat-tab active" type="button"
                                    role="tab" aria-selected="true" aria-controls="conversation-list"
                                    data-chat-type="direct">
                                    Direct
                                </button>
                                <button id="groups-tab" class="chat-tab" type="button"
                                    role="tab" aria-selected="false" aria-controls="conversation-list"
                                    data-chat-type="group">
                                    Groups
                                </button>
                            </div>

                            <section id="group-invitations" class="group-invitations"
                                aria-label="Group invitations" hidden>
                                <h3>Invitations</h3>
                                <div id="group-invitation-list" aria-live="polite"></div>
                            </section>

                            <form id="user-search-form" class="user-search-form" role="search">
                                <label for="user-search-input">Find a SNAP user</label>
                                <div class="search-input-row">
                                    <input id="user-search-input" type="search" maxlength="80"
                                        autocomplete="off" placeholder="Search by name">
                                    <button type="submit">Search</button>
                                </div>
                            </form>

                            <div id="user-search-results" class="user-search-results" aria-live="polite"></div>
                            <div id="conversation-list" class="conversation-list" role="tabpanel"
                                aria-labelledby="direct-tab" tabindex="0">
                                <p class="list-empty">Loading conversations…</p>
                            </div>
                        </aside>

                        <section id="chat-thread" class="chat-thread" aria-label="Selected conversation">
                            <div id="thread-empty" class="thread-empty">
                                <div class="thread-empty-icon" aria-hidden="true">✦</div>
                                <h2>Your study conversations</h2>
                                <p>Select a direct or group chat, or search for a SNAP user to start a conversation.</p>
                            </div>

                            <div id="thread-content" class="thread-content" hidden>
                                <section class="thread-conversation" aria-label="Conversation">
                                    <header class="thread-header">
                                        <button id="thread-back-button" class="thread-back-button" type="button"
                                            aria-label="Back to conversations">‹</button>
                                        <div class="participant-details">
                                            <span id="thread-avatar" class="avatar" aria-hidden="true">S</span>
                                            <div>
                                                <h2 id="thread-title"></h2>
                                                <p id="thread-members" class="thread-members"></p>
                                            </div>
                                        </div>
                                        <button id="add-group-members-button" class="thread-button" type="button" hidden>
                                            Add members
                                        </button>
                                    </header>

                                    <div id="message-stream" class="message-stream" aria-live="polite"
                                        aria-label="Messages">
                                        <p class="list-empty">Loading messages…</p>
                                    </div>

                                    <div id="reply-preview" class="reply-preview" hidden>
                                        <div>
                                            <strong id="reply-preview-sender"></strong>
                                            <span id="reply-preview-body"></span>
                                        </div>
                                        <button id="cancel-reply-button" type="button"
                                            aria-label="Cancel reply">×</button>
                                    </div>

                                    <div id="attachment-composer-preview" class="attachment-composer-preview"
                                        aria-live="polite" hidden>
                                        <img id="attachment-preview-image" alt="" hidden>
                                        <span id="attachment-preview-file-icon"
                                            class="attachment-preview-file-icon"
                                            aria-hidden="true" hidden></span>
                                        <div class="attachment-preview-content">
                                            <strong id="attachment-preview-name"></strong>
                                            <small id="attachment-preview-status"></small>
                                            <progress id="attachment-upload-progress" max="100" value="0"
                                                aria-label="Attachment upload progress" hidden></progress>
                                        </div>
                                        <label id="attachment-public-consent" class="attachment-public-consent" hidden>
                                            <input id="attachment-public-consent-check" type="checkbox" required>
                                            <span>
                                                This file is non-sensitive. I understand anyone with its link can access it,
                                                and an uploaded file may remain public if saving the chat message fails.
                                            </span>
                                        </label>
                                        <button id="attachment-preview-cancel" class="audio-preview-cancel"
                                            type="button">Cancel</button>
                                        <button id="attachment-preview-send" class="audio-preview-send"
                                            type="button" disabled>Send image</button>
                                    </div>

                                    <div id="audio-composer-preview" class="audio-composer-preview"
                                        aria-live="polite" hidden>
                                        <span class="audio-composer-icon" aria-hidden="true">
                                            <svg viewBox="0 0 24 24" focusable="false">
                                                <rect x="9" y="3" width="6" height="12" rx="3"></rect>
                                                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3m-3 0h6"></path>
                                            </svg>
                                        </span>
                                        <div class="audio-composer-content">
                                            <strong id="audio-preview-status">Recording · 00:00</strong>
                                            <audio id="audio-preview-player" controls preload="metadata"
                                                aria-label="Preview voice message" hidden></audio>
                                            <progress id="audio-upload-progress" max="100" value="0"
                                                aria-label="Voice message upload progress" hidden></progress>
                                        </div>
                                        <button id="audio-preview-cancel" class="audio-preview-cancel"
                                            type="button">Cancel</button>
                                        <button id="audio-preview-send" class="audio-preview-send"
                                            type="button" disabled>Send voice</button>
                                    </div>

                                    <form id="message-form" class="composer">
                                        <label class="visually-hidden" for="message-input">Message</label>
                                        <input id="message-input" type="text" maxlength="4000"
                                            autocomplete="off" placeholder="Write a message…" disabled>
                                        <input id="photo-input" type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden>
                                        <input id="file-input" type="file"
                                            accept=".pdf,.txt,.csv,.rtf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
                                            hidden>
                                        <input id="audio-input" type="file" accept="audio/*" hidden>
                                        <span id="audio-recording-status" class="visually-hidden" aria-live="polite"></span>
                                        <button class="composer-attach" id="send-photo-button" type="button"
                                            aria-label="Send image" title="Send image" disabled>
                                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                                <rect x="3.5" y="4.5" width="17" height="15" rx="3"></rect>
                                                <circle cx="9" cy="10" r="1.5"></circle>
                                                <path d="m5 17 4.5-4 3.2 2.7 2.4-2 4.9 4.3"></path>
                                            </svg>
                                        </button>
                                        <button class="composer-attach" id="send-file-button" type="button"
                                            aria-label="Send file" title="Send file" disabled>
                                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                                <path d="M12 15V4"></path>
                                                <path d="m8 8 4-4 4 4"></path>
                                                <path d="M5 13.5v4A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-4"></path>
                                            </svg>
                                        </button>
                                        <button class="composer-attach" id="send-audio-button" type="button"
                                            aria-label="Send audio clip" title="Send audio clip" disabled>
                                            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                                <rect x="9" y="3" width="6" height="12" rx="3"></rect>
                                                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0"></path>
                                                <path d="M12 18v3"></path>
                                                <path d="M9 21h6"></path>
                                            </svg>
                                        </button>
                                        <button class="send-button" id="send-message-button" type="submit" disabled>
                                            Send
                                        </button>
                                    </form>
                                </section>

                                <button id="thread-info-backdrop" class="thread-info-backdrop"
                                    type="button" aria-label="Close group information" hidden></button>
                                <aside id="thread-participants" class="thread-participants"
                                    aria-label="Group information" aria-hidden="true" hidden>
                                    <header class="thread-info-panel-header">
                                        <h2>Group info</h2>
                                        <button id="thread-info-close" class="thread-info-close" type="button"
                                            aria-label="Close group information">×</button>
                                    </header>
                                    <div class="thread-group-profile">
                                        <span id="thread-group-avatar" class="thread-group-avatar">S</span>
                                        <strong id="thread-group-name"></strong>
                                        <small id="thread-group-count"></small>
                                    </div>
                                    <h3>People</h3>
                                    <div id="thread-participant-list" class="thread-participant-list"></div>
                                    <button id="thread-manage-info" class="thread-manage-info" type="button">
                                        Manage conversation
                                    </button>
                                </aside>
                            </div>
                        </section>
                    </section>

                    <p id="chats-error" class="chats-error" role="alert" hidden></p>
                </main>
            </div>
        </div>

        <dialog id="group-dialog" class="chat-dialog" aria-labelledby="group-dialog-title">
            <form id="group-form" method="dialog">
                <h2 id="group-dialog-title">Create a group</h2>
                <label for="group-name-input">Group name</label>
                <input id="group-name-input" type="text" maxlength="80" required>
                <label for="group-member-search">Invite SNAP users</label>
                <div class="search-input-row">
                    <input id="group-member-search" type="search" maxlength="80"
                        autocomplete="off" placeholder="Search by name">
                    <button id="group-member-search-button" type="button">Search</button>
                </div>
                <div id="group-member-results" class="user-search-results" aria-live="polite"></div>
                <div id="selected-group-members" class="selected-members" aria-live="polite"></div>
                <p id="group-dialog-error" class="dialog-error" role="alert" hidden></p>
                <div class="dialog-actions">
                    <button id="cancel-group-button" class="secondary-button" type="button">Cancel</button>
                    <button class="primary-button" type="submit">Create group</button>
                </div>
            </form>
        </dialog>

        <dialog id="add-members-dialog" class="chat-dialog" aria-labelledby="add-members-title">
            <form id="add-members-form" method="dialog">
                <h2 id="add-members-title">Invite group members</h2>
                <label for="add-member-search">Find SNAP users</label>
                <div class="search-input-row">
                    <input id="add-member-search" type="search" maxlength="80"
                        autocomplete="off" placeholder="Search by name">
                    <button id="add-member-search-button" type="button">Search</button>
                </div>
                <div id="add-member-results" class="user-search-results" aria-live="polite"></div>
                <p id="add-member-dialog-error" class="dialog-error" role="alert" hidden></p>
                <div class="dialog-actions">
                    <button id="close-add-members-button" class="secondary-button" type="button">Done</button>
                </div>
            </form>
        </dialog>
    </body>
</html>
