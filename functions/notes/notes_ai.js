import { auth } from "../firebase/firebase.js";
import {
    createAIConversation,
    getActiveAIConversationId,
    listAIConversations,
    loadAIConversationMessages,
    requestSnapAI,
    saveAIConversationMessage,
    setActiveAIConversation
} from "../ai_chat/ai_service.js?v=20261115-api-config-1";
import { renderMarkdown } from "../ai_chat/markdown_renderer.js?v=20261111a";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const workspace = document.getElementById("notes-workspace");
const toggleButton = document.getElementById("notes-ai-toggle");
const closeButton = document.getElementById("notes-ai-close");
const panel = document.getElementById("notes-ai-panel");
const form = document.getElementById("notes-ai-form");
const input = document.getElementById("notes-ai-input");
const sendButton = document.getElementById("notes-ai-send");
const chatWindow = document.getElementById("notes-ai-chat-window");
const status = document.getElementById("notes-ai-status");
const editor = document.getElementById("note-editor");
const openChatLink = document.getElementById("notes-ai-open-chat");
const historySelect = document.getElementById("notes-ai-history");
const newChatButton = document.getElementById("notes-ai-new-chat");

let currentUser = null;
let conversationId = null;
let history = [];
let conversations = [];
let isSending = false;
let isCreatingConversation = false;
let pendingPrompt = null;
let pendingUserSave = false;
let savedEditorRange = null;

function setPanelState(isOpen) {
    workspace.classList.toggle("ai-open", isOpen);
    toggleButton.setAttribute("aria-expanded", String(isOpen));
    panel.setAttribute("aria-hidden", String(!isOpen));
}

function addMessage(role, text, canInsert = false) {
    const bubble = document.createElement("div");
    bubble.className = `ai-message ai-${role}`;
    const content = document.createElement("div");
    content.className = "ai-message-content";
    if (role === "bot") renderMarkdown(content, text);
    else content.textContent = text;
    bubble.appendChild(content);

    if (role === "bot" && canInsert) {
        const insertButton = document.createElement("button");
        insertButton.type = "button";
        insertButton.className = "ai-insert-button";
        insertButton.textContent = "Insert into note";
        insertButton.addEventListener("click", () => insertIntoNote(text));
        bubble.appendChild(insertButton);
    }

    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return bubble;
}

function renderHistory() {
    chatWindow.replaceChildren();
    if (!history.length) {
        addMessage(
            "bot",
            "Ask SNAP AI to help with this note. Your draft stays untouched until you choose to insert."
        );
        return;
    }
    history.slice(-16).forEach(message =>
        addMessage(message.role === "assistant" ? "bot" : "user", message.content, message.role === "assistant")
    );
}

function updateChatLink() {
    if (!conversationId) return;
    openChatLink.href =
        "../ai%20and%20chat/ai_and_chat.php?chatId=" + encodeURIComponent(conversationId);
}

function updateHistoryOptions() {
    historySelect.replaceChildren();
    conversations.forEach(conversation => {
        const option = document.createElement("option");
        option.value = conversation.id;
        option.textContent = conversation.title || "SNAP AI Chat";
        option.selected = conversation.id === conversationId;
        historySelect.append(option);
    });
    historySelect.disabled = isSending || isCreatingConversation || conversations.length === 0;
}

function refreshConversationTitle(content) {
    const conversation = conversations.find(item => item.id === conversationId);
    if (conversation && ["New chat", "SNAP AI Chat"].includes(conversation.title)) {
        conversation.title = content.trim().slice(0, 60) || "SNAP AI Chat";
        updateHistoryOptions();
    }
}

function safeNoteFragment(source) {
    const parsed = document.createRange().createContextualFragment(source);
    const allowed = new Set([
        "A", "B", "BLOCKQUOTE", "BR", "CODE", "DEL", "DIV", "EM",
        "H1", "H2", "H3", "H4", "H5", "H6", "HR", "I", "LI",
        "OL", "P", "PRE", "S", "STRONG", "TABLE", "TBODY", "TD",
        "TH", "THEAD", "TR", "U", "UL"
    ]);

    function clean(parent) {
        [...parent.childNodes].forEach(node => {
            if (node.nodeType !== Node.ELEMENT_NODE) return;
            if (!allowed.has(node.tagName)) {
                clean(node);
                node.replaceWith(...node.childNodes);
                return;
            }
            const href = node.tagName === "A" ? node.getAttribute("href") : null;
            const className = node.className;
            [...node.attributes].forEach(attribute => node.removeAttribute(attribute.name));
            if (href) {
                try {
                    const url = new URL(href, window.location.href);
                    if (["http:", "https:", "mailto:"].includes(url.protocol)) {
                        node.href = url.href;
                        node.rel = "noopener noreferrer";
                    }
                } catch (error) {
                    console.warn("Discarded an invalid link from AI output.");
                }
            }
            if (node.tagName === "TABLE") node.className = "ai-markdown-table";
            if (node.tagName === "DIV" && className === "ai-markdown-table-wrap") {
                node.className = className;
            }
            clean(node);
        });
    }

    clean(parsed);
    return parsed;
}

