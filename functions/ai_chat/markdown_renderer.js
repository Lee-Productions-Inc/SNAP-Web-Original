function appendInlineMarkdown(container, source) {
    const pattern = /(\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)|\*\*(.+?)\*\*|__(.+?)__|~~(.+?)~~|`([^`]+)`|\*([^*]+)\*|_([^_]+)_)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(source)) !== null) {
        container.append(document.createTextNode(source.slice(lastIndex, match.index)));

        if (match[2] !== undefined) {
            let url;
            try {
                url = new URL(match[3], window.location.href);
            } catch (error) {
                container.append(document.createTextNode(match[0]));
                lastIndex = pattern.lastIndex;
                continue;
            }

            if (!["http:", "https:", "mailto:"].includes(url.protocol)) {
                container.append(document.createTextNode(match[0]));
                lastIndex = pattern.lastIndex;
                continue;
            }

            const link = document.createElement("a");
            link.href = url.href;
            link.rel = "noopener noreferrer";
            if (url.protocol !== "mailto:") link.target = "_blank";
            link.textContent = match[2];
            if (match[4]) link.title = match[4];
            container.append(link);
        } else {
            const content = match[5] ?? match[6] ?? match[7] ??
                match[8] ?? match[9] ?? match[10];
            const element = document.createElement(
                match[8] !== undefined ? "code" :
                    match[7] !== undefined ? "del" :
                        match[9] !== undefined || match[10] !== undefined ? "em" : "strong"
            );
            element.textContent = content;
            container.append(element);
        }

        lastIndex = pattern.lastIndex;
    }

    container.append(document.createTextNode(source.slice(lastIndex)));
}

function splitTableRow(line) {
    let value = line.trim();
    if (value.startsWith("|")) value = value.slice(1);
    if (value.endsWith("|") && !value.endsWith("\\|")) value = value.slice(0, -1);

    const cells = [];
    let cell = "";
    let escaped = false;
    for (const character of value) {
        if (character === "|" && !escaped) {
            cells.push(cell.trim().replace(/\\\|/g, "|"));
            cell = "";
        } else {
            cell += character;
        }
        escaped = character === "\\" && !escaped;
        if (character !== "\\") escaped = false;
    }
    cells.push(cell.trim().replace(/\\\|/g, "|"));
    return cells;
}

function parseTableAlignment(line) {
    return splitTableRow(line).map(cell => {
        const value = cell.trim();
        if (!/^:?-{3,}:?$/.test(value)) return "left";
        if (value.startsWith(":") && value.endsWith(":")) return "center";
        if (value.endsWith(":")) return "right";
        return "left";
    });
}

function isTableSeparator(line) {
    const cells = splitTableRow(line);
    return cells.length > 0 && cells.every(cell => /^:?-{3,}:?$/.test(cell));
}

function isUnorderedList(line) {
    return /^\s{0,3}[-+*]\s+/.test(line);
}

function isOrderedList(line) {
    return /^\s{0,3}\d+[.)]\s+/.test(line);
}

function appendTable(container, lines, startIndex) {
    const headers = splitTableRow(lines[startIndex]);
    const alignment = parseTableAlignment(lines[startIndex + 1]);
    const wrap = document.createElement("div");
    wrap.className = "ai-markdown-table-wrap";

    const table = document.createElement("table");
    table.className = "ai-markdown-table";
    const head = document.createElement("thead");
    const headerRow = document.createElement("tr");

    headers.forEach((value, index) => {
        const cell = document.createElement("th");
        cell.scope = "col";
        cell.dataset.align = alignment[index] || "left";
        appendInlineMarkdown(cell, value);
        headerRow.append(cell);
    });
    head.append(headerRow);
    table.append(head);

    const body = document.createElement("tbody");
    let index = startIndex + 2;
    while (index < lines.length && lines[index].trim() && lines[index].includes("|")) {
        const values = splitTableRow(lines[index]);
        const row = document.createElement("tr");
        headers.forEach((_, cellIndex) => {
            const cell = document.createElement("td");
            cell.dataset.align = alignment[cellIndex] || "left";
            appendInlineMarkdown(cell, values[cellIndex] || "");
            row.append(cell);
        });
        body.append(row);
        index += 1;
    }
    table.append(body);
    wrap.append(table);
    container.append(wrap);
    return index;
}

function appendList(container, lines, startIndex, ordered) {
    const list = document.createElement(ordered ? "ol" : "ul");
    let index = startIndex;
    const matcher = ordered ? /^\s{0,3}\d+[.)]\s+(.*)$/ : /^\s{0,3}[-+*]\s+(.*)$/;

    while (index < lines.length) {
        const match = lines[index].match(matcher);
        if (!match) break;
        const item = document.createElement("li");
        appendInlineMarkdown(item, match[1]);
        list.append(item);
        index += 1;
    }
    container.append(list);
    return index;
}

function appendCodeBlock(container, lines, startIndex, language) {
    const section = document.createElement("section");
    section.className = "ai-code-block";

    const header = document.createElement("div");
    header.className = "ai-code-header";
    const label = document.createElement("span");
    label.className = "ai-code-language";
    label.textContent = language || "Code";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ai-code-copy";
    copyButton.setAttribute("aria-label", "Copy code");
    copyButton.textContent = "Copy code";

    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = lines.join("\n");
    pre.append(code);
    header.append(label, copyButton);
    section.append(header, pre);
    container.append(section);

    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(code.textContent);
            copyButton.textContent = "Copied";
            window.setTimeout(() => {
                if (copyButton.isConnected) copyButton.textContent = "Copy code";
            }, 1200);
        } catch (error) {
            console.error("Could not copy the code block:", error);
            copyButton.textContent = "Copy unavailable";
        }
    });
    return startIndex;
}

export function renderMarkdown(container, markdown) {
    container.replaceChildren();
    const lines = String(markdown || "")
        .replace(/\r\n?/g, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .split("\n");
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];
        const trimmed = line.trim();
        if (!trimmed) {
            index += 1;
            continue;
        }

        const fence = trimmed.match(/^```([\w.+-]*)\s*$/);
        if (fence) {
            const codeLines = [];
            index += 1;
            while (index < lines.length && !lines[index].trim().startsWith("```")) {
                codeLines.push(lines[index]);
                index += 1;
            }
            if (index < lines.length) index += 1;
            appendCodeBlock(container, codeLines, index, fence[1]);
            continue;
        }

        if (index + 1 < lines.length && trimmed.includes("|") && isTableSeparator(lines[index + 1])) {
            index = appendTable(container, lines, index);
            continue;
        }

        const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
        if (heading) {
            const element = document.createElement(`h${heading[1].length}`);
            element.className = "ai-markdown-heading";
            appendInlineMarkdown(element, heading[2]);
            container.append(element);
            index += 1;
            continue;
        }

        if (isUnorderedList(line) || isOrderedList(line)) {
            index = appendList(container, lines, index, isOrderedList(line));
            continue;
        }

        if (/^\s{0,3}>\s?/.test(line)) {
            const quote = document.createElement("blockquote");
            while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) {
                const paragraph = document.createElement("p");
                appendInlineMarkdown(paragraph, lines[index].replace(/^\s{0,3}>\s?/, ""));
                quote.append(paragraph);
                index += 1;
            }
            container.append(quote);
            continue;
        }

        const paragraph = document.createElement("p");
        while (index < lines.length && lines[index].trim()) {
            if (paragraph.childNodes.length && (
                /^#{1,6}\s/.test(lines[index].trim()) ||
                isUnorderedList(lines[index]) ||
                isOrderedList(lines[index]) ||
                /^\s{0,3}>/.test(lines[index]) ||
                (index + 1 < lines.length && lines[index].includes("|") && isTableSeparator(lines[index + 1]))
            )) break;

            if (paragraph.childNodes.length) paragraph.append(document.createElement("br"));
            appendInlineMarkdown(paragraph, lines[index].trim());
            index += 1;
        }
        if (paragraph.childNodes.length) container.append(paragraph);
    }
}
