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

/**
 * Simplify disabling multiple types of logs on a script 
 * @param {NS} ns 
 **/
export function disableLogs(ns: NS, listOfLogs: Array<string>): void {
  ["disableLog"].concat(...listOfLogs).forEach((log) => ns.disableLog(log))
}
