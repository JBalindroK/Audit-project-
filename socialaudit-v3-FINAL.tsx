import { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const C={
  navy:"#0F1F3D",navyMid:"#162B4A",navyLight:"#1E3A5F",
  steel:"#2C4A6E",steelL:"#3D6494",
  accent:"#F5A623",accentL:"#F7C05A",accentD:"#D4891A",
  danger:"#C0392B",dangerL:"#FDECEA",dangerM:"#E74C3C",
  warn:"#E67E22",warnL:"#FEF3E2",
  ok:"#1A7A4A",okL:"#E8F5EE",okM:"#27AE60",
  g50:"#FAFBFC",g100:"#F4F6F8",g200:"#E8ECF1",g300:"#C8D0D8",
  g400:"#9AAAB8",g500:"#6B7D8E",g600:"#4A5D6E",g700:"#2E404F",
  white:"#FFFFFF",
  shadow:"rgba(15,31,61,0.08)",shadowM:"rgba(15,31,61,0.16)",
};

function parseEuros(s){
  var m=(s||"0").match(/[\d][\d .,]*/);
  if(!m)return 0;
  var n=m[0].replace(/[\s.,]+$/,"");
  if(/^\d+\.\d{3}$/.test(n))return parseFloat(n.replace(".",""));
  if(/^\d{1,3}(\.\d{3})*,\d{1,2}$/.test(n))return parseFloat(n.replace(/\./g,"").replace(",","."));
  if(/^\d{1,3}(,\d{3})+$/.test(n))return parseFloat(n.replace(/,/g,""));
  if(/^\d{1,3}( \d{3})+$/.test(n))return parseFloat(n.replace(/ /g,""));
  if(/^\d+\.\d{1,2}$/.test(n))return parseFloat(n);
  return parseFloat(n.replace(/[\s.]/g,"").replace(",","."))||0;
}

function checkCoherence(parsed){
  var warnings=[];
  (parsed.passif_par_travailleur||[]).forEach(function(p){
    var mensuel=parseEuros(p.montant_mensuel);
    var total=parseEuros(p.montant_total_5ans);
    if(mensuel>0&&total>0){
      var ratio=total/mensuel;
      if(ratio>72)warnings.push("Incoherence: "+p.poste+" - total semble trop eleve ("+ratio.toFixed(0)+"x mensuel)");
      if(ratio<1)warnings.push("Incoherence: "+p.poste+" - total inferieur au mensuel");
    }
  });
  if(parsed.conformite_globale==="CONFORME"&&(parsed.alertes||[]).some(function(a){return a.type==="CRITIQUE";}))
    warnings.push("Incoherence: fiche CONFORME avec alertes CRITIQUE");
  if(parsed.score>80&&(parsed.alertes||[]).filter(function(a){return a.type==="CRITIQUE";}).length>1)
    warnings.push("Incoherence: score "+parsed.score+"/100 avec plusieurs alertes CRITIQUE");
  return warnings;
}
function ScoreCircle(props) {
  var s=props.score||0;var size=props.size||80;var stroke=props.stroke||6;
  var r=(size-stroke*2)/2;var circ=2*Math.PI*r;
  var pct=Math.max(0,Math.min(100,s));var offset=circ*(1-pct/100);
  var col=s>=80?C.ok:s>=50?C.warn:C.danger;
  return <div style={{position:"relative",width:size,height:size,display:"inline-flex",alignItems:"center",justifyContent:"center"}}>
    <svg width={size} height={size} style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.g200} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"/>
    </svg>
    <div style={{textAlign:"center"}}>
      <div style={{fontSize:size*0.28,fontWeight:800,color:col,lineHeight:1}}>{s}</div>
      <div style={{fontSize:size*0.14,color:C.g500,fontWeight:600,lineHeight:1.2}}>/100</div>
    </div>
  </div>;
}
function isOldWindows() {
  try {
    var ua=navigator.userAgent;
    if(ua.indexOf("Windows NT 6")>=0)return true;
    if(ua.indexOf("Windows NT 5")>=0)return true;
    return false;
  } catch(e){return false;}
}
var OLD_WIN=isOldWindows();
function Ico(props) {
  var sz=props.size||20;
  if(OLD_WIN){
    var fb={search:"[R]",check:"[OK]",chart:"[D]",warning:"!",
            scale:"SA",settings:"cfg",refresh:"[C]",sun:"[J]",
            briefcase:"[E]",file:"[F]",ok:"v",building:"[B]"};
    return <span style={{fontSize:sz*0.7,fontWeight:700}}>{fb[props.name]||"?"}</span>;
  }
  var em={
    search:"\uD83D\uDD0D",check:"\u2705",chart:"\uD83D\uDCCA",warning:"\u26A0\uFE0F",scale:"\u2696\uFE0F",
    settings:"\u2699\uFE0F",refresh:"\uD83D\uDD04",sun:"\u2600\uFE0F",briefcase:"\uD83D\uDCBC",
    file:"\uD83D\uDCC4",ok:"\u2713",building:"\uD83C\uDFDB\uFE0F"
  };
  return <span style={{fontSize:sz,lineHeight:1,display:"inline-block"}}>{em[props.name]||"?"}</span>;
}
function scoreC(s){return s>=80?C.ok:s>=50?C.warn:C.danger;}

const CP={
  "129":{label:"CP 129 - Papier/Carton",legal:"CP 129: indexation trimestrielle. Sursalaire dim/feries +100%. Heures sup +50%. Formation 5j/an.",
    profiles:[{id:"c5",label:"Continu 5 eq.",icon:"🔄",nb:"",risk:"ELEVE",rc:"#C0392B"},{id:"sc",label:"Semi-continu 3 eq.",icon:"🔁",nb:"",risk:"MODERE",rc:"#E67E22"},{id:"j",label:"Journee fixe",icon:"☀️",nb:"",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"",risk:"FAIBLE",rc:"#1A7A4A"}]},
  "111":{label:"CP 111 - Metallurgie",legal:"CP 111: min 15.96euros/h. +2.72% juil 2025. Sursalaire +100% dim. Formation 5j/an.",
    profiles:[{id:"t3",label:"Equipes 3x8",icon:"🔄",nb:"",risk:"ELEVE",rc:"#C0392B"},{id:"j",label:"Journee",icon:"☀️",nb:"",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"",risk:"FAIBLE",rc:"#1A7A4A"}]},
  "autre":{label:"Autre CP",legal:"Loi belge: sursalaire +100% dim/feries. Heures sup +50%. Formation 5j/an.",
    profiles:[{id:"eq",label:"Equipes",icon:"🔄",nb:"",risk:"ELEVE",rc:"#C0392B"},{id:"j",label:"Journee",icon:"☀️",nb:"",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"",risk:"FAIBLE",rc:"#1A7A4A"}]},
};

const INDEXATIONS={
  "129":{
    nom:"CP 129 - Papier/Carton",
    type:"selon convention collective",
    note:"Taux fixes au niveau entreprise (CCT Burgo). Convention 2023-2024 avec index 1.89% au 01/05/2026.",
    historique:[
      {date:"2022-01-01",coef:1.0000,pct:0.00,note:"Base reference 2022"},
      {date:"2022-07-01",coef:1.0322,pct:3.22,note:"Indexation juil 2022"},
      {date:"2023-01-01",coef:1.0457,pct:1.31,note:"Indexation jan 2023"},
      {date:"2023-07-01",coef:1.0510,pct:0.52,note:"Indexation juil 2023"},
      {date:"2024-05-01",coef:1.0733,pct:2.12,note:"Indexation mai 2024"},
      {date:"2026-05-01",coef:1.0936,pct:1.89,note:"Index 1.89% CCT 2023-2024 - au 01/05/2026 - CONFIRME CCT"},
    ],
  },
  "111":{
    nom:"CP 111 - Metallurgie",
    type:"annuelle juillet",
    note:"Bareme minimum sectoriel fixe annuellement",
    historique:[
      {date:"2022-01-01",coef:1.0000,pct:0.00,note:"Base 2022"},
      {date:"2022-07-01",coef:1.0396,pct:3.96,note:"Indexation juil 2022"},
      {date:"2023-07-01",coef:1.0507,pct:1.07,note:"Indexation juil 2023"},
      {date:"2024-07-01",coef:1.0686,pct:1.70,note:"Indexation juil 2024"},
      {date:"2025-07-01",coef:1.0979,pct:2.72,note:"Indexation juil 2025"},
      {date:"2026-07-01",coef:1.0979,pct:0.00,note:"A confirmer"},
    ],
  },
  "autre":{
    nom:"Autre CP",
    type:"selon CCT",
    note:"Renseignez les indexations manuellement",
    historique:[
      {date:"2022-01-01",coef:1.0000,pct:0.00,note:"Base - a remplir"},
    ],
  },
};

