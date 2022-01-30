import { NS } from '../../../NetscriptDefinitions'
import { gangEquipment } from '/lib/common/constants.js';
import { announce } from '/lib/helper.js';

export async function main(ns: NS): Promise<void> {
    const gangMembers = ns.gang.getMemberNames()

    gangEquipment.weapons.forEach((equipment) => {
        purchaseEquimentForEachMember(ns,equipment, gangMembers)
    })

    gangEquipment.armor.forEach((equipment) => {
        purchaseEquimentForEachMember(ns,equipment, gangMembers)
    })

    gangEquipment.vehicles.forEach((equipment) => {
        purchaseEquimentForEachMember(ns,equipment, gangMembers)
    })

    gangEquipment.combatAugs.forEach((equipment) => {
        purchaseEquimentForEachMember(ns,equipment, gangMembers)
    })
}

function purchaseEquimentForEachMember(ns, equipment, memberList) {
    memberList.forEach(function (member) {
        const gangMemberInfo = ns.gang.getMemberInformation(member)

        if (gangMemberInfo.upgrades.includes(equipment)) return

        const boughtEquipment = ns.gang.purchaseEquipment(member, equipment)

        if (boughtEquipment) {
            announce(ns, `Bought ${equipment} for ${member}`, false)
        }
    })
}