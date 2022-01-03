import { NS, Player } from "/../NetscriptDefinitions.js";
import { HackingStrategy } from "/lib/interfaces/hacking.strategy.js";
import { HackingStrategyStates } from "/lib/enums.js";
import { getNsDataThroughFile } from "/lib/ram.js";
import { announce } from "/lib/helper.js";
import { BurnerServer } from "/types/types.js";

export class EarlyHackingStrategy implements HackingStrategy {
  private targets: BurnerServer[] = [];
  public state: HackingStrategyStates = HackingStrategyStates.PREPARING;
  private studying = false;
  private lastStatusUpdateTime = 0;
  private statusUpdateInterval = 120000; // 2 minute interval for notifications

  /**
   * Early game strategy get the player hacking level to 20 by studying
   *
   * @param   {NS}             ns      [ns description]
   * @param   {Player<void>}   player  [player description]
   *
   * @return  {Promise<void>}          [return description]
   */
  public async prepare(ns: NS, player: Player): Promise<void> {
    if (player.hacking < 20 && this.studying == false) {
      this.studying = true;
      if (await getNsDataThroughFile(ns, `ns.universityCourse('Rothman University', 'Study Computer Science')`, "/Temp/study.txt")) {
        const lastActionRestart = Date.now();
        announce(ns, `Started studying 'Computer Science' at 'Rothman University`, "success");
      }
      this.lastStatusUpdateTime = Date.now();
    } else if (player.hacking < 20 && this.studying) {
      if (Date.now() - this.lastStatusUpdateTime > this.statusUpdateInterval) {
        announce(ns, `Still studying 'Computer Science' at 'Rothman University`, "info");
        this.lastStatusUpdateTime = Date.now();
      }
    } else if (player.hacking >= 20 && this.studying) {
      await getNsDataThroughFile(ns, `ns.stopAction()`, "/Temp/stop-action.txt");
      announce(ns, `Completed studying 'Computer Science' at 'Rothman University`, "success");
      this.studying = false;
      this.state = HackingStrategyStates.PREPARED;
    } else if (player.hacking >= 20 && this.studying == false) {
      this.state = HackingStrategyStates.PREPARED;
    } else {
      announce(ns, "Something went wrong. UNKOWN STATE", "error");
      ns.exit();
    }
  }
  /**
   * Identify the best target based on the status of the network
   *
   * @param   {NS}    ns
   *
   * @return  {void}
   */
  public async identifyTarget(ns: NS, serverListByTargetOrder: BurnerServer[]): Promise<void> {
    let validTargets = serverListByTargetOrder.filter((s) => s.canHack() && s.shouldHack() && s.hasRoot());

    if (validTargets.length > 0) {
      this.targets = validTargets;
      announce(ns, `Total of ${validTargets.length} found.`, "info");
      this.state = HackingStrategyStates.TARGET_IDENTIFIED;
    } else {
      if (Date.now() - this.lastStatusUpdateTime > this.statusUpdateInterval) {
        announce(ns, `No Valid targets founds`, "warning");
        this.lastStatusUpdateTime = Date.now();
      }
    }
  }

  /**
   * Make every server hack itself using the looper script.
   *
   * @param   {NS<void>}       ns  [ns description]
   *
   * @return  {Promise<void>}      [return description]
   */
  public async launchAttach(ns: NS): Promise<void> {
    for (let i = 0; this.targets.length > i; i++) {
        let host = this.targets[i].name
        let threads = Math.floor(ns.getServerMaxRam(host) / ns.getScriptRam("/early/looper.js", host));
        if (threads > 0) {
            await ns.scp("/early/looper.js", "home", host);
            await ns.exec("/early/looper.js", host, threads, host);
        }
    }
    this.state = HackingStrategyStates.RUNNING;
  }
}
