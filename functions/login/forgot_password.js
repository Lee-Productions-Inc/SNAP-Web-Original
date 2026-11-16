import { auth } from "../firebase/firebase.js";
import {
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

const form = document.getElementById("forgot-form");
const emailInput = document.getElementById("email");
const submitButton = form.querySelector('button[type="submit"]');
const status = document.getElementById("reset-status");

form.addEventListener("submit", async event => {
    event.preventDefault();
    status.hidden = true;
    status.textContent = "";
    status.removeAttribute("data-state");

    if (!form.reportValidity()) return;

    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
        await sendPasswordResetEmail(auth, emailInput.value.trim());
        status.textContent =
            "If an account exists for that email, a password reset email has been sent.";
        status.dataset.state = "success";
        status.hidden = false;
        form.reset();
    } catch (error) {
        console.error("Password reset request failed:", error.code || error.name);

        if (error.code === "auth/invalid-email") {
            status.textContent = "Enter a valid email address.";
        } else if (error.code === "auth/too-many-requests") {
            status.textContent =
                "Too many reset attempts. Please wait before trying again.";
        } else if (error.code === "auth/network-request-failed") {
            status.textContent =
                "Unable to connect. Check your internet connection and try again.";
        } else {
            status.textContent =
                "Unable to send a reset email right now. Please try again later.";
        }

        status.hidden = false;
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Send Reset Link";
    }
});
