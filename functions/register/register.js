import { auth, db } from "../firebase/firebase.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";


const registerForm = document.getElementById("register-form");

const firstNameInput = document.getElementById("first-name");
const middleNameInput = document.getElementById("middle-name");
const lastNameInput = document.getElementById("last-name");
const suffixInput = document.getElementById("suffix");
const universityInput = document.getElementById("university");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput =
    document.getElementById("confirm-password");

const termsInput = document.getElementById("terms");


registerForm.addEventListener("submit", async (event) => {

    event.preventDefault();


    const firstName = firstNameInput.value.trim();
    const middleName = middleNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const suffix = suffixInput.value.trim();
    const university = universityInput.value.trim();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;


    // -----------------------------
    // Basic validation
    // -----------------------------

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }


    if (!termsInput.checked) {
        alert("Please agree to the Terms & Privacy Policy.");
        return;
    }


    // -----------------------------
    // Create Firebase Auth account
    // -----------------------------

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user = userCredential.user;

        const uid = user.uid;


        // -----------------------------
        // Create display name
        // -----------------------------

        const displayName =
            `${firstName} ${lastName}`.trim();


        // -----------------------------
        // Update Firebase Auth profile
        // -----------------------------

        await updateProfile(user, {
            displayName: displayName
        });
        await user.getIdToken(true);


        // -----------------------------
        // Create Firestore user document
        // -----------------------------

        await setDoc(
            doc(db, "users", uid),
            {
                uid: uid,

                firstName: firstName,
                middleName: middleName,
                lastName: lastName,
                suffix: suffix,

                displayName: displayName,

                university: university,

                email: email,

                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
        );

        try {
            await setDoc(
                doc(db, "publicUsers", uid),
                {
                    displayName: displayName,
                    searchName: displayName.toLowerCase(),
                    updatedAt: serverTimestamp()
                }
            );
        }
        catch (profileError) {
            console.error(
                "Account created, but the SNAP user-search profile could not be saved:",
                profileError
            );
        }


        console.log(
            "SNAP account created successfully:",
            uid
        );


        // -----------------------------
        // Go to Dashboard
        // -----------------------------

        window.location.href =
            "../dashboard/dashboard.php";


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        switch (error.code) {

            case "auth/email-already-in-use":

                alert(
                    "This email is already registered. Please log in instead."
                );

                break;


            case "auth/invalid-email":

                alert(
                    "Please enter a valid email address."
                );

                break;


            case "auth/weak-password":

                alert(
                    "Password is too weak. Please use a stronger password."
                );

                break;


            case "auth/operation-not-allowed":

                alert(
                    "Email and password registration is not enabled in Firebase."
                );

                break;


            default:

                alert(
                    "Registration failed. Please try again."
                );

                console.error(error);

                break;
        }
    }

});