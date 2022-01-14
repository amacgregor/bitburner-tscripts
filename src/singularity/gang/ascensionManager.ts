import { GangGenInfo, NS } from '../../../NetscriptDefinitions'
import { getLSItem, announce } from '/lib/helper.js'

const thresholds = [2,3,5,8,13,21,34,55,89]

export async function main(ns : NS) : Promise<void> {
    const gangInformation: GangGenInfo = ns.gang.getGangInformation();
    const gangMembers = ns.gang.getMemberNames()
    const skill = gangInformation.isHacking ? 'hack' : 'str'


    if (!gangInformation || !gangInformation.faction) {
        return announce(ns, "Currently not operating a gang", "warning")
    }

    if (gangMembers.length == 0) {
        return announce(ns, "Currently not gang members", "warning")
    }

    gangMembers.forEach(function(member) {
        const pAscResult = ns.gang.getAscensionResult(member)

        if ( pAscResult === undefined || pAscResult === null){
           return announce(ns, `${member} couldn't be ascended at this time`, "warning")
        }

        const memberInfo = ns.gang.getMemberInformation(member)
        const currentMult = memberInfo[`${skill}_asc_mult`]
        const nextThreshhold = thresholds.find(t => t > currentMult)
        const ascResult = pAscResult[`${skill}`] + currentMult

        if ( ascResult > nextThreshhold ) {
            ns.gang.ascendMember(member)
            return announce(ns, `Gang member ${member} ascended`, "success")
        } else {
            return ns.print(`${member} ascension multiplier too low to ascend`)
        }


    })
    

}