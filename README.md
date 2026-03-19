# vmware-mcp-server
A **Model Context Protocol (MCP) server** that gives Claude direct control over VMware Workstation Pro via its built-in REST API (`vmrest.exe`). Power VMs on and off, take snapshots, query IP addresses, manage networks G현 all from a natural language conversation with Claude.
> **AI-Generated Project** G현 This server was designed and written entirely by [Claude](https://claude.ai) (Anthropic) during a live conversation. No code was written by hand. See the [Origin Story](#origin-story) below.
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
Follow the prompts to set a username and password. Note them down G현 you will need them shortly. Then start the API server:
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
The server reads credentials from environment variables G현 credentials are **never** hardcoded.
```powershell
$env:VMREST_USERNAME = "your_vmrest_username"
$env:VMREST_PASSWORD = "your_vmrest_password"
# Optional G현 defaults to 8697
$env:VMREST_PORT     = "8697"
```
To make these permanent, add them via **System Properties G樣 Environment Variables**.
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
Fully quit Claude (system tray G樣 Quit) and relaunch. The `vmware` server will appear in your tools.
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
## Getting Inside a VM
This MCP server controls VMs at the hypervisor level. To execute commands *inside* a guest OS, combine it with:
- **`vmrun` via PowerShell MCP** G현 works without any network, communicates directly through VMware Tools:
  ```powershell
  vmrun -T ws -gu username -gp password runProgramInGuest "path\to\vm.vmx" /bin/bash -c "whoami"
  ```
- **SSH** G현 for Linux VMs with SSH enabled
- **WinRM / PowerShell Remoting** G현 for Windows VMs
---
## Security Notes
- Credentials are passed via environment variables only G현 never commit them to source control
- The vmrest API only listens on `localhost:8697` G현 it is not exposed to the network by default
- Treat your vmrest password like any local service credential
- The `.gitignore` in this repo explicitly excludes `vmrest.cfg` and `.env` files
---
## Dependencies
| Package | Version | Author | License |
|---|---|---|---|
| `@modelcontextprotocol/sdk` | ^1.12.1 | Anthropic, PBC | MIT |
| `zod` | ^3.22.0 | Colin McDonnell | MIT |
Both packages are MIT licensed, actively maintained, and have zero known vulnerabilities (`npm audit` clean).
---
## Origin Story
This project wasn't planned. It came out of a single conversation.
I was exploring what MCP actually does G현 I had assumed that enabling it gave Claude broad access to my PC, but that turned out to be wrong. Claude explained that MCP is a protocol, not a permission system: each server is a separate connector that exposes only what it is built for.
That conversation led to a question: could we connect Claude to VMware Workstation? There was no official MCP server for it, and every community project we found targeted enterprise vCenter/ESXi G현 nothing for the desktop product.
So Claude looked up the VMware Workstation REST API (`vmrest.exe`), walked through setting it up, hit credential and permission issues along the way (including a fun detour through Windows UAC and bcrypt password hashing), and then wrote this MCP server from scratch G현 live, in the same chat, without any prior template.
By the end of the conversation Claude had powered on a VM, confirmed VMware Tools was running, installed SSH inside the guest, and executed commands inside the VM G현 all driven from natural language.
This repo is the result of that session. The entire codebase was written by Claude (Anthropic). Not a single line was typed by hand.
---
## Disclaimer
This project was **entirely designed, architected and written by [Claude](https://claude.ai)**, an AI assistant made by Anthropic. The human contributor directed the goals, provided the environment, and tested the results G현 but wrote no code.
This is a real-world demonstration of AI-assisted tooling built through conversation.
---
## License
[MIT](LICENSE) G현 free to use, modify and distribute. See `LICENSE` for full terms.
Contributions welcome. If you extend this to support vSphere, ESXi, or add new tools, please open a PR.
