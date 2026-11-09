# Chinese Flashcards

An interactive Chinese character flashcard app. A session shows the character, then its pinyin and meaning for separate review. Optional example sentences and character etymologies are available on each card.

The app is static and runs on GitHub Pages. Decks are stored in the browser. Import a `.json` file into a new deck or add/update matching cards in an existing deck. The import dialog previews valid and skipped entries before saving. You can rename decks and export any deck to JSON:

```json
{
	"cards": [
		{
			"hanzi": "马上",
			"pinyin": "mǎshàng",
			"meaning": "in a moment, immediately",
			"sentence": "我马上回来。 = I'll be right back.",
			"etymology": "马 (mǎ) = horse; 上 (shàng) = up, above"
		}
	]
}
```

`pinyin`, `sentence`, and `etymology` are optional. The `example.json` file contains a larger demo deck with two-character words. Older files using `charactersMeaning` are still supported.

Choose a card count, **All**, **Unseen only**, or **Needs practice** for a study session. **Needs practice** includes cards marked **Not sure** or **No idea**. **Unseen only** and **Needs practice** can be enabled together; the session then includes cards matching either filter. The selection applies to the current deck or to **All decks**.
Choose **All decks** in the vocabulary library to study every unique word across your decks. Progress is saved to each deck containing that word. The existing **Know it** and **Don't know** buttons adjust a card's progress score by +1 or -1 per answer, including the separate pinyin and meaning answers in 3-step mode. New cards start as **Unseen** at score 0. Scores +1 to +2 are **Know it**, +3 to +4 are **Perfect**, -1 to -2 are **Not sure**, and -3 to -4 are **No idea**. A first correct answer on an unseen card gives it score +1; three consecutive correct answers reach **Perfect**, while three consecutive incorrect answers reach **No idea**. Reversing an answer moves the score back by one. Cards are still queued from unseen and lowest progress upward.
Use **Previous card (undo answers)** to return to the last card and remove its answers from the session and its progress scores.

New users start with HSK 1, HSK 2, and HSK 3 decks based on HSK 2.0. The decks contain 150, 147, and 298 unique cards, respectively; repeated entries with the same Chinese word are combined, and the levels do not overlap. Each deck is stored in its own file: `data/hsk1.json`, `data/hsk2.json`, and `data/hsk3.json`. Cards, including single-character entries, include example sentences and character etymology notes when source data is available. Existing users' HSK decks are upgraded once, preserving review statistics for matching words and any custom words. Dataset attribution and licenses are in `data/HSK-DATA-LICENSE.txt` and `data/MAKE-ME-A-HANZI-LICENSE.txt`.

In Settings, choose either 3 study steps (character, pinyin, meaning) or 2 steps (character, then pinyin and meaning together) using the mode buttons.

Choose Dark mode or Light mode in Settings. Auto-play pronunciation and theme preferences are saved with the current browser or account's study settings.

Choose the elegant black or light color theme in Settings. The selection is saved with the current browser or account's study settings.

## Run Locally

Serve the folder locally (needed for Firebase authentication):

```bash
python -m http.server 8080
```

The app shell is `index.html`. Each tab's markup lives in `views/`, while shared setup and tab behavior are split across `js/` files and loaded by `app.js`.

## Firebase Accounts

Accounts use Firebase Authentication with email and password. Signed-in users' decks are synced to Cloud Firestore; local browser data is kept separately for guest use.

1. Create a Firebase project and register a Web app.
2. Copy the Web app config into `firebase-config.js`.
3. In Authentication, enable the Email/Password provider.
4. Create a Cloud Firestore database. In Firebase Console → Firestore Database → Rules, publish the rules from `firestore.rules`. GitHub Pages deployment does not publish Firestore rules.
5. Add `localhost` and your GitHub Pages host (`gatzky.github.io`) to Authentication's authorized domains.

On first sign-in, existing local decks are merged into the account. If a deck exists in both places, its local card content takes precedence while review statistics are preserved. The Firebase Web config is public; never put service-account credentials in this app. Firestore rules restrict each account to its own data.

Bug reports and feedback are submitted to the Firestore `feedback` collection. Apply the rules in `firestore.rules` to allow submissions while restricting feedback reads, priority changes, and deletion to the verified Firebase account `gacbartlomiej96@gmail.com`. In the **Feedback inbox**, the administrator can set each submission's priority to low, normal, or high and delete it. The inbox shows the 100 most recent submissions. Guests can submit feedback; because Firestore rules do not rate-limit writes, enable Firebase App Check before wider public use.

The footer displays the app version. Update it in `index.html` when publishing. Increment the final segment of the MAJOR.MINOR.PATCH version for small changes.

## Publish to GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Select **GitHub Actions** as the source.
3. Pushing to `main` triggers the `Deploy GitHub Pages` workflow in `.github/workflows/`. It publishes the repository root, including the `views/` and `js/` directories required at runtime.

The site URL is `https://gatzky.github.io/chinese_flashcards/`.
