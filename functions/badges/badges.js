
import { auth, db } from "../firebase/firebase.js";

import {
    doc,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


const XP_PER_LEVEL = 100;
const MAX_LEVEL = 100;

function badgeAssetPath(fileName) {
    return `../../assets/badges/${encodeURI(fileName)}`;
}

function achievementAssetPath(fileName) {
    return `../../assets/Achivements/${encodeURI(fileName)}`;
}

const ACHIEVEMENTS = [
    {
        id: "first_step",
        name: "First Step",
        description: "Complete your first task in SNAP.",
        image: achievementAssetPath("First Step.png"),
        condition: stats => stats.completedTasks >= 1
    },
    {
        id: "organized_mind",
        name: "Organized Mind",
        description: "Create your first folder and give your notes a place to stay organized.",
        image: achievementAssetPath("Organized Mind.png"),
        condition: stats => stats.foldersCreated >= 1
    },
    {
        id: "dedicated_learner",
        name: "Dedicated Learner",
        description: "Complete 10 tasks and build a steady learning habit.",
        image: achievementAssetPath("Dedicated Learner.png"),
        condition: stats => stats.completedTasks >= 10
    },
    {
        id: "knowledge_builder",
        name: "Knowledge Builder",
        description: "Complete 25 tasks and keep building your knowledge.",
        image: achievementAssetPath("Knowledge Builder.png"),
        condition: stats => stats.completedTasks >= 25
    },
    {
        id: "scholar",
        name: "Scholar",
        description: "Complete 50 tasks through consistent effort.",
        image: achievementAssetPath("Scholar.png"),
        condition: stats => stats.completedTasks >= 50
    },
    {
        id: "academic_legend",
        name: "Academic Legend",
        description: "Complete 100 tasks and reach a major SNAP milestone.",
        image: achievementAssetPath("Academic Legend.png"),
        condition: stats => stats.completedTasks >= 100
    }
];

const BADGES = [
    {
        level: 10,
        name: "Study Starter",
        assetPath: badgeAssetPath("Study  starter.png"),
        description: "Your SNAP journey is underway. Keep building steady study habits."
    },
    {
        level: 20,
        name: "Knowledge Seeker",
        assetPath: badgeAssetPath("Knowlegde Seeker.png"),
        description: "Curiosity is becoming consistency as you keep learning and growing."
    },
    {
        level: 30,
        name: "Quick Learner",
        assetPath: badgeAssetPath("Quick Learner.png"),
        description: "Your momentum is growing as you make faster, more confident progress."
    },
    {
        level: 40,
        name: "Goal Getter",
        assetPath: badgeAssetPath("Goal Getter.png"),
        description: "You keep turning plans into progress and goals into accomplishments."
    },
    {
        level: 50,
        name: "Study Streak",
        assetPath: badgeAssetPath("Study Streak.png"),
        description: "Consistency is becoming a strong part of how you learn and get things done."
    },
    {
        level: 60,
        name: "Rising Star",
        assetPath: badgeAssetPath("Rising Star.png"),
        description: "Your progress is beginning to stand out. Keep pushing toward the next milestone."
    },
    {
        level: 70,
        name: "Speed Runner",
        assetPath: badgeAssetPath("Speed Runner.png"),
        description: "You are moving through your goals with focus, momentum, and efficiency."
    },
    {
        level: 80,
        name: "Time Master",
        assetPath: badgeAssetPath("Time Master.png"),
        description: "You make your study time count and stay in control of your progress."
    },
    {
        level: 90,
        name: "Task Master",
        assetPath: badgeAssetPath("Task Master.png"),
        description: "Discipline and follow-through have become one of your strongest habits."
    },
    {
        level: 100,
        name: "Legend",
        assetPath: badgeAssetPath("Legend.png"),
        description: "You reached SNAP's highest progression milestone through sustained progress."
    }
];


const badgeGrid = document.getElementById("badgeGrid");
const badgeCount = document.getElementById("badgeCount");
const toggleBadgesButton = document.getElementById("toggleBadgesButton");

const levelBadge = document.getElementById("levelBadge");
const xpText = document.getElementById("xpText");
const xpPercent = document.getElementById("xpPercent");
const xpProgress = document.getElementById("xpProgress");
const xpProgressFill = document.getElementById("xpProgressFill");
const nextLevelText = document.getElementById("nextLevelText");
const xpRemaining = document.getElementById("xpRemaining");
const totalXp = document.getElementById("totalXp");

const rewardGrid = document.getElementById("rewardGrid");
const rewardCount = document.getElementById("rewardCount");

const badgeDialog = document.getElementById("badgeDialog");
const closeBadgeDialog = document.getElementById("closeBadgeDialog");
const dialogBadgeImage = document.getElementById("dialogBadgeImage");
const dialogBadgeStatus = document.getElementById("dialogBadgeStatus");
const dialogBadgeName = document.getElementById("dialogBadgeName");
const dialogBadgeDescription = document.getElementById("dialogBadgeDescription");
const dialogBadgeLevel = document.getElementById("dialogBadgeLevel");

let currentXP = 0;
let expanded = true;
let unsubscribeProgress = null;


function getLevel(xp) {
    return Math.min(
        MAX_LEVEL,
        Math.floor(Math.max(0, xp) / XP_PER_LEVEL)
    );
}


function isBadgeUnlocked(badge, level) {
    return level >= badge.level;
}


function renderBadges() {
    const level = getLevel(currentXP);

    const unlockedBadges = BADGES.filter(
        badge => isBadgeUnlocked(badge, level)
    );

    badgeCount.textContent =
        `${unlockedBadges.length} of ${BADGES.length} unlocked`;

    badgeGrid.replaceChildren();

    const visibleBadges = expanded
        ? BADGES
        : BADGES.slice(0, 4);

    visibleBadges.forEach(badge => {
        const unlocked = isBadgeUnlocked(badge, level);

        const card = document.createElement("button");
        card.type = "button";
        card.className = `badge-card ${unlocked ? "unlocked" : "locked"}`;
        card.setAttribute(
            "aria-label",
            `${badge.name}, level ${badge.level}, ${unlocked ? "unlocked" : "locked"}`
        );

        const imageFrame = document.createElement("span");
        imageFrame.className = "badge-image-frame";

        const image = document.createElement("img");
        image.className = "badge-image";
        image.src = badge.assetPath;
        image.alt = badge.name;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.alt = `${badge.name} image unavailable`;
            image.style.display = "none";
            imageFrame.textContent = "🏅";
            imageFrame.style.fontSize = "2rem";
        }, { once: true });

        imageFrame.appendChild(image);

        const lock = document.createElement("span");
        lock.className = `badge-lock ${unlocked ? "unlocked-mark" : ""}`;
        lock.setAttribute("aria-hidden", "true");
        lock.textContent = unlocked ? "✓" : "🔒";

        const name = document.createElement("span");
        name.className = "badge-name";
        name.textContent = badge.name;

        const badgeLevel = document.createElement("span");
        badgeLevel.className = "badge-level";
        badgeLevel.textContent = `Lv. ${badge.level}`;

        const status = document.createElement("span");
        status.className = "badge-status";
        status.textContent = unlocked ? "Unlocked" : "Locked";

        card.append(
            imageFrame,
            lock,
            name,
            badgeLevel,
            status
        );

        card.addEventListener("click", () => {
            openBadgeDetails(badge, unlocked);
        });

        badgeGrid.appendChild(card);
    });

    renderRewards(unlockedBadges);
}