function renderMarkdownToHTML(text) {
    const temporary = document.createElement("div");
    renderMarkdown(temporary, text);
    temporary.querySelectorAll(".ai-code-header").forEach(header => header.remove());
    return temporary.innerHTML;
}

function insertIntoNote(text) {
    if (!editor) return;
    const selection = window.getSelection();
    const activeRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const savedRange = activeRange && editor.contains(activeRange.commonAncestorContainer) ?
        activeRange.cloneRange() :
        savedEditorRange && editor.contains(savedEditorRange.commonAncestorContainer) ?
            savedEditorRange.cloneRange() : null;
    const range = document.createRange();
    editor.focus();
    if (savedRange && editor.contains(savedRange.commonAncestorContainer)) {
        range.setStart(savedRange.startContainer, savedRange.startOffset);
        range.setEnd(savedRange.endContainer, savedRange.endOffset);
    } else {
        range.selectNodeContents(editor);
        range.collapse(false);
    }
    selection.removeAllRanges();
    selection.addRange(range);
    const fragment = safeNoteFragment(renderMarkdownToHTML(text));
    if (editor.innerText.trim() && range.collapsed) {
        fragment.prepend(document.createElement("br"), document.createElement("br"));
    }
    const html = document.createElement("div");
    html.append(fragment.cloneNode(true));
    const inserted = document.execCommand("insertHTML", false, html.innerHTML);
    if (!inserted) {
        const fallback = safeNoteFragment(html.innerHTML);
        range.deleteContents();
        range.insertNode(fallback);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    editor.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText" }));
    status.textContent = "Added to your note. Your changes will autosave.";
}

function showRetryError(message, prompt, userSaveFailed = false) {
    status.classList.remove("is-loading");
    status.replaceChildren();
    const text = document.createElement("span");
    text.textContent = message;
    status.appendChild(text);
    const retryButton = document.createElement("button");
    retryButton.type = "button";
    retryButton.className = "notes-ai-retry";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", () =>
        sendPrompt(prompt, true, userSaveFailed)
    );
    status.appendChild(retryButton);
    pendingPrompt = prompt;
    pendingUserSave = userSaveFailed;
}

function getSelectedNoteText() {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return "";
    const range = selection.getRangeAt(0);
    return editor.contains(range.commonAncestorContainer) ?
        selection.toString().replace(/\u00a0/g, " ").trim() : "";
}

function buildPrompt(instruction, selectedText = "") {
    const noteText = (editor.innerText || "").replace(/\u00a0/g, " ").trim();
    const context = selectedText || noteText;
    const requiresNote = /summarize|rewrite|correct grammar|expand my current note|explain this topic|organize this material/i.test(instruction);
    if (requiresNote && !context) {
        throw new Error("Add some text to your note first, then ask SNAP AI to work with it.");
    }

    let prompt = instruction.trim();
    if (context) {
        prompt += selectedText ?
            "\n\nSelected note text (use as source material; do not claim to save or replace it):\n" + context :
            "\n\nCurrent note draft (use as source material; do not claim to save or replace it):\n" + context;
    }
    if (prompt.length > 12000) {
        throw new Error("This note and prompt are too long to send. Shorten the draft and try again.");
    }
    return prompt;
}

async function initializeConversation(user) {
    const requestedId = new URLSearchParams(window.location.search).get("chatId");
    conversations = await listAIConversations(user);
    const activeId = getActiveAIConversationId(user);
    conversationId = conversations.some(item => item.id === requestedId) ? requestedId :
        conversations.some(item => item.id === activeId) ? activeId :
            conversations[0]?.id || null;
    if (conversationId) {
        history = await loadAIConversationMessages(user, conversationId);
        setActiveAIConversation(user, conversationId);
    } else {
        await startNewConversation();
    }
    updateHistoryOptions();
    updateChatLink();
    renderHistory();
}

async function startNewConversation() {
    if (!currentUser || isCreatingConversation) return;
    isCreatingConversation = true;
    newChatButton.disabled = true;
    sendButton.disabled = true;
    input.disabled = true;
    try {
        conversationId = await createAIConversation(currentUser, "New chat");
        conversations.unshift({
            id: conversationId,
            title: "New chat",
            updatedAt: { toMillis: () => Date.now() }
        });
        history = [];
        pendingPrompt = null;
        pendingUserSave = false;
        updateHistoryOptions();
        updateChatLink();
        renderHistory();
        status.textContent = "";
        input.focus();
    } finally {
        isCreatingConversation = false;
        sendButton.disabled = !currentUser;
        input.disabled = !currentUser;
        newChatButton.disabled = isSending;
        updateHistoryOptions();
    }
}

