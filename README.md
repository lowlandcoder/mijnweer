# Mijn Weer

Een persoonlijke, responsive weerwebsite op basis van browsergeolocatie en de gratis Open-Meteo API. De site gebruikt uitsluitend HTML, CSS en JavaScript en heeft geen buildstap of externe dependencies.

## Functies

- Temperatuur en gevoelstemperatuur
- Weersituatie met dynamisch dag-/nachticoon
- Windsnelheid, windrichting en windkracht in Beaufort
- Relatieve luchtvochtigheid en luchtdruk op zeeniveau
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

## Databron

Weergegevens: [Open-Meteo](https://open-meteo.com/).
