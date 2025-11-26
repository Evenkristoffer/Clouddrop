# Clouddrop - filopplasting
Enkel webapp for opplasting, nedlasting og sletting av filer per bruker. Frontend er statiske HTML/CSS/JS-filer, backend er Node.js/Express med MongoDB som lagrer brukere og metadata for filer.

![UI](https://github.com/Evenkristoffer/Prosjekt_idk/blob/main/media/Untitled.png?raw=true)

## Innhold og funksjoner
- Registrering og innlogging med bcrypt-hash for hashing av passord.
- Opplasting av enkeltfiler via multer; filer lagres per bruker i `uploads/<bruker-sin-epost-adresse>/`.
- Liste over egne filer med lenke til nedlasting. (må legge til autentisering slik at bruker får tilgang til filene sine, siden per nå får den kun "{"error":"Missing user identity"}") - blir fiksa snart....
- Sletting av filer.
- login/registrering og enkel FAQ/ToS/PrivacyPolicy ol.

## Ting brukt
- Node.js + Express (server)
- MongoDB (brukere og metadata for opplastede filer)
- Multer (lagring av filer på disk) + må kanskje bytte til noe annet hvis jeg skal ha mappeopplasting og multi file upload.
- HTML + CSS + JS

## Mappestruktur
- `app.js` - Express-server, API-endepunkter og filopplasting.
- `src/html/` - sider (`index.html`, `login.html`, `register.html`, osv.).
- `src/js/` - frontend-logikk (`script.js` for opplasting, `auth.js` for login og `register.js` for registrering).
- `src/css/style.css` - Ja det er bare css 🤯
- `uploads/` - filer lagres her i mappe som er basert på brukeren sin e-post. Det blir opprettet automatisk når bruker laster opp sin første fil.
- `media/` - bilder i README.

## Op du er lærer eller skal bruke mitt prosjekt
Du må ha Node 18+ installert. + NPM. Og kjørende MongoBD-server som er lokalt eller eksternt. Du må da endre verdier om det er eksternt.

1) Installer alt  
```powershell
npm install
```

2) Start serveren  
```powershell
node app.js
```

API-et vil feile hvis det ikke får kontakt med MongoDB; sjekk at databasen kjører og at `MONGODB_URI` peker riktig. For eksempel vil det bli umulig å logge inn og ut hvis databasen ikke er på.

## Drift og feilsøking
- Upload-katalog opprettes automatisk. Hver bruker får en mappe som er eposten sin.
- Sjekk konsollen når du kjører `node app.js` for å se om serveren stopper eller error koder.

## Sikkerhet
- Autentisering: Per nå kun `x-user-email`-header fra frontend (ingen token/sesjon).
- Passord: Hashes med bcrypt (`BCRYPT_ROUNDS`, default 10). Om du vil ha "bedre" kryptering så øk `BCRYPT_ROUNDS` til et høyere tall enn default.
- Transport: Kjør bak HTTPS i produksjon slik at `x-user-email` og passord ikke går i klartekst.
- Tilgang til filer: Hver forespørsel til filendepunkt må ha korrekt `x-user-email`; uten det returneres 401.
- Opplasting: Multer lagrer på disk under `uploads/<brukers-epost>/`. Ingen server-side filtype/virus-sjekk enda.
- Brute force: Ingen rate limiting/lockout foreløpig.
- Logging: Konsoll-logger inneholder ikke passord, men kan inneholde feilmeldinger med detaljer.

## To Do List
- Rate limiting og filtype/filstørrelse-validering server-side.
- Mulighet for flerfil-opplasting og delbare lenker med tidsbegrensning.
