import { NS, Player } from "/../NetscriptDefinitions.js";
import { HackingStrategy } from "/lib/interfaces/hacking.strategy.js";
import { HackingStrategyStates } from "/lib/enums.js";
import { getNsDataThroughFile } from "/lib/ram.js";
import { announce } from "/lib/helper.js";
import { BurnerServer, NetworkStats, Schedule } from "/types/types.js";

export class EarlyHackingStrategy implements HackingStrategy {
  private targets: BurnerServer[] = [];
  private studying = false;
  private lastStatusUpdateTime = 0;
  private statusUpdateInterval = 120000; // 2 minute interval for notifications

  public state: HackingStrategyStates = HackingStrategyStates.PREPARING;

  /**
   * Early game strategy get the player hacking level to 20 by studying
   *
   * @param   {NS}             ns
   * @param   {Player<void>}   player  Player information object
   *
   * @return  {Promise<void>}
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
  public async identifyTarget(ns: NS, serverListByTargetOrder: BurnerServer[], preferredTarget: null|string): Promise<void> {
    if(preferredTarget != null) {
      let validTargets = serverListByTargetOrder.filter((s) => s.name == preferredTarget)
      this.targets = validTargets
      announce(ns, `Total of ${validTargets.length} found.`, "info");
      this.state = HackingStrategyStates.TARGET_IDENTIFIED;
    }else  {
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
  }

  /**
   * Will return 3 types of schedules:
   * - Priming - Max money and Min security must be acheived for this to work
   * - Lowering - If Max Money is true, making sure security level is at its minimum
   * - Attack - Once the server is primed run the main attack loop 
   *
   * @param   {NS}                   ns            [ns description]
   * @param   {NetworkStats<any>[]}  networkStats  [networkStats description]
   *
   * @return  {Promise<any>[]}                     [return description]
   */
  public async schedule(ns: NS, networkStats: NetworkStats): Promise<Schedule[]> {
    let schedule: Schedule[] = [];
    let target = this.targets[0];
    if(target.isPrepped() == false){

      schedule.push({toolName: "weak", target: target.name, threads: target.weakenThreadsNeeded(), sleepTime: 0})
      schedule.push({toolName: "grow", target: target.name, threads: target.getGrowThreadsNeeded(), sleepTime: 0})
      // this.state = HackingStrategyStates.RUNNING;

      return schedule
    
    } else if (target.isPrepped()) {
      schedule.push({toolName: "weak", target: target.name, threads: target.getWeakenThreadsNeededAfterGrowth(), sleepTime: 0})
      schedule.push({toolName: "grow", target: target.name, threads: target.getGrowThreadsNeededAfterTheft(), sleepTime: target.growDelay()})
      schedule.push({toolName: "hack", target: target.name, threads: target.getHackThreadsNeeded(), sleepTime: target.hackDelay()})
      // this.state = HackingStrategyStates.RUNNING;

      return schedule
    }
    return schedule;
  }
}
