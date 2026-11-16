// ============================================
// SNAP AI CHAT
// ============================================

import {
    auth,
    db
} from "../firebase/firebase.js";


import {
    collection,
    doc,
    addDoc,
    getDoc,
    writeBatch,
    onSnapshot,
    serverTimestamp,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    requestSnapAI,
    setActiveAIConversation
} from "./ai_service.js?v=20261115-api-config-1";
import { renderMarkdown } from "./markdown_renderer.js?v=20261111a";


// ============================================
// DOM
// ============================================

const chatArea =
    document.querySelector(
        "#ai-chat-area"
    );

const messageInput =
    document.querySelector(
        "#ai-message-input"
    );

const sendButton =
    document.querySelector(
        "#ai-send-button"
    );

const taskModeButton =
    document.querySelector(
        "#task-mode-button"
    );

const taskModePanel =
    document.querySelector(
        "#task-mode-panel"
    );

const closeTaskMode =
    document.querySelector(
        "#close-task-mode"
    );

const addButton =
    document.querySelector(
        "#ai-add-button"
    );

const actionMenu =
    document.querySelector(
        "#ai-action-menu"
    );

const aiToolsButton =
    document.querySelector(
        "#ai-tools-button"
    );

const micButton =
    document.querySelector(
        "#ai-mic-button"
    );

const newChatButton =
    document.querySelector(
        "#ai-menu-button"
    );

// ============================================
// STATE
// ============================================

let currentUser = null;

let currentChatId = null;

let currentChatTitle = null;

let unsubscribeMessages = null;

let conversationHistory = [];

let isSending = false;
let pendingRequestError = null;
let pendingRetry = null;

let taskMode = false;

let taskDraft = null;

let editingTaskDraft = false;


// ============================================
// AUTH
// ============================================

onAuthStateChanged(
    auth,
    async function(user) {

        if (!user) {

            currentUser = null;
            currentChatId = null;
            currentChatTitle = null;
            conversationHistory = [];

            if (unsubscribeMessages) {
                unsubscribeMessages();
                unsubscribeMessages = null;
            }

            showSystemMessage(
                "Please sign in to use SNAP AI."
            );

            return;
        }


        currentUser = user;
        currentChatId = null;
        currentChatTitle = null;
        conversationHistory = [];

        if (unsubscribeMessages) {
            unsubscribeMessages();
            unsubscribeMessages = null;
        }

        chatArea.replaceChildren();

        try {
            await initializeChat();
        }
        catch (error) {
            console.error("Could not initialize SNAP AI chat:", error);
            showSystemMessage(
                "I couldn't load your SNAP AI conversations. Please try again."
            );
        }

    }
);


// ============================================
// INITIALIZE CHAT
// ============================================

async function initializeChat() {

    if (!currentUser) {
        return;
    }

    const queryParameters =
        new URLSearchParams(window.location.search);

    if (queryParameters.get("new") === "1") {
        await startNewChat();
        return;
    }

    const requestedChatId =
        queryParameters.get("chatId");

    if (requestedChatId) {
        const requestedChatReference =
            doc(
                db,
                "users",
                currentUser.uid,
                "aiChats",
                requestedChatId
            );

        const requestedChat =
            await getDoc(requestedChatReference);

        if (!requestedChat.exists()) {
            currentChatId = null;
            showSystemMessage(
                "That SNAP AI conversation could not be found in your account."
            );
            return;
        }

        currentChatId = requestedChat.id;
        setActiveAIConversation(currentUser, currentChatId);
        currentChatTitle =
            requestedChat.data().title || "SNAP AI Chat";
        listenToMessages();
        return;
    }

    const chatsReference =
        collection(
            db,
            "users",
            currentUser.uid,
            "aiChats"
        );


    const chatSnapshot =
        await getDocs(
            chatsReference
        );


    if (
        chatSnapshot.empty
    ) {

        const chatReference =
            await addDoc(
                chatsReference,
                {
                    title:
                        "SNAP AI Chat",

                    createdAt:
                        serverTimestamp(),

                    updatedAt:
                        serverTimestamp()
                }
            );


        currentChatId =
            chatReference.id;
        setActiveAIConversation(currentUser, currentChatId);
        currentChatTitle = "SNAP AI Chat";


    }
    else {

        const latestChat =
            chatSnapshot.docs
                .sort(
                    function(a, b) {

                        const aData =
                            a.data();

                        const bData =
                            b.data();

                        const aTime =
                            aData.updatedAt
                                ?.toMillis?.() || 0;

                        const bTime =
                            bData.updatedAt
                                ?.toMillis?.() || 0;

                        return bTime - aTime;

                    }
                )[0];


        currentChatId =
            latestChat.id;
        setActiveAIConversation(currentUser, currentChatId);
        currentChatTitle =
            latestChat.data().title || "SNAP AI Chat";

    }


    listenToMessages();

}

