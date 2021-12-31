import { NS } from '../../NetscriptDefinitions'
import { scanAllServers } from '/lib/hacking.js'

const argsSchema = [
    ['all', false],
    ['silent', false], //@TODO: Pending implementation
]

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: ServerData, args: string[]): string[] {
    data.flags(argsSchema)
    return [...data.servers]
}

/**
 * Kill all running scripts on all servers.
 * @param ns 
 */
export async function main(ns : NS) : Promise<void> {
    //@ts-ignore
    const flags = ns.flags(argsSchema)
    const host = ns.getHostname()
    const target = flags._[0]

    if (target && flags.all === false) {
        ns.killall(target)
    } else if (flags.all === true) {
        const serverList = scanAllServers(ns)

        for (const server of serverList) {
            if (server == host) { continue }
            if (ns.ps(server).length === 0) { continue }
            ns.killall(server)
        }
    }
}