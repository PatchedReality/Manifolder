/**
 * RP1Client - Direct browser client for RP1 server communication
 * Connects directly to RP1 servers via Socket.io, no proxy needed
 */
import { TERRESTRIAL_TYPE_MAP, CELESTIAL_TYPE_MAP, PLACEMENT_TYPE } from '../shared/node-types.js';

export class RP1Client {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.msfConfig = null;
    this.endpoint = null;

    this.callbacks = {
      connected: [],
      disconnected: [],
      error: [],
      mapData: [],
      nodeData: [],
      status: []
    };
  }

  // Public API - kept for compatibility
  get connected() {
    return this.isConnected;
  }

  connect() {
    // No-op - connection happens in loadMap()
    return Promise.resolve();
  }

  disconnect() {
    if (this.socket) {
      console.log('[RP1] Disconnecting from RP1 server');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
  }

  async loadMap(url) {
    if (!url) {
      throw new Error('Missing MSF URL');
    }

    try {
      // Step 1: Fetch MSF config
      console.log(`[RP1] Fetching MSF config from: ${url}`);
      this._emit('status', 'Fetching map config...');

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      this.msfConfig = await response.json();

      console.log('[RP1] MSF config:', JSON.stringify(this.msfConfig));

      if (!this.msfConfig.map) {
        throw new Error('Invalid MSF config: missing map section');
      }

      // Step 2: Parse connect string to get endpoint
      const connectStr = this.msfConfig.map.connect;
      const endpoint = this._parseConnectString(connectStr);

      console.log(`[RP1] Parsed endpoint: ${endpoint}`);

      // Step 3: Disconnect from any existing connection
      if (this.isConnected) {
        this.disconnect();
      }

      // Step 4: Connect to the map server
      await this._connectToRP1(endpoint);

      // Step 5: Fetch the map tree
      const result = await this._getMapTree();

      if (result.error) {
        throw new Error(result.error);
      }

      this._emit('mapData', result.tree);
      return result.tree;

    } catch (err) {
      console.error('[RP1] loadMap error:', err.message);
      this._emit('error', err);
      throw err;
    }
  }

  async getNode(id, nodeType) {
    if (id === undefined || !nodeType) {
      throw new Error('Missing node id or type');
    }

    console.log(`[RP1] getNode: id=${id}, nodeType=${nodeType}`);

    try {
      const result = await this._getNode(id, nodeType);

      if (result.error) {
        console.log(`[RP1] getNode error:`, result.error);
        throw new Error(result.error);
      }

      console.log(`[RP1] getNode success, node:`, result.node?.name);
      this._emit('nodeData', result.node);
      return result.node;

    } catch (err) {
      this._emit('error', err);
      throw err;
    }
  }

  on(event, handler) {
    if (this.callbacks[event]) {
      this.callbacks[event].push(handler);
    }
  }

  off(event, handler) {
    if (this.callbacks[event]) {
      const index = this.callbacks[event].indexOf(handler);
      if (index !== -1) {
        this.callbacks[event].splice(index, 1);
      }
    }
  }

  _emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  // Connection management

  async _connectToRP1(endpoint) {
    return new Promise((resolve, reject) => {
      this.endpoint = endpoint || 'wss://hello.rp1.com';
      console.log(`[RP1] Connecting to ${this.endpoint}...`);
      this._emit('status', `Connecting to ${this.endpoint}...`);

      // Use global io from Socket.io CDN
      this.socket = io(this.endpoint, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: false
      });

      this.socket.on('connect', () => {
        console.log('[RP1] Connected to RP1 server');
        this.isConnected = true;
        this._emit('status', 'Connected to RP1 server');
        this._emit('connected');
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('[RP1] Connection error:', err.message);
        this._emit('error', new Error(`Connection error: ${err.message}`));
        reject(err);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[RP1] Disconnected:', reason);
        this.isConnected = false;
        this._emit('status', `Disconnected: ${reason}`);
        this._emit('disconnected');
      });

      this.socket.onAny((eventName, ...args) => {
        console.log(`[RP1] Event: ${eventName}`, JSON.stringify(args).substring(0, 200));
      });

      this.socket.connect();

      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
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

      console.log(`[RP1] Emitting: ${event}`);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });
    });
  }

  // MSF parsing

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

  // Data extraction

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

  _parseOrbitFromData(data) {
    const pOrbit = data.pOrbit_Spin;
    if (!pOrbit) return null;

    if (!pOrbit.dA || pOrbit.dA === 0) return null;

    const TIME_UNIT_TO_SECONDS = 1 / 64;

    return {
      period: (pOrbit.tmPeriod || 0) * TIME_UNIT_TO_SECONDS,
      phaseOffset: (pOrbit.tmOrigin ?? pOrbit.tmStart ?? 0) * TIME_UNIT_TO_SECONDS,
      semiMajorAxis: pOrbit.dA,
      semiMinorAxis: pOrbit.dB || pOrbit.dA
    };
  }

  // Node parsing (shallow, no children loaded)

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
      orbit: this._parseOrbitFromData(data),
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
      orbit: this._parseOrbitFromData(parent),
      properties: this._extractProperties(parent),
      children: [],
      hasChildren: false
    };

    const allChildren = aChild.flat();

    console.log(`[RP1] Container ${node.name} has ${allChildren.length} total children`);

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

    console.log(`[RP1] Terrain ${node.name} has ${allChildren.length} total children`);

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
      assetUrl: parent.sAssetUrl,
      properties: this._extractProperties(parent),
      children: [],
      hasChildren: false
    };

    const allChildren = aChild.flat();

    console.log(`[RP1] Placeable ${node.name} has ${allChildren.length} total children`);

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

  async _buildTreeFromRoot(rootData, rootIx = 1) {
    const parent = rootData.Parent || rootData;
    const aChild = rootData.aChild || [];

    const root = {
      name: parent.pName?.wsRMRootId || `Root ${rootIx}`,
      type: 'RMRoot',
      nodeType: 'Root',
      id: parent.twRMRootIx || rootIx,
      transform: null,
      bound: null,
      children: [],
      hasChildren: false
    };

    const containers = aChild[0] || [];
    const terrains = aChild[1] || [];
    const placeables = aChild[2] || [];

    console.log(`[RP1] Root has ${containers.length} containers, ${terrains.length} terrains, ${placeables.length} placeables`);

    for (const container of containers) {
      root.children.push(this._parseContainerNode(container));
    }

    for (const terrain of terrains) {
      root.children.push(this._parseTerrainNode(terrain));
    }

    for (const placeable of placeables) {
      root.children.push(this._parsePlaceableNode(placeable));
    }

    root.hasChildren = root.children.length > 0;

    return root;
  }

  // Data fetching

  async _getMapTree() {
    if (!this.isConnected) {
      return { error: 'Not connected to RP1 server' };
    }

    console.log('[RP1] Requesting map tree...');
    this._emit('status', 'Loading map tree...');

    try {
      const allRoots = [];

      for (let rootIx = 1; rootIx <= 10; rootIx++) {
        console.log(`[RP1] Requesting RMRoot:update for root ${rootIx}...`);
        const rootResponse = await this._emitWithCallback('RMRoot:update', { twRMRootIx: rootIx });

        if (!rootResponse || (rootResponse.nResult !== undefined && rootResponse.nResult !== 0)) {
          console.log(`[RP1] No more roots after ${rootIx - 1}`);
          break;
        }

        console.log(`[RP1] RMROOT ${rootIx} response:`, JSON.stringify(rootResponse).substring(0, 300));
        const rootTree = await this._buildTreeFromRoot(rootResponse, rootIx);
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

      console.log(`[RP1] Map tree built successfully with ${allRoots.length} root(s)`);
      return { tree };

    } catch (err) {
      console.error('[RP1] _getMapTree error:', err.message);
      return { error: err.message };
    }
  }

  async _getNode(nodeId, nodeType) {
    if (!this.isConnected) {
      return { error: 'Not connected to RP1 server' };
    }

    console.log(`[RP1] Requesting node ${nodeId} (${nodeType})...`);

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
            console.log(`[RP1] RMRoot:update response:`, JSON.stringify(response).substring(0, 500));
            if (response && (response.nResult === undefined || response.nResult === 0)) {
              node = await this._buildTreeFromRoot(response, nodeId);
            }
          }
          break;

        case 'RMCObject':
          response = await this._emitWithCallback('RMCObject:update', { twRMCObjectIx: nodeId });
          console.log(`[RP1] RMCObject:update response:`, JSON.stringify(response).substring(0, 500));
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildContainerNode(response, nodeId);
          }
          break;

        case 'RMTObject':
          response = await this._emitWithCallback('RMTObject:update', { twRMTObjectIx: nodeId });
          console.log(`[RP1] RMTObject:update response:`, JSON.stringify(response).substring(0, 500));
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildTerrainNode(response, nodeId);
          }
          break;

        case 'RMPObject':
          response = await this._emitWithCallback('RMPObject:update', { twRMPObjectIx: nodeId });
          console.log(`[RP1] RMPObject:update response:`, JSON.stringify(response).substring(0, 500));
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildPlaceableNode(response, nodeId);
          }
          break;

        default:
          return { error: `Unknown node type: ${nodeType}` };
      }

      if (node) {
        return { node };
      } else {
        return { error: `Failed to fetch node ${nodeId}` };
      }

    } catch (err) {
      console.error(`[RP1] _getNode error:`, err.message);
      return { error: err.message };
    }
  }
}
