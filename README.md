# 🇨🇿 Mise 1918

**Interaktivní hra o vzniku Československa 28. října 1918** pro žáky 2. stupně ZŠ.

👉 **Hrát online:** https://eldazaba.github.io/mise-1918/

## O projektu

Mise 1918 provede hráče cestou od atentátu v Sarajevu až ke vzniku samostatného
státu. Místo suchého výkladu čekají mise, mini-hry, sbírání XP a odznaků a na konci
velký kvíz s diplomem.

### Kapitoly

| Kapitola | Obsah |
| --- | --- |
| Zahřívačka | Pravda, nebo mýtus? |
| Svět 1914 | Rakousko-Uhersko a Evropa před válkou |
| Odboj | Domácí i zahraniční odboj, legionáři |
| Cesta | Časová osa od Sarajeva k 28. říjnu |
| Lidé | Masaryk, Beneš, Štefánik, Muži 28. října |
| Den D | Co se stalo 28. října 1918 |
| Nový stát | Jak vypadalo první Československo |
| Kvíz | Finální test a osvědčení o znalosti dějin |

### Funkce

- ⭐ XP body a 🏅 odznaky za splněné úkoly
- 🎮 mini-hry a interaktivní úlohy
- 📜 závěrečný kvíz s diplomem
- 📱 responzivní design pro mobil, tablet i interaktivní tabuli
- ♿ přístupnost (skip-link, ARIA popisky)

## Spuštění

Projekt je čisté HTML, CSS a JavaScript bez buildu.

```bash
git clone https://github.com/EldaZaba/mise-1918.git
cd mise-1918
# otevři index.html v prohlížeči, nebo spusť lokální server:
python -m http.server 8000
```

## Struktura

```
├── index.html          # celá stránka
├── assets/
│   ├── css/style.css   # styly
│   ├── js/data.js      # obsah: otázky, osobnosti, události
│   ├── js/app.js       # logika her, XP a odznaků
│   └── img/            # historické fotografie
└── vendor/             # knihovny třetích stran (GSAP)
```

## Licence

Zdrojový kód je pod licencí [MIT](LICENSE).
Historické fotografie ve složce `assets/img/` jsou volná díla (public domain) a
na knihovny ve složce `vendor/` se vztahují licence jejich autorů.
