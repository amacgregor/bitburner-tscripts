import { NS } from '../../NetscriptDefinitions'

export async function main(ns : NS) : Promise<void> {
    while(true) {
        await ns.weaken("joesguns")
    }
}