async function startNewChat() {
    if (!currentUser) {
        showSystemMessage(
            "Please sign in to start a new chat."
        );
        return;
    }

    try {
        const chatsReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "aiChats"
            );

        const chatReference =
            await addDoc(
                chatsReference,
                {
                    title: "New chat",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }
            );

        currentChatId = chatReference.id;
        setActiveAIConversation(currentUser, currentChatId);
        currentChatTitle = "New chat";
        conversationHistory = [];
        window.history.replaceState(
            null,
            "",
            window.location.pathname
        );

        disableTaskMode();

        chatArea.innerHTML = "";

        listenToMessages();
    }
    catch (error) {
        console.error("Could not start a new chat:", error);
        showSystemMessage(
            "I couldn't start a new chat. Please try again."
        );
    }
}


// ============================================
// LISTEN TO MESSAGES
// ============================================

function listenToMessages() {

    if (
        unsubscribeMessages
    ) {

        unsubscribeMessages();

    }


    if (
        !currentUser ||
        !currentChatId
    ) {

        return;

    }


    const messagesReference =
        collection(
            db,
            "users",
            currentUser.uid,
            "aiChats",
            currentChatId,
            "messages"
        );


    unsubscribeMessages =
        onSnapshot(
            messagesReference,
            function(snapshot) {

                const messages =
                    snapshot.docs
                        .map(
                            function(document) {

                                return {
                                    id:
                                        document.id,

                                    ...document.data()
                                };

                            }
                        )
                        .sort(
                            function(a, b) {

                                const aTime =
                                    a.createdAt
                                        ?.toMillis?.() || 0;

                                const bTime =
                                    b.createdAt
                                        ?.toMillis?.() || 0;

                                return (
                                    aTime -
                                    bTime
                                );

                            }
                        );


                renderMessages(
                    messages
                );

            }
        );

}


// ============================================
// RENDER MESSAGES
// ============================================

function renderMessages(
    messages
) {

    conversationHistory =
        messages.map(function(message) {
            return {
                role: message.role,
                content: message.content
            };
        });

    chatArea.innerHTML =
        "";


    if (
        messages.length === 0
    ) {

        renderWelcome();

        if (pendingRequestError && pendingRetry) {
            renderRequestError(
                pendingRequestError,
                pendingRetry
            );
        }

        return;

    }


    messages.forEach(
        function(message) {

            renderMessage(
                message.role,
                message.content
            );

        }
    );

    // ========================================
    // RESTORE TASK DRAFT
    // ========================================

    if (
        taskMode &&
        taskDraft
    ) {

        renderTaskDraft(
            taskDraft
        );

    }

    if (isSending) {
        renderTypingIndicator();
    } else if (pendingRequestError && pendingRetry) {
        renderRequestError(
            pendingRequestError,
            pendingRetry
        );
    }


    scrollToBottom();

}


// ============================================
// WELCOME
// ============================================


