# Filopplastings-App
Dette prosjektet er en enkel nettside for å laste opp, vise og håndtere filer. Frontend bygges i HTML/CSS/JS (eventuelt TSX hvis jeg får tid), backend i Node.js/Express, og metadata lagres i enten MariaDB eller MongoDB.

## Funksjoner
- Enkel login  
- Opplasting av én eller flere filer  
- Vise liste over filer  
- Last ned fil + del med link  
- Slett fil / slett alt  
- Enkel validering av filtyper og filstørrelse
- Med data logging for å se hvem som lastet opp en spesifik fil, brukes også når brukeren skal se hvilke filer de tidligere har lastet opp. Og for fildeling da man må vite hvem som originalt "eier" filen.

![alt text](https://github.com/Evenkristoffer/Prosjekt_idk/blob/main/media/Untitled.png?raw=true)

## Mappestruktur
src
├── css
├── fonts
├── html
├── media
├── js
└── app.js


## Kompetanse som vises i prosjektet
I denne oppgaven viser jeg **drift** ved å sette opp server, database og filhåndtering.  
Jeg viser **utvikling** ved å bygge API-endepunkter, skrive kode og lage et fungerende grensesnitt/app.  
Jeg viser **brukerstøtte** ved å lage en enkel og brukervennlig løsning med popup-warnings/feilmeldinger og dokumentasjon som forklarer problemer og nødvendige detaljer, som for eksempel passord til database.

### Dokumentasjon

#### Porter
| Port | Brukes av                     |
|------|-------------------------------|
| 3000 | NodeJS til å hoste prosjektet |
| ???? | Mariadb |

#### Brukere / tjenester / Passord
| Tjeneste                 | IP-adresse     | Hostname       | Brukernavn | Passord        |
|--------------------------|----------------|----------------|------------|----------------|
| Rpi / Ubuntu / Home srv  | ?????????????  | ubuntu-server  |    Root    | BadosBados123! |
| MariaDB                  | ?????????????  | mariadb-server |    Root    | BadosBados123! |

