import { NS } from '../../../NetscriptDefinitions'

/** @param {NS} ns **/
export async function main(ns: NS): Promise<void> {
  const server = ns.args[0]
  const sleeptime = ns.args[1]
  await ns.sleep(sleeptime)
  await ns.hack(server)
}
