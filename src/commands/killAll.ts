import { NS } from '../NetscriptDefinitions'

const argsSchema = [
    ['all', false],
    ['silent', false], //@TODO: Pending implementation
]

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
    const host = ns.getHostname()
    const flags = ns.flags(argsSchema)
    const target = flags._[0]

    if (target && flags.all === false) {
        ns.killall(target)
    } else if (flags.all === true) {
        const serverList = scanAllServers(ns)

        for (const server of serverList) {
            if (server == host) { continue }
            if (ns.ps(server) === 0) { continue }
            ns.killall(server)
        }
    }
}