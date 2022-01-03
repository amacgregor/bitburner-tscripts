# Strategies

- **Hacking Strategy**: Base wrapper for implementing the hacking strategy. A hacking strategy, will do the three following actions:
    - **Prepare**: Make sure the conditions for running the attack are set (e.g. Minium player level, number of distributed nodes)
    - **Identify**: Based on available information and server list, identify the most optimal target 
    - **Schedule**: Return a schedule of the scripts to be executed against the target server

## Main Loop

What information do we need in order to determine the best possible strategy?

- Player information
    - Hacking Level 
    - Multipliers
    - Home RAM 
    - Home Cores
- Network information 
    - Total RAM
    - Utilization percentage


### Hacking : Early Hacking Strategy

Early hacking is meant to run while we build up to level 300 and more than 32GB of ram on the homeserver. Primary method is to launch a distributed attack against a single server that has been identified as the best one for that run. 

We exclusively leverage the cracked servers from the network and avoid using any private servers.