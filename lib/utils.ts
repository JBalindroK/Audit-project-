// =============================================
// SocialAudit.be - Fonctions utilitaires
// Parsing, coherence check, prompts IA, appels API
// =============================================

import { CP, INDEXATIONS, LEGAL } from './constants';
import { AuditResult, CompanyConfig } from './types';

export function parseEuros(s: string | undefined): number {
  const m = (s || "0").match(/[\d][\d .,]*/);
  if (!m) return 0;
  const n = m[0].replace(/[\s.,]+$/, "");
  if (/^\d+\.\d{3}$/.test(n)) return parseFloat(n.replace(".", ""));
  if (/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(n)) return parseFloat(n.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(,\d{3})+$/.test(n)) return parseFloat(n.replace(/,/g, ""));
  if (/^\d{1,3}( \d{3})+$/.test(n)) return parseFloat(n.replace(/ /g, ""));
  if (/^\d+\.\d{1,2}$/.test(n)) return parseFloat(n);
  return parseFloat(n.replace(/[\s.]/g, "").replace(",", ".")) || 0;
}

export function checkCoherence(parsed: AuditResult): string[] {
  const warnings: string[] = [];
  (parsed.passif_par_travailleur || []).forEach((p) => {
    const mensuel = parseEuros(p.montant_mensuel);
    const total = parseEuros(p.montant_total_5ans);
    if (mensuel > 0 && total > 0) {
      const ratio = total / mensuel;
      if (ratio > 72) warnings.push(`Incoherence: ${p.poste} - total semble trop eleve (${ratio.toFixed(0)}x mensuel)`);
      if (ratio < 1) warnings.push(`Incoherence: ${p.poste} - total inferieur au mensuel`);
    }
  });
  if (parsed.conformite_globale === "CONFORME" && (parsed.alertes || []).some((a) => a.type === "CRITIQUE"))
    warnings.push("Incoherence: fiche CONFORME avec alertes CRITIQUE");
  if (parsed.score > 80 && (parsed.alertes || []).filter((a) => a.type === "CRITIQUE").length > 1)
    warnings.push(`Incoherence: score ${parsed.score}/100 avec plusieurs alertes CRITIQUE`);
  return warnings;
}

// =============================================
// Construction des prompts IA
// Appelees uniquement depuis app/api/analyze/route.ts (cote serveur)
// =============================================

