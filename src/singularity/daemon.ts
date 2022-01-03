import { NS, Player, ProcessInfo, BitNodeMultipliers, Server } from "../../NetscriptDefinitions";
import { SingularityJob, SingularityAsyncJob, HackingTool, BurnerDictionary, PortCracker, BurnerServer } from "../types/types";

import {
  getActiveSourceFiles_Custom,
  waitForProcessToComplete_Custom,
  getNsDataThroughFile,
  getFnIsAliveViaNsPs,
  tryGetBitNodeMultipliers_Custom,
} from "/lib/ram.js";
import { disableLogs, log as logHelper } from "/lib/helper.js";
import { scanAllServers } from "/lib/hacking.js";
import { formatRam, formatMoney } from "/lib/format.js";
import { HackingContext } from "/lib/entities/hacking.class.js";
import { EarlyHackingStrategy } from "/lib/entities/earlyHackingStrategy.js";

// === CONSTANTS ===
// track how costly (in security) a growth/hacking thread is.
const growthThreadHardening = 0.004;
const hackThreadHardening = 0.002;
// initial potency of weaken threads before multipliers
const weakenThreadPotency = 0.05;
// unadjusted server growth rate, this is way more than what you actually get
const unadjustedGrowthRate = 1.03;
// max server growth rate, growth rates higher than this are throttled.
const maxGrowthRate = 1.0035;
// Pad weaken thread counts to account for undershooting. (Shouldn't happen. And if this is a timing issue, padding won't help)
const weakenThreadPadding = 0; //0.01;
// The name given to purchased servers (should match what's in host-manager.js)
const purchasedServersName = "daemon";

// === Variables ===
let _ns: NS;
let daemonHost = "home"; // the name of the host of this daemon, so we don't have to call the function more than once.
let playerStats: Player; // stores ultipliers for player abilities and other player info
let hasFormulas = true;
let bitnodeMults: BitNodeMultipliers; // bitnode multipliers that can be automatically determined after SF-5

// Allows some home ram to be reserved for ad-hoc terminal script running and when home is explicitly set as the "preferred server" for starting a helper
const homeReservedRam = 32;

// == Tools and Scripts
// the port cracking array, we use this to do some things
let portCrackers: any[] = [];
// The primary tools copied around and used for hacking
let hackTools: any[] = [];
// the port cracking array, we use this to do some things
// toolkit var for remembering the names and costs of the scripts we use the most
let tools: HackingTool[] = [];
let toolsByShortName: { [index: string]: HackingTool } = {}; // Dictionary keyed by tool short name

// === Command line flags
let options;
let verbose: boolean;

// ==== Dictionaries and Data objects ====
// Server lists
let addedServerNames: string[] = [];
let serverList: BurnerServer[] = [];
let serverListByFreeRam: BurnerServer[] = [];
let serverListByMaxRam: BurnerServer[] = [];
let serverListByTargetOrder: BurnerServer[] = [];

// Server Dictionaries
let dictServerRequiredHackinglevels: BurnerDictionary = {};
let dictServerNumPortsRequired: BurnerDictionary = {};
let dictServerMinSecurityLevels: BurnerDictionary = {};
let dictServerProfitInfo: any = {};
let dictServerMaxMoney: BurnerDictionary = {};

// Player and Augmentations
let dictSourceFiles: any; // Available source files

// Main loop
const loopInterval = 1000; //ms
const cycleTimingDelay = 1600; //ms

let hackingContext;

// Jobs and ancilliary tasks
let asynchronousJobs: SingularityAsyncJob[] = []; // Scripts meant to be run asynchrounously outside of the main loop of the daemon
let periodicJobs: SingularityJob[] = []; // Scripts meant to be ran in an interval

// Cache for process information
let psCache: { [index: string]: ProcessInfo[] | ProcessInfo } = {};

// Replacements / wrappers for various NS calls to let us keep track of them in one place and consolidate where possible
const log = (...args: any[]): string => logHelper(_ns, ...args);

const argsSchema = [
  ["v", false], // Detailed logs about batch scheduling / tuning
  ["verbose", false],
];

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: any, args: string[]): string[] {
  data.flags(argsSchema);
  return [];
}

