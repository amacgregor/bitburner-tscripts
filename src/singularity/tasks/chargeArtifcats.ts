import { NS, ActiveFragment} from '../../../NetscriptDefinitions'

const LOOP_DELAY: number = 1000 as const


export async function main(ns : NS) : Promise<void> {
    if (ns.getHostname() !== 'home') {
		throw new Error('Run the script from home')
	}


	while (true) {
        const fragments: ActiveFragment[] = ns.stanek.activeFragments().sort((a, b) => a.numCharge - b.numCharge)

		const lowestCharged: ActiveFragment = fragments[0]
		await ns.stanek.charge(lowestCharged.x, lowestCharged.y)

		await ns.asleep(LOOP_DELAY)
	}
}