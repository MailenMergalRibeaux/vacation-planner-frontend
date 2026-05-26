# Vacation Planner Frontend - Implementierungsübersicht

## ✅ Abgeschlossene Implementierung

Ein vollständiges, produktionsreifes Angular-18-Frontend wurde erstellt.  
Es spricht per HTTP Basic Auth mit einem Spring-Boot-Backend und bildet die Kernprozesse eines Urlaubsplaners ab.

---

## 1. Projektkonfiguration

- ✅ `package.json` – Abhängigkeiten für Angular 18, RxJS, etc.
- ✅ `angular.json` – Build-, Serve- und Assets-Konfiguration
- ✅ `tsconfig.json` / `tsconfig.app.json` – TypeScript-Konfiguration mit Strict Mode
- ✅ `.gitignore` – Git-Ignorierungsregeln
- ✅ `proxy.conf.json` – Dev-Proxy auf das Backend (`http://localhost:58080/api`)

---

## 2. Core Services

Ort: `src/app/core/services/`

- ✅ `auth.service.ts`
  - Login (`POST /api/auth/login`)
  - Registrierung von Führungskräften (`POST /api/auth/register`)
  - Passwortänderung (`POST /api/auth/change-password`)
  - Persistenz von HTTP-Basic-Credentials im `localStorage`
  - Bereitstellung des aktuellen `MitarbeiterResponse` als Observable

- ✅ `mitarbeiter.service.ts`
  - CRUD für Mitarbeitende (`/api/mitarbeiter`)
  - Laden des Teams einer Führungskraft mittels `vorgesetzterMitarbeiterId`

- ✅ `urlaubsantrag.service.ts` / `vacation-request.service.ts`
  - CRUD-Operationen für Urlaubsanträge (`/api/urlaubsantraege`)
  - Statusänderungen per `PATCH /api/urlaubsantraege/{id}/status`

- ✅ `urlaubskonto.service.ts`
  - Zugriff auf Urlaubskonten (`/api/urlaubskonten`)
  - Anpassung der Gesamttage pro Jahr

- ✅ `fuehrungskraft.service.ts`
  - Laden offener Einladungen (`GET /api/fuehrungskraft/einladungen`)
  - Erzeugen von Einladungscodes für neue Führungskräfte (`POST /api/fuehrungskraft/invite`)

- ✅ `user.service.ts`
  - Zusätzliche Benutzer-spezifische Funktionen (falls benötigt, z. B. für Admin-Sichten)

- ✅ `bearbeitungs-lock.service.ts`
  - Optionales Locking/Markierung, um parallele Bearbeitungen zu verhindern

- ✅ `flash-message.service.ts`
  - Zentrales Anzeigen von Erfolgs-/Fehlermeldungen

---

## 3. Authentication & Security

Ort: `src/app/core/`

- ✅ `interceptors/auth.interceptor.ts`
  - Keine JWTs – der Interceptor setzt **HTTP Basic Auth**:
    ```http
    Authorization: Basic base64(email:passwort)
    ```
  - Credentials stammen aus dem `AuthService` (lokal gespeicherte Basic-Credentials).

- ✅ Guards (`core/guards/`)
  - `auth.guard.ts`
    - Schützt alle geschützten Routen (z. B. `/dashboard`, `/urlaubsantraege`, `/mitarbeiter`).
    - Leitet bei fehlender Authentifizierung auf `/login` um.
  - `admin.guard.ts`
    - Prüft, dass `rolle === 'FUEHRUNGSKRAFT'`.
    - Schützt Admin-spezifische Bereiche (z. B. `/admin`, Genehmigungsfunktionen).
  - `passwort-aenderung.guard.ts`
    - Erzwingt, dass Benutzer mit `passwortAenderungErforderlich === true` zunächst ihr Passwort ändern.
    - Typischer Flow: Login → falls Flag gesetzt → `/change-password` → danach Zugriff auf restliche App.

---

## 4. Shared Components

Ort: `src/app/shared/components/`

- ✅ `header`
  - Navigation (Links zu Dashboard, Urlaubsanträgen, Mitarbeitenden, Admin)
  - Anzeige des eingeloggten Benutzers
  - Logout-Aktion

- ✅ `footer`
  - Einfache Fußzeile (Branding, Copyright, ggf. Version)

