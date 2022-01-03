import { NS } from "../../NetscriptDefinitions"

import { getNsDataThroughFile, getActiveSourceFiles } from "/lib/ram.js"
import { formatNumberShort, formatMoney, formatRam } from "/lib/format.js"

const argsSchema = [
    ['help', false],
]

/**
 * Stats updates the UI of the game with useful information about experience, income and karma
 *
 * @param   {NS}       ns  Netscript object
 */
export async function main(ns: NS): Promise<void> {
  const doc = eval("document")
  const hook0 = doc.getElementById("overview-extra-hook-0")
  const hook1 = doc.getElementById("overview-extra-hook-1")
  const dictSourceFiles = await getActiveSourceFiles(ns) // Find out what source files the user has unlocked

  // Main stats update loop
  while (true) {
    try {
      const headers = []
      const values = []

      if (9 in dictSourceFiles) {
        // Section not relevant if you don't have access to hacknet servers
        const hashes = await getNsDataThroughFile(ns, "[ns.hacknet.numHashes(), ns.hacknet.hashCapacity()]", "/Temp/hash-stats.txt")
        if (hashes[1] > 0) {
          headers.push("Hashes")
          values.push(`${formatNumberShort(hashes[0], 3, 1)}/${formatNumberShort(hashes[1], 3, 1)}`)
        }
        // Detect and notify the HUD if we are liquidating
        if (ns.ps("home").some((p) => p.filename.includes("spend-hacknet-hashes") && (p.args.includes("--liquidate") || p.args.includes("-l")))) {
          headers.splice(1, 0, " ")
          values.push("Liquidating")
        }
      }

      headers.push("<span style=\"text:left;padding-right:5px \">Income  </span> <br>")
      //@ts-ignore - Ignoring due to undocument NS behaivour
      values.push(formatMoney(ns.getScriptIncome()[0], 3, 2) + "/sec <br>")

      headers.push("<span style=\"text-align:left\">Experience</span> <br>")
      //@ts-ignore - Ignoring due to undocument NS behaivour
      values.push(formatNumberShort(ns.getScriptExpGain(), 3, 2) + "/sec <br>")

      //@ts-ignore - Ignoring due to undocument NS behaivour
      const karma = ns.heart.break()
      if (karma <= -9) {
        headers.push("<span style=\"color:red\"> Karma</span> <br>")
        values.push("<span style=\"color:red\">" + formatNumberShort(karma, 3, 2) + "</span><br>")
      }

      
      headers.push("<span style=\"text-align:left\">Home RAM</span> <br>")
      //@ts-ignore - Ignoring due to undocument NS behaivour
      values.push(formatRam(ns.getServerUsedRam("home")) + "<br>")

      // eslint-disable-next-line no-irregular-whitespace
      hook0.innerHTML = headers.join("")
      hook1.innerHTML = values.join("")
    } catch (err) {
      // Might run out of ram from time to time, since we use it dynamically
      ns.print("ERROR: Update Skipped: " + String(err))
    }
    await ns.sleep(1000)
  }
}
