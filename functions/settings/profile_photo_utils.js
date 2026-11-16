export function facebookPhotoSources(photoURL) {
    try {
        const url = new URL(photoURL);
        if (
            url.hostname !== "graph.facebook.com" ||
            !url.pathname.endsWith("/picture")
        ) {
            return null;
        }

        url.searchParams.delete("redirect");
        url.searchParams.set("type", "large");
        const displayURL = url.href;
        url.searchParams.set("redirect", "false");
        return {
            displayURL,
            metadataURL: url.href
        };
    } catch {
        return null;
    }
}

export async function facebookPhotoIsSilhouette(photoURL) {
    const sources = facebookPhotoSources(photoURL);
    if (!sources) return null;

    try {
        const response = await fetch(sources.metadataURL, {
            credentials: "omit",
            signal: AbortSignal.timeout(6000)
        });
        if (!response.ok) return null;

        const result = await response.json();
        return typeof result?.data?.is_silhouette === "boolean"
            ? result.data.is_silhouette
            : null;
    } catch (error) {
        console.warn("Facebook profile-photo status unavailable:", {
            name: error.name || null
        });
        return null;
    }
}

export function getProviderPhotoURL(user) {
    return user?.photoURL ||
        user?.providerData?.find(provider => provider.photoURL)?.photoURL ||
        "";
}

export async function resolveProfilePhotoCandidates(profile, user) {
    const savedPhotoCandidates =
        typeof profile?.photoUrl === "string"
            ? [profile.photoUrl]
            : [profile?.photoURL];
    const candidates = [
        ...savedPhotoCandidates,
        user?.photoURL,
        ...(user?.providerData || []).map(provider => provider.photoURL)
    ];
    const checked = new Set();
    const resolved = [];

    for (const value of candidates) {
        if (typeof value !== "string") continue;
        const photoURL = value.trim();
        if (
            !photoURL ||
            photoURL.length > 4096 ||
            !/^https:\/\//i.test(photoURL) ||
            checked.has(photoURL)
        ) {
            continue;
        }

        checked.add(photoURL);
        if (await facebookPhotoIsSilhouette(photoURL) === true) {
            continue;
        }

        const displayURL =
            facebookPhotoSources(photoURL)?.displayURL || photoURL;
        if (!resolved.includes(displayURL)) {
            resolved.push(displayURL);
        }
    }

    return resolved;
}

export async function resolveProfilePhotoURL(profile, user) {
    return (await resolveProfilePhotoCandidates(profile, user))[0] || "";
}
