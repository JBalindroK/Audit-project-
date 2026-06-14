// =============================================
// SocialAudit.be - Types TypeScript
// =============================================

export interface Worker {
  name?: string;
  cp?: string;
  regime?: string;
  anciennete?: string;
}

export interface PassifPoste {
  poste: string;
  montant_mensuel: string;
  montant_total_5ans?: string;
}

export interface Alerte {
  type: "CRITIQUE" | "ATTENTION";
  titre: string;
  detail: string;
  montant_estime?: string;
  base_legale?: string;
  niveau?: "LOI" | "CP" | "CCT-ENTREPRISE";
}

export interface AuditResult {
  score: number;
  conformite_globale: "CONFORME" | "RISQUE MODERE" | "NON CONFORME" | "PRETE A EMETTRE" | string;
  worker?: Worker;
  periode_paie?: { mois?: string; annee?: number };
  risque_financier_estime?: string;
  passif_par_travailleur?: PassifPoste[];
  alertes?: Alerte[];
  points_conformes?: string[];
  recommandations?: string[];
  note_contexte?: string;
  _reasoning?: string;
  _year?: number;
  _month?: string;
  _filename?: string;
  _confidence?: number;
  _warnings?: string[];
  _type?: "direct" | "interim";
  _error?: boolean;
  _errorMessage?: string;
  [key: string]: any;
}

export interface DemoFiche {
  id: string;
  label: string;
  sub: string;
  tag: string;
  tc: string;
  score?: number;
  ficheType?: "direct" | "interim";
  ficheMode?: "retro" | "preventif";
  ficheYear?: number;
  analyse: AuditResult;
}

export interface GrilleCategorie {
  id: string;
  label: string;
  tauxBase: number;
  tauxGlobalise?: number;
  tauxMinore?: number;
  tauxDET?: number;
  regime: "continu" | "semi" | "jour";
  anciennete?: { ans: number; coef: number }[];
}

export interface PrimesEquipe {
  nuitSem: number;
  nuitWE: number;
  matin: number;
  apresMidi: number;
  apresMidiWE: number;
  semiNuit: number;
  semiNuitWE: number;
  semiMatin: number;
  semiApMidi: number;
  semiApMidiWE: number;
  integre3eq: number;
  integre2eq: number;
}

export interface PrimeAnciennete {
  de: number;
  a: number;
  increment: number;
  cumul: number;
}

export interface HeuresMois {
  normal: number;
  nuitSem: number;
  nuitWE: number;
  dim: number;
  feries: number;
  heuresSup: number;
}

export interface Grille {
  annee: number;
  anneeReference: number;
  categories: GrilleCategorie[];
  primesEquipe: PrimesEquipe;
  primesAnciennete: PrimeAnciennete[];
  heuresMois: {
    c5: HeuresMois;
    sc: HeuresMois;
    j: HeuresMois;
  };
}

export interface Profile {
  id: string;
  label: string;
  icon: string;
  nb: string;
  risk: "ELEVE" | "MODERE" | "FAIBLE";
  rc: string;
}

export interface Recipient {
  id: string;
  label: string;
  email: string;
  active: boolean;
}

export interface CompanyConfig {
  name: string;
  num: string;
  cp: string;
  workers: string;
  country: string;
  typeEntreprise?: "direct" | "interim";
  profiles: Profile[];
  recipients: Recipient[];
  grille: Grille;
  _prevCp?: string;
  _prevProfiles?: Profile[];
}

export interface BatchProgress {
  current: number;
  total: number;
  results: AuditResult[];
  done: boolean;
}

export type AuditMode = "retro" | "preventif";
export type AppStep =
  | "config"
  | "home"
  | "upload"
  | "analyzing"
  | "batch"
  | "result";
