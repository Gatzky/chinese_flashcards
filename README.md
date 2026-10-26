# Fiszki chińskie

Prosta strona z fiszkami znaków chińskich. Sesja pokazuje znak, potem pinyin i tłumaczenie, które oceniasz osobno. Opcjonalnie możesz sprawdzić zdanie i znaczenia składowych znaków.

Strona jest statyczna i działa na GitHub Pages. Bazy słówek trzymane są w przeglądarce. Każdą bazę można uzupełnić albo nadpisać plikiem `.json` z tablicą `cards`:

```json
{
	"cards": [
		{
			"hanzi": "马上",
			"pinyin": "mǎshàng",
			"meaning": "zaraz, natychmiast",
			"sentence": "我马上回来。 = Zaraz wrócę.",
			"etymology": "马 (mǎ) = koń; 上 (shàng) = na, powyżej"
		}
	]
}
```

`pinyin`, `sentence` i `etymology` są opcjonalne. Plik `przyklad.json` zawiera większy zestaw demonstracyjny. Starsze pliki z polem `charactersMeaning` są nadal obsługiwane.

Liczbę kart na sesję wybierzesz z listy: 10, 20, 50 lub wszystkie.

W ustawieniach wybierzesz też tryb nauki: 3 etapy (znak, pinyin, tłumaczenie) albo 2 etapy (znak, następnie pinyin i tłumaczenie razem).

## Uruchomienie lokalne

Otwórz `index.html` w przeglądarce albo serwuj folder:

```bash
python -m http.server 8080
```

Wersję i datę ostatniej aktualizacji pokazuje stopka strony. Przy publikacji aktualizuj je w `index.html`; dla kolejnych drobnych zmian zwiększaj ostatni człon wersji MAJOR.MINOR.PATCH.

## Publikacja na GitHub Pages

1. W repozytorium wejdź w **Settings → Pages**.
2. Jako Source wybierz **GitHub Actions**.
3. Po pushu na `main` workflow `Deploy GitHub Pages` opublikuje stronę.

Adres będzie wyglądał tak: `https://gatzky.github.io/chinese_flashcards/`.
