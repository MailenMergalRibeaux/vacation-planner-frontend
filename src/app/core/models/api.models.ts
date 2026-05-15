/**
 * Modelle die 1:1 den Backend-DTOs entsprechen.
 * Backend: com.mmr.domain / com.mmr.dto
 */

// ---- Enums ----

export type AntragStatus = 'BEANTRAGT' | 'GENEHMIGT' | 'ABGELEHNT' | 'STORNIERT';

export type Urlaubsart =
  | 'ERHOLUNGSURLAUB'
  | 'SONDERURLAUB'
  | 'UNBEZAHLTER_URLAUB'
  | 'BILDUNGSURLAUB';

export type Bundesland =
  | 'BA' | 'BY' | 'BE' | 'BB' | 'HB' | 'HH'
  | 'HE' | 'MV' | 'NI' | 'NW' | 'RP' | 'SL'
  | 'SN' | 'ST' | 'SH' | 'TH';

export const BUNDESLAND_LABELS: Record<Bundesland, string> = {
  BA: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg',
  HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern',
  NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz',
  SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt',
  SH: 'Schleswig-Holstein', TH: 'Thüringen'
};

// ---- Mitarbeiter ----

/** Entspricht MitarbeiterRequest */
export interface MitarbeiterRequest {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  bundesland: Bundesland;
  vorgesetzterMitarbeiterId?: string | null;
}

/** Entspricht MitarbeiterResponse */
export interface MitarbeiterResponse {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  bundesland: Bundesland;
  vorgesetzterMitarbeiterId?: string | null;
}

// ---- UrlaubsAntrag ----

/** Entspricht UrlaubsAntragRequest */
export interface UrlaubsAntragRequest {
  mitarbeiterId: string;
  startdatum: string;   // ISO-Date: 'YYYY-MM-DD'
  enddatum: string;     // ISO-Date: 'YYYY-MM-DD'
  urlaubsart?: Urlaubsart;
  kommentar?: string;
}

/** Entspricht UrlaubsAntragResponse */
export interface UrlaubsAntragResponse {
  id: number;
  mitarbeiterId: string;
  startdatum: string;
  enddatum: string;
  urlaubsart: Urlaubsart;
  status: AntragStatus;
  kommentar?: string;
  erstelltAm?: string;
  geaendertAm?: string;
}

/** Entspricht StatusUpdateRequest */
export interface StatusUpdateRequest {
  status: AntragStatus;
  kommentar?: string;
}

// ---- Urlaubskonto ----

/** Entspricht UrlaubskontoRequest */
export interface UrlaubskontoRequest {
  mitarbeiterId: string;
  jahr: number;
  gesamtTage: number;
}

/** Entspricht UrlaubskontoResponse */
export interface UrlaubskontoResponse {
  id: number;
  mitarbeiterId: string;
  jahr: number;
  gesamtTage: number;
  gebuchteTage: number;
  verbleibendeTage: number;
}

// ---- Feiertag ----

export interface FeiertagRequest {
  name: string;
  datum: string;
  bundesland: Bundesland;
}

export interface FeiertagResponse {
  id: number;
  name: string;
  datum: string;
  bundesland: Bundesland;
}

// ---- Auth (HTTP Basic) ----

export interface BasicCredentials {
  username: string;
  password: string;
}

