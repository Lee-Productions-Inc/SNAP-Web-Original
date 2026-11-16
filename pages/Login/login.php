
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Log In | SNAP</title>

    <link
        rel="stylesheet"
        href="../../designs/login designs/login.css?v=20261115-legal-links"
    >

    <link
        rel="stylesheet"
        href="../../designs/settings/theme.css"
    >

    <style>
        /* SHOW PASSWORD */

        .snap-password-toggle-row {
            display: flex;
            justify-content: flex-end;
            margin: -2px 1px 10px;
        }

        .snap-password-toggle {
            width: auto !important;
            min-height: 0 !important;
            padding: 3px 0 !important;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            color: #1f4fc4 !important;
            font: 600 12px Arial, sans-serif;
            cursor: pointer;
        }

        .snap-password-toggle:hover {
            text-decoration: underline;
        }

        .snap-password-toggle:focus-visible {
            outline: 2px solid #4578ed;
            outline-offset: 3px;
        }

        /* LOGIN MESSAGES */

        .snap-login-message {
            margin: 0 0 10px;
            color: #c53e45;
            font-size: 12px;
            line-height: 1.5;
            text-align: left;
        }

        .snap-login-message[hidden] {
            display: none;
        }

        /* LOADING BUTTONS */

        .social-button:disabled,
        .primary-button:disabled {
            opacity: 0.65;
            cursor: wait;
        }

        /* DARK MODE */

        html[data-theme="dark"] .snap-password-toggle {
            color: #9ebcff !important;
        }
    </style>

    <script>
        try {
            document.documentElement.dataset.theme =
                localStorage.getItem("snap-theme") ||
                (
                    matchMedia("(prefers-color-scheme: dark)").matches
                        ? "dark"
                        : "light"
                );
        } catch (error) {
            console.error(
                "Unable to restore SNAP theme:",
                error
            );
        }
    </script>
</head>

<body>

    <main class="login-page">

        <!-- SNAP BRANDING -->

        <section
            class="brand-panel"
            aria-label="SNAP branding"
        >
            <div class="logo-crop">
                <img
                    src="../../assets/logo/Copilot_20260907_145330.png"
                    alt="SNAP"
                >
            </div>
        </section>


        <!-- LOGIN PANEL -->

        <section
            class="login-panel"
            aria-labelledby="welcome-title"
        >

            <header class="welcome-header">

                <h1 id="welcome-title">
                    Welcome to SNAP
                </h1>

                <p>
                    Learn <strong>smarter.</strong>
                    Write <strong>better.</strong>
                </p>

                <br>

            </header>


            <!-- LOGIN CARD -->

            <section
                class="login-card"
                aria-labelledby="login-title"
            >

                <h2 class="login-title">
                    Log In
                </h2>

                <form id="login-form" autocomplete="off">

                    <!-- EMAIL -->

                    <label
                        class="sr-only"
                        for="username"
                    >
                        Email
                    </label>

                    <input
                        type="email"
                        id="username"
                        name="username"
                        placeholder="Email"
                        autocomplete="off"
                        readonly
                        required
                    >


                    <!-- PASSWORD -->

                    <label
                        class="sr-only"
                        for="password"
                    >
                        Password
                    </label>

                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Password"
                        autocomplete="off"
                        readonly
                        required
                    >


                    <!-- SHOW / HIDE PASSWORD -->

                    <div class="snap-password-toggle-row">

                        <button
                            type="button"
                            class="snap-password-toggle"
                            id="toggle-password"
                            aria-controls="password"
                            aria-pressed="false"
                        >
                            Show password
                        </button>

                    </div>


                    <!-- ERROR / STATUS MESSAGE -->

                    <p
                        id="login-message"
                        class="snap-login-message"
                        role="status"
                        aria-live="polite"
                        hidden
                    ></p>


                    <!-- EMAIL LOGIN BUTTON -->

                    <button
                        class="primary-button"
                        type="submit"
                    >
                        Log In
                    </button>


                    <!-- FORGOT PASSWORD -->

                    <a
                        class="forgot-link"
                        href="forgot_password.php"
                    >
                        Forgot Password?
                    </a>


                    <!-- DIVIDER -->

                    <div class="divider">
                        <span>Or continue with</span>
                    </div>


                    <!-- GOOGLE LOGIN -->

                    <button
                        class="social-button"
                        id="google-login-button"
                        type="button"
                    >

                        <span
                            class="google-icon"
                            aria-hidden="true"
                        >
                            G
                        </span>

                        Google

                    </button>


                    <!-- FACEBOOK LOGIN -->

                    <button
                        class="social-button"
                        id="facebook-login-button"
                        type="button"
                    >

                        <span
                            class="facebook-icon"
                            aria-hidden="true"
                        >
                            F
                        </span>

                        Facebook

                    </button>

                </form>


                <!-- SIGN UP -->

                <p class="signup-copy">

                    Don't have an account?

                    <a href="register.php">
                        Sign Up
                    </a>

                </p>

                <nav class="auth-legal-links" aria-label="Legal information">
                    <a href="../legal/terms-privacy.php">Terms &amp; Privacy Policy</a>
                    <a href="../legal/data-deletion.php">Data deletion</a>
                </nav>

            </section>

        </section>

    </main>


    <script>
        const loginCredentialFields = [
            document.getElementById("username"),
            document.getElementById("password")
        ];

        loginCredentialFields.forEach(field => {
            field.value = "";
            field.addEventListener("focus", () => {
                field.readOnly = false;
            });
        });

        window.addEventListener("pageshow", () => {
            loginCredentialFields.forEach(field => {
                field.value = "";
                field.readOnly = true;
            });
        });
    </script>


    <!-- GLOBAL PREFERENCES -->

    <script
        src="../../functions/settings/global_preferences.js"
    ></script>


    <!-- FIREBASE LOGIN -->

    <script
        type="module"
        src="../../functions/login/login.js?v=20261115-facebook-profile-state"
    ></script>

</body>
</html>
