
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Dashboard | SNAP</title>
<link rel="stylesheet" href="../../designs/dashboard.css">
<link rel="stylesheet" href="../../designs/settings/theme.css?v=20261111d">
<script>
try {
  document.documentElement.dataset.theme =
    localStorage.getItem("snap-theme") ||
    (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
} catch (error) {
  console.error("Unable to restore SNAP theme:", error);
}
</script>
</head>
<body>
<div class="dashboard-shell">
<div class="dashboard-content">
<aside class="sidebar" aria-label="Main navigation">
<a class="brand" href="dashboard.php" aria-label="SNAP home">
<span class="brand-mark">S</span>
<span><strong>SNAP</strong><small>Workspace</small></span>
</a>
<nav class="primary-nav">
<a class="nav-item active" href="dashboard.php">
<img class="nav-icon-active" src="../../assets/main icons/Vector.svg" alt="">Home
</a>
<a class="nav-item" href="tasks.php">
<img class="nav-icon" src="../../assets/main icons/check-square.svg" alt="">Tasks
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

<main class="dashboard-main snap-home">
<header class="dashboard-header">
<label class="search-box">
<span aria-hidden="true">⌕</span>
<input id="homeSearch" type="search" placeholder="Search notes, tasks..." aria-label="Search notes and tasks">
</label>
<div class="header-actions">
<a class="text-action new-note" href="notes/notes.php">
<span aria-hidden="true"><img class="text-action-icon" src="../../assets/file-text.svg" alt=""></span>New note
</a>
<a class="text-action selected-action">All notes</a>
<a class="text-action folder-action" href="folders/all_folders.php">
<span aria-hidden="true"><img class="text-action-icon" src="../../assets/folder.svg" alt=""></span>Folders
</a>
<a class="profile-placeholder" href="profile/profile.php" aria-label="Open profile"></a>
</div>
</header>

<section class="status-grid" aria-label="Task status">
<article class="status-card today-card">
<span class="status-info">
<strong class="status-count" aria-label="Tasks due today">0</strong>
<span class="status-label">Task Today</span>
</span>
</article>
<article class="status-card progress-card">
<span class="status-info">
<strong class="status-count" aria-label="In progress tasks">0</strong>
<span class="status-label">In Progress</span>
</span>
</article>
<article class="status-card completed-card">
<span class="status-info">
<strong class="status-count" aria-label="Completed tasks">0</strong>
<span class="status-label">Completed</span>
</span>
</article>
</section>

<nav class="snap-home-tabs" aria-label="Notes view">
<span class="snap-home-tab active" aria-current="page">All</span>
<a class="snap-home-tab" href="folders/all_folders.php">Folder</a>
</nav>

<section class="notes-section snap-home-recent" aria-labelledby="notes-title">
<div class="section-heading">
<h2 id="notes-title">Recent Notes and Tasks</h2>
<div class="snap-home-section-actions">
<a class="edit-button" href="notes/notes.php">Edit</a>
<button class="snap-home-search-action" id="homeSearchShortcut" type="button" aria-label="Search recent notes and tasks">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<circle cx="10.7" cy="10.7" r="7"/><path d="m16 16 5 5"/>
</svg>
</button>
</div>
</div>

<section class="snap-overview snap-overview-tasks" aria-labelledby="snap-task-heading">
<div class="snap-overview-banner">
<span class="snap-overview-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>
</svg>
</span>
<span class="snap-overview-copy">
<strong id="snap-task-heading">Tasks</strong>
<small>Active and Priority tasks</small>
</span>
<strong class="snap-overview-count" id="homeTaskCount" aria-label="Active and priority task count">0</strong>
</div>
<div class="snap-overview-body" id="homeTaskList" aria-live="polite">
<p class="snap-overview-empty">Loading tasks...</p>
</div>
</section>

<section class="snap-overview snap-overview-notes" aria-labelledby="snap-note-heading">
<div class="snap-overview-banner">
<span class="snap-overview-icon">
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
<path d="M5 3h14v13l-5 5H5z"/><path d="M14 21v-5h5M8 8h8M8 12h6"/>
</svg>
</span>
<span class="snap-overview-copy">
<strong id="snap-note-heading">Notes</strong>
<small>Recent Notes</small>
</span>
<strong class="snap-overview-count" id="homeNotesCount" aria-label="Note count">0</strong>
</div>
<div class="notes-grid" aria-live="polite">
<div class="dashboard-notes-loading">Loading notes...</div>
</div>
</section>
</section>

<a class="snap-home-floating-add" href="notes/notes.php" aria-label="Add a new note" title="Add new note">+</a>
</main>
</div>
</div>
<script src="../../functions/settings/global_preferences.js"></script>
<script type="module" src="../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
<script type="module" src="../../functions/dashboard/dashboard.js"></script>
</body>
</html>