- ✅ `layout`
  - Layout-Komponente für die Hauptseiten (Header, Content, Footer)

---

## 5. Features

Ort: `src/app/features/`

### 5.1 Dashboard

- ✅ `dashboard.component.ts/html/scss`
  - Anzeige der Urlaubstage:
    - Gesamt
    - Verwendet
    - Verbleibend
  - Antrags-Statistik (ausstehend, genehmigt, abgelehnt)
  - Schnellzugriff auf aktuelle Anträge

### 5.2 Vacation Requests

- ✅ `vacation-request-list.component.*`
  - Liste aller Anträge des aktuellen Benutzers
  - Optionale Filter nach Status
  - Anzeige von Status, Zeitraum, Resturlaub

- ✅ `vacation-request-form.component.*`
  - Formular für neue und bestehende Anträge
  - Datumsauswahl (von/bis)
  - Automatische Berechnung der Urlaubstage (inkl. Berücksichtigung von Wochenenden/Feiertagen – fachliche Logik im Backend)
  - Validierungen (z. B. Pflichtfelder, gültiger Zeitraum)

- ✅ `vacation-request-detail.component.*`
  - Detailansicht eines Antrags
  - Für Führungskräfte:
    - Genehmigen/Ablehnen von Anträgen
    - Optional: Kommentar/Begründung
  - Für Mitarbeitende:
    - Einsicht in Status und Historie

### 5.3 Admin Panel

- ✅ `admin-dashboard.component.*`
  - Übersicht über ausstehende Genehmigungen
  - Schnellzugriff auf relevante Urlaubsanträge
  - (Optional) weitere Admin-Funktionen (Statistiken, Systemübersicht)

### 5.4 Users (Mitarbeiterverwaltung)

- ✅ `user-list.component.*`
  - Zeigt das Team der aktuellen Führungskraft (alle Mitarbeitenden mit `vorgesetzterMitarbeiterId == current.id`)
  - Abteilungs- und Rolleninfos
  - Löschen / Bearbeiten von Mitarbeitenden
  - **Führungskraft-Invite**:
    - Button „Einladungscode generieren“
    - Ruft `FuehrungskraftService.generateFuehrungskraftInvite()` auf
    - Zeigt den erzeugten Code in der UI an und behandelt Fehler (z. B. fehlende Berechtigung)

- ✅ `user-form.component.*`
  - Anlegen und Bearbeiten von Mitarbeitenden
  - Felder wie Vorname, Nachname, E-Mail, Bundesland, Rolle, Vorgesetzter

### 5.5 Auth & Registration

- ✅ `login.component.*`
  - Login-Formular (E-Mail + Passwort)
  - Bei Erfolg:
    - Speichern der Basic-Credentials
    - Laden des aktuellen Mitarbeiterprofils
    - Redirect auf `/dashboard` oder ggf. `/change-password`

- ✅ `register.component.*`
  - Registrierung für neue Führungskräfte via Einladungscode
  - Felder für Stammdaten und Passwort
  - Übermittelt den Einladungscode ans Backend (`/api/auth/register`)

- ✅ `change-password.component.*`
  - Formular zum Setzen eines neuen Passworts
  - Aufruf von `AuthService.changePassword(...)`
  - Wird durch `passwort-aenderung.guard` erzwungen, falls nötig

---

## 6. Styling

- ✅ `styles.scss` – globale Styles (Reset, Typografie, Layout)
- ✅ Komponenten-spezifische SCSS-Dateien
- ✅ Responsives Layout (Mobile-First)
  - Breakpoints für Mobile / Tablet / Desktop
- ✅ Farbkonzept:
  - Primär: Blau `#1976d2`
  - Statusfarben:
    - Grün – genehmigt
    - Orange – ausstehend
    - Rot – abgelehnt

---

## 7. Routing

- ✅ `app.routes.ts`
  - Feature-basierte Route-Struktur mit Standalone Components
  - Guards:
    - `authGuard` für geschützte Bereiche
    - `adminGuard` für Admin-/Führungskraft-Funktionen
    - `passwort-aenderung.guard` zur Erzwingung des Passwort-Updates

- ✅ Feature-Routing:
  - `dashboard.routes.ts`
  - `vacation-requests.routes.ts`
  - `users.routes.ts`
  - `admin.routes.ts`

Beispielhafte Route-Struktur:

