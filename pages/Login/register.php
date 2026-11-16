<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Create Account | SNAP</title>

    <link
        rel="stylesheet"
        href="../../designs/login designs/register.css?v=20261115-register-row2"
    >
    <link rel="stylesheet" href="../../designs/settings/theme.css">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>

</head>


<body>

    <main class="register-page">


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



        <!-- REGISTER PANEL -->

        <section
            class="register-panel"
            aria-labelledby="register-title"
        >


            <header class="register-header">

                <h1 id="register-title">
                    Create Account
                </h1>

                <p>
                    Start planning your success today!
                </p>

            </header>



            <section class="register-card">


                <form id="register-form">


                    <!-- FIRST NAME -->

                    <label
                        class="sr-only"
                        for="first-name"
                    >
                        First name
                    </label>

                    <input
                        type="text"
                        id="first-name"
                        name="first-name"
                        placeholder="First name"
                        autocomplete="given-name"
                        required
                    >



                    <!-- MIDDLE NAME -->

                    <label
                        class="sr-only"
                        for="middle-name"
                    >
                        Middle name or initial
                    </label>

                    <input
                        type="text"
                        id="middle-name"
                        name="middle-name"
                        placeholder="Middle name/initial"
                        autocomplete="additional-name"
                    >



                    <!-- LAST NAME -->

                    <label
                        class="sr-only"
                        for="last-name"
                    >
                        Last name
                    </label>

                    <input
                        type="text"
                        id="last-name"
                        name="last-name"
                        placeholder="Last name"
                        autocomplete="family-name"
                        required
                    >



                    <!-- SUFFIX -->

                    <label
                        class="sr-only"
                        for="suffix"
                    >
                        Suffix
                    </label>

                    <input
                        type="text"
                        id="suffix"
                        name="suffix"
                        placeholder="Suffix (optional)"
                    >


                    <!-- UNIVERSITY -->
                    <div class="university-autocomplete">
                        <label class="sr-only" for="university">University or college</label>

                        <input
                            type="text"
                            id="university"
                            name="university"
                            placeholder="University/College"
                            autocomplete="off"
                            required
                        >

                        <div
                            id="university-suggestions"
                            class="university-suggestions"
                            role="listbox"
                            aria-label="University suggestions"
                        ></div>
                    </div>


                    <!-- EMAIL -->

                    <label
                        class="sr-only"
                        for="email"
                    >
                        Email
                    </label>

                    <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Email/Username"
                        autocomplete="email"
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
                        autocomplete="new-password"
                        required
                    >



                    <!-- CONFIRM PASSWORD -->

                    <label
                        class="sr-only"
                        for="confirm-password"
                    >
                        Confirm password
                    </label>

                    <input
                        type="password"
                        id="confirm-password"
                        name="confirm-password"
                        placeholder="Confirm Password"
                        autocomplete="new-password"
                        required
                    >



                    <!-- TERMS -->

                    <div class="registration-legal-row" data-no-translate>
                        <label
                            class="terms-row"
                            for="terms"
                        >

                            <input
                                type="checkbox"
                                id="terms"
                                name="terms"
                                required
                            >

                            <span>I agree to the <a href="../legal/terms-privacy.php" target="_blank" rel="noopener">Terms &amp; Privacy Policy</a>.</span>

                        </label>

                        <nav class="registration-legal-links" aria-label="Legal policies">
                            <a href="../legal/data-deletion.php">Data deletion</a>
                        </nav>
                    </div>



                    <!-- REGISTER BUTTON -->

                    <button
                        class="register-button"
                        type="submit"
                    >
                        Sign Up
                    </button>


                </form>



                <p class="login-copy">

                    Already have an account?

                    <a href="login.php">
                        Log In
                    </a>

                </p>


            </section>


        </section>


    </main>


    <script
        type="module"
        src="../../functions/register/register.js"
    ></script>

    <script
        src="../../functions/register/university-autocomplete.js"
    ></script>


    <script src="../../functions/settings/global_preferences.js"></script>
</body>

</html>