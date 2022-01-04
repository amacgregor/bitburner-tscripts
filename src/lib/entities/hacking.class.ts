import { NS, Player } from "../../../NetscriptDefinitions"
import { HackingStrategyStates } from "/lib/enums.js";
import { HackingStrategy } from "/lib/interfaces/hacking.strategy.js";
import { BurnerServer, NetworkStats, Schedule } from "/types/types.js";

export class HackingContext {
    private ns: NS;
    private strategy: HackingStrategy;
    private preferredTarget: null| string;

    constructor(ns: NS, strategy: HackingStrategy) {
        this.ns = ns;
        this.strategy = strategy;
        this.preferredTarget = null;
    }

    public setStrategy(strategy: HackingStrategy) {
        this.strategy = strategy;
    }

    public forceTarget(target: string) {
        this.preferredTarget = target;
    }


    public async run(playerState: Player, serverListByTargetOrder: BurnerServer[], networkStats: NetworkStats): Promise<false|Schedule[]> {
        switch(this.strategy.state){
            case HackingStrategyStates.PREPARING:
                await this.strategy.prepare(this.ns, playerState)
                return false
                break;
            case HackingStrategyStates.PREPARED:
                await this.strategy.identifyTarget(this.ns, serverListByTargetOrder, this.preferredTarget)
                return false
                break;
            case HackingStrategyStates.TARGET_IDENTIFIED:
                return await this.strategy.schedule(this.ns, networkStats)
                break;
            case HackingStrategyStates.RUNNING:
                return false
                break;
        }
        return false
    }
}