export async function main(ns: NS): Promise<void> {
  _ns = ns;
  daemonHost = "home";

  // Reset global vars on startup since they persist in memory in certain situations (such as on Augmentation)
  serverListByFreeRam = [];
  serverListByTargetOrder = [];
  serverListByMaxRam = [];
  addedServerNames = [];
  portCrackers = [];
  tools = [];
  toolsByShortName = {};
  psCache = {};

  // Process command line args (if any)
  //@ts-ignore
  options = ns.flags(argsSchema);
  verbose = options.v || options.verbose;

  // Initialize the script by retrieving the player stats and the available source files
  refreshPlayerStats();
  dictSourceFiles = await getActiveSourceFiles_Custom(ns, getNsDataThroughFile);

  // Let's disable the noisy stuff and keep the logs clean
  disableLogs(ns, ["getServerMaxRam", "getServerUsedRam", "getServerMoneyAvailable", "getServerGrowth", "getServerSecurityLevel", "exec", "scan"]);

  // Setup the asynchronous jobs
  asynchronousJobs = [
    { name: "/gui/stats.js", isLaunched: false, requiredServer: "home", shouldRun: () => ns.getServerMaxRam("home") >= 32 /* Don't waste precious RAM */ }, // Adds stats not usually in the HUD
  ];

  let interval = 29000; // Set the starting interval for periodic jobs

  // Setup the periodic jobs
  periodicJobs = [
    {
      interval: (interval += 1000),
      name: "/singularity/tasks/purchaseTor.js",
      shouldRun: () => 4 in dictSourceFiles && !addedServerNames.includes("darkweb"),
    },
    {
      interval: (interval += 1000),
      name: "/singularity/tasks/purchasePrograms.js",
      shouldRun: () => 4 in dictSourceFiles && getNumPortCrackers() != 5,
    },
    {
      interval: (interval += 1000),
      name: "/singularity/tasks/upgradeRam.js",
      shouldRun: () => 4 in dictSourceFiles && dictSourceFiles[4] >= 2,
    }
  ];

  /**
   * Prepare the data that we need about server information and the bitnode multipliers
   */
  await getStaticServerData(ns, scanAllServers(ns)); // Gather information about servers that will never change
  await establishMultipliers(ns); // figure out the various bitnode and player multipliers

  /**
   * Prepare the main objects before we initialize scripts and run our main loop
   *
   * buildToolkit - Creates list of the hacking scripts available to us
   * buildServerList - Create a list of the Servers with helper functions
   * buildProtCrackingArray - Creates a list of the Cracking tools available with helper functions
   */
  buildToolkit(ns);
  buildServerList(ns);
  buildPortCrackingArray(ns); // build port cracking array

  /**
   * Launch the Startup scripts, this are meant to be ran only once and typically from home as the host
   */
  await runStartupScripts(ns);

  // Run the main loop responsible for any periodid jobs
  await mainLoop(ns);
}

async function mainLoop(ns: NS): Promise<void> {
  log("Starting daemon main loop");
  let loops = -1;

  // Initialize Contexts 
  hackingContext = new HackingContext(ns, new EarlyHackingStrategy())

  // Open up the first set of servers 
  await crackServers(ns, serverListByTargetOrder, portCrackers)

  do {
    loops++;
    if (loops > 0) await ns.sleep(loopInterval);
    try {
      psCache = {}; // clear the cache for this run
      refreshPlayerStats();
      buildServerList(ns, true); // Check if any new servers have been purchased by the external host_manager process
      await runPeriodicJobs(ns); // Run periodic jobs


      if (loops % 60 == 0) {
        // For more expensive updates, only do these every so often
        await refreshDynamicServerData(ns, addedServerNames);
        await crackServers(ns, serverListByTargetOrder, portCrackers)
      }

      sortServerList("targeting"); // Update the order in which we ought to target servers

      let network = getNetworkStats();

      // Main actions that are repeated every single time on the loop
      if ((playerStats.hacking < 100 || network.listOfServersFreeRam.length <= 0)) {
        await hackingContext.run(playerStats, serverListByTargetOrder)
        // ns.tprint("We are early in the loop we should go to school");
        // ns.universityCourse("Rothman University", "Study Computer Science");

        // let serList = serverListByTargetOrder.filter(server => server.canCrack())
        // let crackList = portCrackers.filter(cracker => cracker.exists())

        // crackList.forEach((crack) => {
        //   ns.tprint(crack.name)
        // })

        // serList.forEach(function(server) {
        //   ns.tprint(`${server.name} - ${server.portsRequired} - ${server.getSecurity()} `)
        //   ns.print(`${server.name} - ${server.portsRequired} - ${server.getSecurity()} `)
        //   ns.nuke(server.name)
        // })

      } else {
        ns.tprint("We have xp let's do something else ");
      }
    } catch (err) {
      log("WARNING: Caught an error in the main loop: " + err, true, "warning");
    }
  } while (true);
}

// Gathers up arrays of server data via external request to have the data written to disk.
async function getStaticServerData(ns: NS, serverNames: string[]): Promise<void> {
  dictServerRequiredHackinglevels = await getNsDataThroughFile(
    ns,
    serversDictCommand(serverNames, "ns.getServerRequiredHackingLevel(server)"),
    "/Temp/servers-hack-req.txt"
  );
  dictServerNumPortsRequired = await getNsDataThroughFile(
    ns,
    serversDictCommand(serverNames, "ns.getServerNumPortsRequired(server)"),
    "/Temp/servers-num-ports.txt"
  );
  await refreshDynamicServerData(ns, serverNames);
}

// Checks whether it's time for any scheduled tasks to run
/** @param {NS} ns **/
async function runPeriodicJobs(ns: NS): Promise<void> {
  for (const task of periodicJobs) {
    const job = getTool(task);

    if (Date.now() - (job.lastRun || 0) >= task.interval && (job.shouldRun === undefined || job.shouldRun())) {
      job.lastRun = Date.now();
      await runJob(ns, job);
    }
  }
}

