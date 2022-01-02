import { NS } from "/../NetscriptDefinitions.js";
import { HackingStrategy } from "/lib/interfaces/hacking.strategy.js";

export class EarlyHackingStrategy implements HackingStrategy {
    private target: number =0;

    public identifyTarget(ns: NS): string {
        ns.tprint(this.target++)
    }
    public prepare(): boolean {
        throw new Error("Method not implemented.");
    }
    public launchAttach(data: string[]): string[] {
        throw new Error("Method not implemented.");
    }
}