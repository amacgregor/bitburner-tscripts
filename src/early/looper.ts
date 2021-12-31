import { NS } from '../../NetscriptDefinitions'

export async function main(ns : NS) : Promise<void> {
    const flags = ns.flags([
        ["debug", false],
        ["help", false],
      ])
    
      if (flags._.length === 0 || flags.help) {
        ns.tprint("This is a simple script to run a basic weak/grow/hack loop against the target server.")
        ns.tprint(`USAGE: run ${ns.getScriptName()} SERVER_NAME`)
        ns.tprint("Example:")
        ns.tprint(`> run ${ns.getScriptName()} n00dles`)
        ns.tprint("For debug mode:")
        ns.tprint(`> run ${ns.getScriptName()} --debug n00dles`)
        return
      }
    
      const target = flags._[0]
    
      const moneyThresh = ns.getServerMaxMoney(target) * 0.9
      const securityThresh = ns.getServerMinSecurityLevel(target) + 5
    
      // @ts-ignore
      const script = ns.getRunningScript()
    
      flags.debug && ns.tail()
    
      while (true) {
        // Clear the logs
        ns.clearLog()
    
        // Initialize variables
        const money = ns.getServerMoneyAvailable(target) || 1
        const maxMoney = ns.getServerMaxMoney(target)
        const minSec = ns.getServerMinSecurityLevel(target)
        const sec = ns.getServerSecurityLevel(target)
    
        if (ns.getServerSecurityLevel(target) > securityThresh) {
          // Calculate threads needed
          let wThreds = Math.ceil((sec - minSec) * 20)
          if (wThreds > script["threads"]) {
            wThreds = script["threads"]
          }
    
          if (flags.debug) {
            ns.print(`=== Weakening ${target} with ${wThreds} threads ===`)
            ns.print(`=== Running for: ${ns.tFormat(ns.getWeakenTime(target))} ===`)
          }
    
          await ns.weaken(target, { threads: wThreds })
        } else if (ns.getServerMoneyAvailable(target) < moneyThresh) {
          // Calculate threads needed
          let gThreads = Math.ceil(ns.growthAnalyze(target, maxMoney / money))
          if (gThreads > script["threads"]) {
            gThreads = script["threads"]
          }
    
          if (flags.debug) {
            ns.print(`=== Growing ${target} with ${gThreads} threads ===`)
            ns.print(`=== Running for: ${ns.tFormat(ns.getGrowTime(target))} ===`)
          }
    
          await ns.grow(target, { threads: gThreads })
        } else {
          // Calculate threads needed
          let hThreads = Math.ceil(ns.hackAnalyzeThreads(target, money / 2)) // hack the server for 50%
          if (hThreads > script["threads"]) {
            hThreads = script["threads"]
          }
    
          if (flags.debug) {
            ns.print(`=== Hacking ${target} with ${hThreads} threads ===`)
            ns.print(`=== Running for: ${ns.tFormat(ns.getHackTime(target))} ===`)
          }
    
          await ns.hack(target, { threads: hThreads })
        }
      }
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data : ServerData, args : string[]) : string[] {
    return [...data.servers]
}