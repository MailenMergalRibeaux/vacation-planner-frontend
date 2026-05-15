# Vacation Planner Frontend

Ein modernes Angular 18 Frontend für einen Spring Boot-basierten Urlaubsplaner.

## Features

- ✅ **Dashboard** - Übersicht über Urlaubstage und ausstehende Anträge
- ✅ **Urlaubsanträge** - Anträge erstellen, bearbeiten und verwalten
- ✅ **Admin-Panel** - Genehmigung und Verwaltung von Urlaubsanträgen
- ✅ **Benutzerverwaltung** - Übersicht aller Benutzer
- ✅ **Authentifizierung** - Token-basierte Authentifizierung mit Auth Interceptor
- ✅ **Responsive Design** - Optimiert für Desktop und Mobile
- ✅ **SCSS Styling** - Modern und wartbar

## Architektur

```
src/app/
├── core/                 # Services, Interceptors, Guards
│   ├── services/        # Auth, Vacation Request, User Services
│   ├── interceptors/    # Auth Token Interceptor
│   └── guards/          # Auth und Admin Guards
├── shared/              # Gemeinsame Komponenten
│   └── components/      # Header, Footer
├── features/            # Feature Modules
│   ├── dashboard/       # Dashboard Feature
│   ├── vacation-requests/  # Urlaubsanträge Feature
│   ├── admin/          # Admin Panel
│   └── users/          # Benutzerverwaltung
└── app.component.ts    # Root Component
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

Das Frontend verbindet sich mit einem Spring Boot Backend auf `http://localhost:8080/api`.

### Wichtige Endpoints:

- `POST /api/auth/login` - Benutzer-Login
- `GET /api/vacation-requests` - Alle Urlaubsanträge abrufen
- `POST /api/vacation-requests` - Neue Anfrage erstellen
- `GET /api/vacation-requests/{id}` - Anfrage-Details
- `PUT /api/vacation-requests/{id}/approve` - Anfrage genehmigen
- `PUT /api/vacation-requests/{id}/reject` - Anfrage ablehnen
- `GET /api/users` - Alle Benutzer auflisten

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

Das Frontend verwendet einen HTTP Interceptor zur automatischen Anhängung von JWT-Tokens an alle Requests:

```typescript
// Token wird automatisch aus localStorage geholt
Authorization: Bearer <JWT_TOKEN>
```

## Umgebungskonfiguration

Ändern Sie die API-Basis-URL in `src/app/core/services/`:

```typescript
private apiUrl = 'http://localhost:8080/api';
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
/                      → Dashboard (wenn authentifiziert)
/dashboard             → Dashboard
/vacation-requests     → Liste Urlaubsanträge
/vacation-requests/new → Neue Anfrage erstellen
/vacation-requests/:id → Anfrage-Details
/vacation-requests/:id/edit → Anfrage bearbeiten
/admin                 → Admin Panel
/admin/approvals       → Ausstehende Genehmigungen
/users                 → Benutzerliste
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

