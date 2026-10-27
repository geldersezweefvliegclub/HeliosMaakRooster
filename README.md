# heliosMaakRooster

NestJS background worker (opzet gelijk aan helios2email) die iedere dag om **05:00** controleert of er in Helios voor
iedere dag van het komende jaar een roosterdag bestaat, en ontbrekende dagen aanmaakt.

## Werking

1. Inloggen in Helios.
2. `Rooster/GetObjects` voor vandaag t/m vandaag + 365 dagen (ook de verwijderde roosterdagen).
3. Voor iedere ontbrekende dag wordt een roosterdag aangemaakt via `POST Rooster/SaveObject`. Is de dag eerder verwijderd, dan wordt het record teruggezet (`PATCH Rooster/RestoreObject`) en met `PUT Rooster/SaveObject` op de default waarden gezet.
   De velden worden bepaald met de logica uit PHP `Rooster.AddObject` / `DDWV.dagIsDDWV`:
   - `CLUB_BEDRIJF`: zaterdag/zondag tussen 1 maart en 1 november
   - `WINTER_WERK`: zaterdag buiten deze periode
   - `DDWV`: doordeweeks binnen het DDWV seizoen (`DDWV_START` t/m `DDWV_EIND`)

## Projectstructuur

- `src/helios`: Helios API/login/rooster services.
- `src/rooster`: scheduler, workflow (worker) en builder voor nieuwe roosterdagen.

## Setup

1. Kopieer `.env.example` naar `.env` en vul de waarden in.
2. Kopieer `helios.account.json.example` naar `helios.account.json` en vul de Helios credentials in.
   Het account moet schrijfrechten op het rooster hebben (beheerder / roostermaker).
3. `npm install`

## Draaien

```bash
npm run start:dev      # lokaal
npm run build && npm start
```

Met `ROOSTER_RUN_ON_STARTUP=true` wordt de workflow direct bij opstarten één keer uitgevoerd (handig om te testen).

## Logging

Logging gaat via winston naar de console en, als `LOGGER_SERVER_URL` gezet is, naar Seq (`LOGGER_API_KEY` optioneel).