function formatUnlockedDate(value) {
    if (!value) return "Unlocked";

    const date = typeof value.toDate === "function"
        ? value.toDate()
        : new Date(value);

    if (Number.isNaN(date.getTime())) return "Unlocked";

    return `Unlocked ${date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
    })}`;
}


function renderRewards(unlockedBadges, stats = {}, savedAchievements = {}) {
    const unlockedAchievements = ACHIEVEMENTS.filter(
        achievement => Boolean(savedAchievements[achievement.id]?.unlockedAt)
    );

    rewardCount.textContent =
        `${unlockedAchievements.length} / ${ACHIEVEMENTS.length}`;

    rewardGrid.replaceChildren();

    ACHIEVEMENTS.forEach(achievement => {
        const saved = savedAchievements[achievement.id];
        const unlocked = Boolean(saved?.unlockedAt);

        const card = document.createElement("button");
        card.type = "button";
        card.className = `achievement-card ${unlocked ? "unlocked" : "locked"}`;

        const art = document.createElement("span");
        art.className = "achievement-art";

        const image = document.createElement("img");
        image.src = achievement.image;
        image.alt = achievement.name;
        image.loading = "lazy";

        image.addEventListener("error", () => {
            image.style.display = "none";
            art.textContent = "🏅";
            art.style.fontSize = "2.5rem";
        }, { once: true });

        art.appendChild(image);

        const name = document.createElement("strong");
        name.className = "achievement-name";
        name.textContent = achievement.name;

        const status = document.createElement("span");
        status.className = "achievement-status";
        status.textContent = unlocked ? "Unlocked" : "Locked";

        card.append(art);

        if (unlocked) {
            const date = document.createElement("span");
            date.className = "achievement-date";
            date.textContent = formatUnlockedDate(saved.unlockedAt);
            card.append(name, status, date);
        } else {
            const lock = document.createElement("span");
            lock.className = "achievement-lock";
            lock.textContent = "🔒";
            lock.setAttribute("aria-hidden", "true");

            card.append(lock, name, status);
        }

        card.title = achievement.description;
        card.setAttribute(
            "aria-label",
            `${achievement.name}. ${achievement.description} ${unlocked ? "Unlocked." : "Locked."}`
        );

        rewardGrid.appendChild(card);
    });
}