```text
/login                 → Login
/register              → Registrierung Führungskraft
/change-password       → Passwort ändern (erzwingbar per Guard)
/dashboard             → Dashboard
/urlaubsantraege       → Urlaubsanträge (Liste)
/urlaubsantraege/new   → Neuer Antrag
/urlaubsantraege/:id   → Antragsdetails
/mitarbeiter           → Mitarbeiterverwaltung & Einladungen
/admin                 → Admin-Panel (nur FUEHRUNGSKRAFT)
```

---

## 8. Main Application
- ✅ `app.component.*` - Root Component
- ✅ `app.config.ts` - Konfiguration des Routers, HTTP-Client, Interceptors und weiterer Provider
- ✅ `main.ts` - Bootstrap der Angular-Anwendung mit bootstrapApplication
  - Root Component
  - Einbettung des Layouts (Header, Router-Outlet, Footer)

---

## 📊 Projektstatistiken

| Komponente | Dateien | Status |
|-----------|----|--------|
| Core Services | 8  | ✅ Vollständig |
| Guards/Interceptors | 3  | ✅ Vollständig |
| Shared Components | 3  | ✅ Vollständig |
| Dashboard Feature | 3  | ✅ Vollständig |
| Vacation Requests | 9  | ✅ Vollständig |
| Admin Feature | 3-4 | ✅ Vollständig |
| Users Feature | 6  | ✅ Vollständig |
| Config & Bootstrap | 8+ | ✅ Vollständig |
| Auth/Registration/Change PW | 6  | ✅ Vollständig |

---

## 🎯 Features Übersicht

### Für Mitarbeitende (`MITARBEITER`)
- Dashboard mit Überblick über eigene Urlaubstage (Gesamt / Verwendet / Verbleibend)
- Eigene Urlaubsanträge erstellen und bearbeiten
- Antragsverlauf einsehen
- Status-Tracking der eigenen Anträge (Ausstehend / Genehmigt / Abgelehnt / Storniert)

### Für Führungskräfte (`FUEHRUNGSKRAFT`)
- Alle Funktionen der Mitarbeitenden
- Dashboard mit zusätzlicher Übersicht über Team-Anträge
- Ausstehende Genehmigungen des Teams prüfen
- Anträge von Mitarbeitenden genehmigen oder ablehnen (inkl. optionalem Kommentar)
- Mitarbeitende verwalten (Anlegen, Bearbeiten, Löschen)
- Einladungscodes für neue Führungskräfte generieren

### „Admin“-Bereich (fachlich durch Rolle `FUEHRUNGSKRAFT` abgedeckt)
- Zugriff auf den Admin-/Übersichtsbereich (`/admin`)
- Team- und Antragsübersichten mit Management-Fokus
- Approvals-Bereich für ausstehende Genehmigungen

---

## 🚀 Nächste Schritte zum Starten

1. **Abhängigkeiten installieren**:
   ```bash
   npm install
   ```

2. **Development Server starten**:
   ```bash
   npm start
   ```
---

## 📝 Wichtige Dateistruktur

```text
src/
├── index.html
├── main.ts
├── styles.scss
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── app/
    ├── app.component.*         # Root Component
    ├── app.routes.ts           # Zentrale Route-Definition
    ├── app.config.ts           # Bootstrap-/Provider-Konfiguration
    ├── core/
    │   ├── models/
    │   │   └── api.models.ts   # Zentrale API-Interfaces (Mitarbeiter, Urlaubsantrag, etc.)
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── bearbeitungs-lock.service.ts
    │   │   ├── flash-message.service.ts
    │   │   ├── fuehrungskraft.service.ts
    │   │   ├── mitarbeiter.service.ts
    │   │   ├── urlaubsantrag.service.ts
    │   │   ├── urlaubskonto.service.ts
    │   │   └── user.service.ts
    │   ├── guards/
    │   │   ├── admin.guard.ts
    │   │   ├── auth.guard.ts
    │   │   └── passwort-aenderung.guard.ts
    │   └── interceptors/
    │       └── auth.interceptor.ts
    ├── shared/
    │   └── components/
    │       ├── footer/
    │       │   ├── footer.component.ts
    │       │   ├── footer.component.html
    │       │   └── footer.component.scss
    │       ├── header/
    │       │   ├── header.component.ts
    │       │   ├── header.component.html
    │       │   └── header.component.scss
    │       └── layout/
    │           └── layout.component.ts
    └── features/
        ├── login/
        │   ├── login.component.ts
        │   ├── login.component.html
        │   └── login.component.scss
        ├── register/
        │   ├── register.component.ts
        │   ├── register.component.html
        │   └── register.component.scss
        ├── change-password/
        │   ├── change-password.component.ts
        │   ├── change-password.component.html
        │   └── change-password.component.scss
        ├── dashboard/
        │   ├── dashboard.component.ts
        │   ├── dashboard.component.html
        │   ├── dashboard.component.scss
        │   └── dashboard.routes.ts
        ├── vacation-requests/
        │   ├── pages/
        │   │   ├── vacation-request-list/
        │   │   ├── vacation-request-form/
        │   │   └── vacation-request-detail/
        │   └── vacation-requests.routes.ts
        ├── admin/
        │   ├── pages/
        │   │   └── admin-dashboard/
        │   └── admin.routes.ts
        └── users/
            ├── pages/
            │   ├── user-list/
            │   └── user-form/
            └── users.routes.ts
```

