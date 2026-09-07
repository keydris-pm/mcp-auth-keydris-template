export const config = {
  /** Where this server redeems the token it was handed. */
  gatewayUrl:
    process.env.KEYDRIS_GATEWAY_URL ??
    'http://localhost:8080/gateway/credentials',

  /**
   * Legacy `/agent/authorize` header accepted as a fallback. `mcp_kit_reader`
   * requests carry their action-scoped token in MCP params._meta instead.
   * The reader normalizes (trims and lowercases) it.
   */
  tokenHeader: process.env.KEYDRIS_TOKEN_HEADER,

  githubApiBase: process.env.GITHUB_API_BASE ?? 'https://api.github.com',
} as const;
