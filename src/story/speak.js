// Turns a tapped reply into the line the player character says aloud (or null for a silent action / thought).
const ACTIONS = new Set(['The blue flame.', 'The violet flame.', 'The golden flame in red glass.', 'A quick nod.', 'A shallow bow.', 'A deep bow, held.', 'Hands clasped behind.', 'A flame in each palm, to honour them.', 'Open hands, shown empty.',
  'Take out Mother’s spyglass. Point it at the sea.', 'Keep your eyes ahead.', 'Toss it a pistachio.', 'Hold one out on your palm.', 'Tell her about Emberland.', 'Tell her why you crossed the sea.', 'Pick it up for her.', 'Tell Kim what you fear.',
  'Hold the thought until you have proof.', 'Put your flying cape around her.', 'Tell him about the market.', '…']);
export function spokenLine(text, who) {
  if (!text || ACTIONS.has(text) || text[0] === '(') return null;
  let m = text.match(/^(Kim|Amber): “(.*)”$/); if (m) return [m[1], m[2]];
  m = text.match(/“([^”]*)”/); if (m && (text[0] === '“' || !/^[A-Z][a-z]+: /.test(text))) return [who, m[1]];
  return [who, text];
}
