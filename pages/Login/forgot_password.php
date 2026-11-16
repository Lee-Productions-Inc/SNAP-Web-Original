<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forgot Password | SNAP</title>
    <link rel="stylesheet" href="../../designs/login designs/forgot_password.css">
    <link rel="stylesheet" href="../../designs/settings/theme.css">
    <script>try{document.documentElement.dataset.theme=localStorage.getItem("snap-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(error){console.error("Unable to restore SNAP theme:",error)}</script>
</head>
<body>
    <main class="forgot-page" aria-label="Forgot password form">
        <section class="forgot-card" aria-labelledby="forgot-title">
            <h1 id="forgot-title">Forgot Password</h1>
            <p class="instruction">Enter your account email address to reset your password.</p>

            <form class="forgot-form" id="forgot-form">
                <label class="sr-only" for="email">Email address</label>
                <input type="email" id="email" name="email" placeholder="Email address" autocomplete="email" required>

                <button class="primary-button" type="submit">Send Reset Link</button>
                <p class="form-status" id="reset-status" role="status" aria-live="polite" hidden></p>
            </form>

            <p class="back-link-row">
                <a href="login.php">Back to Log In</a>
            </p>
        </section>
    </main>
    <script src="../../functions/settings/global_preferences.js"></script>
    <script type="module" src="../../functions/login/forgot_password.js"></script>
</body>
</html>