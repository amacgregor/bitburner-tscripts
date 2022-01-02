import { NS } from '../../NetscriptDefinitions'
import * as fauxFormulas from "/flurry/fauxFormulas.js"
import { formatRam } from "/lib/format.js"

const argsSchema = [
  ['i', false], // Prioritise farming intelligence 
]

let options = null // A copy of the options used at construction time



export async function main(ns : NS) : Promise<void> {
    options = ns.flags(argsSchema)

    const farmInt = options.i 

    const target: any = ns.args[0] // Host to hack
    const host = ns.getHostname() // Server to run scripts on

    let hackscriptRam
  
    ns.tail()
  
    let i = 0
    let c = 0
    let formulas
  
    let player = ns.getPlayer()
    let fserver = ns.getServer(target)
  
    const contstantRam = ns.getScriptRam("/flurry/main.js")
    if (farmInt) {
      hackscriptRam = ns.getScriptRam("/flurry/payloads/manualhack.js")
    } else {
       hackscriptRam = ns.getScriptRam("/flurry/payloads/hack.js")
    }
    const growscriptRam = ns.getScriptRam("/flurry/payloads/grow.js")
    const weakenscriptRam = ns.getScriptRam("/flurry/payloads/weaken.js")
  
    const maxRam = ns.getServerMaxRam(host) - contstantRam // getting total RAM I can use that doesnt include the OP script
    let weakenThreads = (ns.getServerSecurityLevel(target) - ns.getServerMinSecurityLevel(target)) / 0.05
  
    if (weakenThreads <= 0) {
      weakenThreads = 100
    } // Set a minimum of 1 thread
  
    const maxGrowThreads = Math.floor(maxRam / growscriptRam - weakenscriptRam * weakenThreads)
  
    // Calculate target values
    let cs = ns.getServerSecurityLevel(target)
    let ms = ns.getServerMinSecurityLevel(target)
    let mm = ns.getServerMaxMoney(target)
    let ma = ns.getServerMoneyAvailable(target)
  
    // Handle Formulas.exe
    if (ns.fileExists("Formulas.exe")) {
      formulas = ns.formulas.hacking
    } else {
      formulas = fauxFormulas
    }
  
    // Priming the target.  Max money and Min security must be acheived for this to work
    if (ma < mm == true) {
      ns.toast(`Priming ${fserver} from ${host}`, "info", 6000)
      ns.exec("/flurry/payloads/weaken.js", host, weakenThreads, target, 0)
      ns.exec("/flurry/payloads/grow.js", host, maxGrowThreads, target, 0)
  
      const WeakenTime = formulas.weakenTime(fserver, player)
      await ns.sleep(WeakenTime + 1000)
      mm = ns.getServerMaxMoney(target)
      ma = ns.getServerMoneyAvailable(target)
      player = ns.getPlayer()
      fserver = ns.getServer(target)
      cs = ns.getServerSecurityLevel(target)
      ms = ns.getServerMinSecurityLevel(target)
    }
  
    // If Max Money is true, making sure security level is at its minimum
    if (cs > ms == true) {
      ns.toast(`Lowering Security on ${target} from ${host}`, "info", 6000)
      ns.exec("/flurry/payloads/weaken.js", host, weakenThreads, target, 0)
  
      const WeakenTime = formulas.weakenTime(fserver, player)
      await ns.sleep(WeakenTime + 1000)
      cs = ns.getServerSecurityLevel(target)
      ms = ns.getServerMinSecurityLevel(target)
    }
  
    // Refreshing target stats now that the security level is at the minmum, and maybe our player stats have changed as priming can take a while
    player = ns.getPlayer()
    fserver = ns.getServer(target)
  
    const HPercent = formulas.hackPercent(fserver, player) * 100
    const GPercent = formulas.growPercent(fserver, 1, player, 2)

    const WeakenTime = formulas.weakenTime(fserver, player)
    
    const GrowTime = formulas.growTime(fserver, player)
    const HackTime = formulas.hackTime(fserver, player)
  
    const growThreads = Math.round(2 / (GPercent - 1)) // Getting the amount of threads I need to grow 100%
    const hackThreads = Math.round(50 / HPercent) // Getting the amount of threads I need to hack 50% of the funds
    weakenThreads = Math.round(weakenThreads - growThreads * 0.004) // Getting required threads to fully weaken the target
  
    const totalRamForRun = hackscriptRam * hackThreads + growscriptRam * growThreads + weakenscriptRam * weakenThreads // Calculating how much RAM is used for a single run
    const sleepTime = WeakenTime / (maxRam / totalRamForRun)
  
    // finding how many runs this target can handle and setting the time between run execution
    const shiftCount = maxRam / totalRamForRun
    const offset = sleepTime / 2
    const gOffset = offset / 4
    const hOffset = offset / 2
  
    while (true) {
      const wsleep = 0 // At one point I made the weaken call sleep so I've kept it around
      const gsleep = WeakenTime - GrowTime - gOffset // Getting the time to have the Growth execution sleep, then shaving some off to beat the weaken execution
      const hsleep = WeakenTime - HackTime - hOffset // Getting time for hack, shaving off more to make sure it beats both weaken and growth
      const UsedRam = ns.getServerUsedRam(host)
  
      if (totalRamForRun >= maxRam - UsedRam == false) {
        // making sure I have enough RAM to do a full run
        ns.exec("/flurry/payloads/weaken.js", host, weakenThreads, target, wsleep, i)
        ns.exec("/flurry/payloads/grow.js", host, growThreads, target, gsleep, i)

        if (farmInt) {
          ns.exec("/flurry/payloads/manualhack.js", host, hackThreads, target, hsleep, i)
        } else {
          ns.exec("/flurry/payloads/hack.js", host, hackThreads, target, hsleep, i)
        }
  
        if (c < shiftCount) {
          await ns.sleep(sleepTime)
          c++
        } else {
          await ns.sleep(sleepTime + offset)
          c = 0
        }
        i++
      } else {
        ns.toast(`Not enough RAM. ${formatRam(maxRam - UsedRam)} available but ${formatRam(totalRamForRun)} needed`, "warning", 4000)
        ns.print(`Not enough RAM. ${formatRam(maxRam - UsedRam)} available but ${formatRam(totalRamForRun)} needed`)
  
        await ns.sleep(1000)
      }
    }
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    return [...data.servers] // This script autocompletes the list of servers.
  }
  