// Vendored from @keydris/kit-reader v0.1.0 (keydris-reader/node/packages/kit-reader,
// not yet on npm), then updated to the current keydris-api gateway contract:
// KIT redemption now requires the downstream `target` (host, path, method)
// alongside the MCP action — see keydris-api packages/shared gateway.dto.ts.
// The upstream package predates that change; ./token.ts and ./credentials.ts
// remain verbatim. The mcp-use adapter in ./middleware.ts is local code.

/** Mirrors the gateway's `credentialEnvelopeSchema`. */
export type CredentialEnvelope = {
  type: 'header' | 'query';
  name: string;
  prefix: string;
  value: string;
};

/**
 * A redemption never rejects: anything that stops a credential arriving is
 * something the agent should be told about in the tool result, not an HTTP
 * failure that leaves it guessing. `problem` is that explanation.
 */
export type Redemption =
  | { ok: true; credentials: CredentialEnvelope[] }
  | { ok: false; problem: string };

/**
 * The call the token was minted for. Sent alongside the token so the gateway
 * evaluates policy against the action that is really about to happen.
 */
export type KitActionContext = {
  mcp: {
    method: 'tools/call';
    action_name: string;
    parameters: Record<string, unknown>;
  };
};

/** HTTP methods the gateway's `target` schema accepts. */
export type TargetMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'PATCH'
  | 'DELETE'
  | 'HEAD'
  | 'OPTIONS';

/**
 * The downstream request the credential is for. The gateway matches it against
 * the vault's host/path patterns and evaluates policy against it, so it must
 * name the request that is really about to leave — hostname without port, path
 * without query string.
 */
export type KitTarget = {
  host: string;
  path: string;
  method: TargetMethod;
};

/** What `kitActionTokenFrom` found in a JSON-RPC body. */
export type TokenLookup = {
  token?: string;
  context?: KitActionContext;
  problem?: string;
};

export type KitReaderOptions = {
  /** The control plane's redemption endpoint, e.g. `https://api.keydris.com/gateway/credentials`. */
  gatewayUrl: string;

  /**
   * Legacy `/agent/authorize` header accepted as a fallback, lowercased.
   * Defaults to `authorization`. `mcp_kit_reader` requests carry their
   * action-scoped token in MCP `params._meta` instead.
   */
  tokenHeader?: string;

  /** Injectable for tests and for servers that route egress through their own client. */
  fetch?: typeof globalThis.fetch;
};

export type KitReader = {
  /** The header this reader falls back to, lowercased. */
  readonly tokenHeader: string;

  /** Whether this JSON-RPC body invokes a tool — i.e. whether it would cost a secret. */
  callsATool(body: unknown): boolean;

  /**
   * Turns the token carried by an MCP request into the credentials the server
   * needs upstream. `source.target` names the downstream request the credential
   * is for; the gateway requires it for every KIT redemption, so call this at
   * the moment the outbound request is known, not before.
   *
   * Resolves to `undefined` when the body calls no tool: `initialize` and
   * `tools/list` disclose nothing that would justify revealing a secret, so
   * there is nothing to redeem. Otherwise it resolves to a `Redemption` —
   * success or a readable problem. It does not reject.
   */
  redeem(
    body: unknown,
    source?: { header?: string; target?: KitTarget },
  ): Promise<Redemption | undefined>;
};
