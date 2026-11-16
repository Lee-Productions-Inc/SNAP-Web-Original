
import {
    doc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_ATTACHMENTS = 15;
const ATTACHMENTS_UNAVAILABLE_MESSAGE =
    "Task attachments are unavailable because the authenticated metadata backend is not configured.";
const DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE =
    "Document attachments are disabled until the authenticated metadata backend explicitly enables public document sharing.";
const PUBLIC_IMAGE_NOTICE =
    "Task images use public Cloudinary URLs. Anyone with an image URL may view it. Do not upload sensitive or confidential images.";
const TASK_IMAGE_API_URL =
    typeof window.SNAP_TASK_ATTACHMENTS_API_URL === "string"
        ? window.SNAP_TASK_ATTACHMENTS_API_URL.trim()
        : "";

const ALLOWED_FILES = new Set([
    "pdf", "txt", "doc", "docx",
    "xls", "xlsx", "ppt", "pptx",
    "csv", "zip"
]);

const ICONS = {
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7h.01"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    paperclip: '<path d="m21 11-8.9 8.9a5 5 0 0 1-7.1-7.1l9.2-9.2a3.5 3.5 0 0 1 5 5l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21M17 3v5M14.5 5.5h5"/>',
    check: '<path d="m5 12 5 5L20 7"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    trash: '<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>'
};

function icon(name, size = 19) {
    return `
        <svg
            width="${size}"
            height="${size}"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
        >
            ${ICONS[name]}
        </svg>
    `;
}

let cloudinaryUploaderPromise = null;
async function uploadCloudinaryAsset(options) {
    cloudinaryUploaderPromise ||= import(
        "../ai_chat/ai_chat/chat_cloudinary_upload.js"
    )
        .then(module => module.uploadCloudinaryAsset)
        .catch(error => {
            cloudinaryUploaderPromise = null;
            throw error;
        });

    return cloudinaryUploaderPromise.then(upload =>
        upload(options)
    );
}

function uploadCloudinaryImage(options) {
    return uploadCloudinaryAsset({
        ...options,
        resourceType: "image"
    });
}

function isPriority(task) {
    return task?.priority === true ||
        task?.isPriority === true ||
        ["high", "urgent", "priority"].includes(
            String(task?.priority ?? "").toLowerCase()
        );
}

function formatDue(task) {
    if (!task?.dueDate) return "Not scheduled";

    const date = new Date(
        `${task.dueDate}T${task.dueTime || "23:59"}:00`
    );

    if (Number.isNaN(date.getTime())) {
        return task.dueDate;
    }

    const dateLabel = date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
    });

    if (!task.dueTime) return dateLabel;

    const timeLabel = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit"
    });

    return `${dateLabel} · ${timeLabel}`;
}

function isOverdue(task) {
    if (!task?.dueDate || task.completed) return false;

    const due = new Date(
        `${task.dueDate}T${task.dueTime || "23:59"}:59.999`
    );

    return due.getTime() < Date.now();
}

function fileType(file) {
    const extension =
        file.name.split(".").pop()?.toLowerCase() || "";

    if (
        file.type.startsWith("image/") &&
        ["png", "jpg", "jpeg", "gif", "webp"].includes(extension)
    ) {
        return "image";
    }

    if (ALLOWED_FILES.has(extension)) {
        return "file";
    }

    return null;
}

function formatFileSize(size) {
    if (!Number.isFinite(Number(size)) || Number(size) < 0) {
        return "Unknown size";
    }

    const bytes = Number(size);
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function taskAttachmentDownloadUrl(attachment) {
    try {
        const url = new URL(attachment.url);
        if (
            attachment.kind === "file" &&
            attachment.storageProvider === "cloudinary" &&
            url.hostname === "res.cloudinary.com"
        ) {
            url.pathname = url.pathname.replace(
                "/raw/upload/",
                "/raw/upload/fl_attachment/"
            );
        }
        return url.href;
    } catch {
        return "";
    }
}

function makeButton(text, className, onClick) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = text;

    button.addEventListener("click", onClick);

    return button;
}