function renderWelcome() {
    const row = document.createElement("div");
    row.className = "message-row assistant";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    bubble.textContent =
        "Hi! I'm SNAP AI, your personal study assistant. " +
        "I can help you understand lessons, plan your studies, " +
        "create quizzes, and prepare for exams.";

    row.appendChild(bubble);
    chatArea.appendChild(row);

    const actions = document.createElement("div");
    actions.className = "quick-actions";

    const suggestions = [
        {
            label: "Help me plan my study",
            prompt:
                "Help me build a realistic study schedule. " +
                "Ask me about my subjects, upcoming exams or " +
                "deadlines, available study hours, and priorities. " +
                "Then organize a practical study plan with " +
                "short breaks and manageable goals."
        },
        {
            label: "Suggest study tips",
            prompt:
                "Act as my personal study coach. " +
                "Give me effective study techniques that are " +
                "easy for a college student to follow. " +
                "Include active recall, spaced repetition, " +
                "practice testing, and useful examples. " +
                "Keep your advice simple and practical."
        },
        {
            label: "Explain a topic",
            prompt:
                "I want to understand a lesson. " +
                "First, ask me what topic I want to learn. " +
                "Then explain it using simple words, " +
                "real-life examples, and step-by-step explanations. " +
                "Afterward, ask me a question to check " +
                "whether I understood."
        },
        {
            label: "Motivate me",
            prompt:
                "Be my supportive study coach. " +
                "Give me short, encouraging, realistic advice " +
                "to help me start studying. " +
                "Suggest one small task I can do right now. " +
                "Avoid generic motivational speeches."
        },
        {
            label: "Practice quiz",
            prompt:
                "Let's have an interactive practice quiz. " +
                "Ask me what subject or topic I want to review. " +
                "Ask one question at a time and wait for my answer. " +
                "After I answer, tell me whether it is correct, " +
                "explain why, then ask the next question. " +
                "After five questions, summarize my score " +
                "and recommend what I should review."
        },
        {
            label: "Create a task",
            mode: "task"
        }
    ];

    suggestions.forEach(suggestion => {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "quick-action";
        button.textContent = suggestion.label;

        button.addEventListener("click", () => {
            if (isSending) return;

            if (suggestion.mode === "task") {
                enableTaskMode();
                return;
            }

            messageInput.value = suggestion.prompt;

            resizeInput();
            sendMessage();
        });

        actions.appendChild(button);
    });

    chatArea.appendChild(actions);
}



// ============================================
// RENDER MESSAGE
// ============================================

function renderAssistantContent(container, content) {
    renderMarkdown(container, content);
}

function renderMessage(
    role,
    content
) {

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row " +
        (
            role === "user"
                ? "user"
                : "assistant"
        );


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";


    if (role === "user") {
        bubble.textContent = content;
    } else {
        renderAssistantContent(bubble, content);
    }


    row.appendChild(
        bubble
    );


    if (role !== "user") {
        const messageActions =
            document.createElement("div");
        messageActions.className = "message-actions";

        const copyButton =
            document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "message-action-button";
        copyButton.setAttribute(
            "aria-label",
            "Copy SNAP AI response"
        );
        copyButton.setAttribute("title", "Copy");
        copyButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        `;

        copyButton.addEventListener(
            "click",
            async function() {
                try {
                    await copyTextToClipboard(content);

                    copyButton.classList.add("copied");
                    copyButton.setAttribute("title", "Copied");
                    copyButton.setAttribute("aria-label", "Copied");
                    copyButton.innerHTML = `
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M5 12.5l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                    `;

                    if (copyResetTimer) {
                        window.clearTimeout(copyResetTimer);
                    }

                    copyResetTimer = window.setTimeout(function() {
                        resetCopyButton(copyButton);
                    }, 600);
                }
                catch (error) {
                    console.error("Copy failed:", error);
                }
            }
        );

        const speechButton =
            document.createElement("button");
        speechButton.type = "button";
        speechButton.className = "message-action-button";
        speechButton.setAttribute(
            "aria-label",
            "Read SNAP AI response aloud"
        );
        speechButton.setAttribute("title", "Read aloud");
        speechButton.innerHTML = `
            <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 10v4h3l4 3V7l-4 3H4z" fill="currentColor"></path>
                <path d="M15 9.5a4 4 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
                <path d="M17.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        `;
        speechButton.addEventListener(
            "click",
            function() {
                speakMessage(content, speechButton);
            }
        );

        messageActions.appendChild(copyButton);
        messageActions.appendChild(speechButton);
        row.appendChild(messageActions);
    }


    chatArea.appendChild(
        row
    );

}


