import { auth, db } from "../firebase/firebase.js";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    writeBatch
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const recentList = document.querySelector("#ai-recent-list");
const recentSidebarList = document.querySelector("#ai-recent-sidebar-list");

let unsubscribeChats = null;

function timestampMillis(timestamp) {
    return timestamp && typeof timestamp.toMillis === "function"
        ? timestamp.toMillis()
        : 0;
}

function updatedLabel(chat) {
    const timestamp = chat.updatedAt || chat.createdAt;
    if (!timestamp || typeof timestamp.toDate !== "function") {
        return "Open conversation";
    }

    return "Updated " + timestamp.toDate().toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

function renderEmptyState(container, message, className) {
    if (!container) {
        return;
    }

    const empty = document.createElement("p");
    empty.className = className;
    empty.textContent = message;
    container.replaceChildren(empty);
}

async function deleteConversation(user, chatId) {
    const conversationReference = doc(
        db,
        "users",
        user.uid,
        "aiChats",
        chatId
    );
    const messagesSnapshot = await getDocs(
        collection(conversationReference, "messages")
    );

    for (let index = 0; index < messagesSnapshot.docs.length; index += 450) {
        const batch = writeBatch(db);
        messagesSnapshot.docs
            .slice(index, index + 450)
            .forEach(message => batch.delete(message.ref));
        await batch.commit();
    }

    await deleteDoc(conversationReference);
}

function createConversationMenu(chat, user) {
    const wrapper = document.createElement("div");
    wrapper.className = "ai-recent-menu";

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "ai-recent-menu-button";
    menuButton.textContent = "•••";
    menuButton.setAttribute("aria-label", "More options for " + chat.title);
    menuButton.setAttribute("aria-haspopup", "true");
    menuButton.setAttribute("aria-expanded", "false");

    const menu = document.createElement("div");
    menu.className = "ai-recent-menu-popover";
    menu.id = "ai-recent-menu-" + encodeURIComponent(chat.id);
    menu.setAttribute("role", "menu");
    menu.hidden = true;
    menuButton.setAttribute("aria-controls", menu.id);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ai-recent-delete";
    deleteButton.setAttribute("role", "menuitem");
    deleteButton.textContent = "Delete conversation";
    deleteButton.addEventListener("click", async function() {
        menu.hidden = true;
        menuButton.setAttribute("aria-expanded", "false");

        if (typeof window.SNAPChatConfirm !== "function") {
            console.error("SNAP confirmation dialog is unavailable.");
            return;
        }

        if (!await window.SNAPChatConfirm(
            "Delete this conversation?",
            `“${chat.title}” and all its messages will be permanently deleted.`,
            { confirmLabel: "Delete conversation", danger: true }
        )) {
            return;
        }

        deleteButton.disabled = true;
        try {
            await deleteConversation(user, chat.id);
        } catch (error) {
            console.error("Could not delete SNAP AI conversation:", error);
            if (typeof window.SNAPChatNotify === "function") {
                window.SNAPChatNotify("The conversation could not be deleted. Please try again.", true);
            }
            deleteButton.disabled = false;
        }
    });

    menu.appendChild(deleteButton);
    menuButton.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        const isOpening = menu.hidden;
        document.querySelectorAll(".ai-recent-menu-popover").forEach(otherMenu => {
            if (otherMenu !== menu) {
                otherMenu.hidden = true;
                otherMenu.parentElement
                    ?.querySelector(".ai-recent-menu-button")
                    ?.setAttribute("aria-expanded", "false");
            }
        });
        menu.hidden = !isOpening;
        menuButton.setAttribute("aria-expanded", String(isOpening));
    });

    wrapper.addEventListener("keydown", function(event) {
        if (event.key === "Escape" && !menu.hidden) {
            menu.hidden = true;
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.focus();
        }
    });

    wrapper.append(menuButton, menu);
    return wrapper;
}

