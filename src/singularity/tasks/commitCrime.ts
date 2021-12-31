import { NS } from "../../../NetscriptDefinitions"
import { formatNumberShort, formatDuration } from "/lib/format.js"
import { getKarma } from "/lib/helper.js"
import { Crime } from "/types/bitburner.js"

const crimes: Crime[] = [
  "shoplift",
  "rob store",
  "mug",
  "larceny",
  "deal drugs",
  "bond forgery",
  "traffick arms",
  "homicide",
  "grand theft auto",
  "kidnap",
  "assassinate",
  "heist",
]

/**
 * 
 * @param ns 
 * @param crime 
 * @returns 
 */
export async function main(ns: NS, crime = "mug"): Promise<void> {
  crime = ns.args[0] || crime
  const interval = 100
  while (true) {
    let maxBusyLoops = 100
    while (ns.isBusy() && maxBusyLoops-- > 0) {
      await ns.sleep(interval)
      ns.print("Waiting to no longer be busy...")
    }
    if (maxBusyLoops <= 0) {
      ns.tprint("User have been busy for too long. auto-crime.js exiting...")
      return
    }
    ns.tail() // Force a tail window open when auto-criming, or else it's very difficult to stop if it was accidentally closed.
    const wait = ns.commitCrime(crime) + 10
    const karma = await getKarma()
    ns.print(`Karma: ${formatNumberShort(karma)} Committing crime \"${crime}\" and sleeping for ${formatDuration(wait)}...`)
    await ns.sleep(wait)
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data : ServerData, args : string[]) : string[] {
  return [...crimes]
}