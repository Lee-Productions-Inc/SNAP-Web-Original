
<?php
require_once __DIR__ . '/../includes/deployment_config.php';
$cloudinaryCloudName = getenv('CLOUDINARY_CLOUD_NAME') ?: '';
$cloudinaryUploadPreset = getenv('CLOUDINARY_UPLOAD_PRESET') ?: '';
$taskAttachmentsApiUrl = snap_resolve_api_url(
    'SNAP_TASK_ATTACHMENTS_API_URL',
    'http://localhost:3000/api/tasks'
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>My Tasks | SNAP</title>
<link rel="stylesheet" href="../../designs/dashboard.css">
<link rel="stylesheet" href="../../designs/tasks.css">
<link rel="stylesheet" href="../../designs/settings/theme.css?v=20261115-native-picker-icons">
<link
    rel="stylesheet"
    href="../../designs/task_details.css?v=20261115a"
>
<script>
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("snap-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch (error) {
  console.error("Unable to restore SNAP theme:", error);
}
</script>
<script>
window.SNAP_CLOUDINARY_CONFIG = <?= json_encode(
    ['cloudName' => $cloudinaryCloudName, 'uploadPreset' => $cloudinaryUploadPreset],
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
) ?>;
window.SNAP_TASK_ATTACHMENTS_API_URL = <?= json_encode(
    $taskAttachmentsApiUrl,
    JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
) ?>;
</script>
</head>
<body>
<div class="dashboard-shell">
<aside class="sidebar" aria-label="Main navigation">
<a class="brand" href="dashboard.php" aria-label="SNAP home">
<span class="brand-mark">S</span>
<span><strong>SNAP</strong><small>Workspace</small></span>
</a>
<nav class="primary-nav">
<a class="nav-item" href="dashboard.php">
<img class="nav-icon" src="../../assets/main icons/Vector.svg" alt="">Home
</a>
<a class="nav-item active" href="tasks.php">
<img class="nav-icon-active" src="../../assets/main icons/check-square.svg" alt="">Tasks
</a>
<a class="nav-item" href="ai and chat/ai_and_chat.php">
<img class="nav-icon" src="../../assets/main icons/message-circle.svg" alt="">AI & Chat
</a>
<a class="nav-item" href="badges.php">
<img class="nav-icon" src="../../assets/main icons/badge-check.svg" alt="">Badge
</a>
<a class="nav-item" href="profile/profile.php">
<img class="nav-icon" src="../../assets/main icons/user.svg" alt="">Profile
</a>
</nav>
<div class="recent-notes">
<h2>Recent Notes</h2>
<div class="empty-recent" aria-hidden="true"></div>
</div>
</aside>

<main class="tasks-main snap-tasks">
<div class="task-page-title"><h1>My Tasks</h1></div>

<header class="tasks-header">
<label class="search-box" aria-label="Search tasks">
<span aria-hidden="true">⌕</span>
<input type="search" id="taskSearch" placeholder="Search tasks..." aria-label="Search tasks">
</label>
<button class="new-task-button" id="newTaskButton" type="button">+ Add New Task</button>
</header>

<section class="task-board" aria-label="Task board">
<div class="task-board-header">
<div></div>
<div class="task-filter-list" aria-label="Task categories">
<button type="button" class="task-filter active" data-category="All">All</button>
<button type="button" class="task-filter" data-category="Study">Study</button>
<button type="button" class="task-filter" data-category="Assignment">Assignment</button>
<button type="button" class="task-filter" data-category="Quiz">Quiz</button>
</div>
</div>

<div class="task-group snap-task-group snap-task-group-progress">
<div class="snap-task-group-banner">
<span class="snap-task-group-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
</svg>
</span>
<span class="snap-task-group-copy"><h2>In Progress</h2><small>Active tasks</small></span>
<strong class="snap-task-group-count" id="inProgressCount" aria-label="In progress task count">0</strong>
</div>
<div class="empty-task-grid" id="myTasksGrid" aria-live="polite"></div>
</div>

<div class="task-group snap-task-group snap-task-group-overdue">
<div class="snap-task-group-banner">
<span class="snap-task-group-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M12 3 2 20h20zM12 9v5M12 17h.01"/>
</svg>
</span>
<span class="snap-task-group-copy"><h2>Overdue</h2><small>Needs attention</small></span>
<strong class="snap-task-group-count" id="overdueCount" aria-label="Overdue task count">0</strong>
</div>
<div class="empty-task-grid" id="overdueTasksGrid" aria-live="polite"></div>
</div>

<div class="task-group snap-task-group snap-task-group-completed">
<div class="snap-task-group-banner">
<span class="snap-task-group-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>
</svg>
</span>
<span class="snap-task-group-copy"><h2>Completed</h2><small>Finished tasks</small></span>
<strong class="snap-task-group-count" id="completedCount" aria-label="Completed task count">0</strong>
</div>
<div class="empty-task-grid" id="completedTasksGrid" aria-live="polite"></div>
</div>
<button type="button" class="snap-task-bottom-add" id="bottomNewTaskButton">+ &nbsp; Add New Task</button>
</section>
</main>
</div>

<div class="task-modal-overlay" id="taskModal" aria-hidden="true">
<div class="task-modal" role="dialog" aria-modal="true" aria-labelledby="taskModalTitle">
<div class="task-modal-title">
<h2 id="taskModalTitle">Add new task</h2>
<button type="button" class="close-task-modal" id="closeTaskModal" aria-label="Close">×</button>
</div>
<form id="taskForm">
<div class="task-form-group">
<label for="taskTitle">Add Title</label>
<input type="text" id="taskTitle" name="title" placeholder="e.g Homework for IAS, To do this week" required>
</div>
<div class="task-form-group">
<label for="taskCategory">Category</label>
<select id="taskCategory" name="category" required>
<option value="Study">Study</option>
<option value="Assignment">Assignment</option>
<option value="Quiz">Quiz</option>
<option value="Customize">Customize</option>
</select>
<input type="text" id="customCategory" name="customCategory" placeholder="Type your own category..." style="display:none">
</div>
<div class="task-form-group">
<label for="taskDueDate">Due date</label>
<input type="date" id="taskDueDate" name="dueDate" required>
</div>
<div class="task-form-group">
<label for="taskDueTime">Due time</label>
<input type="time" id="taskDueTime" name="dueTime">
</div>
<div class="task-form-group">
<label for="taskReminder">Reminder</label>
<select id="taskReminder" name="reminder">
<option value="">Set reminder</option>
<option value="5 minutes">5 minutes before</option>
<option value="15 minutes">15 minutes before</option>
<option value="30 minutes">30 minutes before</option>
<option value="1 hour">1 hour before</option>
<option value="1 day">1 day before</option>
</select>
</div>
<div class="task-form-group">
<label for="taskDescription">Description <span>(optional)</span></label>
<textarea id="taskDescription" name="description" placeholder="Input here"></textarea>
</div>
<button type="submit" class="create-task-button">+ Create new task</button>
</form>
</div>
</div>

<div class="task-modal-overlay" id="editTaskModal" aria-hidden="true">
<div class="task-modal edit-task-modal" role="dialog" aria-modal="true" aria-labelledby="editTaskModalTitle">
<div class="task-modal-title">
<h2 id="editTaskModalTitle">Edit Task</h2>
<button type="button" class="close-task-modal" id="closeEditTaskModal" aria-label="Close">×</button>
</div>
<form id="editTaskForm">
<div class="task-form-group">
<label for="editTaskTitle">Task title</label>
<input type="text" id="editTaskTitle" name="title" required>
</div>
<div class="task-form-group">
<label for="editTaskCategory">Category</label>
<select id="editTaskCategory" name="category" required>
<option value="Study">Study</option>
<option value="Assignment">Assignment</option>
<option value="Quiz">Quiz</option>
<option value="Customize">Customize</option>
</select>
<input type="text" id="editCustomCategory" name="editCustomCategory" placeholder="Type your own category..." style="display:none">
</div>
<div class="task-form-group">
<label for="editTaskDueDate">Due date</label>
<input type="date" id="editTaskDueDate" name="dueDate">
</div>
<div class="task-form-group">
<label for="editTaskDueTime">Due time</label>
<input type="time" id="editTaskDueTime" name="dueTime">
</div>
<div class="task-form-group">
<label for="editTaskReminder">Remind me</label>
<select id="editTaskReminder" name="reminder">
<option value="">No reminder</option>
<option value="5 minutes">5 minutes before</option>
<option value="15 minutes">15 minutes before</option>
<option value="30 minutes">30 minutes before</option>
<option value="1 hour">1 hour before</option>
<option value="1 day">1 day before</option>
</select>
</div>
<div class="task-form-group">
<label for="editTaskDescription">Description <span>(optional)</span></label>
<textarea id="editTaskDescription" name="description" placeholder="Add more details about this task..."></textarea>
</div>
<button type="submit" class="create-task-button">Save changes</button>
</form>
</div>
</div>

<script src="../../functions/settings/global_preferences.js"></script>
<script type="module" src="../../functions/tasks/tasks.js?v=20261115-api-config-1"></script>
</body>
</html>