// =================================== //
// =========== Closures =============  //
// =================================== //

const getServerByName = (hostname: string) => serverList.find((s) => s.name == hostname);
const actualWeakenPotency = () => bitnodeMults.ServerWeakenRate * weakenThreadPotency * (1 - weakenThreadPadding);
const hashToolDefinition = (s: HackingTool): number => hashCode(s.name + JSON.stringify(s.args || []));
// Indication that a server has been flagged for deletion (by the host manager). Doesn't count for home of course, as this is where the flag file is stored for copying.
const isFlaggedForDeletion = (hostName: string): boolean => hostName != "home" && doesFileExist("/flags/deleting.txt", hostName);
const serversDictCommand = (servers: any, command: string) => `Object.fromEntries(${JSON.stringify(servers)}.map(server => [server, ${command}]))`;

// =================================== //
// ===== Synchronous helper functions  //
// =================================== //

/**
 * Update all the player stats and information on the global state
 *
 * @return  {Player}  Player information obkect
 */
function refreshPlayerStats(): Player {
  return (playerStats = _ns.getPlayer());
}

/**
 * Return the player hacking skill values
 *
 * @return  {Player[]}
 */
function playerHackSkill(): Player["hacking"] {
  return playerStats.hacking;
}

function getPlayerHackingGrowMulti(): Player["hacking_grow_mult"] {
  return playerStats.hacking_grow_mult;
}

function doesFileExist(filename: string, hostname: string | undefined = undefined): boolean {
  return _ns.fileExists(filename, hostname);
}

function getNumPortCrackers(): number {
  return portCrackers.filter((c) => c.exists()).length;
}

function getTool(s: string | HackingTool | SingularityJob | SingularityAsyncJob): any {
  //@ts-ignore
  return toolsByShortName[s] || toolsByShortName[s.shortName || hashToolDefinition(s)];
}

/** Generate a hashCode for a string that is pretty unique most of the time */
export function hashCode(s: string): number {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
}

/**
 * Check running status of scripts on servers
 *
 * @param   {NS}      ns
 * @param   {string}  scriptName   name of the script we want to check. Must include the full path
 * @param   {[type]}  canUseCache  allow to use cache for the ps command
 *
 * @return  {string}               server name running the script
 */
function whichServerIsRunning(ns: NS, scriptName: string, canUseCache = true): string | null {
  for (const server of serverListByFreeRam)
    if (ps(ns, server.name, canUseCache).some((process: { filename: any }) => process.filename === scriptName)) return server.name;
  return null;
}

/**
 * PS can get expensive, and we use it a lot so we cache this for the duration of a loop
 *
 * @param   {NS}             ns
 * @param   {string}         server       server name
 * @param   {[type]}         canUseCache  allow to use cache for the ps command
 *
 * @return  {ProcessInfo[]}               Process information for the given server
 */
function ps(ns: NS, server: string, canUseCache = true): ProcessInfo[] {
  const cachedResult = psCache[server];
  //@ts-ignore
  return canUseCache && cachedResult ? cachedResult : (psCache[server] = ns.ps(server));
}

/** @param {NS} ns **/
function addServer(server: BurnerServer, verbose?: boolean): void {
  if (verbose) log(`Adding a new server to all lists: ${server}`);
  addedServerNames.push(server.name);
  serverList.push(server);
  // Lists maintained in various sort orders
  serverListByFreeRam.push(server);
  serverListByMaxRam.push(server);
  serverListByTargetOrder.push(server);
}

/** @param {NS} ns **/
function removeServerByName(deletedHostName: string): void {
  addedServerNames.splice(addedServerNames.indexOf(deletedHostName), 1);
  const removeByName = (hostname: any, list: any[], listname: string) => {
    const toRemove = list.findIndex((s: { name: any }) => s.name === hostname);
    if (toRemove === -1) log(`ERROR: Failed to find server by name ${hostname}.`, true, "error");
    else {
      list.splice(toRemove, 1);
      log(`${hostname} was found at index ${toRemove} of list ${listname} and removed leaving ${list.length} items.`);
    }
  };
  removeByName(deletedHostName, serverListByFreeRam, "serverListByFreeRam");
  removeByName(deletedHostName, serverListByMaxRam, "serverListByMaxRam");
  removeByName(deletedHostName, serverListByTargetOrder, "serverListByTargetOrder");
}

/** @param {NS} ns **/
function buildServerList(ns: NS, verbose = false): void {
  // Get list of servers (i.e. all servers on first scan, or newly purchased servers on subsequent scans) that are not currently flagged for deletion
  const allServers = scanAllServers(ns).filter((hostName) => !isFlaggedForDeletion(hostName));

  // Remove all servers we currently have added that are no longer being returned by the above query
  for (const hostName of addedServerNames.filter((hostName) => !allServers.includes(hostName))) {
    removeServerByName(hostName);
  }

  // Add any servers that are new
  allServers.filter((hostName) => !addedServerNames.includes(hostName)).forEach((hostName) => addServer(buildServerObject(ns, hostName)));
}

