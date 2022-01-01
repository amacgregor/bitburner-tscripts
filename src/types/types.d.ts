import {NS, ProcessInfo} from '../../NetscriptDefinitions'

export declare interface ProcessCache {
    [index: string]: Array<ProcessInfo>;
}

export declare interface BurnerDictionary {
    [index:string] : number;
}

export declare interface PortCracker {
    ns: NS;
    name: string;
    exists: () => any;
    runAt: (target: string) => any;
    doNuke: (target: string) => any;
}

export declare interface BurnerServer {
    ns: NS;
    name: string;
    requiredHackLevel: number;
    portsRequired: number;
    getMinSecurity: () => any;
    getMaxMoney: () => any;
    getMoneyPerRamSecond: () => any;
    getExpPerSecond: () => any;
    percentageToSteal: number;
    getMoney: () => any;
    getSecurity: () => any;
    canCrack: () => any;
    canHack: () => any;
    shouldHack: () => any;
    previouslyPrepped: boolean;
    prepRegressions: number;
    previousCycle: any;
    isPrepped: () => any;
    isSubjectOfRunningScript: (filter: any, useCache: boolean, count?: number) => any;
    isPrepping: (useCache: boolean) => any;
    isTargeting: (useCache?: boolean) => any;
    isXpFarming: (useCache: boolean) => any;
    serverGrowthPercentage: () => number;
    adjustedGrowthRate: () => number;
    actualServerGrowthRate: () => number;
    targetGrowthCoefficient: () => number;
    targetGrowthCoefficientAfterTheft: () => number;
    cyclesNeededForGrowthCoefficient: () => number;
    cyclesNeededForGrowthCoefficientAfterTheft: () => number;
    percentageStolenPerHackThread: () => number;
    actualPercentageToSteal: () => number;
    getHackThreadsNeeded: () => number;
    getGrowThreadsNeeded: () => number;
    getGrowThreadsNeededAfterTheft: () => number;
    getWeakenThreadsNeededAfterTheft: () => number;
    getWeakenThreadsNeededAfterGrowth: () => number;
    _hasRootCached: boolean;
    hasRoot: () => boolean;
    isHost: () => boolean;
    totalRam: () => number;
    usedRam: () => number;
    ramAvailable: () => number;
    growDelay: () => number;
    hackDelay: () => number;
    timeToWeaken: () => number;
    timeToGrow: () => number;
    timeToHack: () => number;
    weakenThreadsNeeded: () => number;
}

export declare interface ToolConfiguration {
    name: string;
    shortName?: string;
    tail?: boolean;
    args?: any;
    shouldRun: () => any;
    requiredServer?: string;
}

export declare interface HackingTool extends ToolConfiguration {
    instance: NS;
    name: string;
    shortName: string;
    tail: boolean;
    args: any;
    shouldRun: () => any;
    requiredServer: string;
    isThreadSpreadingAllowed: boolean;
    cost: any;
    canRun: (server: BurnerServer)=> any;
    getMaxThreads: () => any;
}

export declare interface SingularityJob extends ToolConfiguration {
    interval: number;
    name: string;
    shortName?: string;
    shouldRun: () => any;
    args?: () => string[];
}

export declare interface SingularityAsyncJob extends SingularityJob {
    isLaunched: boolean;
    requiredServer: string;
}