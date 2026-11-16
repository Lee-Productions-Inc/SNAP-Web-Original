<?php
require_once __DIR__ . '/../../includes/deployment_config.php';
$snapAiApiUrl = snap_resolve_api_url(
    'SNAP_AI_API_URL',
    'http://localhost:3000/api/chat'
);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Notes | SNAP</title>

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossorigin
    >

    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
    >

    <link
        rel="stylesheet"
        href="../../../designs/notes.css"
    >

    <link
        rel="stylesheet"
        href="../../../designs/dashboard.css"
    >
    <link rel="stylesheet"         href="../../../designs/settings/theme.css?v=20261111d">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
    <script>window.SNAP_AI_API_URL=<?= json_encode($snapAiApiUrl, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>
</head>

<body>

<div class="dashboard-shell">

    <!-- ==========================================
         SIDEBAR
    =========================================== -->

    <aside
        class="sidebar"
        aria-label="Main navigation"
    >

        <a
            class="brand"
            href="../dashboard.php"
            aria-label="SNAP home"
        >
            <span class="brand-mark">S</span>

            <span class="brand-copy">
                <strong>SNAP</strong>
                <small>Workspace</small>
            </span>
        </a>


        <nav
            class="primary-nav"
            aria-label="Sidebar navigation"
        >

            <a
                class="nav-item active"
                href="../dashboard.php"
            >
                <img
                    class="nav-icon"
                    src="../../../assets/main icons/Vector.svg"
                    alt=""
                >
                <span>Home</span>
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
                <span>Tasks</span>
            </a>


            <a
                class="nav-item"
                href="../ai%20and%20chat/ai_and_chat.php"
            >
                <img
                    class="nav-icon"
                    src="../../../assets/main icons/message-circle.svg"
                    alt=""
                >
                <span>AI & Chat</span>
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
                <span>Badge</span>
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
                <span>Profile</span>
            </a>

        </nav>


        <section
            class="recent-notes"
            aria-labelledby="recent-notes-title"
        >

            <h2 id="recent-notes-title">
                Recent Notes
            </h2>

            <ul
                id="recent-notes-list"
                class="recent-list"
            >
                <li class="recent-empty">
                    No notes yet.
                </li>
            </ul>

        </section>

    </aside>



    <!-- ==========================================
         MAIN
    =========================================== -->

    <main class="dashboard-main notes-main">

        <!-- HEADER -->

        <header class="editor-header">

            <a
                class="icon-button back-button"
                href="../dashboard.php"
                aria-label="Go back"
            >
                ‹
            </a>


            <div class="title-block">

                <input
                    id="note-title"
                    class="note-title"
                    type="text"
                    value="Untitled Note"
                    placeholder="Untitled Note"
                    maxlength="150"
                    aria-label="Note title"
                >

                <div
                    class="meta-row"
                    aria-label="Note metadata"
                >

                    <span
                        id="note-date"
                        class="meta-item"
                    >
                        New note
                    </span>

                    <span class="meta-separator">
                        •
                    </span>

                    <span
                        id="note-time"
                        class="meta-item"
                    >
                        --
                    </span>

                    <span class="meta-separator">
                        •
                    </span>

                    <span
                        id="note-word-meta"
                        class="meta-item"
                    >
                        0 words
                    </span>

                </div>

            </div>



            <!-- HEADER ACTIONS -->

            <div class="header-actions">

                <button
                    id="save-note"
                    class="action-button save-button"
                    type="button"
                >
                    Save
                </button>


                <button
                    id="new-note"
                    class="action-button new-note-button"
                    type="button"
                >
                    New note
                </button>


                <a
                    class="action-button text-action"
                    href="../dashboard.php"
                >
                    All notes
                </a>


                <button
                    id="notes-ai-toggle"
                    class="action-button ai-toggle-button"
                    type="button"
                    aria-expanded="false"
                    aria-controls="notes-ai-panel"
                >
                    Ask SNAP AI
                </button>


                <a
                    class="avatar-button"
                    href="../profile/profile.php"
                    aria-label="User profile"
                ></a>

            </div>

        </header>



        <!-- ==========================================
             WORKSPACE
        =========================================== -->

        <div
            id="notes-workspace"
            class="notes-workspace"
        >


            <!-- ======================================
                 EDITOR
            ======================================= -->

            <section
                class="editor-surface"
                aria-label="Note editor"
            >


                <!-- TOOLBAR -->

                <div
                    class="toolbar"
                    id="editor-toolbar"
                    aria-label="Formatting toolbar"
                >

                    <!-- BASIC FORMAT -->

                    <div class="toolbar-group">

                        <button
                            class="tool-button bold"
                            type="button"
                            data-command="bold"
                            title="Bold"
                            aria-label="Bold"
                        >
                            B
                        </button>


                        <button
                            class="tool-button italic"
                            type="button"
                            data-command="italic"
                            title="Italic"
                            aria-label="Italic"
                        >
                            I
                        </button>


                        <button
                            class="tool-button underline"
                            type="button"
                            data-command="underline"
                            title="Underline"
                            aria-label="Underline"
                        >
                            U
                        </button>


                        <button
                            class="tool-button strike"
                            type="button"
                            data-command="strikeThrough"
                            title="Strikethrough"
                            aria-label="Strikethrough"
                        >
                            S
                        </button>


                        <div class="toolbar-group list-tools">
                            <button
                                id="checklist-button"
                                class="tool-button"
                                type="button"
                                title="Checklist"
                                aria-label="Checklist"
                            >
                                <img
                                    src="../../../assets/notes icons/boxicons_checklist.svg"
                                    alt=""
                                >
                            </button>

                            <div class="toolbar-dropdown">
                                <button
                                    id="list-dropdown-button"
                                    class="tool-button list-dropdown-button"
                                    type="button"
                                    aria-label="List options"
                                    aria-expanded="false"
                                    aria-controls="list-dropdown-menu"
                                    title="List options"
                                >
                                    <span class="list-button-icon" aria-hidden="true">•</span>
                                    <span class="list-button-caret" aria-hidden="true">▾</span>
                                </button>

                                <div
                                    id="list-dropdown-menu"
                                    class="toolbar-popup"
                                    hidden
                                >
                                    <button type="button" data-list-command="insertUnorderedList">
                                        <span class="list-menu-icon" aria-hidden="true">•</span>
                                        Bulleted list
                                    </button>
                                    <button type="button" data-list-command="insertOrderedList">
                                        <span class="list-menu-icon" aria-hidden="true">1.</span>
                                        Numbered list
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>



                    <!-- FONT -->

                    <div class="toolbar-group compact-group">

                        <select
                            id="font-family"
                            class="tool-select"
                            title="Font"
                            aria-label="Font"
                        >
                            <option value="Inter">
                                Inter
                            </option>

                            <option value="Arial">
                                Arial
                            </option>

                            <option value="Georgia">
                                Georgia
                            </option>

                            <option value="Verdana">
                                Verdana
                            </option>

                            <option value="Courier New">
                                Courier New
                            </option>
                        </select>



                        <!-- FONT SIZE -->

                        <select
                            id="font-size"
                            class="tool-select"
                            title="Font size"
                            aria-label="Font size"
                        >
                            <option value="12">12</option>
                            <option value="14" selected>14</option>
                            <option value="16">16</option>
                            <option value="18">18</option>
                            <option value="20">20</option>
                            <option value="24">24</option>
                            <option value="28">28</option>
                            <option value="32">32</option>
                            <option value="40">40</option>
                        </select>



                        <!-- LINE SPACING -->

                        <select
                            id="line-spacing"
                            class="tool-select"
                            title="Line spacing"
                            aria-label="Line spacing"
                        >
                            <option value="1">
                                1
                            </option>

                            <option
                                value="1.15"
                            >
                                1.15
                            </option>

                            <option
                                value="1.5"
                                selected
                            >
                                1.5
                            </option>

                            <option
                                value="2"
                            >
                                2
                            </option>

                            <option
                                value="2.5"
                            >
                                2.5
                            </option>

                        </select>



                        <!-- ALIGNMENT -->

                        <div class="toolbar-dropdown">
                            <button
                                id="alignment-dropdown-button"
                                class="tool-button small"
                                type="button"
                                aria-label="Alignment and indentation"
                                aria-expanded="false"
                                aria-controls="alignment-dropdown-menu"
                                title="Alignment and indentation"
                            >
                                ☰ ▾
                            </button>

                            <div
                                id="alignment-dropdown-menu"
                                class="toolbar-popup"
                                hidden
                            >
                                <button type="button" data-align-command="justifyLeft">
                                    Align left
                                </button>
                                <button type="button" data-align-command="justifyCenter">
                                    Align center
                                </button>
                                <button type="button" data-align-command="justifyRight">
                                    Align right
                                </button>
                                <button type="button" data-align-command="justifyFull">
                                    Justify
                                </button>
                                <hr>
                                <button type="button" data-align-command="outdent">
                                    Decrease indent
                                </button>
                                <button type="button" data-align-command="indent">
                                    Increase indent
                                </button>
                                <hr>
                                <button type="button" data-align-command="insertHorizontalRule">
                                    Insert horizontal line
                                </button>
                            </div>
                        </div>


                        <div class="toolbar-dropdown highlight-dropdown">
                            <button
                                id="highlight-button"
                                class="tool-button small"
                                type="button"
                                aria-label="Highlight color"
                                aria-expanded="false"
                                aria-controls="highlight-menu"
                                title="Highlight selected text"
                            >
                                <span class="highlight-icon">A</span>
                                ▾
                            </button>

                            <div id="highlight-menu" class="toolbar-popup highlight-menu" hidden>
                                <button type="button" data-highlight-color="#fff176">
                                    <span class="color-swatch" style="background:#fff176"></span>
                                    Yellow
                                </button>
                                <button type="button" data-highlight-color="#a5d6a7">
                                    <span class="color-swatch" style="background:#a5d6a7"></span>
                                    Green
                                </button>
                                <button type="button" data-highlight-color="#90caf9">
                                    <span class="color-swatch" style="background:#90caf9"></span>
                                    Blue
                                </button>
                                <button type="button" data-highlight-color="#f48fb1">
                                    <span class="color-swatch" style="background:#f48fb1"></span>
                                    Pink
                                </button>
                                <button type="button" data-highlight-color="#ffcc80">
                                    <span class="color-swatch" style="background:#ffcc80"></span>
                                    Orange
                                </button>
                                <button type="button" data-highlight-color="transparent">
                                    Remove highlight
                                </button>
                            </div>
                        </div>


                        <!-- ZOOM -->

                        <button
                            id="zoom-out"
                            class="tool-button small"
                            type="button"
                            title="Zoom out"
                            aria-label="Zoom out"
                        >
                            −
                        </button>


                        <button
                            id="zoom-level"
                            class="tool-button small zoom-level"
                            type="button"
                            title="Reset zoom"
                            aria-label="Reset zoom"
                        >
                            100%
                        </button>


                        <button
                            id="zoom-in"
                            class="tool-button small"
                            type="button"
                            title="Zoom in"
                            aria-label="Zoom in"
                        >
                            +
                        </button>



                        <!-- MICROPHONE -->

                        <button
                            id="microphone-button"
                            class="tool-button small"
                            type="button"
                            title="Voice typing"
                            aria-label="Voice typing"
                        >
                            <img
                                src="../../../assets/notes icons/mic.svg"
                                alt=""
                            >
                        </button>



                        <!-- IMAGE -->

                        <button
                            id="image-button"
                            class="tool-button small"
                            type="button"
                            title="Insert image"
                            aria-label="Insert image"
                        >
                            <img
                                src="../../../assets/notes icons/image.svg"
                                alt=""
                            >
                        </button>


                        <input
                            id="image-input"
                            type="file"
                            accept="image/*"
                            hidden
                        >



                        <!-- MORE -->

                        <button
                            id="more-button"
                            class="tool-button small"
                            type="button"
                            aria-expanded="false"
                            aria-controls="more-menu"
                            title="More"
                            aria-label="More"
                        >
                            ⋯
                        </button>

                    </div>



                    <!-- MORE MENU -->

                    <div
                        id="more-menu"
                        class="more-menu"
                        hidden
                    >

                        <button
                            type="button"
                            data-more-command="undo"
                        >
                            ↶ Undo
                        </button>

                        <button
                            type="button"
                            data-more-command="redo"
                        >
                            ↷ Redo
                        </button>

                        <button
                            type="button"
                            data-more-command="removeFormat"
                        >
                            Clear formatting
                        </button>

                        <button
                            type="button"
                            data-more-command="selectAll"
                        >
                            Select all
                        </button>

                        <button
                            type="button"
                            data-more-command="paragraph"
                        >
                            Normal paragraph
                        </button>

                    </div>

                </div>



                <!-- EDITOR BODY -->

                <div class="editor-body">

                    <div class="draft-status">

                        <span
                            id="save-badge"
                            class="status-badge"
                        >
                            Draft
                        </span>

                        <span
                            id="save-status"
                            class="status-text"
                        >
                            • Ready
                        </span>

                        <span
                            id="word-total"
                            class="word-total"
                        >
                            0 words
                        </span>

                    </div>



                    <!-- ACTUAL EDITOR -->

                    <div
                        id="note-editor"
                        class="editor-placeholder"
                        contenteditable="true"
                        role="textbox"
                        aria-multiline="true"
                        aria-label="Write your note"
                        spellcheck="true"
                    ></div>

                </div>

            </section>



            <!-- ======================================
                 AI PANEL
            ======================================= -->

            <aside
                class="notes-ai-panel"
                id="notes-ai-panel"
                aria-label="SNAP AI assistant panel"
                aria-hidden="true"
            >

                <div class="notes-ai-header">

                    <div class="notes-ai-heading-row">
                        <div class="notes-ai-title-wrap">
                            <h2>SNAP AI</h2>
                            <p>Helpful suggestions for your notes</p>
                        </div>
                        <button
                            class="notes-ai-close"
                            id="notes-ai-close"
                            type="button"
                            aria-label="Close AI panel"
                        >
                            ×
                        </button>
                    </div>

                    <div class="notes-ai-header-actions">
                        <label for="notes-ai-history">Conversation history</label>
                        <button class="notes-ai-new-chat" id="notes-ai-new-chat" type="button">
                            + New Chat
                        </button>
                        <select id="notes-ai-history" aria-label="Conversation history"></select>
                    </div>

                </div>



                <div
                    class="notes-ai-chat-window"
                    id="notes-ai-chat-window"
                    aria-live="polite"
                >

                    <div class="ai-message ai-bot">
                        Ask SNAP AI to help with this note. Your draft stays untouched until you choose to insert a response.
                    </div>

                </div>



                <div
                    class="notes-ai-tools"
                    aria-label="AI tools"
                >

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Generate notes"
                    >
                        Generate
                    </button>

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Explain this topic"
                    >
                        Explain
                    </button>

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Summarize my current note"
                    >
                        Summarize
                    </button>

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Rewrite and improve my current note"
                    >
                        Rewrite
                    </button>

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Correct grammar and spelling in my current note"
                    >
                        Fix grammar
                    </button>

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Expand my current note into an organized explanation"
                    >
                        Expand
                    </button>

                    <button
                        class="ai-tool-button"
                        type="button"
                        data-ai-action="Organize this material with clear headings, bullet points, and key takeaways"
                    >
                        Structure
                    </button>

                </div>

                <a class="notes-ai-continue" id="notes-ai-open-chat" href="../ai%20and%20chat/ai_and_chat.php">
                    Continue in AI &amp; Chat
                </a>

                <form
                    class="notes-ai-composer"
                    id="notes-ai-form"
                >

                    <textarea
                        id="notes-ai-input"
                        rows="2"
                        maxlength="12000"
                        placeholder="Ask SNAP AI..."
                        aria-label="Ask SNAP AI"
                    ></textarea>

                    <button
                        class="notes-ai-send"
                        id="notes-ai-send"
                        type="submit"
                    >
                        Send
                    </button>

                </form>
                <p class="notes-ai-status" id="notes-ai-status" role="status"></p>

            </aside>

        </div>

    </main>

</div>



<!-- ==========================================
     NOTES JAVASCRIPT
=========================================== -->

<script src="../../../functions/settings/global_preferences.js"></script>
<script type="module" src="../../../functions/settings/profile_avatar.js?v=20261115-chat-profile-2"></script>
<script
    type="module"
    src="../../../functions/notes/notes.js?v=20261111d"
></script>


<!-- Recent Notes Sidebar -->

<script
    type="module"
    src="../../../functions/notes/notes_sidebar.js"
></script>


<!-- Existing AI panel -->

<script
    type="module"
    src="../../../functions/notes/notes_ai.js?v=20261115-api-config-1"
></script>

</body>
</html>