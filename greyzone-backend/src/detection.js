
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pythonScript = path.join(__dirname, 'defence_engine.py');

const weights = {
  normal_traffic: 5,
  port_scan: 75,
  brute_force: 85,
  ddos: 95,
  suspicious_login: 65,
  malware_beacon: 90,
};

export const scenarioTypes = Object.freeze(Object.keys(weights));

export async function demoDetect(event) {
  const score = weights[event.type];

  if (score === undefined) {
    throw new Error('Unsupported detection scenario');
  }

  return {
    score,
    reason:
      score >= 60
        ? `Suspicious ${event.type.replaceAll('_', ' ')} pattern detected`
        : 'No significant threat indicators',
  };
}

function validPythonResult(result) {
  if (
    !result ||
    typeof result !== 'object' ||
    !Number.isInteger(result.score) ||
    result.score < 0 ||
    result.score > 100 ||
    typeof result.reason !== 'string' ||
    result.reason.length > 500
  ) {
    return false;
  }

  if (result.containment !== undefined) {
    const c = result.containment;

    if (
      !c ||
      typeof c.required !== 'boolean' ||
      typeof c.attempted !== 'boolean' ||
      !(typeof c.success === 'boolean' || c.success === null) ||
      !(typeof c.isolated_node === 'string' || c.isolated_node === null) ||
      !Array.isArray(c.blocked_paths) ||
      !c.blocked_paths.every(
        path =>
          Array.isArray(path) &&
          path.length === 2 &&
          path.every(node => typeof node === 'string')
      )
    ) {
      return false;
    }
  }

  if (result.network_state !== undefined) {
    const n = result.network_state;

    if (
      !n ||
      !Array.isArray(n.affected_nodes) ||
      !n.affected_nodes.every(node => typeof node === 'string') ||
      !Array.isArray(n.reachable_services) ||
      !n.reachable_services.every(service => typeof service === 'string') ||
      !Array.isArray(n.unreachable_services) ||
      !n.unreachable_services.every(service => typeof service === 'string') ||
      typeof n.remaining_risk !== 'boolean' ||
      typeof n.simulation !== 'boolean' ||
      (n.attacker_can_reach_target !== undefined &&
        typeof n.attacker_can_reach_target !== 'boolean')
    ) {
      return false;
    }
  }

  return true;
}

async function runPythonEngine(event) {
  const executable =
    process.env.PYTHON_EXECUTABLE ||
    (process.platform === 'win32' ? 'py' : 'python3');

  const args = [];

  if (!process.env.PYTHON_EXECUTABLE && process.platform === 'win32') {
    args.push('-3');
  }

  args.push(pythonScript, JSON.stringify(event));

  const { stdout } = await execFileAsync(executable, args, {
    timeout: 3000,
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });

  let result;

  try {
    result = JSON.parse(stdout.trim());
  } catch {
    throw new Error('Python engine returned invalid JSON');
  }

  if (!validPythonResult(result)) {
    throw new Error('Python engine returned an invalid response');
  }

  return {
    score: result.score,
    reason: result.reason,
    ...(result.containment !== undefined
      ? { containment: result.containment }
      : {}),
    ...(result.network_state !== undefined
      ? { network_state: result.network_state }
      : {}),
  };
}

export async function detect(event) {
  // Preserve optional external detection service.
  if (process.env.DETECTION_URL) {
    const response = await fetch(process.env.DETECTION_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      throw new Error('Detection engine unavailable');
    }

    const result = await response.json();

    if (
      !Number.isInteger(result.score) ||
      result.score < 0 ||
      result.score > 100 ||
      typeof result.reason !== 'string' ||
      result.reason.length > 500
    ) {
      throw new Error('Invalid detection engine response');
    }

    return {
      score: result.score,
      reason: result.reason,
    };
  }

  // Use the Python Network Defence Engine.
  try {
    return await runPythonEngine(event);
  } catch (error) {
    console.error(
      '[GREYZONE] Python defence engine failed; using JavaScript fallback:',
      error.message
    );

    return demoDetect(event);
  }
}

export function severityFor(score) {
  if (score >= 90) return 'critical';
  if (score >= 75) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}
