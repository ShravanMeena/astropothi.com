// The model call.
//
// Bedrock first, to match devpunya-node-api-server — same region, same
// inference-profile ARNs, same ConverseCommand shape, so one AWS account and
// one set of credentials cover both products. Anthropic and OpenAI direct are
// kept as fallbacks for local work without AWS creds.
//
// Nothing here knows what a kundali is; see chat.service.js for the grounding.

import config from "../../config.js";

let bedrock = null;
async function client() {
  if (bedrock) return bedrock;
  const { BedrockRuntimeClient } = await import("@aws-sdk/client-bedrock-runtime");
  bedrock = new BedrockRuntimeClient({
    region: config.ai.awsRegion,
    // Explicit rather than relying on the default chain: on a laptop the chain
    // silently picks up whatever profile is lying around, and the first sign of
    // it is an AccessDenied against the wrong account.
    credentials: {
      accessKeyId: config.ai.awsAccessKeyId,
      secretAccessKey: config.ai.awsSecretAccessKey
    }
  });
  return bedrock;
}

export const provider = () =>
  config.ai.awsAccessKeyId && config.ai.bedrockModelId ? "bedrock"
  : config.ai.anthropicKey ? "anthropic"
  : config.ai.openaiKey ? "openai"
  : null;

export const isLive = () => Boolean(provider());

/**
 * @param {object} o
 * @param {string} o.system   instructions the buyer cannot override
 * @param {{role:"user"|"assistant",content:string}[]} o.messages
 * @returns {Promise<string>}
 */
export async function complete({ system, messages, maxTokens = 700, temperature = 0.4, modelId }) {
  const p = provider();
  if (!p) throw new Error("NO_AI_KEY");

  if (p === "bedrock") {
    const { ConverseCommand } = await import("@aws-sdk/client-bedrock-runtime");
    const send = async (modelId) => {
      const resp = await (await client()).send(new ConverseCommand({
        modelId,
        system: [{ text: system }],
        messages: messages
          .map((m) => ({ role: m.role, content: [{ text: String(m.content || "") }] }))
          .filter((m) => m.content[0].text !== ""),
        inferenceConfig: { maxTokens, temperature }
      }));
      return (resp.output?.message?.content || []).map((c) => c.text || "").join("").trim();
    };
    try {
      return await send(modelId || config.ai.bedrockModelId);
    } catch (e) {
      // A throttled or unavailable inference profile is common enough on a
      // shared account that a second model is worth having.
      if (!config.ai.bedrockFallbackModelId) throw e;
      console.warn(`[llm] bedrock primary failed (${e.name}); trying fallback`);
      return await send(config.ai.bedrockFallbackModelId);
    }
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), config.ai.timeoutMs);
  try {
    if (p === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", signal: ctrl.signal,
        headers: { "x-api-key": config.ai.anthropicKey, "anthropic-version": "2023-06-01",
                   "content-type": "application/json" },
        body: JSON.stringify({ model: config.ai.model, max_tokens: maxTokens, system, messages })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw Object.assign(new Error(body?.error?.message || `Anthropic ${res.status}`), { body });
      return (body.content || []).map((c) => c.text || "").join("").trim();
    }
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST", signal: ctrl.signal,
      headers: { authorization: `Bearer ${config.ai.openaiKey}`, "content-type": "application/json" },
      body: JSON.stringify({ model: config.ai.model, max_tokens: maxTokens,
                             messages: [{ role: "system", content: system }, ...messages] })
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw Object.assign(new Error(body?.error?.message || `OpenAI ${res.status}`), { body });
    return (body.choices?.[0]?.message?.content || "").trim();
  } finally {
    clearTimeout(timer);
  }
}
