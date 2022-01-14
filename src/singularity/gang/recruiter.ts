import { NS } from '../../../NetscriptDefinitions'

const gangMemberNamesList = [
    'Darth Vader',
    'Joker',
    'Two-Face',
    'Warden Norton',
    'Hannibal Lecter',
    'John Wick',
    'Bane',
    'Tyler Durden',
    'Agent Smith',
    'Gollum',
    'Vincent Vega',
    'Saruman',
    'Loki',
    'Vito Corleone',
    'Balrog',
    'Palpatine',
    'Michael Corleone',
    'Talia al Ghul',
    'John Doe',
    'Scarecrow',
    'Commodus',
    'Jabba the Hutt',
    'Scar',
    'Grand Moff Tarkin',
    'Boba Fett',
    'Thanos',
    'Terminator',
    'Frank Costello',
    'Hector Barbossa',
    'Xenomorph',
  ]

export async function main(ns : NS) : Promise<void> {
    while (ns.gang.canRecruitMember()) {
        const gangMemberNames = ns.gang.getMemberNames();
        ns.gang.recruitMember(gangMemberNamesList[gangMemberNames.length])
        ns.tprint(`Recruited ${gangMemberNamesList[gangMemberNames.length]}`)
        await ns.sleep(1)
      }
}