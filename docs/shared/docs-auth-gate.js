(function () {
  const APP_ALLOWED_EMAILS = [
    "michael@haderachi.ai",
    "michael@heretic.fund",
    "mariam@heretic.fund",
    "mariam@heretic.ventures",
    "alexmader@gmail.com",
  ];
  const DOCS_ALLOWED_EMAILS = [
    "michael@haderachi.ai",
    "michael@heretic.fund",
    "mariam@heretic.fund",
    "mariam@heretic.ventures",
    "alexmader@gmail.com",
  ];
  const APP_ALLOWED_DOMAINS = ["haderach.ai"];
  const DOCS_ALLOWED_DOMAINS = ["haderach.ai"];

  function normalizeValue(value) {
    return String(value || "").trim().toLowerCase();
  }

  function parseDomain(email) {
    const atIndex = email.lastIndexOf("@");
    if (atIndex < 0 || atIndex === email.length - 1) {
      return "";
    }
    return email.slice(atIndex + 1).toLowerCase();
  }

  function getPolicy(surface) {
    if (surface === "app") {
      return {
        emails: APP_ALLOWED_EMAILS.map(normalizeValue),
        domains: APP_ALLOWED_DOMAINS.map(normalizeValue),
      };
    }
    return {
      emails: DOCS_ALLOWED_EMAILS.map(normalizeValue),
      domains: DOCS_ALLOWED_DOMAINS.map(normalizeValue),
    };
  }

  function isAuthorizedEmail(email, surface) {
    const normalizedEmail = normalizeValue(email);
    if (!normalizedEmail) {
      return false;
    }
    const domain = parseDomain(normalizedEmail);
    if (!domain) {
      return false;
    }
    const policy = getPolicy(surface);
    return policy.emails.includes(normalizedEmail) || policy.domains.includes(domain);
  }

  function getRuntimeConfig() {
    const params = new URLSearchParams(window.location.search);
    const globalConfig = window.__CARD_AUTH_RUNTIME__ || {};

    let discoveredFirebaseConfig = globalConfig.firebase || null;
    if (!discoveredFirebaseConfig) {
      try {
        const raw = window.localStorage.getItem("card.auth.firebaseConfig");
        discoveredFirebaseConfig = raw ? JSON.parse(raw) : null;
      } catch (_error) {
        discoveredFirebaseConfig = null;
      }
    }

    const bypassAuth = globalConfig.bypassAuth === true || params.get("authBypass") === "1";
    if (bypassAuth) {
      return { bypassAuth: true, firebaseConfig: null, configError: null };
    }

    const firebaseConfig = discoveredFirebaseConfig;
    if (!firebaseConfig) {
      return {
        bypassAuth: false,
        firebaseConfig: null,
        configError:
          "Missing Firebase auth config. Please contact your administrator.",
      };
    }

    const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
    const missingKeys = requiredKeys.filter(function (key) {
      return !normalizeValue(firebaseConfig[key]);
    });
    if (missingKeys.length > 0) {
      return {
        bypassAuth: false,
        firebaseConfig: null,
        configError:
          "Missing Firebase auth config keys: " +
          missingKeys.join(", ") +
          ". Please contact your administrator.",
      };
    }

    return {
      bypassAuth: false,
      firebaseConfig: firebaseConfig,
      configError: null,
    };
  }

  async function getFirebaseModules() {
    const appModule = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js"
    );
    const authModule = await import(
      "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js"
    );
    return { appModule, authModule };
  }

  function createDocsAuthGate(options) {
    const surface = options.surface || "docs";
    const docsView = options.docsView;
    const root = options.root;
    const onAuthorized = options.onAuthorized;
    const runtimeConfig = getRuntimeConfig();

    const gateView = document.createElement("section");
    gateView.className = "docs-auth-gate-view";
    root.insertBefore(gateView, docsView);
    docsView.hidden = true;

    let unsubscribeAuth = null;

    function render(cardHtml) {
      gateView.hidden = false;
      gateView.innerHTML = cardHtml;
    }

    function showConfigError(message) {
      render(
        '<div class="docs-auth-gate-card">' +
          "<h2>Sign in required</h2>" +
          "<p>" +
          message +
          "</p>" +
          "<p>Please contact your administrator if you need access.</p>" +
          "</div>"
      );
    }

    function showSignedOut(signInHandler, extraError) {
      render(
        '<div class="docs-auth-gate-card">' +
          "<h2>Sign in required</h2>" +
          "<p>Sign in with your Google account to continue.</p>" +
          "<p>Please contact your administrator if you need access.</p>" +
          (extraError
            ? '<p class="docs-auth-gate-error">Authentication error: ' +
              extraError +
              "</p>"
            : "") +
          '<div class="docs-auth-gate-actions"><button id="docs-auth-sign-in" type="button">Sign in with Google</button></div>' +
          "</div>"
      );
      const signInButton = document.getElementById("docs-auth-sign-in");
      if (signInButton) {
        signInButton.addEventListener("click", signInHandler);
      }
    }

    function showUnauthorized(userEmail, signOutHandler) {
      render(
        '<div class="docs-auth-gate-card">' +
          "<h2>Sign in required</h2>" +
          "<p>You are signed in as <strong>" +
          userEmail +
          "</strong>, but this account is not on the allow list for this surface.</p>" +
          "<p>Please contact your administrator to be added to the list.</p>" +
          '<div class="docs-auth-gate-actions"><button id="docs-auth-sign-out" type="button">Sign out</button></div>' +
          "</div>"
      );
      const signOutButton = document.getElementById("docs-auth-sign-out");
      if (signOutButton) {
        signOutButton.addEventListener("click", signOutHandler);
      }
    }

    function authorizeAndOpen() {
      gateView.hidden = true;
      docsView.hidden = false;
      onAuthorized();
    }

    async function init() {
      if (runtimeConfig.bypassAuth) {
        authorizeAndOpen();
        return;
      }
      if (runtimeConfig.configError) {
        showConfigError(runtimeConfig.configError);
        return;
      }

      const { appModule, authModule } = await getFirebaseModules();
      const firebaseApp =
        appModule.getApps().length > 0
          ? appModule.getApp()
          : appModule.initializeApp(runtimeConfig.firebaseConfig);
      const auth = authModule.getAuth(firebaseApp);
      await authModule.setPersistence(auth, authModule.browserLocalPersistence);
      const provider = new authModule.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      let transientError = "";
      const signIn = async function () {
        transientError = "";
        try {
          await authModule.signInWithPopup(auth, provider);
        } catch (error) {
          transientError = error && error.message ? error.message : "Sign in failed.";
          showSignedOut(signIn, transientError);
        }
      };
      const signOutCurrentUser = async function () {
        await authModule.signOut(auth);
      };

      unsubscribeAuth = authModule.onAuthStateChanged(auth, function (user) {
        if (!user) {
          showSignedOut(signIn, transientError);
          return;
        }
        if (!isAuthorizedEmail(user.email, surface)) {
          showUnauthorized(user.email || "unknown user", signOutCurrentUser);
          return;
        }
        authorizeAndOpen();
      });
    }

    function destroy() {
      if (typeof unsubscribeAuth === "function") {
        unsubscribeAuth();
      }
    }

    return { init, destroy };
  }

  window.createDocsAuthGate = createDocsAuthGate;
})();
