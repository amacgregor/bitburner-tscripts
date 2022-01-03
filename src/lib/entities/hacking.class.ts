import { NS, Player } from "../../../NetscriptDefinitions"
import { HackingStrategyStates } from "/lib/enums.js";
import { HackingStrategy } from "/lib/interfaces/hacking.strategy.js";
import { BurnerServer } from "/types/types.js";

export class HackingContext {
    private ns: NS;
    private strategy: HackingStrategy;

    constructor(ns: NS, strategy: HackingStrategy) {
        this.ns = ns;
        this.strategy = strategy;
    }

    public setStrategy(strategy: HackingStrategy) {
        this.strategy = strategy;
    }

    public async run(playerState: Player, serverListByTargetOrder: BurnerServer[]): Promise<void> {
        switch(this.strategy.state){
            case HackingStrategyStates.PREPARING:
                await this.strategy.prepare(this.ns, playerState)
                break;
            case HackingStrategyStates.PREPARED:
                await this.strategy.identifyTarget(this.ns, serverListByTargetOrder)
                break;
            case HackingStrategyStates.TARGET_IDENTIFIED:
                await this.strategy.launchAttach(this.ns)
                break;
            case HackingStrategyStates.RUNNING:
                break;
        }
    }
}