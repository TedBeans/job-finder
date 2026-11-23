/** The app works without any AI key: agents (Claude/Muse on the user's own plan) do the AI work and push results in. */
export const aiEnabled = () => !!process.env.ANTHROPIC_API_KEY;
