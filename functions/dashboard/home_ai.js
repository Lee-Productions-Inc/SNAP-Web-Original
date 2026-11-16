import { auth } from "../firebase/firebase.js";
import {
    createAIConversation,
    getActiveAIConversationId,
    getLatestAIConversationId,
    loadAIConversationMessages,
    requestSnapAI,
    saveAIConversationMessage
} from "../ai_chat/ai_service.js?v=20261115-api-config-1";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const form = document.getElementById("home-ai-form");
const input = document.getElementById("home-ai-input");
const sendButton = document.getElementById("home-ai-send");
const conversation = document.getElementById("home-ai-conversation");
const status = document.getElementById("home-ai-status");
const openChatLink = document.getElementById("home-ai-open-chat");

let currentUser = null;
let conversationId = null;
let history = [];
let isSending = false;
let pendingRetry = false;
let pendingPrompt = null;
let pendingUserSave = false;

function addMessage(role, content) {
    conversation.querySelector(".home-ai-empty")?.remove();
    const bubble = document.createElement("div");
    bubble.className = "home-ai-message home-ai-" + role;
    bubble.textContent = content;
    conversation.appendChild(bubble);
    conversation.scrollTop = conversation.scrollHeight;
    return bubble;
}

function updateChatLink() {
    if (!conversationId) return;
    openChatLink.href =
        "ai and chat/ai_and_chat.php?chatId=" + encodeURIComponent(conversationId);
}

function renderHistory() {
    conversation.replaceChildren();
    if (!history.length) {
        const empty = document.createElement("p");
        empty.className = "home-ai-empty";
        empty.textContent = "Your SNAP AI conversation will appear here.";
        conversation.appendChild(empty);
        return;
    }
    history.slice(-8).forEach(message => addMessage(message.role, message.content));
}

function showRetryError(message) {
    status.classList.remove("is-loading");
    status.replaceChildren();
    const text = document.createElement("span");
    text.textContent = message;
    status.appendChild(text);

    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "home-ai-retry";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", () =>
        sendQuestion("", true, pendingUserSave)
    );
    status.appendChild(retryButton);
    pendingRetry = true;
}

async function initializeConversation(user) {
    const requestedId = new URLSearchParams(window.location.search).get("chatId");
    conversationId = requestedId || getActiveAIConversationId(user);
    if (!conversationId) {
        conversationId = await getLatestAIConversationId(user);
    }
    if (conversationId) {
        history = await loadAIConversationMessages(user, conversationId);
    } else {
        conversationId = await createAIConversation(user, "SNAP AI Chat");
        history = [];
    }
    updateChatLink();
    renderHistory();
}

async function sendQuestion(question, retry = false, retryUserSave = false) {
    if (isSending || !currentUser || !conversationId) return;
    const prompt = question.trim();
    if (!retry && !prompt) return;

    isSending = true;
    pendingRetry = false;
    sendButton.disabled = true;
    input.disabled = true;
    status.classList.add("is-loading");
    status.textContent = "SNAP AI is thinking...";

    if (!retry) {
        input.value = "";
        const userBubble = addMessage("user", prompt);
        try {
            await saveAIConversationMessage(currentUser, conversationId, "user", prompt);
            history.push({ role: "user", content: prompt });
        } catch (error) {
            console.error("Could not save SNAP AI message:", error);
            userBubble.remove();
            pendingPrompt = prompt;
            pendingUserSave = true;
            showRetryError("Your message could not be saved. Please try again.");
            isSending = false;
            sendButton.disabled = false;
            input.disabled = false;
            return;
        }
    } else if (retryUserSave) {
        try {
            await saveAIConversationMessage(currentUser, conversationId, "user", pendingPrompt);
            history.push({ role: "user", content: pendingPrompt });
            addMessage("user", pendingPrompt);
            pendingUserSave = false;
        } catch (error) {
            console.error("Could not save SNAP AI message on retry:", error);
            showRetryError("Your message could not be saved. Please try again.");
            isSending = false;
            sendButton.disabled = false;
            input.disabled = false;
            return;
        }
    }

    try {
        const answer = await requestSnapAI(history);
        await saveAIConversationMessage(currentUser, conversationId, "assistant", answer);
        history.push({ role: "assistant", content: answer });
        addMessage("assistant", answer);
        status.textContent = "";
        pendingRetry = false;
        pendingPrompt = null;
        pendingUserSave = false;
    } catch (error) {
        console.error("SNAP AI Home request failed:", error);
        pendingPrompt = history[history.length - 1]?.content || prompt;
        pendingUserSave = false;
        showRetryError(error.message || "SNAP AI could not answer. Please try again.");
    } finally {
        status.classList.remove("is-loading");
        isSending = false;
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

form.addEventListener("submit", event => {
    event.preventDefault();
    if (pendingRetry) {
        status.textContent = "Retry the previous question before sending another.";
        return;
    }
    sendQuestion(input.value);
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

onAuthStateChanged(auth, async user => {
    currentUser = user;
    conversationId = null;
    history = [];
    status.textContent = "";
    if (!user) {
        renderHistory();
        status.textContent = "Please sign in to use SNAP AI.";
        sendButton.disabled = true;
        input.disabled = true;
        return;
    }

    sendButton.disabled = false;
    input.disabled = false;
    try {
        await initializeConversation(user);
    } catch (error) {
        console.error("Could not load the Home SNAP AI conversation:", error);
        status.textContent = error.message || "Could not load your SNAP AI conversation.";
    }
});