// assemble a list of port crackers and abstract their functionality
/** @param {NS} ns **/
function buildPortCrackingArray(ns: NS): void {
  const crackNames = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"];
  for (let i = 0; i < crackNames.length; i++) {
    const cracker = buildPortCrackerObject(ns, crackNames[i]);
    portCrackers.push(cracker);
  }
}

/** @param {NS} ns **/
function buildServerObject(ns: NS, node: string): BurnerServer {
  return {
    ns: ns,
    name: node,
    requiredHackLevel: dictServerRequiredHackinglevels[node],
    portsRequired: dictServerNumPortsRequired[node],
    getMinSecurity: () => dictServerMinSecurityLevels[node] ?? 0, // Servers not in our dictionary were purchased, and so undefined is okay
    getMaxMoney: () => dictServerMaxMoney[node] ?? 0,
    getMoneyPerRamSecond: () => (dictServerProfitInfo ? dictServerProfitInfo[node]?.gainRate ?? 0 : dictServerMaxMoney[node] ?? 0),
    getExpPerSecond: () => (dictServerProfitInfo ? dictServerProfitInfo[node]?.expRate ?? 0 : 1 / dictServerMinSecurityLevels[node] ?? 0),
    percentageToSteal: 1.0 / 16.0, // This will get tweaked automatically based on RAM available and the relative value of this server
    getMoney: function () {
      return this.ns.getServerMoneyAvailable(this.name);
    },
    getSecurity: function () {
      return this.ns.getServerSecurityLevel(this.name);
    },
    canCrack: function () {
      return getNumPortCrackers() >= this.portsRequired;
    },
    canHack: function () {
      return this.requiredHackLevel <= playerHackSkill();
    },
    shouldHack: function () {
      return this.getMaxMoney() > 0 && this.name !== "home" && !this.name.startsWith("hacknet-node-") && !this.name.startsWith(purchasedServersName); // Hack, but beats wasting 2.25 GB on ns.getPurchasedServers()
    },
    previouslyPrepped: false,
    prepRegressions: 0,
    previousCycle: null,
    // "Prepped" means current security is at the minimum, and current money is at the maximum
    isPrepped: function () {
      const currentSecurity = this.getSecurity();
      const currentMoney = this.getMoney();
      // Logic for whether we consider the server "prepped" (tolerate a 1% discrepancy)
      const isPrepped =
        (currentSecurity == 0 || this.getMinSecurity() / currentSecurity >= 0.99) && this.getMaxMoney() != 0 && currentMoney / this.getMaxMoney() >= 0.99;
      return isPrepped;
    },
    // Function to tell if the sever is running any tools, with optional filtering criteria on the tool being run
    isSubjectOfRunningScript: function (filter, useCache = true, count = 0) {
      const toolNames = hackTools.map((t) => t.name);
      let total = 0;
      // then figure out if the servers are running the other 2, that means prep
      for (const hostname of addedServerNames)
        for (const process of ps(ns, hostname, useCache))
          if (toolNames.includes(process.filename) && process.args[0] == this.name && (!filter || filter(process))) {
            if (count) total++;
            else return true;
          }
      return count ? total : false;
    },
    isPrepping: function (useCache = true) {
      return this.isSubjectOfRunningScript((process: ProcessInfo) => process.args.length > 4 && process.args[4] == "prep", useCache);
    },
    isTargeting: function (useCache = true) {
      return this.isSubjectOfRunningScript((process: ProcessInfo) => process.args.length > 4 && process.args[4].includes("Batch"), useCache);
    },
    isXpFarming: function (useCache = true) {
      return this.isSubjectOfRunningScript((process: ProcessInfo) => process.args.length > 4 && process.args[4].includes("FarmXP"), useCache);
    },
    serverGrowthPercentage: function (): number {
      return (this.ns.getServerGrowth(this.name) * bitnodeMults.ServerGrowthRate * getPlayerHackingGrowMulti()) / 100;
    },
    adjustedGrowthRate: function () {
      return Math.min(maxGrowthRate, 1 + (unadjustedGrowthRate - 1) / this.getMinSecurity());
    },
    actualServerGrowthRate: function () {
      return Math.pow(this.adjustedGrowthRate(), this.serverGrowthPercentage());
    },
    // this is the target growth coefficient *immediately*
    targetGrowthCoefficient: function () {
      return this.getMaxMoney() / Math.max(this.getMoney(), 1);
    },
    // this is the target growth coefficient per cycle, based on theft
    targetGrowthCoefficientAfterTheft: function () {
      return 1 / (1 - this.getHackThreadsNeeded() * this.percentageStolenPerHackThread());
    },
    cyclesNeededForGrowthCoefficient: function (): number {
      return Math.log(this.targetGrowthCoefficient()) / Math.log(this.adjustedGrowthRate());
    },
    cyclesNeededForGrowthCoefficientAfterTheft: function () {
      return Math.log(this.targetGrowthCoefficientAfterTheft()) / Math.log(this.adjustedGrowthRate());
    },
    percentageStolenPerHackThread: function () {
      if (hasFormulas) {
        try {
          const server = {
            hackDifficulty: this.getMinSecurity(),
            requiredHackingSkill: this.requiredHackLevel,
          };
          //@ts-ignore
          return ns.formulas.hacking.hackPercent(server, playerStats); // hackAnalyzePercent(this.name) / 100;
        } catch {
          hasFormulas = false;
        }
      }
      return Math.min(
        1,
        Math.max(0, (((100 - Math.min(100, this.getMinSecurity())) / 100) * ((playerHackSkill() - (this.requiredHackLevel - 1)) / playerHackSkill())) / 240)
      );
    },
    actualPercentageToSteal: function (): number {
      return this.getHackThreadsNeeded() * this.percentageStolenPerHackThread();
    },
    getHackThreadsNeeded: function (): number {
      // Force rounding of low-precision digits before taking the floor, to avoid double imprecision throwing us way off.
      return Math.floor(parseFloat((this.percentageToSteal / this.percentageStolenPerHackThread()).toPrecision(14)));
    },
    getGrowThreadsNeeded: function (): number {
      const n = (this.cyclesNeededForGrowthCoefficient() / this.serverGrowthPercentage()).toPrecision(14);
      return Math.min(
        this.getMaxMoney(), // Worse case (0 money on server) we get 1$ per thread
        Math.ceil(parseFloat(n))
      );
    },
    getGrowThreadsNeededAfterTheft: function (): number {
      const n = (this.cyclesNeededForGrowthCoefficientAfterTheft() / this.serverGrowthPercentage()).toPrecision(14);
      return Math.min(
        this.getMaxMoney(), // Worse case (0 money on server) we get 1$ per thread
        Math.ceil(parseFloat(n))
      );
    },
    getWeakenThreadsNeededAfterTheft: function () {
      const n = ((this.getHackThreadsNeeded() * hackThreadHardening) / actualWeakenPotency()).toPrecision(14);
      return Math.ceil(parseFloat(n));
    },
    getWeakenThreadsNeededAfterGrowth: function () {
      const n = ((this.getGrowThreadsNeededAfterTheft() * growthThreadHardening) / actualWeakenPotency()).toPrecision(14);
      return Math.ceil(parseFloat(n));
    },
    // Once we get root, we never lose it, so we can stop asking
    _hasRootCached: false,
    hasRoot: function () {
      return this._hasRootCached || (this._hasRootCached = this.ns.hasRootAccess(this.name));
    },
    isHost: function () {
      return this.name == daemonHost;
    },
    totalRam: function () {
      return this.ns.getServerMaxRam(this.name);
    },
    // Used ram is constantly changing
    usedRam: function () {
      let usedRam = this.ns.getServerUsedRam(this.name);
      // Complete HACK: but for most planning purposes, we want to pretend home has more ram in use than it does to leave room for "preferred" jobs at home
      if (this.name == "home") usedRam = Math.min(this.totalRam(), usedRam + homeReservedRam);
      return usedRam;
    },
    ramAvailable: function () {
      return this.totalRam() - this.usedRam();
    },
    growDelay: function () {
      return this.timeToWeaken() - this.timeToGrow() + cycleTimingDelay;
    },
    hackDelay: function () {
      return this.timeToWeaken() - this.timeToHack();
    },
    timeToWeaken: function () {
      return this.ns.getWeakenTime(this.name);
    },
    timeToGrow: function () {
      return this.ns.getGrowTime(this.name);
    },
    timeToHack: function () {
      return this.ns.getHackTime(this.name);
    },
    weakenThreadsNeeded: function () {
      const n = ((this.getSecurity() - this.getMinSecurity()) / actualWeakenPotency()).toPrecision(14);
      return Math.ceil(parseFloat(n));
    },
  };
}

