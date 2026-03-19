import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerVmTools } from './tools/vm-tools.js';
const log = (msg) => console.error(`[VMware MCP] ${msg}`);
log('Starting VMware Workstation MCP Server v1.0.0...');
const server = new McpServer({
  name: 'vmware-mcp-server',
  version: '1.0.0',
});
log('Registering VM tools...');
registerVmTools(server);
const transport = new StdioServerTransport();
await server.connect(transport);
log('VMware MCP Server running and ready for Claude Desktop!');
log('Tools: list_vms, get_vm, power_on_vm, power_off_vm, shutdown_vm,');
log('       suspend_vm, pause_vm, unpause_vm, get_vm_power, get_vm_ip,');
log('       list_snapshots, take_snapshot, delete_snapshot,');
log('       list_vm_networks, list_networks');
process.on('uncaughtException', (err) => log(`Uncaught exception: ${err.message}`));
process.on('unhandledRejection', (reason) => log(`Unhandled rejection: ${reason}`));
