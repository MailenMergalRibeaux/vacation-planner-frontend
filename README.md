# Vacation Planner Frontend

Ein modernes Angular 18 Frontend für einen Spring Boot-basierten Urlaubsplaner.

## Features

- ✅ **Dashboard** – Übersicht über Urlaubstage und ausstehende Anträge
- ✅ **Urlaubsanträge** – Anträge erstellen, bearbeiten und verwalten
- ✅ **Admin-Panel** – Genehmigung und Verwaltung von Urlaubsanträgen (nur für Führungskräfte)
- ✅ **Benutzerverwaltung** – Übersicht aller Mitarbeitenden (inkl. Team-Sicht für Führungskräfte)
- ✅ **Self-Service-Registrierung für Führungskräfte** – geschützt durch Einladungscodes
- ✅ **Führungskraft-Einladungen** – bestehende Führungskräfte können neue Führungskräfte per Einladungscode einladen
- ✅ **Authentifizierung** – HTTP Basic Auth via `/api/auth/...`, Rollen `MITARBEITER` / `FUEHRUNGSKRAFT`
- ✅ **Responsive Design** – Optimiert für Desktop und Mobile
- ✅ **SCSS Styling** – Modern und wartbar

## Architektur

```text
src/app/
├── core/                 # Services, Interceptors, Guards
│   ├── services/         # Auth-, Mitarbeiter-, Urlaubsantrags-, Urlaubskonto-, Führungskraft-Services
│   ├── interceptors/     # auth.interceptor (HTTP Basic Header)
│   └── guards/           # authGuard, adminGuard (FUEHRUNGSKRAFT)
├── shared/               # Gemeinsame Komponenten (Layout, Header, Footer)
├── features/             # Feature-Bereiche
│   ├── login/            # Login (E-Mail + Passwort)
│   ├── register/         # Self-Service-Registrierung für Führungskräfte
│   ├── dashboard/        # Dashboard
│   ├── vacation-requests/# Urlaubsanträge
│   ├── admin/            # Admin-Panel (geschützt durch adminGuard)
│   └── users/            # Mitarbeiterverwaltung (inkl. Invite-Generierung)
└── app.component.ts      # Root Component
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

---

## API Integration

In der lokalen Entwicklung verwendet das Frontend einen Angular-Proxy (`proxy.conf.json`), um alle Aufrufe auf `/api/...` an das Backend weiterzuleiten:

```json
{
  "/api": {
    "target": "http://localhost:58080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

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

---

## Registrierung

Über `/register` können sich neue **Führungskräfte** selbst registrieren.

- Pflichtfelder:
    - Mitarbeiter-ID
    - Vorname, Nachname
    - E-Mail
    - Passwort (min. 8 Zeichen)
    - Bundesland
    - **Einladungscode**
- Optional: Vorgesetzter (Mitarbeiter-ID).

### Einladungscode

- Bestehende Führungskräfte erzeugen im Bereich `/mitarbeiter` einen neuen Einladungscode:
    - Frontend: `UserListComponent.generateInviteCode()`
    - Service: `FuehrungskraftService.generateFuehrungskraftInvite()`
    - Endpoint: `POST /api/fuehrungskraft/invite` → Antwort `{ code: string }`
- Der erzeugte Code wird in der UI angezeigt und kann an die neue Führungskraft weitergegeben werden.
- Beim Registrieren prüft das Backend:
    - ob der Code existiert,
    - ob er noch gültig ist,
    - ob er noch nicht verwendet wurde.
- Ohne gültigen Code liefert das Backend einen Fehler (z. B. HTTP 403).

Nach erfolgreicher Registrierung wird die Sitzung automatisch initialisiert (Auto-Login → `/dashboard`).

**Mitarbeitende** registrieren sich **nicht** selbst. Sie werden durch eine Führungskraft im Bereich `/mitarbeiter` per `POST /api/mitarbeiter` angelegt.

---

## Rollenmodell

| Rolle           | Berechtigungen                                                                                          |
|-----------------|---------------------------------------------------------------------------------------------------------|
| `MITARBEITER`   | Eigene Urlaubsanträge stellen und bearbeiten, eigenen Antragsverlauf und eigenes Urlaubskonto einsehen |
| `FUEHRUNGSKRAFT`| Alle Mitarbeitenden-Funktionen plus: Mitarbeiterverwaltung, Genehmigung/Ablehnung von Anträgen, Zugriff auf Admin-Bereich, Erzeugen von Einladungscodes für neue Führungskräfte |

Der `adminGuard` schützt u. a. Routen wie `/admin` und prüft, dass `rolle === 'FUEHRUNGSKRAFT'`.

---

## Standard-Zugangsdaten (lokal)

Beim ersten Backend-Start wird eine initiale Führungskraft angelegt (Details siehe Backend-README bzw. `docker-compose.yml` des Backends).

Typische Defaults (konfigurierbar über Umgebungsvariablen):

- E-Mail: `fuehrungskraft@local` (z. B. via `APP_FUEHRUNGSKRAFT_EMAIL`)
- Passwort: `Initial1234` (z. B. via `APP_FUEHRUNGSKRAFT_PASSWORD`)

Diese initiale Führungskraft kann sich direkt einloggen und:

- Mitarbeitende im Bereich `/mitarbeiter` anlegen/verwalten,
- Einladungscodes für **neue** Führungskräfte über `POST /api/fuehrungskraft/invite` erzeugen.

Ein fester vordefinierter Einladungscode (z. B. `CHANGE-ME-INVITE-2026`) wird **nicht mehr** hart über eine Property wie `APP_FUEHRUNGSKRAFT_INVITE_CODE` im Frontend verwendet, sondern durch das Backend dynamisch generiert und im Frontend angezeigt.

---

## Komponenten-Übersicht

### Dashboard
- **Dateien**: `dashboard.component.ts/html/scss`
- **Funktionen**:
    - Übersicht der Urlaubstage (Gesamt, Verwendet, Verbleibend)
    - Antrags-Statistik (Ausstehend, Genehmigt, Abgelehnt)
    - Schnellzugriff auf aktuelle bzw. letzte Anträge

### Vacation Requests
- **List-Komponente**: `vacation-request-list.component.*`
    - Liste aller Anträge des aktuell eingeloggten Benutzers
    - Filterung nach Status
    - Anzeige von Zeitraum, Status, Resturlaub
- **Form-Komponente**: `vacation-request-form.component.*`
    - Erstellen und Bearbeiten von Urlaubsanträgen
    - Datumsauswahl (von/bis)
    - Validierungen und Berechnung der Urlaubstage (fachlich im Backend)
- **Detail-Komponente**: `vacation-request-detail.component.*`
    - Detailansicht eines Antrags
    - Für Führungskräfte: Genehmigen/Ablehnen (inkl. Kommentar)
    - Für Mitarbeitende: Einsicht in Status und Inhalte

### Admin Panel
- **Komponente**: `admin-dashboard.component.*`
    - Übersicht ausstehender Genehmigungen
    - Schnellzugriff auf zu prüfende Urlaubsanträge
    - Einstiegspunkt in weitere Admin-/Führungskraft-Funktionen

### Users (Mitarbeiterverwaltung)
- **Liste**: `user-list.component.*`
    - Anzeige des eigenen Teams (Mitarbeitende, bei denen die aktuelle Führungskraft Vorgesetzte*r ist)
    - Abteilungs- und Rolleninformationen
    - Bearbeiten/Löschen von Mitarbeitenden
    - Button zum Erzeugen von Einladungscodes für neue Führungskräfte
- **Formular**: `user-form.component.*`
    - Anlegen und Bearbeiten von Mitarbeitenden
    - Erfassung von Stammdaten, Rolle und Vorgesetzter

### Auth & Registrierung
- **Login**: `login.component.*`
    - Login-Formular (E-Mail + Passwort)
    - Fehleranzeige bei falschen Credentials
- **Registrierung**: `register.component.*`
    - Registrierung für neue Führungskräfte via Einladungscode
    - Validierung aller Pflichtfelder inkl. Einladungscode
- **Passwort ändern**: `change-password.component.*`
    - Formular zur Passwortänderung
    - Wird durch Guard erzwungen, falls `passwortAenderungErforderlich === true`

### Shared Components
- **Header**: `header.component.*`
    - Navigation, Benutzeranzeige, Logout
- **Footer**: `footer.component.*`
    - Einfache Fußzeile
- **Layout**: `layout.component.*`
    - Shell/Layout für alle geschützten Seiten (Header + Content + Footer)

---

## Styling

Das Projekt verwendet SCSS mit einer modernen, responsiven Design-Sprache:

- Primärfarbe: `#1976d2` (Blau)
- Sekundärfarben für Status:
    - Grün für genehmigte Anträge
    - Orange für ausstehende Anträge
    - Rot für abgelehnte Anträge
- Mobile-First-Ansatz:
    - Basis-Styles für kleine Bildschirme
    - Zusätzliche Layout-Anpassungen für Tablet- und Desktop-Breakpoints

---

## Authentication

`src/app/core/interceptors/auth.interceptor.ts` hängt den HTTP-Basic-Header automatisch an jeden Request, sobald Credentials in `localStorage` liegen:

```http
Authorization: Basic <base64(email:passwort)>
```
---

## Umgebungskonfiguration

Die API-Basis-URL wird pro Build-Konfiguration in `src/environments/` definiert:

```typescript
// environment.ts (Dev)  → Zugriff über Angular-Dev-Server, Requests gehen via Proxy auf http://localhost:58080/api
export const environment = {
    production: false,
    apiUrl: '/api',
};

// environment.prod.ts   → typischerweise /api (gleicher Host wie Backend-Deployment oder Reverse Proxy)
export const environmentProd = {
    production: true,
    apiUrl: '/api',
};
```

---

## Docker / Container (Frontend-App)

Das Frontend kann als eigenständiges Docker-Image gebaut und gestartet werden:

```bash
# Image bauen (aus dem Projekt-Root mit Dockerfile)
docker build -t vacation-planner-frontend .

# (Optional) bestehenden Container stoppen
docker stop vacation-planner-frontend || true

# Container starten: Frontend unter http://localhost:8081
docker run -d --rm \
  -p 8081:80 \
  --name vacation-planner-frontend \
  vacation-planner-frontend
```

---

## Testing

```bash
# Unit Tests ausführen
npm test

# Tests mit Coverage
ng test --code-coverage
```

---

## Build

```bash
# Development Build (ohne zusätzliche Optimierungen)
npm run build

# Production Build (mit Optimierungen, AOT, Minifizierung etc.)
npm run build:prod
```

---

## Deployment

Das Frontend kann auf jedem statischen HTTP-Server bereitgestellt werden:

```bash
# Production-Build erzeugen
npm run build:prod

# Lokal mit einem einfachen HTTP-Server testen (Beispiel)
npx http-server dist/vacation-planner-frontend -p 4200
```

---

## Struktur der Routes

```text
/login                   → Login (E-Mail + Passwort)
/register                → Self-Service-Registrierung Führungskraft

/                        → Redirect auf /dashboard (wenn authentifiziert)
/dashboard               → Dashboard (Übersicht Urlaubskonto & Antragsstatus)

/urlaubsantraege         → Liste Urlaubsanträge der eingeloggten Person
/urlaubsantraege/new     → Neuer Urlaubsantrag
/urlaubsantraege/:id     → Antragsdetails (lesen/bearbeiten; für FK inkl. Genehmigung/Ablehnung)

/mitarbeiter             → Mitarbeiterverwaltung (nur FUEHRUNGSKRAFT)
/mitarbeiter/new         → Neuen Mitarbeitenden anlegen
/mitarbeiter/:id         → Mitarbeitenden bearbeiten

/admin                   → Admin Panel (adminGuard → nur FUEHRUNGSKRAFT)
/admin/approvals         → Ausstehende Genehmigungen (Team-Anträge prüfen)
```

---

## TypeScript Konfiguration

Die wichtigsten Einstellungen der `tsconfig.json`:

- **Strict Mode**: Aktiviert (`"strict": true`)
- **Target**: `ES2022`
- **Module**: `ES2022`
- **Strict Null Checks**: Aktiviert (`"strictNullChecks": true`)
- **Weitere empfohlene Flags** (typisch für das Projekt):
    - `"noImplicitAny": true`
    - `"noImplicitThis": true`
    - `"alwaysStrict": true`
    - `"noFallthroughCasesInSwitch": true`

---

## Weitere Ressourcen

- [Angular Dokumentation](https://angular.io)
- [Angular CLI](https://angular.io/cli)
- [RxJS](https://rxjs.dev)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Angular Style Guide](https://angular.io/guide/styleguide)

---

## Lizenz

Proprietary – Nutzung ausschließlich im Rahmen der jeweiligen Projektvereinbarungen. Eine Weitergabe oder öffentliche Nutzung ist ohne ausdrückliche Genehmigung nicht gestattet.


