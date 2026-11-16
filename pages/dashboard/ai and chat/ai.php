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

    <title>SNAP AI</title>

    <link
        rel="stylesheet"
        href="../../../designs/ai/ai.css?v=20261115-task-draft-dark"
    >
    <link rel="stylesheet" href="../../../designs/settings/theme.css?v=20261112a">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
    <script>window.SNAP_AI_API_URL=<?= json_encode($snapAiApiUrl, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;</script>

</head>


<body>

    <main class="ai-page">


        <!-- =========================================
             SNAP AI HEADER
             ========================================= -->

        <header class="ai-header">

            <a
                href="../dashboard.php"
                class="ai-back-button"
                aria-label="Back"
            >
                ←
            </a>


            <div class="ai-brand">

                <div class="ai-brand-icon">
                    ✦
                </div>


                <div class="ai-brand-text">

                    <strong>
                        SNAP AI
                    </strong>

                    <span>
                        Study assistant
                    </span>

                </div>

            </div>


            <button
                type="button"
                class="ai-menu-button"
                id="ai-menu-button"
                aria-label="Start a new chat"
                title="Start a new chat"
            >
                +
            </button>

        </header>



        <!-- =========================================
             CHAT AREA
             ========================================= -->

        <section
            class="ai-chat-area"
            id="ai-chat-area"
            aria-live="polite"
        >

            <!-- Messages are inserted here by JavaScript -->

        </section>



        <!-- =========================================
             TASK MODE PANEL
             ========================================= -->

        <section
            class="task-mode-panel hidden"
            id="task-mode-panel"
        >

            <div class="task-mode-icon">
                ☷
            </div>


            <div class="task-mode-content">

                <strong>
                    Task Mode
                </strong>

                <span>
                    Build a task by chatting with SNAP AI.
                </span>

            </div>


            <button
                type="button"
                id="close-task-mode"
                class="task-mode-close"
                aria-label="Exit Task Mode"
            >
                ×
            </button>

        </section>



        <!-- =========================================
             INPUT AREA
             ========================================= -->

        <footer class="ai-input-area">


            <button
                type="button"
                id="ai-add-button"
                class="input-action-button"
                aria-label="More options"
            >
                +
            </button>


            <div class="ai-input-wrapper">

                <textarea
                    id="ai-message-input"
                    rows="1"
                    aria-label="Message SNAP AI"
                    autocomplete="off"
                    placeholder="Describe the task or ask SNAP AI..."
                ></textarea>

            </div>


            <button
                type="button"
                id="ai-mic-button"
                class="input-action-button microphone-button"
                aria-label="Voice input"
                title="Voice input"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 14.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5a3.5 3.5 0 0 0 3.5 3.5Z"></path>
                    <path d="M5.5 10.5a6.5 6.5 0 0 0 13 0"></path>
                    <path d="M12 17v4"></path>
                    <path d="M8.5 21h7"></path>
                </svg>
            </button>


            <button
                type="button"
                id="task-mode-button"
                class="input-action-button task-button"
                aria-label="Task Mode"
                title="Task Mode"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 7h8"></path>
                    <path d="M8 12h8"></path>
                    <path d="M8 17h5"></path>
                    <path d="M5 7h.01"></path>
                    <path d="M5 12h.01"></path>
                    <path d="M5 17h.01"></path>
                </svg>
            </button>


            <button
                type="button"
                id="ai-clipboard-button"
                class="input-action-button clipboard-button"
                aria-label="Clipboard"
                title="Clipboard"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect x="6" y="5" width="12" height="15" rx="2"></rect>
                    <path d="M9 5.5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5"></path>
                    <path d="M9 10h6"></path>
                    <path d="M9 14h6"></path>
                    <path d="M9 18h4"></path>
                </svg>
            </button>


            <button
                type="button"
                id="ai-tools-button"
                class="input-action-button sparkle-button"
                aria-label="AI tools"
                title="AI tools"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z"></path>
                    <path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14Z"></path>
                </svg>
            </button>


            <button
                type="button"
                id="ai-send-button"
                class="send-button"
                aria-label="Send"
            >
                ↑
            </button>

        </footer>

    </main>



    <!-- =========================================
         QUICK ACTION MENU
         ========================================= -->

    <div
        class="ai-action-menu hidden"
        id="ai-action-menu"
    >

        <button
            type="button"
            data-action="task"
        >
            📝 Create a task
        </button>


        <button
            type="button"
            data-action="notes"
        >
            📚 Work with my notes
        </button>


        <button
            type="button"
            data-action="help"
        >
            💡 Ask SNAP AI
        </button>

    </div>



    <!-- =========================================
         TASK EDIT MODAL
         ========================================= -->

    <div
        class="task-edit-modal hidden"
        id="task-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-edit-title-heading"
    >

        <div class="task-edit-backdrop"></div>


        <div class="task-edit-dialog">

            <h2>

                <span id="task-edit-title-heading">
                    Edit Task
                </span>

            </h2>


            <label>

                Title

                <input
                    type="text"
                    id="edit-task-title"
                >

            </label>


            <label>

                Category

                <input
                    type="text"
                    id="edit-task-category"
                >

            </label>


            <label>

                Due date

                <input
                    type="date"
                    id="edit-task-date"
                >

            </label>


            <label>

                Due time

                <input
                    type="time"
                    id="edit-task-time"
                >

            </label>


            <label>

                Description

                <textarea
                    id="edit-task-description"
                    rows="5"
                ></textarea>

            </label>


            <div class="task-edit-actions">

                <button
                    type="button"
                    id="cancel-task-edit"
                >
                    Cancel
                </button>


                <button
                    type="button"
                    id="save-task-edit"
                >
                    Save changes
                </button>

            </div>

        </div>

    </div>



    <script src="../../../functions/settings/global_preferences.js"></script>
    <script
        type="module"
        src="../../../functions/ai_chat/ai_chat.js?v=20261115-api-config-1"
    ></script>

</body>

</html>