export function setupTaskDetails({
    db,
    getCurrentUser,
    getTask,
    completeTask,
    editTask,
    deleteTask,
    markActive
}) {
    let selectedId = null;
    let busy = false;
    let previousFocus = null;
    let previousOverflow = "";
    let attachmentVersion = 0;
    let pendingAttachment = null;
    let activeAttachmentUpload = null;
    let taskAttachments = [];
    let attachmentServiceReady = false;
    let imageAttachmentsAvailable = false;
    let documentAttachmentsAvailable = false;
    let attachmentLoadError = "";
    const cloudinaryConfig = window.SNAP_CLOUDINARY_CONFIG || {};

    const overlay = document.createElement("div");

    overlay.className = "snap-detail-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
        <section
            class="snap-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="snapDetailHeading"
            tabindex="-1"
        >
            <div class="snap-detail-top">
                <h2 id="snapDetailHeading">Task details</h2>

                <div class="snap-detail-header-actions">
                    <button
                        type="button"
                        class="snap-detail-icon-btn"
                        id="snapDetailMore"
                        aria-label="More task actions"
                        aria-expanded="false"
                    >
                        ${icon("more", 22)}
                    </button>

                    <button
                        type="button"
                        class="snap-detail-icon-btn"
                        id="snapDetailClose"
                        aria-label="Close task details"
                    >
                        ${icon("x", 22)}
                    </button>

                    <div
                        class="snap-detail-menu"
                        id="snapDetailMenu"
                        hidden
                    ></div>
                </div>
            </div>

            <div class="snap-detail-content">
                <div class="snap-detail-labels">
                    <span
                        id="snapDetailCategory"
                        class="snap-detail-category"
                    ></span>

                    <span
                        id="snapDetailStar"
                        class="snap-detail-priority"
                        hidden
                    >★ Priority</span>
                </div>

                <h3
                    class="snap-detail-title"
                    id="snapDetailTitle"
                ></h3>

                <dl class="snap-detail-facts">
                    <div>
                        <dt>
                            ${icon("info")}
                            <span>Status</span>
                        </dt>

                        <dd id="snapDetailStatus"></dd>
                    </div>

                    <div>
                        <dt>
                            ${icon("calendar")}
                            <span>Due</span>
                        </dt>

                        <dd id="snapDetailDue"></dd>
                    </div>

                    <div>
                        <dt>
                            ${icon("bell")}
                            <span>Reminder</span>
                        </dt>

                        <dd id="snapDetailReminder"></dd>
                    </div>
                </dl>

                <section class="snap-detail-section">
                    <h4>Description</h4>

                    <p
                        class="snap-detail-description"
                        id="snapDetailDescription"
                    ></p>
                </section>

                <section class="snap-detail-section">
                    <h4>Attachments</h4>

                    <div class="snap-detail-attach-actions">
                        <button
                            type="button"
                            id="snapDetailImageButton"
                            disabled
                            title="Task image service is not ready."
                        >
                            ${icon("image")}
                            Add image
                        </button>

                        <button
                            type="button"
                            id="snapDetailFileButton"
                            disabled
                            title="Document attachments are not enabled."
                        >
                            ${icon("paperclip")}
                            Attach file
                        </button>
                    </div>

                    <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        id="snapDetailImageInput"
                        hidden
                    >

                    <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip"
                        id="snapDetailFileInput"
                        hidden
                    >

                    <p
                        class="snap-detail-document-notice"
                        id="snapDetailDocumentStatus"
                        role="status"
                        aria-live="polite"
                        hidden
                    ></p>

                    <div
                        class="snap-detail-pending"
                        id="snapDetailPending"
                        hidden
                    ></div>

                    <div
                        class="snap-detail-attachments"
                        id="snapDetailAttachments"
                    ></div>

                    <p class="snap-detail-public-image-notice">
                        ${PUBLIC_IMAGE_NOTICE}
                    </p>

                    <p
                        class="snap-detail-feedback"
                        id="snapDetailFeedback"
                        role="status"
                        aria-live="polite"
                    ></p>
                </section>
            </div>

            <footer class="snap-detail-footer">
                <button
                    type="button"
                    id="snapDetailComplete"
                >
                    ${icon("check", 20)}
                    <span>Complete</span>
                </button>
            </footer>
        </section>
    `;

    document.body.appendChild(overlay);

    const el = id => overlay.querySelector(`#${id}`);

    const removeConfirmOverlay = document.createElement("div");
    removeConfirmOverlay.className = "snap-detail-confirm-overlay";
    removeConfirmOverlay.hidden = true;
    removeConfirmOverlay.innerHTML = `
        <section
            class="snap-detail-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="snapDetailConfirmHeading"
            aria-describedby="snapDetailConfirmDescription"
            tabindex="-1"
        >
            <span class="snap-detail-confirm-icon" aria-hidden="true">
                ${icon("trash", 21)}
            </span>
            <h2 id="snapDetailConfirmHeading">Remove attachment from task?</h2>
            <p id="snapDetailConfirmDescription">
                This removes the task association only. The public Cloudinary
                file remains hosted and may be viewed by anyone with its URL.
            </p>
            <div class="snap-detail-confirm-actions">
                <button type="button" class="snap-detail-confirm-cancel">
                    Cancel
                </button>
                <button type="button" class="snap-detail-confirm-remove">
                    Remove attachment
                </button>
            </div>
        </section>
    `;
    document.body.appendChild(removeConfirmOverlay);

    const removeConfirmCancel = removeConfirmOverlay.querySelector(
        ".snap-detail-confirm-cancel"
    );
    const removeConfirmButton = removeConfirmOverlay.querySelector(
        ".snap-detail-confirm-remove"
    );
    let removeConfirmationResolver = null;
    let removeConfirmationFocus = null;

    const dialog = overlay.querySelector(
        ".snap-detail-dialog"
    );

    const closeButton = el("snapDetailClose");
    const moreButton = el("snapDetailMore");
    const menu = el("snapDetailMenu");
    const completeButton = el("snapDetailComplete");
    const feedback = el("snapDetailFeedback");

    const imageInput = el("snapDetailImageInput");
    const fileInput = el("snapDetailFileInput");
    const pendingContainer = el("snapDetailPending");

    function finishRemoveConfirmation(confirmed) {
        if (!removeConfirmationResolver) return;

        const resolveConfirmation = removeConfirmationResolver;
        removeConfirmationResolver = null;
        removeConfirmOverlay.hidden = true;
        removeConfirmationFocus?.focus?.();
        removeConfirmationFocus = null;
        resolveConfirmation(confirmed);
    }

    function confirmRemoveAttachment(attachment) {
        if (removeConfirmationResolver) return Promise.resolve(false);

        const isImage = attachment.kind !== "file";
        removeConfirmOverlay.querySelector(
            "#snapDetailConfirmHeading"
        ).textContent = isImage
            ? "Remove image from task?"
            : "Remove document from task?";
        removeConfirmOverlay.querySelector(
            "#snapDetailConfirmDescription"
        ).textContent = isImage
            ? "This removes the image association only. The public image will remain hosted on Cloudinary and may still be viewed by anyone with its URL."
            : "This removes the document association only. The public document remains hosted on Cloudinary and may still be accessed by anyone with its URL.";
        removeConfirmButton.textContent = isImage
            ? "Remove image"
            : "Remove document";
        removeConfirmationFocus = document.activeElement;
        removeConfirmOverlay.hidden = false;
        removeConfirmCancel.focus();

        return new Promise(resolve => {
            removeConfirmationResolver = resolve;
        });
    }

    removeConfirmCancel.addEventListener(
        "click",
        () => finishRemoveConfirmation(false)
    );
    removeConfirmButton.addEventListener(
        "click",
        () => finishRemoveConfirmation(true)
    );
    removeConfirmOverlay.addEventListener("click", event => {
        if (event.target === removeConfirmOverlay) {
            finishRemoveConfirmation(false);
        }
    });
    removeConfirmOverlay.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            finishRemoveConfirmation(false);
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = [
            removeConfirmCancel,
            removeConfirmButton
        ];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    function message(value = "", error = false) {
        feedback.textContent = value;
        feedback.classList.toggle("is-error", error);
    }

    function setBusy(value) {
        busy = value;

        completeButton.disabled = value;
        el("snapDetailImageButton").disabled =
            value || !imageAttachmentsAvailable;
        el("snapDetailFileButton").disabled =
            value || !selectedId || !documentAttachmentsAvailable;
        pendingContainer
            .querySelectorAll("button, input")
            .forEach(button => {
                button.disabled =
                    button.classList.contains(
                        "snap-detail-pending-cancel"
                    )
                        ? value &&
                            (
                                pendingAttachment?.uploading !== true ||
                                pendingAttachment?.savingAssociation === true
                            )
                        : value;
            });
        el("snapDetailAttachments")
            .querySelectorAll(".snap-detail-remove")
            .forEach(button => {
                button.disabled = value || !attachmentServiceReady;
            });
    }

    function clearPendingAttachment() {
        if (pendingAttachment?.previewUrl) {
            URL.revokeObjectURL(pendingAttachment.previewUrl);
        }

        pendingAttachment = null;
        pendingContainer.replaceChildren();
        pendingContainer.hidden = true;
    }

    async function requestTaskAttachments(
        taskId,
        method = "GET",
        body,
        attachmentId = ""
    ) {
        const user = getCurrentUser();
        if (!user || typeof user.getIdToken !== "function") {
            throw new Error("Please sign in again.");
        }

        const token = await user.getIdToken();
        const url =
            `${TASK_IMAGE_API_URL}/${encodeURIComponent(taskId)}/attachments` +
            (
                attachmentId
                    ? `/${encodeURIComponent(attachmentId)}`
                    : ""
            );
        let response;
        try {
            response = await fetch(url, {
                method,
                headers: {
                    Authorization: `Bearer ${token}`,
                    ...(body ? { "Content-Type": "application/json" } : {})
                },
                ...(body ? { body: JSON.stringify(body) } : {}),
                signal: AbortSignal.timeout(12_000)
            });
        } catch (error) {
            if (error.name === "TimeoutError") {
                throw new Error(
                    "The task attachment service timed out. Check your connection and retry."
                );
            }
            throw error;
        }

        let result;
        try {
            result = await response.json();
        } catch {
            throw new Error(
                `Task image service returned an unreadable response (HTTP ${response.status}).`
            );
        }

        if (!response.ok || result?.success !== true) {
            const error = new Error(
                result?.error ||
                `Task image service failed with HTTP ${response.status}.`
            );
            error.status = response.status;
            error.code = result?.code;
            throw error;
        }

        return result;
    }

    function showPendingAttachment() {
        pendingContainer.replaceChildren();
        pendingContainer.hidden = !pendingAttachment;

        if (!pendingAttachment) return;

        const {
            file,
            kind,
            previewUrl,
            publicConsent,
            progress,
            uploading
        } = pendingAttachment;
        const card = document.createElement("div");
        card.className = "snap-detail-pending-card";

        const iconBox = document.createElement("span");
        iconBox.className =
            "snap-detail-attachment-icon snap-detail-pending-icon";

        if (kind === "image" && previewUrl) {
            const image = document.createElement("img");
            image.alt = `Preview of ${file.name}`;
            image.src = previewUrl;
            iconBox.replaceChildren(image);
        } else if (kind === "file") {
            const extension =
                file.name.split(".").pop()?.toUpperCase() || "FILE";
            iconBox.textContent = extension.slice(0, 4);
            iconBox.setAttribute("aria-label", `${extension} document`);
        } else {
            iconBox.innerHTML = icon(
                kind === "image" ? "image" : "paperclip",
                19
            );
        }

        const details = document.createElement("div");
        details.className = "snap-detail-pending-details";

        const name = document.createElement("strong");
        name.textContent = file.name;

        const metadata = document.createElement("span");
        const extension = file.name.split(".").pop()?.toUpperCase();
        metadata.textContent =
            uploading
                ? pendingAttachment.savingAssociation
                    ? "Saving association…"
                    : progress == null
                        ? "Uploading…"
                        : `Uploading · ${progress}%`
                : kind === "file"
                    ? `${extension || "FILE"} · ${formatFileSize(file.size)}`
                : `${extension || kind.toUpperCase()} · ${formatFileSize(file.size)}`;

        details.append(name, metadata);
        if (uploading) {
            const progressBar = document.createElement("progress");
            progressBar.max = 100;
            if (progress != null) {
                progressBar.value = progress;
            }
            progressBar.setAttribute(
                "aria-label",
                progress == null
                    ? `${kind === "file" ? "Document" : "Image"} upload in progress`
                    : `${kind === "file" ? "Document" : "Image"} upload progress: ${progress}%`
            );
            details.append(progressBar);
        }

        const actions = document.createElement("div");
        actions.className = "snap-detail-pending-actions";

        if (kind === "image" || kind === "file") {
            const consentLabel = document.createElement("label");
            consentLabel.className = "snap-detail-public-consent";
            const consent = document.createElement("input");
            consent.type = "checkbox";
            consent.checked = publicConsent === true;
            consent.disabled = busy;
            consent.addEventListener("change", () => {
                if (!pendingAttachment) return;
                pendingAttachment.publicConsent = consent.checked;
                attach.disabled =
                    busy ||
                    !attachmentServiceReady ||
                    (kind === "file" && !documentAttachmentsAvailable) ||
                    !consent.checked;
                attach.title = attach.disabled
                    ? `Acknowledge the public ${kind === "file" ? "document" : "image"} notice before uploading.`
                    : "";
            });
            const consentText = document.createElement("span");
            consentText.textContent =
                kind === "file"
                    ? "This file is non-sensitive. I understand anyone with its URL may access it."
                    : "I understand this image is public and may be viewed by anyone with its URL.";
            consentLabel.append(consent, consentText);
            actions.append(consentLabel);
        }

        const attach = makeButton(
            kind === "file"
                ? pendingAttachment.savingAssociation
                    ? "Saving…"
                    : uploading
                        ? "Uploading…"
                        : "Upload file"
                : pendingAttachment.savingAssociation
                    ? "Saving…"
                    : uploading
                    ? "Uploading…"
                    : "Attach image",
            "snap-detail-pending-attach",
            () => void uploadAttachment()
        );
        attach.disabled =
            busy ||
            !attachmentServiceReady ||
            (kind === "file" && !documentAttachmentsAvailable) ||
            !publicConsent;
        attach.title = attach.disabled
            ? kind === "file" && !documentAttachmentsAvailable
                ? DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE
                : !publicConsent
                    ? `Acknowledge the public ${kind === "file" ? "document" : "image"} notice before uploading.`
                    : ATTACHMENTS_UNAVAILABLE_MESSAGE
            : "";
        attach.setAttribute(
            "aria-label",
            kind === "file"
                ? `Upload public document ${file.name}`
                : `Attach public image ${file.name}`
        );
        attach.setAttribute("aria-live", "polite");

        const cancel = makeButton(
            "Cancel",
            "snap-detail-pending-cancel",
            cancelPendingAttachment
        );
        cancel.disabled =
            busy &&
            (
                !uploading ||
                pendingAttachment.savingAssociation === true
            );

        if (kind === "file") {
            const unavailable = document.createElement("span");
            unavailable.className = "snap-detail-document-notice";
            unavailable.textContent =
                "Public link: anyone who has the Cloudinary URL can access this document. Do not upload sensitive or confidential files.";
            actions.append(unavailable);
        }

        actions.append(attach, cancel);
        card.append(iconBox, details, actions);
        pendingContainer.append(card);
    }

    function cancelPendingAttachment() {
        if (
            busy &&
            pendingAttachment?.uploading &&
            !pendingAttachment.savingAssociation
        ) {
            pendingAttachment.cancelled = true;
            activeAttachmentUpload?.abort();
            clearPendingAttachment();
            imageInput.value = "";
            fileInput.value = "";
            message(
                "Upload canceled. If Cloudinary completed just before cancellation, the public file may remain unattached."
            );
            return;
        }
        if (busy) return;

        const uploadedOrphan = Boolean(
            pendingAttachment?.cloudinaryUpload
        );
        clearPendingAttachment();
        imageInput.value = "";
        fileInput.value = "";
        message(
            uploadedOrphan
                ? "The task association was canceled, but the public Cloudinary file remains hosted and unattached."
                : ""
        );
    }

    function selectAttachment(file, expectedKind) {
        if (!file || !selectedId || busy) return;

        const kind = fileType(file);

        if (kind !== expectedKind) {
            message(
                expectedKind === "image"
                    ? "Choose a PNG, JPG, GIF or WebP image."
                    : "Choose a supported PDF, DOC/DOCX, PPT/PPTX, XLS/XLSX, TXT, CSV, or ZIP document.",
                true
            );
            return;
        }

        if (
            kind === "file" &&
            !documentAttachmentsAvailable
        ) {
            message(DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE, true);
            return;
        }

        if (file.size < 1 || file.size > MAX_FILE_SIZE) {
            message(
                file.size > MAX_FILE_SIZE
                    ? "Maximum file size is 10 MB."
                    : "The selected file is empty.",
                true
            );
            return;
        }

        const task = getTask(selectedId);
        if (!task || task.deleted === true) {
            message("This task is no longer available.", true);
            return;
        }

        if (taskAttachments.length >= MAX_ATTACHMENTS) {
            message(
                `Maximum of ${MAX_ATTACHMENTS} attachments per task.`,
                true
            );
            return;
        }

        const duplicate = taskAttachments.some(
            attachment =>
                attachment?.name === file.name &&
                Number(attachment?.sizeBytes) === file.size
        );
        if (duplicate) {
            message("This file is already attached to the task.", true);
            return;
        }

        if (
            pendingAttachment?.cloudinaryUpload &&
            !window.confirm(
                "The previous public upload is not attached yet. Replacing it will leave that file hosted and unattached. Continue?"
            )
        ) return;

        clearPendingAttachment();
        if (!getCurrentUser()?.uid) {
            message("Please sign in again.", true);
            return;
        }

        pendingAttachment = {
            file,
            kind,
            publicConsent: false,
            progress: null,
            uploading: false,
            cancelled: false,
            cloudinaryUpload: null,
            previewUrl: kind === "image"
                ? URL.createObjectURL(file)
                : null
        };

        showPendingAttachment();
    }

    function close() {
        if (busy) return;

        if (
            pendingAttachment?.cloudinaryUpload &&
            !window.confirm(
                "The uploaded public file has not been attached to this task. Closing will leave it hosted and unattached. Continue?"
            )
        ) return;

        clearPendingAttachment();
        overlay.hidden = true;
        selectedId = null;
        attachmentVersion++;
        taskAttachments = [];
        attachmentServiceReady = false;
        imageAttachmentsAvailable = false;
        documentAttachmentsAvailable = false;
        attachmentLoadError = "";
        el("snapDetailImageButton").disabled = true;
        el("snapDetailFileButton").disabled = true;
        el("snapDetailFileButton").title =
            DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;

        menu.hidden = true;

        moreButton.setAttribute(
            "aria-expanded",
            "false"
        );

        document.body.style.overflow = previousOverflow;

        previousFocus?.focus?.();
    }

    function open(taskId) {
        const task = getTask(taskId);

        if (!task || task.deleted === true) return;

        selectedId = taskId;
        previousFocus = document.activeElement;
        previousOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";
        overlay.hidden = false;

        taskAttachments = [];
        attachmentServiceReady = false;
        imageAttachmentsAvailable = false;
        documentAttachmentsAvailable = false;
        attachmentLoadError = "";
        el("snapDetailImageButton").disabled = true;
        el("snapDetailFileButton").disabled = true;
        el("snapDetailFileButton").title =
            DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;
        el("snapDetailDocumentStatus").textContent =
            DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;
        el("snapDetailDocumentStatus").hidden = false;
        message();
        render(task);
        void loadTaskAttachments(taskId);
        dialog.focus();
    }

    function sync() {
        if (overlay.hidden || !selectedId) return;

        const task = getTask(selectedId);

        if (!task || task.deleted === true) {
            if (!busy) close();
            return;
        }

        render(task);
    }

    function taskReference() {
        const user = getCurrentUser();

        if (!user || !selectedId) {
            throw new Error("Please sign in again.");
        }

        return doc(
            db,
            "users",
            user.uid,
            "tasks",
            selectedId
        );
    }

    async function setPriority(taskId, value) {
        const user = getCurrentUser();

        if (!user) {
            throw new Error("You must be signed in.");
        }

        await updateDoc(
            doc(
                db,
                "users",
                user.uid,
                "tasks",
                taskId
            ),
            {
                priority: value,
                isPriority: value,
                updatedAt: serverTimestamp()
            }
        );
    }

    async function togglePriority(taskId) {
        const task = getTask(taskId);

        if (!task || task.deleted === true) return;

        await setPriority(
            taskId,
            !isPriority(task)
        );
    }

    function buildMenu(task) {
        menu.replaceChildren();

        menu.append(
            makeButton(
                isPriority(task)
                    ? "☆ Remove priority"
                    : "★ Mark priority",
                "snap-detail-menu-priority",
                async () => {
                    menu.hidden = true;

                    moreButton.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                    try {
                        await togglePriority(task.id);
                    } catch (error) {
                        message(
                            error.message ||
                            "Cannot update priority.",
                            true
                        );
                    }
                }
            ),

            makeButton(
                "✎ Edit",
                "",
                () => {
                    close();
                    editTask(task.id);
                }
            ),

            makeButton(
                task.completed
                    ? "↶ Mark active"
                    : "✓ Complete",
                "",
                async () => {
                    menu.hidden = true;
                    await finishTask(task);
                }
            ),

            makeButton(
                "Delete",
                "snap-detail-menu-delete",
                () => {
                    close();
                    deleteTask(task.id);
                }
            )
        );
    }

    async function finishTask(task) {
        if (busy) return;

        setBusy(true);
        message();

        try {
            if (task.completed) {
                await markActive(task.id);
            } else {
                await completeTask(task.id);
            }
        } catch (error) {
            message(
                error.message ||
                "Unable to change task status.",
                true
            );
        } finally {
            setBusy(false);
        }
    }

    function render(task) {
        el("snapDetailCategory").textContent =
            task.category || "Task";

        el("snapDetailTitle").textContent =
            task.title || "Untitled task";

        el("snapDetailStar").hidden =
            !isPriority(task);

        const status = task.completed
            ? "Completed"
            : isOverdue(task)
                ? "Overdue"
                : "In Progress";

        const statusNode = el("snapDetailStatus");

        statusNode.textContent = status;

        statusNode.className =
            "snap-detail-status " +
            (
                task.completed
                    ? "done"
                    : isOverdue(task)
                        ? "late"
                        : "active"
            );

        el("snapDetailDue").textContent =
            formatDue(task);

        el("snapDetailReminder").textContent =
            task.reminder
                ? task.reminder + " before"
                : "Off";

        el("snapDetailDescription").textContent =
            task.description?.trim() ||
            "No description";

        completeButton.querySelector("span").textContent =
            task.completed
                ? "Mark active"
                : "Complete";

        completeButton.classList.toggle(
            "is-finished",
            Boolean(task.completed)
        );

        buildMenu(task);
        renderAttachments();
    }

    function renderAttachments() {
        const list = el("snapDetailAttachments");
        list.replaceChildren();

        if (attachmentLoadError) {
            const unavailable = document.createElement("p");
            unavailable.className = "snap-detail-attach-empty";
            unavailable.textContent = attachmentLoadError;
            list.append(unavailable);
            return;
        }

        if (!attachmentServiceReady && !taskAttachments.length) {
            const loading = document.createElement("p");
            loading.className = "snap-detail-attach-empty";
            loading.textContent = "Checking task attachment service…";
            list.append(loading);
            return;
        }

        if (!taskAttachments.length) {
            const empty = document.createElement("p");

            empty.className =
                "snap-detail-attach-empty";

            empty.textContent =
                "No attachments yet.";

            list.append(empty);
            return;
        }

        taskAttachments.forEach(attachment => {
            const row = document.createElement("div");
            row.className =
                "snap-detail-attachment";
            const isDocument = attachment.kind === "file";
            let preview;
            if (isDocument) {
                preview = document.createElement("span");
                preview.className =
                    "snap-detail-attachment-icon snap-detail-document-icon";
                preview.textContent =
                    attachment.name.split(".").pop()?.toUpperCase().slice(0, 4) ||
                    "FILE";
                preview.setAttribute(
                    "aria-label",
                    `${attachment.name.split(".").pop()?.toUpperCase() || "File"} document`
                );
            } else {
                preview = document.createElement("a");
                preview.className =
                    "snap-detail-attachment-icon";
                preview.href = attachment.url;
                preview.target = "_blank";
                preview.rel = "noopener noreferrer";
                preview.referrerPolicy = "no-referrer";
                preview.setAttribute(
                    "aria-label",
                    `Open a larger view of ${attachment.name}`
                );

                const image = document.createElement("img");
                image.alt = `Preview of ${attachment.name}`;
                image.loading = "lazy";
                image.src = attachment.url;
                preview.replaceChildren(image);
            }

            const details = document.createElement("div");
            details.className = "snap-detail-attachment-details";

            const link = document.createElement("a");
            link.textContent = attachment.name;
            link.href = attachment.url;

            link.className =
                "snap-detail-attachment-link";

            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.referrerPolicy = "no-referrer";

            const metadata = document.createElement("span");
            metadata.textContent = isDocument
                ? `Public document · anyone with the URL can access · ${formatFileSize(attachment.sizeBytes)}`
                : `Public image · ${formatFileSize(attachment.sizeBytes)}`;

            details.append(link, metadata);
            const actions = document.createElement("div");
            actions.className = "snap-detail-attachment-actions";

            if (isDocument) {
                const downloadUrl =
                    taskAttachmentDownloadUrl(attachment);
                const download = document.createElement("a");
                download.className =
                    "snap-detail-attachment-download";
                download.textContent = "Download";
                download.href = downloadUrl || attachment.url;
                download.download = attachment.name;
                download.rel = "noopener noreferrer";
                download.referrerPolicy = "no-referrer";
                download.setAttribute(
                    "aria-label",
                    `Download ${attachment.name}`
                );
                actions.append(download);
            }

            const remove = makeButton(
                "×",
                "snap-detail-remove",
                () => void removeAttachment(attachment)
            );
            remove.disabled = busy || !attachmentServiceReady;
            remove.title = isDocument
                ? "Remove this task association only; the public Cloudinary document remains hosted."
                : "Remove this task association only; the public Cloudinary image remains hosted.";

            remove.setAttribute(
                "aria-label",
                `Remove ${attachment.name}`
            );
            actions.append(remove);

            row.append(
                preview,
                details,
                actions
            );

            list.append(row);
        });
    }

    async function loadTaskAttachments(taskId) {
        const version = ++attachmentVersion;
        taskAttachments = [];
        attachmentServiceReady = false;
        imageAttachmentsAvailable = false;
        documentAttachmentsAvailable = false;
        attachmentLoadError = "";
        el("snapDetailImageButton").disabled = true;
        el("snapDetailFileButton").disabled = true;
        el("snapDetailFileButton").title =
            DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;
        el("snapDetailDocumentStatus").textContent =
            DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;
        el("snapDetailDocumentStatus").hidden = false;
        renderAttachments();

        if (!TASK_IMAGE_API_URL) {
            attachmentLoadError = ATTACHMENTS_UNAVAILABLE_MESSAGE;
            renderAttachments();
            message(attachmentLoadError, true);
            return;
        }

        const cloudName = String(cloudinaryConfig.cloudName || "").trim();
        const uploadPreset = String(
            cloudinaryConfig.uploadPreset || ""
        ).trim();
        if (!cloudName || !uploadPreset) {
            attachmentLoadError =
                "Task attachments are unavailable because the Cloudinary configuration is unavailable.";
            renderAttachments();
            message(attachmentLoadError, true);
            return;
        }

        try {
            const result = await requestTaskAttachments(taskId);
            if (
                overlay.hidden ||
                version !== attachmentVersion ||
                selectedId !== taskId
            ) return;

            if (!Array.isArray(result.attachments)) {
                throw new Error(
                    "Task attachment service returned an invalid attachment list."
                );
            }

            taskAttachments = result.attachments.filter(attachment =>
                attachment &&
                typeof attachment.id === "string" &&
                typeof attachment.name === "string" &&
                typeof attachment.url === "string" &&
                attachment.url.startsWith("https://res.cloudinary.com/")
            ).map(attachment => ({
                ...attachment,
                kind: attachment.kind === "file" ? "file" : "image",
                public: true
            }));
            attachmentServiceReady = true;
            imageAttachmentsAvailable =
                result.capabilities?.images !== false;
            documentAttachmentsAvailable =
                result.capabilities?.documents === true;
            el("snapDetailImageButton").disabled =
                !imageAttachmentsAvailable;
            el("snapDetailImageButton").title = "";
            el("snapDetailFileButton").disabled =
                !documentAttachmentsAvailable;
            el("snapDetailFileButton").title =
                documentAttachmentsAvailable
                    ? ""
                    : DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;
            el("snapDetailDocumentStatus").textContent =
                DOCUMENT_ATTACHMENTS_UNAVAILABLE_MESSAGE;
            el("snapDetailDocumentStatus").hidden =
                documentAttachmentsAvailable;
            renderAttachments();
        } catch (error) {
            if (
                overlay.hidden ||
                version !== attachmentVersion ||
                selectedId !== taskId
            ) return;

            attachmentLoadError =
                error.status === 401
                    ? "Please sign in again to load task attachments."
                    : ATTACHMENTS_UNAVAILABLE_MESSAGE;
            renderAttachments();
            message(attachmentLoadError, true);
        }
    }

    async function uploadAttachment() {
        const selected = pendingAttachment;
        const taskId = selectedId;
        const isDocument = selected?.kind === "file";
        if (
            !selected ||
            !selected.publicConsent ||
            !taskId ||
            !attachmentServiceReady ||
            (isDocument
                ? !documentAttachmentsAvailable
                : !imageAttachmentsAvailable) ||
            busy
        ) return;

        setBusy(true);
        selected.uploading = true;
        selected.progress = null;
        showPendingAttachment();
        message(
            `Preparing public ${isDocument ? "document" : "image"} upload…`
        );

        let uploadRequest = null;
        try {
            let upload = selected.cloudinaryUpload;
            if (!upload) {
                const cloudName = String(
                    cloudinaryConfig.cloudName || ""
                ).trim();
                const uploadPreset = String(
                    cloudinaryConfig.uploadPreset || ""
                ).trim();
                if (!cloudName || !uploadPreset) {
                    throw new Error(
                        "Cloudinary upload is not configured."
                    );
                }
                if (!globalThis.crypto?.randomUUID) {
                    throw new Error(
                        "This browser cannot create a safe unique upload ID."
                    );
                }

                const uploadOptions = {
                    file: selected.file,
                    cloudName,
                    uploadPreset,
                    publicId: globalThis.crypto.randomUUID(),
                    onRequest: xhr => {
                        uploadRequest = xhr;
                        activeAttachmentUpload = xhr;
                        return !selected.cancelled;
                    },
                    onProgress: (loaded, total) => {
                        if (pendingAttachment !== selected) return;
                        selected.progress = total
                            ? Math.min(
                                100,
                                Math.floor((loaded / total) * 100)
                            )
                            : null;
                        showPendingAttachment();
                    }
                };
                upload = isDocument
                    ? await uploadCloudinaryAsset({
                        ...uploadOptions,
                        resourceType: "raw"
                    })
                    : await uploadCloudinaryImage(uploadOptions);
                selected.cloudinaryUpload = upload;
            }

            if (selected.cancelled) return;

            selected.savingAssociation = true;
            showPendingAttachment();
            message(
                `Saving the ${isDocument ? "document" : "image"} association to this task…`
            );
            await requestTaskAttachments(taskId, "POST", {
                attachmentKind: selected.kind,
                publicId: upload.publicId,
                url: upload.secureUrl,
                name: selected.file.name,
                mimeType: selected.file.type,
                sizeBytes: upload.bytes || selected.file.size,
                ...(isDocument
                    ? { publicDocumentConsent: true }
                    : { publicImageConsent: true })
            });

            if (selectedId !== taskId || overlay.hidden) return;

            clearPendingAttachment();
            await loadTaskAttachments(taskId);
            if (attachmentServiceReady) {
                message(isDocument
                    ? "Document attached. It is publicly accessible to anyone with its Cloudinary URL."
                    : "Image attached. It is publicly accessible to anyone with its Cloudinary URL."
                );
            } else {
                message(
                    "The attachment was saved to this task, but the list could not be refreshed. Reopen Task Details to reload it.",
                    true
                );
            }
        } catch (error) {
            if (selected.cancelled) return;
            if (pendingAttachment === selected) {
                selected.uploading = false;
                selected.savingAssociation = false;
                showPendingAttachment();
            }

            const uploadedButNotSaved =
                Boolean(selected.cloudinaryUpload);
            const errorDetails = [
                error?.message,
                Number.isInteger(error?.status)
                    ? `HTTP ${error.status}`
                    : "",
                typeof error?.code === "string"
                    ? error.code
                    : ""
            ].filter(Boolean).join(" · ");
            message(
                uploadedButNotSaved
                    ? `Cloudinary uploaded the public ${isDocument ? "document" : "image"}, but the task association was not saved${errorDetails ? ` (${errorDetails})` : ""}. The hosted file remains public; retry to save the association or cancel to leave it unattached.`
                    : errorDetails ||
                        `The ${isDocument ? "document" : "image"} could not be uploaded. Nothing was attached to the task.`,
                true
            );
        } finally {
            if (activeAttachmentUpload === uploadRequest) {
                activeAttachmentUpload = null;
            }
            setBusy(false);
            if (pendingAttachment === selected) {
                showPendingAttachment();
            }
        }
    }

    async function removeAttachment(attachment) {
        if (
            !attachmentServiceReady ||
            !selectedId ||
            busy
        ) return;

        if (!await confirmRemoveAttachment(attachment)) return;

        const taskId = selectedId;
        setBusy(true);
        try {
            await requestTaskAttachments(
                taskId,
                "DELETE",
                undefined,
                attachment.id
            );
            taskAttachments = taskAttachments.filter(
                item => item.id !== attachment.id
            );
            renderAttachments();
            message(
                `Attachment removed from this task. The public Cloudinary ${attachment.kind === "file" ? "document" : "image"} remains hosted.`
            );
        } catch (error) {
            message(
                error.message ||
                    "The image could not be removed from this task.",
                true
            );
        } finally {
            setBusy(false);
        }
    }

    closeButton.addEventListener(
        "click",
        close
    );

    overlay.addEventListener(
        "click",
        event => {
            if (event.target === overlay) {
                close();
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {
            if (overlay.hidden) return;
            if (!removeConfirmOverlay.hidden) return;

            if (event.key === "Escape") {
                event.preventDefault();

                if (menu.hidden) {
                    close();
                } else {
                    menu.hidden = true;
                }
            }

            if (event.key === "Tab") {
                const focusable = [
                    ...dialog.querySelectorAll(
                        'button:not(:disabled):not([hidden]),input:not([hidden]),a[href]'
                    )
                ].filter(
                    element =>
                        element.getClientRects().length
                );

                if (!focusable.length) return;

                const first = focusable[0];
                const last =
                    focusable[focusable.length - 1];

                if (
                    event.shiftKey &&
                    document.activeElement === first
                ) {
                    event.preventDefault();
                    last.focus();
                } else if (
                    !event.shiftKey &&
                    document.activeElement === last
                ) {
                    event.preventDefault();
                    first.focus();
                }
            }
        }
    );

    moreButton.addEventListener(
        "click",
        () => {
            menu.hidden = !menu.hidden;

            moreButton.setAttribute(
                "aria-expanded",
                String(!menu.hidden)
            );
        }
    );

    completeButton.addEventListener(
        "click",
        () => {
            const task = getTask(selectedId);

            if (task) {
                void finishTask(task);
            }
        }
    );

    el("snapDetailImageButton").addEventListener(
        "click",
        () => imageInput.click()
    );

    el("snapDetailFileButton").addEventListener(
        "click",
        () => fileInput.click()
    );

    imageInput.addEventListener(
        "change",
        () => {
            selectAttachment(imageInput.files?.[0], "image");
            imageInput.value = "";
        }
    );

    fileInput.addEventListener(
        "change",
        () => {
            selectAttachment(fileInput.files?.[0], "file");
            fileInput.value = "";
        }
    );

    return {
        open,
        close,
        sync,
        togglePriority,
        isPriority
    };
}
