<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex,nofollow">
    <title>Data Deletion Instructions | SNAP</title>
    <link rel="stylesheet" href="../../designs/legal.css?v=20261115-legal-pages">
    <link rel="stylesheet" href="../../designs/settings/theme.css?v=20261112a">
    <script>
        try {
            document.documentElement.dataset.theme =
                localStorage.getItem("snap-theme") ||
                (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
        } catch (error) {
            console.error("Unable to restore SNAP theme:", error);
        }
    </script>
</head>
<body>
    <main class="legal-page">
        <div class="legal-container">
            <a class="legal-skip-link" href="#deletion-content">Skip to data deletion instructions</a>
            <header class="legal-header">
                <a class="legal-brand" href="../Login/login.php">SNAP</a>
                <nav aria-label="Account navigation">
                    <a href="../Login/login.php">Log in</a>
                    <a href="../Login/register.php">Create account</a>
                </nav>
            </header>

            <article class="legal-document" id="deletion-content">
                <h1>SNAP — Data Deletion Instructions</h1>
                <p class="legal-intro">This public page explains the current status of account deletion and where the team must publish verified request instructions.</p>
                <p class="legal-draft-notice" role="note"><strong>Draft for review:</strong> The account deletion control currently shown in SNAP settings is a front-end confirmation only. It does not delete an account or submit a deletion request. These instructions are not active until the official contact and request-verification process are confirmed.</p>
                <div class="legal-meta">
                    <p><strong>Effective Date:</strong> [Date of publication]</p>
                    <p><strong>Privacy Contact:</strong> [Official privacy support email]</p>
                </div>

                <section class="legal-section" aria-labelledby="deletion-snap-account">
                    <h2 id="deletion-snap-account">Requesting deletion of SNAP data</h2>
                    <p>A working self-service account deletion flow is not currently enabled. The Delete Account confirmation in Account Settings does not remove your account or data.</p>
                    <p>Before these instructions are published as an active request process, the SNAP team must provide:</p>
                    <ul>
                        <li>An official privacy contact or secure request form: [Official privacy support email or request URL].</li>
                        <li>The verified information needed to identify an account and confirm a request: [Document the approved verification steps].</li>
                        <li>How requests are acknowledged, processed, and any information that may need to be retained: [Document the verified process and applicable timeframes].</li>
                    </ul>
                    <p>Do not send your password, authentication codes, or other credentials with a request. Do not rely on this page as confirmation that a request has been submitted or completed.</p>
                </section>

                <section class="legal-section" aria-labelledby="deletion-facebook">
                    <h2 id="deletion-facebook">If you signed in with Facebook</h2>
                    <p>You may separately review or revoke SNAP's access from your Facebook account settings under Apps and Websites; Facebook may change the menu names or steps. Check Facebook's current help instructions before following a specific navigation path.</p>
                    <p>Revoking Facebook access disconnects the sign-in permission. It does not, by itself, delete information already stored in SNAP. Submit a separate data-deletion request through the verified SNAP contact or request route once it is published.</p>
                    <p>If you can no longer sign in after revoking access, use the official SNAP privacy contact listed above and follow the verified identity-check process once available.</p>
                </section>

                <section class="legal-section" aria-labelledby="deletion-external">
                    <h2 id="deletion-external">Files hosted by service providers</h2>
                    <p>Some images, documents, and other uploads may use public Cloudinary URLs. Removing a reference from SNAP does not necessarily delete the hosted file. Any separate provider-side removal process and the status of an individual file must be verified by the SNAP team; this page does not promise that an externally hosted file has been deleted.</p>
                </section>

                <section class="legal-section" aria-labelledby="deletion-policies">
                    <h2 id="deletion-policies">Related policies</h2>
                    <p>Read the <a href="privacy.php">Privacy Policy</a> for information about data handling or the <a href="terms.php">Terms of Service</a>.</p>
                </section>
            </article>

            <footer class="legal-footer">
                <span>SNAP policies</span>
                <nav aria-label="Legal pages">
                    <a href="terms.php">Terms of Service</a>
                    <a href="privacy.php">Privacy Policy</a>
                    <a href="data-deletion.php" aria-current="page">Data deletion</a>
                </nav>
            </footer>
        </div>
    </main>
</body>
</html>
