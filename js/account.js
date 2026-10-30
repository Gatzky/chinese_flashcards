function setAccountStatus(message) {
  accountStatusEl.textContent = message;
}

function setCloudSyncStatus(message) {
  cloudSyncStatusEl.textContent = message;
}

function updateAccountMode(mode) {
  authMode = mode;
  authModeButtons.forEach((button) => {
    const isActive = button.dataset.authMode === mode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const isRegistering = mode === "register";
  confirmPasswordField.hidden = !isRegistering;
  accountPasswordConfirm.required = isRegistering;
  accountPasswordHint.hidden = !isRegistering;
  accountPasswordInput.autocomplete = isRegistering ? "new-password" : "current-password";
  accountSubmitBtn.textContent = isRegistering ? "Create account" : "Sign in";
  passwordResetBtn.hidden = isRegistering;
}

function updateAccountView(user) {
  accountAuthView.hidden = Boolean(user);
  accountProfile.hidden = !user;
  if (user) accountUserEmail.textContent = user.email || "";
  accountSubmitBtn.disabled = !firebaseAuth;
  passwordResetBtn.disabled = !firebaseAuth;
  profilePasswordResetBtn.disabled = !firebaseAuth;
}

function accountErrorMessage(error) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Password does not meet your Firebase project's password policy. Check the requirements shown above.",
    "auth/too-many-requests": "Too many attempts. Try again later.",
    "auth/network-request-failed": "Network error. Check your connection and try again.",
    "auth/user-disabled": "This account has been disabled.",
  };
  return messages[error.code] || "The account request failed. Check your details and try again.";
}

function accountDocument(userId) {
  return firebaseFirestoreApi.doc(firebaseDb, "users", userId, "appData", "main");
}

async function handleAuthStateChange(user) {
  const changeId = ++authChangeId;
  cloudSyncReady = false;
  signedInUser = user;
  updateAccountView(user);

  if (!user) {
    accountSyncOverlay.hidden = true;
    store = loadStore();
    setCloudSyncStatus("You are using this browser's local decks.");
    startActiveDeck();
    return;
  }

  accountSyncOverlay.hidden = false;
  setCloudSyncStatus("Loading your decks from the cloud...");
  const userStorageKey = `${STORAGE_KEY}:user:${user.uid}`;
  const hadAccountStore = localStorage.getItem(userStorageKey) !== null;
  const hadGuestStore = localStorage.getItem(STORAGE_KEY) !== null;
  store = loadStore(hadAccountStore ? userStorageKey : STORAGE_KEY);

  try {
    const { getDoc, serverTimestamp, setDoc } = firebaseFirestoreApi;
    const reference = accountDocument(user.uid);
    const snapshot = await getDoc(reference);
    if (changeId !== authChangeId) return;

    let shouldWriteCloud = false;
    if (snapshot.exists() && snapshot.data().store) {
      const cloudStore = normalizeStore(snapshot.data().store);
      const hasAccountStoreNow = localStorage.getItem(userStorageKey) !== null;
      if (hadAccountStore || hadGuestStore || hasAccountStoreNow) {
        const localStore = hasAccountStoreNow ? loadStore(userStorageKey) : store;
        store = mergeStores(cloudStore, localStore);
        shouldWriteCloud = true;
      } else {
        store = cloudStore;
      }
    } else {
      shouldWriteCloud = true;
    }

    localStorage.setItem(userStorageKey, JSON.stringify(store));
    if (shouldWriteCloud) {
      await setDoc(reference, { store, updatedAt: serverTimestamp() });
      if (changeId !== authChangeId) return;
    }

    cloudSyncReady = true;
    accountSyncOverlay.hidden = true;
    setCloudSyncStatus(shouldWriteCloud
      ? "Your decks are synced. Local decks were merged into this account."
      : "All decks are synced.");
    startActiveDeck();
  } catch (error) {
    if (changeId !== authChangeId) return;
    accountSyncOverlay.hidden = true;
    setCloudSyncStatus(`Cloud sync is unavailable. Changes are saved on this device. ${error.message}`);
    startActiveDeck();
  }
}