/** @param {NS} ns **/
function buildPortCrackerObject(ns: NS, crackName: string): PortCracker {
  const crack = {
    ns: ns,
    name: crackName,
    exists: () => doesFileExist(crackName, "home"),
    runAt: function (target: string) {
      switch (this.name) {
        case "BruteSSH.exe":
          this.ns.brutessh(target);
          break;
        case "FTPCrack.exe":
          this.ns.ftpcrack(target);
          break;
        case "relaySMTP.exe":
          this.ns.relaysmtp(target);
          break;
        case "HTTPWorm.exe":
          this.ns.httpworm(target);
          break;
        case "SQLInject.exe":
          this.ns.sqlinject(target);
          break;
      }
    },
    // I made this a function of the crackers out of laziness.
    doNuke: (target: string) => ns.nuke(target),
  };
  return crack;
}

/** @param {NS} ns **/
function buildToolkit(ns: NS): void {
  log("buildToolkit");
  for (const toolConfig of hackTools.concat(asynchronousJobs).concat(periodicJobs)) {
    const tool: HackingTool = {
      instance: ns,
      name: toolConfig.name,
      shortName: toolConfig.shortName,
      tail: toolConfig.tail || false,
      args: toolConfig.args || [],
      shouldRun: toolConfig.shouldRun,
      requiredServer: toolConfig.requiredServer,
      isThreadSpreadingAllowed: toolConfig.shortName === "weak",
      cost: ns.getScriptRam(toolConfig.name, daemonHost),
      canRun: function (server) {
        return doesFileExist(this.name, server.name) && server.ramAvailable() >= this.cost;
      },
      getMaxThreads: function () {
        // analyzes the servers array and figures about how many threads can be spooled up across all of them.
        let maxThreads = 0;
        sortServerList("ram");
        for (const server of serverListByFreeRam.filter((s) => s.hasRoot())) {
          const n = (server.ramAvailable() / this.cost).toPrecision(14);
          const threadsHere = Math.floor(parseFloat(n));
          if (!this.isThreadSpreadingAllowed) return threadsHere;
          maxThreads += threadsHere;
        }
        return maxThreads;
      },
    };
    ns.tprint(tool)
    tools.push(tool);
    toolsByShortName[tool.shortName || hashToolDefinition(tool)] = tool;
  }
}

