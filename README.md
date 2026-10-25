# Fiszki chińskie

Prosta strona z fiszkami znaków chińskich. Sesja pokazuje znak, potem pinyin i tłumaczenie, które oceniasz osobno. Opcjonalnie możesz sprawdzić zdanie i znaczenia składowych znaków.

Strona jest statyczna i działa na GitHub Pages. Bazy słówek trzymane są w przeglądarce. Każdą bazę można uzupełnić albo nadpisać plikiem `.txt`, w którym linie mają format:

```
znak // pinyin // tłumaczenie // [sentence] przykładowe zdanie // [characters meaning] opis znaków
```

Pola `[sentence]` i `[characters meaning]` są opcjonalne. Przykład:

```
马上 // mǎshàng // zaraz, natychmiast // [sentence] 我马上回来。 = Zaraz wrócę. // [characters meaning] 马 (mǎ) = koń; 上 (shàng) = na, powyżej
```

Liczbę kart na sesję wybierzesz z listy (10, 20 lub wszystkie) albo wpiszesz własną dodatnią liczbę.

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
