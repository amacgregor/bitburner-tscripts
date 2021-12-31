import { NS } from "../../../NetscriptDefinitions"
import { formatMoney, formatNumberShort } from "/lib/format.js"
import { announce } from "/lib/helper.js"

const max_spend_ration = 0.1 // Cap cost of the upgrade to only 10% of our available funds

export async function main(ns: NS): Promise<void> {
  const current_ram = ns.getServerMaxRam("home")
  const money = ns.getServerMoneyAvailable("home")
  const money_available = money * max_spend_ration

  const cost = ns.getUpgradeHomeRamCost()

  // Check if we have reached max upgrades
  if (current_ram > 2 ** 20) {
    return ns.print(`Home server RAM fully upgraded with (2^20 = ${formatNumberShort(current_ram)}GB`)
  }

  // Calculate the next RAM upgrade
  const upgrade_ram = current_ram * 2

  // Check if we can afford the upgrade
  if (money_available < cost) {
    return ns.print(
      `We don't have enough funds to upgrade to ${formatNumberShort(upgrade_ram)}GB. ${formatMoney(cost)} needed but only ${formatMoney(
        money_available
      )} available`
    )
  }

  // Attempt the upgrade
  if (ns.upgradeHomeRam()) {
    announce(ns, `SUCCESS: Upgraded to ${formatNumberShort(upgrade_ram)}GB sucessful`, "success")
  } else {
    announce(
      ns,
      `ERROR: Failed upgrade to ${formatNumberShort(upgrade_ram)}GB (cost: ${formatMoney(cost)} cash: ${formatMoney(money)} budget: ${formatMoney(
        money_available
      )})`,
      "error"
    )
  }
}