function updateLevelDisplay() {
    const level = getLevel(currentXP);
    const atMaxLevel = level >= MAX_LEVEL;

    const xpIntoLevel = atMaxLevel
        ? XP_PER_LEVEL
        : currentXP % XP_PER_LEVEL;

    const remaining = atMaxLevel
        ? 0
        : XP_PER_LEVEL - xpIntoLevel;

    const percent = atMaxLevel
        ? 100
        : Math.floor((xpIntoLevel / XP_PER_LEVEL) * 100);

    levelBadge.textContent = `Level ${level}`;
    xpText.textContent = `${xpIntoLevel} / ${XP_PER_LEVEL} XP`;
    xpPercent.textContent = `${percent}%`;

    xpProgressFill.style.width = `${percent}%`;
    xpProgress.setAttribute("aria-valuenow", String(xpIntoLevel));

    totalXp.textContent = `${currentXP.toLocaleString()} XP`;

    if (atMaxLevel) {
        nextLevelText.textContent = "Maximum level reached!";
        xpRemaining.textContent = "You've reached level 100.";
    } else {
        nextLevelText.textContent = `Next level: Level ${level + 1}`;
        xpRemaining.textContent =
            `${remaining.toLocaleString()} XP remaining`;
    }
}


function openBadgeDetails(badge, unlocked) {
    dialogBadgeImage.hidden = true;
    dialogBadgeImage.removeAttribute("src");
    dialogBadgeImage.src = badge.assetPath;
    dialogBadgeImage.alt = badge.name;

    dialogBadgeStatus.textContent =
        unlocked ? "Badge unlocked" : "Locked badge";

    dialogBadgeName.textContent = badge.name;
    dialogBadgeDescription.textContent = badge.description;

    dialogBadgeLevel.textContent = unlocked
        ? `Level ${badge.level} achieved`
        : `Reach level ${badge.level} to unlock`;

    if (!badgeDialog.open) {
        badgeDialog.showModal();
    }
}


dialogBadgeImage.addEventListener("load", () => {
    dialogBadgeImage.hidden = false;
});

dialogBadgeImage.addEventListener("error", () => {
    dialogBadgeImage.hidden = true;
    dialogBadgeImage.removeAttribute("src");
    dialogBadgeImage.alt =
        `${dialogBadgeImage.alt} image unavailable`;
});


toggleBadgesButton.addEventListener("click", () => {
    expanded = !expanded;

    toggleBadgesButton.innerHTML = expanded
        ? 'Show Less <span aria-hidden="true">⌃</span>'
        : 'Show All <span aria-hidden="true">⌄</span>';

    toggleBadgesButton.setAttribute(
        "aria-expanded",
        String(expanded)
    );

    renderBadges();
});


closeBadgeDialog.addEventListener("click", () => {
    badgeDialog.close();
});


badgeDialog.addEventListener("click", event => {
    if (event.target === badgeDialog) {
        badgeDialog.close();
    }
});


onAuthStateChanged(auth, user => {
    if (unsubscribeProgress) {
        unsubscribeProgress();
        unsubscribeProgress = null;
    }

    if (!user) {
        currentXP = 0;
        updateLevelDisplay();
        renderBadges();

        badgeGrid.innerHTML =
            '<p class="badge-error">Please log in to view your achievements.</p>';

        return;
    }

    const progressionRef = doc(
        db,
        "users",
        user.uid,
        "achievements",
        "progression"
    );

    unsubscribeProgress = onSnapshot(
        progressionRef,
        snapshot => {
            const data = snapshot.exists()
                ? snapshot.data()
                : {};

            currentXP = Math.max(
                0,
                Number(data.totalXP) || 0
            );

            updateLevelDisplay();
            renderBadges();
        },
        error => {
            console.error("Unable to load achievements:", error);

            badgeGrid.innerHTML =
                '<p class="badge-error">Could not load achievements. Check your Firestore rules and connection.</p>';
        }
    );
});
