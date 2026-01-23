#!/usr/bin/env node
/**
 * Copyright (c) 2026 Patched Reality, Inc.
 *
 * CLI tool to inspect MSF files and query node data.
 * Uses Socket.io to connect directly to MV servers.
 *
 * Usage:
 *   node scripts/inspect-msf.js <msf-url> [command] [args...]
 *
 * Commands:
 *   tree                    - Show the map tree structure
 *   node <type> <id>        - Get a specific node (e.g., node RMPObject 4)
 *   compare <type> <id1> <id2> - Compare two nodes side by side
 *   raw <type> <id>         - Get raw response JSON
 *
 * Examples:
 *   node scripts/inspect-msf.js https://spatial.patchedreality.com/fabric/fabric.msf tree
 *   node scripts/inspect-msf.js https://spatial.patchedreality.com/fabric/fabric.msf node RMPObject 3
 *   node scripts/inspect-msf.js https://spatial.patchedreality.com/fabric/fabric.msf compare RMPObject 3 4
 */

import { io } from 'socket.io-client';
import https from 'https';
import http from 'http';

// Simple fetch implementation for Node.js 16
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        res.resume();
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    }).on('error', reject);
  });
}

// Type maps for resolving nodeType from bType
const CELESTIAL_TYPE_MAP = {
  0: 'Universe',
  1: 'Galaxy',
  2: 'Star',
  3: 'Planet',
  4: 'Moon',
  5: 'Asteroid',
  6: 'Comet',
  7: 'Station',
  8: 'Nebula',
  9: 'BlackHole',
  10: 'Wormhole'
};

const TERRESTRIAL_TYPE_MAP = {
  0: 'Terrain',
  1: 'Zone',
  2: 'Area',
  3: 'Structure',
  4: 'Room',
  5: 'Feature',
  6: 'Path',
  7: 'Water',
  8: 'Vegetation'
};

class MVClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.msfConfig = null;
    this.endpoint = null;
    this.resourceBaseUrl = '';
  }

  get connected() {
    return this.isConnected;
  }

  async loadMap(url) {
    if (!url) {
      throw new Error('Missing MSF URL');
    }

    // Step 1: Fetch MSF config
    console.log('Fetching MSF config...');
    this.msfConfig = await fetchJson(url);

    if (!this.msfConfig.map) {
      throw new Error('Invalid MSF config: missing map section');
    }

    // Extract resource base URL from MSF URL
    const urlObj = new URL(url);
    this.resourceBaseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname.substring(0, urlObj.pathname.lastIndexOf('/') + 1)}`;

    // Step 2: Parse connect string to get endpoint
    const connectStr = this.msfConfig.map.connect;
    this.endpoint = this._parseConnectString(connectStr);

    // Step 3: Disconnect any existing connection
    if (this.isConnected) {
      this.disconnect();
    }

    // Step 4: Connect via Socket.io
    await this._connectToServer();

    // Step 5: Fetch the map tree
    const result = await this._getMapTree();
    if (result.error) {
      throw new Error(result.error);
    }

    return result.tree;
  }

  async _connectToServer() {
    return new Promise((resolve, reject) => {
      console.log(`Connecting to ${this.endpoint}...`);

      this.socket = io(this.endpoint, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: false
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        console.log('Connected to MV server');
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        reject(new Error(`Connection error: ${err.message}`));
      });

      this.socket.on('disconnect', (reason) => {
        this.isConnected = false;
        console.log(`Disconnected: ${reason}`);
      });

      this.socket.connect();

      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  _parseConnectString(connectStr) {
    const params = {};
    if (connectStr) {
      connectStr.split(';').forEach(part => {
        const [key, value] = part.split('=');
        if (key && value) {
          params[key.trim()] = value.trim();
        }
      });
    }

    const server = params.server || 'hello.rp1.com:443';
    const secure = params.secure === 'true';
    const protocol = secure ? 'wss' : 'ws';

    let host = server;
    if (server.endsWith(':443') && secure) {
      host = server.replace(':443', '');
    }

    return `${protocol}://${host}`;
  }

  async _emitWithCallback(event, data, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnected) {
        reject(new Error('Not connected'));
        return;
      }

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${event}`));
      }, timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }

  // Node type resolution
  _resolveNodeType(data, defaultType) {
    let bType = data.bType;
    if (bType === undefined && data.pType) {
      bType = data.pType.bType;
    }
    if (bType === undefined && data.properties) {
      bType = data.properties.bType;
    }

    if (bType !== undefined) {
      if (defaultType === 'RMCObject' && CELESTIAL_TYPE_MAP[bType]) {
        return CELESTIAL_TYPE_MAP[bType];
      }
      if (defaultType === 'RMTObject' && TERRESTRIAL_TYPE_MAP[bType]) {
        return TERRESTRIAL_TYPE_MAP[bType];
      }
    }

    return defaultType;
  }

  _extractProperties(data) {
    const props = { ...data };
    const ignored = [
      'twRMRootIx', 'twRMCObjectIx', 'twRMTObjectIx', 'twRMPObjectIx',
      'pName', 'pTransform', 'pBound', 'vPosition', 'qRotation', 'vScale',
      'aChild', 'children', 'aRMTObjectIx', 'Parent', 'nChildren',
      'sName', 'sAssetUrl'
    ];
    ignored.forEach(key => delete props[key]);
    return props;
  }

  _parseTransformFromData(data) {
    const pTransform = data.pTransform;
    if (!pTransform) return null;

    return {
      position: {
        x: pTransform.Position?.[0] || 0,
        y: pTransform.Position?.[1] || 0,
        z: pTransform.Position?.[2] || 0
      },
      rotation: {
        x: pTransform.Rotation?.[0] || 0,
        y: pTransform.Rotation?.[1] || 0,
        z: pTransform.Rotation?.[2] || 0,
        w: pTransform.Rotation?.[3] || 1
      },
      scale: {
        x: pTransform.Scale?.[0] || 1,
        y: pTransform.Scale?.[1] || 1,
        z: pTransform.Scale?.[2] || 1
      }
    };
  }

  _parseBoundFromData(data) {
    const pBound = data.pBound;
    if (!pBound || !pBound.Max) return null;

    return {
      x: pBound.Max[0] || 0,
      y: pBound.Max[1] || 0,
      z: pBound.Max[2] || 0
    };
  }

  // Node parsing (shallow)
  _parseContainerNode(data) {
    const nodeType = this._resolveNodeType(data, 'RMCObject');
    return {
      name: data.pName?.wsRMCObjectId || `Container ${data.twRMCObjectIx}`,
      type: 'RMCObject',
      nodeType: nodeType,
      class: data.sClass,
      id: data.twRMCObjectIx,
      transform: this._parseTransformFromData(data),
      bound: this._parseBoundFromData(data),
      properties: this._extractProperties(data),
      children: [],
      hasChildren: data.nChildren > 0
    };
  }

  _parseTerrainNode(data) {
    const nodeType = this._resolveNodeType(data, 'RMTObject');
    return {
      name: data.pName?.wsRMTObjectId || `Terrain ${data.twRMTObjectIx}`,
      type: 'RMTObject',
      nodeType: nodeType,
      class: data.sClass,
      id: data.twRMTObjectIx,
      transform: this._parseTransformFromData(data),
      bound: this._parseBoundFromData(data),
      properties: this._extractProperties(data),
      children: [],
      hasChildren: data.nChildren > 0
    };
  }

  _parsePlaceableNode(data) {
    const nodeType = this._resolveNodeType(data, 'RMPObject');
    return {
      name: data.pName?.wsRMPObjectId || `Placeable ${data.twRMPObjectIx}`,
      type: 'RMPObject',
      nodeType: nodeType,
      class: data.sClass,
      id: data.twRMPObjectIx,
      transform: this._parseTransformFromData(data),
      bound: this._parseBoundFromData(data),
      resourceUrl: data.sAssetUrl ? `${this.resourceBaseUrl}${data.sAssetUrl}` : null,
      properties: this._extractProperties(data),
      children: [],
      hasChildren: data.nChildren > 0
    };
  }

  // Node building (with children)
  _buildContainerNode(data, id) {
    const parent = data.Parent || data;
    const aChild = data.aChild || [];
    const nodeType = this._resolveNodeType(parent, 'RMCObject');

    const node = {
      name: parent.pName?.wsRMCObjectId || parent.sName || `Container ${id}`,
      type: 'RMCObject',
      nodeType: nodeType,
      class: parent.sClass,
      id: parent.twRMCObjectIx || id,
      transform: this._parseTransformFromData(parent),
      bound: this._parseBoundFromData(parent),
      properties: this._extractProperties(parent),
      children: [],
      hasChildren: false
    };

    const allChildren = aChild.flat();
    for (const child of allChildren) {
      if (child.twRMCObjectIx !== undefined) {
        node.children.push(this._parseContainerNode(child));
      } else if (child.twRMTObjectIx !== undefined) {
        node.children.push(this._parseTerrainNode(child));
      } else if (child.twRMPObjectIx !== undefined) {
        node.children.push(this._parsePlaceableNode(child));
      }
    }

    node.hasChildren = node.children.length > 0 || parent.nChildren > 0;
    return node;
  }

  _buildTerrainNode(data, id) {
    const parent = data.Parent || data;
    const aChild = data.aChild || [];
    const nodeType = this._resolveNodeType(parent, 'RMTObject');

    const node = {
      name: parent.pName?.wsRMTObjectId || parent.sName || `Terrain ${id}`,
      type: 'RMTObject',
      nodeType: nodeType,
      class: parent.sClass,
      id: parent.twRMTObjectIx || id,
      transform: this._parseTransformFromData(parent),
      bound: this._parseBoundFromData(parent),
      properties: this._extractProperties(parent),
      children: [],
      hasChildren: false
    };

    const allChildren = aChild.flat();
    for (const child of allChildren) {
      if (child.twRMCObjectIx !== undefined) {
        node.children.push(this._parseContainerNode(child));
      } else if (child.twRMTObjectIx !== undefined) {
        node.children.push(this._parseTerrainNode(child));
      } else if (child.twRMPObjectIx !== undefined) {
        node.children.push(this._parsePlaceableNode(child));
      }
    }

    node.hasChildren = node.children.length > 0 || parent.nChildren > 0;
    return node;
  }

  _buildPlaceableNode(data, id) {
    const parent = data.Parent || data;
    const aChild = data.aChild || [];
    const nodeType = this._resolveNodeType(parent, 'RMPObject');

    const node = {
      name: parent.pName?.wsRMPObjectId || parent.sName || `Placeable ${id}`,
      type: 'RMPObject',
      nodeType: nodeType,
      class: parent.sClass,
      id: parent.twRMPObjectIx || id,
      transform: this._parseTransformFromData(parent),
      bound: this._parseBoundFromData(parent),
      resourceUrl: parent.sAssetUrl ? `${this.resourceBaseUrl}${parent.sAssetUrl}` : null,
      properties: this._extractProperties(parent),
      children: [],
      hasChildren: false
    };

    const allChildren = aChild.flat();
    for (const child of allChildren) {
      if (child.twRMCObjectIx !== undefined) {
        node.children.push(this._parseContainerNode(child));
      } else if (child.twRMTObjectIx !== undefined) {
        node.children.push(this._parseTerrainNode(child));
      } else if (child.twRMPObjectIx !== undefined) {
        node.children.push(this._parsePlaceableNode(child));
      }
    }

    node.hasChildren = node.children.length > 0 || parent.nChildren > 0;
    return node;
  }

  _buildTreeFromRoot(rootData, rootIx = 1) {
    const parent = rootData.Parent || rootData;
    const aChild = rootData.aChild || [];

    const root = {
      name: parent.pName?.wsRMRootId || `Root ${rootIx}`,
      type: 'RMRoot',
      nodeType: 'Root',
      id: parent.twRMRootIx || rootIx,
      transform: null,
      bound: null,
      properties: this._extractProperties(parent),
      children: [],
      hasChildren: false
    };

    const allChildren = aChild.flat();
    for (const child of allChildren) {
      if (child.twRMCObjectIx !== undefined) {
        root.children.push(this._parseContainerNode(child));
      } else if (child.twRMTObjectIx !== undefined) {
        root.children.push(this._parseTerrainNode(child));
      } else if (child.twRMPObjectIx !== undefined) {
        root.children.push(this._parsePlaceableNode(child));
      }
    }

    root.hasChildren = root.children.length > 0 || parent.nChildren > 0;
    return root;
  }

  async _getMapTree() {
    if (!this.isConnected) {
      return { error: 'Not connected to MV server' };
    }

    console.log('Loading map tree...');

    try {
      const allRoots = [];

      for (let rootIx = 1; rootIx <= 10; rootIx++) {
        const rootResponse = await this._emitWithCallback('RMRoot:update', { twRMRootIx: rootIx });

        if (!rootResponse || (rootResponse.nResult !== undefined && rootResponse.nResult !== 0)) {
          break;
        }

        const rootTree = this._buildTreeFromRoot(rootResponse, rootIx);
        allRoots.push(rootTree);
      }

      if (allRoots.length === 0) {
        return { error: 'No roots found in map' };
      }

      let tree;
      if (allRoots.length === 1) {
        tree = allRoots[0];
      } else {
        tree = {
          name: 'Map',
          type: 'RMRoot',
          nodeType: 'Root',
          id: 0,
          transform: null,
          bound: null,
          children: allRoots,
          hasChildren: true
        };
      }

      return { tree };

    } catch (err) {
      return { error: err.message };
    }
  }

  async getNode(id, nodeType) {
    if (id === undefined || !nodeType) {
      throw new Error('Missing node id or type');
    }

    const result = await this._getNode(id, nodeType);
    if (result.error) {
      throw new Error(result.error);
    }

    return result;
  }

  async _getNode(nodeId, nodeType) {
    if (!this.isConnected) {
      return { error: 'Not connected to MV server' };
    }

    try {
      let response;
      let node;

      switch (nodeType) {
        case 'RMRoot':
          if (nodeId === 0) {
            const result = await this._getMapTree();
            if (result.tree) {
              node = result.tree;
            }
          } else {
            response = await this._emitWithCallback('RMRoot:update', { twRMRootIx: nodeId });
            if (response && (response.nResult === undefined || response.nResult === 0)) {
              node = this._buildTreeFromRoot(response, nodeId);
            }
          }
          break;

        case 'RMCObject':
          response = await this._emitWithCallback('RMCObject:update', { twRMCObjectIx: nodeId });
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildContainerNode(response, nodeId);
          }
          break;

        case 'RMTObject':
          response = await this._emitWithCallback('RMTObject:update', { twRMTObjectIx: nodeId });
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildTerrainNode(response, nodeId);
          }
          break;

        case 'RMPObject':
          response = await this._emitWithCallback('RMPObject:update', { twRMPObjectIx: nodeId });
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildPlaceableNode(response, nodeId);
          }
          break;

        default:
          return { error: `Unknown node type: ${nodeType}` };
      }

      if (node) {
        return { node, rawResponse: response };
      } else {
        return { error: `Failed to fetch node ${nodeId}` };
      }

    } catch (err) {
      return { error: err.message };
    }
  }
}

// CLI output functions
function printTree(node, indent = 0) {
  const prefix = '  '.repeat(indent);
  const hasResource = node.resourceUrl ? ' [R]' : '';
  console.log(`${prefix}${node.name} (${node.type}:${node.id})${hasResource}`);

  if (node.children) {
    for (const child of node.children) {
      printTree(child, indent + 1);
    }
  }
}

function printNode(node, raw = false) {
  if (raw) {
    console.log(JSON.stringify(node, null, 2));
  } else {
    console.log('\n=== Node Info ===');
    console.log(`Name: ${node.name}`);
    console.log(`Type: ${node.type} (${node.nodeType})`);
    console.log(`ID: ${node.id}`);

    if (node.transform) {
      console.log('\nTransform:');
      console.log(`  Position: [${node.transform.position.x}, ${node.transform.position.y}, ${node.transform.position.z}]`);
      console.log(`  Rotation: [${node.transform.rotation.x}, ${node.transform.rotation.y}, ${node.transform.rotation.z}, ${node.transform.rotation.w}]`);
      console.log(`  Scale: [${node.transform.scale.x}, ${node.transform.scale.y}, ${node.transform.scale.z}]`);
    }

    if (node.bound) {
      console.log('\nBound (Max):');
      console.log(`  [${node.bound.x}, ${node.bound.y}, ${node.bound.z}]`);
    }

    if (node.resourceUrl) {
      console.log(`\nResource: ${node.resourceUrl}`);
    }

    if (node.children && node.children.length > 0) {
      console.log(`\nChildren: ${node.children.length}`);
      for (const child of node.children) {
        console.log(`  - ${child.name} (${child.type}:${child.id})`);
      }
    }
  }
}

function compareNodes(node1, node2) {
  console.log('\n=== Node Comparison ===\n');
  console.log(`${'Property'.padEnd(20)} | ${'Node 1'.padEnd(30)} | ${'Node 2'.padEnd(30)}`);
  console.log('-'.repeat(85));

  console.log(`${'Name'.padEnd(20)} | ${(node1.name || '').padEnd(30)} | ${(node2.name || '').padEnd(30)}`);
  console.log(`${'Type'.padEnd(20)} | ${(node1.type || '').padEnd(30)} | ${(node2.type || '').padEnd(30)}`);
  console.log(`${'ID'.padEnd(20)} | ${String(node1.id).padEnd(30)} | ${String(node2.id).padEnd(30)}`);

  if (node1.transform || node2.transform) {
    const t1 = node1.transform || { position: {}, rotation: {}, scale: {} };
    const t2 = node2.transform || { position: {}, rotation: {}, scale: {} };

    const pos1 = `[${t1.position?.x?.toFixed(3) || 0}, ${t1.position?.y?.toFixed(3) || 0}, ${t1.position?.z?.toFixed(3) || 0}]`;
    const pos2 = `[${t2.position?.x?.toFixed(3) || 0}, ${t2.position?.y?.toFixed(3) || 0}, ${t2.position?.z?.toFixed(3) || 0}]`;
    console.log(`${'Position'.padEnd(20)} | ${pos1.padEnd(30)} | ${pos2.padEnd(30)}`);

    const rot1 = `[${t1.rotation?.x?.toFixed(3) || 0}, ${t1.rotation?.y?.toFixed(3) || 0}, ${t1.rotation?.z?.toFixed(3) || 0}, ${t1.rotation?.w?.toFixed(3) || 1}]`;
    const rot2 = `[${t2.rotation?.x?.toFixed(3) || 0}, ${t2.rotation?.y?.toFixed(3) || 0}, ${t2.rotation?.z?.toFixed(3) || 0}, ${t2.rotation?.w?.toFixed(3) || 1}]`;
    console.log(`${'Rotation'.padEnd(20)} | ${rot1.padEnd(30)} | ${rot2.padEnd(30)}`);

    const scl1 = `[${t1.scale?.x?.toFixed(3) || 1}, ${t1.scale?.y?.toFixed(3) || 1}, ${t1.scale?.z?.toFixed(3) || 1}]`;
    const scl2 = `[${t2.scale?.x?.toFixed(3) || 1}, ${t2.scale?.y?.toFixed(3) || 1}, ${t2.scale?.z?.toFixed(3) || 1}]`;
    const sclMatch = scl1 === scl2 ? '' : ' <-- DIFFERENT';
    console.log(`${'Scale'.padEnd(20)} | ${scl1.padEnd(30)} | ${scl2.padEnd(30)}${sclMatch}`);
  }

  if (node1.bound || node2.bound) {
    const b1 = node1.bound || {};
    const b2 = node2.bound || {};

    const bnd1 = `[${b1.x?.toFixed(3) || 0}, ${b1.y?.toFixed(3) || 0}, ${b1.z?.toFixed(3) || 0}]`;
    const bnd2 = `[${b2.x?.toFixed(3) || 0}, ${b2.y?.toFixed(3) || 0}, ${b2.z?.toFixed(3) || 0}]`;
    const bndMatch = bnd1 === bnd2 ? '' : ' <-- DIFFERENT';
    console.log(`${'Bound'.padEnd(20)} | ${bnd1.padEnd(30)} | ${bnd2.padEnd(30)}${bndMatch}`);
  }

  const res1 = node1.resourceUrl || '(none)';
  const res2 = node2.resourceUrl || '(none)';
  const resMatch = res1 === res2 ? '' : ' <-- DIFFERENT';
  console.log(`${'Resource'.padEnd(20)} | ${res1.substring(0, 30).padEnd(30)} | ${res2.substring(0, 30).padEnd(30)}${resMatch}`);
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.log('Usage: node scripts/inspect-msf.js <msf-url> [command] [args...]');
    console.log('\nCommands:');
    console.log('  tree                        - Show the map tree structure');
    console.log('  node <type> <id>            - Get a specific node');
    console.log('  compare <type> <id1> <id2>  - Compare two nodes');
    console.log('  raw <type> <id>             - Get raw response JSON');
    console.log('\nExamples:');
    console.log('  node scripts/inspect-msf.js https://example.com/fabric.msf tree');
    console.log('  node scripts/inspect-msf.js https://example.com/fabric.msf node RMPObject 4');
    console.log('  node scripts/inspect-msf.js https://example.com/fabric.msf compare RMPObject 3 4');
    process.exit(1);
  }

  const msfUrl = args[0];
  const command = args[1] || 'tree';

  const client = new MVClient();

  try {
    const tree = await client.loadMap(msfUrl);
    console.log('');

    switch (command) {
      case 'tree':
        printTree(tree);
        break;

      case 'node': {
        const type = args[2];
        const id = parseInt(args[3], 10);
        if (!type || isNaN(id)) {
          console.error('Usage: node <type> <id>');
          process.exit(1);
        }
        const result = await client.getNode(id, type);
        printNode(result.node);
        break;
      }

      case 'raw': {
        const type = args[2];
        const id = parseInt(args[3], 10);
        if (!type || isNaN(id)) {
          console.error('Usage: raw <type> <id>');
          process.exit(1);
        }
        const result = await client.getNode(id, type);
        console.log('\n=== Raw Response ===');
        console.log(JSON.stringify(result.rawResponse, null, 2));
        break;
      }

      case 'compare': {
        const type = args[2];
        const id1 = parseInt(args[3], 10);
        const id2 = parseInt(args[4], 10);
        if (!type || isNaN(id1) || isNaN(id2)) {
          console.error('Usage: compare <type> <id1> <id2>');
          process.exit(1);
        }
        const [result1, result2] = await Promise.all([
          client.getNode(id1, type),
          client.getNode(id2, type)
        ]);
        compareNodes(result1.node, result2.node);
        break;
      }

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }

  client.disconnect();
  process.exit(0);
}

main();
