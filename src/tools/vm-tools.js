import { z } from 'zod';
import { vmrestRequest } from '../vmrest-client.js';
export function registerVmTools(server) {
  // LIST ALL VMs
  server.tool('list_vms',
    'List all VMs registered in VMware Workstation with their ID, name, path and power state',
    {},
    async () => {
      const vms = await vmrestRequest('GET', '/vms');
      const results = await Promise.all(vms.map(async (vm) => {
        try {
          const power = await vmrestRequest('GET', `/vms/${vm.id}/power`);
          const name = vm.path.split('\\').pop().replace('.vmx', '');
          return { id: vm.id, name, power: power.power_state, path: vm.path };
        } catch {
          return { id: vm.id, name: vm.path.split('\\').pop().replace('.vmx',''), power: 'unknown', path: vm.path };
        }
      }));
      return {
        content: [{ type: 'text', text: JSON.stringify(results, null, 2) }]
      };
    }
  );
  // GET VM DETAILS
  server.tool('get_vm',
    'Get detailed info about a specific VM including CPU, memory, and network config',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      const [info, power] = await Promise.all([
        vmrestRequest('GET', `/vms/${vm_id}`),
        vmrestRequest('GET', `/vms/${vm_id}/power`),
      ]);
      const result = { ...info, power_state: power.power_state };
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );
  // POWER ON
  server.tool('power_on_vm',
    'Power on a VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      await vmrestRequest('PUT', `/vms/${vm_id}/power`, { power_state: 'on' });
      return {
        content: [{ type: 'text', text: `VM ${vm_id} is powering on.` }]
      };
    }
  );
  // POWER OFF (hard)
  server.tool('power_off_vm',
    'Forcefully power off a VM (hard stop)',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      await vmrestRequest('PUT', `/vms/${vm_id}/power`, { power_state: 'off' });
      return {
        content: [{ type: 'text', text: `VM ${vm_id} has been powered off.` }]
      };
    }
  );
  // SHUTDOWN (graceful)
  server.tool('shutdown_vm',
    'Gracefully shut down a VM via VMware Tools',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      await vmrestRequest('PUT', `/vms/${vm_id}/power`, { power_state: 'shutdown' });
      return {
        content: [{ type: 'text', text: `VM ${vm_id} is shutting down gracefully.` }]
      };
    }
  );
  // SUSPEND
  server.tool('suspend_vm',
    'Suspend a running VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      await vmrestRequest('PUT', `/vms/${vm_id}/power`, { power_state: 'suspend' });
      return {
        content: [{ type: 'text', text: `VM ${vm_id} has been suspended.` }]
      };
    }
  );
  // PAUSE / UNPAUSE
  server.tool('pause_vm',
    'Pause a running VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      await vmrestRequest('PUT', `/vms/${vm_id}/power`, { power_state: 'pause' });
      return { content: [{ type: 'text', text: `VM ${vm_id} paused.` }] };
    }
  );
  server.tool('unpause_vm',
    'Unpause a paused VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      await vmrestRequest('PUT', `/vms/${vm_id}/power`, { power_state: 'unpause' });
      return { content: [{ type: 'text', text: `VM ${vm_id} unpaused.` }] };
    }
  );
  // GET POWER STATE
  server.tool('get_vm_power',
    'Get the current power state of a VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      const power = await vmrestRequest('GET', `/vms/${vm_id}/power`);
      return {
        content: [{ type: 'text', text: `Power state: ${power.power_state}` }]
      };
    }
  );
  // GET IP ADDRESS
  server.tool('get_vm_ip',
    'Get the IP address of a running VM (requires VMware Tools to be running inside the VM)',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      const info = await vmrestRequest('GET', `/vms/${vm_id}/ip`);
      return {
        content: [{ type: 'text', text: `IP address: ${info.ip}` }]
      };
    }
  );
  // LIST SNAPSHOTS
  server.tool('list_snapshots',
    'List all snapshots for a VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      const snaps = await vmrestRequest('GET', `/vms/${vm_id}/snapshots`);
      return {
        content: [{ type: 'text', text: JSON.stringify(snaps, null, 2) }]
      };
    }
  );
  // TAKE SNAPSHOT
  server.tool('take_snapshot',
    'Take a snapshot of a VM',
    {
      vm_id: z.string().describe('The VM ID'),
      name: z.string().describe('Snapshot name'),
      description: z.string().optional().describe('Optional snapshot description'),
    },
    async ({ vm_id, name, description }) => {
      const body = { name, description: description || '' };
      const result = await vmrestRequest('POST', `/vms/${vm_id}/snapshots`, body);
      return {
        content: [{ type: 'text', text: `Snapshot '${name}' created: ${JSON.stringify(result)}` }]
      };
    }
  );
  // DELETE SNAPSHOT
  server.tool('delete_snapshot',
    'Delete a snapshot from a VM',
    {
      vm_id: z.string().describe('The VM ID'),
      snapshot_id: z.string().describe('The snapshot ID'),
    },
    async ({ vm_id, snapshot_id }) => {
      await vmrestRequest('DELETE', `/vms/${vm_id}/snapshots/${snapshot_id}`);
      return {
        content: [{ type: 'text', text: `Snapshot ${snapshot_id} deleted from VM ${vm_id}.` }]
      };
    }
  );
  // LIST NETWORK ADAPTERS
  server.tool('list_vm_networks',
    'List network adapters attached to a VM',
    { vm_id: z.string().describe('The VM ID') },
    async ({ vm_id }) => {
      const nics = await vmrestRequest('GET', `/vms/${vm_id}/nic`);
      return {
        content: [{ type: 'text', text: JSON.stringify(nics, null, 2) }]
      };
    }
  );
  // LIST ALL NETWORKS
  server.tool('list_networks',
    'List all virtual networks configured in VMware Workstation',
    {},
    async () => {
      const nets = await vmrestRequest('GET', '/vmnet');
      return {
        content: [{ type: 'text', text: JSON.stringify(nets, null, 2) }]
      };
    }
  );
}
