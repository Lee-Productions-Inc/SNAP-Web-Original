import { auth, db } from "../firebase/firebase.js";
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const API_URL =
    typeof window.SNAP_AI_API_URL === "string"
        ? window.SNAP_AI_API_URL.trim()
        : "";
const REQUEST_TIMEOUT_MS = 65000;

function requireUser(user = auth.currentUser) {
    if (!user) {
        throw new Error("Please sign in to use SNAP AI.");
    }
    return user;
}

export async function requestSnapAI(messages, options = {}) {
    const user = requireUser();
    if (!API_URL) {
        throw new Error(
            "SNAP AI is not configured for this site. Please contact SNAP support."
        );
    }
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error("SNAP AI needs at least one conversation message.");
    }
    const recentMessages = messages.slice(-30);
    if (recentMessages.some(message =>
        !message ||
        !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" ||
        !message.content.trim() ||
        message.content.length > 12000
    )) {
        throw new Error("SNAP AI messages must contain text under 12,000 characters.");
    }
    const validMessages = recentMessages;

    if (!validMessages.length || validMessages[validMessages.length - 1].role !== "user") {
        throw new Error("Enter a message before asking SNAP AI.");
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(
        () => controller.abort(new DOMException("SNAP AI request timed out.", "TimeoutError")),
        REQUEST_TIMEOUT_MS
    );
    const externalSignal = options.signal;
    const abortFromExternal = () => controller.abort(externalSignal.reason);

    if (externalSignal) {
        if (externalSignal.aborted) abortFromExternal();
        else externalSignal.addEventListener("abort", abortFromExternal, { once: true });
    }

    try {
        const token = await user.getIdToken();
        let response;
        try {
            response = await fetch(API_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                    messages: validMessages.map(message => ({
                        role: message.role,
                        content: message.content.trim()
                    }))
                }),
                signal: controller.signal
            });
        } catch (error) {
            if (controller.signal.aborted) {
                throw new Error(
                    controller.signal.reason?.name === "TimeoutError"
                        ? "SNAP AI took too long to respond. Please try again."
                        : "The SNAP AI request was cancelled."
                );
            }
            console.error("SNAP AI connection error:", error);
            let localEndpoint = false;
            try {
                localEndpoint = [
                    "localhost",
                    "127.0.0.1",
                    "[::1]"
                ].includes(new URL(API_URL, window.location.href).hostname);
            } catch (urlError) {
                console.error("SNAP AI endpoint URL is invalid.", urlError);
            }
            throw new Error(localEndpoint
                ? "Cannot connect to the local SNAP AI server. Start it with server\\Start-SNAP-Local.cmd and try again."
                : "Cannot connect to the SNAP AI service. Check your connection and try again.");
        }

        let result;
        try {
            result = await response.json();
        } catch (error) {
            console.error("Invalid SNAP AI server response:", error);
            throw new Error("The SNAP AI server returned an invalid response.");
        }

        if (!response.ok || !result.success) {
            console.error("SNAP AI API error:", {
                status: response.status,
                code: result.code,
                error: result.error
            });
            throw new Error(result.error || "SNAP AI request failed with status " + response.status);
        }

        if (typeof result.message !== "string" || !result.message.trim()) {
            throw new Error("SNAP AI returned an empty response.");
        }

        return result.message.trim();
    } finally {
        window.clearTimeout(timeout);
        externalSignal?.removeEventListener("abort", abortFromExternal);
    }
}

export async function createAIConversation(user, title = "SNAP AI Chat") {
    requireUser(user);
    const conversations = collection(db, "users", user.uid, "aiChats");
    const conversation = await addDoc(conversations, {
        title: title.trim().slice(0, 60) || "SNAP AI Chat",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    });
    setActiveAIConversation(user, conversation.id);
    return conversation.id;
}

export async function saveAIConversationMessage(user, conversationId, role, content) {
    requireUser(user);
    if (!conversationId || !["user", "assistant"].includes(role) ||
        typeof content !== "string" || !content.trim()) {
        throw new Error("A valid SNAP AI conversation message is required.");
    }

    const conversationRef = doc(db, "users", user.uid, "aiChats", conversationId);
    const conversationSnapshot = await getDoc(conversationRef);
    if (!conversationSnapshot.exists()) {
        throw new Error("This SNAP AI conversation is no longer available.");
    }

    const conversationData = conversationSnapshot.data();
    const update = { updatedAt: serverTimestamp() };
    if (role === "user" &&
        ["New chat", "SNAP AI Chat"].includes(conversationData.title)) {
        update.title = content.trim().slice(0, 60) || "SNAP AI Chat";
    }

    const batch = writeBatch(db);
    const messagesRef = collection(conversationRef, "messages");
    batch.set(doc(messagesRef), {
        role,
        content: content.trim(),
        createdAt: serverTimestamp()
    });
    batch.update(conversationRef, update);
    await batch.commit();
    setActiveAIConversation(user, conversationId);
}

export async function loadAIConversationMessages(user, conversationId) {
    requireUser(user);
    const messagesRef = collection(
        db,
        "users",
        user.uid,
        "aiChats",
        conversationId,
        "messages"
    );
    const snapshot = await getDocs(query(messagesRef, orderBy("createdAt", "asc")));
    return snapshot.docs.map(item => {
        const message = item.data();
        return { role: message.role, content: message.content };
    }).filter(message =>
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim()
    );
}

export async function getLatestAIConversationId(user) {
    requireUser(user);
    const conversations = await listAIConversations(user);
    const latest = conversations[0];
    if (!latest) return null;
    setActiveAIConversation(user, latest.id);
    return latest.id;
}

export async function listAIConversations(user) {
    requireUser(user);
    const conversations = await getDocs(
        collection(db, "users", user.uid, "aiChats")
    );
    return conversations.docs.map(item => ({
        id: item.id,
        ...item.data()
    })).sort((left, right) =>
        (right.updatedAt?.toMillis?.() || 0) -
        (left.updatedAt?.toMillis?.() || 0)
    );
}

export function setActiveAIConversation(user, conversationId) {
    if (!user || !conversationId) return;
    try {
        localStorage.setItem("snap-ai-active-chat:" + user.uid, conversationId);
    } catch (error) {
        console.error("Unable to save the active SNAP AI conversation:", error);
    }
}

export function getActiveAIConversationId(user) {
    if (!user) return null;
    try {
        return localStorage.getItem("snap-ai-active-chat:" + user.uid);
    } catch (error) {
        console.error("Unable to read the active SNAP AI conversation:", error);
        return null;
    }
}
