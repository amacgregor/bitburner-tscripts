import { NS } from "../../../NetscriptDefinitions"
import { HackingStrategy } from "../interfaces/hacking.strategy";

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

    public run(): void {
        this.ns.tprint("TEST context ran")
        this.strategy.identifyTarget(this.ns)
    }
}