import { NS } from "../../../NetscriptDefinitions";

/**
 * The Strategy interface declares operations common to all supported versions
 * of some algorithm.
 *
 * The Context uses this interface to call the algorithm defined by Concrete
 * Strategies.
 */
export interface HackingStrategy {
  identifyTarget(ns: NS): string;
  prepare(): boolean;
  launchAttach(data: string[]): string[];
}