---

## 🔐 Authentifizierung

Das Frontend erweitert alle HTTP-Requests automatisch mit einem HTTP-Basic-Header:

```http
Authorization: Basic <base64(email:passwort)>
```

---

## 🎨 Responsive Design

Das Layout ist vollständig responsive umgesetzt:

- **Mobile** (< 768px)
  - Vereinfachte Navigation (kompakter Header, ggf. Burger-Icon)
  - Inhalte überwiegend in einer Spalte (Stack-Layout)
  - Tabellen werden als vertikal gestapelte Karten dargestellt, wo sinnvoll

- **Tablet** (768px – 1024px)
  - Flexibles Grid-Layout
  - Zwei-Spalten-Layouts für Übersichten (z. B. Dashboard + Stats)

- **Desktop** (> 1024px)
  - Mehrspaltige Layouts (z. B. Sidebar + Content)
  - Tabellen mit voller Breite
  - Mehr Platz für Detail- und Listenansichten (z. B. Urlaubsanträge, Mitarbeitende)

---

## 📦 Deployment Ready

Das Frontend kann mit `npm run build:prod` gebaut und auf jedem statischen HTTP-Server bereitgestellt werden.

Der Production-Build landet im `dist/`-Verzeichnis (z. B. `dist/vacation-planner-frontend` je nach `angular.json`).

Mögliche Hosting-Varianten:

- nginx (empfohlen in Kombination mit dem Spring-Boot-Backend hinter einem Reverse Proxy)
- Apache HTTP Server
- GitHub Pages (nur Frontend, Backend separat)
- AWS S3 + CloudFront
- Vercel / Netlify

Wichtig: Die API-URL (`environment.prod.ts` → `apiUrl`) muss zum Deployment-Setup des Backends passen (z. B. `/api` hinter einem gemeinsamen Reverse Proxy).

---

## ✨ Best Practices Implementiert

- ✅ Standalone Components (Angular 18, keine klassischen NgModule mehr)
- ✅ Unit-testbare Services und reine Fachlogik in Services statt in Komponenten
- ✅ Type Safety durch TypeScript Strict Mode (strict, strictNullChecks, etc.)
- ✅ Reactive Forms mit Validierung für Formulare (Login, Register, Change Password, Urlaubsantrag)
- ✅ Konsistentes Error Handling in Services und Komponenten (z. B. via `flash-message.service`)
- ✅ Explizite Loading States in Komponenten (z. B. `isLoading`, `isInviteLoading`)
- ✅ Responsive SCSS mit klaren Breakpoints (Mobile / Tablet / Desktop)
- ✅ Guard Protection für geschützte Routen (`auth.guard`, `admin.guard`, `passwort-aenderung.guard`)
- ✅ Interceptor Pattern für zentrale Authentifizierung (`auth.interceptor` mit HTTP Basic Auth)
- ✅ Feature-Based Architecture mit klar getrennten Feature-Verzeichnissen (dashboard, vacation-requests, users, admin)

---

**Status**: 🟢 Bereit für `npm install` und Development  
**Angular Version**: 18.0.0  
**Node Version**: 20.15.0  
**npm Version**: 10.7.0

