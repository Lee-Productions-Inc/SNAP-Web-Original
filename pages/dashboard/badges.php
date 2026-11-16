
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Achievements | SNAP</title>

    <link rel="stylesheet" href="../../designs/dashboard.css">
    <link rel="stylesheet" href="../../designs/settings/theme.css">
    <link rel="stylesheet" href="../../designs/badges.css?v=20261111b">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>

    <script src="../../functions/settings/global_preferences.js"></script>
    <script type="module" src="../../functions/badges/badges.js?v=20261111a"></script>
</head>
<body class="achievements-page">
    <div class="dashboard-shell">
        <aside class="sidebar" aria-label="Main navigation">
            <a class="brand" href="dashboard.php" aria-label="SNAP home">
                <span class="brand-mark">S</span>
                <span>
                    <strong>SNAP</strong>
                    <small>Workspace</small>
                </span>
            </a>

            <nav class="primary-nav">
                <a class="nav-item" href="dashboard.php">
                    <img class="nav-icon" src="../../assets/main icons/Vector.svg" alt="">
                    Home
                </a>

                <a class="nav-item" href="tasks.php">
                    <img class="nav-icon" src="../../assets/main icons/check-square.svg" alt="">
                    Tasks
                </a>

                <a class="nav-item" href="ai and chat/ai_and_chat.php">
                    <img class="nav-icon" src="../../assets/main icons/message-circle.svg" alt="">
                    AI &amp; Chat
                </a>

                <a class="nav-item active" href="badges.php">
                    <img class="nav-icon-active" src="../../assets/main icons/badge-check.svg" alt="">
                    Badge
                </a>

                <a class="nav-item" href="profile/profile.php">
                    <img class="nav-icon" src="../../assets/main icons/user.svg" alt="">
                    Profile
                </a>
            </nav>

            <div class="recent-notes">
                <h2>Recent Notes</h2>
                <div class="empty-recent" aria-hidden="true"></div>
            </div>
        </aside>

        <main class="dashboard-main">
            <section class="achievement-panel" aria-labelledby="achievements-title">
                <h1 id="achievements-title">Achievements</h1>
                <p class="subtitle">Track your progress, unlock badges, and celebrate milestones.</p>

                <section class="level-card" aria-labelledby="levelHeading">
                    <div class="section-header-row">
                        <h2 id="levelHeading">Your Level</h2>
                        <span class="level-badge" id="levelBadge">Level 0</span>
                    </div>

                    <p class="level-copy">Keep earning XP to level up and unlock new rewards.</p>

                    <div class="xp-line">
                        <span id="xpText">0 / 100 XP</span>
                        <span id="xpPercent">0%</span>
                    </div>

                    <div
                        class="progress-track"
                        role="progressbar"
                        id="xpProgress"
                        aria-label="Experience progress"
                        aria-valuemin="0"
                        aria-valuemax="100"
                        aria-valuenow="0"
                    >
                        <span class="progress-fill" id="xpProgressFill"></span>
                    </div>

                    <div class="next-level-row">
                        <span class="next-level-icon" aria-hidden="true">✦</span>
                        <div>
                            <strong id="nextLevelText">Next level: Level 1</strong>
                            <small id="xpRemaining">100 XP remaining</small>
                        </div>
                    </div>

                    <p class="total-xp">Total XP earned: <strong id="totalXp">0 XP</strong></p>
                </section>

                <section class="badges-section" aria-labelledby="badgesHeading">
                    <div class="badges-header">
                        <div>
                            <h3 id="badgesHeading">Badges</h3>
                            <p class="badges-subtitle" id="badgeCount">0 of 10 unlocked</p>
                        </div>

                        <button
                            class="show-all-button"
                            id="toggleBadgesButton"
                            type="button"
                            aria-expanded="true"
                        >
                            Show Less <span aria-hidden="true">⌃</span>
                        </button>
                    </div>

                    <div class="badge-grid" id="badgeGrid">
                        <p class="badge-loading">Loading your achievements...</p>
                    </div>
                </section>

                
<section class="rewards-panel achievements-showcase" aria-labelledby="rewardsHeading">
    <div class="showcase-header">
        <div>
            <h3 id="rewardsHeading">Achievements</h3>
            <p>Milestones from the way you learn and organize in SNAP.</p>
        </div>

        <span class="achievement-count" id="rewardCount">0 / 6</span>
    </div>

    <div class="achievement-grid" id="rewardGrid">
        <div class="reward-empty">Loading achievements...</div>
    </div>
</section>

            </section>
        </main>
    </div>

    <dialog class="badge-dialog" id="badgeDialog">
        <button class="badge-dialog-close" id="closeBadgeDialog" type="button" aria-label="Close">
            &times;
        </button>

        <img id="dialogBadgeImage" alt="" class="dialog-badge-image" hidden>

        <p class="dialog-eyebrow" id="dialogBadgeStatus">Locked badge</p>
        <h2 id="dialogBadgeName">Badge name</h2>
        <p id="dialogBadgeDescription"></p>
        <p class="dialog-level" id="dialogBadgeLevel"></p>
    </dialog>
</body>
</html>
