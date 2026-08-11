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
symbool per dag". Blijkt het symbool alsnog te somber, dan is de drempel van
twee uren neerslag in `dagSymbool()` de plek om aan te draaien.

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
(`hourly=weather_code,is_day`) en wordt het symbool berekend in `dagSymbool()`:

1. Alleen de uren met daglicht tellen mee (`is_day` is 1).
2. Is er in minder dan twee van die uren neerslag, dan wegen die uren niet mee.
   Eén bui geeft een verder zonnige dag dus geen regensymbool.
3. Is er in twee uren of meer neerslag, dan telt juist alleen die neerslag.
4. Uit de overgebleven uren wint de code die het vaakst voorkomt. Bij een gelijk
   aantal wint de zwaarste situatie, volgens de volgorde zon, zon met wolk,
   wolk, mist, regen, sneeuw, onweer.

Ontbreken de uurgegevens, dan valt de pagina terug op `daily.weather_code`.

De WMO-codes worden vertaald in de tabel `weatherCodes` bovenin `script.js`.
Er wordt dus geen bewolkingspercentage gebruikt.

## Databron

Weergegevens: [Open-Meteo](https://open-meteo.com/).
