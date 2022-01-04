import { NS, Player } from "../../../NetscriptDefinitions";
import { HackingStrategyStates } from "/lib/enums.js";
import { BurnerServer, NetworkStats, Schedule } from "/types/types.js";

/**
 * The Strategy interface declares operations common to all supported versions
 * of some algorithm.
 *
 * The Context uses this interface to call the algorithm defined by Concrete
 * Strategies.
 */
export interface HackingStrategy {
  state: HackingStrategyStates;
  identifyTarget(ns: NS, serverListByTargetOrder: BurnerServer[], preferredTarget: null|string): Promise<void>;
  prepare(ns: NS, player: Player): Promise<void>;
  schedule(ns: NS, networkStats: NetworkStats): Promise<Schedule[]>;
}
