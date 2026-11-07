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
  passwordSecurityNote.hidden = !isRegistering;
  accountPasswordInput.autocomplete = isRegistering ? "new-password" : "current-password";
  accountSubmitBtn.textContent = isRegistering ? "Create account" : "Sign in";
  passwordResetBtn.hidden = isRegistering;
}

function updateAccountView(user) {
  accountAuthView.hidden = Boolean(user);
  accountProfile.hidden = !user;
  if (user) accountUserEmail.textContent = user.email || "";
  openFeedbackInboxBtn.hidden = !isFeedbackAdmin(user);
  accountSubmitBtn.disabled = !firebaseAuth;
  passwordResetBtn.disabled = !firebaseAuth;
  profilePasswordResetBtn.disabled = !firebaseAuth;
}

function isFeedbackAdmin(user = signedInUser) {
  return user?.email?.toLowerCase() === "gacbartlomiej96@gmail.com" && user.emailVerified;
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
    saveStore();
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
      const storedCloudStore = snapshot.data().store;
      const cloudStore = normalizeStore(storedCloudStore);
      shouldWriteCloud = (Number(storedCloudStore.defaultDecksVersion) || 0) < DEFAULT_DECKS_VERSION;
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
    saveStore();
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
  setAccountStatus("Sending password reset email...");
  try {
    await firebaseAuthApi.sendPasswordResetEmail(firebaseAuth, email);
    setAccountStatus(`If an account exists for ${email}, a password reset link has been sent. Check your inbox and spam folder.`);
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

async function sendFeedback(event) {
  event.preventDefault();
  if (!feedbackForm.reportValidity()) return;
  if (!firebaseDb || !firebaseFirestoreApi) {
    feedbackStatusEl.textContent = "Feedback could not be sent because Firebase is not available. Try again later.";
    return;
  }
  if (!feedbackDescription.value.trim()) {
    feedbackStatusEl.textContent = "Please enter a message before sending.";
    feedbackDescription.focus();
    return;
  }

  feedbackSubmitBtn.disabled = true;
  feedbackStatusEl.textContent = "Sending your feedback...";
  const report = {
    type: feedbackType.value,
    description: feedbackDescription.value.trim(),
    appVersion: document.getElementById("app-version").textContent,
    deckName: activeDeck().name,
    createdAt: firebaseFirestoreApi.serverTimestamp(),
  };
  if (signedInUser?.email) {
    report.userId = signedInUser.uid;
    report.userEmail = signedInUser.email || "";
  }

  try {
    await firebaseFirestoreApi.addDoc(
      firebaseFirestoreApi.collection(firebaseDb, "feedback"),
      report,
    );
    feedbackForm.reset();
    feedbackStatusEl.textContent = "Thank you. Your feedback was sent to the app administrator.";
  } catch (error) {
    feedbackStatusEl.textContent = `Could not send feedback. ${error.message}`;
  } finally {
    feedbackSubmitBtn.disabled = false;
  }
}

async function loadFeedbackInbox() {
  if (!isFeedbackAdmin() || !firebaseDb || !firebaseFirestoreApi) {
    feedbackInboxStatusEl.textContent = "Sign in with the verified administrator account to view feedback.";
    return;
  }

  feedbackInboxStatusEl.textContent = "Loading feedback...";
  feedbackListEl.replaceChildren();
  try {
    await signedInUser.getIdToken(true);
    const { collection, getDocs, limit, orderBy, query } = firebaseFirestoreApi;
    const feedbackQuery = query(collection(firebaseDb, "feedback"), orderBy("createdAt", "desc"), limit(100));
    const snapshot = await getDocs(feedbackQuery);
    if (snapshot.empty) {
      feedbackInboxStatusEl.textContent = "No feedback has been submitted yet.";
      return;
    }

    feedbackInboxStatusEl.textContent = `Showing ${snapshot.size} most recent submission${snapshot.size === 1 ? "" : "s"}.`;
    snapshot.forEach((documentSnapshot) => {
      const report = documentSnapshot.data();
      const item = document.createElement("li");
      item.className = "feedback-item";

      const heading = document.createElement("div");
      heading.className = "feedback-item-heading";
      const type = document.createElement("strong");
      type.textContent = report.type || "Feedback";
      const date = document.createElement("time");
      const submittedAt = report.createdAt?.toDate?.();
      date.textContent = submittedAt ? submittedAt.toLocaleString() : "Date unavailable";
      heading.append(type, date);

      const details = document.createElement("p");
      details.className = "feedback-item-details";
      details.textContent = [
        report.userEmail || "Guest submission",
        report.deckName || "Unknown deck",
        report.appVersion || "Unknown version",
      ].join(" · ");

      const description = document.createElement("p");
      description.className = "feedback-item-description";
      description.textContent = report.description || "";

      const actions = document.createElement("div");
      actions.className = "feedback-item-actions";
      const priorityField = document.createElement("label");
      priorityField.className = "feedback-priority-field";
      priorityField.textContent = "Priority";
      const priority = document.createElement("select");
      priority.setAttribute("aria-label", `Priority for ${report.type || "feedback"}`);
      [
        ["low", "Low"],
        ["normal", "Normal"],
        ["high", "High"],
      ].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        priority.appendChild(option);
      });
      priority.value = ["low", "normal", "high"].includes(report.priority) ? report.priority : "normal";
      priorityField.appendChild(priority);

      const savePriorityButton = document.createElement("button");
      savePriorityButton.type = "button";
      savePriorityButton.className = "btn btn-ghost btn-small";
      savePriorityButton.textContent = "Save priority";
      savePriorityButton.addEventListener("click", () => {
        void updateFeedbackPriority(documentSnapshot.id, priority, savePriorityButton);
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "btn btn-no btn-small";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        void deleteFeedback(documentSnapshot.id, item, deleteButton);
      });

      actions.append(priorityField, savePriorityButton, deleteButton);
      item.append(heading, details, description, actions);
      feedbackListEl.appendChild(item);
    });
  } catch (error) {
    feedbackInboxStatusEl.textContent = error.code === "permission-denied"
      ? "Firestore denied access. Publish the current firestore.rules in Firebase Console, confirm this account's email is verified, then sign out and back in."
      : `Could not load feedback. ${error.message}`;
  }
}

