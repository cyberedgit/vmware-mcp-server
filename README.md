# vmware-mcp-server
A **Model Context Protocol (MCP) server** that gives Claude direct control over VMware Workstation Pro via its built-in REST API (`vmrest.exe`). Power VMs on and off, take snapshots, query IP addresses, manage networks - all from a natural language conversation with Claude.
> **AI-Generated Project** - This server was designed and written entirely by [Claude](https://claude.ai) (Anthropic) during a live conversation. No code was written by hand. See the [Origin Story](#origin-story) below.
---
## Features
- List all registered VMs with their current power state
- Power on, off, shutdown, suspend, pause and unpause VMs
- Get IP addresses of running VMs (via VMware Tools)
- Take, list and delete snapshots
- Inspect VM hardware config (CPU, RAM, NICs)
- List all virtual networks
---
## Requirements
- Windows 10/11
- [VMware Workstation Pro](https://www.vmware.com/products/workstation-pro.html) (tested on v17)
- [Node.js](https://nodejs.org/) v18 or later
- [Claude Desktop](https://claude.ai/download)
- VMware Tools installed inside your guest VMs (for IP reporting and in-guest commands)
---
## Setup
### 1. Enable the VMware Workstation REST API
Open a terminal and run:
```powershell
vmrest --config
```
Follow the prompts to set a username and password. Then start the API server:
```powershell
vmrest
```
It should print `Serving HTTP on 127.0.0.1:8697`. Leave this terminal open.
> **Password policy:** vmrest enforces complexity requirements. Use a mix of uppercase, lowercase, numbers and special characters (e.g. `MyPass@123`).
### 2. Clone this repo
```powershell
git clone https://github.com/cyberedgit/vmware-mcp-server.git
cd vmware-mcp-server
npm install
```
### 3. Set environment variables
The server reads credentials from environment variables - credentials are **never** hardcoded.
```powershell
$env:VMREST_USERNAME = "your_vmrest_username"
$env:VMREST_PASSWORD = "your_vmrest_password"
$env:VMREST_PORT     = "8697"
```
To make these permanent, add them via **System Properties > Environment Variables**.
### 4. Register with Claude Desktop
Edit `%APPDATA%\Claude\claude_desktop_config.json` and add the following inside `mcpServers`:
```json
"vmware": {
  "command": "node",
  "args": ["C:\\path\\to\\vmware-mcp-server\\src\\server.js"],
  "env": {
    "VMREST_USERNAME": "your_vmrest_username",
    "VMREST_PASSWORD": "your_vmrest_password",
    "VMREST_PORT": "8697"
  }
}
```
### 5. Restart Claude Desktop
Fully quit Claude (system tray > Quit) and relaunch. The `vmware` server will appear in your tools.
---
## Available Tools
| Tool | Description |
|---|---|
| `list_vms` | List all VMs with ID, name, path and power state |
| `get_vm` | Get detailed info (CPU, RAM, NICs) for a specific VM |
| `get_vm_power` | Get the current power state of a VM |
| `power_on_vm` | Power on or resume a VM |
| `power_off_vm` | Forcefully power off a VM (hard stop) |
| `shutdown_vm` | Gracefully shut down via VMware Tools |
| `suspend_vm` | Suspend a running VM |
| `pause_vm` | Pause a running VM |
| `unpause_vm` | Unpause a paused VM |
| `get_vm_ip` | Get the IP address of a running VM (requires VMware Tools) |
| `list_snapshots` | List all snapshots for a VM |
| `take_snapshot` | Create a snapshot with a name and optional description |
| `delete_snapshot` | Delete a snapshot by ID |
| `list_vm_networks` | List all network adapters attached to a VM |
| `list_networks` | List all virtual networks in VMware Workstation |
---
## Going Further - Full Control Inside VMs via vmrun
The MCP server handles everything at the **hypervisor level** - power, snapshots, networking. But the real power comes when you combine it with `vmrun`, VMware's CLI tool that communicates directly through VMware Tools to execute commands *inside* a running guest OS.
This means Claude can go beyond just managing VMs - it can actually work inside them.
### What vmrun enables
**Run any command inside a guest:**
```powershell
vmrun -T ws -gu username -gp password runProgramInGuest "C:\path\to\vm.vmx" /bin/bash -c "whoami"
```
**Copy files from host into the VM:**
```powershell
vmrun -T ws -gu username -gp password copyFileFromHostToGuest "vm.vmx" "C:\script.sh" "/tmp/script.sh"
```
**Copy output back out of the VM:**
```powershell
vmrun -T ws -gu username -gp password copyFileFromGuestToHost "vm.vmx" "/tmp/output.txt" "C:\output.txt"
```
**List running processes inside the guest:**
```powershell
vmrun -T ws -gu username -gp password listProcessesInGuest "vm.vmx"
```
### The full chain
Once this MCP server is connected to Claude, the complete workflow looks like this:
```
You (natural language)
  -> Claude
  -> vmware-mcp-server  -> vmrest API  -> Power on VM, get IP, snapshots
  -> PowerShell MCP     -> vmrun       -> Execute commands inside guest OS
```
A real example from the session that created this project: Claude powered on a suspended Ubuntu VM, waited for VMware Tools to report the IP, then used `vmrun` to install OpenSSH inside the guest and confirm it was running - all without touching the VM directly, and without the VM having any network ports open at the time.
### Requirements for vmrun guest commands
- VMware Tools must be **installed and running** inside the guest
- Valid guest OS credentials (the Linux/Windows username and password inside the VM)
- Works even if the VM has no network adapters - communicates through the hypervisor directly
---
## Getting Inside VMs - Method Comparison
| Method | Best for | Requires |
|---|---|---|
| `vmrun` | Any guest OS, no network needed | VMware Tools + guest credentials |
| SSH | Linux VMs | SSH server running, network connectivity |
| WinRM | Windows VMs | WinRM enabled, network connectivity |
`vmrun` is the recommended starting point - zero network dependencies, works the moment VMware Tools is running.
---
## Security Notes
- Credentials are passed via environment variables only - never commit them to source control
- The vmrest API only listens on `localhost:8697` - not exposed to the network by default
- The `.gitignore` explicitly excludes `vmrest.cfg` and `.env` files
---
## Dependencies
| Package | Version | Author | License |
|---|---|---|---|
| `@modelcontextprotocol/sdk` | ^1.12.1 | Anthropic, PBC | MIT |
| `zod` | ^3.22.0 | Colin McDonnell | MIT |
Both packages are MIT licensed, actively maintained, and have zero known vulnerabilities (`npm audit` clean).
---
## Origin Story
This project wasn't planned.
I was trying to understand what MCP actually does. I had assumed that enabling it in Claude Desktop gave Claude broad access to my PC - turns out that's completely wrong. Claude explained that MCP is a protocol, not a permission system. Each server is a separate connector that exposes only what it's explicitly built for. Enabling MCP without installing any servers does absolutely nothing.
That explanation led to a question: could we connect Claude to VMware Workstation? I had 17 VMs sitting on my machine and no way to control them from Claude. We searched for an existing MCP server - there wasn't one. Every community project we found targeted enterprise vCenter/ESXi, nothing for the desktop product.
So we built one.
Claude researched the VMware Workstation REST API (`vmrest.exe`), which ships built into Workstation Pro but is rarely used. We hit several walls along the way - Windows UAC blocking system PATH modifications, a bcrypt password hashing rabbit hole trying to configure vmrest non-interactively, the vmrest password policy rejecting credentials silently, and the Claude MCP server running without admin privileges.
Each problem got solved in the same conversation. By the end, Claude had:
- Powered on a suspended Ubuntu VM via the REST API
- Retrieved its IP address through VMware Tools
- Installed OpenSSH inside the guest using `vmrun` without any network access
- Executed commands inside the running VM and copied output back to the host
All of it driven from natural language. No scripts prepared in advance, no prior template.
This repo is the direct output of that session. The entire codebase was written by Claude (Anthropic). Not a single line was typed by hand.
---
## Disclaimer
This project was entirely designed, architected and written by [Claude](https://claude.ai), an AI assistant made by Anthropic.
The human contributor directed the goals, provided the environment, and tested the results - but wrote no code. This is a real-world example of what AI-assisted tooling looks like when built through conversation rather than planned development.
---
## License
[MIT](LICENSE) - free to use, modify and distribute. See `LICENSE` for full terms.
Contributions welcome. If you extend this to support vSphere, ESXi, or add new tools, please open a PR.
