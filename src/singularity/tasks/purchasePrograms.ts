import { NS } from "../../../NetscriptDefinitions"

/**
 * Purchase programs is intended to buy all the programs from the darkweb as soon as we can afford them.
 * The script will die once all programs are purchased.
 * @param ns
 */
export async function main(ns: NS): Promise<void> {
  const programs = ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]
  const interval = 2000

  const keepRunning = ns.args.length > 0 && ns.args[0] == "-c"
  if (!keepRunning) ns.print(`Program Manager will run once. Run with argument "-c" to run continuously.`)

  let foundMissingProgram = false

  do {
    // Check what programs we own
    for (const program of programs) {
      if (!ns.fileExists(program, "home") && ns.purchaseProgram(program)) ns.toast(`Purchased ${program}`, "success")
      else if (keepRunning) foundMissingProgram = true
    }

    // Wait before the next check
    if (keepRunning && foundMissingProgram) {
      await ns.sleep(interval)
    }
    // eslint-disable-next-line no-unmodified-loop-condition
  } while (keepRunning && foundMissingProgram)
}