// Helper to sort various copies of our host list in different ways.
function sortServerList(o: string): void {
  switch (o) {
    case "ram":
      // Original sort order adds jobs to the server with the most free ram
      serverListByFreeRam.sort(function (a, b) {
        const ramDiff = b.ramAvailable() - a.ramAvailable();
        return ramDiff != 0.0 ? ramDiff : a.name.localeCompare(b.name); // Break ties by sorting by name
      });
      break;
    case "totalram":
      // Original sort order adds jobs to the server with the most free ram
      serverListByMaxRam.sort(function (a, b) {
        const ramDiff = b.totalRam() - a.totalRam();
        return ramDiff != 0.0 ? ramDiff : a.name.localeCompare(b.name); // Break ties by sorting by name
      });
      break;
    case "targeting":
      // To ensure we establish some income, prep fastest-to-prep servers first, and target prepped servers before unprepped servers.
      serverListByTargetOrder.sort(function (a, b) {
        if (a.canHack() != b.canHack()) return a.canHack() ? -1 : 1; // Sort all hackable servers first
        // Next, Sort prepped servers to the front. Assume that if we're targetting, we're prepped (between cycles)
        if ((a.isPrepped() || a.isTargeting()) != (b.isPrepped() || b.isTargeting)) return a.isPrepped() || a.isTargeting() ? -1 : 1;
        if (!a.canHack()) return a.requiredHackLevel - b.requiredHackLevel; // Unhackable servers are sorted by lowest hack requirement
        //if (!a.isPrepped()) return a.timeToWeaken() - b.timeToWeaken(); // Unprepped servers are sorted by lowest time to weaken
        // For ready-to-hack servers, the sort order is based on money, RAM cost, and cycle time
        return b.getMoneyPerRamSecond() - a.getMoneyPerRamSecond(); // Prepped servers are sorted by most money/ram.second
      });
      break;
  }
}

// Helpers to get slices of info / cumulative stats across all rooted servers
function getNetworkStats() {
  const rootedServers = serverListByMaxRam.filter((server) => server.hasRoot());
  const listOfServersFreeRam = rootedServers.map((s) => s.ramAvailable()).filter((ram) => ram > 1.6); // Servers that can't run a script don't count
  const totalMaxRam = rootedServers.map((s) => s.totalRam()).reduce((a, b) => a + b, 0);
  const totalFreeRam = listOfServersFreeRam.reduce((a, b) => a + b, 0);
  return {
    listOfServersFreeRam: listOfServersFreeRam,
    totalMaxRam: totalMaxRam,
    totalFreeRam: totalFreeRam,
    totalUsedRam: totalMaxRam - totalFreeRam,
    // The money we could make if we took 100% from every currently hackable server, to help us guage how relatively profitable each server is
    //totalMaxMoney: rootedServers.filter(s => s.canHack() && s.shouldHack()).map(s => s.getMaxMoney()).reduce((a, b) => a + b, 0)
  };
}
// Simpler function to get current total percentage of ram used across the network
function getTotalNetworkUtilization() {
  const utilizationStats = getNetworkStats();
  return utilizationStats.totalUsedRam / utilizationStats.totalMaxRam;
}
// =================================== //
// ==== Asynchornous helper functions  //
// =================================== //

async function crackServers(ns : NS, serverListByTargetOrder: BurnerServer[], portCrackers: any[] ) : Promise<void> {

  let availableCrackers = portCrackers.filter(cracker => cracker.exists())
  let validTargets = serverListByTargetOrder.filter(server => server.portsRequired <= availableCrackers.length && server.hasRoot!)

  validTargets.forEach(function(server){
    availableCrackers.forEach(function(cracker) {
          cracker.runAt(server.name)
      })
      ns.nuke(server.name)
  })

}

