import { NS } from '../../../NetscriptDefinitions'

const argsSchema = [
    ['v', false], // Verbose
    ['verbose', false],
    ['interval', 1000], // Rate at which the program runs and spends hashes
    ['l', false], // Turn all hashes into money
    ['liquidate', false],
];


export function autocomplete(data, args) {
    data.flags(argsSchema);
    const lastFlag = args.length > 1 ? args[args.length - 2] : null;
    return [];
}

export async function main(ns : NS) : Promise<void> {
    const options = ns.flags(argsSchema);
    const verbose = options.v || options.verbose;
    const interval = options.interval;
    const liquidate = options.l || options.liquidate;
    const toBuy = "Sell for Money"


    if(ns.hacknet.hashCapacity() == 0) {
        return ns.print('We have hacknet nodes, not hacknet servers, so spending hashes is not applicable.');
    }

    while (true) {
        let capacity = ns.hacknet.hashCapacity() || Number.MAX_VALUE;
        let startingHashes = ns.hacknet.numHashes() || 0;
        let globalProduction = Array.from({ length: ns.hacknet.numNodes() }, (_, i) => ns.hacknet.getNodeStats(i))
            .reduce((total, node) => total + node.production, 0);
            
        ns.print(`Current hacknet production: ${globalProduction.toPrecision(3)}...`);

        // Spend hashes before we lose them
        let reserve = 10 + globalProduction * interval / 1000; // If we are this far from our capacity, start spending
        let success = true;
        while (success && ns.hacknet.numHashes() > (liquidate ? 4 : capacity - reserve))
            success = ns.hacknet.spendHashes(toBuy);
        if (!success)
            ns.print(`Weird, failed to spend hashes. (Have: ${ns.hacknet.numHashes()} Capacity: ${ns.hacknet.hashCapacity()}`);
        if (verbose && ns.hacknet.numHashes() < startingHashes)
            ns.print(`Spent ${(startingHashes - ns.hacknet.numHashes()).toFixed(0)} hashes` +
                (liquidate ? '' : ` to avoid reaching capacity (${capacity})`) + ` at ${globalProduction.toPrecision(3)} hashes per second`);
        await ns.sleep(interval);
    }
}