// VMware Workstation REST API client
// Credentials and host are read from environment variables -- never hardcode them here.
//
// Required:
//   VMREST_USERNAME  - vmrest username
//   VMREST_PASSWORD  - vmrest password
//
// Optional:
//   VMREST_HOST      - hostname/IP where vmrest is running (default: localhost)
//                      Set this when running inside Docker or a VM where vmrest
//                      lives on a different host (e.g. the VMware NAT gateway IP)
//   VMREST_PORT      - port vmrest listens on (default: 8697)
const VMREST_HOST = process.env.VMREST_HOST || 'localhost';
const VMREST_PORT = process.env.VMREST_PORT || '8697';
const VMREST_BASE = `http://${VMREST_HOST}:${VMREST_PORT}/api`;
const USERNAME    = process.env.VMREST_USERNAME;
const PASSWORD    = process.env.VMREST_PASSWORD;
if (!USERNAME || !PASSWORD) {
  process.stderr.write('[VMware MCP] ERROR: VMREST_USERNAME and VMREST_PASSWORD environment variables must be set.\n');
  process.stderr.write('[VMware MCP] See README.md for setup instructions.\n');
  process.exit(1);
}
process.stderr.write(`[VMware MCP] Connecting to vmrest at ${VMREST_HOST}:${VMREST_PORT}\n`);
const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
export async function vmrestRequest(method, path, body = null) {
  const url = `${VMREST_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/vnd.vmware.vmw.rest-v1+json',
      'Accept':        'application/vnd.vmware.vmw.rest-v1+json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`vmrest error ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