async function selectConversation(id) {
    if (!id || id === conversationId) return;
    if (isSending || isCreatingConversation || pendingPrompt) {
        updateHistoryOptions();
        return;
    }
    try {
        history = await loadAIConversationMessages(currentUser, id);
        conversationId = id;
        setActiveAIConversation(currentUser, id);
        updateHistoryOptions();
        updateChatLink();
        renderHistory();
        status.textContent = "";
    } catch (error) {
        console.error("Could not switch SNAP AI note conversation:", error);
        status.textContent = error.message || "Could not load this conversation.";
        updateHistoryOptions();
    }
}

async function sendPrompt(instruction, retry = false, retryUserSave = false, selectedText = "") {
    if (isSending || isCreatingConversation || !currentUser || !conversationId) return;
    let prompt;
    try {
        prompt = retry ? pendingPrompt : buildPrompt(instruction, selectedText);
        if (!prompt) return;
    } catch (error) {
        status.textContent = error.message;
        return;
    }

    isSending = true;
    sendButton.disabled = true;
    input.disabled = true;
    newChatButton.disabled = true;
    historySelect.disabled = true;
    document.querySelectorAll("[data-ai-action]").forEach(button => {
        button.disabled = true;
    });
    status.classList.add("is-loading");
    status.textContent = "SNAP AI is thinking...";

    if (!retry) {
        const userBubble = addMessage("user", prompt);
        try {
            await saveAIConversationMessage(currentUser, conversationId, "user", prompt);
            history.push({ role: "user", content: prompt });
            refreshConversationTitle(prompt);
        } catch (error) {
            console.error("Could not save SNAP AI note prompt:", error);
            userBubble.remove();
            showRetryError("Your prompt could not be saved.", prompt, true);
            finishRequest();
            return;
        }
    } else if (retryUserSave) {
        try {
            await saveAIConversationMessage(currentUser, conversationId, "user", prompt);
            history.push({ role: "user", content: prompt });
            refreshConversationTitle(prompt);
            pendingUserSave = false;
        } catch (error) {
            console.error("Could not save SNAP AI note prompt:", error);
            showRetryError("Your prompt could not be saved.", prompt, true);
            finishRequest();
            return;
        }
    }

    try {
        const answer = await requestSnapAI(history);
        await saveAIConversationMessage(currentUser, conversationId, "assistant", answer);
        history.push({ role: "assistant", content: answer });
        addMessage("bot", answer, true);
        status.textContent = "";
        pendingPrompt = null;
        pendingUserSave = false;
    } catch (error) {
        console.error("SNAP AI note request failed:", error);
        showRetryError(error.message || "SNAP AI could not answer. Please try again.", prompt);
    } finally {
        finishRequest();
    }
}

function finishRequest() {
    status.classList.remove("is-loading");
    isSending = false;
    sendButton.disabled = false;
    input.disabled = false;
    newChatButton.disabled = false;
    historySelect.disabled = conversations.length === 0;
    document.querySelectorAll("[data-ai-action]").forEach(button => {
        button.disabled = false;
    });
}

toggleButton.addEventListener("click", () => {
    setPanelState(!workspace.classList.contains("ai-open"));
});
closeButton.addEventListener("click", () => setPanelState(false));
newChatButton.addEventListener("click", async () => {
    if (isSending) return;
    try {
        await startNewConversation();
    } catch (error) {
        console.error("Could not start a new SNAP AI notes chat:", error);
        status.textContent = error.message || "Could not start a new chat.";
    }
});
historySelect.addEventListener("change", () => {
    selectConversation(historySelect.value);
});

form.addEventListener("submit", event => {
    event.preventDefault();
    if (pendingPrompt) {
        status.textContent = "Retry the previous request before sending another.";
        return;
    }
    const instruction = input.value.trim();
    if (!instruction) return;
    input.value = "";
    sendPrompt(instruction);
});

input.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        form.requestSubmit();
    }
});

document.addEventListener("selectionchange", () => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
        savedEditorRange = range.cloneRange();
    }
});

let actionSelectedText = "";
document.querySelectorAll("[data-ai-action]").forEach(button => {
    button.addEventListener("pointerdown", () => {
        actionSelectedText = getSelectedNoteText();
    });
    button.addEventListener("click", () => {
        if (pendingPrompt) {
            status.textContent = "Retry the previous request before starting another.";
            return;
        }
        sendPrompt(button.dataset.aiAction, false, false, actionSelectedText);
        actionSelectedText = "";
    });
});

onAuthStateChanged(auth, async user => {
    currentUser = user;
    conversationId = null;
    history = [];
    conversations = [];
    updateHistoryOptions();
    newChatButton.disabled = !user;
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
        console.error("Could not load the SNAP AI notes conversation:", error);
        status.textContent = error.message || "Could not load your SNAP AI conversation.";
    }
});

setPanelState(false);
