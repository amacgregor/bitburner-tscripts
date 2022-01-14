import { NS } from '../../../NetscriptDefinitions'
import { gangCrimes } from '/lib/common/constants.js'

export async function main(ns : NS) : Promise<void> {
    const taskedCrime = ns.args[0]
    const gangMembers = ns.gang.getMemberNames()

    gangMembers.forEach(function(member) {
        ns.gang.setMemberTask(member, taskedCrime);
    }
}

// @ts-ignore
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: any, args: string[]): string[] {
    return [...gangCrimes];

}