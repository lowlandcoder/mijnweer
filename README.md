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

**Op de telefoon valt de verwachting deels buiten het scherm.** Ververs eerst
met Ctrl+F5 of wis de gegevens van de site; de browser bewaart `style.css` en
`script.js` een tijd in het geheugen. Blijft het staan, controleer dan of
`.verwachting-raster` in `style.css` nog `min-width:0` heeft. Een vaste
minimumbreedte daar dwingt zijwaarts schuiven af.

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

## Weergave op een telefoon

De pagina past zich aan de schermbreedte aan. Er is geen zijwaartse balk en er
hoeft niet geschoven te worden: alle zeven dagen staan naast elkaar in beeld,
ook op een scherm van 360 pixels breed.

Dat werkt zo:

- Het raster van de verwachting heeft geen vaste minimumbreedte meer. De zeven
  kolommen zijn `minmax(0, 1fr)`, zodat een lang bijschrift de rij niet breder
  kan maken dan het scherm.
- De maten van dagnaam, datum, symbool, neerslagbalk, millimeters en windpijl
  staan in `clamp()`. Ze krimpen mee op een smal scherm en houden op een breed
  scherm hun oude formaat.
- De temperatuurlijnen zijn een SVG die meeschaalt met de breedte. Omdat die op
  een telefoon sterk wordt verkleind, staan de lettergrootte, de lijndikte en
  de puntgrootte onder `@media(max-width:720px)` groter ingesteld. Die waarden
  staan in `style.css` en niet meer als attribuut in `script.js`.
- Onder 560 pixels is de witruimte rond de kaarten kleiner, zodat er meer
  ruimte overblijft voor de zeven kolommen.
- De regel met de bijwerktijd breekt af over twee regels in plaats van door te
  lopen buiten het scherm.

Bij het aanpassen van deze onderdelen geldt: controleer op 360 pixels breed of
`document.documentElement.scrollWidth` gelijk is aan `clientWidth`. Wijkt dat
af, dan loopt er iets buiten het scherm.

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
