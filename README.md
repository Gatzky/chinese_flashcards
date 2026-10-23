# Fiszki chińskie

Prosta strona z fiszkami znaków chińskich. Kliknięcie karty odwraca ją: z przodu znak, z tyłu pinyin i tłumaczenie. Potem oceniasz, czy znasz znak.

Strona jest statyczna i działa na GitHub Pages.

## Uruchomienie lokalne

Otwórz `index.html` w przeglądarce albo serwuj folder:

```bash
python -m http.server 8080
```

## Publikacja na GitHub Pages

1. W repozytorium wejdź w **Settings → Pages**.
2. Jako Source wybierz **GitHub Actions**.
3. Po pushu na `main` workflow `Deploy GitHub Pages` opublikuje stronę.

Adres będzie wyglądał tak: `https://gatzky.github.io/chinese_flashcards/`.
