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
        const availableNames = gangMemberNamesList.filter(x => !gangMemberNames.includes(x));

        const randomNameIndex = Math.floor(Math.random() * availableNames.length)

        ns.gang.recruitMember(availableNames[randomNameIndex])
        ns.tprint(`Recruited ${availableNames[randomNameIndex]}`)
        await ns.sleep(1)
      }
}