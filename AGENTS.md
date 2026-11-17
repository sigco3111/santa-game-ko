# Santa Game – instruksjoner til implementeringstråden

## Formål

Dette prosjektet skal bli et lite spill. Brukeren vil beskrive selve spillet i en
egen implementeringstråd. Følg den beskrivelsen for spillinnhold og utforming.

Brukeren har bedt om at det ferdige spillet pushes til GitHub og skal kunne
kjøres derfra. Leveransen skal derfor omfatte både kildekoden og en offentlig
lenke der spillet kan spilles i nettleseren via GitHub Pages.

## Repository

- Offentlig repo: https://github.com/thestringtheories/Santa-Game
- Git-remote: `origin` → `https://github.com/thestringtheories/Santa-Game.git`
- Standardgren: `main`.
- Ved opprettelsen inneholder repoet bare README, `.gitignore` og disse
  instruksjonene. Spillteknologi og spillmekanikk er ikke valgt ennå.

## Krav til implementeringen

1. Lag et nettleserspill som kan publiseres som statiske filer på GitHub Pages.
   Spilleren skal kunne åpne en lenke og spille uten lokal installasjon eller
   en utviklingsserver som kjører på brukerens maskin.
2. Velg et enkelt, egnet teknisk oppsett. Et eventuelt byggesteg må produsere
   HTML, CSS, JavaScript og nødvendige spillressurser som Pages kan servere.
   Dersom nye spillkrav trenger en backend, avklar hvordan det skal løses før
   du innfører en slik avhengighet.
3. Sørg for at ressurslenker og eventuell navigasjon fungerer under
   `/Santa-Game/`, ikke bare på roten av en lokal server. Forventet Pages-adresse
   er `https://thestringtheories.github.io/Santa-Game/`; bekreft den faktiske
   adressen ved publisering.
4. Sett opp GitHub Pages og publisering fra repoet. Bruk en GitHub Actions-
   arbeidsflyt dersom spillet har et byggesteg. Ved et rent statisk oppsett kan
   publisering fra en gren brukes. Oppdateringer på `main` skal publiseres
   automatisk etter valgt oppsett.

## Før leveransen regnes som ferdig

- Kjør relevante kontroller og et eventuelt produksjonsbygg. Test spillets
  hovedforløp i nettleseren.
- Commit og push ferdig kildekode, spillressurser og publiseringsoppsett til
  dette repoets `main`. Brukerens bestilling omfatter denne publiseringen.
  Bevar eventuelle andre, pågående endringer i prosjektet.
- Følg publiseringen til den er fullført, og åpne den faktiske Pages-lenken.
  Kontroller at spillet starter, kan spilles og laster ressursene sine også
  etter en sideoppdatering.
- Oppdater `README.md` med lenken «Spill Santa Game», en kort forklaring av
  styringen og faktiske kommandoer for lokal kjøring og eventuell bygging.
- Gi brukeren både GitHub-lenken og den bekreftede spill-lenken. Oppgi hva som
  er testet. En vellykket push alene bekrefter ikke at spillet er publisert.

Hvis publisering blir blokkert av manglende tilgang eller en nødvendig
brukerhandling, fullfør resten og forklar konkret hva som gjenstår. Ikke oppgi
Pages-adressen som en fungerende spill-lenke før den er kontrollert.

## Referanser for publisering

- [Om GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Konfigurasjon av publisering](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
