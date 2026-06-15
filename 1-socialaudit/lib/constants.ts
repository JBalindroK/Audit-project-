// =============================================
// SocialAudit.be - Constantes metier
// CCT Burgo Ardennes, indexations CP129, grilles salariales
// =============================================

export const C = {
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

export const CP: Record<string, any> = {
  "129":{label:"CP 129 - Papier/Carton",legal:"CP 129: indexation trimestrielle. Sursalaire dim/feries +100%. Heures sup +50%. Formation 5j/an.",
    profiles:[{id:"c5",label:"Continu 5 eq.",icon:"🔄",nb:"",risk:"ELEVE",rc:"#C0392B"},{id:"sc",label:"Semi-continu 3 eq.",icon:"🔁",nb:"",risk:"MODERE",rc:"#E67E22"},{id:"j",label:"Journee fixe",icon:"☀️",nb:"",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"",risk:"FAIBLE",rc:"#1A7A4A"}]},
  "111":{label:"CP 111 - Metallurgie",legal:"CP 111: min 15.96euros/h. +2.72% juil 2025. Sursalaire +100% dim. Formation 5j/an.",
    profiles:[{id:"t3",label:"Equipes 3x8",icon:"🔄",nb:"",risk:"ELEVE",rc:"#C0392B"},{id:"j",label:"Journee",icon:"☀️",nb:"",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"",risk:"FAIBLE",rc:"#1A7A4A"}]},
  "autre":{label:"Autre CP",legal:"Loi belge: sursalaire +100% dim/feries. Heures sup +50%. Formation 5j/an.",
    profiles:[{id:"eq",label:"Equipes",icon:"🔄",nb:"",risk:"ELEVE",rc:"#C0392B"},{id:"j",label:"Journee",icon:"☀️",nb:"",risk:"FAIBLE",rc:"#1A7A4A"},{id:"e",label:"Employes",icon:"💼",nb:"",risk:"FAIBLE",rc:"#1A7A4A"}]},
};

export const INDEXATIONS: Record<string, any> = {
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

export const LEGAL: Record<number, any> = {
  2022:{j:0,f:"Pas d obligation formation",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Pre-Deal emploi."},
  2023:{j:4,f:"4 jours/an (Deal emploi)",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Premier exercice 4j formation."},
  2024:{j:5,f:"5 jours/an depuis 01/01/2024",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Obligation 5j plein regime."},
  2025:{j:5,f:"5 jours/an (Deal emploi)",nuit:"Pas de minimum CCT n49",tk:"8euros",note:"Verifier indexations CP 129."},
  2026:{j:5,f:"5 jours/an (Deal emploi)",nuit:"Minimum 1.51euros/h depuis jan 2026",tk:"10euros depuis 01/06/2026",note:"Prime nuit 1.51 depuis jan. Tickets 10 depuis juin."},
};

export const DEF: any = {name:"Burgo Ardennes S.A.",num:"0451.821.842",cp:"129",workers:"596",country:"BE",
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

export const GRILLE_PAR_ANNEE: Record<string, any> = {
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
