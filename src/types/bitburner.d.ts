export type Message = unknown;
export type Host = string;
export type Script = string;
export type Serializable = string | number | boolean | any[] | Record<PropertyKey, any> | BigInt | null | undefined;
export type StockSymbol =
  | "ECP"
  | "MGCP"
  | "BLD"
  | "CLRK"
  | "OMTK"
  | "FSIG"
  | "KGI"
  | "FLCM"
  | "STM"
  | "DCOMM"
  | "HLS"
  | "VITA"
  | "ICRS"
  | "UNV"
  | "AERO"
  | "OMN"
  | "SLRS"
  | "GPH"
  | "NVMD"
  | "WDS"
  | "LXO"
  | "RHOC"
  | "APHE"
  | "SYSC"
  | "CTK"
  | "NTLK"
  | "OMGA"
  | "FNS"
  | "SGC"
  | "JGN"
  | "CTYS"
  | "MDYN"
  | "TITN";
export type OrderType = "limitbuy" | "limitsell" | "stopbuy" | "stopsell";
export type OrderPos = "long" | "short";
export type University = "Summit University" | "Rothman University" | "ZB Institute Of Technology";
export type UniversityCourse = "Study Computer Science" | "Data Strucures" | "Networks" | "Algorithms" | "Management" | "Leadership";
export type Gym = "Crush Fitness Gym" | "Snap Fitness Gym" | "Iron Gym" | "Powerhouse Gym" | "Millenium Fitness Gym";
export type GymStat = "str" | "def" | "dex" | "agi";
export type City = "Aevum" | "Chongqing" | "Sector-12" | "New Tokyo" | "Ishima" | "Volhaven";
export type PurchaseableProgram =
  | "brutessh.exe"
  | "ftpcrack.exe"
  | "relaysmtp.exe"
  | "httpworm.exe"
  | "sqlinject.exe"
  | "deepscanv1.exe"
  | "deepscanv2.exe"
  | "autolink.exe";
export type CreatableProgram = PurchaseableProgram | "serverprofiler.exe";
export type CompanyName =
  // Sector-12
  | "MegaCorp"
  | "BladeIndustries"
  | "FourSigma"
  | "IcarusMicrosystems"
  | "UniversalEnergy"
  | "DeltaOne"
  | "CIA"
  | "NSA"
  | "AlphaEnterprises"
  | "CarmichaelSecurity"
  | "FoodNStuff"
  | "JoesGuns"

  // Aevum
  | "ECorp"
  | "BachmanAndAssociates"
  | "ClarkeIncorporated"
  | "OmniTekIncorporated"
  | "FulcrumTechnologies"
  | "GalacticCybersystems"
  | "AeroCorp"
  | "WatchdogSecurity"
  | "RhoConstruction"
  | "AevumPolice"
  | "NetLinkTechnologies"

  // Volhaven
  | "NWO"
  | "HeliosLabs"
  | "OmniaCybersystems"
  | "LexoCorp"
  | "SysCoreSecurities"
  | "CompuTek"

  // Chongqing
  | "KuaiGongInternational"
  | "SolarisSpaceSystems"

  // Ishima
  | "StormTechnologies"
  | "NovaMedical"
  | "OmegaSoftware"

  // New Tokyo
  | "DefComm"
  | "VitaLife"
  | "GlobalPharmaceuticals"
  | "NoodleBar";
export type CompanyField =
  | "software"
  | "software consultant"
  | "it"
  | "security engineer"
  | "network engineer"
  | "business"
  | "business consultant"
  | "security"
  | "agent"
  | "employee"
  | "part-time employee"
  | "waiter"
  | "part-time waiter";
export type FactionName =
  | "Illuminati"
  | "Daedalus"
  | "The Covenant"
  | "ECorp"
  | "MegaCorp"
  | "Bachman & Associates"
  | "Blade Industries"
  | "NWO"
  | "Clarke Incorporated"
  | "OmniTek Incorporated"
  | "Four Sigma"
  | "KuaiGong International"
  | "Fulcrum Secret Technologies"
  | "BitRunners"
  | "The Black Hand"
  | "NiteSec"
  | "Aevum"
  | "Chongqing"
  | "Ishima"
  | "New Tokyo"
  | "Sector-12"
  | "Volhaven"
  | "Speakers for the Dead"
  | "The Dark Army"
  | "The Syndicate"
  | "Silhouette"
  | "Tetrads"
  | "Slum Snakes"
  | "Netburners"
  | "Tian Di Hui"
  | "CyberSec"
  | "Bladeburners";

