import { NS } from "../../../NetscriptDefinitions"

export async function main(ns: NS): Promise<void> {
  const interval = 2000

  const keepRunning = ns.args.length > 0 && ns.args[0] == "-c"
  if (!keepRunning) ns.print(`tor-manager will run once. Run with argument "-c" to run continuously.`)

  const hasTor = () => ns.scan("home").includes("darkweb")
  if (hasTor()) return ns.print("Player already has Tor")
  do {
    if (hasTor()) {
      ns.toast(`Purchased the Tor router!`, "success")
      break
    }
    ns.purchaseTor()
    if (keepRunning) await ns.sleep(interval)
  } while (keepRunning)
}