export function makeP1(mode: string, co: CompanyConfig, year: number, yearTo?: number): string {
  var cp=CP[co.cp]||CP["autre"];
  var prof=(co.profiles||[]).filter(function(p){return parseInt(p.nb)>0;}).map(function(p){return p.label+":"+p.nb;}).join(", ")||"non renseigne";
  var isBurgo=co.name.toLowerCase().indexOf("burgo")>=0;
  var ly=year?LEGAL[year]:null;
  var modeStr=mode==="retro"?co.typeEntreprise==="interim"?"INTERIM CP 322: taux variable par semaine selon qualification du poste. Heures supplementaires calculees sur le TAUX REEL du poste occupe (pas le taux de base). Si plusieurs taux sur la fiche: identifier le taux correspondant a chaque qualification. Si P10 present avec plusieurs taux: alerte VERIFICATION REQUISE - la qualification doit etre confirmee par le responsable RH. Sursalaires dim/feries sur taux reel. Prescription: calcul par periode de paie.":"RETROSPECTIF: passif exact CE TRAVAILLEUR. Periode: "+(year||"?")+(" a ")+(yearTo&&yearTo!==year?yearTo:year)+". Nb mois: "+((yearTo&&yearTo>year?(yearTo-year)*12+12:12))+". Decompose par poste. ONSS x1.27. PAS d extrapolation a l entreprise.":co.typeEntreprise==="interim"?"INTERIM PREVENTIF CP 322: verifier que les heures supplementaires sont calculees sur le TAUX REEL de la qualification occupee. Si plusieurs taux sur la fiche: chaque taux correspond a une qualification differente. Verifier sursalaires dim/feries sur taux reel. Verifier cheques repas selon bareme en vigueur. Signaler toute absence de mention explicite de la qualification sur les lignes de prestation.":"PREVENTIF: valide si prete a emettre.";
  var lines=["Expert droit travail belge.","ENTREPRISE: "+co.name+" | "+co.workers+" ETP | "+prof,
    "LOI BELGE: +50% heures sup sem/sam, +100% dim/feries sur TAUX BASE (Loi 1971 art.29)",
    ly?"Prime nuit: "+ly.nuit:"Prime nuit min 1.51euros/h depuis jan 2026",
    ly?"Formation: "+ly.f:"Formation: 5j/an depuis 01/01/2024",
    "Prescription: 5 ans (Loi 1978)",co.typeEntreprise==="interim"?"CP 322 INTERIM: taux variable selon qualification du poste. Heures sup calculees sur TAUX REEL du poste occupe. Prescription par periode de paie (pas de cumul 5 ans).":cp.legal,
    co.grille?"=== GRILLE SALARIALE ENTREPRISE ===":"",
    co.grille?(function(){var lines: string[]=[];(co.grille.categories||[]).forEach(function(cat: any){lines.push(cat.label+": base "+cat.tauxBase+" euros/h");});var pe: any=co.grille.primesEquipe||{};if(pe.nuitSem)lines.push("Primes: nuit-sem x"+pe.nuitSem+" | nuit-WE x"+pe.nuitWE+" | matin x"+pe.matin);return lines.join(" / ");})():"",
    co.grille&&co.grille.heuresMois?(function(){var hm=co.grille.heuresMois;var lines: string[]=["Heures types/mois:"];if(hm.c5)lines.push("Continu: "+hm.c5.nuitSem+"h nuit-sem "+hm.c5.nuitWE+"h nuit-WE "+hm.c5.dim+"h dim "+hm.c5.feries+"h feries "+hm.c5.heuresSup+"h sup");if(hm.sc)lines.push("Semi-cont: "+hm.sc.nuitSem+"h nuit-sem "+hm.sc.dim+"h dim");if(hm.j)lines.push("Journee: "+hm.j.feries+"h feries "+hm.j.heuresSup+"h sup");return lines.join(" / ");})():"",
    co.grille?"CALCUL: salaire_du = taux_base x coef_anciennete x (h_norm + primes x h_type + 100% x h_dim + 100% x h_feries). Compare avec salaire_paye = taux_globalise x h_totales. Ecart = passif mensuel. SOURCE FGTB: taux globalise 3C = 28.5845euros/h / taux base 3C = 22.6433euros/h / primes cycle 21j = 357.50euros. La deglobalisation est neutre pour l horaire normal (+157euros/an) MAIS le globalisé génère des pertes sur heures sup et fériés car 22.6433 x 1.5 = 33.96euros > 28.5845euros x 1.5 = 42.88euros (avantage base sur heures sup).":"",
    (function(){
      var idx=INDEXATIONS[co.cp]||INDEXATIONS["autre"];
      if(!idx)return "";
      var anneeRef=co.grille&&co.grille.anneeReference?co.grille.anneeReference:2022;
      var lines: string[]=["=== INDEXATIONS "+idx.nom+" ==="];
      lines.push("ANNEE DE REFERENCE DES TAUX: "+anneeRef+" (les taux saisis dans la grille correspondent a cette annee)");
      idx.historique.forEach(function(h: any){
        var hYear=parseInt(h.date.substring(0,4));
        if(h.pct>0&&hYear>anneeRef){
          lines.push(h.date.substring(0,7)+": +"+h.pct+"% -> a verifier si applique sur la fiche");
        } else if(hYear<=anneeRef&&h.pct>0){
          lines.push(h.date.substring(0,7)+": +"+h.pct+"% -> deja inclus dans le taux de reference "+anneeRef);
        }
      });
      lines.push("REGLE: pour une fiche de l annee X, le taux attendu = taux_ref_"+anneeRef+" x produit des coefs d indexation entre "+anneeRef+" et X.");
      lines.push("Si le taux de la fiche est inferieur au taux attendu -> anomalie indexation non appliquee.");
      return lines.join(" / ");
    })(),
    isBurgo?"=== CCT BURGO ARDENNES SA - Convention 2023-2024 - Index 1.89% au 01/05/2026 ===":"",
    isBurgo?"CONTINU 5 EQ taux base: T3C=22.6433 T3B=22.9252 T3A=23.4868 T2C=24.0484 T2B=24.6099 T1B=26.0171 | taux globalise: T3C=28.5845 T2C=30.2261 T1B=32.5264":"",
    isBurgo?"SEMI-CONTINU 3eq taux base: T3C=21.9738 T4C=21.1681 T5C=19.5568 O6A=19.0212":"",
    isBurgo?"JOURNEE taux base: T3C=21.4331 T4C=20.6274 T5C=19.0159 O6A=18.4803":"",
    isBurgo?"PRIMES CONTINU 5EQ: matin=1.0652 | AM=1.0652 | AM-WE=1.6439 | nuit=4.0209 | nuit-WE=4.2566 | TOTAL cycle=357.50euros (2.1280euros/h)":"",
    isBurgo?"PRIMES SEMI-CONT WE/feries/HS: matin=1.0652 | AM=1.5560 AM-WE=1.6439 | nuit=3.5303 nuit-WE=4.2566":"",
    isBurgo?"PRIMES SEMI-CONT integrees: 2eq=1.3175euros/h | 3eq=1.8860euros/h":"",
    isBurgo?"ANCIENNETE cumul: 1-5ans=0.0928 | 5-10ans=0.1855 | 10-15ans=0.4622 | 15-20ans=0.5550 | 20-25ans=0.6477 | 25+ans=0.6875":"",
    isBurgo?"PRIMES SPECIALES: rappel factionnaire+JCD=72.44euros | prolongation=36.26euros | astreinte=343.10euros/7j":"",
    isBurgo?"Transition salariale 2025-2026. Deglobalisation prevue 01/01/2027.":"",
    isBurgo&&ly?"Tickets "+year+": "+ly.tk:"",
    ly?"ANNEE "+year+": "+ly.note:"",
    yearTo&&yearTo!==year?"=== EVOLUTIONS LEGALES SUR LA PERIODE ===":"",
    yearTo&&yearTo!==year?(function(){var lines: string[]=[];for(var y=year;y<=yearTo;y++){var l=LEGAL[y];if(l)lines.push(y+": formation "+l.j+"j | "+l.nuit.substring(0,30)+" | tickets "+l.tk);}return lines.join(" / ");})():"",
    yearTo&&yearTo!==year?"Applique les regles de chaque annee selon la date de la fiche.":"",
    "MODE: "+modeStr,
    "4 etapes: 1.EXTRACTION salaire/heures/taux/primes 2.AUDIT taux+majorations legales 3.COMPTEURS repos/recuperation 4.FORMATION: les jours de formation ne figurent PAS sur la fiche de paie. Marquer toujours NON VERIFIABLE SUR FICHE - a controler registre RH. Signaler uniquement si code formation visible sur la fiche."];
  return lines.filter(function(l){return l;}).join("\n");
}

