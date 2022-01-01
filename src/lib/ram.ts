import { NS, ProcessInfo } from "../../NetscriptDefinitions"
import { BurnerDictionary } from "../types/types"
import { disableLogs, hashCode, log, checkNsInstance } from "/lib/helper.js"
/**
 * Collection of functions and helpers to use for RAM dodging
 */

type runFunction = (script: string, numThreads?: number | undefined, ...args: string[]) => any;
type isRunningFunction = (script: string, hosts: string, ...args: string[]) => boolean;
type isAliveFunction = (pid: number) => ProcessInfo;

// FUNCTIONS THAT PROVIDE ALTERNATIVE IMPLEMENTATIONS TO EXPENSIVE NS FUNCTIONS
// VARIATIONS ON NS.RUN

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.exec in your script **/
export function getFnRunViaNsExec(ns: NS, host = "home"): any {
  checkNsInstance(ns, '"getFnRunViaNsExec"')
  return function (scriptPath: string, ...args: string[]) {
    return ns.exec(scriptPath, host, 1, ...args)
  }
}
// VARIATIONS ON NS.ISRUNNING

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.run in your script  */
export function getFnIsAliveViaNsIsRunning(ns: NS): any {
  return checkNsInstance(ns, '"getFnIsAliveViaNsIsRunning"').isRunning
}

/** @param {NS} ns
 *  Use where a function is required to run a script and you have already referenced ns.exec in your script  */
export function getFnIsAliveViaNsPs(ns: NS): any {
  checkNsInstance(ns, '"getFnIsAliveViaNsPs"')
  return function (pid: number, host: string) {
    return ns.ps(host).some((process) => process.pid === pid)
  }
}

/**
 * Retrieve the result of an ns command by executing it in a temporary .js script, writing the result to a file, then shuting it down
 * Importing incurs a maximum of 1.1 GB RAM (0 GB for ns.read, 1 GB for ns.run, 0.1 GB for ns.isRunning).
 * Has the capacity to retry if there is a failure (e.g. due to lack of RAM available). Not recommended for performance-critical code.
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {string} command - The ns command that should be invoked to get the desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fName - (default "/Temp/{commandhash}-data.txt") The name of the file to which data will be written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, pid and result of command are logged.
 **/
export async function getNsDataThroughFile(
  ns: NS,
  command: string,
  fName: string,
  verbose = false,
  maxRetries = 5,
  retryDelayMs = 50
): Promise<BurnerDictionary> {
  checkNsInstance(ns, '"getNsDataThroughFile"')
  if (!verbose) disableLogs(ns, ["run", "isRunning"])
  return getNsDataThroughFile_Custom(ns, ns.run, ns.isRunning, command, fName, verbose, maxRetries, retryDelayMs)
}

/**
 * An advanced version of getNsDataThroughFile that lets you pass your own "fnRun" and "fnIsAlive" implementations to reduce RAM requirements
 * Importing incurs no RAM (now that ns.read is free) plus whatever fnRun / fnIsAlive you provide it
 * Has the capacity to retry if there is a failure (e.g. due to lack of RAM available). Not recommended for performance-critical code.
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {function} fnRun - A single-argument function used to start the new sript, e.g. `ns.run` or `(f,...args) => ns.exec(f, "home", ...args)`
 * @param {function} fnIsAlive - A single-argument function used to start the new sript, e.g. `ns.isRunning` or `pid => ns.ps("home").some(process => process.pid === pid)`
 **/
export async function getNsDataThroughFile_Custom(
  ns: NS,
  fnRun: runFunction,
  fnIsAlive: any,
  command: string,
  fName: string,
  verbose = false,
  maxRetries = 5,
  retryDelayMs = 50
): Promise<BurnerDictionary> {
  checkNsInstance(ns, '"getNsDataThroughFile_Custom"')
  if (!verbose) disableLogs(ns, ["read"])
  const commandHash = hashCode(command)
  fName = fName || `/Temp/${commandHash}-data.txt`
  const fNameCommand = (fName || `/Temp/${commandHash}-command`) + ".js"
  // Prepare a command that will write out a new file containing the results of the command
  // unless it already exists with the same contents (saves time/ram to check first)
  // If an error occurs, it will write an empty file to avoid old results being misread.
  const commandToFile = `let result = ""; try { result = JSON.stringify(${command}); } catch { }
         if (ns.read("${fName}") != result) await ns.write("${fName}", result, 'w')`
  // Run the command with auto-retries if it fails
  const pid = await runCommand_Custom(ns, fnRun, commandToFile, fNameCommand, false, maxRetries, retryDelayMs)
  // Wait for the process to complete
  await waitForProcessToComplete_Custom(ns, fnIsAlive, pid, verbose)
  if (verbose) ns.print(`Process ${pid} is done. Reading the contents of ${fName}...`)
  // Read the file, with auto-retries if it fails
  const fileData = await autoRetry(
    ns,
    () => ns.read(fName),
    (f: string | undefined) => f !== undefined && f !== "",
    () => `ns.read('${fName}') somehow returned undefined or an empty string`,
    maxRetries,
    retryDelayMs,
    undefined,
    verbose
  )
  if (verbose) ns.print(`Read the following data for command ${command}:\n${fileData}`)
  return JSON.parse(fileData) // Deserialize it back into an object/array and return
}