async function runStartupScripts(ns: NS) {
  log("runStartupScripts");
  for (const job of asynchronousJobs) if (!job.isLaunched && (job.shouldRun === undefined || job.shouldRun())) job.isLaunched = await runJob(ns, getTool(job));
  // if every helper is launched already return "true" so we can skip doing this each cycle going forward.
  return asynchronousJobs.reduce((allLaunched, tool) => allLaunched && tool.isLaunched, true);
}

/** @param {NS} ns **/
async function establishMultipliers(ns: NS): Promise<void> {
  log("establishMultipliers");
  bitnodeMults = (await tryGetBitNodeMultipliers_Custom(ns, getNsDataThroughFile)) || {
    // prior to SF-5, bitnodeMults stays null and these mults are set to 1.
    ServerGrowthRate: 1,
    ServerWeakenRate: 1,
    FourSigmaMarketDataApiCost: 1,
    ScriptHackMoneyGain: 1,
  };
  if (verbose)
    log(
      // eslint-disable-next-line no-irregular-whitespace
      `Bitnode mults:\n  ${Object.keys(bitnodeMults)
        //@ts-ignore
        .filter((k) => bitnodeMults[k] != 1.0)
        //@ts-ignore
        .map((k) => `${k}: ${bitnodeMults[k]}`)
        // eslint-disable-next-line no-irregular-whitespace
        .join("\n  ")}`
    );
}

/** @param {NS} ns **/
async function runJob(ns: NS, tool: HackingTool): Promise<boolean> {
  if (!doesFileExist(tool.name)) {
    log(`ERROR: Script ${tool.name} was not found on ${daemonHost}`, true, "error");
    return false;
  }
  let runningOnServer = whichServerIsRunning(ns, tool.name);
  if (runningOnServer != null) {
    if (verbose) log(`INFO: Tool ${tool.name} is already running on server ${runningOnServer}.`);
    return true;
  }
  const args = tool.args ? (tool.args instanceof Function ? tool.args() : tool.args) : []; // Support either a static args array, or a function returning the args.
  const runResult = await arbitraryExecution(ns, tool, 1, args, tool.requiredServer || "home"); // TODO: Allow actually requiring a server

  if (runResult) {
    runningOnServer = whichServerIsRunning(ns, tool.name, false);
    if (verbose) log(`Ran job: ${tool.name} on server ${runningOnServer}` + (args.length > 0 ? ` with args ${JSON.stringify(args)}` : ""));
    if (tool.tail === true) {
      log(`Tailing Tool: ${tool.name} on server ${runningOnServer}` + (args.length > 0 ? ` with args ${JSON.stringify(args)}` : ""));
      ns.tail(tool.name, runningOnServer!, ...args);
      tool.tail = false; // Avoid popping open additional tail windows in the future
    }
    return true;
  } else log(`WARNING: Tool cannot be run (insufficient RAM? REQ: ${formatRam(tool.cost)}): ${tool.name}`, false, "warning");
  return false;
}

/** @param {NS} ns **/
async function refreshDynamicServerData(ns: NS, serverNames: string[]): Promise<string | void> {
  dictServerMinSecurityLevels = await getNsDataThroughFile(
    ns,
    serversDictCommand(serverNames, "ns.getServerMinSecurityLevel(server)"),
    "/Temp/servers-security.txt"
  );
  dictServerMaxMoney = await getNsDataThroughFile(ns, serversDictCommand(serverNames, "ns.getServerMaxMoney(server)"), "/Temp/servers-max-money.txt");
  // Get the information about the relative profitability of each server
  const pid = ns.exec("/util/analyze-hack.js", "home", 1, "--all", "--silent");
  await waitForProcessToComplete_Custom(ns, getFnIsAliveViaNsPs(ns), pid, verbose);

  dictServerProfitInfo = ns.read("/Temp/analyze-hack.txt");

  if (!dictServerProfitInfo) {
    return log("WARN: analyze-hack info unavailable.");
  }
  dictServerProfitInfo = Object.fromEntries(JSON.parse(dictServerProfitInfo).map((s: Server) => [s.hostname, s]));
}

