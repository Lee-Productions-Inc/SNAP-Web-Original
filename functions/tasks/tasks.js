// ============================================
// SNAP TASK SYSTEM
// FIREBASE VERSION
// ============================================

import { auth, db } from "../firebase/firebase.js";

import {
    setupTaskDetails
} from "./task_details.js?v=20261115-api-config-1";

import {
    registerFCM
} from "../firebase/messaging.js";


import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    getDoc,
    serverTimestamp,
    runTransaction
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ============================================
// GET HTML ELEMENTS
// ============================================

const newTaskButton =
    document.getElementById("newTaskButton");

const taskModal =
    document.getElementById("taskModal");

const closeTaskModal =
    document.getElementById("closeTaskModal");

const taskForm =
    document.getElementById("taskForm");

const taskTitle =
    document.getElementById("taskTitle");

const taskCategory =
    document.getElementById("taskCategory");

const customCategory =
    document.getElementById("customCategory");

const taskDueDate =
    document.getElementById("taskDueDate");

const taskDueTime =
    document.getElementById("taskDueTime");

const taskReminder =
    document.getElementById("taskReminder");

const reminderLeadTimes = ["5 minutes", "15 minutes", "30 minutes", "1 hour", "1 day"];
let defaultReminderLeadTime = "15 minutes";

const taskDescription =
    document.getElementById("taskDescription");

const myTasksGrid =
    document.getElementById("myTasksGrid");


// ============================================
// IN PROGRESS SECTION TITLE
// ============================================

const inProgressTitle =
    document.createElement("h2");

inProgressTitle.className =
    "in-progress-section-title";

inProgressTitle.textContent =
    "In Progress";


// Put the title directly above My Tasks grid

myTasksGrid.parentNode.insertBefore(
    inProgressTitle,
    myTasksGrid
);


const overdueTasksGrid =
    document.getElementById("overdueTasksGrid");

const completedTasksGrid =
    document.getElementById("completedTasksGrid");

const taskSearch =
    document.getElementById("taskSearch");

const taskFilters =
    document.querySelectorAll(".task-filter");

let activeCategory = "All";

// ============================================
// EDIT TASK ELEMENTS
// ============================================

const editTaskModal =
    document.getElementById("editTaskModal");

const closeEditTaskModal =
    document.getElementById(
        "closeEditTaskModal"
    );

const editTaskForm =
    document.getElementById("editTaskForm");

const editTaskTitle =
    document.getElementById("editTaskTitle");

const editTaskCategory =
    document.getElementById(
        "editTaskCategory"
    );

const editCustomCategory =
    document.getElementById(
        "editCustomCategory"
    );

const editTaskDueDate =
    document.getElementById(
        "editTaskDueDate"
    );

const editTaskDueTime =
    document.getElementById(
        "editTaskDueTime"
    );

const editTaskReminder =
    document.getElementById(
        "editTaskReminder"
    );

const editTaskDescription =
    document.getElementById(
        "editTaskDescription"
    );

let editingTaskId = null;


// ============================================
// FIREBASE TASK STATE
// ============================================

let tasks = [];

let currentUser = null;

let unsubscribeTasks = null;
let taskDetailsUI = null;
let linkedTaskOpened = false;


// ============================================
// CUSTOM CATEGORY
// ============================================

taskCategory.addEventListener(
    "change",
    function () {

        if (
            taskCategory.value ===
            "Customize"
        ) {

            customCategory.style.display =
                "block";

            customCategory.required =
                true;

            customCategory.focus();

        }
        else {

            customCategory.style.display =
                "none";

            customCategory.required =
                false;

            customCategory.value =
                "";

        }

    }
);


editTaskCategory.addEventListener(
    "change",
    function () {

        if (
            editTaskCategory.value ===
            "Customize"
        ) {

            editCustomCategory.style.display =
                "block";

            editCustomCategory.required =
                true;

            editCustomCategory.focus();

        }
        else {

            editCustomCategory.style.display =
                "none";

            editCustomCategory.required =
                false;

            editCustomCategory.value =
                "";

        }

    }
);


// ============================================
// FIRESTORE TASK COLLECTION
// ============================================

function getTasksCollection() {

    if (!currentUser) {
        return null;
    }

    return collection(
        db,
        "users",
        currentUser.uid,
        "tasks"
    );

}


// ============================================
// AUTHENTICATION
// ============================================

onAuthStateChanged(
    auth,
    async function (user) {

        if (reminderCheckInterval) {

            clearInterval(
                reminderCheckInterval
            );

            reminderCheckInterval =
                null;

        }

        if (reminderCheckTimeout) {

            clearTimeout(
                reminderCheckTimeout
            );

            reminderCheckTimeout =
                null;

        }

        currentUser = user;

        // Stop previous listener
        if (unsubscribeTasks) {

            unsubscribeTasks();

            unsubscribeTasks = null;

        }


        // No logged-in user
        if (!user) {

            tasks = [];

            renderTasks(
                taskSearch.value
            );

            return;

        }

        try {
            const preferencesSnapshot = await getDoc(
                doc(db, "users", user.uid, "settings", "preferences")
            );
            const notificationPreferences = preferencesSnapshot.exists()
                ? preferencesSnapshot.data().notifications
                : null;
            if (notificationPreferences &&
                typeof notificationPreferences.taskReminders === "boolean") {
                localStorage.setItem(
                    "snap-notification-preferences:" + user.uid,
                    JSON.stringify(notificationPreferences)
                );
            }
        } catch (error) {
            console.error("Unable to load task reminder preferences:", error);
        }

        loadDefaultReminderLeadTime();


// ========================================
// REGISTER FCM FOR THIS USER
// ========================================

void registerFCM();



        // Listen to Firebase tasks
        const tasksCollection =
            getTasksCollection();

        unsubscribeTasks =
            onSnapshot(
                tasksCollection,
                function (snapshot) {

                    tasks =
                        snapshot.docs.map(
                            function (document) {

                                return {
                                    id: document.id,
                                    ...document.data()
                                };

                            }
                        );


                    renderTasks(
                        taskSearch.value
                    );

                    taskDetailsUI?.sync();

                    // Open a specific task when arriving from Home.
                    if (!linkedTaskOpened) {
                        const requestedId =
                            new URLSearchParams(
                                window.location.search
                            ).get("task");

                        if (
                            requestedId &&
                            tasks.some(
                                task =>
                                    task.id === requestedId &&
                                    task.deleted !== true
                            )
                        ) {
                            linkedTaskOpened = true;

                            taskDetailsUI?.open(requestedId);
                        }
                    }

                    startReminderChecker();

                },
                function (error) {

                    console.error(
                        "Error loading tasks:",
                        error
                    );

                    alert(
                        "Unable to load your tasks from Firebase."
                    );

                }
            );

    }
);