function renderRecentChats(chats, user) {
    [recentList, recentSidebarList].forEach(function(container) {
        if (!container) {
            return;
        }

        if (!chats.length) {
            renderEmptyState(
                container,
                "Start a conversation with your study assistant",
                container === recentList
                    ? "ai-recent-empty"
                    : "recent-chat-empty"
            );
            return;
        }

        const entries = chats.map(function(chat) {
            if (container === recentList) {
                const card = document.createElement("div");
                card.className = "ai-recent-card";

                const link = document.createElement("a");
                link.href = "ai.php?chatId=" + encodeURIComponent(chat.id);
                link.className = "ai-recent-link";
                link.setAttribute(
                    "aria-label",
                    "Open SNAP AI conversation: " + chat.title
                );

                const avatar = document.createElement("span");
                avatar.className = "ai-recent-avatar";
                avatar.textContent = "✦";

                const info = document.createElement("span");
                info.className = "ai-recent-info";

                const title = document.createElement("strong");
                title.textContent = chat.title;

                const detail = document.createElement("span");
                detail.textContent = updatedLabel(chat);
                info.append(title, detail);

                link.append(avatar, info);
                card.append(link, createConversationMenu(chat, user));
                return card;
            }

            const link = document.createElement("a");
            link.href = "ai.php?chatId=" + encodeURIComponent(chat.id);
            link.className = "recent-chat-item";
            link.setAttribute(
                "aria-label",
                "Open SNAP AI conversation: " + chat.title
            );

            const avatar = document.createElement("span");
            avatar.className = "recent-chat-avatar ai-avatar";
            avatar.textContent = "✦";

            const info = document.createElement("span");
            info.className = "recent-chat-info";

            const title = document.createElement("strong");
            title.textContent = chat.title;

            const detail = document.createElement(
                "small"
            );
            detail.textContent = updatedLabel(chat);
            info.append(title, detail);

            const arrow = document.createElement("span");
            arrow.className = "recent-chat-arrow";
            arrow.textContent = "›";

            link.append(avatar, info, arrow);
            return link;
        });

        container.replaceChildren(...entries);
    });
}

function stopRecentListener() {
    if (unsubscribeChats) {
        unsubscribeChats();
        unsubscribeChats = null;
    }
}

document.addEventListener("click", function(event) {
    if (event.target.closest(".ai-recent-menu")) {
        return;
    }

    document.querySelectorAll(".ai-recent-menu-popover:not([hidden])").forEach(menu => {
        menu.hidden = true;
        menu.parentElement
            ?.querySelector(".ai-recent-menu-button")
            ?.setAttribute("aria-expanded", "false");
    });
});

onAuthStateChanged(auth, async function(user) {
    stopRecentListener();

    if (!user) {
        renderEmptyState(
            recentList,
            "Sign in to view your conversations",
            "ai-recent-empty"
        );
        renderEmptyState(
            recentSidebarList,
            "Sign in to view your conversations",
            "recent-chat-empty"
        );
        return;
    }

    renderEmptyState(
        recentList,
        "Loading recent conversations...",
        "ai-recent-empty"
    );
    renderEmptyState(
        recentSidebarList,
        "Loading recent conversations...",
        "recent-chat-empty"
    );

    const chatsReference = collection(
        db,
        "users",
        user.uid,
        "aiChats"
    );

    unsubscribeChats = onSnapshot(
        chatsReference,
        function(snapshot) {
            const chats = snapshot.docs
                .map(function(chatDocument) {
                    const data = chatDocument.data();
                    return {
                        id: chatDocument.id,
                        title: data.title || "SNAP AI Chat",
                        updatedAt: data.updatedAt,
                        createdAt: data.createdAt
                    };
                })
                .sort(function(a, b) {
                    const aTime = timestampMillis(a.updatedAt) ||
                        timestampMillis(a.createdAt);
                    const bTime = timestampMillis(b.updatedAt) ||
                        timestampMillis(b.createdAt);
                    return bTime - aTime;
                });

            renderRecentChats(chats, user);
        },
        function(error) {
            console.error("Could not load recent SNAP AI chats:", error);
            renderEmptyState(
                recentList,
                "Recent conversations could not be loaded",
                "ai-recent-empty"
            );
            renderEmptyState(
                recentSidebarList,
                "Recent conversations could not be loaded",
                "recent-chat-empty"
            );
        }
    );
});

window.addEventListener("pagehide", stopRecentListener);