/** Evaluate an arbitrary ns command by writing it to a new script and then running or executing it.
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {string} command - The ns command that should be invoked to get the desired data (e.g. "ns.getServer('home')" )
 * @param {string=} fileName - (default "/Temp/{commandhash}-data.txt") The name of the file to which data will be written to disk by a temporary process
 * @param {bool=} verbose - (default false) If set to true, the evaluation result of the command is printed to the terminal
 * @param {...args} args - args to be passed in as arguments to command being run as a new script.
 */
export async function runCommand(
  ns: NS,
  command: string,
  fileName: string,
  verbose = false,
  maxRetries = 5,
  retryDelayMs = 50,
  ...args: string[]
): Promise<any> {
  checkNsInstance(ns, '"runCommand"')
  if (!verbose) disableLogs(ns, ["run", "sleep"])
  return await runCommand_Custom(ns, ns.run, command, fileName, verbose, maxRetries, retryDelayMs, ...args)
}

/**
 * An advanced version of runCommand that lets you pass your own "isAlive" test to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 * Importing incurs 0 GB RAM (assuming fnRun, fnWrite are implemented using another ns function you already reference elsewhere like ns.exec)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {function} fnRun - A single-argument function used to start the new script, e.g. `ns.run` or `(f,...args) => ns.exec(f, "home", ...args)`
 **/
export async function runCommand_Custom(
  ns: NS,
  fnRun: runFunction,
  command: string,
  fileName: string,
  verbose = false,
  maxRetries = 5,
  retryDelayMs = 50,
  ...args: string[]
): Promise<any> {
  checkNsInstance(ns, '"runCommand_Custom"')
  const script =
    `import { formatMoney, formatNumberShort, formatDuration, parseShortNumber } fr` +
    `om "/lib/format.js"\n` +
    `import { scanAllServers } fr` +
    `om "/lib/hacking.js"\n` +
    `export async function main(ns) { try { ` +
    (verbose ? `let output = ${command}; ns.tprint(output)` : command) +
    `; } catch(err) { ns.tprint(String(err)); throw(err); } }`
  fileName = fileName || `/Temp/${hashCode(command)}-command.js`
  // To improve performance and save on garbage collection, we can skip writing this exact same script was previously written (common for repeatedly-queried data)
  if (ns.read(fileName) != script) await ns.write(fileName, script, "w")
  // eslint-disable-next-line no-return-await
  return await autoRetry(
    ns,
    () => fnRun(fileName, 1, ...args),
    (temp_pid: number) => temp_pid !== 0,
    () => `Run command returned no pid. Destination: ${fileName} Command: ${command}\nEnsure you have sufficient free RAM to run this temporary script.`,
    maxRetries,
    retryDelayMs,
    undefined,
    verbose
  )
}

/**
 * Wait for a process id to complete running
 * Importing incurs a maximum of 0.1 GB RAM (for ns.isRunning)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {int} pid - The process id to monitor
 * @param {bool=} verbose - (default false) If set to true, pid and result of command are logged.
 **/
export async function waitForProcessToComplete(ns: NS, pid: number, verbose: boolean): Promise<any> {
  checkNsInstance(ns, '"waitForProcessToComplete"')
  if (!verbose) disableLogs(ns, ["isRunning"])
  return await waitForProcessToComplete_Custom(ns, ns.isRunning, pid, verbose)
}
/**
 * An advanced version of waitForProcessToComplete that lets you pass your own "isAlive" test to reduce RAM requirements (e.g. to avoid referencing ns.isRunning)
 * Importing incurs 0 GB RAM (assuming fnIsAlive is implemented using another ns function you already reference elsewhere like ns.ps)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point
 * @param {function} fnIsAlive - A single-argument function used to start the new sript, e.g. `ns.isRunning` or `pid => ns.ps("home").some(process => process.pid === pid)`
 **/