const LEGAL={
  2022:{j:0,f:"Pas d obligation formation",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Pre-Deal emploi."},
  2023:{j:4,f:"4 jours/an (Deal emploi)",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Premier exercice 4j formation."},
  2024:{j:5,f:"5 jours/an depuis 01/01/2024",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Obligation 5j plein regime."},
  2025:{j:5,f:"5 jours/an (Deal emploi)",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Verifier indexations CP 129."},
  2026:{j:5,f:"5 jours/an (Deal emploi)",nuit:"Minimum 1.51euros/h depuis jan 2026",tk:"10euros depuis 01/06/2026",note:"Prime nuit 1.51 depuis jan. Tickets 10 depuis juin."},
};

const DEF={name:"Burgo Ardennes S.A.",num:"0451.821.842",cp:"129",workers:"596",country:"BE",
  profiles:[{id:"c5",label:"Continu 5 eq.",icon:"🔄",nb:"340",risk:"ELEVE",rc:"#C0392B"},{id:"sc",label:"Semi-continu 3 eq.",icon:"🔁",nb:"100",risk:"MODERE",rc:"#E67E22"},{id:"j",label:"Journee fixe",icon:"☀️",nb:"96",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"60",risk:"FAIBLE",rc:"#1A7A4A"}],
  recipients:[{id:"rh",label:"Responsable RH",email:"rh@burgo-ardennes.be",active:true},{id:"dir",label:"Direction",email:"",active:false}],
  grille:{
    annee:2024,
    anneeReference:2024,
    categories:[
      {id:"c5_t3c",label:"Continu 5 eq. - T3C/O3C",tauxBase:22.6433,tauxGlobalise:28.5845,regime:"continu"},
      {id:"c5_t3b",label:"Continu 5 eq. - T3B/O3B",tauxBase:22.9252,tauxGlobalise:28.9138,regime:"continu"},
      {id:"c5_t3a",label:"Continu 5 eq. - T3A/O3A",tauxBase:23.4868,tauxGlobalise:29.5700,regime:"continu"},
      {id:"c5_t2c",label:"Continu 5 eq. - T2C/O2C",tauxBase:24.0484,tauxGlobalise:30.2261,regime:"continu"},
      {id:"c5_t2b",label:"Continu 5 eq. - T2B/O2B",tauxBase:24.6099,tauxGlobalise:30.8822,regime:"continu"},
      {id:"c5_t1b",label:"Continu 5 eq. - T1B/O1B",tauxBase:26.0171,tauxGlobalise:32.5264,regime:"continu"},
      {id:"sc3_t3c",label:"Semi-continu 3 eq. - T3C/O3C",tauxBase:21.9738,tauxMinore:19.7764,regime:"semi"},
      {id:"sc3_t4c",label:"Semi-continu 3 eq. - T4C/O4C",tauxBase:21.1681,tauxMinore:19.0513,regime:"semi"},
      {id:"sc3_t5c",label:"Semi-continu 3 eq. - T5C/O5C",tauxBase:19.5568,tauxMinore:17.6011,regime:"semi"},
      {id:"j_t3c",label:"Journee - T3C/O3C",tauxBase:21.4331,tauxMinore:19.2898,regime:"jour"},
      {id:"j_t4c",label:"Journee - T4C/O4C",tauxBase:20.6274,tauxMinore:18.5647,regime:"jour"},
      {id:"j_t5c",label:"Journee - T5C/O5C",tauxBase:19.0159,tauxMinore:17.1143,regime:"jour"},
      {id:"j_o6a",label:"Journee - O6A",tauxBase:18.4803,tauxMinore:16.6323,regime:"jour"},
    ],
    primesEquipe:{
      nuitSem:4.0209,nuitWE:4.2566,matin:1.0652,apresMidi:1.0652,apresMidiWE:1.6439,semiNuit:3.5303,semiNuitWE:4.2566,semiMatin:1.0652,semiApMidi:1.5560,semiApMidiWE:1.6439,
      integre3eq:1.8860,integre2eq:1.3175,
    },
    primesAnciennete:[
      {de:0,a:1,increment:0.0000,cumul:0.0000},
      {de:1,a:5,increment:0.0928,cumul:0.0928},
      {de:5,a:10,increment:0.0928,cumul:0.1855},
      {de:10,a:15,increment:0.0000,cumul:0.4622},
      {de:15,a:20,increment:0.0928,cumul:0.5550},
      {de:20,a:25,increment:0.0928,cumul:0.6477},
      {de:25,a:999,increment:0.0398,cumul:0.6875},
    ],
    heuresMois:{
      "c5":{normal:52,nuitSem:52,nuitWE:26,dim:13,feries:8,heuresSup:2},
      "sc":{normal:78,nuitSem:26,nuitWE:13,dim:8,feries:4,heuresSup:1},
      "j":{normal:156,nuitSem:0,nuitWE:0,dim:0,feries:4,heuresSup:2},
    },
  },
};

const GRILLE_PAR_ANNEE={
  2022:{categories:[
    {id:"c5_t3c",tauxBase:21.3694,tauxGlobalise:26.9350},{id:"c5_t3b",tauxBase:21.6282,tauxGlobalise:27.2632},{id:"c5_t3a",tauxBase:22.1138,tauxGlobalise:27.8860},{id:"c5_t2c",tauxBase:22.6653,tauxGlobalise:28.5845},{id:"c5_t2b",tauxBase:23.2021,tauxGlobalise:29.2040},{id:"c5_t1b",tauxBase:24.5296,tauxGlobalise:30.8983},
    {id:"sc3_t3c",tauxBase:20.7257,tauxMinore:18.6531},{id:"sc3_t4c",tauxBase:19.9475,tauxMinore:17.9528},{id:"sc3_t5c",tauxBase:18.4360,tauxMinore:16.5924},
    {id:"j_t3c",tauxBase:20.2099,tauxMinore:18.1889},{id:"j_t4c",tauxBase:19.4368,tauxMinore:17.4931},{id:"j_t5c",tauxBase:17.9254,tauxMinore:16.1329},{id:"j_o6a",tauxBase:17.4130,tauxMinore:15.6717},
  ]},
  2023:{categories:[
    {id:"c5_t3c",tauxBase:21.7619,tauxGlobalise:27.4208},{id:"c5_t3b",tauxBase:22.0272,tauxGlobalise:27.7590},{id:"c5_t3a",tauxBase:22.5221,tauxGlobalise:28.3907},{id:"c5_t2c",tauxBase:23.0825,tauxGlobalise:29.0910},{id:"c5_t2b",tauxBase:23.5282,tauxGlobalise:29.6654},{id:"c5_t1b",tauxBase:24.9800,tauxGlobalise:31.4723},
    {id:"sc3_t3c",tauxBase:21.1037,tauxMinore:18.9933},{id:"sc3_t4c",tauxBase:20.3126,tauxMinore:18.2813},{id:"sc3_t5c",tauxBase:18.7680,tauxMinore:16.8912},
    {id:"j_t3c",tauxBase:20.5772,tauxMinore:18.5195},{id:"j_t4c",tauxBase:19.7894,tauxMinore:17.8105},{id:"j_t5c",tauxBase:18.2416,tauxMinore:16.4174},{id:"j_o6a",tauxBase:17.7143,tauxMinore:15.9429},
  ]},
  2024:{categories:[
    {id:"c5_t3c",tauxBase:22.2233,tauxGlobalise:28.0090},{id:"c5_t3b",tauxBase:22.4955,tauxGlobalise:28.3560},{id:"c5_t3a",tauxBase:22.9985,tauxGlobalise:28.9993},{id:"c5_t2c",tauxBase:23.5653,tauxGlobalise:29.7154},{id:"c5_t2b",tauxBase:24.0045,tauxGlobalise:30.2697},{id:"c5_t1b",tauxBase:25.5091,tauxGlobalise:32.1383},
    {id:"sc3_t3c",tauxBase:21.5523,tauxMinore:19.3971},{id:"sc3_t4c",tauxBase:20.7377,tauxMinore:18.6639},{id:"sc3_t5c",tauxBase:19.1492,tauxMinore:17.2343},
    {id:"j_t3c",tauxBase:21.0105,tauxMinore:18.9095},{id:"j_t4c",tauxBase:20.2008,tauxMinore:18.1807},{id:"j_t5c",tauxBase:18.6161,tauxMinore:16.7545},{id:"j_o6a",tauxBase:18.0824,tauxMinore:16.2742},
  ]},
  2025:{categories:[
    {id:"c5_t3c",tauxBase:22.2233,tauxGlobalise:28.0090},{id:"c5_t3b",tauxBase:22.4955,tauxGlobalise:28.3560},{id:"c5_t3a",tauxBase:22.9985,tauxGlobalise:28.9993},{id:"c5_t2c",tauxBase:23.5653,tauxGlobalise:29.7154},{id:"c5_t2b",tauxBase:24.0045,tauxGlobalise:30.2697},{id:"c5_t1b",tauxBase:25.5091,tauxGlobalise:32.1383},
    {id:"sc3_t3c",tauxBase:21.5523,tauxMinore:19.3971},{id:"sc3_t4c",tauxBase:20.7377,tauxMinore:18.6639},{id:"sc3_t5c",tauxBase:19.1492,tauxMinore:17.2343},
    {id:"j_t3c",tauxBase:21.0105,tauxMinore:18.9095},{id:"j_t4c",tauxBase:20.2008,tauxMinore:18.1807},{id:"j_t5c",tauxBase:18.6161,tauxMinore:16.7545},{id:"j_o6a",tauxBase:18.0824,tauxMinore:16.2742},
  ]},
  2026:{categories:[
    {id:"c5_t3c",tauxBase:22.6433,tauxGlobalise:28.5845},{id:"c5_t3b",tauxBase:22.9252,tauxGlobalise:28.9138},{id:"c5_t3a",tauxBase:23.4868,tauxGlobalise:29.5700},{id:"c5_t2c",tauxBase:24.0484,tauxGlobalise:30.2261},{id:"c5_t2b",tauxBase:24.6099,tauxGlobalise:30.8822},{id:"c5_t1b",tauxBase:26.0171,tauxGlobalise:32.5264},
    {id:"sc3_t3c",tauxBase:21.9738,tauxMinore:19.7764},{id:"sc3_t4c",tauxBase:21.1681,tauxMinore:19.0513},{id:"sc3_t5c",tauxBase:19.5568,tauxMinore:17.6011},
    {id:"j_t3c",tauxBase:21.4331,tauxMinore:19.2898},{id:"j_t4c",tauxBase:20.6274,tauxMinore:18.5647},{id:"j_t5c",tauxBase:19.0159,tauxMinore:17.1143},{id:"j_o6a",tauxBase:18.4803,tauxMinore:16.6323},
  ]},
};
const DEMO=[
  {id:"lejeune",label:"Marc Lejeune",sub:"Continu 5 eq. - Juin 2024",tag:"NON CONFORME",tc:"#C0392B",score:18,ficheYear:2024,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Marc Lejeune",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"11 ans"},conformite_globale:"NON CONFORME",score:18,
    risque_financier_estime:"44.460 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Prime nuit semaine manquante",montant_mensuel:"209 euros",montant_total_5ans:"12.540 euros"},{poste:"Sursalaire dimanche absent",montant_mensuel:"322 euros",montant_total_5ans:"19.320 euros"},{poste:"Sursalaire feries absent",montant_mensuel:"198 euros",montant_total_5ans:"11.880 euros"},{poste:"Base heures sup incorrecte",montant_mensuel:"12 euros",montant_total_5ans:"720 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Taux globalise non decompose",detail:"Taux 24.80euros/h sans decomposition. CCT 2025-2026 prevoit une periode de transition.",montant_estime:"22.540 euros",base_legale:"CCT Burgo + Loi 1971 art.29",niveau:"CCT-ENTREPRISE"},{type:"CRITIQUE",titre:"Sursalaire dim/feries absent",detail:"13h dim + 8h feries sans sursalaire +100%.",montant_estime:"520 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"},{type:"ATTENTION",titre:"Formation insuffisante",detail:"2j sur 5j requis en 2024.",montant_estime:"-",base_legale:"Loi Deal emploi 03/10/2022",niveau:"LOI"}],
    points_conformes:["ONSS calcule correctement","Heures totales coherentes"],
    recommandations:["Decomposer le taux globalise","Ajouter sursalaires dim/feries","Regulariser 38h recuperation"],
    note_contexte:"CCT Burgo: transition salariale en cours. Deglobalisation prevue 01/01/2027.",_confidence:85}},
  {id:"renard",label:"Sophie Renard",sub:"Semi-continu - Jan. 2025",tag:"RISQUE MODERE",tc:"#E67E22",score:52,ficheYear:2025,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Sophie Renard",cp:"CP 129",regime:"Semi-continu 3 equipes",anciennete:"6 ans"},conformite_globale:"RISQUE MODERE",score:52,
    risque_financier_estime:"768 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Indexation CP 129 2024 non appliquee (+2.12%)",montant_mensuel:"64 euros",montant_total_5ans:"768 euros"}],
    alertes:[{type:"ATTENTION",titre:"Indexation 2024 non appliquee",detail:"Taux 19.40 inchange. Du: 19.81euros/h. Manque 64 euros/mois.",montant_estime:"64 euros/mois",base_legale:"CP 129 indexation trimestrielle",niveau:"CP"},{type:"ATTENTION",titre:"Formation insuffisante 2024",detail:"3j sur 5j requis.",montant_estime:"-",base_legale:"Loi Deal emploi 03/10/2022",niveau:"LOI"}],
    points_conformes:["Plan formation 2025 depose","ONSS correct","Heures sup correctes"],
    recommandations:["Corriger taux: 19.81euros/h","Regulariser ecart 384 euros"],
    note_contexte:"Indexation manquante souvent invisible. Facile a regulariser.",_confidence:88}},
  {id:"fontaine",label:"Didier Fontaine",sub:"Continu 5 eq. - Mars 2027",tag:"CONFORME",tc:"#1A7A4A",score:97,ficheYear:2027,ficheMode:"preventif",ficheType:"direct",
   analyse:{worker:{name:"Didier Fontaine",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"14 ans"},conformite_globale:"PRETE A EMETTRE",score:97,
    risque_financier_estime:"0 euros - fiche conforme",passif_par_travailleur:[],alertes:[],
    points_conformes:["Taux base 18.20euros/h correct","Primes decomposees CCT art.3","Sursalaire dim +100% sur taux BASE","Formation 5j planifiee","Tickets 10euros conformes CCT"],
    recommandations:["Maintenir ce niveau","Verifier indexation prochain trimestre"],
    note_contexte:"Fiche exemplaire post-deglobalisation.",_confidence:98}},
  {id:"martin2027",label:"Julie Martin",sub:"Journee fixe - Jan. 2027",tag:"RISQUE MODERE",tc:"#E67E22",score:61,ficheYear:2027,ficheMode:"preventif",ficheType:"direct",
   analyse:{worker:{name:"Julie Martin",cp:"CP 129",regime:"Journee fixe",anciennete:"3 ans"},conformite_globale:"RISQUE MODERE",score:61,_year:2027,
    risque_financier_estime:"1.920 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Tickets restaurant sous-evalues (8 vs 10euros)",montant_mensuel:"32 euros",montant_total_5ans:"384 euros"},{poste:"Indexation CP 129 jan 2027 non appliquee",montant_mensuel:"128 euros",montant_total_5ans:"1.536 euros"}],
    alertes:[{type:"ATTENTION",titre:"Tickets restaurant 8euros au lieu de 10euros",detail:"CCT Burgo art.5 prevoit 10euros depuis 01/06/2026. Fiche encore a 8euros.",montant_estime:"32 euros/mois",base_legale:"CCT Burgo 2025-2026 art.5",niveau:"CCT-ENTREPRISE"},{type:"ATTENTION",titre:"Indexation jan 2027 non appliquee",detail:"Nouvelle indexation CP 129 applicable depuis 01/01/2027 non repercutee.",montant_estime:"128 euros/mois",base_legale:"CP 129 indexation trimestrielle",niveau:"CP"}],
    points_conformes:["Formation 5j planifiee","ONSS calcule correctement","Heures standard conformes"],
    recommandations:["Corriger tickets a 10euros","Appliquer indexation jan 2027"],
    note_contexte:"Deux corrections mineures post-deglobalisation. Facile a regulariser.",_confidence:90}},
  {id:"dupont2027",label:"Pierre Dupont",sub:"Continu 5 eq. - Fev. 2027",tag:"NON CONFORME",tc:"#C0392B",score:22,ficheYear:2027,ficheMode:"preventif",ficheType:"direct",
   analyse:{worker:{name:"Pierre Dupont",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"7 ans"},conformite_globale:"NON CONFORME",score:22,_year:2027,
    risque_financier_estime:"38.400 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Prime nuit CCT n49 non appliquee (1.51euros/h)",montant_mensuel:"157 euros",montant_total_5ans:"1.884 euros"},{poste:"Sursalaire dimanche base globalise",montant_mensuel:"298 euros",montant_total_5ans:"17.880 euros"},{poste:"Sursalaire feries base globalise",montant_mensuel:"187 euros",montant_total_5ans:"11.220 euros"},{poste:"Base heures sup globalise non decompose",montant_mensuel:"124 euros",montant_total_5ans:"7.416 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Prime nuit CCT n49 absente",detail:"Minimum 1.51euros/h obligatoire depuis jan 2026 pour heures entre 22h-6h. Absent de la fiche.",montant_estime:"157 euros/mois",base_legale:"CCT interprofessionnelle n49 - jan 2026",niveau:"LOI"},{type:"CRITIQUE",titre:"Sursalaires dim/feries sur base globalise",detail:"Taux globalise encore utilise en fev 2027 post-deglobalisation. Sursalaires doivent etre calcules sur taux BASE uniquement.",montant_estime:"485 euros/mois",base_legale:"Loi 16/03/1971 art.29 + CCT Burgo art.2",niveau:"CCT-ENTREPRISE"},{type:"ATTENTION",titre:"Deglobalisation non appliquee",detail:"CCT Burgo prevoyait transition au 01/01/2027. Fiche de fev 2027 encore en mode globalise.",montant_estime:"-",base_legale:"CCT Burgo 2025-2026 art.2",niveau:"CCT-ENTREPRISE"}],
    points_conformes:["ONSS calcule sur bons montants","Tickets 10euros conformes","Formation 5j OK"],
    recommandations:["Appliquer deglobalisation immediatement","Ajouter prime nuit 1.51euros/h","Recalculer sursalaires sur taux BASE"],
    note_contexte:"Fiche post-deglobalisation non conforme. La CCT Burgo imposait la transition au 01/01/2027.",_confidence:87}},
  {id:"lejeune2026",label:"Marc Lejeune",sub:"Continu 5 eq. - Dec. 2026",tag:"NON CONFORME",tc:"#C0392B",score:25,ficheYear:2026,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Marc Lejeune",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"13 ans"},conformite_globale:"NON CONFORME",score:25,_year:2026,
    risque_financier_estime:"41.520 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Sursalaire dimanche base globalise",montant_mensuel:"322 euros",montant_total_5ans:"19.320 euros"},{poste:"Sursalaire feries base globalise",montant_mensuel:"198 euros",montant_total_5ans:"11.880 euros"},{poste:"Prime nuit CCT n49 absente depuis jan 2026",montant_mensuel:"157 euros",montant_total_5ans:"1.884 euros"},{poste:"Base heures sup incorrecte",montant_mensuel:"12 euros",montant_total_5ans:"720 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Prime nuit 1.51euros/h absente",detail:"CCT n49 impose 1.51euros/h depuis jan 2026 pour heures 22h-6h. Absent de la fiche dec 2026.",montant_estime:"157 euros/mois",base_legale:"CCT interprofessionnelle n49 jan 2026",niveau:"LOI"},{type:"CRITIQUE",titre:"Sursalaires encore sur base globalise",detail:"Taux globalise toujours utilise en dec 2026. Deglobalisation prevue 01/01/2027.",montant_estime:"520 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"},{type:"ATTENTION",titre:"Tickets encore a 8euros",detail:"CCT Burgo art.5 prevoit 10euros depuis 01/06/2026. Dec 2026 encore a 8euros.",montant_estime:"24 euros/mois",base_legale:"CCT Burgo 2025-2026 art.5",niveau:"CCT-ENTREPRISE"}],
    points_conformes:["Formation 5j completee","ONSS correct"],
    recommandations:["Ajouter prime nuit 1.51euros/h","Corriger tickets a 10euros","Preparer deglobalisation jan 2027"],
    note_contexte:"Derniere fiche avant deglobalisation. Prime nuit CCT n49 manquante depuis jan 2026.",_confidence:88}},
  {id:"lambert2022",label:"Henri Lambert",sub:"Continu 5 eq. - Oct. 2022",tag:"NON CONFORME",tc:"#C0392B",score:20,ficheYear:2022,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Henri Lambert",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"8 ans"},conformite_globale:"NON CONFORME",score:20,_year:2022,
    risque_financier_estime:"31.560 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Sursalaire dimanche absent",montant_mensuel:"298 euros",montant_total_5ans:"17.880 euros"},{poste:"Sursalaire feries absent",montant_mensuel:"187 euros",montant_total_5ans:"11.220 euros"},{poste:"Indexation juil 2022 non appliquee (+3.22%)",montant_mensuel:"41 euros",montant_total_5ans:"2.460 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Sursalaires dim/feries absents",detail:"Taux globalise 23.10euros/h. Aucun sursalaire +100% dim/feries sur taux base.",montant_estime:"485 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"},{type:"CRITIQUE",titre:"Indexation juil 2022 non appliquee",detail:"CCT CP 129 prevoyait +3.22% en juil 2022. Taux inchange depuis jan 2022.",montant_estime:"41 euros/mois",base_legale:"CP 129 indexation trimestrielle",niveau:"CP"}],
    points_conformes:["ONSS correct","Heures totales coherentes","Formation non verifiable sur fiche"],
    recommandations:["Appliquer indexation +3.22% juil 2022","Decomposer taux globalise","Ajouter sursalaires dim/feries"],
    note_contexte:"Premiere annee avec indexation significative. Taux non mis a jour.",_confidence:85}},
  {id:"simon2023",label:"Alain Simon",sub:"Semi-continu - Avr. 2023",tag:"RISQUE MODERE",tc:"#E67E22",score:55,ficheYear:2023,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Alain Simon",cp:"CP 129",regime:"Semi-continu 3 equipes",anciennete:"4 ans"},conformite_globale:"RISQUE MODERE",score:55,_year:2023,
    risque_financier_estime:"2.244 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Indexation jan 2023 non appliquee (+1.31%)",montant_mensuel:"21 euros",montant_total_5ans:"1.260 euros"},{poste:"Indexation juil 2023 non appliquee (+0.52%)",montant_mensuel:"8 euros",montant_total_5ans:"984 euros"}],
    alertes:[{type:"ATTENTION",titre:"Double indexation 2023 manquante",detail:"Taux 19.20 inchange. Attendu apres jan 2023: 19.45 et apres juil 2023: 19.55euros/h.",montant_estime:"29 euros/mois",base_legale:"CP 129 indexation trimestrielle",niveau:"CP"}],
    points_conformes:["Sursalaire dim correct","ONSS correct","Primes semi-continu presentes","Formation non verifiable sur fiche"],
    recommandations:["Corriger taux: 19.55euros/h","Regulariser ecart depuis jan 2023"],
    note_contexte:"Deux indexations manquantes en 2023. Montant modere mais cumulable.",_confidence:88}},
  {id:"dubois2025",label:"Thomas Dubois",sub:"Journee fixe - Sep. 2025",tag:"CONFORME",tc:"#1A7A4A",score:91,ficheYear:2025,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Thomas Dubois",cp:"CP 129",regime:"Journee fixe",anciennete:"2 ans"},conformite_globale:"CONFORME",score:91,_year:2025,
    risque_financier_estime:"0 euros - fiche conforme",passif_par_travailleur:[],
    alertes:[{type:"ATTENTION",titre:"Heures sup weekend a verifier",detail:"2h samedi sans mention sursalaire. Si volontaires: +50% obligatoire.",montant_estime:"a verifier",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"}],
    points_conformes:["Taux 15.80euros/h coherent avec indexations 2025","ONSS calcule correctement","Tickets 8euros conformes 2025","Formation non verifiable sur fiche"],
    recommandations:["Verifier nature heures samedi","Documenter si volontaires"],
    note_contexte:"Fiche globalement conforme. Un point de vigilance sur les heures samedi.",_confidence:92}},
  {id:"ernst2024",label:"Klaus Ernst",sub:"Continu 5 eq. - Aout 2024",tag:"NON CONFORME",tc:"#C0392B",score:25,ficheYear:2024,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Klaus Ernst",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"19 ans"},conformite_globale:"NON CONFORME",score:25,_year:2024,
    risque_financier_estime:"52.320 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Coefficient anciennete 19 ans non applique",montant_mensuel:"312 euros",montant_total_5ans:"18.720 euros"},{poste:"Sursalaire dimanche absent",montant_mensuel:"331 euros",montant_total_5ans:"19.860 euros"},{poste:"Sursalaire feries absent",montant_mensuel:"198 euros",montant_total_5ans:"11.880 euros"},{poste:"Prime nuit sous-evaluee",montant_mensuel:"32 euros",montant_total_5ans:"1.860 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Anciennete 19 ans non appliquee",detail:"Taux identique a un nouveau. Coef anciennete 15+ ans non repercute sur taux base.",montant_estime:"312 euros/mois",base_legale:"CCT Burgo art.4 anciennete",niveau:"CCT-ENTREPRISE"},{type:"CRITIQUE",titre:"Sursalaires dim/feries absents",detail:"Taux globalise. Aucun sursalaire +100% dim/feries.",montant_estime:"529 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"}],
    points_conformes:["ONSS correct","Heures totales coherentes"],
    recommandations:["Appliquer coef anciennete 19 ans","Decomposer taux globalise","Regulariser sursalaires"],
    note_contexte:"Travailleur senior avec anciennete mal appliquee. Passif eleve.",_confidence:87}},
  {id:"petit2025",label:"Marie Petit",sub:"Employes - Mar. 2025",tag:"RISQUE MODERE",tc:"#E67E22",score:62,ficheYear:2025,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Marie Petit",cp:"CP 129",regime:"Employe bureau",anciennete:"7 ans"},conformite_globale:"RISQUE MODERE",score:62,_year:2025,
    risque_financier_estime:"1.680 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Prime fin annee proratisee incorrectement",montant_mensuel:"58 euros",montant_total_5ans:"1.680 euros"}],
    alertes:[{type:"ATTENTION",titre:"Prime fin d annee mal calculee",detail:"Prime de 852 euros. Base calcul incorrecte: devrait inclure anciennete 7 ans selon CCT.",montant_estime:"58 euros/mois en equivalent",base_legale:"CCT Burgo art.7 prime fin annee",niveau:"CCT-ENTREPRISE"},{type:"ATTENTION",titre:"Cheque repas 8euros",detail:"CCT Burgo art.5 prevoit passage a 10euros au 01/06/2026. A anticiper.",montant_estime:"-",base_legale:"CCT Burgo 2025-2026 art.5",niveau:"CCT-ENTREPRISE"}],
    points_conformes:["Taux indexe correctement","Pecule vacances correct","ONSS employe correct","Formation non verifiable sur fiche"],
    recommandations:["Recalculer prime fin annee avec anciennete","Prevoir passage tickets 10euros juin 2026"],
    note_contexte:"Profil employe - regime different des ouvriers. Primes specifiques CCT.",_confidence:90}},
  {id:"adam2023",label:"Bernard Adam",sub:"Continu 5 eq. - Juin 2023",tag:"NON CONFORME",tc:"#C0392B",score:28,ficheYear:2023,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Bernard Adam",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"23 ans"},conformite_globale:"NON CONFORME",score:28,_year:2023,
    risque_financier_estime:"48.960 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Heures sup base globalisee incorrecte",montant_mensuel:"187 euros",montant_total_5ans:"11.220 euros"},{poste:"Sursalaire dimanche absent",montant_mensuel:"322 euros",montant_total_5ans:"19.320 euros"},{poste:"Sursalaire feries absent",montant_mensuel:"198 euros",montant_total_5ans:"11.880 euros"},{poste:"Anciennete 23 ans non appliquee",montant_mensuel:"109 euros",montant_total_5ans:"6.540 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Base heures sup incorrecte",detail:"Heures sup calculees sur taux globalise 24.10. Doivent l etre sur taux BASE uniquement x 1.5.",montant_estime:"187 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"},{type:"CRITIQUE",titre:"Anciennete 23 ans ignoree",detail:"Taux identique depuis 15+ ans. Coef maximal CCT non applique.",montant_estime:"109 euros/mois",base_legale:"CCT Burgo art.4",niveau:"CCT-ENTREPRISE"},{type:"CRITIQUE",titre:"Sursalaires dim/feries absents",detail:"Aucun sursalaire malgre 13h dim et 8h feries/mois.",montant_estime:"520 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"}],
    points_conformes:["ONSS correct","Volume heures coherent"],
    recommandations:["Recalculer heures sup sur taux base","Appliquer anciennete 23 ans","Ajouter sursalaires dim/feries"],
    note_contexte:"Travailleur tres ancien avec cumul d anomalies. Passif pres de 49k euros.",_confidence:86}},
  {id:"gerard2026preventif",label:"Laura Gerard",sub:"Semi-continu - Juil. 2026",tag:"CONFORME",tc:"#1A7A4A",score:94,ficheYear:2026,ficheMode:"preventif",ficheType:"direct",
   analyse:{worker:{name:"Laura Gerard",cp:"CP 129",regime:"Semi-continu 3 equipes",anciennete:"5 ans"},conformite_globale:"PRETE A EMETTRE",score:94,_year:2026,
    risque_financier_estime:"0 euros - fiche conforme",passif_par_travailleur:[],
    alertes:[],
    points_conformes:["Taux base 16.90euros/h coherent indexations 2026","Prime nuit 1.51euros/h presente (CCT n49)","Sursalaire dim sur taux base","Tickets 10euros conformes depuis juin 2026","Formation non verifiable sur fiche"],
    recommandations:["Maintenir ce niveau","Preparer deglobalisation jan 2027"],
    note_contexte:"Fiche conforme post-CCT n49. Bon exemple de mise en conformite 2026.",_confidence:95}},
  {id:"maes2027preventif",label:"Nicolas Maes",sub:"Employe senior - Fev. 2027",tag:"RISQUE MODERE",tc:"#E67E22",score:68,ficheYear:2027,ficheMode:"preventif",ficheType:"direct",
   analyse:{worker:{name:"Nicolas Maes",cp:"CP 129",regime:"Employe bureau",anciennete:"12 ans"},conformite_globale:"RISQUE MODERE",score:68,_year:2027,
    risque_financier_estime:"2.160 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Indexation jan 2027 non appliquee",montant_mensuel:"180 euros",montant_total_5ans:"2.160 euros"}],
    alertes:[{type:"ATTENTION",titre:"Indexation jan 2027 a confirmer",detail:"Taux employe 22.40euros/h inchange depuis 2026. Verifier si indexation CP 129 jan 2027 appliquee.",montant_estime:"a confirmer",base_legale:"CP 129 indexation trimestrielle",niveau:"CP"}],
    points_conformes:["Pecule vacances correct","Prime anciennete 12 ans presente","ONSS employe correct","Tickets 10euros conformes","Formation non verifiable sur fiche"],
    recommandations:["Verifier et appliquer indexation jan 2027","Confirmer taux avec secretariat social"],
    note_contexte:"Employe senior globalement conforme. Un point d indexation a verifier.",_confidence:89}},
  {id:"collin2022",label:"Pierre Collin",sub:"Journee fixe - Mar. 2022",tag:"CONFORME",tc:"#1A7A4A",score:88,ficheYear:2022,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Pierre Collin",cp:"CP 129",regime:"Journee fixe",anciennete:"1 an"},conformite_globale:"CONFORME",score:88,_year:2022,
    risque_financier_estime:"0 euros - fiche conforme",passif_par_travailleur:[],
    alertes:[{type:"ATTENTION",titre:"Formation 2022",detail:"Obligation formation pas encore en vigueur en 2022 (Deal emploi oct 2022). Aucune anomalie.",montant_estime:"-",base_legale:"Loi Deal emploi 03/10/2022",niveau:"LOI"}],
    points_conformes:["Taux 14.20euros/h coherent 2022 avant indexation juil","ONSS correct","Heures normales conformes","Pas d obligation formation avant oct 2022"],
    recommandations:["Verifier application indexation juil 2022 sur fiches suivantes"],
    note_contexte:"Fiche debut 2022 avant indexations. Conforme pour la periode.",_confidence:91}},
  {id:"baert2024",label:"Sofie Baert",sub:"Continu 5 eq. - Jan. 2024",tag:"NON CONFORME",tc:"#C0392B",score:30,ficheYear:2024,ficheMode:"retro",ficheType:"direct",
   analyse:{worker:{name:"Sofie Baert",cp:"CP 129",regime:"Continu 5 equipes",anciennete:"6 ans"},conformite_globale:"NON CONFORME",score:30,_year:2024,
    risque_financier_estime:"39.840 euros (ce travailleur uniquement)",
    passif_par_travailleur:[{poste:"Sursalaire dimanche absent",montant_mensuel:"322 euros",montant_total_5ans:"19.320 euros"},{poste:"Sursalaire feries absent",montant_mensuel:"198 euros",montant_total_5ans:"11.880 euros"},{poste:"Indexation mai 2024 non appliquee (+2.12%)",montant_mensuel:"37 euros",montant_total_5ans:"444 euros"},{poste:"Prime nuit sous-evaluee",montant_mensuel:"69 euros",montant_total_5ans:"828 euros"},{poste:"Base heures sup incorrecte",montant_mensuel:"12 euros",montant_total_5ans:"144 euros"}],
    alertes:[{type:"CRITIQUE",titre:"Sursalaires dim/feries absents",detail:"Taux globalise. 13h dim + 8h feries sans sursalaire +100%.",montant_estime:"520 euros/mois",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"},{type:"CRITIQUE",titre:"Indexation mai 2024 non appliquee",detail:"CCT CP 129 +2.12% depuis mai 2024. Taux inchange depuis 2023.",montant_estime:"37 euros/mois",base_legale:"CP 129 indexation trimestrielle",niveau:"CP"},{type:"ATTENTION",titre:"Prime nuit sous-evaluee",detail:"Prime nuit semaine 3.50euros/h. CCT Burgo prevoit 4.0209euros/h.",montant_estime:"69 euros/mois",base_legale:"CCT Burgo art.3 primes equipe",niveau:"CCT-ENTREPRISE"}],
    points_conformes:["ONSS correct","Volume heures coherent"],
    recommandations:["Appliquer indexation +2.12% mai 2024","Decomposer taux globalise","Corriger prime nuit a 4.0209euros/h"],
    note_contexte:"Fiche jan 2024. Indexation mai 2024 pas encore due mais taux de base deja sous-evalue.",_confidence:88}},
    {id:"hugo2025interim",label:"Adam Hugo",sub:"CP 322 Randstad - Jan-Juin 2026",tag:"VERIFICATION REQUISE",tc:"#E67E22",score:65,ficheYear:2026,ficheMode:"retro",ficheType:"interim",
   analyse:{worker:{name:"Adam Hugo",cp:"CP 322",regime:"Ouvrier production interim - qualification variable (standard + massicot)",anciennete:"4 ans (depuis 05/04/2022)"},conformite_globale:"RISQUE MODERE",score:65,_year:2026,
    risque_financier_estime:"4.83 a 14.32 euros (jan-juin 2026) - a confirmer selon poste occupe",
    passif_par_travailleur:[
      {poste:"Sem 21 mai (19-22/05): P10 4h sur taux 19.5568 alors que taux 21.9738 present",montant_mensuel:"4.83 euros si poste massicot confirme",montant_total_5ans:"a calculer sur historique complet"},
      {poste:"Sem 04 janv (21/01): P10 8h sur taux 19.1940 - poste a confirmer",montant_mensuel:"0 si standard / 9.49 si massicot",montant_total_5ans:"a confirmer"},
    ],
    alertes:[
      {type:"ATTENTION",titre:"VERIFICATION REQUISE - Poste non mentionne sur la fiche",detail:"CP 322 exige que la qualification professionnelle soit identifiable. La mention 'selon grille client' est insuffisante. Demander a Randstad confirmation ecrite du poste occupe chaque semaine avec P10.",montant_estime:"-",base_legale:"CP 322 - identification qualification professionnelle",niveau:"CP"},
      {type:"ATTENTION",titre:"Sem 21 mai: P10 sur taux de base alors que taux massicot present",detail:"4h P10 calculees sur 19.5568euros/h. Le taux massicot 21.9738euros/h est present cette semaine. Si poste massicot confirme: ecart = 4h x (21.9738-19.5568) x 50% = 4.83euros. A verifier: confirmer la qualification professionnelle du travailleur cette semaine cette semaine?",montant_estime:"4.83 euros si confirme",base_legale:"Loi 16/03/1971 art.29 - heures sup sur taux reel du poste",niveau:"LOI"},
      {type:"ATTENTION",titre:"Sem 04 janv: P10 sur taux 19.1940 - poste inconnu",detail:"8h P10 calculees sur 19.1940euros/h (taux standard). Si la qualification massicot est confirmee pour cette semaine (21.5662euros/h): ecart = 8h x (21.5662-19.1940) x 50% = 9.49euros. A verifier: confirmer la qualification professionnelle du travailleur cette semaine le 21/01/2026?",montant_estime:"0 a 9.49 euros selon poste",base_legale:"Loi 16/03/1971 art.29",niveau:"LOI"},
    ],
    points_conformes:[
      "Sem 18 avril (30/04): P10 correctement calcule sur taux massicot 21.5662euros/h",
      "Sursalaires weekend/feries presents et corrects (P08, P06)",
      "Primes equipe decomposees (P00, P01, P02, P52, P54, P03)",
      "ONSS calcule correctement sur salaire brut x 108% x 13.07%",
      "Cheques repas 8euros conformes 2026 (passage 10euros prevu juin 2026)",
      "Frais domicile-travail presentes",
      "Correction fiche sem 05 effectuee correctement (fiche sem 11)",
    ],
    recommandations:[
      "Solliciter aupres de Randstad (04/2421030) une attestation ecrite de la qualification professionnelle pour les semaines avec heures supplementaires (sem 21 mai et sem 04 janv)",
      "Si qualification massicot confirmee sem 21 mai: regulariser 4.83 euros",
      "Si qualification massicot confirmee sem 04 janv: regulariser complement jusqu a 14.32 euros au total",
      "Exiger de l agence la mention explicite de la qualification professionnelle sur chaque ligne de prestation (obligation CP 322)",
      "Conserver ce rapport comme base de discussion",
    ],
    note_contexte:"Analyse basee sur 6 fiches jan-juin 2026 (sem 05, 09, 11, 14, 18, 22). 3 semaines avec P10 identifiees. 1 correcte (sem 18 avril), 2 a verifier selon poste. La non-mention du poste sur la fiche est elle-meme une anomalie CP 322.",_confidence:78}},
];

const MOCK={
  retro:"FICHE JUIN 2024 BURGO ARDENNES SA. Taux globalise 24.80euros/h non decompose. 52h nuit semaine, 26h nuit WE, 13h dimanche, 8h feries. Aucun sursalaire dim/feries. Formation 2024: 2j/5j.",
  preventif:"FICHE MARS 2027 BURGO ARDENNES SA. Taux base 17.20euros/h + primes decomposees. Sursalaire dim calcule. Tickets 8euros. Formation 5j ok.",
};

const COUNTRIES=[
  {code:"BE",flag:"🇧🇪",label:"Belgique",ok:true},
  {code:"LU",flag:"🇱🇺",label:"Luxembourg",ok:false},
  {code:"FR",flag:"🇫🇷",label:"France",ok:false},
  {code:"NL",flag:"🇳🇱",label:"Pays-Bas",ok:false},
];

const inpS={width:"100%",padding:"8px 12px",border:"1px solid "+C.g300,borderRadius:6,fontSize:13,fontFamily:"inherit",boxSizing:"border-box"};
const lblS={fontSize:12,fontWeight:700,color:C.g700,marginBottom:4,display:"block"};

function makeP1(mode,co,year,yearTo){
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
    co.grille?(function(){var lines=[];(co.grille.categories||[]).forEach(function(cat){lines.push(cat.label+": base "+cat.tauxBase+" euros/h");});var pe=co.grille.primesEquipe||{};if(pe.nuitSem)lines.push("Primes: nuit-sem x"+pe.nuitSem+" | nuit-WE x"+pe.nuitWE+" | matin x"+pe.matin);return lines.join(" / ");})():"",
    co.grille&&co.grille.heuresMois?(function(){var hm=co.grille.heuresMois;var lines=["Heures types/mois:"];if(hm.c5)lines.push("Continu: "+hm.c5.nuitSem+"h nuit-sem "+hm.c5.nuitWE+"h nuit-WE "+hm.c5.dim+"h dim "+hm.c5.feries+"h feries "+hm.c5.heuresSup+"h sup");if(hm.sc)lines.push("Semi-cont: "+hm.sc.nuitSem+"h nuit-sem "+hm.sc.dim+"h dim");if(hm.j)lines.push("Journee: "+hm.j.feries+"h feries "+hm.j.heuresSup+"h sup");return lines.join(" / ");})():"",
    co.grille?"CALCUL: salaire_du = taux_base x coef_anciennete x (h_norm + primes x h_type + 100% x h_dim + 100% x h_feries). Compare avec salaire_paye = taux_globalise x h_totales. Ecart = passif mensuel. SOURCE FGTB: taux globalise 3C = 28.5845euros/h / taux base 3C = 22.6433euros/h / primes cycle 21j = 357.50euros. La deglobalisation est neutre pour l horaire normal (+157euros/an) MAIS le globalisé génère des pertes sur heures sup et fériés car 22.6433 x 1.5 = 33.96euros > 28.5845euros x 1.5 = 42.88euros (avantage base sur heures sup).":"",
    (function(){
      var idx=INDEXATIONS[co.cp]||INDEXATIONS["autre"];
      if(!idx)return "";
      var anneeRef=co.grille&&co.grille.anneeReference?co.grille.anneeReference:2022;
      var lines=["=== INDEXATIONS "+idx.nom+" ==="];
      lines.push("ANNEE DE REFERENCE DES TAUX: "+anneeRef+" (les taux saisis dans la grille correspondent a cette annee)");
      idx.historique.forEach(function(h){
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
    yearTo&&yearTo!==year?(function(){var lines=[];for(var y=year;y<=yearTo;y++){var l=LEGAL[y];if(l)lines.push(y+": formation "+l.j+"j | "+l.nuit.substring(0,30)+" | tickets "+l.tk);}return lines.join(" / ");})():"",
    yearTo&&yearTo!==year?"Applique les regles de chaque annee selon la date de la fiche.":"",
    "MODE: "+modeStr,
    "4 etapes: 1.EXTRACTION salaire/heures/taux/primes 2.AUDIT taux+majorations legales 3.COMPTEURS repos/recuperation 4.FORMATION: les jours de formation ne figurent PAS sur la fiche de paie. Marquer toujours NON VERIFIABLE SUR FICHE - a controler registre RH. Signaler uniquement si code formation visible sur la fiche."];
  return lines.filter(function(l){return l;}).join("\n");
}

function makeP2(mode,co,year){
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

function callAPI(system,userMsg,apiKey){
  return fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",headers:{
      "Content-Type":"application/json",
      "x-api-key":apiKey||"",
      "anthropic-version":"2023-06-01",
      "anthropic-dangerous-direct-browser-access":"true"
    },
    body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1800,system:system,messages:[{role:"user",content:userMsg}]})
  }).then(function(r){return r.json();}).then(function(d){
    if(d.error)throw new Error(d.error.message||"API error");
    return (d.content||[]).map(function(b){return b.text||"";}).join("");
  });
}

