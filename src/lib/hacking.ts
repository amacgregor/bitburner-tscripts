import { NS } from "../../NetscriptDefinitions"

/**
 * Scan all available servers and copies the scripts to all of them
 *
 * returns array with all servers
 */
export async function findAllServers(ns: NS): Promise<any> {
  const scriptList = ["hack.ns", "weaken.ns", "grow.ns"]
  const q = []
  const discoveredServers: any = []

  q.push("home")
  discoveredServers["home"] = true

  while (q.length) {
    const v = q.shift()
    const edges: any = ns.scan(v)

    for (let i = 0; i < edges.length; i++) {
      if (!discoveredServers[edges[i]]) {
        discoveredServers[edges[i]] = true
        q.push(edges[i])

        await ns.scp(scriptList, "home", edges[i])
      }
    }
  }
  return Object.keys(discoveredServers)
}

export async function findOptimalServer(ns: NS, hackableServers: Array<string>): Promise<string> {
  let optimalServer = "n00dles"
  let optimalVal = 0
  let currentVal
  let currentTime

  for (let i = 0; i < hackableServers.length; ++i) {
    currentVal = ns.getServerMaxMoney(hackableServers[i])
    currentTime = ns.getWeakenTime(hackableServers[i]) + ns.getGrowTime(hackableServers[i]) + ns.getHackTime(hackableServers[i])

    currentVal /= currentTime

    if (currentVal >= optimalVal) {
      optimalVal = currentVal
      optimalServer = hackableServers[i]
    }
  }

  return optimalServer
}

export async function findHackableServers(ns: NS, serverList: Array<string>): Promise<any> {
  const hackableServers = []
  const rootableServers = []
  let numPortsPossible = 0

  if (ns.fileExists("BruteSSH.exe", "home")) {
    numPortsPossible += 1
  }
  if (ns.fileExists("FTPCrack.exe", "home")) {
    numPortsPossible += 1
  }
  if (ns.fileExists("RelaySMTP.exe", "home")) {
    numPortsPossible += 1
  }
  if (ns.fileExists("HTTPWorm.exe", "home")) {
    numPortsPossible += 1
  }
  if (ns.fileExists("SQLInject.exe", "home")) {
    numPortsPossible += 1
  }

  for (let i = 0; i < serverList.length; ++i) {
    if (ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(serverList[i]) && numPortsPossible >= ns.getServerNumPortsRequired(serverList[i])) {
      hackableServers.push(serverList[i])
    }

    if (serverList[i] != "home" && (ns.hasRootAccess(serverList[i]) || numPortsPossible >= ns.getServerNumPortsRequired(serverList[i]))) {
      rootableServers.push(serverList[i])

      if (!ns.hasRootAccess(serverList[i])) {
        if (ns.fileExists("BruteSSH.exe")) {
          ns.brutessh(serverList[i])
        }
        if (ns.fileExists("FTPCrack.exe")) {
          ns.ftpcrack(serverList[i])
        }
        if (ns.fileExists("RelaySMTP.exe")) {
          ns.relaysmtp(serverList[i])
        }
        if (ns.fileExists("HTTPWorm.exe")) {
          ns.httpworm(serverList[i])
        }
        if (ns.fileExists("SQLInject.exe")) {
          ns.sqlinject(serverList[i])
        }
        ns.nuke(serverList[i])
      }
    }
  }

  const optimalServer = await findOptimalServer(ns, hackableServers)

  return [hackableServers, rootableServers, optimalServer]
}

export function asMoney(amount: number): string {
  const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
  return usd.format(amount)
}

/** Helper to get a list of all hostnames on the network
 * @param {NS} ns - The nestcript instance passed to your script's main entry point */
export function scanAllServers(ns: NS): Array<string> {
//   checkNsInstance(ns, '"scanAllServers"')
  const discoveredHosts: any = [] // Hosts (a.k.a. servers) we have scanned
  const hostsToScan = ["home"] // Hosts we know about, but have no yet scanned
  let infiniteLoopProtection = 9999 // In case you mess with this code, this should save you from getting stuck
  while (hostsToScan.length > 0 && infiniteLoopProtection-- > 0) {
    // Loop until the list of hosts to scan is empty
    const hostName = hostsToScan.pop() // Get the next host to be scanned
    for (const connectedHost of ns.scan(hostName)) // "scan" (list all hosts connected to this one)
      if (!discoveredHosts.includes(connectedHost))
        // If we haven't already scanned this host
        hostsToScan.push(connectedHost) // Add it to the queue of hosts to be scanned
    discoveredHosts.push(hostName) // Mark this host as "scanned"
  }
  return discoveredHosts // The list of scanned hosts should now be the set of all hosts in the game!
}
