# Chinese Flashcards

An interactive Chinese character flashcard app. A session shows the character, then its pinyin and meaning for separate review. Optional example sentences and character etymologies are available on each card.

The app is static and runs on GitHub Pages. Decks are stored in the browser. Import a `.json` file to add or update matching cards in the selected deck:

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

Open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8080
```

The footer displays the app version and last-updated date. Update both in `index.html` when publishing. Increment the final segment of the MAJOR.MINOR.PATCH version for small changes.

## Publish to GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Select **GitHub Actions** as the source.
3. Pushing to `main` triggers the `Deploy GitHub Pages` workflow.

The site URL is `https://gatzky.github.io/chinese_flashcards/`.