function analyzeSingle(b64,fname,mode,co,year,yearTo,apiKey){
  var sys1=makeP1(mode,co,year,yearTo);
  var msg1=b64?[{type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},{type:"text",text:"Analyse cette fiche en 4 etapes avec calculs."}]:"Analyse cette fiche fictive:\n\n"+(MOCK[mode]||MOCK.retro);
  return callAPI(sys1,msg1,apiKey).then(function(reasoning){
    var rShort=reasoning.length>3000?reasoning.slice(0,3000)+"...":reasoning;
    return callAPI(makeP2(mode,co,year),"JSON uniquement base sur:\n\n"+rShort,apiKey).then(function(txt){
      var js=txt.indexOf("{");var je=txt.lastIndexOf("}");
      if(js<0||je<0||je<js)throw new Error("Réponse API invalide — JSON attendu");
      var parsed=JSON.parse(txt.slice(js,je+1));
      parsed._reasoning=reasoning;
      parsed._year=(parsed.periode_paie&&parsed.periode_paie.annee&&!isNaN(parseInt(parsed.periode_paie.annee)))?parseInt(parsed.periode_paie.annee):year;
      parsed._month=parsed.periode_paie&&parsed.periode_paie.mois?parsed.periode_paie.mois:"";
      parsed._filename=fname;
      parsed._confidence=(!parsed.worker||!parsed.worker.name)?60:typeof parsed.score!=="number"?70:90;
      parsed._warnings=checkCoherence(parsed);
      return parsed;
    });
  });
}