async function initializeFirebase() {
  const config = window.FIREBASE_CONFIG;
  const requiredKeys = ["apiKey", "authDomain", "projectId", "appId"];
  const isConfigured = config && requiredKeys.every((key) => typeof config[key] === "string" && config[key].trim());
  if (!isConfigured) {
    setAccountStatus("Firebase is not configured. Follow the setup steps in README.md to enable accounts. Local mode is ready.");
    return;
  }

  setAccountStatus("Connecting to Firebase...");
  try {
    const sdkBase = "https://www.gstatic.com/firebasejs/13.1.0";
    const [appApi, authApi, firestoreApi] = await Promise.all([
      import(`${sdkBase}/firebase-app.js`),
      import(`${sdkBase}/firebase-auth.js`),
      import(`${sdkBase}/firebase-firestore.js`),
    ]);
    const app = appApi.initializeApp(config);
    firebaseAuthApi = authApi;
    firebaseFirestoreApi = firestoreApi;
    firebaseAuth = authApi.getAuth(app);
    firebaseDb = firestoreApi.getFirestore(app);
    await authApi.setPersistence(firebaseAuth, authApi.browserLocalPersistence);
    accountSubmitBtn.disabled = false;
    passwordResetBtn.disabled = false;
    setAccountStatus("Firebase is ready. Sign in or create an account to sync your decks.");
    authApi.onAuthStateChanged(firebaseAuth, (user) => {
      void handleAuthStateChange(user);
    }, () => {
      setAccountStatus("Could not check the current account. Check your Firebase setup and connection.");
    });
  } catch {
    setAccountStatus("Could not connect to Firebase. Check your configuration and internet connection.");
  }
}

async function submitAccountForm(event) {
  event.preventDefault();
  if (!firebaseAuth || !firebaseAuthApi) return;

  const email = accountEmailInput.value.trim();
  const password = accountPasswordInput.value;
  const isRegistering = authMode === "register";
  if (isRegistering && password !== accountPasswordConfirm.value) {
    setAccountStatus("Passwords do not match.");
    accountPasswordConfirm.focus();
    return;
  }

  accountSubmitBtn.disabled = true;
  setAccountStatus(isRegistering ? "Creating your account..." : "Signing in...");
  try {
    if (isRegistering) {
      const credential = await firebaseAuthApi.createUserWithEmailAndPassword(firebaseAuth, email, password);
      let verificationSent = true;
      try {
        await firebaseAuthApi.sendEmailVerification(credential.user);
      } catch {
        verificationSent = false;
      }
      setAccountStatus(verificationSent
        ? "Account created. Check your email for a verification link."
        : "Account created, but the verification email could not be sent.");
    } else {
      await firebaseAuthApi.signInWithEmailAndPassword(firebaseAuth, email, password);
      setAccountStatus("Signed in.");
    }
  } catch (error) {
    setAccountStatus(accountErrorMessage(error));
  } finally {
    accountSubmitBtn.disabled = !firebaseAuth || Boolean(signedInUser);
  }
}

async function resetAccountPassword() {
  if (!firebaseAuth || !firebaseAuthApi) return;
  const email = signedInUser?.email || accountEmailInput.value.trim();
  if (!email) {
    setAccountStatus("Enter your email address first.");
    accountEmailInput.focus();
    return;
  }
  passwordResetBtn.disabled = true;
  profilePasswordResetBtn.disabled = true;
  try {
    await firebaseAuthApi.sendPasswordResetEmail(firebaseAuth, email);
    setAccountStatus("If an account exists for this address, a password reset email has been sent.");
  } catch (error) {
    setAccountStatus(accountErrorMessage(error));
  } finally {
    passwordResetBtn.disabled = !firebaseAuth || Boolean(signedInUser);
    profilePasswordResetBtn.disabled = !firebaseAuth || !signedInUser;
  }
}

async function signOutAccount() {
  if (!firebaseAuth || !firebaseAuthApi) return;
  try {
    await firebaseAuthApi.signOut(firebaseAuth);
  } catch (error) {
    setCloudSyncStatus(`Could not sign out. ${error.message}`);
  }
}

function sendFeedback(event) {
  event.preventDefault();
  if (!feedbackForm.reportValidity()) return;

  const subject = `[Chinese Flashcards] ${feedbackType.value}`;
  const body = [
    `Type: ${feedbackType.value}`,
    `Deck: ${activeDeck().name}`,
    `${document.getElementById("app-version").textContent}`,
    "",
    feedbackDescription.value.trim(),
  ].join("\n");
  window.location.href = `mailto:gacbartlomiej96@gmail.com?${new URLSearchParams({ subject, body })}`;
  feedbackDialog.close();
  feedbackForm.reset();
}

