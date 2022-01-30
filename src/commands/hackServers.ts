import { NS } from '../../NetscriptDefinitions'
import { findAllServers, findHackableServers } from '/lib/hacking.js'

export async function main(ns : NS) : Promise<void> {
	while(true) {
		var allServers = await findAllServers(ns);
        var nhrArray = await findHackableServers(ns, allServers);
        var hackableServers = nhrArray[0];
        var rootableServers = nhrArray[1];
        var optimalServer = nhrArray[2];

        for (let i = 0; i < rootableServers.length; i++) {
            await ns.installBackdoor(rootableServers[i]);
        }

        await ns.sleep(10000)
	}
}