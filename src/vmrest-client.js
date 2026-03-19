// VMware Workstation REST API client
// Credentials are read from environment variables GÇö never hardcode them here.
// Set these before starting the server:
//   $env:VMREST_USERNAME = "your_username"
//   $env:VMREST_PASSWORD = "your_password"
//   $env:VMREST_PORT     = "8697"  (optional, defaults to 8697)
const VMREST_BASE = `http://localhost:${process.env.VMREST_PORT || '8697'}/api`;
const USERNAME = process.env.VMREST_USERNAME;
const PASSWORD = process.env.VMREST_PASSWORD;
if (!USERNAME || !PASSWORD) {
  process.stderr.write('[VMware MCP] ERROR: VMREST_USERNAME and VMREST_PASSWORD environment variables must be set.\n');
  process.stderr.write('[VMware MCP] See README.md for setup instructions.\n');
  process.exit(1);
}
const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
export async function vmrestRequest(method, path, body = null) {
  const url = `${VMREST_BASE}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/vnd.vmware.vmw.rest-v1+json',
      'Accept': 'application/vnd.vmware.vmw.rest-v1+json',
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
