<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>AI &amp; Chat | SNAP</title>

    <link
        rel="stylesheet"
        href="../../../designs/dashboard.css"
    >

    <link
        rel="stylesheet"
        href="../../../designs/ai/ai_chat.css?v=5"
    >
    <link rel="stylesheet" href="../../../designs/settings/theme.css">
    <link rel="stylesheet" href="../../../designs/ai/chat_upgrade.css?v=20261111a">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>

</head>

<body>

    <div class="dashboard-shell">

        <div class="dashboard-content">

            <!-- =========================================
                 SNAP SIDEBAR
                 ========================================= -->

            <aside
                class="sidebar"
                aria-label="Main navigation"
            >

                <a
                    class="brand"
                    href="../dashboard.php"
                    aria-label="SNAP home"
                >

                    <span class="brand-mark">
                        S
                    </span>

                    <span>

                        <strong>
                            SNAP
                        </strong>

                        <small>
                            Workspace
                        </small>

                    </span>

                </a>


                <nav class="primary-nav">

                    <a
                        class="nav-item"
                        href="../dashboard.php"
                    >

                        <img
                            class="nav-icon"
                            src="../../../assets/main icons/Vector.svg"
                            alt=""
                        >

                        Home

                    </a>


                    <a
                        class="nav-item"
                        href="../tasks.php"
                    >

                        <img
                            class="nav-icon"
                            src="../../../assets/main icons/check-square.svg"
                            alt=""
                        >

                        Tasks

                    </a>


                    <a
                        class="nav-item active"
                        href="ai_and_chat.php"
                    >

                        <img
                            class="nav-icon-active"
                            src="../../../assets/main icons/message-circle.svg"
                            alt=""
                        >

                        AI &amp; Chat

                    </a>


                    <a
                        class="nav-item"
                        href="../badges.php"
                    >

                        <img
                            class="nav-icon"
                            src="../../../assets/main icons/badge-check.svg"
                            alt=""
                        >

                        Badge

                    </a>


                    <a
                        class="nav-item"
                        href="../profile/profile.php"
                    >

                        <img
                            class="nav-icon"
                            src="../../../assets/main icons/user.svg"
                            alt=""
                        >

                        Profile

                    </a>

                </nav>


                <!-- =====================================
                     CHAT SIDEBAR
                     ===================================== -->

                <div class="chat-sidebar-section">

                    <a
                        href="ai.php?new=1"
                        class="new-chat-button"
                    >

                        <span class="new-chat-plus">
                            +
                        </span>

                        <span>
                            New Chat
                        </span>

                    </a>


                    <div class="recent-chat-section">

                        <div class="recent-chat-heading">
                            Recent
                        </div>


                        <div id="ai-recent-sidebar-list" class="recent-chat-list" aria-live="polite">
                            <p class="recent-chat-empty">Loading recent conversations...</p>
                        </div>

                    </div>

                </div>

            </aside>


            <!-- =========================================
                 AI & CHAT CONTENT
                 ========================================= -->

            <main
                class="dashboard-main ai-hub-page"
                aria-label="AI & Chat"
            >

                <section class="ai-hub-layout">

                    <!-- =================================
                         AI & CHAT INTRO
                         ================================= -->

                    <div class="ai-hub-header">

                        <div>

                            <div class="ai-hub-eyebrow">
                                SNAP Workspace
                            </div>

                            <h1>
                                AI &amp; Chat
                            </h1>

                            <p>
                                Study, organize, and connect in one place.
                            </p>

                        </div>


                        <a
                            href="ai.php?new=1"
                            class="hub-new-chat"
                            aria-label="Start a new chat"
                        >

                            <span>
                                +
                            </span>

                        </a>

                    </div>


                    <!-- =================================
                         MAIN OPTIONS
                         ================================= -->

                    <div class="ai-hub-options">


                        <!-- SNAP AI -->

                        <a
                            href="ai.php"
                            class="ai-hub-card ai-hub-card-primary"
                        >

                            <div class="ai-hub-card-top">

                                <div class="ai-hub-icon ai-icon-blue">
                                    ✦
                                </div>

                                <div class="ai-hub-arrow">
                                    →
                                </div>

                            </div>


                            <div class="ai-hub-card-content">

                                <h2>
                                    SNAP AI
                                </h2>

                                <p>
                                    Your personal study and productivity assistant.
                                </p>

                            </div>

                        </a>


                        <!-- CHATS -->

                        <a
                            href="chats.php"
                            class="ai-hub-card"
                            aria-label="Open chats"
                        >

                            <div class="ai-hub-card-top">

                                <div class="ai-hub-icon ai-icon-direct">
                                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                        <path d="M7.5 18.5 4 20l1.5-3.5A8 8 0 1 1 8 19.2"></path>
                                        <path d="M8 10h8M8 14h5"></path>
                                    </svg>
                                </div>

                                <div class="ai-hub-arrow">
                                    →
                                </div>

                            </div>


                            <div class="ai-hub-card-content">

                                <h2>
                                    CHATS
                                </h2>

                                <p>
                                    Connect with friends and study together.
                                </p>

                            </div>

                        </a>

                    </div>


                    <!-- =================================
                         RECENT
                         ================================= -->

                    <section class="ai-hub-recent">

                        <div class="ai-hub-section-title">

                            <h2>
                                Recent
                            </h2>

                        </div>


                        <div id="ai-recent-list" class="ai-recent-list" aria-live="polite">
                            <p class="ai-recent-empty">Loading recent conversations...</p>
                        </div>

                    </section>

                </section>

            </main>

        </div>

    </div>

    <script src="../../../functions/settings/global_preferences.js"></script>
    <script
        type="module"
        src="../../../functions/ai_chat/ai_hub.js?v=5"
    ></script>
    <script
        type="module"
        src="../../../functions/ai_chat/chat_upgrade.js?v=20261115-chat-profile-2"
    ></script>

</body>

</html>