// Intended as a high-powered "figure this out for me" run command.
// If it can't run all the threads at once, it runs as many as it can across the spectrum of daemons available.
/** @param {NS} ns **/
export async function arbitraryExecution(
  ns: NS,
  tool: HackingTool,
  threads: number,
  args: any[],
  preferredServerName = "",
  useSmallestServerPossible = false
): Promise<boolean> {
  // We will be using the list of servers that is sorted by most available ram
  sortServerList("ram");
  const rootedServersByFreeRam = serverListByFreeRam.filter((server) => server.hasRoot() && server.totalRam() > 1.6);

  // Sort servers by total ram, and try to fill these before utilizing another server.
  sortServerList("totalram");
  const preferredServerOrder = serverListByMaxRam.filter((server) => server.hasRoot() && server.totalRam() > 1.6);
  if (useSmallestServerPossible)
    // Fill up small servers before utilizing larger ones (can be laggy)
    preferredServerOrder.reverse();
  // IDEA: "home" is more effective at grow() and weaken() than other nodes (has multiple cores) (TODO: By how much?)
  //       so if this is one of those tools, put it at the front of the list of preferred candidates, otherwise keep home ram free if possible
  //       TODO: This effort is wasted unless we also scale down the number of threads "needed" when running on home. We will overshoot grow/weaken
  //             Disable this for now, and enable it once we have solved for reducing grow/weak threads
  const home = preferredServerOrder.splice(
    preferredServerOrder.findIndex((i) => i.name == "home"),
    1
  )[0];

  if (tool.shortName == "grow" || tool.shortName == "weak" || preferredServerName == "home") {
    preferredServerOrder.unshift(home); // Send to front
  } else {
    preferredServerOrder.push(home);
  }

  // Allow for an overriding "preferred" server to be used in the arguments, and slot it to the front regardless of the above
  if (preferredServerName && preferredServerName != "home" /*home is handled above*/) {
    const preferredServerIndex = preferredServerOrder.findIndex((i) => i.name == preferredServerName);
    if (preferredServerIndex != -1) preferredServerOrder.unshift(preferredServerOrder.splice(preferredServerIndex, 1)[0]);
    else log(`ERROR: Configured preferred server "${preferredServerName}" for ${tool.name} is not a valid server name`, true, "error");
  }

  // For debug information
  if (verbose) {
    ns.tprint(`Preferred Server ${preferredServerName} for ${tool.name} resulted in preferred order: ${preferredServerOrder.map((srv) => srv.name)}`);
  }

  // Helper function to compute the most threads a server can run
  const computeMaxThreads = function (server: BurnerServer): number {
    if (tool.cost == 0) return 1;
    let ramAvailable = server.ramAvailable();
    // It's a hack, but we know that "home"'s reported ram available is lowered to leave room for "preferred" jobs,
    // so if this is a preferred job, ignore what the server object says and get it from the source
    if (server.name == "home" && preferredServerName == "home") ramAvailable = ns.getServerMaxRam("home") - ns.getServerUsedRam("home");
    const n = (ramAvailable / tool.cost).toPrecision(14);
    return Math.floor(parseFloat(n));
  };

  let remainingThreads = threads;
  let splitThreads = false;
  for (let i = 0; i < rootedServersByFreeRam.length && remainingThreads > 0; i++) {
    let targetServer = rootedServersByFreeRam[i];
    const maxThreadsHere = Math.min(remainingThreads, computeMaxThreads(targetServer));
    if (maxThreadsHere <= 0) continue; //break; HACK: We don't break here because there are cases when sort order can change (e.g. we've reserved home RAM)

    // If this server can handle all required threads, see if a server that is more preferred also has room.
    // If so, we prefer to pack that server with more jobs before utilizing another server.
    if (maxThreadsHere == remainingThreads) {
      for (let j = 0; j < preferredServerOrder.length; j++) {
        const nextMostPreferredServer = preferredServerOrder[j];
        // If the next largest server is also the current server with the most capacity, then it's the best one to pack
        if (nextMostPreferredServer == targetServer) break;
        // If the job can just as easily fit on this server, prefer to put the job there
        if (remainingThreads <= computeMaxThreads(nextMostPreferredServer)) {
          //log('Opted to exec ' + tool.name + ' on preferred server ' + nextMostPreferredServer.name + ' rather than the one with most ram (' + targetServer.name + ')');
          targetServer = nextMostPreferredServer;
          break;
        }
      }
    }

    // if not on the daemon host, do a script copy check before running
    if (targetServer.name != daemonHost && !doesFileExist(tool.name, targetServer.name)) {
      if (verbose) log(`Copying ${tool.name} from ${daemonHost} to ${targetServer.name} so that it can be executed remotely.`);
      await ns.scp(tool.name, daemonHost, targetServer.name);
      // Some tools require helpers.js
      if (!doesFileExist("helpers.js", targetServer.name)) await ns.scp("helpers.js", daemonHost, targetServer.name);
    }

    const pid = ns.exec(tool.name, targetServer.name, maxThreadsHere, ...(args || []));
    // A pid of 0 indicates that the run failed
    if (pid == 0) {
      log("ERROR: Failed to exec " + tool.name + " on server " + targetServer.name + " with " + maxThreadsHere + " threads", false, "error");
      return false;
    }
    // Decrement the threads that have been successfully scheduled
    remainingThreads -= maxThreadsHere;
    if (remainingThreads > 0) {
      if (!tool.isThreadSpreadingAllowed) break;
      // No need to warn if it's allowed? log(`WARNING: Had to split ${threads} ${tool.name} threads across multiple servers. ${maxThreadsHere} on ${targetServer.name}`);
      splitThreads = true;
    }
  }
  // the run failed if there were threads left to schedule after we exhausted our pool of servers
  if (remainingThreads > 0)
    log(`ERROR: Ran out of RAM to run ${tool.name} against ${args[0]} - ${threads - remainingThreads} of ${threads} threads were spawned.`, false, "error");
  if (splitThreads && !tool.isThreadSpreadingAllowed) return false;
  return remainingThreads == 0;
}
