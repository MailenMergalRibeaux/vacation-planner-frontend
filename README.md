# Vacation Planner Frontend

Ein modernes Angular 18 Frontend für einen Spring Boot-basierten Urlaubsplaner.

## Features

- ✅ **Dashboard** - Übersicht über Urlaubstage und ausstehende Anträge
- ✅ **Urlaubsanträge** - Anträge erstellen, bearbeiten und verwalten
- ✅ **Admin-Panel** - Genehmigung und Verwaltung von Urlaubsanträgen (nur für Führungskräfte)
- ✅ **Benutzerverwaltung** - Übersicht aller Mitarbeitenden
- ✅ **Self-Service-Registrierung für Führungskräfte** - mit Einladungscode-Schutz
- ✅ **Authentifizierung** - HTTP Basic Auth via `/api/auth/login`, Rollen `MITARBEITER` / `FUEHRUNGSKRAFT`
- ✅ **Responsive Design** - Optimiert für Desktop und Mobile
- ✅ **SCSS Styling** - Modern und wartbar

## Architektur

```
src/app/
├── core/                 # Services, Interceptors, Guards
│   ├── services/        # AuthService, Mitarbeiter-, Urlaubsantrags-, Urlaubskonto-Service
│   ├── interceptors/    # auth.interceptor (HTTP Basic Header)
│   └── guards/          # authGuard, adminGuard (FUEHRUNGSKRAFT)
├── shared/              # Gemeinsame Komponenten (Layout, Header, Footer)
├── features/            # Feature Modules
│   ├── login/           # Login (E-Mail + Passwort)
│   ├── register/        # Self-Service-Registrierung für Führungskräfte
│   ├── dashboard/       # Dashboard
│   ├── vacation-requests/ # Urlaubsanträge
│   ├── admin/           # Admin Panel (geschützt durch adminGuard)
│   └── users/           # Mitarbeiterverwaltung
└── app.component.ts     # Root Component
```

## Voraussetzungen

- Node.js v20.15.0 oder höher
- npm 10.7.0 oder höher
- Angular CLI 18

## Installation

```bash
# Dependencies installieren
npm install

# Development Server starten
npm start

# Zum Bauen für Produktion
npm run build:prod
```

## Development Server

```bash
npm start
```

Die Anwendung läuft dann unter `http://localhost:4200/`.

## API Integration

Das Frontend verbindet sich mit dem Spring-Boot-Backend `urlaubsplaner` auf `http://localhost:8081/api`.
Lokal wird ein Angular-Proxy verwendet, sodass relative Pfade (`/api/...`) durchgereicht werden.

### Authentifizierung

Das Backend verwendet **HTTP Basic Authentication** (kein JWT, kein Refresh-Token).

- `POST /api/auth/login` — Login per `{ email, passwort }`. Antwort ist das vollständige `MitarbeiterResponse`-Profil inkl. `rolle`.
- `POST /api/auth/register` — Self-Service-Registrierung **nur für Führungskräfte** (siehe Abschnitt _Registrierung_).
- Folgeaufrufe werden vom `auth.interceptor` automatisch mit `Authorization: Basic base64(email:passwort)` versehen.

### Fachliche Endpunkte (Auswahl)

- `GET /api/mitarbeiter` — Alle Mitarbeitenden (nur Führungskraft)
- `POST /api/mitarbeiter` — Neuen Mitarbeitenden anlegen (nur Führungskraft)
- `GET /api/urlaubsantraege` — Urlaubsanträge abrufen
- `POST /api/urlaubsantraege` — Neuen Antrag stellen
- `PATCH /api/urlaubsantraege/{id}/status` — Status (genehmigen/ablehnen/stornieren) ändern
- `GET /api/urlaubskonto/...` — Urlaubskonto-Endpunkte

## Registrierung

Über `/register` können sich neue **Führungskräfte** selbst registrieren.

- Pflichtfelder: Mitarbeiter-ID, Vorname, Nachname, E-Mail, Passwort (min. 8 Zeichen), Bundesland, **Einladungscode**.
- Optional: Vorgesetzter (Mitarbeiter-ID).
- Der Einladungscode wird im Backend über die Property `app.fuehrungskraft.invite-code` bzw. das ENV `APP_FUEHRUNGSKRAFT_INVITE_CODE` gesetzt — ohne gültigen Code liefert das Backend `403`.
- Nach erfolgreicher Registrierung wird die Sitzung automatisch initialisiert (Auto-Login → `/dashboard`).

