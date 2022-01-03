import { NS, Player } from "../../../NetscriptDefinitions";
import { HackingStrategyStates } from "/lib/enums.js";
import { BurnerServer } from "/types/types.js";

/**
 * The Strategy interface declares operations common to all supported versions
 * of some algorithm.
 *
 * The Context uses this interface to call the algorithm defined by Concrete
 * Strategies.
 */
export interface HackingStrategy {
  state: HackingStrategyStates;
  identifyTarget(ns: NS, serverListByTargetOrder: BurnerServer[]): Promise<void>;
  prepare(ns: NS, player: Player): Promise<void>;
  launchAttach(ns: NS): Promise<void>;
}