function saveResult(parsed,mode,setRetro,setPrev){
  parsed._type=mode==="retro"||mode==="preventif"?(parsed.worker&&parsed.worker.cp&&parsed.worker.cp.indexOf("322")>=0?"interim":"direct"):"direct";
  var key=(parsed._filename||"")+"_"+(parsed.worker&&parsed.worker.name||"")+"_"+(parsed._year||"");
  if(mode==="retro")setRetro(function(p){
    var exists=p.some(function(r){return((r._filename||"")+"_"+(r.worker&&r.worker.name||"")+"_"+(r._year||""))===key;});
    return exists?p:p.concat([parsed]);
  });
  if(mode==="preventif"){var entry={result:parsed,workerName:parsed.worker&&parsed.worker.name,date:new Date().toLocaleDateString("fr-BE"),month:new Date().toLocaleDateString("fr-BE",{month:"short",year:"numeric"})};
    setPrev(function(p){
      var exists=p.some(function(e){return((e.result&&e.result._filename||"")+"_"+(e.workerName||"")+"_"+(e.result&&e.result._year||""))===key;});
      return exists?p:p.concat([entry]);
    });}
}

function runAnalysis(opts){
  var demoFiches=opts.demoFiches,year=opts.year,yearTo=opts.yearTo,mode=opts.mode,co=opts.co;
  var batchMode=opts.batchMode,batchFiles=opts.batchFiles,fileB64=opts.fileB64,file=opts.file;
  var setStep=opts.setStep,setResult=opts.setResult,setError=opts.setError,setBatchProg=opts.setBatchProg;
  var setRetro=opts.setRetro,setPrev=opts.setPrev,apiKey=opts.apiKey;
  var sv=function(p){saveResult(p,mode,setRetro,setPrev);};

  if(demoFiches.length>0){
    if(demoFiches.length===1){
      setTimeout(function(){var dr=Object.assign({},demoFiches[0].analyse,{_year:demoFiches[0].analyse._year||demoFiches[0].ficheYear||year});setResult(dr);sv(dr);setStep("result");},2000);
    } else {
      setBatchProg({current:0,total:demoFiches.length,results:[],done:false});setStep("batch");
      var di=0;
      var nextDemo=function(){
        if(di>=demoFiches.length)return;
        var i=di++;
        setTimeout(function(){
          var r=Object.assign({},demoFiches[i].analyse,{_year:demoFiches[i].analyse._year||demoFiches[i].ficheYear||year,_filename:demoFiches[i].label});
          sv(r);setBatchProg(function(p){return{current:i+1,total:demoFiches.length,results:p.results.concat([r]),done:i===demoFiches.length-1};});
          nextDemo();
        },1500);
      };
      nextDemo();
    }
    return;
  }

  var files=batchMode?batchFiles:(fileB64?[{b64:fileB64,name:file||"fiche"}]:null);
  if(!files||!files.length){setError("Aucun fichier selectionne.");setStep("upload");return;}

  if(files.length>1){
    setBatchProg({current:0,total:files.length,results:[],done:false});setStep("batch");
    var bi=0;
    var nextBatch=function(){
      if(bi>=files.length)return;
      var i=bi++;
      analyzeSingle(files[i].b64,files[i].name,mode,co,year,yearTo,apiKey).then(function(r){
        sv(r);setBatchProg(function(p){return{current:i+1,total:files.length,results:p.results.concat([r]),done:i===files.length-1};});
        nextBatch();
      }).catch(function(e){
        var errResult={_filename:files[i].name,_error:true,conformite_globale:"ERREUR",score:0,passif_par_travailleur:[],alertes:[],_errorMessage:e&&e.message?e.message:"Erreur inconnue"};
        setBatchProg(function(p){return{current:i+1,total:files.length,results:p.results.concat([errResult]),done:i===files.length-1};});
        nextBatch();
      });
    };
    nextBatch();
    return;
  }

  analyzeSingle(files[0].b64,files[0].name,mode,co,year,yearTo,apiKey).then(function(parsed){
    setResult(parsed);sv(parsed);setStep("result");
  }).catch(function(e){
    setError("Erreur: "+(e&&e.message?e.message:"Reessayez."));setStep("upload");
  });
}

function AlertBadge(props){
  var a=props.a;
  var tc=a.type==="CRITIQUE"?C.danger:C.warn;
  var tbg=a.type==="CRITIQUE"?C.dangerL:C.warnL;
  var ncol=a.niveau==="LOI"?"#2C4A6E":a.niveau==="CP"?"#8B4513":"#1A5C1A";
  var nbg=a.niveau==="LOI"?"#E8F0FF":a.niveau==="CP"?"#FFF0E8":"#F0FFE8";
  return <div style={{borderLeft:"3px solid "+tc,paddingLeft:12,marginBottom:10}}>
    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3,flexWrap:"wrap"}}>
      <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:tbg,color:tc}}>{a.type}</span>
      {a.niveau&&<span style={{padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:700,background:nbg,color:ncol}}>{a.niveau}</span>}
      <span style={{fontWeight:700,fontSize:12,color:C.navy}}>{a.titre}</span>
      {a.montant_estime&&a.montant_estime!=="-"&&<span style={{marginLeft:"auto",color:C.danger,fontWeight:700,fontSize:12}}>{a.montant_estime}</span>}
    </div>
    <div style={{color:C.g700,fontSize:11}}>{a.detail}</div>
    {a.base_legale&&<div style={{color:C.g500,fontSize:10,fontStyle:"italic"}}>Base: {a.base_legale}</div>}
  </div>;
}