// ============================================
// COPY MESSAGE
// ============================================

async function copyTextToClipboard(
    text
) {

    if (
        navigator.clipboard &&
        window.isSecureContext
    ) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        }
        catch (error) {
            console.warn("Clipboard API failed, falling back.", error);
        }
    }

    const temporaryTextarea =
        document.createElement("textarea");
    temporaryTextarea.value = text;
    temporaryTextarea.style.position = "fixed";
    temporaryTextarea.style.opacity = "0";
    temporaryTextarea.style.pointerEvents = "none";
    document.body.appendChild(temporaryTextarea);

    try {
        temporaryTextarea.focus();
        temporaryTextarea.select();

        if (!document.execCommand("copy")) {
            throw new Error("Unable to copy message.");
        }
    }
    finally {
        temporaryTextarea.remove();
    }

}


// ============================================
// TEXT TO SPEECH
// ============================================

let activeSpeechButton = null;
let copyResetTimer = null;

function resetCopyButton(button) {
    if (!button) {
        return;
    }

    button.classList.remove("copied");
    button.setAttribute("title", "Copy");
    button.setAttribute("aria-label", "Copy SNAP AI response");
    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"></rect>
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
        </svg>
    `;
}

function resetSpeechButton(button) {
    if (!button) {
        return;
    }

    button.classList.remove("speaking");
    button.setAttribute("aria-label", "Read SNAP AI response aloud");
    button.setAttribute("title", "Read aloud");
    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 10v4h3l4 3V7l-4 3H4z" fill="currentColor"></path>
            <path d="M15 9.5a4 4 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            <path d="M17.5 7a7.5 7.5 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
        </svg>
    `;
}

function resetSpeechButtons() {
    document
        .querySelectorAll(".message-action-button.speaking")
        .forEach(function(button) {
            resetSpeechButton(button);
        });
}

