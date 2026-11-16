const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,128}$/;
const INVITE_KINDS = new Set(["shared", "direct"]);

export function createInviteError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function normalizeInviteToken(rawToken) {
  if (typeof rawToken !== "string") {
    throw createInviteError(
      "invite-malformed",
      "The invitation token is malformed."
    );
  }

  const token = rawToken.trim();
  if (!INVITE_TOKEN_PATTERN.test(token)) {
    throw createInviteError(
      "invite-malformed",
      "The invitation token is malformed."
    );
  }

  return token;
}

export async function hashInviteToken(rawToken) {
  const token = normalizeInviteToken(rawToken);
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    throw createInviteError(
      "invite-crypto-unavailable",
      "Secure invitation processing is unavailable."
    );
  }

  const digest = await subtle.digest(
    "SHA-256",
    new TextEncoder().encode(token)
  );

  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

export function parseInviteInput(rawInput) {
  if (typeof rawInput !== "string" || !rawInput.trim()) {
    throw createInviteError(
      "invite-malformed",
      "Paste a valid SNAP invitation link or token."
    );
  }

  const input = rawInput.trim();
  if (INVITE_TOKEN_PATTERN.test(input)) {
    return {
      token: input,
      kind: null
    };
  }

  let url;
  try {
    url = new URL(input);
  } catch {
    throw createInviteError(
      "invite-malformed",
      "The invitation link is malformed."
    );
  }

  if (url.protocol === "snap:") {
    if (
      url.hostname.toLowerCase() !== "chat" ||
      url.pathname !== "/join"
    ) {
      throw createInviteError(
        "invite-unsupported",
        "This invitation format is not supported."
      );
    }

    const tokens = url.searchParams.getAll("token");
    const kinds = url.searchParams.getAll("kind");
    const versions = url.searchParams.getAll("v");

    if (
      tokens.length !== 1 ||
      kinds.length !== 1 ||
      versions.length !== 1
    ) {
      throw createInviteError(
        "invite-malformed",
        "The invitation link is missing required information."
      );
    }

    const kind = kinds[0].trim().toLowerCase();
    if (versions[0] !== "1" || !INVITE_KINDS.has(kind)) {
      throw createInviteError(
        "invite-unsupported",
        "This invitation format is not supported."
      );
    }

    return {
      token: normalizeInviteToken(tokens[0]),
      kind
    };
  }

  if (url.protocol === "http:" || url.protocol === "https:") {
    const inviteValues = url.searchParams.getAll("invite");
    const hasTokenParam = url.searchParams.has("token");
    const ambiguous =
      inviteValues.length > 1 ||
      (inviteValues.length === 1 && hasTokenParam);

    if (ambiguous) {
      throw createInviteError(
        "invite-malformed",
        "The invitation link contains ambiguous invitation data."
      );
    }

    if (inviteValues.length === 0) {
      throw createInviteError(
        "invite-unsupported",
        "This invitation format is not supported."
      );
    }

    return {
      token: normalizeInviteToken(inviteValues[0]),
      kind: null
    };
  }

  throw createInviteError(
    "invite-unsupported",
    "This invitation format is not supported."
  );
}
