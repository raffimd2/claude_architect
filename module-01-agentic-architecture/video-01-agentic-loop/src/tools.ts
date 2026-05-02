import Anthropic from "@anthropic-ai/sdk";

// Two simple tools used across all three demos.
// The weather tool returns fake data; the calculator actually runs the math.
// The point of the video is the loop — not the tools themselves.

// Each tool is a { schema, handler } pair, co-located so it's easy to add or
// remove one without touching a central if-chain.
type ToolHandler = (input: Record<string, unknown>) => string;
type ToolDef = { schema: Anthropic.Tool; handler: ToolHandler };

const getWeather: ToolDef = {
  schema: {
    name: "get_weather",
    description:
      "Get the current weather for a specific city. Returns a short summary " +
      "including temperature in Celsius and conditions. Use this when the " +
      "user asks about weather, temperature, rain, or outdoor conditions.",
    input_schema: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "City name, e.g. 'Copenhagen' or 'San Francisco'.",
        },
      },
      required: ["city"],
    },
  },
  handler: (input) => {
    const city = String(input.city ?? "");
    const fakeTemps: Record<string, number> = {
      copenhagen: 7,
      "san francisco": 14,
      tokyo: 18,
      bengaluru: 26,
    };
    const temp = fakeTemps[city.toLowerCase()] ?? 20;
    return JSON.stringify({ city, temp_celsius: temp, conditions: "partly cloudy" });
  },
};

const calculator: ToolDef = {
  schema: {
    name: "calculator",
    description:
      "Evaluate a basic arithmetic expression using +, -, *, /, and parentheses. " +
      "Use this whenever the user asks you to compute a number, not for " +
      "approximate reasoning.",
    input_schema: {
      type: "object",
      properties: {
        expression: {
          type: "string",
          description: "Arithmetic expression, e.g. '(23 * 4) + 10'.",
        },
      },
      required: ["expression"],
    },
  },
  handler: (input) => {
    const expr = String(input.expression ?? "");
    if (!/^[\d+\-*/().\s]+$/.test(expr)) {
      return JSON.stringify({ error: "Only +, -, *, /, parentheses, and numbers are allowed." });
    }
    try {
      const result = Function(`"use strict"; return (${expr})`)();
      return JSON.stringify({ expression: expr, result });
    } catch (e) {
      return JSON.stringify({ error: `Could not evaluate: ${(e as Error).message}` });
    }
  },
};

const registered: ToolDef[] = [getWeather, calculator];

// What Claude sees: just the schemas.
export const tools: Anthropic.Tool[] = registered.map((t) => t.schema);

// Dispatch table: name → handler. Adding a tool = add one entry to `registered`.
const handlers: Record<string, ToolHandler> = Object.fromEntries(
  registered.map((t) => [t.schema.name, t.handler])
);

export function runTool(name: string, input: Record<string, unknown>): string {
  const handler = handlers[name];
  if (!handler) return JSON.stringify({ error: `Unknown tool: ${name}` });
  return handler(input);
}
