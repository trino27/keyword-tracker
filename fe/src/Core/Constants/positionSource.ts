/**
 * Where the rank positions on screen come from, said beside every position history.
 * Every stored position is simulated today: the seed invents them, and the only rank
 * provider (`RANK_PROVIDER=simulation`) does too. A snapshot does not record its source,
 * so when a real rank engine is added the API must carry the source per snapshot and
 * this constant gives way to it.
 */
export const POSITION_SOURCE = "simulated";
