// Replace this adapter with your teammate's engine when available.
// Deterministic scoring keeps the offline hackathon demonstration reliable.
const weights = {
  normal_traffic: 5,
  port_scan: 75,
  brute_force: 85,
  ddos: 95,
  suspicious_login: 65,
  malware_beacon: 90
};
export const scenarioTypes = Object.freeze(Object.keys(weights));

export async function demoDetect(event) {
  const score = weights[event.type];
  return { score, reason: score >= 60 ? `Suspicious ${event.type.replaceAll('_', ' ')} pattern detected` : 'No significant threat indicators' };
}

export async function detect(event) {
  if (process.env.DETECTION_URL) {
    const response = await fetch(process.env.DETECTION_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event), signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error('Detection engine unavailable');
    const result = await response.json();
    if (!Number.isInteger(result.score) || result.score < 0 || result.score > 100 || typeof result.reason !== 'string' || result.reason.length > 500) {
      throw new Error('Invalid detection engine response');
    }
    return { score: result.score, reason: result.reason };
  }
  return demoDetect(event);
}
export function severityFor(score) {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}
