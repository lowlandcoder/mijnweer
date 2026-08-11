# Mijn Weer

Een persoonlijke weerpagina voor Haarlem op basis van de gratis dienst
Open-Meteo. De site gebruikt uitsluitend HTML, CSS en JavaScript en heeft geen
bouwstap. Alleen Chart.js wordt van een externe plek geladen, voor het
temperatuurverloop.

## Functies

- Temperatuur en gevoelstemperatuur
- Weersituatie met dynamisch dag-/nachticoon
- Windsnelheid, windrichting en windkracht in Beaufort
- Relatieve luchtvochtigheid en luchtdruk op zeeniveau
- Verwachting voor de komende zeven dagen: dag, datum, weersymbool, hoogste en
  laagste temperatuur, neerslag in millimeters en windrichting met windkracht
- Temperatuurverloop van de afgelopen drie dagen
- Tijdstip van de laatste update
- Automatische verversing iedere vijf minuten
- Foutafhandeling voor locatie- en netwerkproblemen

## Lokaal gebruiken

Start een lokale server in deze map en open `http://localhost:8000`:

```bash
python -m http.server 8000
```

## Publiceren met nginx

Kopieer `index.html`, `style.css` en `script.js` naar de documentroot van `mijnweer.lab023.nl`. Een minimale serverconfiguratie is:

```nginx
server {
    listen 80;
    server_name mijnweer.lab023.nl;
    root /var/www/mijnweer;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Configureer vervolgens HTTPS met certbot.

De site benadert `https://api.open-meteo.com` rechtstreeks vanuit de browser. Er is geen API-sleutel nodig. Bij een strikte Content Security Policy moet `connect-src https://api.open-meteo.com` toegestaan zijn.

## Privacy

De pagina vraagt de browser niet om een locatie. De coördinaten van Haarlem
staan vast in de constante `LOCATIE` bovenin `script.js` en gelden voor alle
onderdelen: het actuele weer, de verwachting voor zeven dagen en het
temperatuurverloop. De website bewaart geen gegevens.

## Bij storingen

**De verwachting staat niet in een kaart.** Dan is de regel `.verwachting{...}`
in `style.css` weggevallen. Controleer of het bestand onzichtbare NUL-bytes
bevat; die maken van de eerstvolgende regel een ongeldige selector, waarna de
browser die regel overslaat. Nalopen kan met `file style.css`, dat hoort
`ASCII text` te melden en niet `data`.

**Het symbool klopt niet met wat er buiten te zien is.** Zie het kopje "Het
symbool per dag". De knoppen om aan te draaien zitten allemaal in
`dagVerwachting()`: het aantal uren neerslag in stap 3 en 4, en de grenzen voor
de bewolking in stap 6. De tekst onder het symbool, zichtbaar bij het aanwijzen,
zegt welke uitkomst is gekozen.

## Opbouw van de pagina

De volgorde is vast: het blok met het actuele weer, daarna de verwachting voor
zeven dagen, daarna het temperatuurverloop van de afgelopen drie dagen en
onderaan de details over wind, vochtigheid en luchtdruk.

De verwachting komt uit het onderdeel `daily` van Open-Meteo, met de velden
`weather_code`, `temperature_2m_max`, `temperature_2m_min`, `precipitation_sum`,
`wind_speed_10m_max` en `wind_direction_10m_dominant`. De temperatuurlijnen zijn
een eigen SVG in `script.js`, dus daar is Chart.js niet voor nodig. De windpijl
wijst de kant op waar de wind heen waait; Open-Meteo geeft de richting waar de
wind vandaan komt, dus er wordt 180 graden bij opgeteld.

## Het symbool per dag

Het weersymbool komt niet uit `daily.weather_code`. Dat veld geeft de zwaarste
situatie van het hele etmaal, dus een verder zonnige dag krijgt een wolk of een
bui door een paar uur in de nacht. Daarom worden ook de uurgegevens opgehaald
(`hourly=weather_code,cloud_cover,is_day`). De functie `urenOverdag()` houdt
alleen de uren met daglicht over (`is_day` is 1) en `dagVerwachting()` kiest
daaruit het symbool, in deze volgorde:

| Stap | Regel | Uitkomst |
|---|---|---|
| 1 | onweer in een uur of meer | `sunstorm`, of `storm` bij 80 procent bewolking of meer |
| 2 | sneeuw in twee uren of meer | `sunsnow`, of `snow` bij veel bewolking |
| 3 | neerslag in vier uren of meer, of meer dan 5 mm op de dag | `rain` |
| 4 | neerslag in een tot drie uren | `sunshower`, of `rain` bij veel bewolking |
| 5 | mist in drie uren of meer | `fog` |
| 6 | anders de gemiddelde bewolking overdag | onder 20 procent `sun`, onder 50 `partly`, onder 80 `halfcloud`, daarboven `cloud` |

De grens van 80 procent bewolking bepaalt dus of de zon in het symbool
meekomt. Bij een dichte lucht heeft een zonnetje naast de bui geen zin.

De symbolen worden getekend door `getWeatherIcon()`, uit vaste bouwstenen:

| Soort | Tekening |
|---|---|
| `sun` | zon, of maan buiten de dagperiode |
| `partly` | zon met een kleine wolk |
| `halfcloud` | wolk met de zon er half achter |
| `cloud` | wolk |
| `fog` | drie horizontale strepen |
| `sunshower` | zon, wolk en twee druppels |
| `rain` | wolk met drie druppels |
| `sunstorm` | zon, wolk en bliksem |
| `storm` | wolk met bliksem |
| `sunsnow` | zon, wolk en vlokken |
| `snow` | wolk met vlokken |

Ontbreken de uurgegevens, dan valt de pagina terug op `daily.weather_code` via
de tabel `weatherCodes` bovenin `script.js`. Ontbreekt alleen `cloud_cover`,
dan wordt de bewolking geschat uit de weercodes met `SOORT_BEWOLKING`.

## Databron

Weergegevens: [Open-Meteo](https://open-meteo.com/).