export type GangName = "Slum Snakes" | "Tetrads" | "The Syndicate" | "The Dark Army" | "Speakers for the Dead" | "NiteSec" | "The Black Hand";
export type FactionWork = "hacking" | "field" | "security";
export type Crime =
  | "shoplift"
  | "rob store"
  | "mug"
  | "larceny"
  | "deal drugs"
  | "bond forgery"
  | "traffick arms"
  | "homicide"
  | "grand theft auto"
  | "kidnap"
  | "assassinate"
  | "heist";
export type AugmentName =
  | "Augmented Targeting I"
  | "Augmented Targeting II"
  | "Augmented Targeting III"
  | "Synthetic Heart"
  | "Synfibril Muscle"
  | "Combat Rib I"
  | "Combat Rib II"
  | "Combat Rib III"
  | "Nanofiber Weave"
  | "NEMEAN Subdermal Weave"
  | "Wired Reflexes"
  | "Graphene Bone Lacings"
  | "Bionic Spine"
  | "Graphene Bionic Spine Upgrade"
  | "Bionic Legs"
  | "Graphene Bionic Legs Upgrade"
  | "Speech Processor Implant"
  | "TITN-41 Gene-Modification Injection"
  | "Enhanced Social Interaction Implant"
  | "BitWire"
  | "Artificial Bio-neural Network Implant"
  | "Artificial Synaptic Potentiation"
  | "Enhanced Myelin Sheathing"
  | "Synaptic Enhancement Implant"
  | "Neural-Retention Enhancement"
  | "DataJack"
  | "Embedded Netburner Module"
  | "Embedded Netburner Module Core Implant"
  | "Embedded Netburner Module Core V2 Upgrade"
  | "Embedded Netburner Module Core V3 Upgrade"
  | "Embedded Netburner Module Analyze Engine"
  | "Embedded Netburner Module Direct Memory Access Upgrade"
  | "Neuralstimulator"
  | "Neural Accelerator"
  | "Cranial Signal Processors - Gen I"
  | "Cranial Signal Processors - Gen II"
  | "Cranial Signal Processors - Gen III"
  | "Cranial Signal Processors - Gen IV"
  | "Cranial Signal Processors - Gen V"
  | "Neuronal Densification"
  | "Nuoptimal Nootropic Injector Implant"
  | "Speech Enhancement"
  | "FocusWire"
  | "PC Direct-Neural Interface"
  | "PC Direct-Neural Interface Optimization Submodule"
  | "PC Direct-Neural Interface NeuroNet Injector"
  | "ADR-V1 Pheromone Gene"
  | "ADR-V2 Pheromone Gene"
  | "The Shadow's Simulacrum"
  | "Hacknet Node CPU Architecture Neural-Upload"
  | "Hacknet Node Cache Architecture Neural-Upload"
  | "Hacknet Node NIC Architecture Neural-Upload"
  | "Hacknet Node Kernel Direct-Neural Interface"
  | "Hacknet Node Core Direct-Neural Interface"
  | "NeuroFlux Governor"
  | "Neurotrainer I"
  | "Neurotrainer II"
  | "Neurotrainer III"
  | "HyperSight Corneal Implant"
  | "LuminCloaking-V1 Skin Implant"
  | "LuminCloaking-V2 Skin Implant"
  | "HemoRecirculator"
  | "SmartSonar Implant"
  | "Power Recirculation Core"
  | "QLink"
  | "The Red Pill"
  | "SPTN-97 Gene Modification"
  | "ECorp HVMind Implant"
  | "CordiARC Fusion Reactor"
  | "SmartJaw"
  | "Neotra"
  | "Xanipher"
  | "nextSENS Gene Modification"
  | "OmniTek InfoLoad"
  | "Photosynthetic Cells"
  | "BitRunners Neurolink"
  | "The Black Hand"
  | "CRTX42-AA Gene Modification"
  | "Neuregen Gene Modification"
  | "CashRoot Starter Kit"
  | "NutriGen Implant"
  | "INFRARET Enhancement"
  | "DermaForce Particle Barrier"
  | "Graphene BranchiBlades Upgrade"
  | "Graphene Bionic Arms Upgrade"
  | "BrachiBlades"
  | "Bionic Arms"
  | "Social Negotiation Assistant (S.N.A)"
  | "EsperTech Bladeburner Eyewear"
  | "EMS-4 Recombination"
  | "ORION-MKIV Shoulder"
  | "Hyperion Plasma Cannon V1"
  | "Hyperion Plasma Cannon V2"
  | "GOLEM Serum"
  | "Vangelis Virus"
  | "Vangelis Virus 3.0"
  | "I.N.T.E.R.L.I.N.K.E.D"
  | "Blade's Runners"
  | "BLADE-51b Tesla Armor"
  | "BLADE-51b Tesla Armor: Power Cells Upgrade"
  | "BLADE-51b Tesla Armor: Energy Shielding Upgrade"
  | "BLADE-51b Tesla Armor: Unibeam Upgrade"
  | "BLADE-51b Tesla Armor: Omnibeam Upgrade"
  | "BLADE-51b Tesla Armor: IPU Upgrade"
  | "The Blade's Simulacrum";