window.addEventListener("storage", event => {
    if (currentUser && event.key === "snap-notification-preferences:" + currentUser.uid) {
        loadDefaultReminderLeadTime();
        scheduleNextReminderCheck();
    }
});

function loadDefaultReminderLeadTime() {
    try {
        const rawPreferences = currentUser
            ? localStorage.getItem("snap-notification-preferences:" + currentUser.uid)
            : null;
        const preferences = rawPreferences ? JSON.parse(rawPreferences) : null;
        const selectedLeadTime = preferences && preferences.defaultReminderLeadTime;
        defaultReminderLeadTime = reminderLeadTimes.includes(selectedLeadTime)
            ? selectedLeadTime
            : "15 minutes";
    } catch (error) {
        console.error("Unable to read the default task reminder lead time:", error);
        defaultReminderLeadTime = "15 minutes";
    }

    if (!taskModal.classList.contains("show")) {
        taskReminder.value = defaultReminderLeadTime;
    }
}


// ============================================
// OPEN NEW TASK MODAL
// ============================================

newTaskButton.addEventListener(
    "click",
    function () {

        taskReminder.value = defaultReminderLeadTime;
        taskModal.classList.add(
            "show"
        );

        taskModal.setAttribute(
            "aria-hidden",
            "false"
        );

        taskTitle.focus();

    }
);


// ============================================
// CLOSE NEW TASK MODAL
// ============================================

function closeModal() {

    taskModal.classList.remove(
        "show"
    );

    taskModal.setAttribute(
        "aria-hidden",
        "true"
    );

}


closeTaskModal.addEventListener(
    "click",
    closeModal
);


// ============================================
// CREATE NEW TASK
// ============================================

taskForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (!currentUser) {

            alert(
                "Please log in first."
            );

            return;

        }


        const categoryValue =
            taskCategory.value ===
            "Customize"

                ? customCategory.value.trim()

                : taskCategory.value.trim();


        const newTask = {

    title:
        taskTitle.value.trim(),

    category:
        categoryValue,

    dueDate:
        taskDueDate.value,

    dueTime:
        taskDueTime.value,

    reminder:
        taskReminder.value,

    reminderSentAt:
        null,

    description:
        taskDescription.value.trim(),

    completed:
        false,

    completedAt:
        null,

    deleted:
        false,

    deletedAt:
        null,

    createdAt:
        serverTimestamp(),

    updatedAt:
        serverTimestamp()

};


        if (
            !newTask.title ||
            !newTask.category ||
            !newTask.dueDate
        ) {

            alert(
                "Please fill in the required fields."
            );

            return;

        }


        try {

            const tasksCollection =
                getTasksCollection();


            await addDoc(
                tasksCollection,
                newTask
            );


            if (newTask.reminder) {

                await requestReminderPermission();

            }


            // Reset form
            taskForm.reset();


            customCategory.style.display =
                "none";

            customCategory.required =
                false;

            customCategory.value =
                "";


            closeModal();

        }
        catch (error) {

            console.error(
                "Error creating task:",
                error
            );

            alert(
                "Unable to create the task."
            );

        }

    }
);


// ============================================
// GET LOCAL DUE DATE/TIME
// ============================================

function getTaskDueDateTime(task) {

    if (!task.dueDate) {

        return null;

    }


    const dateParts =
        task.dueDate.split("-");


    const year =
        Number(dateParts[0]);

    const month =
        Number(dateParts[1]);

    const day =
        Number(dateParts[2]);


    let hour = 23;

    let minute = 59;


    if (task.dueTime) {

        const timeParts =
            task.dueTime.split(":");

        hour =
            Number(timeParts[0]);

        minute =
            Number(timeParts[1]);

    }


    return new Date(
        year,
        month - 1,
        day,
        hour,
        minute,
        59,
        999
    );

}


// ============================================
// SNAP TASK REMINDER SYSTEM
// ============================================

let reminderCheckInterval = null;
let reminderCheckTimeout = null;

const reminderNotificationsInFlight =
    new Set();

const remindedTasksThisSession =
    new Set();

// ============================================
// REMINDER DURATIONS
// ============================================

function getReminderMinutes(
    reminder
) {

    const reminderDurations = {

        "5 minutes": 5,

        "15 minutes": 15,

        "30 minutes": 30,

        "1 hour": 60,

        "1 day": 1440

    };

    return (
        reminderDurations[reminder] ||
        0
    );

}

// ============================================
// GET TASK REMINDER DATE/TIME
// ============================================

function getTaskReminderDateTime(
    task
) {

    if (
        !task ||
        !task.dueDate ||
        !task.reminder
    ) {

        return null;

    }

    const dueDateTime =
        getTaskDueDateTime(task);

    if (
        !dueDateTime ||
        Number.isNaN(
            dueDateTime.getTime()
        )
    ) {

        return null;

    }

    const reminderMinutes =
        getReminderMinutes(task.reminder);

    if (
        reminderMinutes <= 0
    ) {

        return null;

    }

    return new Date(
        dueDateTime.getTime() -
        reminderMinutes *
        60 *
        1000
    );

}

// ============================================
// REQUEST NOTIFICATION PERMISSION
// ============================================

async function requestReminderPermission() {

    if (
        !("Notification" in window)
    ) {

        console.warn(
            "This browser does not support notifications."
        );

        return false;

    }

    if (
        Notification.permission ===
        "granted"
    ) {

        return true;

    }

    if (
        Notification.permission ===
        "denied"
    ) {

        return false;

    }

    try {

        const permission =
            await Notification.requestPermission();

        return (
            permission ===
            "granted"
        );

    }
    catch (error) {

        console.error(
            "Notification permission error:",
            error
        );

        return false;

    }

}

// ============================================
// SHOW TASK REMINDER
// ============================================