async function updateFeedbackPriority(feedbackId, priority, button) {
  if (!isFeedbackAdmin() || !firebaseFirestoreApi) {
    feedbackInboxStatusEl.textContent = "Only the verified administrator can update feedback.";
    return;
  }

  button.disabled = true;
  try {
    await firebaseFirestoreApi.updateDoc(
      firebaseFirestoreApi.doc(firebaseDb, "feedback", feedbackId),
      { priority: priority.value },
    );
    feedbackInboxStatusEl.textContent = "Feedback priority saved.";
  } catch (error) {
    feedbackInboxStatusEl.textContent = `Could not save priority. ${error.message}`;
  } finally {
    button.disabled = false;
  }
}

async function deleteFeedback(feedbackId, item, button) {
  if (!isFeedbackAdmin() || !firebaseFirestoreApi) {
    feedbackInboxStatusEl.textContent = "Only the verified administrator can delete feedback.";
    return;
  }
  if (!confirm("Permanently delete this feedback? This cannot be undone.")) return;

  button.disabled = true;
  try {
    await firebaseFirestoreApi.deleteDoc(firebaseFirestoreApi.doc(firebaseDb, "feedback", feedbackId));
    item.remove();
    if (!feedbackListEl.children.length) {
      feedbackInboxStatusEl.textContent = "Feedback deleted. Reload the inbox to check for more submissions.";
    } else {
      feedbackInboxStatusEl.textContent = "Feedback deleted.";
    }
  } catch (error) {
    feedbackInboxStatusEl.textContent = `Could not delete feedback. ${error.message}`;
    button.disabled = false;
  }
}
