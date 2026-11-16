// ============================================
// SNAP FIREBASE CLOUD MESSAGING
// ============================================

import { app, auth, db } from "./firebase.js";

import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging.js";

import {
    collection,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


// ============================================
// FCM CONFIG
// ============================================

const VAPID_KEY =
    "BG-ovifC-W4Y5yHkLL2yT02lSJKaf1l9dKq0u2dOU_bO49OhnPrxApwG5xaXAA1Wk5BhGZtzDvegMPbMIM_viBM";


// ============================================
// FIREBASE MESSAGING
// ============================================

const messaging =
    getMessaging(app);


// ============================================
// REGISTER SERVICE WORKER
// ============================================

async function registerMessagingServiceWorker() {

    if (!("serviceWorker" in navigator)) {

        console.warn(
            "This browser does not support service workers."
        );

        return null;

    }


    try {

        const registration =
            await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js"
            );

        console.log(
            "SNAP FCM service worker registered:",
            registration
        );

        return registration;

    }
    catch (error) {

        console.error(
            "Unable to register SNAP FCM service worker:",
            error
        );

        return null;

    }

}


// ============================================
// REQUEST NOTIFICATION PERMISSION
// ============================================

async function requestFCMPermission() {

    if (!("Notification" in window)) {

        console.warn(
            "This browser does not support notifications."
        );

        return false;

    }


    if (
        Notification.permission ===
        "granted"
    ) {

        return true;

    }


    if (
        Notification.permission ===
        "denied"
    ) {

        return false;

    }


    try {

        const permission =
            await Notification.requestPermission();

        return (
            permission ===
            "granted"
        );

    }
    catch (error) {

        console.error(
            "Notification permission error:",
            error
        );

        return false;

    }

}


// ============================================
// SAVE FCM TOKEN
// ============================================

async function saveFCMToken(
    token
) {

    if (!auth.currentUser) {

        console.warn(
            "Cannot save FCM token without a logged-in user."
        );

        return false;

    }


    try {

        const tokensCollection =
            collection(
                db,
                "users",
                auth.currentUser.uid,
                "notificationTokens"
            );


        const tokenReference =
            doc(
                tokensCollection,
                token
            );


        await setDoc(
            tokenReference,
            {
                token:
                    token,

                platform:
                    "web",

                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            },
            {
                merge: true
            }
        );


        console.log(
            "SNAP FCM token saved."
        );

        return true;

    }
    catch (error) {

        console.error(
            "Unable to save FCM token:",
            error
        );

        return false;

    }

}


// ============================================
// GET / REGISTER FCM TOKEN
// ============================================

async function registerFCM() {

    if (!auth.currentUser) {

        console.warn(
            "Cannot register FCM without a logged-in user."
        );

        return null;

    }


    const permissionGranted =
        await requestFCMPermission();


    if (!permissionGranted) {

        console.warn(
            "SNAP notification permission was not granted."
        );

        return null;

    }


    const serviceWorkerRegistration =
        await registerMessagingServiceWorker();


    if (!serviceWorkerRegistration) {

        return null;

    }


    try {

        const token =
            await getToken(
                messaging,
                {
                    vapidKey:
                        VAPID_KEY,

                    serviceWorkerRegistration:
                        serviceWorkerRegistration
                }
            );


        if (!token) {

            console.warn(
                "Firebase did not return an FCM token."
            );

            return null;

        }


        await saveFCMToken(
            token
        );


        return token;

    }
    catch (error) {

        console.error(
            "Unable to register FCM:",
            error
        );

        return null;

    }

}


// ============================================
// FOREGROUND MESSAGE
// ============================================

onMessage(
    messaging,
    function (payload) {

        console.log(
            "SNAP foreground FCM message:",
            payload
        );


        const title =
            payload.notification?.title ||
            "SNAP Reminder";


        const body =
            payload.notification?.body ||
            "You have a task reminder.";


        if (
            Notification.permission !==
            "granted"
        ) {

            return;

        }


        const notification =
            new Notification(
                title,
                {
                    body:
                        body,

                    icon:
                        "/assets/logo/Copilot_20260907_145330.png",

                    tag:
                        payload.data?.taskId ||
                        "snap-reminder"
                }
            );


        notification.onclick =
            function () {

                window.focus();

                notification.close();

            };

    }
);


// ============================================
// EXPORT
// ============================================

export {
    registerFCM,
    requestFCMPermission
};