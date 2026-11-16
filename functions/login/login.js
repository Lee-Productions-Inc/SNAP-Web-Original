
import { auth, db } from "../firebase/firebase.js";

import {
    doc,
    runTransaction,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

import {
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    FacebookAuthProvider
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";


// ============================================
// HTML ELEMENTS
// ============================================

const loginForm =
    document.getElementById("login-form");

const emailInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const showPasswordButton =
    document.getElementById("toggle-password");

const googleButton =
    document.getElementById("google-login-button");

const facebookButton =
    document.getElementById("facebook-login-button");

const submitButton =
    loginForm.querySelector('button[type="submit"]');

const feedback =
    document.getElementById("login-message");

let isSigningIn = false;


// ============================================
// LOGIN STATUS MESSAGE
// ============================================

function showMessage(text = "") {
    feedback.textContent = text;
    feedback.hidden = !text;
}


// ============================================
// LOADING STATE
// ============================================

function setBusy(busy, method = "") {
    isSigningIn = busy;

    submitButton.disabled = busy;
    googleButton.disabled = busy;
    facebookButton.disabled = busy;

    submitButton.textContent =
        busy && method === "email"
            ? "Signing in..."
            : "Log In";

    googleButton.setAttribute(
        "aria-busy",
        String(busy && method === "Google")
    );

    facebookButton.setAttribute(
        "aria-busy",
        String(busy && method === "Facebook")
    );
}


// ============================================
// FIREBASE ERROR MESSAGES
// ============================================

function readableError(error, method) {

    switch (error?.code) {

        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":

            return `${method} sign-in was cancelled.`;


        case "auth/popup-blocked":

            return (
                "Your browser blocked the login popup. " +
                "Allow popups for SNAP and try again."
            );


        case "auth/unauthorized-domain":

            return (
                "This website is not an authorized Firebase " +
                "sign-in domain. Add your current hostname under " +
                "Firebase Authentication > Settings > Authorized domains."
            );


        case "auth/operation-not-allowed":

            return (
                `${method} sign-in is not enabled. ` +
                "Enable the provider in Firebase Authentication."
            );

        case "auth/invalid-oauth-client-id":

            return (
                "Facebook sign-in is not configured correctly. " +
                "Check the Facebook App ID in Firebase Authentication."
            );


        case "auth/account-exists-with-different-credential":

            return (
                "An account with this email already exists using " +
                "another sign-in method. Sign in using your original " +
                "method to keep your existing SNAP data. " +
                "Account linking must be configured separately."
            );


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":

            return method === "email"
                ? "Incorrect email or password."
                : `${method} could not verify your account.`;


        case "auth/too-many-requests":

            return (
                "Too many sign-in attempts. " +
                "Please try again later."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Check your internet " +
                "connection and try again."
            );


        case "auth/user-disabled":

            return (
                "This SNAP account has been disabled. " +
                "Please contact support."
            );


        case "auth/operation-not-supported-in-this-environment":

            return (
                "Social sign-in requires a supported browser " +
                "using HTTP or HTTPS."
            );


        case "auth/invalid-api-key":
        case "auth/auth-domain-config-required":

            return (
                "Firebase Authentication is not configured correctly. " +
                "Check your Firebase web configuration."
            );


        default:

            return (
                `Unable to sign in with ${method}. ` +
                "Check your Firebase provider settings and try again."
            );
    }
}


// ============================================
// LOGIN SUCCESS
// ============================================

function openDashboard() {
    const pendingLink =
        sessionStorage.getItem(
            "snapChatAfterLogin"
        );

    if (pendingLink) {
        sessionStorage.removeItem(
            "snapChatAfterLogin"
        );

        try {
            const url = new URL(
                pendingLink
            );

            const validPage =
                decodeURIComponent(
                    url.pathname
                ).endsWith(
                    "/pages/dashboard/ai and chat/chats.php"
                );

            if (
                url.origin === location.origin &&
                validPage
            ) {
                location.assign(url.href);
                return;
            }

        } catch (error) {
            console.warn(
                "Invalid chat invitation link:",
                error
            );
        }
    }

    window.location.assign(
        "../dashboard/dashboard.php"
    );
}

async function facebookPhotoIsSilhouette(photoURL) {
    try {
        const url = new URL(photoURL);
        if (
            url.hostname !== "graph.facebook.com" ||
            !url.pathname.endsWith("/picture")
        ) {
            return null;
        }

        url.searchParams.set("type", "large");
        url.searchParams.set("redirect", "false");
        const response = await fetch(url.href, {
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

async function initializeFacebookProfile(user) {
    const facebookProfile = user.providerData?.find(
        provider => provider.providerId === "facebook.com"
    );
    const displayName = String(
        user.displayName || facebookProfile?.displayName || ""
    ).trim();
    const nameParts = displayName.split(/\s+/).filter(Boolean);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.length > 1
        ? nameParts[nameParts.length - 1]
        : "";
    const middleName = nameParts.length > 2
        ? nameParts.slice(1, -1).join(" ")
        : "";
    const email = user.email || facebookProfile?.email || "";
    const photoURL =
        facebookProfile?.photoURL || user.photoURL || "";
    const photoIsSilhouette = photoURL
        ? await facebookPhotoIsSilhouette(photoURL)
        : null;
    const profile = {
        uid: user.uid,
        firstName,
        middleName,
        lastName,
        suffix: "",
        displayName,
        university: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(email ? { email } : {}),
        ...(photoURL && photoIsSilhouette !== true
            ? { photoURL }
            : {})
    };

    const userRef = doc(db, "users", user.uid);
    let transactionPhase = "read";
    try {
        const syncResult = await runTransaction(db, async transaction => {
            transactionPhase = "read";
            const snapshot = await transaction.get(userRef);
            const existing = snapshot.exists() ? snapshot.data() : {};
            const changes = {};
            for (const [field, value] of Object.entries(profile)) {
                if (!Object.prototype.hasOwnProperty.call(existing, field)) {
                    changes[field] = value;
                }
            }
            if (!Object.prototype.hasOwnProperty.call(existing, "createdAt")) {
                changes.createdAt = serverTimestamp();
            }

            const addedFields = Object.keys(changes);
            if (addedFields.length) {
                changes.updatedAt = serverTimestamp();
                transactionPhase = "write";
                transaction.set(userRef, changes, { merge: true });
            }

            return {
                documentExists: snapshot.exists(),
                fieldsPresent: Array.from(new Set([
                    ...Object.keys(existing),
                    ...addedFields
                ])),
                fieldsAdded: addedFields,
                status: !snapshot.exists()
                    ? "created"
                    : addedFields.length
                        ? "filled_missing_fields"
                        : "unchanged",
                uidMatches: !existing.uid || existing.uid === user.uid
            };
        });
        console.info("Facebook SNAP profile sync:", {
            ...syncResult,
            authFields: {
                displayName: Boolean(user.displayName),
                email: Boolean(user.email),
                photoURL: Boolean(user.photoURL)
            },
            facebookProviderFields: {
                displayName: Boolean(facebookProfile?.displayName),
                email: Boolean(facebookProfile?.email),
                photoURL: Boolean(facebookProfile?.photoURL)
            },
            facebookPhotoIsSilhouette: photoIsSilhouette
        });
        return true;
    } catch (error) {
        console.error("Facebook SNAP profile sync failed:", {
            phase: transactionPhase,
            code: error.code || null,
            name: error.name || null,
            authFields: {
                displayName: Boolean(user.displayName),
                email: Boolean(user.email),
                photoURL: Boolean(user.photoURL)
            },
            facebookProviderFields: {
                displayName: Boolean(facebookProfile?.displayName),
                email: Boolean(facebookProfile?.email),
                photoURL: Boolean(facebookProfile?.photoURL)
            },
            facebookPhotoIsSilhouette: photoIsSilhouette
        });
        showMessage(
            error.code === "permission-denied"
                ? `Facebook sign-in succeeded, but Firestore denied the profile ${transactionPhase === "write" ? "update" : "read"} (permission-denied). Your saved account data was not overwritten.`
                : `Facebook sign-in succeeded, but your SNAP profile could not be synchronized${error.code ? ` (${error.code})` : ""}. Please retry or contact support.`
        );
        return false;
    }
}


// ============================================
// SHOW / HIDE PASSWORD
// ============================================

showPasswordButton.addEventListener(
    "click",
    () => {

        const showing =
            passwordInput.type === "password";

        passwordInput.type =
            showing ? "text" : "password";

        showPasswordButton.textContent =
            showing
                ? "Hide password"
                : "Show password";

        showPasswordButton.setAttribute(
            "aria-pressed",
            String(showing)
        );
    }
);


// ============================================
// EMAIL / PASSWORD LOGIN
// ============================================

loginForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        if (isSigningIn) {
            return;
        }

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        if (!email || !password) {
            showMessage(
                "Please enter your email and password."
            );

            return;
        }

        showMessage();

        setBusy(true, "email");

        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            openDashboard();

        } catch (error) {

            console.error(
                "SNAP email sign-in error:",
                error.code || error.name
            );

            showMessage(
                readableError(error, "email")
            );

        } finally {

            setBusy(false);

        }
    }
);


// ============================================
// SOCIAL LOGIN HANDLER
// ============================================

async function socialLogin(provider, name) {

    if (isSigningIn) {
        return;
    }

    showMessage();

    setBusy(true, name);
    let redirecting = false;

    try {

        const credential = await signInWithPopup(
            auth,
            provider
        );

        if (name === "Facebook") {
            console.info("Facebook authentication completed; syncing SNAP profile.");
            if (!(await initializeFacebookProfile(credential.user))) {
                return;
            }
        }

        openDashboard();

    } catch (error) {

        if (error?.code === "auth/popup-blocked") {
            try {
                sessionStorage.setItem(
                    "snapSocialRedirectMethod",
                    name
                );
                redirecting = true;
                await signInWithRedirect(auth, provider);
                return;
            } catch (redirectError) {
                redirecting = false;
                sessionStorage.removeItem(
                    "snapSocialRedirectMethod"
                );
                error = redirectError;
            }
        }

        console.error(
            `SNAP ${name} sign-in error:`,
            error.code || error.name
        );

        showMessage(
            readableError(error, name)
        );

    } finally {

        if (!redirecting) {
            setBusy(false);
        }

    }
}

async function handleSocialRedirectResult() {
    let method = "Social";
    try {
        method =
            sessionStorage.getItem("snapSocialRedirectMethod") ||
            method;
        const result = await getRedirectResult(auth);
        if (result?.user) {
            sessionStorage.removeItem(
                "snapSocialRedirectMethod"
            );
            if (method === "Facebook") {
                console.info("Facebook redirect authentication completed; syncing SNAP profile.");
                if (!(await initializeFacebookProfile(result.user))) {
                    return;
                }
            }
            openDashboard();
        } else {
            sessionStorage.removeItem(
                "snapSocialRedirectMethod"
            );
        }
    } catch (error) {
        sessionStorage.removeItem(
            "snapSocialRedirectMethod"
        );
        console.error(
            `SNAP ${method} redirect sign-in error:`,
            error.code || error.name
        );
        showMessage(readableError(error, method));
    }
}


// ============================================
// GOOGLE LOGIN
// ============================================

googleButton.addEventListener(
    "click",
    () => {

        const provider =
            new GoogleAuthProvider();

        provider.setCustomParameters({
            prompt: "select_account"
        });

        void socialLogin(
            provider,
            "Google"
        );
    }
);


// ============================================
// FACEBOOK LOGIN
// ============================================

facebookButton.addEventListener(
    "click",
    () => {

        const provider =
            new FacebookAuthProvider();

        provider.addScope("email");

        void socialLogin(
            provider,
            "Facebook"
        );
    }
);

void handleSocialRedirectResult();
