import { NS } from '../../NetscriptDefinitions'

export async function main(ns : NS) : Promise<void> {
    // @ts-ignore
    ns.tprint(`Karma: ${ns.heart.break()}`)
}