function ReasoningBlock(props){
  var os=useState(false);var open=os[0];var setOpen=os[1];
  return <div style={{background:C.g100,border:"1px solid "+C.g200,borderRadius:8,marginBottom:12,overflow:"hidden"}}>
    <button onClick={function(){setOpen(!open);}} style={{width:"100%",background:"none",border:"none",padding:"10px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span>🔬</span>
        <span style={{fontWeight:700,fontSize:12,color:C.navy}}>Raisonnement detaille Phase 1</span>
        <span style={{fontSize:10,color:C.g500,background:C.g200,padding:"1px 7px",borderRadius:8}}>chain-of-thought</span>
      </div>
      <span style={{color:C.g500,fontSize:12}}>{open?"^":"v"}</span>
    </button>
    {open&&<div style={{padding:"0 16px 14px",borderTop:"1px solid "+C.g200}}>
      <div style={{background:C.white,borderRadius:6,padding:12,marginTop:10,fontSize:11,color:C.g700,lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"monospace",maxHeight:300,overflowY:"auto"}}>{props.reasoning}</div>
    </div>}
  </div>;
}

export default function App(){
  var s1=useState(DEF);var co=s1[0];var setCo=s1[1];
  var s2=useState(DEF);var edit=s2[0];var setEdit=s2[1];
  var s3=useState("config");var step=s3[0];var setStep=s3[1];
  var s4=useState(null);var mode=s4[0];var setMode=s4[1];
  var s5=useState(null);var file=s5[0];var setFile=s5[1];
  var s6=useState(null);var fileB64=s6[0];var setFileB64=s6[1];
  var s7=useState(null);var result=s7[0];var setResult=s7[1];
  var s8=useState(null);var error=s8[0];var setError=s8[1];
  var s9=useState(false);var mock=s9[0];var setMock=s9[1];
  var s10=useState(false);var dash=s10[0];var setDash=s10[1];
  var s11=useState([]);var retro=s11[0];var setRetro=s11[1];
  var s12=useState([]);var prev=s12[0];var setPrev=s12[1];
  var s13=useState([]);var demoFiches=s13[0];var setDemoFiches=s13[1];
  var s14=useState([]);var batchFiles=s14[0];var setBatchFiles=s14[1];
  var s15=useState(false);var batchMode=s15[0];var setBatchMode=s15[1];
  var s16=useState({current:0,total:0,results:[],done:false});var batchProg=s16[0];var setBatchProg=s16[1];
  var s17=useState(new Date().getFullYear());var year=s17[0];var setYear=s17[1];
  var s20=useState(new Date().getFullYear());var yearTo=s20[0];var setYearTo=s20[1];
  var s18=useState(false);var discOk=s18[0];var setDiscOk=s18[1];
  var ref=useRef();
  var s21=useState("general");var configTab=s21[0];var setConfigTab=s21[1];
  var s19=useState(null);var selEntry=s19[0];var setSelEntry=s19[1];
  var s22=useState("");var apiKey=s22[0];var setApiKey=s22[1];
  var cp=CP[co.cp]||CP["autre"];
  var W=parseInt(co.workers)||0;

  var goHome=function(){setStep("home");setMode(null);setResult(null);setError(null);setMock(false);setDemoFiches([]);setFile(null);setFileB64(null);setDiscOk(false);};
  var goConf=function(){setEdit(Object.assign({},co));setStep("config");};
  var saveConf=function(){if(edit.country!=="BE")return;setCo(Object.assign({},edit,{grille:edit.grille||co.grille||DEF.grille}));setStep("home");};
  var selMode=function(m){if(m==="dashboard"){setDash(true);return;}setMode(m);setStep("upload");setResult(null);setError(null);setFile(null);setFileB64(null);setDiscOk(false);setDemoFiches([]);setBatchFiles([]);setBatchMode(false);};
  var onFile=function(e){
    var files=Array.from(e.target.files);
    if(!files.length)return;
    if(files.length===1){setBatchMode(false);setFile(files[0].name);var rd=new FileReader();rd.onload=function(ev){setFileB64(ev.target.result.split(",")[1]);};rd.readAsDataURL(files[0]);}
    else{setBatchMode(true);setFile(files.length+" fichiers");var ps=files.map(function(f){return new Promise(function(res){var r2=new FileReader();r2.onload=function(ev){res({name:f.name,b64:ev.target.result.split(",")[1]});};r2.readAsDataURL(f);});});Promise.all(ps).then(function(rs){setBatchFiles(rs);});}
  };
  var analyze=function(){
    setStep("analyzing");setError(null);
    runAnalysis({demoFiches:demoFiches,year:year,yearTo:yearTo,mode:mode,co:co,batchMode:batchMode,batchFiles:batchFiles,fileB64:fileB64,file:file,setStep:setStep,setResult:setResult,setError:setError,setBatchProg:setBatchProg,setRetro:setRetro,setPrev:setPrev,apiKey:apiKey});
  };

  var isInterimCo=(co.typeEntreprise||"direct")==="interim";
  var retroTotal=retro.filter(function(r){
    if(r._type==="interim"&&!isInterimCo)return false;
    if(r._type==="direct"&&isInterimCo)return false;
    return true;
  }).reduce(function(s,r){return s+(r.passif_par_travailleur||[]).reduce(function(s2,p){return s2+parseEuros(p.montant_total_5ans);},0);},0);
  var appStyle={minHeight:"100vh",background:C.g100,fontFamily:"Inter,sans-serif"};

  if(dash)return <div style={appStyle}>
    <header style={{background:C.navy,borderBottom:"3px solid "+C.accent,padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <button onClick={function(){setDash(false);}} style={{background:"none",border:"none",color:C.g300,cursor:"pointer",fontSize:13,fontWeight:600}}>{"<"}- Retour</button>
      <span style={{color:C.white,fontWeight:800,fontSize:15}}>SocialAudit<span style={{color:C.accent}}>.be</span> - Dashboard</span>
      <span style={{color:C.g300,fontSize:11}}>{co.name}</span>
    </header>
    <main style={{maxWidth:900,margin:"0 auto",padding:"24px 20px"}}>
      {retro.length===0&&prev.length===0&&<div style={{textAlign:"center",padding:"60px 20px"}}>
        <div style={{fontSize:48,marginBottom:16}}>📊</div>
        <div style={{color:C.navy,fontWeight:800,fontSize:18,marginBottom:8}}>Aucune analyse realisee</div>
        <div style={{color:C.g500,fontSize:13}}>Lancez un audit retrospectif ou preventif pour voir les resultats ici.</div>
      </div>}
      {retro.length>0&&<div style={{marginBottom:24}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <div style={{color:C.navy,fontWeight:800,fontSize:16}}>Passif historique - Audit Retrospectif</div>
        <span style={{padding:"2px 10px",borderRadius:4,fontSize:10,fontWeight:700,background:(co.typeEntreprise||"direct")==="interim"?"#E8F0FF":"#F0FFE8",color:(co.typeEntreprise||"direct")==="interim"?"#2C4A6E":"#1A5C1A"}}>{(co.typeEntreprise||"direct")==="interim"?"INTERIM CP 322":"EMPLOYES DIRECTS"}</span>
      </div>
        {retroTotal>0&&<div style={{background:C.navy,borderRadius:10,padding:"14px 20px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <div style={{color:C.g300,fontSize:11,marginBottom:2}}>TOTAL PASSIF IDENTIFIE - {retro.length} travailleur(s)</div>
            <div style={{color:"#FF6B6B",fontSize:24,fontWeight:900}}>{retroTotal.toLocaleString("fr-BE")} euros</div>
            <div style={{color:C.g300,fontSize:11}}>Somme reelle - sans extrapolation</div>
          </div>
          <div style={{fontSize:32}}>⚠️</div>
        </div>}
        <div style={{background:C.white,border:"1px solid "+C.g200,borderRadius:10,overflow:"hidden"}}>
          <div style={{background:C.navyMid,padding:"10px 16px",display:"grid",gridTemplateColumns:"2fr 60px 90px 100px"}}>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Travailleur</div>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Annee</div>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Score</div>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Passif</div>
          </div>
          {retro.filter(function(r){
            var isInterim=(co.typeEntreprise||"direct")==="interim";
            if(r._type==="interim"&&!isInterim)return false;
            if(r._type==="direct"&&isInterim)return false;
            return true;
          }).map(function(r,i){
            var wp=(r.passif_par_travailleur||[]).reduce(function(s,p){return s+parseEuros(p.montant_total_5ans);},0);
            var bc=r.conformite_globale==="NON CONFORME"?{bg:C.dangerL,c:C.danger}:r.conformite_globale==="RISQUE MODERE"?{bg:C.warnL,c:C.warn}:{bg:C.okL,c:C.ok};
            var isSel=selEntry===r;
            return <div key={i}>
              <div onClick={function(){setSelEntry(isSel?null:r);}} style={{display:"grid",gridTemplateColumns:"2fr 60px 90px 100px",padding:"11px 16px",background:isSel?"#F0F4FF":i%2===0?C.white:C.g100,borderBottom:"1px solid "+C.g200,cursor:"pointer"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{(r.worker&&r.worker.name)||"Fiche "+(i+1)}</div>
                  <span style={{padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:700,background:bc.bg,color:bc.c}}>{r.conformite_globale}</span>
                </div>
                <div style={{fontSize:11,fontWeight:700,color:C.steel}}>{r._month?r._month+" "+r._year:r._year||"-"}</div>
                <div style={{fontSize:13,fontWeight:800,color:scoreC(r.score)}}>{r.score}/100</div>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:C.danger}}>{wp>0?wp.toLocaleString("fr-BE")+" euros":"-"}</div>
                  <div style={{fontSize:10,color:C.g500,marginTop:2}}>{isSel?"^ Fermer":"v Details"}</div>
                </div>
              </div>
              {isSel&&<div style={{background:"#F0F4FF",padding:"14px 16px",borderBottom:"1px solid "+C.g200}}>
                {r.passif_par_travailleur&&r.passif_par_travailleur.length>0&&<div style={{marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:8}}>Passif par poste{r._year?" ("+r._year+")":""}:</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"3px 12px"}}>
                    {["POSTE","/ MOIS","TOTAL"].map(function(h,j){return <div key={j} style={{color:C.g500,fontSize:10,fontWeight:700}}>{h}</div>;})}
                    {r.passif_par_travailleur.map(function(p,j){return [
                      <div key={"l"+j} style={{color:C.g700,fontSize:11,borderTop:"1px solid "+C.g100,paddingTop:3}}>{p.poste}</div>,
                      <div key={"m"+j} style={{color:C.warn,fontSize:11,fontWeight:600,borderTop:"1px solid "+C.g100,paddingTop:3,textAlign:"right"}}>{p.montant_mensuel}</div>,
                      <div key={"t"+j} style={{color:C.danger,fontSize:11,fontWeight:700,borderTop:"1px solid "+C.g100,paddingTop:3,textAlign:"right"}}>{p.montant_total_5ans}</div>,
                    ];})}
                  </div>
                </div>}
                {r.alertes&&r.alertes.length>0&&<div style={{marginBottom:10}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:6}}>Anomalies ({r.alertes.length}):</div>
                  {r.alertes.map(function(a,j){
                    var atc=a.type==="CRITIQUE"?C.danger:C.warn;
                    var abg=a.type==="CRITIQUE"?C.dangerL:C.warnL;
                    var ncol=a.niveau==="LOI"?"#2C4A6E":a.niveau==="CP"?"#8B4513":"#1A5C1A";
                    var nbg=a.niveau==="LOI"?"#E8F0FF":a.niveau==="CP"?"#FFF0E8":"#F0FFE8";
                    return <div key={j} style={{borderLeft:"3px solid "+atc,paddingLeft:10,marginBottom:7}}>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:2}}>
                        <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:abg,color:atc}}>{a.type}</span>
                        {a.niveau&&<span style={{padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:700,background:nbg,color:ncol}}>{a.niveau}</span>}
                        <span style={{fontSize:12,fontWeight:600,color:C.navy}}>{a.titre}</span>
                        {a.montant_estime&&a.montant_estime!=="-"&&<span style={{marginLeft:"auto",color:C.danger,fontWeight:700,fontSize:12}}>{a.montant_estime}</span>}
                      </div>
                      <div style={{fontSize:11,color:C.g700}}>{a.detail}</div>
                      {a.base_legale&&<div style={{fontSize:10,color:C.g500,fontStyle:"italic"}}>Base: {a.base_legale}</div>}
                    </div>;
                  })}
                </div>}
                {r.points_conformes&&r.points_conformes.length>0&&<div>
                  <div style={{fontSize:12,fontWeight:700,color:C.ok,marginBottom:4}}>Points conformes:</div>
                  {r.points_conformes.map(function(p,j){return <div key={j} style={{fontSize:11,color:C.g700,display:"flex",gap:6,marginBottom:3}}><span style={{color:C.ok}}>✓</span>{p}</div>;})}
                </div>}
              </div>}
            </div>;
          })}
        </div>
      </div>}
      {prev.length>0&&<div>
        <div style={{color:C.navy,fontWeight:800,fontSize:16,marginBottom:14}}>Conformite en cours - Audit Preventif</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
          {[
            {l:"Fiches analysees",v:prev.length,s:"cette session"},
            {l:"Score moyen",v:Math.round(prev.reduce(function(s,h){return s+(h.result?h.result.score||0:0);},0)/prev.length)+"/100",col:scoreC(Math.round(prev.reduce(function(s,h){return s+(h.result?h.result.score||0:0);},0)/prev.length))},
            {l:"Total anomalies",v:prev.reduce(function(s,h){return s+(h.result&&h.result.alertes?h.result.alertes.length:0);},0)},
          ].map(function(k,i){return <div key={i} style={{background:C.white,border:"1px solid "+C.g200,borderRadius:10,padding:"14px 16px"}}>
            <div style={{color:C.g500,fontSize:11,marginBottom:4,fontWeight:600}}>{k.l}</div>
            <div style={{color:k.col||C.navy,fontSize:20,fontWeight:900}}>{k.v}</div>
            {k.s&&<div style={{color:C.g500,fontSize:11}}>{k.s}</div>}
          </div>;})}
        </div>
        {prev.length>1&&<div style={{background:C.white,border:"1px solid "+C.g200,borderRadius:10,padding:"18px 20px"}}>
          <div style={{color:C.navy,fontWeight:800,fontSize:13,marginBottom:12}}>Evolution du score</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={prev.slice(-6).map(function(h,i){return{mois:h.month||"M"+(i+1),score:h.result?h.result.score||0:0};})}>
              <XAxis dataKey="mois" tick={{fontSize:10,fill:C.g500}} axisLine={false} tickLine={false}/>
              <YAxis domain={[0,100]} tick={{fontSize:10,fill:C.g500}} axisLine={false} tickLine={false} width={25}/>
              <Tooltip contentStyle={{background:C.navy,border:"none",borderRadius:6,fontSize:11,color:C.white}} formatter={function(v){return [v+"/100","Score"];}}/>
              <Line type="monotone" dataKey="score" stroke={C.accent} strokeWidth={2.5} dot={{fill:C.accent,r:4}}/>
            </LineChart>
          </ResponsiveContainer>
        </div>}

        {/* Tableau detail fiches preventif */}
        {prev.length>0&&<div style={{background:C.white,border:"1px solid "+C.g200,borderRadius:10,overflow:"hidden",marginTop:14}}>
          <div style={{background:C.navyMid,padding:"10px 16px",display:"grid",gridTemplateColumns:"2fr 70px 110px 60px"}}>
            {["Travailleur","Score","Statut","Alertes"].map(function(h,i){return <div key={i} style={{color:C.g300,fontSize:10,fontWeight:700}}>{h}</div>;})}
          </div>
          {prev.map(function(entry,i){
            var r=entry.result;
            if(!r)return null;
            var bc=r.conformite_globale==="NON CONFORME"?{bg:C.dangerL,c:C.danger}:r.conformite_globale==="RISQUE MODERE"?{bg:C.warnL,c:C.warn}:{bg:C.okL,c:C.ok};
            var isSel=selEntry===entry;
            return <div key={i}>
              <div onClick={function(){setSelEntry(isSel?null:entry);}} style={{display:"grid",gridTemplateColumns:"2fr 70px 110px 60px",padding:"11px 16px",background:isSel?"#F0F4FF":i%2===0?C.white:C.g100,borderBottom:"1px solid "+C.g200,cursor:"pointer"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:C.navy}}>{entry.workerName||r.worker&&r.worker.name||"Fiche "+(i+1)}</div>
                  <div style={{fontSize:10,color:C.g500}}>{r._month?r._month+" "+r._year:r._year||entry.month||""} - {r.worker&&r.worker.regime||""}</div>
                </div>
                <div style={{fontSize:13,fontWeight:800,color:scoreC(r.score)}}>{r.score}/100</div>
                <span style={{padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:700,background:bc.bg,color:bc.c,height:"fit-content",marginTop:2}}>{r.conformite_globale}</span>
                <div style={{fontSize:11,fontWeight:700}}>{r.alertes&&r.alertes.length>0?<span style={{color:C.danger}}>{r.alertes.length} ⚠</span>:<span style={{color:C.ok}}>✓</span>}</div>
              </div>
              {isSel&&<div style={{background:"#F0F4FF",padding:"14px 16px",borderBottom:"1px solid "+C.g200}}>
                {r.passif_par_travailleur&&r.passif_par_travailleur.length>0&&<div style={{marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:8}}>Passif par poste:</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"3px 12px"}}>
                    {["POSTE","/ MOIS","TOTAL"].map(function(h,j){return <div key={j} style={{color:C.g500,fontSize:10,fontWeight:700}}>{h}</div>;})}
                    {r.passif_par_travailleur.map(function(p,j){return [
                      <div key={"l"+j} style={{color:C.g700,fontSize:11,borderTop:"1px solid "+C.g100,paddingTop:3}}>{p.poste}</div>,
                      <div key={"m"+j} style={{color:C.warn,fontSize:11,fontWeight:600,borderTop:"1px solid "+C.g100,paddingTop:3,textAlign:"right"}}>{p.montant_mensuel}</div>,
                      <div key={"t"+j} style={{color:C.danger,fontSize:11,fontWeight:700,borderTop:"1px solid "+C.g100,paddingTop:3,textAlign:"right"}}>{p.montant_total_5ans}</div>,
                    ];})}
                  </div>
                </div>}
                {r.alertes&&r.alertes.length>0&&<div style={{marginBottom:8}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.navy,marginBottom:6}}>Anomalies ({r.alertes.length}):</div>
                  {r.alertes.map(function(a,j){
                    var atc=a.type==="CRITIQUE"?C.danger:C.warn;
                    var abg=a.type==="CRITIQUE"?C.dangerL:C.warnL;
                    var ncol=a.niveau==="LOI"?"#2C4A6E":a.niveau==="CP"?"#8B4513":"#1A5C1A";
                    var nbg=a.niveau==="LOI"?"#E8F0FF":a.niveau==="CP"?"#FFF0E8":"#F0FFE8";
                    return <div key={j} style={{borderLeft:"3px solid "+atc,paddingLeft:10,marginBottom:7}}>
                      <div style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap",marginBottom:2}}>
                        <span style={{padding:"2px 6px",borderRadius:3,fontSize:10,fontWeight:700,background:abg,color:atc}}>{a.type}</span>
                        {a.niveau&&<span style={{padding:"2px 6px",borderRadius:3,fontSize:9,fontWeight:700,background:nbg,color:ncol}}>{a.niveau}</span>}
                        <span style={{fontSize:12,fontWeight:600,color:C.navy}}>{a.titre}</span>
                      </div>
                      <div style={{fontSize:11,color:C.g700}}>{a.detail}</div>
                      {a.base_legale&&<div style={{fontSize:10,color:C.g500,fontStyle:"italic"}}>Base: {a.base_legale}</div>}
                    </div>;
                  })}
                </div>}
                {r.points_conformes&&r.points_conformes.length>0&&<div>
                  <div style={{fontSize:12,fontWeight:700,color:C.ok,marginBottom:4}}>Points conformes:</div>
                  {r.points_conformes.map(function(p,j){return <div key={j} style={{fontSize:11,color:C.g700,display:"flex",gap:6,marginBottom:3}}><span style={{color:C.ok}}>v</span>{p}</div>;})}
                </div>}
                {r.note_contexte&&<div style={{background:"#FFF8E8",border:"1px solid "+C.accent,borderRadius:6,padding:"8px 12px",marginTop:8}}>
                  <div style={{fontSize:11,color:C.g700}}>{r.note_contexte}</div>
                </div>}
              </div>}
            </div>;
          })}
        </div>}
      </div>}
    </main>
  </div>;

  return <div style={appStyle}>
    <header style={{background:C.navy,borderBottom:"3px solid "+C.accent}}>
      <div style={{maxWidth:980,margin:"0 auto",padding:"13px 20px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={goHome}>
          <div style={{background:C.accent,width:30,height:30,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15}}>⚖</div>
          <div>
            <div style={{color:C.white,fontWeight:800,fontSize:15}}>SocialAudit<span style={{color:C.accent}}>.be</span></div>
            <div style={{color:C.g300,fontSize:9,letterSpacing:1}}>CONFORMITE SOCIALE BELGIQUE</div>
          </div>
        </div>
        {step!=="config"&&<div style={{display:"flex",gap:6,alignItems:"center"}}>
          <div style={{background:C.navyMid,border:"1px solid "+C.steel,borderRadius:6,padding:"4px 8px",display:"flex",flexDirection:"column",alignItems:"flex-start",maxWidth:120}}>
            <span style={{color:C.accent,fontSize:11,fontWeight:800,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:110}}>{co.name}</span>
            <span style={{color:C.g300,fontSize:9}}>CP {co.cp} - {co.workers} ETP</span>
          </div>
          {(retro.length>0||prev.length>0)&&<button onClick={function(){setDash(true);}} style={{background:C.accent,color:C.navy,border:"none",borderRadius:6,padding:"6px 10px",fontSize:11,fontWeight:800,cursor:"pointer"}}>📊</button>}
          <button onClick={goConf} style={{background:C.steel,color:C.white,border:"none",borderRadius:6,padding:"6px 10px",fontSize:11,fontWeight:700,cursor:"pointer"}}>⚙</button>
        </div>}
      </div>
    </header>
    <main style={{maxWidth:980,margin:"0 auto",padding:"24px 20px"}}>
      {step==="config"&&<div style={{maxWidth:620,margin:"0 auto"}}>
        <h1 style={{color:C.navy,fontSize:20,fontWeight:800,margin:"0 0 12px"}}>Configuration entreprise</h1>
        <div style={{display:"flex",gap:0,marginBottom:16,background:C.g100,borderRadius:8,padding:3}}>
          {[{id:"general",label:"Entreprise"},{id:"grille",label:"Grille salariale"},{id:"heures",label:"Heures types"}].map(function(t){return <button key={t.id} onClick={function(){setConfigTab(t.id);}}
            style={{flex:1,background:configTab===t.id?C.white:"transparent",color:configTab===t.id?C.navy:C.g500,border:"none",borderRadius:6,padding:"8px 4px",fontSize:12,fontWeight:configTab===t.id?700:400,cursor:"pointer",transition:"all 0.15s"}}>{t.label}</button>;})}
        </div>
        <div style={{background:C.white,border:"1px solid "+C.g200,borderRadius:12,padding:"22px"}}>
          <div style={{marginBottom:16}}>
            <label style={lblS}>Pays *</label>
            <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
              {COUNTRIES.map(function(c){return <div key={c.code} onClick={function(){if(c.ok)setEdit(function(p){return Object.assign({},p,{country:c.code});});}}
                style={{border:"2px solid "+(edit.country===c.code?C.accent:C.g200),borderRadius:8,padding:"8px 10px",cursor:c.ok?"pointer":"not-allowed",background:edit.country===c.code?"#FFF8E8":c.ok?C.white:C.g100,opacity:c.ok?1:0.6}}>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:15}}>{c.flag}</span>
                  <span style={{fontWeight:700,fontSize:12,color:c.ok?C.navy:C.g500}}>{c.label}</span>
                  {!c.ok&&<span style={{fontSize:9,color:C.g500,background:C.g200,borderRadius:3,padding:"1px 4px",marginLeft:"auto"}}>BIENTOT</span>}
                  {edit.country===c.code&&<span style={{color:C.accent,fontWeight:800,marginLeft:"auto"}}>✓</span>}
                </div>
              </div>;})}
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={lblS}>Type d entreprise *</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {[{id:"direct",icon:"🏭",label:"Employeur direct",sub:"CDI/CDD - salaire fixe"},{id:"interim",icon:"🔄",label:"Agence interim",sub:"Taux variable - CP 322"}].map(function(t){return <div key={t.id} onClick={function(){setEdit(function(p){
                    if(t.id==="interim"&&(p.typeEntreprise||"direct")!=="interim"){
                      return Object.assign({},p,{typeEntreprise:"interim",cp:"322",_prevCp:p.cp,_prevProfiles:p.profiles,profiles:(CP["322"]||CP["autre"]).profiles.map(function(pr){return Object.assign({},pr,{nb:""});})});
                    }
                    if(t.id==="direct"&&p.typeEntreprise==="interim"){
                      var restoreCp=p._prevCp||"autre";
                      var restoreProfiles=p._prevProfiles||(CP[restoreCp]||CP["autre"]).profiles.map(function(pr){return Object.assign({},pr,{nb:""});});
                      return Object.assign({},p,{typeEntreprise:"direct",cp:restoreCp,profiles:restoreProfiles,_prevCp:null,_prevProfiles:null});
                    }
                    return Object.assign({},p,{typeEntreprise:t.id});
                  });}}
                style={{border:"2px solid "+((edit.typeEntreprise||"direct")===t.id?C.accent:C.g200),borderRadius:8,padding:"10px 12px",cursor:"pointer",background:(edit.typeEntreprise||"direct")===t.id?"#FFF8E8":C.white}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:20}}>{t.icon}</span>
                  <div>
                    <div style={{fontWeight:700,fontSize:12,color:C.navy}}>{t.label}</div>
                    <div style={{fontSize:10,color:C.g500}}>{t.sub}</div>
                  </div>
                  {(edit.typeEntreprise||"direct")===t.id&&<span style={{marginLeft:"auto",color:C.accent,fontWeight:800}}>v</span>}
                </div>
              </div>;})}
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={lblS}>Nom entreprise *</label>
              <input style={inpS} value={edit.name} onChange={function(e){setEdit(function(p){return Object.assign({},p,{name:e.target.value});});}} placeholder="Burgo Ardennes S.A."/>
            </div>
            <div>
              <label style={lblS}>N BCE</label>
              <input style={inpS} value={edit.num} onChange={function(e){setEdit(function(p){return Object.assign({},p,{num:e.target.value});});}} placeholder="0451.821.842"/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
            <div>
              <label style={lblS}>ETP *</label>
              <input style={inpS} type="number" value={edit.workers} onChange={function(e){setEdit(function(p){return Object.assign({},p,{workers:e.target.value});});}} placeholder="596"/>
            </div>
            <div>
              <label style={lblS}>Commission Paritaire *</label>
              {(edit.typeEntreprise||"direct")==="interim"
                ?<div style={{background:C.g100,border:"1px solid "+C.g200,borderRadius:6,padding:"8px 12px",fontSize:13,color:C.g500,display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:700,color:C.navy}}>CP 322 - Interim</span>
                    <span style={{fontSize:11,color:C.g500}}>(fixe pour les agences d interim)</span>
                  </div>
                :<select style={inpS} value={edit.cp} onChange={function(e){var newCp=e.target.value;var idx=INDEXATIONS[newCp]||INDEXATIONS["autre"];setEdit(function(p){var g=Object.assign({},p.grille||DEF.grille||{});g.indexations=idx.historique;g.noteIndexation=idx.note;g.typeIndexation=idx.type;return Object.assign({},p,{cp:newCp,profiles:(CP[newCp]||CP["autre"]).profiles,grille:g});});}}>
                  {Object.keys(CP).filter(function(k){return k!=="322";}).map(function(k){return <option key={k} value={k}>{CP[k].label}</option>;})}
                </select>
              }
            </div>
          </div>
          <div style={{marginBottom:18}}>
            <label style={lblS}>Profils de travailleurs</label>
            {(edit.profiles||(CP[edit.cp]||CP["autre"]).profiles).map(function(p,i){return <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,background:C.g100,borderRadius:8,padding:"9px 12px",marginBottom:7,border:"1px solid "+C.g200}}>
              <span style={{fontSize:17}}>{p.icon}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:7}}>
                  <span style={{fontWeight:700,fontSize:12,color:C.navy}}>{p.label}</span>
                  <span style={{fontSize:9,fontWeight:700,color:p.rc,background:p.rc+"20",padding:"1px 5px",borderRadius:3}}>{p.risk}</span>
                </div>
              </div>
              <input type="number" min="0" placeholder="0" value={p.nb}
                onChange={function(e){var up=(edit.profiles||(CP[edit.cp]||CP["autre"]).profiles).map(function(pp,j){return j===i?Object.assign({},pp,{nb:e.target.value}):pp;});setEdit(function(prev){return Object.assign({},prev,{profiles:up});});}}
                style={{width:60,padding:"5px 8px",border:"1px solid "+C.g300,borderRadius:6,fontSize:13,fontWeight:700,textAlign:"center",fontFamily:"inherit"}}/>
              <span style={{fontSize:11,color:C.g500}}>ETP</span>
            </div>;})}</div>
          {configTab==="general"&&<div>
            <div style={{marginBottom:14}}>
              <label style={lblS}>Clé API Anthropic *</label>
              <input type="password" style={inpS} value={apiKey} onChange={function(e){setApiKey(e.target.value);}} placeholder="sk-ant-..."/>
              <div style={{fontSize:10,color:C.g500,marginTop:3}}>Requise pour l'analyse de vrais PDF. Conservée localement dans le navigateur uniquement.</div>
            </div>
            <button onClick={saveConf} disabled={!edit.name||!edit.workers||!edit.cp||edit.country!=="BE"}
              style={{width:"100%",background:edit.name&&edit.workers&&edit.cp&&edit.country==="BE"?C.accent:C.g300,color:edit.name&&edit.workers&&edit.cp&&edit.country==="BE"?C.navy:C.g500,border:"none",borderRadius:8,padding:"13px",fontWeight:800,fontSize:14,cursor:"pointer"}}>
              Confirmer et demarrer l audit →
            </button>
          </div>}
          {configTab==="grille"&&<div>
            <div style={{color:C.g500,fontSize:11,marginBottom:10}}>Taux de base par categorie. L'IA les utilisera pour calculer le salaire du exact vs paye.</div>
            <div style={{display:"flex",alignItems:"center",gap:12,background:C.g100,borderRadius:8,padding:"10px 14px",marginBottom:12,border:"1px solid "+C.g200}}>
              <div style={{fontSize:12,fontWeight:700,color:C.navy}}>Annee de reference des taux saisis :</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {[2022,2023,2024,2025,2026].map(function(y){var g=edit.grille||DEF.grille;var isRef=g.anneeReference===y;return <button key={y} onClick={function(){setEdit(function(p){
                  var g2=p.grille||DEF.grille;
                  var yd=GRILLE_PAR_ANNEE[y];
                  var ng=Object.assign({},g2,{anneeReference:y,annee:y});
                  if(yd&&yd.categories){ng.categories=g2.categories.map(function(cat){var upd=yd.categories.find(function(c){return c.id===cat.id;});return upd?Object.assign({},cat,upd):cat;});}
                  return Object.assign({},p,{grille:ng});
                });}} style={{background:isRef?C.navy:C.white,color:isRef?C.white:C.navy,border:"2px solid "+(isRef?C.navy:C.g200),borderRadius:6,padding:"6px 10px",cursor:"pointer",fontWeight:isRef?800:600,fontSize:12,flexShrink:0}}>{y}</button>;})}
              </div>
              <div style={{fontSize:11,color:C.g500,fontStyle:"italic"}}>Les indexations seront calculees en partant de cette annee.</div>
            </div>
            {(function(){var idx=INDEXATIONS[edit.cp]||INDEXATIONS["autre"];return <div style={{background:"#F0F4FF",border:"1px solid "+C.steel,borderRadius:8,padding:"10px 14px",marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.navy,marginBottom:4}}>Indexations {idx.nom} — auto-chargees</div>
              <div style={{fontSize:10,color:C.steel,marginBottom:6,fontStyle:"italic"}}>{idx.note}</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {idx.historique.map(function(h,i){return <div key={i} style={{background:C.white,border:"1px solid "+C.g200,borderRadius:5,padding:"3px 8px",fontSize:10}}>
                  <span style={{color:C.g500}}>{h.date.substring(0,7)}: </span>
                  <span style={{fontWeight:700,color:h.pct>0?C.ok:C.g500}}>{h.pct>0?"+"+h.pct+"%":"stable"}</span>
                  <span style={{color:C.g300,fontSize:9}}> ({h.coef.toFixed(4)})</span>
                </div>;})}
              </div>
              <div style={{fontSize:10,color:C.warn,marginTop:6}}>⚠ Coefficients indicatifs — a verifier avec votre secretariat social</div>
            </div>;})()}
            {(edit.grille||DEF.grille).categories.map(function(cat,ci){return <div key={cat.id} style={{background:C.g100,borderRadius:8,padding:"12px 14px",marginBottom:10,border:"1px solid "+C.g200}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <span style={{fontWeight:700,fontSize:12,color:C.navy,flex:1}}>{cat.label}</span>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <input type="number" step="0.01" value={cat.tauxBase}
                    onChange={function(e){var g=Object.assign({},(edit.grille||DEF.grille));g.categories=g.categories.map(function(c,i){return i===ci?Object.assign({},c,{tauxBase:parseFloat(e.target.value)||0}):c;});setEdit(function(p){return Object.assign({},p,{grille:g});});}}
                    style={{width:80,padding:"5px 8px",border:"1px solid "+C.g300,borderRadius:6,fontSize:13,fontWeight:700,textAlign:"right",fontFamily:"inherit"}}/>
                  <span style={{fontSize:11,color:C.g500}}>euros/h</span>
                </div>
              </div>
              <div style={{fontSize:11,color:C.g500,marginBottom:4}}>Coefficients anciennete (selon CCT - prime horaire identique tous regimes):</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {(cat.anciennete||[]).map(function(a,ai){return <div key={ai} style={{display:"flex",alignItems:"center",gap:4,background:C.white,borderRadius:5,padding:"3px 8px",border:"1px solid "+C.g200}}>
                  <span style={{fontSize:11,color:C.g700}}>{a.ans} ans:</span>
                  <input type="number" step="0.001" value={a.coef}
                    onChange={function(e){var g=Object.assign({},(edit.grille||DEF.grille));g.categories=g.categories.map(function(c,i){if(i!==ci)return c;var nc=Object.assign({},c);nc.anciennete=(nc.anciennete||[]).map(function(anc,j){return j===ai?Object.assign({},anc,{coef:parseFloat(e.target.value)||1}):anc;});return nc;});setEdit(function(p){return Object.assign({},p,{grille:g});});}}
                    style={{width:55,padding:"3px 6px",border:"1px solid "+C.g300,borderRadius:4,fontSize:11,fontFamily:"inherit"}}/>
                </div>;})}
              </div>
            </div>;})}
            <div style={{marginTop:14}}>
              <div style={{color:C.navy,fontWeight:700,fontSize:13,marginBottom:8}}>Primes d equipe CCT (multiplicateurs):</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                {[{k:"nuitSem",l:"Nuit semaine"},{k:"nuitWE",l:"Nuit week-end"},{k:"matin",l:"Matin"},{k:"apresMidi",l:"Apres-midi"},{k:"semiNuit",l:"Semi-cont. nuit"}].map(function(p){return <div key={p.k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.g100,borderRadius:6,padding:"8px 12px",border:"1px solid "+C.g200}}>
                  <span style={{fontSize:12,color:C.navy}}>{p.l}</span>
                  <input type="number" step="0.0001" value={(edit.grille||DEF.grille).primesEquipe[p.k]}
                    onChange={function(e){var g=Object.assign({},(edit.grille||DEF.grille));g.primesEquipe=Object.assign({},g.primesEquipe);g.primesEquipe[p.k]=parseFloat(e.target.value)||0;setEdit(function(prev){return Object.assign({},prev,{grille:g});});}}
                    style={{width:70,padding:"4px 8px",border:"1px solid "+C.g300,borderRadius:5,fontSize:12,textAlign:"right",fontFamily:"inherit"}}/>
                </div>;})}
              </div>
            </div>
            <button onClick={saveConf} style={{width:"100%",background:C.accent,color:C.navy,border:"none",borderRadius:8,padding:"11px",fontWeight:800,fontSize:13,cursor:"pointer",marginTop:14}}>Enregistrer la grille →</button>
          </div>}
          {configTab==="heures"&&<div>
            <div style={{color:C.g500,fontSize:11,marginBottom:14}}>Repartition moyenne des heures par mois selon le regime. Utilise pour calculer le salaire du theorique.</div>
            {Object.keys((edit.grille||DEF.grille).heuresMois).map(function(regime){
              var hm=(edit.grille||DEF.grille).heuresMois[regime];
              var labels={normal:"Heures normales",nuitSem:"Nuit semaine",nuitWE:"Nuit WE",dim:"Dimanche",feries:"Feries",heuresSup:"Heures sup"};
              var regimeLabel=regime==="c5"?"Continu 5 equipes":regime==="sc"?"Semi-continu":"Journee fixe";
              return <div key={regime} style={{background:C.g100,borderRadius:8,padding:"12px 14px",marginBottom:12,border:"1px solid "+C.g200}}>
                <div style={{fontWeight:700,fontSize:13,color:C.navy,marginBottom:10}}>{regimeLabel}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {Object.keys(hm).map(function(k){return <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:C.white,borderRadius:6,padding:"7px 10px",border:"1px solid "+C.g200}}>
                    <span style={{fontSize:11,color:C.g700}}>{labels[k]||k}</span>
                    <div style={{display:"flex",alignItems:"center",gap:4}}>
                      <input type="number" min="0" value={hm[k]}
                        onChange={function(e){var g=JSON.parse(JSON.stringify(edit.grille||DEF.grille));g.heuresMois[regime][k]=parseInt(e.target.value)||0;setEdit(function(p){return Object.assign({},p,{grille:g});});}}
                        style={{width:55,padding:"3px 6px",border:"1px solid "+C.g300,borderRadius:4,fontSize:12,textAlign:"right",fontFamily:"inherit"}}/>
                      <span style={{fontSize:10,color:C.g500}}>h</span>
                    </div>
                  </div>;})}
                </div>
              </div>;
            })}
            <button onClick={saveConf} style={{width:"100%",background:C.accent,color:C.navy,border:"none",borderRadius:8,padding:"11px",fontWeight:800,fontSize:13,cursor:"pointer",marginTop:4}}>Enregistrer les heures →</button>
          </div>}
        </div>
      </div>}

      {step==="home"&&<div>
        <h1 style={{color:C.navy,fontSize:20,fontWeight:800,margin:"0 0 4px"}}>Audit de conformite sociale</h1>
        <p style={{color:C.g500,fontSize:13,margin:"0 0 20px"}}>{co.name} - {cp.label.split("-")[0].trim()} - {co.workers} ETP</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:20}}>
          {[
            {v:co.workers,l:"ETP",s:"effectif total"},
            {v:retro.length,l:"fiches auditees",s:"RETROSPECTIF"},
            {v:prev.length,l:"fiches preventif",s:"PREVENTIF"},
          ].map(function(s,i){return <div key={i} style={{background:s.accent?C.navy:C.white,border:"1px solid "+(s.accent?C.steel:C.g200),borderRadius:10,padding:"16px 18px"}}>
            <div style={{color:s.accent?C.accent:C.navy,fontSize:18,fontWeight:800}}>{s.v}</div>
            <div style={{color:s.accent?C.g300:C.g700,fontSize:11,marginTop:2,fontWeight:600}}>{s.l}</div>
            <div style={{color:s.accent?C.g300:C.g500,fontSize:11,marginTop:1}}>{s.s}</div>
          </div>;})}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10,marginBottom:22}}>
          {[
            {id:"retro",label:"Audit Retrospectif",sub:"Calcul du passif",desc:"Quantifie le passif exact par travailleur sur la periode choisie.",border:C.danger,tag:"RETROSPECTIF",bg:"#FEF2F2",has:retro.length>0},
            {id:"preventif",label:"Audit Preventif",sub:"Validation avant emission",desc:"Verifie chaque fiche avant envoi. Identifie corrections necessaires.",border:C.ok,tag:"PREVENTIF",bg:"#F0FFF4",has:prev.length>0},
            {id:"dashboard",label:"Vue Consolidee",sub:"Dashboard automatique",desc:"Resultats de tous les audits en un coup d oeil.",border:C.accent,tag:"INCLUS",bg:"#FFFBF0",has:retro.length>0||prev.length>0},
          ].map(function(m){
            var isActive=m.id==="retro"?retro.length>0:m.id==="preventif"?prev.length>0:retro.length>0||prev.length>0;
            return <div key={m.id} onClick={function(){selMode(m.id);}}
              style={{background:isActive?m.bg:C.white,border:"2px solid "+(isActive?m.border:C.g200),borderRadius:12,padding:"14px 16px",cursor:"pointer",position:"relative",overflow:"hidden",boxShadow:isActive?"0 4px 12px "+m.border+"33":"none",display:"flex",alignItems:"center",gap:14}}>
              <div style={{position:"absolute",top:0,left:0,bottom:0,width:5,background:m.border}}/>
              <div style={{paddingLeft:8,fontSize:26,flexShrink:0}}><Ico name={m.id==="retro"?"search":m.id==="preventif"?"check":"chart"} size={28}/></div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.navy,fontWeight:800,fontSize:14,marginBottom:1}}>{m.label}</div>
                <div style={{color:m.border,fontSize:11,fontWeight:700,marginBottom:4}}>{m.sub}</div>
                <div style={{color:C.g700,fontSize:11,lineHeight:1.4}}>{m.desc}</div>
              </div>
              <div style={{flexShrink:0,textAlign:"center"}}>
                <span style={{background:m.border+"20",border:"1px solid "+m.border,borderRadius:20,padding:"3px 10px",fontSize:10,fontWeight:700,color:m.border,whiteSpace:"nowrap"}}>{m.tag}</span>
                {m.has&&<div style={{width:8,height:8,borderRadius:"50%",background:C.ok,margin:"6px auto 0"}}/>}
              </div>
            </div>;})}
        </div>
      </div>}

      {step==="home"&&<div style={{marginTop:20}}>
        <div style={{color:C.navy,fontWeight:800,fontSize:13,marginBottom:10}}>Cadre legal applique — 3 niveaux</div>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {(co.typeEntreprise==="interim"?[
              {label:"NIVEAU 1 — LOI BELGE",color:"#2C4A6E",bg:"#E8F0FF",items:["Heures sup: +50% sur TAUX REEL du poste occupe (Loi 1971 art.29)","Sursalaire dim/feries: +100% sur taux reel","Prime nuit min 1.51euros/h depuis jan 2026 (CCT n49)"]},
              {label:"NIVEAU 2 — CP 322 INTERIM",color:"#8B4513",bg:"#FFF0E8",items:["Taux variable selon qualification du poste (grille client)","Qualification professionnelle doit figurer sur chaque ligne de prestation","Calcul par periode de paie - pas de prescription 5 ans"]},
              
            ]:[
              {label:"NIVEAU 1 — LOI BELGE",color:"#2C4A6E",bg:"#E8F0FF",items:["Heures sup: +50% sem/sam, +100% dim/feries (Loi 1971 art.29)","Prime nuit min 1.51euros/h depuis jan 2026 (CCT n49)","Prescription: 5 ans max (Loi 1978)"]},
              {label:"NIVEAU 2 — "+cp.label,color:"#8B4513",bg:"#FFF0E8",items:[cp.legal]},
              {label:"NIVEAU 3 — CCT ENTREPRISE",color:"#1A5C1A",bg:"#F0FFE8",items:[co.name.toLowerCase().indexOf("burgo")>=0?"CCT Burgo: transition salariale en cours 2025-2026. Deglobalisation prevue 01/01/2027 (art.2). Primes nuit-sem 4.0209 | nuit-WE 4.2566 | matin 1.0652":"Selon CCT d entreprise - a renseigner dans config"]},
            ]).map(function(niv,i){return <div key={i} style={{background:niv.bg,borderLeft:"4px solid "+niv.color,borderRadius:7,padding:"10px 14px"}}>
            <div style={{fontSize:10,fontWeight:800,color:niv.color,letterSpacing:1,marginBottom:5}}>{niv.label}</div>
            {niv.items.map(function(item,j){return <div key={j} style={{fontSize:11,color:"#363636",lineHeight:1.5}}>{item}</div>;})}
          </div>;})}
        </div>
      </div>}

      {step==="upload"&&<div>
        <button onClick={goHome} style={{background:"none",border:"none",color:C.steel,fontSize:13,cursor:"pointer",marginBottom:16,fontWeight:600}}>{"<"}- Retour</button>
        <div style={{background:C.white,border:"2px solid "+(mode==="retro"?C.danger:C.ok),borderRadius:10,padding:"14px 18px",marginBottom:18,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:22}}>{mode==="retro"?"🔍":"✅"}</span>
          <div>
            <div style={{color:C.navy,fontWeight:800,fontSize:14}}>{mode==="retro"?"Audit Retrospectif":"Audit Preventif"} - {co.name}</div>
            <div style={{color:C.g500,fontSize:12}}>{cp.label} - {co.workers} ETP</div>
          </div>
        </div>
        {mode==="retro"&&<div style={{background:C.white,border:"1px solid "+C.g200,borderRadius:10,padding:"16px 18px",marginBottom:14}}>
          <div style={{color:C.navy,fontWeight:800,fontSize:13,marginBottom:4}}>Periode auditee *</div>
          <div style={{background:C.okL,border:"1px solid "+C.ok,borderRadius:6,padding:"6px 10px",marginBottom:8,fontSize:11,color:C.ok}}>✓ L'annee sera auto-detectee depuis chaque fiche PDF. Le selecteur est une confirmation manuelle.</div>
          <div style={{color:C.g500,fontSize:11,marginBottom:12}}>Choisissez la periode. Prescription legale max: 5 ans.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.g700,marginBottom:5}}>De (debut)</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {(function(){var cur=new Date().getFullYear();var yrs=[];for(var y=2022;y<=cur;y++)yrs.push(y);return yrs;})().map(function(y){return <button key={y} onClick={function(){setYear(y);if(yearTo<y)setYearTo(y);}} style={{background:year===y?C.navy:C.white,color:year===y?C.white:C.navy,border:"2px solid "+(year===y?C.navy:C.g200),borderRadius:7,padding:"6px 10px",cursor:"pointer",fontWeight:year===y?800:600,fontSize:12}}>{y}</button>;})}
              </div>
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,color:C.g700,marginBottom:5}}>A (fin)</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {(function(){var cur=new Date().getFullYear();var yrs=[];for(var y=year;y<=cur;y++)yrs.push(y);return yrs;})().map(function(y){return <button key={y} onClick={function(){setYearTo(y);}} style={{background:yearTo===y?C.navy:C.white,color:yearTo===y?C.white:C.navy,border:"2px solid "+(yearTo===y?C.navy:C.g200),borderRadius:7,padding:"6px 10px",cursor:"pointer",fontWeight:yearTo===y?800:600,fontSize:12}}>{y}</button>;})}
              </div>
            </div>
          </div>
          <div style={{background:"#F0F4FF",borderRadius:7,padding:"8px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:12,color:C.steel,fontWeight:600}}>Periode: {year} - {yearTo} ({(yearTo-year)*12+12} mois)</span>
            {(yearTo-year)>4&&<span style={{fontSize:11,color:C.danger,fontWeight:700}}>Max 5 ans !</span>}
          </div>
          {LEGAL[year]&&<div style={{padding:"6px 10px",background:"#EEF2FF",borderRadius:6,fontSize:11,color:C.steel}}>Lois {year}: {LEGAL[year].j}j formation - {LEGAL[year].nuit.substring(0,35)}...</div>}
        </div>}
        <div style={{background:C.white,border:"2px dashed "+C.g300,borderRadius:12,padding:"28px",textAlign:"center",marginBottom:12}}>
          <div style={{fontSize:28,marginBottom:8}}>📄</div>
          <div style={{color:C.navy,fontWeight:700,fontSize:14,marginBottom:4}}>Deposer une ou plusieurs fiches PDF</div>
          <div style={{color:C.g500,fontSize:12,marginBottom:12}}>SD Worx - Liantis - Securex - Randstad</div>
          <input ref={ref} type="file" accept=".pdf" multiple onChange={onFile} style={{display:"none"}}/>
          <button onClick={function(){ref.current.click();}} style={{background:C.navy,color:C.white,border:"none",borderRadius:7,padding:"9px 20px",fontWeight:700,fontSize:13,cursor:"pointer",marginRight:10}}>Choisir PDF(s)</button>
          {file&&<span style={{color:C.ok,fontWeight:600,fontSize:13}}>✓ {file}</span>}
        </div>
        <div style={{background:"#EBF4FF",border:"1px solid #BDD5F0",borderRadius:10,padding:"14px 16px",marginBottom:12}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:mock?10:0}}>
            <span>🧪</span>
            <span style={{flex:1,fontWeight:700,fontSize:13,color:C.steel}}>Mode demo - fiches fictives Burgo</span>
            <label style={{display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
              <input type="checkbox" checked={mock} onChange={function(e){setMock(e.target.checked);if(!e.target.checked)setDemoFiches([]);}}/>
              <span style={{fontSize:12,fontWeight:600,color:C.steel}}>Activer</span>
            </label>
          </div>
          {mock&&<div>
            <div style={{fontSize:11,color:C.g500,marginBottom:7}}>Selectionnez une ou plusieurs fiches :</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
              <button onClick={function(){
                var filtered=DEMO.filter(function(f){
                  var isInterim=(co.typeEntreprise||"direct")==="interim";
                  if(f.ficheType==="interim"&&!isInterim)return false;
                  if(f.ficheType==="direct"&&isInterim)return false;
                  if(mode==="preventif")return f.ficheMode==="preventif";
                  return f.ficheMode==="retro"&&f.ficheYear>=year&&f.ficheYear<=yearTo;
                });
                var allSel=filtered.every(function(f){return demoFiches.some(function(d){return d.id===f.id;});});
                setDemoFiches(allSel?[]:filtered);
              }} style={{background:C.g100,border:"1px solid "+C.g300,borderRadius:5,padding:"4px 10px",fontSize:11,fontWeight:700,color:C.navy,cursor:"pointer"}}>
                {demoFiches.length>0?"Tout deselectioner":"Tout selectionner"}
              </button>
              <span style={{fontSize:11,color:C.g500}}>{demoFiches.length} selectionnee(s)</span>
            </div>
            <div style={{maxHeight:240,overflowY:"auto",border:"1px solid "+C.g200,borderRadius:8}}>
            {DEMO.filter(function(f){
                var isInterim=(co.typeEntreprise||"direct")==="interim";
                if(f.ficheType==="interim"&&!isInterim)return false;
                if(f.ficheType==="direct"&&isInterim)return false;
                if(mode==="preventif")return f.ficheMode==="preventif";
                return f.ficheMode==="retro"&&f.ficheYear>=year&&f.ficheYear<=yearTo;
              }).map(function(f){
              var isSel=demoFiches.some(function(d){return d.id===f.id;});
              return <div key={f.id} onClick={function(){if(isSel)setDemoFiches(demoFiches.filter(function(d){return d.id!==f.id;}));else setDemoFiches(demoFiches.concat([f]));}}
                style={{display:"flex",alignItems:"center",gap:9,background:isSel?C.okL:C.white,border:"2px solid "+(isSel?C.ok:"#BDD5F0"),borderRadius:8,padding:"10px 14px",cursor:"pointer",marginBottom:6}}>
                <div style={{width:16,height:16,borderRadius:3,border:"2px solid "+(isSel?C.ok:"#BDD5F0"),background:isSel?C.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                  {isSel&&<span style={{color:"white",fontSize:10,fontWeight:800}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:12,color:C.navy}}>{f.label}</div>
                  <div style={{fontSize:11,color:C.g500}}>{f.sub}</div>
                </div>
                <span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:f.tc+"20",color:f.tc}}>{f.tag}</span>
              </div>;
            })}</div>
            {demoFiches.length>1&&<div style={{padding:"5px 9px",background:C.okL,borderRadius:6,fontSize:11,color:C.ok,fontWeight:600}}>{demoFiches.length} fiches - ~{demoFiches.length*2}s</div>}
          </div>}
        </div>
        <div style={{background:"#F0F4FF",border:"1px solid #BCD",borderRadius:8,padding:"12px 16px",marginBottom:12}}>
          <label style={{display:"flex",alignItems:"flex-start",gap:9,cursor:"pointer"}}>
            <input type="checkbox" checked={discOk} onChange={function(e){setDiscOk(e.target.checked);}} style={{marginTop:2,flexShrink:0}}/>
            <span style={{fontSize:12,color:C.g700,lineHeight:1.5}}><strong style={{color:C.navy}}>Pre-audit indicatif.</strong> Resultats a valider par un juriste social avant toute decision. SocialAudit.be decline toute responsabilite.</span>
          </label>
        </div>
        {error&&<div style={{background:C.dangerL,color:C.danger,borderRadius:7,padding:"10px 14px",marginBottom:12,fontSize:13}}>{error}</div>}
        <button onClick={analyze} disabled={(!file&&!(mock&&demoFiches.length>0))||!discOk}
          style={{background:((file||(mock&&demoFiches.length>0))&&discOk)?C.accent:C.g300,color:((file||(mock&&demoFiches.length>0))&&discOk)?C.navy:C.g500,border:"none",borderRadius:8,padding:"12px",fontWeight:800,fontSize:14,cursor:"pointer",width:"100%"}}>
          Lancer l audit →
        </button>
      </div>}

      {step==="analyzing"&&<div style={{textAlign:"center",padding:"50px 20px"}}>
        <div style={{fontSize:38,marginBottom:16}}>⚙️</div>
        <div style={{color:C.navy,fontSize:18,fontWeight:800,marginBottom:6}}>Analyse en cours...</div>
        <div style={{color:C.g500,fontSize:13,marginBottom:24}}>{co.name} - {cp.label.split("-")[0].trim()}</div>
        <div style={{maxWidth:380,margin:"0 auto",display:"flex",flexDirection:"column",gap:8}}>
          {[{n:1,l:"Extraction des donnees salariales"},{n:2,l:"Audit taux et majorations"},{n:3,l:"Verification compteurs et formation"},{n:4,l:"Structuration JSON et validation"}].map(function(s){return <div key={s.n} style={{display:"flex",alignItems:"center",gap:10,background:C.white,borderRadius:8,padding:"10px 16px",border:"1px solid "+C.g200,textAlign:"left"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:C.accentL,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:C.navy,flexShrink:0}}>{s.n}</div>
            <span style={{fontSize:12,fontWeight:600,color:C.navy}}>{s.l}</span>
          </div>;})}
        </div>
      </div>}

      {step==="batch"&&<div style={{padding:"4px 0"}}>
        <div style={{color:C.navy,fontWeight:800,fontSize:17,marginBottom:4}}>Mini-batch en cours...</div>
        <div style={{color:C.g500,fontSize:13,marginBottom:16}}>{co.name} - {batchProg.total} fiches</div>
        <div style={{background:C.g200,borderRadius:8,height:9,marginBottom:8,overflow:"hidden"}}>
          <div style={{background:C.accent,height:9,borderRadius:8,transition:"width 0.5s",width:(batchProg.total>0?(batchProg.current/batchProg.total*100):0)+"%"}}/>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontSize:12,color:C.g500}}>{batchProg.current} / {batchProg.total} fiches</span>
          <span style={{fontSize:12,color:C.g500}}>~{Math.max(0,(batchProg.total-batchProg.current)*2)}s restantes</span>
        </div>
        {batchProg.results.length>0&&<div style={{background:C.white,border:"1px solid "+C.g200,borderRadius:10,overflow:"hidden",marginBottom:14}}>
          <div style={{background:C.navyMid,padding:"8px 14px",display:"grid",gridTemplateColumns:"2fr 80px 130px"}}>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Fichier</div>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Score</div>
            <div style={{color:C.g300,fontSize:10,fontWeight:700}}>Statut</div>
          </div>
          {batchProg.results.map(function(r,i){
            var bc=r._error?{bg:C.g200,c:C.g500}:r.conformite_globale==="NON CONFORME"?{bg:C.dangerL,c:C.danger}:r.conformite_globale==="RISQUE MODERE"?{bg:C.warnL,c:C.warn}:{bg:C.okL,c:C.ok};
            return <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 80px 130px",padding:"10px 14px",background:i%2===0?C.white:C.g100,borderBottom:"1px solid "+C.g200}}>
              <div style={{fontSize:12,color:C.g700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r._filename||("Fiche "+(i+1))}{r._error&&<span style={{color:C.g500,fontSize:10,marginLeft:6}}>— {r._errorMessage||"erreur"}</span>}</div>
              <div style={{fontSize:13,fontWeight:800,color:scoreC(r.score)}}>{r.score}/100</div>
              <span style={{padding:"2px 7px",borderRadius:3,fontSize:10,fontWeight:700,background:bc.bg,color:bc.c,height:"fit-content"}}>{r.conformite_globale}</span>
            </div>;
          })}
        </div>}
        {batchProg.done&&<div>
          <div style={{background:C.okL,border:"1px solid "+C.ok,borderRadius:8,padding:"14px 18px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
            <span style={{fontSize:22}}>✅</span>
            <div>
              <div style={{color:C.ok,fontWeight:800,fontSize:14}}>Batch termine - {batchProg.results.length} fiches analysees</div>
              <div style={{color:C.g700,fontSize:12}}>Resultats ajoutes au dashboard</div>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={function(){setStep("upload");setBatchProg({current:0,total:0,results:[],done:false});setFile(null);setBatchFiles([]);}}
              style={{flex:1,background:C.white,color:C.navy,border:"1px solid "+C.g200,borderRadius:8,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Nouveau batch</button>
            <button onClick={function(){setDash(true);}}
              style={{flex:2,background:C.accent,color:C.navy,border:"none",borderRadius:8,padding:"11px",fontWeight:800,fontSize:13,cursor:"pointer"}}>📊 Voir le dashboard</button>
          </div>
        </div>}
      </div>}

      {step==="result"&&result&&<div>
        <button onClick={function(){setStep("upload");}} style={{background:"none",border:"none",color:C.steel,fontSize:13,cursor:"pointer",marginBottom:14,fontWeight:600}}>{"<"}- Nouvelle analyse</button>
        <div style={{background:"#1A1A2E",border:"1px solid #444",borderRadius:8,padding:"10px 16px",marginBottom:12,display:"flex",gap:10}}>
          <span style={{fontSize:13}}>⚖️</span>
          <span style={{color:"#889",fontSize:11}}>PRE-AUDIT - Resultats a valider par un juriste social. SocialAudit.be: obligation de moyens.</span>
        </div>
        {result._confidence&&result._confidence<80&&<div style={{background:C.warnL,border:"1px solid "+C.warn,borderRadius:8,padding:"8px 14px",marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span>⚠️</span>
          <span style={{fontWeight:700,fontSize:12,color:C.warn}}>Confiance: {result._confidence}/100 - Verification recommandee</span>
        </div>}
        {result._warnings&&result._warnings.length>0&&<div style={{background:"#FFF3CD",border:"1px solid #FFC107",borderRadius:8,padding:"8px 14px",marginBottom:12}}>
          <div style={{fontWeight:700,fontSize:12,color:"#856404",marginBottom:4}}>⚠ Incohérences détectées - vérification manuelle recommandée</div>
          {result._warnings.map(function(w,i){return <div key={i} style={{fontSize:11,color:"#856404"}}>• {w}</div>;})}
        </div>}
        <div style={{background:"linear-gradient(140deg, "+C.navy+" 0%, "+C.navyLight+" 100%)",borderRadius:16,padding:"18px 20px",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:14,boxShadow:"0 8px 32px "+C.shadowM}}>
          <div>
            <div style={{color:C.g300,fontSize:10,letterSpacing:1,marginBottom:3}}>{mode==="retro"?"AUDIT RETROSPECTIF":"AUDIT PREVENTIF"} - {co.name.toUpperCase()}{result._month&&result._year?" - "+result._month+" "+result._year:result._year?" - "+result._year:""}</div>
            <div style={{color:C.white,fontWeight:800,fontSize:17,letterSpacing:"-0.5px"}}>{(result.worker&&result.worker.name)||co.name}</div>
            <div style={{color:C.g300,fontSize:12,marginTop:2}}>{result.worker&&result.worker.cp} - {result.worker&&result.worker.regime} - {result.worker&&result.worker.anciennete}</div>
            <div style={{marginTop:10}}>
              <span style={{display:"inline-block",padding:"4px 14px",borderRadius:20,fontWeight:700,fontSize:12,background:result.conformite_globale==="CONFORME"||result.conformite_globale==="PRETE A EMETTRE"?C.okL:result.conformite_globale==="RISQUE MODERE"?C.warnL:C.dangerL,color:result.conformite_globale==="CONFORME"||result.conformite_globale==="PRETE A EMETTRE"?C.ok:result.conformite_globale==="RISQUE MODERE"?C.warn:C.danger}}>{result.conformite_globale}</span>
            </div>
          </div>
          <ScoreCircle score={result.score||0} size={88} stroke={7}/>
        </div>
        {result.risque_financier_estime&&result.risque_financier_estime!=="0 euros - fiche conforme"&&<div style={{background:"linear-gradient(135deg,#FEF2F2 0%,#FDE8E8 100%)",border:"1.5px solid "+C.dangerM,borderRadius:10,padding:"12px 18px",marginBottom:12,display:"flex",gap:12,alignItems:"center",boxShadow:"0 2px 8px rgba(192,57,43,0.12)"}}>
          <div style={{background:C.dangerL,border:"1px solid "+C.danger,borderRadius:8,width:36,height:36,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <Ico name="warning" size={18}/>
          </div>
          <div>
            <div style={{color:C.danger,fontWeight:800,fontSize:14}}>Passif individuel: {result.risque_financier_estime}</div>
            <div style={{color:C.g700,fontSize:12}}>Ce travailleur uniquement - sans extrapolation</div>
          </div>
        </div>}
        {result.passif_par_travailleur&&result.passif_par_travailleur.length>0&&<div style={{background:C.white,borderRadius:10,border:"1px solid "+C.g200,padding:"16px 18px",marginBottom:12}}>
          <div style={{color:C.navy,fontWeight:800,fontSize:13,marginBottom:10}}>Passif par poste</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:"4px 14px"}}>
            <div style={{color:C.g500,fontSize:10,fontWeight:700}}>POSTE</div>
            <div style={{color:C.g500,fontSize:10,fontWeight:700}}>/ MOIS</div>
            <div style={{color:C.g500,fontSize:10,fontWeight:700}}>TOTAL</div>
            {result.passif_par_travailleur.map(function(p,i){return [
              <div key={"l"+i} style={{color:C.g700,fontSize:12,borderTop:"1px solid "+C.g100,paddingTop:5}}>{p.poste}</div>,
              <div key={"m"+i} style={{color:C.warn,fontSize:12,fontWeight:600,borderTop:"1px solid "+C.g100,paddingTop:5,textAlign:"right"}}>{p.montant_mensuel}</div>,
              <div key={"t"+i} style={{color:C.danger,fontSize:12,fontWeight:700,borderTop:"1px solid "+C.g100,paddingTop:5,textAlign:"right"}}>{p.montant_total_5ans}</div>,
            ];})}
          </div>
        </div>}
        {result._reasoning&&<ReasoningBlock reasoning={result._reasoning}/>}
        <div style={{background:C.white,borderRadius:10,border:"1px solid "+C.g200,padding:"12px 16px",marginBottom:12}}>
          <div style={{color:C.navy,fontWeight:800,fontSize:12,marginBottom:8}}>Cadre legal applique — 3 niveaux</div>
          <div style={{display:"flex",flexDirection:"column",gap:5}}>
            {(co.typeEntreprise==="interim"?[
              {label:"LOI BELGE",color:"#2C4A6E",bg:"#E8F0FF",text:"Heures sup +50% sur TAUX REEL du poste | Sursalaire dim/feries +100% sur taux reel | CCT n49: prime nuit 1.51euros/h"},
              {label:"CP 322 INTERIM",color:"#8B4513",bg:"#FFF0E8",text:"Taux variable selon qualification | Qualification doit figurer sur chaque prestation | Calcul par periode de paie"},
              
            ]:[
              {label:"LOI BELGE",color:"#2C4A6E",bg:"#E8F0FF",text:"Heures sup +50%/+100% | Prime nuit min 1.51euros/h depuis jan 2026 | Prescription 5 ans"},
              {label:"CP "+(co.cp||""),color:"#8B4513",bg:"#FFF0E8",text:cp.legal.substring(0,100)+"..."},
              {label:"CCT ENTREPRISE",color:"#1A5C1A",bg:"#F0FFE8",text:co.name.toLowerCase().indexOf("burgo")>=0?"Transition salariale en cours 2025-2026. Deglobalisation prevue 01/01/2027. Primes nuit-sem 4.0209 | nuit-WE 4.2566":"Selon CCT entreprise applicable"},
            ]).map(function(niv,i){return <div key={i} style={{background:niv.bg,borderLeft:"3px solid "+niv.color,borderRadius:4,padding:"5px 10px"}}>
              <span style={{fontSize:9,fontWeight:800,color:niv.color,letterSpacing:1}}>{niv.label} </span>
              <span style={{fontSize:10,color:"#363636"}}>{niv.text}</span>
            </div>;})}
          </div>
        </div>
        {result.alertes&&result.alertes.length>0&&<div style={{background:C.white,borderRadius:10,border:"1px solid "+C.g200,padding:"16px 18px",marginBottom:12}}>
          <div style={{color:C.navy,fontWeight:800,fontSize:13,marginBottom:10}}>Anomalies detectees</div>
          {result.alertes.map(function(a,i){return <AlertBadge key={i} a={a}/>;})}
        </div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{background:C.white,borderRadius:10,border:"1px solid "+C.g200,padding:"14px 16px"}}>
            <div style={{color:C.ok,fontWeight:800,fontSize:12,marginBottom:8}}>Points conformes</div>
            {(result.points_conformes||[]).map(function(p,i){return <div key={i} style={{color:C.g700,fontSize:11,display:"flex",gap:6,marginBottom:5}}><span style={{color:C.ok}}>✓</span>{p}</div>;})}</div>
          <div style={{background:C.white,borderRadius:10,border:"1px solid "+C.g200,padding:"14px 16px"}}>
            <div style={{color:C.navy,fontWeight:800,fontSize:12,marginBottom:8}}>Actions recommandees</div>
            <ol style={{margin:0,paddingLeft:14}}>{(result.recommandations||[]).map(function(r,i){return <li key={i} style={{color:C.g700,fontSize:11,marginBottom:5}}>{r}</li>;})}</ol>
          </div>
        </div>
        {result.note_contexte&&<div style={{background:"#FFF8E8",border:"1px solid "+C.accent,borderRadius:8,padding:"10px 16px",marginBottom:12}}>
          <div style={{color:C.accent,fontWeight:700,fontSize:12,marginBottom:3}}>Contexte</div>
          <div style={{color:C.g700,fontSize:12}}>{result.note_contexte}</div>
        </div>}
        <div style={{display:"flex",gap:10,marginBottom:12}}>
          <button onClick={function(){window.print();}} style={{flex:1,background:C.white,color:C.navy,border:"1px solid "+C.g200,borderRadius:8,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            Imprimer / Exporter PDF
          </button>
          <button onClick={function(){setDash(true);}} style={{flex:1,background:C.accent,color:C.navy,border:"none",borderRadius:8,padding:"11px",fontWeight:800,fontSize:13,cursor:"pointer"}}>
            Dashboard
          </button>
        </div>
        <div style={{background:C.navy,borderRadius:10,padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10}}>
          <div>
            <div style={{color:C.white,fontWeight:800,fontSize:14}}>{mode==="retro"?"Passif historique mis a jour":"Conformite en cours mise a jour"}</div>
            <div style={{color:C.g300,fontSize:12}}>Consultez le dashboard pour la vue consolidee</div>
          </div>
          <button onClick={function(){setDash(true);}} style={{background:C.accent,color:C.navy,border:"none",borderRadius:7,padding:"10px 18px",fontWeight:800,fontSize:13,cursor:"pointer"}}>Dashboard</button>
        </div>
      </div>}
    </main>
  </div>;
}