function showTaskReminder(
    task
) {

    if (
        !("Notification" in window) ||
        Notification.permission !==
            "granted"
    ) {

        return false;

    }

    const reminderMessages = {

        5:
            "Your task is due in 5 minutes.",

        15:
            "Your task is due in 15 minutes.",

        30:
            "Your task is due in 30 minutes.",

        60:
            "Your task is due in 1 hour.",

        1440:
            "Your task is due tomorrow."

    };

    const reminderMinutes =
        getReminderMinutes(task.reminder);

    try {

        const notification =
            new Notification(
                "SNAP Task Reminder",
                {

                    body:
                        task.title +
                        "\n" +
                        (
                            reminderMessages[
                                reminderMinutes
                            ] ||
                            "Your task is due soon."
                        ),

                    icon:
                        "../../assets/logo/Copilot_20260907_145330.png",

                    tag:
                        "snap-task-" +
                        task.id,

                    requireInteraction:
                        false

                }
            );

        notification.onclick =
            function () {

                window.focus();

                notification.close();

            };

        return true;

    }
    catch (error) {

        console.error(
            "Unable to show task notification:",
            error
        );

        return false;

    }

}

function areTaskRemindersEnabled() {
    try {
        const rawPreferences = currentUser
            ? localStorage.getItem("snap-notification-preferences:" + currentUser.uid)
            : null;
        if (!rawPreferences) return true;
        const preferences = JSON.parse(rawPreferences);
        return preferences.taskReminders !== false;
    } catch (error) {
        console.error("Unable to read task reminder preference:", error);
        return false;
    }
}

// ============================================
// CHECK ALL TASK REMINDERS
// ============================================

async function checkTaskReminders() {

    if (!areTaskRemindersEnabled()) {

        return;

    }

    if (
        !currentUser
    ) {

        return;

    }

    if (
        !("Notification" in window)
    ) {

        return;

    }

    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }

    const now =
        Date.now();

    for (
        const task of tasks
    ) {

        if (

            task.completed ||

            task.deleted === true ||

            !task.reminder ||

            task.reminderSentAt ||

            reminderNotificationsInFlight.has(task.id) ||

            remindedTasksThisSession.has(task.id)

        ) {

            continue;

        }

        const reminderDateTime =
            getTaskReminderDateTime(task);

        if (
            !reminderDateTime ||
            Number.isNaN(
                reminderDateTime.getTime()
            )
        ) {

            continue;

        }

        const reminderTime =
            reminderDateTime.getTime();

        // Reminder time has not arrived yet.
        if (
            now <
            reminderTime
        ) {

            continue;

        }

        const dueDateTime =
            getTaskDueDateTime(task);

        if (
            !dueDateTime ||
            Number.isNaN(
                dueDateTime.getTime()
            )
        ) {

            continue;

        }

        // Do not send a reminder after
        // the task has already become due.
        if (
            now >=
            dueDateTime.getTime()
        ) {

            continue;

        }

        reminderNotificationsInFlight.add(
            task.id
        );

        try {

            const notificationShown =
                showTaskReminder(
                    task
                );

            if (
                notificationShown
            ) {

                remindedTasksThisSession.add(
                    task.id
                );

                const taskReference =
                    doc(
                        db,
                        "users",
                        currentUser.uid,
                        "tasks",
                        task.id
                    );

                await updateDoc(
                    taskReference,
                    {

                        reminderSentAt:
                            serverTimestamp(),

                        updatedAt:
                            serverTimestamp()

                    }
                );

            }

        }
        catch (error) {

            console.error(
                "Unable to send or mark task reminder:",
                error
            );

        }
        finally {

            reminderNotificationsInFlight.delete(
                task.id
            );

        }

    }

}

// ============================================
// FIND NEXT REMINDER
// ============================================

function getNextReminderTime() {

    if (!areTaskRemindersEnabled()) {

        return null;

    }

    if (
        !currentUser
    ) {

        return null;

    }

    let nextReminderTime =
        null;

    const now =
        Date.now();

    for (
        const task of tasks
    ) {

        if (

            task.completed ||

            task.deleted === true ||

            !task.reminder ||

            task.reminderSentAt ||

            remindedTasksThisSession.has(
                task.id
            )

        ) {

            continue;

        }

        const reminderDateTime =
            getTaskReminderDateTime(
                task
            );

        if (
            !reminderDateTime
        ) {

            continue;

        }

        const reminderTime =
            reminderDateTime.getTime();

        if (
            reminderTime <= now
        ) {

            continue;

        }

        if (
            nextReminderTime === null ||
            reminderTime <
                nextReminderTime
        ) {

            nextReminderTime =
                reminderTime;

        }

    }

    return nextReminderTime;

}

// ============================================
// SCHEDULE NEXT REMINDER CHECK
// ============================================

function scheduleNextReminderCheck() {

    if (
        reminderCheckTimeout
    ) {

        clearTimeout(
            reminderCheckTimeout
        );

        reminderCheckTimeout =
            null;

    }

    const nextReminderTime =
        getNextReminderTime();

    if (
        !nextReminderTime
    ) {

        return;

    }

    const delay =
        Math.max(
            1000,
            nextReminderTime -
                Date.now()
        );

    reminderCheckTimeout =
        setTimeout(
            function () {

                reminderCheckTimeout =
                    null;

                void checkTaskReminders();

                scheduleNextReminderCheck();

            },
            delay
        );

}

function startReminderChecker() {

    if (
        reminderCheckInterval
    ) {

        clearInterval(
            reminderCheckInterval
        );

        reminderCheckInterval =
            null;

    }

    if (
        reminderCheckTimeout
    ) {

        clearTimeout(
            reminderCheckTimeout
        );

        reminderCheckTimeout =
            null;

    }

    // Check immediately.
    void checkTaskReminders();

    // Keep checking while SNAP is running.
    reminderCheckInterval =
        setInterval(
            function () {

                void checkTaskReminders();

                scheduleNextReminderCheck();

            },
            10000
        );

    // Also schedule the next exact reminder.
    scheduleNextReminderCheck();

}

// ============================================
// REMINDER RECOVERY EVENTS
// ============================================

// When the user comes back to SNAP.
document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.visibilityState ===
            "visible"
        ) {

            void checkTaskReminders();

            scheduleNextReminderCheck();

        }

    }
);

