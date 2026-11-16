importScripts(
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.3.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyDcoFVS7iOCqRjLrIye48aF1yC3rsPvzIo",
    authDomain: "snap-c1519.firebaseapp.com",
    projectId: "snap-c1519",
    storageBucket: "snap-c1519.firebasestorage.app",
    messagingSenderId: "521370478287",
    appId: "1:521370478287:web:67dd6cc5365e3a531a79ba",
    measurementId: "G-LFX734CDTD"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(
    function (payload) {
        console.log(
            "[firebase-messaging-sw.js] Background message:",
            payload
        );

        const notificationTitle =
            payload.notification?.title ||
            "SNAP Reminder";

        const notificationOptions = {
            body:
                payload.notification?.body ||
                "You have a task reminder.",
            icon: "/assets/logo.png",
            badge: "/assets/logo.png",
            data: payload.data || {}
        };

        self.registration.showNotification(
            notificationTitle,
            notificationOptions
        );
    }
);

self.addEventListener(
    "notificationclick",
    function (event) {
        event.notification.close();

        event.waitUntil((async function () {
            const fallbackUrl = new URL(
                "/pages/dashboard/dashboard.php",
                self.location.origin
            );
            const notificationData =
                event.notification.data || {};
            const requestedUrl =
                notificationData.url ||
                notificationData.link ||
                notificationData.click_action;
            let targetUrl = fallbackUrl;

            if (typeof requestedUrl === "string") {
                try {
                    const candidate = new URL(
                        requestedUrl,
                        self.location.origin
                    );

                    if (candidate.origin === self.location.origin) {
                        if (
                            candidate.pathname.startsWith("/pages/") &&
                            /\.html$/i.test(candidate.pathname)
                        ) {
                            candidate.pathname =
                                candidate.pathname.replace(
                                    /\.html$/i,
                                    ".php"
                                );
                        }

                        targetUrl = candidate;
                    }
                } catch (error) {
                    console.error(
                        "Could not open the notification destination:",
                        error
                    );
                }
            }

            const clientList = await clients.matchAll({
                type: "window",
                includeUncontrolled: true
            });

            const samePage = clientList.find(
                client =>
                    new URL(client.url).href === targetUrl.href
            );

            if (samePage) {
                return samePage.focus();
            }

            const existingClient = clientList.find(
                client =>
                    new URL(client.url).origin === self.location.origin &&
                    typeof client.navigate === "function"
            );

            if (existingClient) {
                await existingClient.navigate(targetUrl.href);
                return existingClient.focus();
            }

            if (clients.openWindow) {
                return clients.openWindow(targetUrl.href);
            }
        })());
    }
);