**Mitarbeitende** registrieren sich **nicht** selbst. Sie werden nach erstmaliger Anmeldung der Führungskraft im Bereich `/mitarbeiter` per `POST /api/mitarbeiter` angelegt.

## Rollenmodell

| Rolle | Berechtigungen |
|---|---|
| `MITARBEITER` | Eigene Anträge stellen, eigenes Urlaubskonto sehen |
| `FUEHRUNGSKRAFT` | Mitarbeiterverwaltung, Genehmigung/Ablehnung von Anträgen, Admin-Bereich |

Der `adminGuard` schützt `/admin` und prüft `rolle === 'FUEHRUNGSKRAFT'`.

## Standard-Zugangsdaten (lokal)

Beim ersten Backend-Start wird eine initiale Führungskraft angelegt (`FuehrungskraftInitializer`).
Defaults aus `docker-compose.yml`:

- E-Mail: `fuehrungskraft@local` (überschreibbar via `APP_FUEHRUNGSKRAFT_EMAIL`)
- Passwort: `Initial1234` (überschreibbar via `APP_FUEHRUNGSKRAFT_PASSWORD`)
- Einladungscode für `/register`: `CHANGE-ME-INVITE-2026` (überschreibbar via `APP_FUEHRUNGSKRAFT_INVITE_CODE`)

## Komponenten-Übersicht

### Dashboard
- Übersicht der Urlaubstage (Gesamt, Verwendet, Verbleibend)
- Anträge-Statistik (Ausstehend, Genehmigt)
- Schnellen Zugriff auf aktuelle Anträge

### Vacation Requests
- **List** - Alle Anträge des aktuellen Benutzers
- **Form** - Neue Anfrage erstellen oder bestehende bearbeiten
- **Detail** - Detailansicht mit Genehmigungsfunktionen

### Admin Panel
- Ausstehende Genehmigungen anzeigen
- Anträge genehmigen oder ablehnen

### Users
- Übersicht aller Benutzer
- Abteilungs- und Rolleninformationen

## Styling

Das Projekt verwendet SCSS mit einer modernen, responsive Design-Sprache:

- Primärfarbe: `#1976d2` (Blau)
- Sekundärfarben für Status (Grün für genehmigt, Orange für ausstehend, Rot für abgelehnt)
- Mobile-First Responsive Design

## Authentication

`src/app/core/interceptors/auth.interceptor.ts` hängt den HTTP-Basic-Header automatisch an jeden Request, sobald Credentials in `localStorage` liegen:

```typescript
Authorization: Basic <base64(email:passwort)>
```

Die Credentials werden beim erfolgreichen Login (`POST /api/auth/login`) bzw. nach erfolgreicher Registrierung (`POST /api/auth/register`) gespeichert und beim Logout wieder entfernt.

## Umgebungskonfiguration

API-Basis-URL pro Build-Konfiguration in `src/environments/`:

```typescript
// environment.ts (Dev)  → Proxy auf http://localhost:8081/api
// environment.prod.ts   → /api (gleicher Host wie Backend-Deployment)
export const environment = { production: false, apiUrl: '/api' };
```

## Testing

```bash
# Unit Tests ausführen
npm test

# Tests mit Coverage
ng test --code-coverage
```

## Build

```bash
# Development Build
npm run build

# Production Build
npm run build:prod
```

Die Build-Artefakte werden im `dist/`-Verzeichnis gespeichert.

## Deployment

Das Frontend kann auf jedem statischen HTTP-Server bereitgestellt werden:

```bash
# Bauen
npm run build:prod

# Mit einem HTTP-Server testen
npx http-server dist/vacation-planner -p 4200
```

## Struktur der Routes

```
/login                 → Login (E-Mail + Passwort)
/register              → Self-Service-Registrierung Führungskraft
/                      → Dashboard (wenn authentifiziert)
/dashboard             → Dashboard
/urlaubsantraege       → Liste Urlaubsanträge
/urlaubsantraege/new   → Neuer Antrag
/urlaubsantraege/:id   → Antragsdetails
/mitarbeiter           → Mitarbeiterverwaltung
/admin                 → Admin Panel (adminGuard → nur FUEHRUNGSKRAFT)
/admin/approvals       → Ausstehende Genehmigungen
```

## TypeScript Konfiguration

- **Strict Mode**: Aktiviert
- **Target**: ES2022
- **Module**: ES2022
- **Strict Null Checks**: Aktiviert

## Weitere Ressourcen

- [Angular Dokumentation](https://angular.io)
- [Angular CLI](https://angular.io/cli)
- [RxJS](https://rxjs.dev)

## Lizenz

Proprietary

