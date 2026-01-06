'use strict';

import { io } from 'socket.io-client';
import axios from 'axios';

// Node type colors for reference (used by client)
const NODE_COLORS = {
  RMRoot: '#ffd700',    // gold
  RMCObject: '#4a9eff', // blue
  RMTObject: '#50c878', // green
  RMPObject: '#ff8c42'  // orange
};

export class RP1Proxy {
  constructor(browserWs) {
    this.browserWs = browserWs;
    this.socket = null;
    this.isConnected = false;
    this.isLoggedIn = false;
    this.userId = null;
    this.pendingCallbacks = new Map();
    this.callbackId = 0;
    this.msfConfig = null;
    this.endpoint = null;
  }

  sendToBrowser(message) {
    if (this.browserWs && this.browserWs.readyState === 1) { // WebSocket.OPEN
      this.browserWs.send(JSON.stringify(message));
    }
  }

  async connect(endpoint) {
    return new Promise((resolve, reject) => {
      this.endpoint = endpoint || 'wss://hello.rp1.com';
      console.log(`[RP1] Connecting to ${this.endpoint}...`);
      this.sendToBrowser({ type: 'status', message: `Connecting to ${this.endpoint}...` });

      this.socket = io(this.endpoint, {
        transports: ['websocket'],
        autoConnect: false,
        reconnection: false
      });

      // Connection events
      this.socket.on('connect', () => {
        console.log('[RP1] Connected to RP1 server');
        this.isConnected = true;
        this.sendToBrowser({ type: 'status', message: 'Connected to RP1 server' });
        resolve();
      });

      this.socket.on('connect_error', (err) => {
        console.error('[RP1] Connection error:', err.message);
        this.sendToBrowser({ type: 'error', message: `Connection error: ${err.message}` });
        reject(err);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('[RP1] Disconnected:', reason);
        this.isConnected = false;
        this.isLoggedIn = false;
        this.sendToBrowser({ type: 'status', message: `Disconnected: ${reason}` });
      });

      // Handle incoming events from RP1
      this.socket.onAny((eventName, ...args) => {
        console.log(`[RP1] Event: ${eventName}`, JSON.stringify(args).substring(0, 200));
      });

      // Start connection
      this.socket.connect();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isConnected) {
          reject(new Error('Connection timeout'));
        }
      }, 10000);
    });
  }

  disconnect() {
    if (this.socket) {
      console.log('[RP1] Disconnecting from RP1 server');
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isLoggedIn = false;
  }

  async login(email, password) {
    if (!this.isConnected) {
      return { success: false, error: 'Not connected to RP1 server' };
    }

    console.log(`[RP1] Login attempt for: ${email}`);
    this.sendToBrowser({ type: 'status', message: 'Authenticating...' });

    try {
      // Step 1: Request authentication token
      console.log('[RP1] Requesting TOKEN...');
      const tokenResponse = await this.emitWithCallback('TOKEN', {
        sRDCompanyId: email,
        sRDServiceId: password
      });

      console.log('[RP1] TOKEN response:', JSON.stringify(tokenResponse).substring(0, 200));

      if (!tokenResponse || tokenResponse.dwResult !== 0) {
        const error = tokenResponse?.sError || 'TOKEN request failed';
        console.error('[RP1] TOKEN failed:', error);
        return { success: false, error };
      }

      const token = tokenResponse.sToken;
      if (!token) {
        return { success: false, error: 'No token received' };
      }

      // Step 2: Encode token and call Login
      console.log('[RP1] Calling Login with encoded token...');
      const encodedToken = Buffer.from('token=' + token).toString('base64');

      const loginResponse = await this.emitWithCallback('Login', encodedToken);
      console.log('[RP1] Login response:', JSON.stringify(loginResponse).substring(0, 200));

      if (!loginResponse || loginResponse.nResult !== 0) {
        const error = loginResponse?.sError || 'Login failed';
        console.error('[RP1] Login failed:', error);
        return { success: false, error };
      }

      this.isLoggedIn = true;
      this.userId = loginResponse.twUserIx || loginResponse.userId;

      console.log(`[RP1] Login successful, userId: ${this.userId}`);
      return { success: true, userId: this.userId };

    } catch (err) {
      console.error('[RP1] Login error:', err.message);
      return { success: false, error: err.message };
    }
  }

  async getMapTree() {
    if (!this.isConnected) {
      return { error: 'Not connected to RP1 server' };
    }

    console.log('[RP1] Requesting map tree...');
    this.sendToBrowser({ type: 'status', message: 'Loading map tree...' });

    try {
      // Step 1: Request RMRoot update (case sensitive!)
      console.log('[RP1] Requesting RMRoot:update...');
      const rootResponse = await this.emitWithCallback('RMRoot:update', { twRMRootIx: 1 });
      console.log('[RP1] RMROOT response:', JSON.stringify(rootResponse).substring(0, 500));

      if (!rootResponse || (rootResponse.nResult !== undefined && rootResponse.nResult !== 0)) {
        const error = rootResponse?.sError || 'Failed to get RMROOT';
        return { error };
      }

      // Build tree structure from response
      const tree = await this.buildTreeFromRoot(rootResponse);

      console.log('[RP1] Map tree built successfully');
      return { tree };

    } catch (err) {
      console.error('[RP1] getMapTree error:', err.message);
      return { error: err.message };
    }
  }

  async buildTreeFromRoot(rootData) {
    // Parse the RMRoot:update response format
    const parent = rootData.Parent || rootData;
    const aChild = rootData.aChild || [];

    const root = {
      name: parent.pName?.wsRMRootId || 'Root',
      type: 'RMRoot',
      id: parent.twRMRootIx || 1,
      transform: null,
      bound: null,
      children: [],
      hasChildren: false
    };

    // aChild is an array of arrays:
    // [0] = RMCObject (containers)
    // [1] = RMTObject (terrain)
    // [2] = RMPObject (placeables)

    const containers = aChild[0] || [];
    const terrains = aChild[1] || [];
    const placeables = aChild[2] || [];

    console.log(`[RP1] Root has ${containers.length} containers, ${terrains.length} terrains, ${placeables.length} placeables`);

    // Add containers
    for (const container of containers) {
      root.children.push(this.parseContainerNode(container));
    }

    // Add terrains
    for (const terrain of terrains) {
      root.children.push(this.parseTerrainNode(terrain));
    }

    // Add placeables
    for (const placeable of placeables) {
      root.children.push(this.parsePlaceableNode(placeable));
    }

    root.hasChildren = root.children.length > 0;

    return root;
  }

  parseContainerNode(data) {
    return {
      name: data.pName?.wsRMCObjectId || `Container ${data.twRMCObjectIx}`,
      type: 'RMCObject',
      id: data.twRMCObjectIx,
      transform: this.parseTransformFromData(data),
      bound: this.parseBoundFromData(data),
      children: [],
      hasChildren: data.nChildren > 0
    };
  }

  parseTerrainNode(data) {
    return {
      name: data.pName?.wsRMTObjectId || `Terrain ${data.twRMTObjectIx}`,
      type: 'RMTObject',
      id: data.twRMTObjectIx,
      transform: this.parseTransformFromData(data),
      bound: this.parseBoundFromData(data),
      children: [],
      hasChildren: data.nChildren > 0
    };
  }

  parsePlaceableNode(data) {
    return {
      name: data.pName?.wsRMPObjectId || `Placeable ${data.twRMPObjectIx}`,
      type: 'RMPObject',
      id: data.twRMPObjectIx,
      transform: this.parseTransformFromData(data),
      bound: this.parseBoundFromData(data),
      children: [],
      hasChildren: data.nChildren > 0
    };
  }

  parseTransformFromData(data) {
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

  parseBoundFromData(data) {
    const pBound = data.pBound;
    if (!pBound || !pBound.Max) return null;

    return {
      x: pBound.Max[0] || 0,
      y: pBound.Max[1] || 0,
      z: pBound.Max[2] || 0
    };
  }

  async buildContainerNode(data, id) {
    const node = {
      name: data.sName || `Container ${id}`,
      type: 'RMCObject',
      id: data.twRMCObjectIx || id,
      transform: this.parseTransform(data),
      bound: this.parseBound(data),
      children: [],
      hasChildren: false
    };

    // Check for terrain children
    const terrainRefs = data.children || data.aRMTObjectIx || [];
    node.hasChildren = terrainRefs.length > 0;

    // Recursively fetch terrain objects (limit depth for initial load)
    if (terrainRefs.length > 0 && terrainRefs.length <= 10) {
      console.log(`[RP1] Container ${id} has ${terrainRefs.length} terrain children`);

      for (const terrainRef of terrainRefs) {
        const terrainId = typeof terrainRef === 'object' ? terrainRef.twRMTObjectIx : terrainRef;

        try {
          const terrainResponse = await this.emitWithCallback('RMTOBJECT:open', { twRMTObjectIx: terrainId });

          if (terrainResponse && (terrainResponse.nResult === undefined || terrainResponse.nResult === 0)) {
            const terrainNode = this.buildTerrainNode(terrainResponse, terrainId);
            node.children.push(terrainNode);
          }
        } catch (err) {
          console.error(`[RP1] Error fetching RMTOBJECT ${terrainId}:`, err.message);
        }
      }
    }

    return node;
  }

  buildTerrainNode(data, id) {
    // Handle :update response format with Parent and aChild
    const parent = data.Parent || data;
    const aChild = data.aChild || [];

    const node = {
      name: parent.pName?.wsRMTObjectId || parent.sName || `Terrain ${id}`,
      type: 'RMTObject',
      id: parent.twRMTObjectIx || id,
      transform: this.parseTransformFromData(parent),
      bound: this.parseBoundFromData(parent),
      children: [],
      hasChildren: false
    };

    // Parse children - detect type from each child's properties
    // RMTObject responses may have all children in aChild[0] or split across arrays
    const allChildren = aChild.flat();

    console.log(`[RP1] Terrain ${node.name} has ${allChildren.length} total children`);

    for (const child of allChildren) {
      // Detect type from index property
      if (child.twRMCObjectIx !== undefined) {
        node.children.push(this.parseContainerNode(child));
      } else if (child.twRMTObjectIx !== undefined) {
        node.children.push(this.parseTerrainNode(child));
      } else if (child.twRMPObjectIx !== undefined) {
        node.children.push(this.parsePlaceableNode(child));
      }
    }

    node.hasChildren = node.children.length > 0 || parent.nChildren > 0;

    return node;
  }

  parseTransform(data) {
    if (!data) return null;

    const position = data.vPosition || data.position;
    const rotation = data.qRotation || data.rotation;
    const scale = data.vScale || data.scale;

    if (!position && !rotation && !scale) return null;

    return {
      position: position ? { x: position.dX || position.x || 0, y: position.dY || position.y || 0, z: position.dZ || position.z || 0 } : { x: 0, y: 0, z: 0 },
      rotation: rotation ? { x: rotation.dX || rotation.x || 0, y: rotation.dY || rotation.y || 0, z: rotation.dZ || rotation.z || 0, w: rotation.dW || rotation.w || 1 } : { x: 0, y: 0, z: 0, w: 1 },
      scale: scale ? { x: scale.dX || scale.x || 1, y: scale.dY || scale.y || 1, z: scale.dZ || scale.z || 1 } : { x: 1, y: 1, z: 1 }
    };
  }

  parseBound(data) {
    if (!data) return null;

    const bound = data.bound || data.vBound;
    if (!bound) return null;

    return {
      x: bound.radiusX || bound.dX || bound.x || 0,
      y: bound.radiusY || bound.dY || bound.y || 0,
      z: bound.radiusZ || bound.dZ || bound.z || 0
    };
  }

  async getNode(nodeId, nodeType) {
    if (!this.isConnected) {
      return { error: 'Not connected to RP1 server' };
    }

    console.log(`[RP1] Requesting node ${nodeId} (${nodeType})...`);

    try {
      let response;
      let node;

      switch (nodeType) {
        case 'RMCObject':
          response = await this.emitWithCallback('RMCObject:update', { twRMCObjectIx: nodeId });
          console.log(`[RP1] RMCObject:update response:`, JSON.stringify(response).substring(0, 500));
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = await this.buildContainerNode(response, nodeId);
          }
          break;

        case 'RMTObject':
          response = await this.emitWithCallback('RMTObject:update', { twRMTObjectIx: nodeId });
          console.log(`[RP1] RMTObject:update response:`, JSON.stringify(response).substring(0, 500));
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this.buildTerrainNode(response, nodeId);
          }
          break;

        case 'RMPObject':
          response = await this.emitWithCallback('RMPObject:update', { twRMPObjectIx: nodeId });
          console.log(`[RP1] RMPObject:update response:`, JSON.stringify(response).substring(0, 500));
          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = {
              name: response.sName || `Placeable ${nodeId}`,
              type: 'RMPObject',
              id: response.twRMPObjectIx || nodeId,
              transform: this.parseTransform(response),
              assetUrl: response.sAssetUrl,
              children: [],
              hasChildren: false
            };
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
      console.error(`[RP1] getNode error:`, err.message);
      return { error: err.message };
    }
  }

  async emitWithCallback(event, data, timeout = 30000) {
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

  onBrowserMessage(message) {
    const { type } = message;

    switch (type) {
      case 'login':
        this.handleLogin(message);
        break;

      case 'loadMap':
        this.handleLoadMap(message);
        break;

      case 'getMapTree':
        this.handleGetMapTree();
        break;

      case 'getNode':
        this.handleGetNode(message);
        break;

      default:
        console.warn(`[RP1] Unknown message type: ${type}`);
        this.sendToBrowser({ type: 'error', message: `Unknown message type: ${type}` });
    }
  }

  async handleLoadMap(message) {
    const { url, requestId } = message;

    if (!url) {
      this.sendToBrowser({ type: 'error', message: 'Missing MSF URL', requestId });
      return;
    }

    try {
      // Step 1: Fetch MSF config
      console.log(`[RP1] Fetching MSF config from: ${url}`);
      this.sendToBrowser({ type: 'status', message: 'Fetching map config...' });

      const response = await axios.get(url);
      this.msfConfig = response.data;

      console.log('[RP1] MSF config:', JSON.stringify(this.msfConfig));

      if (!this.msfConfig.map) {
        throw new Error('Invalid MSF config: missing map section');
      }

      // Step 2: Parse connect string to get endpoint
      const connectStr = this.msfConfig.map.connect;
      const endpoint = this.parseConnectString(connectStr);

      console.log(`[RP1] Parsed endpoint: ${endpoint}`);

      // Step 3: Disconnect from any existing connection
      if (this.isConnected) {
        this.disconnect();
      }

      // Step 4: Connect to the map server
      await this.connect(endpoint);

      // Step 5: Fetch the map tree
      const result = await this.getMapTree();

      if (result.error) {
        this.sendToBrowser({ type: 'error', message: result.error, requestId });
      } else {
        this.sendToBrowser({ type: 'mapData', tree: result.tree, requestId });
      }

    } catch (err) {
      console.error('[RP1] handleLoadMap error:', err.message);
      this.sendToBrowser({ type: 'error', message: err.message, requestId });
    }
  }

  parseConnectString(connectStr) {
    // Parse connect string like "secure=true;server=hello.rp1.com:443;session=RP1"
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

    // Remove port if it's default for the protocol
    let host = server;
    if (server.endsWith(':443') && secure) {
      host = server.replace(':443', '');
    }

    return `${protocol}://${host}`;
  }

  async handleLogin(message) {
    const { email, password } = message;

    if (!email || !password) {
      this.sendToBrowser({
        type: 'loginResult',
        success: false,
        error: 'Missing email or password'
      });
      return;
    }

    const result = await this.login(email, password);
    this.sendToBrowser({
      type: 'loginResult',
      ...result
    });
  }

  async handleGetMapTree() {
    const result = await this.getMapTree();

    if (result.error) {
      this.sendToBrowser({ type: 'error', message: result.error });
    } else {
      this.sendToBrowser({ type: 'mapData', tree: result.tree });
    }
  }

  async handleGetNode(message) {
    const { id, nodeType, requestId } = message;

    console.log(`[RP1] handleGetNode: id=${id}, nodeType=${nodeType}, requestId=${requestId}`);

    if (id === undefined || !nodeType) {
      this.sendToBrowser({ type: 'error', message: 'Missing node id or type', requestId });
      return;
    }

    const result = await this.getNode(id, nodeType);

    if (result.error) {
      console.log(`[RP1] getNode error:`, result.error);
      this.sendToBrowser({ type: 'error', message: result.error, requestId });
    } else {
      console.log(`[RP1] getNode success, node:`, result.node?.name);
      this.sendToBrowser({ type: 'nodeData', node: result.node, requestId });
    }
  }
}
