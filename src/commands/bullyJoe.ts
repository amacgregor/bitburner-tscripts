import { NS } from '../../NetscriptDefinitions'

/**
 * This script has one purpose and one purpose only. Bully Joe's Guns for experience.
 * @param ns 
 */
export async function main(ns : NS) : Promise<void> {
    while(true) {
        await ns.weaken("joesguns")
    }
}