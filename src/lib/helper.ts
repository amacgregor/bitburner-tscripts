import { NS } from '../../NetscriptDefinitions'

/**
 * Used to waitFor a function to finish executing. Useful for automation around Singularity scripts.
 * 
 * @param {NS} ns - The main netscript object
 * @param callback - The function to be called 
 * @param {number} timeout - Timeout value in miliseconds
 * @returns 
 */
export const waitFor = async (ns : NS, callback : () => any, timeout = 60000) : Promise<any> => {
    let timer = 0
    while (timer < timeout) {
        const result = await callback()
        if (result !== undefined) {
            return result
        }
        // silly but works for now
        timer += 50
        await ns.sleep(50)
    }
    throw new Error(`waitFor failed after ${timeout}s`)
}

/**
 * Wrapper around the undocument function to retrieve Karma
 * @returns number
 */
export async function getKarma() : Promise<number> {
    // @ts-ignore
    return ns.heart.break()
}