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

Choose 10, 20, 50, or all cards per session.

In Settings, choose either 3 study steps (character, pinyin, meaning) or 2 steps (character, then pinyin and meaning together).

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
4. Create a Cloud Firestore database and publish the rules from `firestore.rules`.
5. Add `localhost` and your GitHub Pages host (`gatzky.github.io`) to Authentication's authorized domains.

On first sign-in, existing local decks are merged into the account. If a deck exists in both places, its local card content takes precedence while review statistics are preserved. The Firebase Web config is public; never put service-account credentials in this app. Firestore rules restrict each account to its own data.

The footer displays the app version and last-updated date. Update both in `index.html` when publishing. Increment the final segment of the MAJOR.MINOR.PATCH version for small changes.

## Publish to GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Select **GitHub Actions** as the source.
3. Pushing to `main` triggers the `Deploy GitHub Pages` workflow.

The site URL is `https://gatzky.github.io/chinese_flashcards/`.