export function makeP2(mode: string, co: CompanyConfig, year: number): string {
  var cp=CP[co.cp]||CP["autre"];
  return "Expert droit social belge. "+co.name+" | "+cp.label+(year?" | "+year:"")+" | IMPORTANT: extrait la date de la periode de paie (mois + annee) depuis la fiche et mets-la dans periode_paie."
    +"\nJSON valide uniquement. { au debut, } a la fin."
    +'\n{"worker":{"name":"","cp":"","regime":"","anciennete":""},'
    +'"conformite_globale":"CONFORME ou RISQUE MODERE ou NON CONFORME ou PRETE A EMETTRE",'
    +'"score":0,"periode_paie":{"mois":"string ex: juin","annee":2024},"risque_financier_estime":"euros CE TRAVAILLEUR uniquement",'
    +'"passif_par_travailleur":[{"poste":"","montant_mensuel":"","montant_total_5ans":""}],'
    +'"alertes":[{"type":"CRITIQUE ou ATTENTION","titre":"","detail":"","montant_estime":"","base_legale":"","niveau":"LOI ou CP ou CCT-ENTREPRISE"}],'
    +'"points_conformes":[""],"recommandations":[""],"note_contexte":""}';
}

// =============================================
// Appel API — proxy vers la route serveur Next.js
// La cle Anthropic reste dans ANTHROPIC_API_KEY (.env.local), jamais exposee au client.
// =============================================

export async function callAPI(system: string, userMsg: any): Promise<string> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages: [{ role: "user", content: userMsg }] }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Erreur serveur ${response.status}${text ? ": " + text.slice(0, 200) : ""}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "API error");
  return (data.content || []).map((b: any) => b.text || "").join("");
}

export async function analyzeSingle(
  b64: string | null,
  fname: string,
  mode: string,
  co: CompanyConfig,
  year: number,
  yearTo?: number
): Promise<AuditResult> {
  const sys1 = makeP1(mode, co, year, yearTo);
  const msg1 = b64
    ? [{ type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }, { type: "text", text: "Analyse cette fiche de paie." }]
    : [{ type: "text", text: mode === "retro" ? "FICHE DEMO RETRO" : "FICHE DEMO PREVENTIF" }];

  const reasoning = await callAPI(sys1, msg1);
  const rShort = reasoning.length > 3000 ? reasoning.slice(0, 3000) + "..." : reasoning;
  const txt = await callAPI(makeP2(mode, co, year), "JSON uniquement base sur:\n\n" + rShort);

  const js = txt.indexOf("{");
  const je = txt.lastIndexOf("}");
  if (js < 0 || je < 0 || je < js) throw new Error("Réponse API invalide — JSON attendu");
  const parsed: AuditResult = JSON.parse(txt.slice(js, je + 1));

  parsed._reasoning = reasoning;
  parsed._year = parsed.periode_paie?.annee && !isNaN(parseInt(String(parsed.periode_paie.annee)))
    ? parseInt(String(parsed.periode_paie.annee))
    : year;
  parsed._month = parsed.periode_paie?.mois || "";
  parsed._filename = fname;
  parsed._confidence = !parsed.worker?.name ? 60 : typeof parsed.score !== "number" ? 70 : 90;
  parsed._warnings = checkCoherence(parsed);

  return parsed;
}
