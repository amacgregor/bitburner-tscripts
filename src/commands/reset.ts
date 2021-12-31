import { NS } from '../../NetscriptDefinitions'

/**
 * This script is meant to delete all the scripts on the server and start from scratch. 
 * Useful to try someone elses scripts or files. 
 * @param ns 
 */
export async function main(ns : NS) : Promise<void> {
    const deleteConfirmation = await ns.prompt('Delete files? This will delete all extra js, ns, script and txt files that are not part of the repository. ')
    if (deleteConfirmation) {
        const lists = await ns.ls("home")
        //@ts-ignore
        const filteredList = lists.filter(file => ['txt', 'ns', 'js', 'script'].includes(file.split('.').pop()))
        
        for (let i = 0; i < filteredList.length; i++) {
            ns.toast(`Deleting file: ${filteredList[i]}`)
            await ns.rm(filteredList[i])
        }
    }
}