export declare interface Player {
  hacking: number;
  hp: number;
  max_hp: number;
  strength: number;
  defense: number;
  dexterity: number;
  agility: number;
  charisma: number;
  intelligence: number;
  hacking_chance_mult: number;
  hacking_speed_mult: number;
  hacking_money_mult: number;
  hacking_grow_mult: number;
  hacking_exp: number;
  strength_exp: number;
  defense_exp: number;
  dexterity_exp: number;
  agility_exp: number;
  charisma_exp: number;
  hacking_mult: number;
  strength_mult: number;
  defense_mult: number;
  dexterity_mult: number;
  agility_mult: number;
  charisma_mult: number;
  hacking_exp_mult: number;
  strength_exp_mult: number;
  defense_exp_mult: number;
  dexterity_exp_mult: number;
  agility_exp_mult: number;
  charisma_exp_mult: number;
  company_rep_mult: number;
  faction_rep_mult: number;
  numPeopleKilled: number;
  money: number;
  city: string;
  location: string;
  companyName: string;
  crime_money_mult: number;
  crime_success_mult: number;
  isWorking: boolean;
  workType: string;
  currentWorkFactionName: string;
  currentWorkFactionDescription: string;
  workHackExpGainRate: number;
  workStrExpGainRate: number;
  workDefExpGainRate: number;
  workDexExpGainRate: number;
  workAgiExpGainRate: number;
  workChaExpGainRate: number;
  workRepGainRate: number;
  workMoneyGainRate: number;
  workMoneyLossRate: number;
  workHackExpGained: number;
  workStrExpGained: number;
  workDefExpGained: number;
  workDexExpGained: number;
  workAgiExpGained: number;
  workChaExpGained: number;
  workRepGained: number;
  workMoneyGained: number;
  createProgramName: string;
  createProgramReqLvl: number;
  className: string;
  crimeType: string;
  work_money_mult: number;
  hacknet_node_money_mult: number;
  hacknet_node_purchase_cost_mult: number;
  hacknet_node_ram_cost_mult: number;
  hacknet_node_core_cost_mult: number;
  hacknet_node_level_cost_mult: number;
  hasWseAccount: boolean;
  hasTixApiAccess: boolean;
  has4SData: boolean;
  has4SDataTixApi: boolean;
  bladeburner_max_stamina_mult: number;
  bladeburner_stamina_gain_mult: number;
  bladeburner_analysis_mult: number;
  bladeburner_success_chance_mult: number;
  bitNodeN: number;
  totalPlaytime: number;
  playtimeSinceLastAug: number;
  playtimeSinceLastBitnode: number;
  jobs: any;
  factions: string[];
  tor: boolean;
}
