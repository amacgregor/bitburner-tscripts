import { NS } from "../../NetscriptDefinitions"

/**
 * Used to waitFor a function to finish executing. Useful for automation around Singularity scripts.
 * @param {NS} ns - The main netscript object
 * @param callback - The function to be called
 * @param {number} timeout - Timeout value in miliseconds
 * @returns
 */
export const waitFor = async (ns: NS, callback: () => any, timeout = 60000): Promise<any> => {
  let timer = 0
  while (timer < timeout) {
    // eslint-disable-next-line callback-return
    const result = await callback()
    if (result !== undefined) {
      return result
    }
    // silly but works for now
    timer += 50
    await ns.sleep(50)
  }
  throw new Error(`waitFor failed after ${timeout}s`)
}

/**
 * Wrapper around the undocument function to retrieve Karma
 * @returns number
 */
export async function getKarma(): Promise<number> {
  // @ts-ignore
  return ns.heart.break()
}

/**
 * Wrapper when we want to notify about an action on console, log and toast
 * @param ns
 * @param message
 * @param toastStyle
 */
export function announce(ns: NS, message: string, toastStyle: string): void {
  ns.print(message)
  ns.tprint(message)
  if (toastStyle) ns.toast(message, toastStyle)
}

/** @param {NS} ns
 * Returns a helpful error message if we forgot to pass the ns instance to a function */
 export function checkNsInstance(ns: NS, fnName = "this function"): NS {
    // eslint-disable-next-line no-throw-literal
    if (!ns.print) throw `The first argument to ${fnName} should be a 'ns' instance.`
    return ns
  }

/** Helper to log a message, and optionally also tprint it and toast it
 * @param {NS} ns - The nestcript instance passed to your script's main entry point */
export function log(ns: NS, message = "", alsoPrintToTerminal = false, toastStyle = "", maxToastLength = 100): string {
  checkNsInstance(ns, '"log"')
  ns.print(message)
  if (alsoPrintToTerminal) ns.tprint(message)
  if (toastStyle) ns.toast(message.length <= maxToastLength ? message : message.substring(0, maxToastLength - 3) + "...", toastStyle)
  return message
}

/**
 * Simplify disabling multiple types of logs on a script
 * @param {NS} ns
 **/
export function disableLogs(ns: NS, listOfLogs: Array<string>): void {
  ["disableLog"].concat(...listOfLogs).forEach((log) => ns.disableLog(log))
}

/** Generate a hashCode for a string that is pretty unique most of the time */
export function hashCode(s: string): number {
  return s.split("").reduce(function (a, b) {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)
}