// When the browser window receives focus.
window.addEventListener(
    "focus",
    function () {

        void checkTaskReminders();

        scheduleNextReminderCheck();

    }
);

// When the page is restored from browser cache.
window.addEventListener(
    "pageshow",
    function () {

        void checkTaskReminders();

        scheduleNextReminderCheck();

    }
);

// When the device/browser reconnects.
window.addEventListener(
    "online",
    function () {

        void checkTaskReminders();

        scheduleNextReminderCheck();

    }
);

// ============================================
// CHECK IF TASK IS OVERDUE
// ============================================

function isOverdue(task) {

    if (task.completed) {

        return false;

    }


    if (!task.dueDate) {

        return false;

    }


    const dueDateTime =
        getTaskDueDateTime(task);


    if (!dueDateTime) {

        return false;

    }


    return (
        dueDateTime.getTime() <
        Date.now()
    );

}


// ============================================
// FORMAT DATE
// ============================================

function formatDate(dateString) {

    if (!dateString) {

        return "";

    }


    const parts =
        dateString.split("-");


    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


// ============================================
// FORMAT TIME
// ============================================

function formatTime(timeString) {

    if (!timeString) {

        return "";

    }


    const parts =
        timeString.split(":");


    let hours =
        parseInt(
            parts[0],
            10
        );


    const minutes =
        parts[1];


    const period =
        hours >= 12
            ? "PM"
            : "AM";


    hours =
        hours % 12 || 12;


    return (
        hours +
        ":" +
        minutes +
        " " +
        period
    );

}


// ============================================
// GET TASK STATUS
// ============================================

function getTaskStatus(task) {

    if (task.completed) {

        return "completed";

    }


    if (isOverdue(task)) {

        return "overdue";

    }


    return "in-progress";

}


// ============================================
// CREATE TASK CARD
// ============================================

function createTaskCard(task) {

    const card =
        document.createElement("div");

    card.className =
        "task-card";


    const taskStatus =
        getTaskStatus(task);


    card.classList.add(
        "status-" + taskStatus
    );

    // ============================================
    // TASK DETAILS CLICK + PRIORITY APPEARANCE
    // ============================================

    card.dataset.taskId = task.id;

    card.tabIndex = 0;

    card.setAttribute(
        "aria-label",
        `View task details: ${task.title || "Untitled task"}`
    );

    const hasPriority =
        task.priority === true ||
        task.isPriority === true ||
        ["high", "urgent", "priority"].includes(
            String(task.priority || "").toLowerCase()
        );

    card.classList.toggle(
        "snap-is-priority",
        hasPriority
    );

    card.addEventListener("click", event => {
        if (
            event.target.closest(
                "button, a, input, select, textarea, .task-menu-wrapper"
            )
        ) {
            return;
        }

        taskDetailsUI?.open(task.id);
    });

    card.addEventListener("keydown", event => {
        if (
            event.target !== card ||
            !["Enter", " "].includes(event.key)
        ) {
            return;
        }

        event.preventDefault();

        taskDetailsUI?.open(task.id);
    });


    // ========================================
    // TOP ROW
    // ========================================

    const topRow =
        document.createElement("div");

    topRow.className =
        "task-card-top";


    // ========================================
    // CATEGORY
    // ========================================

    const category =
        document.createElement("div");

    category.className =
        "task-card-category";


    const categoryIcon =
        document.createElement("span");

    categoryIcon.className =
        "task-category-icon";


    categoryIcon.classList.add(
        "task-category-icon-" +
        taskStatus
    );


    const categoryIconImage =
        document.createElement("img");

    categoryIconImage.src =
        "../../assets/file-text.svg";

    categoryIconImage.alt =
        "";

    categoryIconImage.setAttribute(
        "aria-hidden",
        "true"
    );


    categoryIcon.appendChild(
        categoryIconImage
    );


    const categoryText =
        document.createElement("span");

    categoryText.textContent =
        task.category;


    category.appendChild(
        categoryIcon
    );

    category.appendChild(
        categoryText
    );


    // ========================================
    // THREE DOT MENU
    // ========================================

    const menuWrapper =
        document.createElement("div");

    menuWrapper.className =
        "task-menu-wrapper";


    const menuButton =
        document.createElement("button");

    menuButton.type =
        "button";

    menuButton.className =
        "task-menu-button";

    menuButton.textContent =
        "•••";


    const menu =
        document.createElement("div");

    menu.className =
        "task-menu";


    // ========================================
    // EDIT BUTTON
    // ========================================

    const editButton =
        document.createElement("button");

    editButton.type =
        "button";

    editButton.textContent =
        "Edit task";


    editButton.addEventListener(
        "click",
        function () {

            menu.classList.remove(
                "show"
            );

            openEditTask(
                task.id
            );

        }
    );


    // ========================================
    // COMPLETE / MARK ACTIVE
    // ========================================

    const completeMenuButton =
        document.createElement("button");

    completeMenuButton.type =
        "button";

    completeMenuButton.textContent =
        task.completed
            ? "Mark active"
            : "Complete task";


    completeMenuButton.addEventListener(
        "click",
        async function () {

            menu.classList.remove(
                "show"
            );


            if (task.completed) {

                await updateTask(
                    task.id,
                    {
                        completed: false,
                        completedAt: null,
                        updatedAt:
                            serverTimestamp()
                    }
                );

            }
            else {

                await completeTask(
                    task.id
                );

            }

        }
    );


    // ========================================
    // DELETE
    // ========================================

    const deleteMenuButton =
        document.createElement("button");

    deleteMenuButton.type =
        "button";

    deleteMenuButton.className =
        "delete-menu-button";

    deleteMenuButton.textContent =
        "Delete task";


    deleteMenuButton.addEventListener(
        "click",
        function () {

            menu.classList.remove(
                "show"
            );

            deleteTask(
                task.id
            );

        }
    );


    // ============================================
    // MARK / REMOVE PRIORITY
    // ============================================

    const priorityButton =
        document.createElement("button");

    priorityButton.type = "button";

    priorityButton.className =
        "snap-priority-action";

    priorityButton.textContent = hasPriority
        ? "☆ Remove priority"
        : "★ Mark priority";

    priorityButton.addEventListener(
        "click",
        async event => {
            event.stopPropagation();

            menu.classList.remove("show");

            try {
                await taskDetailsUI?.togglePriority(
                    task.id
                );
            } catch (error) {
                console.error(
                    "Could not update task priority:",
                    error
                );

                alert(
                    "Could not update task priority. Please try again."
                );
            }
        }
    );

    // Priority appears first in the three-dot menu.
    menu.appendChild(priorityButton);

    menu.appendChild(
        editButton
    );

    menu.appendChild(
        completeMenuButton
    );

    menu.appendChild(
        deleteMenuButton
    );


    menuButton.addEventListener(
        "click",
        function (event) {

            event.stopPropagation();


            document
                .querySelectorAll(
                    ".task-menu.show"
                )
                .forEach(
                    function (openMenu) {

                        if (
                            openMenu !==
                            menu
                        ) {

                            openMenu.classList.remove(
                                "show"
                            );

                        }

                    }
                );


            menu.classList.toggle(
                "show"
            );

        }
    );


    menuWrapper.appendChild(
        menuButton
    );

    menuWrapper.appendChild(
        menu
    );


    topRow.appendChild(category);

    if (hasPriority) {
        const star =
            document.createElement("span");

        star.className = "snap-card-star";

        star.title = "Priority task";

        star.setAttribute("aria-label", "Priority task");

        star.textContent = "★";

        topRow.appendChild(star);
    }

    topRow.appendChild(menuWrapper);


    // ========================================
    // TITLE
    // ========================================

    const title =
        document.createElement("h3");

    title.className =
        "task-card-title";

    title.textContent =
        task.title;


    // ========================================
    // DESCRIPTION
    // ========================================

    const description =
        document.createElement("p");

    description.className =
        "task-card-description";

    description.textContent =
        task.description ||
        "No description provided.";


    // ========================================
    // DUE / STATUS
    // ========================================

    const due =
        document.createElement("div");

    due.className =
        "task-card-due";


    const dueIcon =
        document.createElement("span");

    dueIcon.className =
        "task-due-icon";


    const dueText =
        document.createElement("span");


    // ========================================
    // COMPLETED
    // ========================================

    if (
        taskStatus ===
        "completed"
    ) {

        dueIcon.textContent =
            "✓";


        let text =
            "Completed";


        if (task.dueDate) {

            text +=
                " • Due " +
                formatDate(
                    task.dueDate
                );

        }


        if (task.dueTime) {

            text +=
                " at " +
                formatTime(
                    task.dueTime
                );

        }


        dueText.textContent =
            text;


        due.classList.add(
            "completed-due"
        );

    }


    // ========================================
    // OVERDUE
    // ========================================

    else if (
        taskStatus ===
        "overdue"
    ) {

        dueIcon.textContent =
            "⚠";


        let text =
            "Overdue";


        if (task.dueDate) {

            text +=
                " • Due " +
                formatDate(
                    task.dueDate
                );

        }


        if (task.dueTime) {

            text +=
                " at " +
                formatTime(
                    task.dueTime
                );

        }


        dueText.textContent =
            text;


        due.classList.add(
            "overdue-due"
        );

    }


    // ========================================
    // IN PROGRESS
    // ========================================

    else {

        dueIcon.textContent =
            "◷";


        // IMPORTANT:
        // Explicitly show IN PROGRESS

        let text =
            "In Progress";


        if (task.dueDate) {

            text +=
                " • Due " +
                formatDate(
                    task.dueDate
                );

        }


        if (task.dueTime) {

            text +=
                " at " +
                formatTime(
                    task.dueTime
                );

        }


        dueText.textContent =
            text;


        due.classList.add(
            "in-progress-due"
        );

    }


    due.appendChild(
        dueIcon
    );

    due.appendChild(
        dueText
    );


    // ========================================
    // BOTTOM ACTIONS
    // ========================================

    const actions =
        document.createElement("div");

    actions.className =
        "task-card-actions";


    // ========================================
// ACTIVE TASK
// ========================================

if (!task.completed) {

    // ========================================
    // REMINDER BUTTON ONLY
    // ========================================

    const reminderButton =
        document.createElement("button");

    reminderButton.type =
        "button";

    reminderButton.className =
        task.reminder

            ? "reminder-task-button reminder-task-button-on"

            : "reminder-task-button reminder-task-button-off";


    const reminderIcon =
        document.createElement("span");

    reminderIcon.className =
        "reminder-icon";

    reminderIcon.textContent =
        "!";


    const reminderText =
        document.createElement("span");

    reminderText.textContent =
        task.reminder
            ? "Reminder on"
            : "Reminder off";


    reminderButton.appendChild(
        reminderIcon
    );

    reminderButton.appendChild(
        reminderText
    );


    reminderButton.addEventListener(
        "click",
        function () {

            toggleReminder(
                task.id
            );

        }
    );


    actions.appendChild(
        reminderButton
    );

}


    // ========================================
    // COMPLETED TASK
    // ========================================

    else {

        const completedButton =
            document.createElement("button");

        completedButton.type =
            "button";

        completedButton.className =
            "completed-task-button";


        const completedIcon =
            document.createElement("span");

        completedIcon.className =
            "completed-icon";

        completedIcon.textContent =
            "✓";


        const completedText =
            document.createElement("span");

        completedText.textContent =
            "Complete";


        completedButton.appendChild(
            completedIcon
        );

        completedButton.appendChild(
            completedText
        );


        actions.appendChild(
            completedButton
        );

    }


    // ========================================
    // ADD EVERYTHING
    // ========================================

    card.appendChild(
        topRow
    );

    card.appendChild(
        title
    );

    card.appendChild(
        description
    );

    card.appendChild(
        due
    );

    card.appendChild(
        actions
    );


    return card;

}


// ============================================
// SORT TASKS
// ============================================

function getSortTime(task) {

    const date =
        getTaskDueDateTime(task);


    if (date) {

        return date.getTime();

    }


    return Number.MAX_SAFE_INTEGER;

}


// ============================================
// RENDER TASKS
// ============================================

function renderTasks(
    searchTerm = ""
) {

    myTasksGrid.innerHTML =
        "";

    overdueTasksGrid.innerHTML =
        "";

    completedTasksGrid.innerHTML =
        "";


    const search =
        searchTerm
            .toLowerCase()
            .trim();


    const filteredTasks =
        tasks.filter(
            function (task) {

                // Do not show deleted tasks
                if (task.deleted === true) {
                    return false;
                }

                const title =
                    String(
                        task.title || ""
                    ).toLowerCase();

                const category =
                    String(
                        task.category || ""
                    ).toLowerCase();

                const description =
                    String(
                        task.description || ""
                    ).toLowerCase();


                const matchesSearch =
                    title.includes(search) ||
                    category.includes(search) ||
                    description.includes(search);


                const matchesCategory =
                    activeCategory === "All" ||
                    category ===
                        activeCategory.toLowerCase();


                return (
                    matchesSearch &&
                    matchesCategory
                );

            }
        );


    const completedTasks =
        filteredTasks
            .filter(
                function (task) {
                    return task.completed;
                }
            )
            .sort(
                function (a, b) {

                    return (
                        getSortTime(b) -
                        getSortTime(a)
                    );

                }
            );


    const overdueTasks =
        filteredTasks
            .filter(
                function (task) {

                    return (
                        !task.completed &&
                        isOverdue(task)
                    );

                }
            )
            .sort(
                function (a, b) {

                    return (
                        getSortTime(a) -
                        getSortTime(b)
                    );

                }
            );


    const activeTasks =
        filteredTasks
            .filter(
                function (task) {

                    return (
                        !task.completed &&
                        !isOverdue(task)
                    );

                }
            )
            .sort(
                function (a, b) {

                    return (
                        getSortTime(a) -
                        getSortTime(b)
                    );

                }
            );


    // ========================================
    // ACTIVE / IN PROGRESS
    // ========================================

    activeTasks.forEach(
        function (task) {

            myTasksGrid.appendChild(
                createTaskCard(
                    task
                )
            );

        }
    );


    // ========================================
    // OVERDUE
    // ========================================

    overdueTasks.forEach(
        function (task) {

            overdueTasksGrid.appendChild(
                createTaskCard(
                    task
                )
            );

        }
    );


    // ========================================
    // COMPLETED
    // ========================================

    completedTasks.forEach(
        function (task) {

            completedTasksGrid.appendChild(
                createTaskCard(
                    task
                )
            );

        }
    );


    // ========================================
    // EMPTY ACTIVE
    // ========================================

    if (
        activeTasks.length === 0
    ) {

        showEmptyMessage(
            myTasksGrid,
            "No active tasks yet."
        );

    }


    // ========================================
    // EMPTY OVERDUE
    // ========================================

    if (
        overdueTasks.length === 0
    ) {

        showEmptyMessage(
            overdueTasksGrid,
            "No overdue tasks."
        );

    }


    // ========================================
    // EMPTY COMPLETED
    // ========================================

    if (
        completedTasks.length === 0
    ) {

        showEmptyMessage(
            completedTasksGrid,
            "No completed tasks yet."
        );

    }

}


// ============================================
// CATEGORY FILTERS
// ============================================

taskFilters.forEach(
    function (filter) {

        filter.addEventListener(
            "click",
            function () {

                taskFilters.forEach(
                    function (button) {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                filter.classList.add(
                    "active"
                );


                activeCategory =
                    filter.dataset.category;


                renderTasks(
                    taskSearch.value
                );

            }
        );

    }
);


// ============================================
// EMPTY MESSAGE
// ============================================

function showEmptyMessage(
    container,
    message
) {

    const empty =
        document.createElement("div");


    empty.className =
        "no-tasks-message";


    empty.textContent =
        message;


    container.appendChild(
        empty
    );

}


// ============================================
// UPDATE TASK
// ============================================

async function updateTask(
    taskId,
    updates
) {

    if (!currentUser) {

        return;

    }


    try {

        const taskReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "tasks",
                taskId
            );


        await updateDoc(
            taskReference,
            updates
        );

    }
    catch (error) {

        console.error(
            "Error updating task:",
            error
        );

        alert(
            "Unable to update the task."
        );

    }

}


// ============================================
// COMPLETE TASK
// ============================================

async function completeTask(taskId) {
    if (!currentUser) {
        return;
    }

    const taskReference = doc(
        db,
        "users",
        currentUser.uid,
        "tasks",
        taskId
    );

    const progressionReference = doc(
        db,
        "users",
        currentUser.uid,
        "achievements",
        "progression"
    );

    try {
        await runTransaction(db, async transaction => {
            const taskSnapshot =
                await transaction.get(taskReference);

            if (!taskSnapshot.exists()) {
                throw new Error("Task not found.");
            }

            const taskData = taskSnapshot.data();

            if (taskData.completed || taskData.deleted === true) {
                return;
            }

            let progressionSnapshot = null;
            let progressionData = {};

            if (taskData.xpAwarded !== true) {
                progressionSnapshot =
                    await transaction.get(progressionReference);

                progressionData = progressionSnapshot.exists()
                    ? progressionSnapshot.data()
                    : {};
            }

            transaction.update(taskReference, {
                completed: true,
                completedAt: serverTimestamp(),
                reminder: "",
                xpAwarded: true,
                updatedAt: serverTimestamp()
            });

            if (taskData.xpAwarded !== true) {
                const currentTotalXP =
                    Math.max(0, Number(progressionData.totalXP) || 0);

                const newTotalXP = currentTotalXP + 50;

                transaction.set(
                    progressionReference,
                    {
                        totalXP: newTotalXP,
                        level: Math.min(
                            100,
                            Math.floor(newTotalXP / 100)
                        ),
                        createdAt:
                            progressionData.createdAt || serverTimestamp(),
                        updatedAt: serverTimestamp()
                    },
                    { merge: true }
                );
            }
        });
    } catch (error) {
        console.error("Unable to complete task or award XP:", error);

        alert("Unable to complete this task. Please try again.");
    }
}


// ============================================
// TOGGLE REMINDER
// ============================================

async function toggleReminder(
    taskId
) {

    const task =
        tasks.find(
            function (item) {

                return (
                    item.id ===
                    taskId
                );

            }
        );


    if (
        !task ||
        task.completed
    ) {

        return;

    }

    if (!task.reminder && !areTaskRemindersEnabled()) {

        alert(
            "Task reminders are turned off in Notification Settings."
        );

        return;

    }


    const newReminder =
        task.reminder
            ? ""
            : defaultReminderLeadTime;


    if (newReminder) {

        const permissionGranted =
            await requestReminderPermission();

        if (!permissionGranted) {
            alert(
                "Please allow notifications in your browser so SNAP can remind you about this task."
            );
            return;
        }

    }


    await updateTask(
        taskId,
        {
            reminder:
                newReminder,

            reminderSentAt:
                null,

            updatedAt:
                serverTimestamp()
        }
    );

    remindedTasksThisSession.delete(taskId);

}


// ============================================
// DELETE TASK
// ============================================

async function deleteTask(
    taskId
) {

    if (!currentUser) {
        return;
    }

    const task =
        tasks.find(
            function (item) {

                return (
                    item.id ===
                    taskId
                );

            }
        );

    if (!task) {
        return;
    }

    openDeleteTaskModal(taskId);

}


// ============================================
// DELETE TASK MODAL
// ============================================

let deleteTaskModal =
    document.querySelector(
        "#delete-task-modal"
    );

// Create modal if it does not exist
if (!deleteTaskModal) {

    deleteTaskModal =
        document.createElement(
            "div"
        );

    deleteTaskModal.id =
        "delete-task-modal";

    deleteTaskModal.className =
        "delete-task-modal";

    deleteTaskModal.setAttribute(
        "aria-hidden",
        "true"
    );

    deleteTaskModal.innerHTML = `
        <div class="delete-task-modal-backdrop"></div>

        <div
            class="delete-task-modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-task-modal-title"
        >

            <div class="delete-task-modal-icon">
                🗑
            </div>

            <h2 id="delete-task-modal-title">
                Are you sure you want to delete this task?
            </h2>

            <p>
                This task will be moved to Recently Deleted.
            </p>

            <div class="delete-task-modal-actions">

                <button
                    type="button"
                    class="delete-task-cancel"
                >
                    Cancel
                </button>

                <button
                    type="button"
                    class="delete-task-confirm"
                >
                    Delete task
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(
        deleteTaskModal
    );

}

// Currently selected task
let taskToDeleteId =
    null;

// ============================================
// OPEN DELETE MODAL
// ============================================

function openDeleteTaskModal(
    taskId
) {

    taskToDeleteId =
        taskId;

    deleteTaskModal.classList.add(
        "show"
    );

    deleteTaskModal.setAttribute(
        "aria-hidden",
        "false"
    );

}

// ============================================
// CLOSE DELETE MODAL
// ============================================

function closeDeleteTaskModal() {

    deleteTaskModal.classList.remove(
        "show"
    );

    deleteTaskModal.setAttribute(
        "aria-hidden",
        "true"
    );

    taskToDeleteId =
        null;

}

// ============================================
// CANCEL
// ============================================

const deleteTaskCancel =
    deleteTaskModal.querySelector(
        ".delete-task-cancel"
    );

deleteTaskCancel.addEventListener(
    "click",
    function () {

        closeDeleteTaskModal();

    }
);

// ============================================
// BACKDROP CLICK
// ============================================

const deleteTaskBackdrop =
    deleteTaskModal.querySelector(
        ".delete-task-modal-backdrop"
    );

deleteTaskBackdrop.addEventListener(
    "click",
    function () {

        closeDeleteTaskModal();

    }
);

// ============================================
// CONFIRM DELETE
// ============================================

const deleteTaskConfirm =
    deleteTaskModal.querySelector(
        ".delete-task-confirm"
    );

deleteTaskConfirm.addEventListener(
    "click",
    async function () {

        if (!taskToDeleteId) {
            return;
        }

        const taskId =
            taskToDeleteId;

        closeDeleteTaskModal();

        await moveTaskToRecentlyDeleted(
            taskId
        );

    }
);

// ============================================
// MOVE TASK TO RECENTLY DELETED
// ============================================

async function moveTaskToRecentlyDeleted(
    taskId
) {

    if (!currentUser) {
        return;
    }

    try {

        const taskReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "tasks",
                taskId
            );

        await updateDoc(
            taskReference,
            {
                deleted: true,

                deletedAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );

    }
    catch (error) {

        console.error(
            "Error moving task to Recently Deleted:",
            error
        );

        alert(
            "Unable to delete the task."
        );

    }

}

// ============================================
// DELETE MODAL STYLES
// ============================================

if (
    !document.querySelector(
        "#delete-task-modal-styles"
    )
) {

    const style =
        document.createElement(
            "style"
        );

    style.id =
        "delete-task-modal-styles";

    style.textContent = `

        .delete-task-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            visibility: hidden;
            opacity: 0;

            transition:
                opacity 0.2s ease,
                visibility 0.2s ease;
        }

        .delete-task-modal.show {
            visibility: visible;
            opacity: 1;
        }

        .delete-task-modal-backdrop {
            position: absolute;
            inset: 0;

            background:
                rgba(20, 30, 45, 0.38);

            backdrop-filter:
                blur(4px);
        }

        .delete-task-modal-dialog {
            position: relative;
            z-index: 1;

            width: min(
                calc(100% - 40px),
                430px
            );

            padding: 30px;

            border:
                1px solid
                rgba(136, 183, 219, 0.3);

            border-radius: 22px;

            background: #ffffff;

            box-shadow:
                0 24px 70px
                rgba(30, 45, 64, 0.22);

            text-align: center;

            transform:
                translateY(10px)
                scale(0.98);

            transition:
                transform 0.2s ease;
        }

        .delete-task-modal.show
        .delete-task-modal-dialog {

            transform:
                translateY(0)
                scale(1);

        }

        .delete-task-modal-icon {
            width: 58px;
            height: 58px;

            margin:
                0 auto 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 18px;

            background:
                #fff1f1;

            font-size: 25px;
        }

        .delete-task-modal-dialog h2 {
            margin:
                0 0 10px;

            color: #1e2d40;

            font-size: 20px;
            line-height: 1.35;
        }

        .delete-task-modal-dialog p {
            margin:
                0 auto 25px;

            max-width: 330px;

            color: #6d7d93;

            font-size: 14px;
            line-height: 1.6;
        }

        .delete-task-modal-actions {
            display: flex;
            gap: 10px;
        }

        .delete-task-modal-actions button {
            flex: 1;

            min-height: 44px;

            border: 0;
            border-radius: 12px;

            font-size: 14px;
            font-weight: 700;

            cursor: pointer;

            transition:
                transform 0.15s ease,
                opacity 0.15s ease;
        }

        .delete-task-modal-actions button:hover {
            transform:
                translateY(-1px);
        }

        .delete-task-cancel {
            background:
                #eef3f8;

            color:
                #40546a;
        }

        .delete-task-confirm {
            background:
                #d95353;

            color:
                #ffffff;
        }

        .delete-task-confirm:hover {
            opacity: 0.9;
        }

        @media (max-width: 520px) {

            .delete-task-modal-dialog {
                padding: 24px;
            }

            .delete-task-modal-actions {
                flex-direction: column;
            }

        }

    `;

    document.head.appendChild(
        style
    );

}


// ============================================
// OPEN EDIT TASK
// ============================================

function openEditTask(
    taskId
) {

    const task =
        tasks.find(
            function (item) {

                return (
                    item.id ===
                    taskId
                );

            }
        );


    if (!task) {

        return;

    }


    editingTaskId =
        taskId;


    editTaskTitle.value =
        task.title || "";


    // ========================================
    // CATEGORY
    // ========================================

    if (
        task.category === "Study" ||
        task.category === "Assignment" ||
        task.category === "Quiz"
    ) {

        editTaskCategory.value =
            task.category;


        editCustomCategory.style.display =
            "none";

        editCustomCategory.required =
            false;

        editCustomCategory.value =
            "";

    }
    else {

        editTaskCategory.value =
            "Customize";


        editCustomCategory.style.display =
            "block";

        editCustomCategory.required =
            true;

        editCustomCategory.value =
            task.category || "";

    }


    editTaskDueDate.value =
        task.dueDate || "";


    editTaskDueTime.value =
        task.dueTime || "";


    editTaskReminder.value =
        task.reminder || "";


    editTaskDescription.value =
        task.description || "";


    editTaskModal.classList.add(
        "show"
    );


    editTaskModal.setAttribute(
        "aria-hidden",
        "false"
    );


    editTaskTitle.focus();

}


// ============================================
// CLOSE EDIT MODAL
// ============================================

function closeEditModal() {

    editTaskModal.classList.remove(
        "show"
    );


    editTaskModal.setAttribute(
        "aria-hidden",
        "true"
    );


    editCustomCategory.style.display =
        "none";


    editCustomCategory.required =
        false;


    editCustomCategory.value =
        "";


    editingTaskId =
        null;

}


closeEditTaskModal.addEventListener(
    "click",
    closeEditModal
);


// ============================================
// SAVE EDITED TASK
// ============================================

editTaskForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (
            editingTaskId ===
            null
        ) {

            return;

        }


        const categoryValue =
            editTaskCategory.value ===
            "Customize"

                ? editCustomCategory.value.trim()

                : editTaskCategory.value.trim();


        if (!categoryValue) {

            alert(
                "Please enter a category."
            );

            return;

        }


        await updateTask(
            editingTaskId,
            {
                title:
                    editTaskTitle.value.trim(),

                category:
                    categoryValue,

                dueDate:
                    editTaskDueDate.value,

                dueTime:
                    editTaskDueTime.value,

                reminder:
                    editTaskReminder.value,

                reminderSentAt:
                    null,

                description:
                    editTaskDescription.value.trim(),

                updatedAt:
                    serverTimestamp()
            }
        );

        remindedTasksThisSession.delete(
            editingTaskId
        );


        closeEditModal();

    }
);


// ============================================
// SEARCH
// ============================================

taskSearch.addEventListener(
    "input",
    function () {

        renderTasks(
            taskSearch.value
        );

    }
);


// ============================================
// CLOSE MENUS
// ============================================

document.addEventListener(
    "click",
    function () {

        document
            .querySelectorAll(
                ".task-menu.show"
            )
            .forEach(
                function (menu) {

                    menu.classList.remove(
                        "show"
                    );

                }
            );

    }
);


// ============================================
// ESCAPE KEY
// ============================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            taskModal.classList.contains(
                "show"
            )
        ) {

            closeModal();

        }


        if (
            editTaskModal.classList.contains(
                "show"
            )
        ) {

            closeEditModal();

        }

    }
);


/* ==========================================
   SNAP TASKS UI REDESIGN
   ADD BELOW THE EXISTING tasks.js CODE
========================================== */

const snapBottomAddButton = document.getElementById(
    "bottomNewTaskButton"
);

/* BOTTOM ADD NEW TASK BUTTON */

snapBottomAddButton?.addEventListener("click", () => {
    newTaskButton.click();
});

/* REMOVE THE OLD DUPLICATE IN PROGRESS HEADING */

const snapOldHeading = document.querySelector(
    ".in-progress-section-title"
);

if (snapOldHeading) {
    snapOldHeading.hidden = true;
}

/* DYNAMIC TASK COUNTS */

function snapUpdateTaskCounts() {
    const sections = [
        ["myTasksGrid", "inProgressCount"],
        ["overdueTasksGrid", "overdueCount"],
        ["completedTasksGrid", "completedCount"]
    ];

    for (const [gridId, countId] of sections) {
        const grid = document.getElementById(gridId);
        const count = document.getElementById(countId);

        if (grid && count) {
            const taskCards = grid.querySelectorAll(
                ".task-card:not(.empty-card)"
            );

            count.textContent = String(
                taskCards.length
            );
        }
    }
}

/* AUTOMATIC UPDATES WHEN FIREBASE TASKS CHANGE */

const snapTaskGrids = [
    "myTasksGrid",
    "overdueTasksGrid",
    "completedTasksGrid"
];

snapTaskGrids.forEach(gridId => {
    const grid = document.getElementById(gridId);

    if (!grid) return;

    const observer = new MutationObserver(() => {
        snapUpdateTaskCounts();
    });

    observer.observe(grid, {
        childList: true
    });
});

/* INITIAL COUNTS */

snapUpdateTaskCounts();


// ============================================
// INITIALIZE SNAP TASK DETAILS
// ============================================

taskDetailsUI = setupTaskDetails({
    db,

    getCurrentUser: () => currentUser,

    getTask: id => tasks.find(
        task =>
            task.id === id &&
            task.deleted !== true
    ),

    completeTask,

    editTask: openEditTask,

    deleteTask,

    markActive: id => updateTask(
        id,
        {
            completed: false,
            completedAt: null,
            updatedAt: serverTimestamp()
        }
    )
});