export async function waitForProcessToComplete_Custom(ns: NS, fnIsAlive: isAliveFunction, pid: number, verbose: boolean): Promise<any> {
  checkNsInstance(ns, '"waitForProcessToComplete_Custom"')
  if (!verbose) disableLogs(ns, ["sleep"])
  // Wait for the PID to stop running (cheaper than e.g. deleting (rm) a possibly pre-existing file and waiting for it to be recreated)
  for (let retries = 0; retries < 1000; retries++) {
    if (!fnIsAlive(pid)) break // Script is done running
    if (verbose && retries % 100 === 0) ns.print(`Waiting for pid ${pid} to complete... (${retries})`)
    await ns.sleep(10)
  }
  // Make sure that the process has shut down and we haven't just stopped retrying
  if (fnIsAlive(pid)) {
    const errorMessage = `run-command pid ${pid} is running much longer than expected. Max retries exceeded.`
    ns.print(errorMessage)
    throw errorMessage
  }
}

/** Helper to retry something that failed temporarily (can happen when e.g. we temporarily don't have enough RAM to run)
 * @param {NS} ns - The nestcript instance passed to your script's main entry point */
export async function autoRetry(
  ns: NS,
  fnFunctionThatMayFail: () => string,
  fnSuccessCondition:  (...args: any) => any,
  errorContext = "Success condition not met",
  maxRetries = 5,
  initialRetryDelayMs = 50,
  backoffRate = 3,
  verbose = false
): Promise<any> {
  checkNsInstance(ns, '"autoRetry"')
  let retryDelayMs = initialRetryDelayMs
  while (maxRetries-- > 0) {
    try {
      const result = await fnFunctionThatMayFail()
      if (!fnSuccessCondition(result)) throw typeof errorContext === "string" ? errorContext : errorContext()
      return result
    } catch (error) {
      const fatal = maxRetries === 0
      const errorLog = `${fatal ? "FAIL" : "WARN"}: (${maxRetries} retries remaining): ${String(error)}`
      log(ns, errorLog, fatal, !verbose ? undefined : fatal ? "error" : "warning")
      if (fatal) throw error
      await ns.sleep(retryDelayMs)
      retryDelayMs *= backoffRate
    }
  }
}

/** @param {NS} ns
 * Get a dictionary of active source files, taking into account the current active bitnode as well. **/
export async function getActiveSourceFiles(ns: NS): Promise<any> {
  return await getActiveSourceFiles_Custom(ns, getNsDataThroughFile)
}

/** @param {NS} ns
 * getActiveSourceFiles Helper that allows the user to pass in their chosen implementation of getNsDataThroughFile to minimize RAM usage **/
export async function getActiveSourceFiles_Custom(ns: NS, fnGetNsDataThroughFile: (...args: any) => any): Promise<any> {
  checkNsInstance(ns, '"getActiveSourceFiles"')
  const tempFile = "/Temp/owned-source-files.txt"
  // Find out what source files the user has unlocked
  let dictSourceFiles = await fnGetNsDataThroughFile(ns, `Object.fromEntries(ns.getOwnedSourceFiles().map(sf => [sf.n, sf.lvl]))`, tempFile)
  if (!dictSourceFiles) {
    // Bit of a hack, but if RAM is so low that this fails, we can fallback to using an older version of this file, and even assuming we have no source files.
    dictSourceFiles = ns.read(tempFile)
    dictSourceFiles = dictSourceFiles ? JSON.parse(dictSourceFiles) : {}
  }
  // If the user is currently in a given bitnode, they will have its features unlocked
  dictSourceFiles[(await fnGetNsDataThroughFile(ns, "ns.getPlayer()", "/Temp/player-info.txt")).bitNodeN] = 3
  return dictSourceFiles
}

/** @param {NS} ns
 * Return bitnode multiplers, or null if they cannot be accessed. **/
export async function tryGetBitNodeMultipliers(ns: NS): Promise<any> {
  return await tryGetBitNodeMultipliers_Custom(ns, getNsDataThroughFile)
}

/** @param {NS} ns
 * tryGetBitNodeMultipliers Helper that allows the user to pass in their chosen implementation of getNsDataThroughFile to minimize RAM usage **/
export async function tryGetBitNodeMultipliers_Custom(ns: NS, fnGetNsDataThroughFile: (...args: any) => any): Promise<any> {
  checkNsInstance(ns, '"tryGetBitNodeMultipliers"')
  let canGetBitNodeMultipliers = false
  try {
    canGetBitNodeMultipliers = 5 in (await getActiveSourceFiles_Custom(ns, fnGetNsDataThroughFile))
  } catch {}
  if (!canGetBitNodeMultipliers) return null
  try {
    return await fnGetNsDataThroughFile(ns, "ns.getBitNodeMultipliers()", "/Temp/bitnode-multipliers.txt")
  } catch {}
  return null
}