function speakMessage(
    text,
    button
) {

    if (!("speechSynthesis" in window)) {
        alert("Text-to-speech is not supported by this browser.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        activeSpeechButton = null;
        resetSpeechButtons();
        return;
    }

    const utterance =
        new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    activeSpeechButton = button;
    button.classList.add("speaking");
    button.setAttribute("aria-label", "Stop reading");
    button.setAttribute("title", "Stop reading");
    button.innerHTML = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"></rect>
        </svg>
    `;

    const finish = function() {
        resetSpeechButton(button);
        if (activeSpeechButton === button) {
            activeSpeechButton = null;
        }
    };

    utterance.onend = finish;
    utterance.onerror = function(error) {
        console.error("Text-to-speech error:", error);
        finish();
    };

    window.speechSynthesis.speak(utterance);

}


// ============================================
// SEND MESSAGE
// ============================================

async function sendMessage() {

    const message =
        messageInput.value
            .trim();


    if (
        !message ||
        isSending
    ) {

        return;

    }

    if (!currentUser || !currentChatId) {
        showSystemMessage(
            "Please sign in to use SNAP AI."
        );
        return;
    }


    pendingRequestError = null;
    pendingRetry = null;

    chatArea
        .querySelector(".request-error")
        ?.remove();

    messageInput.value =
        "";

    resizeInput();

    isSending = true;
    sendButton.disabled = true;


    let userMessageSaved = false;
    try {
        await saveMessage(
            "user",
            message
        );
        userMessageSaved = true;

        renderTypingIndicator();

        await processSNAPResponse(
            message
        );
        pendingRequestError = null;
        pendingRetry = null;
    }
    catch (error) {
        console.error("SNAP AI request failed:", error);

        const errorMessage =
            error?.message ||
            "An unexpected error occurred.";

        const retryRequest = async () => {
            try {
                chatArea.querySelector(".request-error")?.remove();
                if (!userMessageSaved) {
                    await saveMessage("user", message);
                    userMessageSaved = true;
                }
                renderTypingIndicator();
                await processSNAPResponse(message);
                pendingRequestError = null;
                pendingRetry = null;
            }
            catch (retryError) {
                console.error("SNAP AI retry failed:", retryError);
                renderRequestError(
                    retryError?.message || "An unexpected error occurred.",
                    retryRequest
                );
            }
            finally {
                chatArea.querySelector(".typing-indicator")?.remove();
            }
        };
        renderRequestError(errorMessage, retryRequest);
    }
    finally {
        isSending = false;
        sendButton.disabled = false;
        chatArea.querySelector(".typing-indicator")?.remove();
    }

}

function renderRequestError(message, retry) {
    pendingRequestError = message;
    pendingRetry = retry;

    chatArea.querySelector(".request-error")?.remove();
    const row = document.createElement("div");
    row.className = "message-row assistant request-error";

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";
    bubble.textContent = "SNAP AI couldn't complete your request. " + message;

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "quick-action";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", async function() {
        if (isSending) return;
        isSending = true;
        sendButton.disabled = true;
        retryButton.disabled = true;
        await retry();
        isSending = false;
        sendButton.disabled = false;
    });

    row.append(bubble, retryButton);
    chatArea.appendChild(row);
    scrollToBottom();
}


// ============================================
// SAVE MESSAGE
// ============================================

async function saveMessage(
    role,
    content
) {

    if (
        !currentUser ||
        !currentChatId
    ) {

        return;

    }


    const messagesReference =
        collection(
            db,
            "users",
            currentUser.uid,
            "aiChats",
            currentChatId,
            "messages"
        );

    const messageReference =
        doc(messagesReference);

    const chatReference =
        doc(
            db,
            "users",
            currentUser.uid,
            "aiChats",
            currentChatId
        );

    const chatUpdate = {
        updatedAt: serverTimestamp()
    };

    if (
        role === "user" &&
        (currentChatTitle === "New chat" ||
            currentChatTitle === "SNAP AI Chat")
    ) {
        currentChatTitle =
            content.trim().slice(0, 60) || "SNAP AI Chat";
        chatUpdate.title = currentChatTitle;
    }

    const batch =
        writeBatch(db);

    batch.set(
        messageReference,
        {
            role: role,
            content: content,
            createdAt: serverTimestamp()
        }
    );

    batch.update(
        chatReference,
        chatUpdate
    );

    await batch.commit();

}


// ============================================
// UPDATE CHAT
// ============================================

// ============================================
// SNAP AI RESPONSE ENGINE
// ============================================

async function processSNAPResponse(message) {
    if (taskMode) {
        await processTaskMode(message);
        return;
    }

    // conversationHistory comes from the Firestore snapshot.
    const messages = conversationHistory
        .filter(function(item) {
            return (
                (item.role === "user" || item.role === "assistant") &&
                typeof item.content === "string" &&
                item.content.trim()
            );
        })
        .slice(-14)
        .map(function(item) {
            return {
                role: item.role,
                content: item.content
            };
        });

    // A Firestore snapshot may arrive before or after sendMessage().
    // Add the current message only when it isn't already the last message.
    const lastMessage = messages[messages.length - 1];

    if (
        !lastMessage ||
        lastMessage.role !== "user" ||
        lastMessage.content !== message
    ) {
        messages.push({
            role: "user",
            content: message
        });
    }

    const answer = await requestSnapAI(messages);
    await saveMessage("assistant", answer);
}

function renderTypingIndicator() {
    if (chatArea.querySelector(".typing-indicator")) {
        return;
    }

    const row =
        document.createElement("div");
    row.className = "message-row assistant typing-indicator";
    row.setAttribute("role", "status");
    row.setAttribute("aria-label", "SNAP AI is responding");
    row.innerHTML = "<span></span><span></span><span></span>";
    chatArea.appendChild(row);
    scrollToBottom();
}


// ============================================
// TASK MODE
// ============================================

function enableTaskMode() {

    taskMode =
        true;

    taskDraft =
        null;

    taskModePanel.classList.remove(
        "hidden"
    );


    messageInput.placeholder =
        "Describe the task you want to create...";

    messageInput.focus();

}

function disableTaskMode() {

    taskMode =
        false;

    taskDraft =
        null;

    editingTaskDraft =
        false;

    taskModePanel.classList.add(
        "hidden"
    );

    messageInput.placeholder =
        "Describe the task or ask SNAP AI...";

}

async function processTaskMode(
    message
) {

    const draft =
        buildTaskDraft(
            message
        );

    taskDraft =
        draft;

    // Show the draft immediately while Firestore saves its acknowledgment.
    renderTaskDraft(
        taskDraft
    );

    await saveMessage(
        "assistant",
        "I drafted a task using what you provided. Review the details below."
    );

}

function buildTaskDraft(
    message
) {

    let title =
        message.trim();

    let category =
        "Personal";

    const lower =
        message.toLowerCase();

    if (
        lower.includes("school") ||
        lower.includes("study") ||
        lower.includes("assignment") ||
        lower.includes("exam")
    ) {
        category = "School";
    }
    else if (
        lower.includes("work") ||
        lower.includes("meeting") ||
        lower.includes("project")
    ) {
        category = "Work";
    }
    else if (
        lower.includes("trip") ||
        lower.includes("travel") ||
        lower.includes("baguio")
    ) {
        category = "Trips";
    }

    if (title.length > 60) {
        title = title.substring(0, 60) + "...";
    }

    const now =
        new Date();
    const dueDate =
        now.toISOString().split("T")[0];

    return {
        title,
        category,
        dueDate,
        dueTime: "17:00",
        reminder: "15 minutes",
        description: message.trim()
    };

}


// ============================================
// RENDER TASK DRAFT
// ============================================

function renderTaskDraft(
    draft
) {

    chatArea
        .querySelectorAll(".task-draft")
        .forEach(function(existingDraft) {
            existingDraft.closest(".message-row")?.remove();
        });

    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row assistant";


    const container =
        document.createElement(
            "div"
        );

    container.className =
        "task-draft";


    container.innerHTML = `
        <div class="task-draft-title">
            Task draft
        </div>

        <div class="task-draft-row">
            <strong>Title:</strong>
            ${escapeHTML(draft.title)}
        </div>

        <div class="task-draft-row">
            <strong>Category:</strong>
            ${escapeHTML(draft.category)}
        </div>

        <div class="task-draft-row">
            <strong>Due:</strong>
            ${escapeHTML(draft.dueDate)}
            at
            ${escapeHTML(draft.dueTime)}
        </div>

        <div class="task-draft-row">
            <strong>Reminder:</strong>
            ${escapeHTML(draft.reminder)}
        </div>

        <div class="task-draft-description">
            <strong>Description:</strong><br>
            ${escapeHTML(draft.description)}
        </div>

        <div class="task-draft-actions">

            <button
                type="button"
                class="confirm-task"
            >
                Confirm
            </button>

            <button
                type="button"
                class="edit-task"
            >
                Edit
            </button>

            <button
                type="button"
                class="cancel-task"
            >
                Cancel
            </button>

        </div>
    `;


    row.appendChild(
        container
    );


    chatArea.appendChild(
        row
    );


    const confirmButton =
        container.querySelector(
            ".confirm-task"
        );


    const editButton =
        container.querySelector(
            ".edit-task"
        );


    const cancelButton =
        container.querySelector(
            ".cancel-task"
        );


    confirmButton.addEventListener(
        "click",
        confirmTaskDraft
    );


    editButton.addEventListener(
        "click",
        openTaskEditor
    );


    cancelButton.addEventListener(
        "click",
        cancelTaskDraft
    );


    scrollToBottom();

}


// ============================================
// CONFIRM TASK
// ============================================

async function confirmTaskDraft() {

    if (
        !taskDraft ||
        !currentUser
    ) {

        return;

    }


    try {

        const tasksReference =
            collection(
                db,
                "users",
                currentUser.uid,
                "tasks"
            );


        await addDoc(
            tasksReference,
            {
                title:
                    taskDraft.title,

                category:
                    taskDraft.category,

                dueDate:
                    taskDraft.dueDate,

                dueTime:
                    taskDraft.dueTime,

                reminder:
                    taskDraft.reminder,

                description:
                    taskDraft.description,

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
            }
        );


        await saveMessage(
            "assistant",
            "Done! ✅ I added that task to your SNAP Tasks."
        );


        taskDraft =
            null;


        disableTaskMode();

    }
    catch (error) {

        console.error(
            "Error creating AI task:",
            error
        );


        await saveMessage(
            "assistant",
            "I couldn't create that task right now. Please try again."
        );

    }

}


// ============================================
// CANCEL TASK
// ============================================

async function cancelTaskDraft() {

    taskDraft =
        null;


    await saveMessage(
        "assistant",
        "No problem. I cancelled the task draft."
    );


    disableTaskMode();

}


// ============================================
// OPEN TASK EDITOR
// ============================================

function openTaskEditor() {

    if (!taskDraft) {
        return;
    }


    document.querySelector(
        "#edit-task-title"
    ).value =
        taskDraft.title;


    document.querySelector(
        "#edit-task-category"
    ).value =
        taskDraft.category;


    document.querySelector(
        "#edit-task-date"
    ).value =
        taskDraft.dueDate;


    document.querySelector(
        "#edit-task-time"
    ).value =
        taskDraft.dueTime;


    document.querySelector(
        "#edit-task-description"
    ).value =
        taskDraft.description;


    document.querySelector(
        "#task-edit-modal"
    ).classList.remove(
        "hidden"
    );


    editingTaskDraft =
        true;

}


// ============================================
// SAVE TASK EDIT
// ============================================

document.querySelector(
    "#save-task-edit"
).addEventListener(
    "click",
    function() {

        if (
            !taskDraft
        ) {

            return;

        }


        taskDraft.title =
            document.querySelector(
                "#edit-task-title"
            ).value.trim();


        taskDraft.category =
            document.querySelector(
                "#edit-task-category"
            ).value.trim();


        taskDraft.dueDate =
            document.querySelector(
                "#edit-task-date"
            ).value;


        taskDraft.dueTime =
            document.querySelector(
                "#edit-task-time"
            ).value;


        taskDraft.description =
            document.querySelector(
                "#edit-task-description"
            ).value.trim();


        document.querySelector(
            "#task-edit-modal"
        ).classList.add(
            "hidden"
        );


        editingTaskDraft =
            false;


        renderTaskDraft(
            taskDraft
        );

    }
);


// ============================================
// CANCEL EDIT
// ============================================

document.querySelector(
    "#cancel-task-edit"
).addEventListener(
    "click",
    function() {

        document.querySelector(
            "#task-edit-modal"
        ).classList.add(
            "hidden"
        );


        editingTaskDraft =
            false;

    }
);


// ============================================
// CLOSE TASK MODE
// ============================================

closeTaskMode.addEventListener(
    "click",
    function() {

        disableTaskMode();

    }
);

newChatButton.addEventListener(
    "click",
    startNewChat
);


// ============================================
// TASK MODE BUTTON
// ============================================

taskModeButton.addEventListener(
    "click",
    function() {

        if (
            taskMode
        ) {

            disableTaskMode();

        }
        else {

            enableTaskMode();

        }

    }
);


// ============================================
// SEND BUTTON
// ============================================

sendButton.addEventListener(
    "click",
    function() {

        sendMessage();

    }
);


// ============================================
// ENTER TO SEND
// ============================================

messageInput.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key ===
            "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


// ============================================
// AUTO RESIZE
// ============================================

messageInput.addEventListener(
    "input",
    resizeInput
);


function resizeInput() {

    messageInput.style.height =
        "auto";


    messageInput.style.height =
        Math.min(
            messageInput.scrollHeight,
            130
        ) + "px";

}


// ============================================
// ADD MENU
// ============================================

addButton.addEventListener(
    "click",
    function(event) {

        event.stopPropagation();

        actionMenu.classList.toggle(
            "hidden"
        );

    }
);


document.addEventListener(
    "click",
    function(event) {

        if (
            !actionMenu.contains(
                event.target
            ) &&
            event.target !==
                addButton
        ) {

            actionMenu.classList.add(
                "hidden"
            );

        }

    }
);


// ============================================
// ACTION MENU
// ============================================

actionMenu
    .querySelectorAll(
        "button"
    )
    .forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const action =
                        button.dataset.action;


                    actionMenu.classList.add(
                        "hidden"
                    );


                    if (
                        action ===
                        "task"
                    ) {

                        enableTaskMode();

                    }


                    if (
                        action ===
                        "help"
                    ) {

                        messageInput.value =
                            "What can you help me with?";

                        sendMessage();

                    }


                    if (
                        action ===
                        "notes"
                    ) {

                        messageInput.value =
                            "Help me work with my notes.";

                        sendMessage();

                    }

                }
            );

        }
    );


// ============================================
// AI TOOLS
// ============================================

aiToolsButton.addEventListener(
    "click",
    function() {

        messageInput.value =
            "What can SNAP AI help me with?";

        sendMessage();

    }
);


// ============================================
// MICROPHONE
// ============================================

micButton.addEventListener(
    "click",
    function() {

        if (
            !("webkitSpeechRecognition" in window) &&
            !("SpeechRecognition" in window)
        ) {

            alert(
                "Voice input is not supported by this browser."
            );

            return;

        }


        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;


        const recognition =
            new SpeechRecognition();


        recognition.lang =
            "en-US";


        recognition.interimResults =
            false;


        recognition.maxAlternatives =
            1;


        recognition.start();


        recognition.onresult =
            function(event) {

                messageInput.value =
                    event.results[0][0].transcript;

                resizeInput();

            };


        recognition.onerror =
            function(error) {

                console.error(
                    "Voice input error:",
                    error
                );

            };

    }
);


// ============================================
// SCROLL
// ============================================

function scrollToBottom() {

    requestAnimationFrame(
        function() {

            chatArea.scrollTop =
                chatArea.scrollHeight;

        }
    );

}


// ============================================
// HTML ESCAPE
// ============================================

function escapeHTML(
    value
) {

    return String(
        value || ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================
// SYSTEM MESSAGE
// ============================================

function showSystemMessage(
    message
) {

    chatArea.innerHTML =
        "";


    const row =
        document.createElement(
            "div"
        );

    row.className =
        "message-row assistant";


    const bubble =
        document.createElement(
            "div"
        );

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message;


    row.appendChild(
        bubble
    );


    chatArea.appendChild(
        row
    );

}