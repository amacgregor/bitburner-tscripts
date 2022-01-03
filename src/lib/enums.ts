export enum ServerState {
    Rooted = "█",
    Prepping = "░",
    Prepped = "	▓",
    NotReady = "✗",
    Ready = "✓"
} 

export enum HackingStrategyStates {
    FAILURE,
    PREPARING, 
    PREPARED, 
    IDENTIFYING_TARGET, 
    TARGET_IDENTIFIED,
    RUNNING,
    BUSY,
}