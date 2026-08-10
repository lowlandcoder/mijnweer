# Mijn Weer

Een persoonlijke, responsive weerwebsite op basis van browsergeolocatie en de gratis Open-Meteo API. De site gebruikt uitsluitend HTML, CSS en JavaScript en heeft geen buildstap of externe dependencies.

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

Geolocatie werkt alleen via een beveiligde context: HTTPS of `localhost`. Start bijvoorbeeld een lokale server in deze map:

```bash
python -m http.server 8000
```

Open daarna `http://localhost:8000`. Rechtstreeks openen als `file://` kan ertoe leiden dat de browser geen locatietoegang geeft.

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

Configureer vervolgens HTTPS, bijvoorbeeld met Certbot. HTTPS is vereist voor browsergeolocatie op een publieke host.

De site benadert `https://api.open-meteo.com` rechtstreeks vanuit de browser. Er is geen API-sleutel nodig. Bij een strikte Content Security Policy moet `connect-src https://api.open-meteo.com` toegestaan zijn.

## Privacy

De locatie wordt door de browser opgevraagd en alleen gebruikt voor de actuele aanvraag aan Open-Meteo. De website bewaart geen locatiegegevens.

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

## Databron

Weergegevens: [Open-Meteo](https://open-meteo.com/).
