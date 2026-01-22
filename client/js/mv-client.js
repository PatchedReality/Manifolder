/**
 * Copyright (c) 2026 Patched Reality, Inc.
 *
 * Uses lib/rp1 libraries by © Metaversal Corporation, 2026:
 *
 * MVMF.js
 * MVSB.js
 * MVIO.js
 * MVRest.js
 * MVXP.js
 * MVRP.js
 * MVRP_Map.js
 *
 */

/**
 * MVClient - Direct browser client for Metaverse server communication
 * Uses lib/rp1 libraries for Socket.io communication
 */
import { TERRESTRIAL_TYPE_MAP, CELESTIAL_TYPE_MAP, PLACEMENT_TYPE } from '../shared/node-types.js';

export class MVClient {
  static _initialized = false;

  static _initializePlugins() {
    if (MVClient._initialized) return;

    MV.MVMF.Core.Plugin_Open('MVMF');
    MV.MVMF.Core.Plugin_Open('MVSB');
    MV.MVMF.Core.Plugin_Open('MVXP');
    MV.MVMF.Core.Plugin_Open('MVRest');
    MV.MVMF.Core.Plugin_Open('MVIO');
    MV.MVMF.Core.Plugin_Open('MVRP');
    MV.MVMF.Core.Plugin_Open('MVRP_Dev');
    MV.MVMF.Core.Plugin_Open('MVRP_Map');

    MVClient._initialized = true;
  }

  constructor() {
    MVClient._initializePlugins();

    this.msf = null;
    this.pLnG = null;
    this.pClient = null;
    this.isConnected = false;
    this.msfConfig = null;

    this.callbacks = {
      connected: [],
      disconnected: [],
      error: [],
      mapData: [],
      nodeData: [],
      status: []
    };
  }

  get connected() {
    return this.isConnected;
  }

  connect() {
    return Promise.resolve();
  }

  disconnect() {
    if (this.msf) {
      this.msf.Detach(this);
      this.msf = this.msf.destructor();
    }
    this.pLnG = null;
    this.pClient = null;
    this.isConnected = false;
  }

  async loadMap(url) {
    if (!url) {
      throw new Error('Missing MSF URL');
    }

    try {
      this._emit('status', 'Loading map config...');

      if (this.isConnected) {
        this.disconnect();
      }

      return new Promise((resolve, reject) => {
        this._pendingResolve = resolve;
        this._pendingReject = reject;

        this.msf = new MV.MVRP.MSF(url, MV.MVRP.MSF.eMETHOD.GET);
        this.msf.Attach(this);
      });

    } catch (err) {
      this._emit('error', err);
      throw err;
    }
  }

  onReadyState(pNotice) {
    if (pNotice.pCreator !== this.msf) {
      return;
    }

    const state = this.msf.ReadyState();

    if (state === MV.MVRP.MSF.eSTATE.FAILED) {
      const err = new Error(this.msf.XHRError || 'Failed to load MSF config');
      this._emit('error', err);
      if (this._pendingReject) {
        this._pendingReject(err);
        this._pendingResolve = null;
        this._pendingReject = null;
      }
      return;
    }

    if (state >= MV.MVRP.MSF.eSTATE.READY_LOGGEDOUT) {
      this.msfConfig = this.msf.pMSFConfig;
      this.pLnG = this.msf.GetLnG('map');

      if (!this.pLnG) {
        const err = new Error('No map service available in MSF config');
        this._emit('error', err);
        if (this._pendingReject) {
          this._pendingReject(err);
          this._pendingResolve = null;
          this._pendingReject = null;
        }
        return;
      }

      this.pClient = this.pLnG.pClient;
      this.isConnected = true;

      this._emit('status', `Connected to ${this.pClient.sEndPoint}`);
      this._emit('connected');

      this._getMapTree()
        .then(result => {
          if (result.error) {
            throw new Error(result.error);
          }
          this._emit('mapData', result.tree);
          if (this._pendingResolve) {
            this._pendingResolve(result.tree);
            this._pendingResolve = null;
            this._pendingReject = null;
          }
        })
        .catch(err => {
          this._emit('error', err);
          if (this._pendingReject) {
            this._pendingReject(err);
            this._pendingResolve = null;
            this._pendingReject = null;
          }
        });
    }
  }

  async getNode(id, nodeType) {
    if (id === undefined || !nodeType) {
      throw new Error('Missing node id or type');
    }

    try {
      const result = await this._getNode(id, nodeType);

      if (result.error) {
        throw new Error(result.error);
      }

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
        }
      });
    }
  }

  _sendRequest(action, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.pClient || !this.isConnected) {
        reject(new Error('Not connected'));
        return;
      }

      const pIAction = this.pClient.Request(action);

      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout waiting for response to ${action.sAction}`));
      }, timeout);

      pIAction.Send(this, function(pIAction) {
        clearTimeout(timeoutId);
        resolve(pIAction.pResponse);
      });
    });
  }

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
      assetUrl: parent.sAssetUrl,
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

  async _getMapTree() {
    if (!this.isConnected) {
      return { error: 'Not connected to MV server' };
    }

    this._emit('status', 'Loading map tree...');

    try {
      const allRoots = [];

      for (let rootIx = 1; rootIx <= 10; rootIx++) {
        const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMROOT.apAction.UPDATE);
        pIAction.pRequest.twRMRootIx = rootIx;

        const rootResponse = await new Promise((resolve) => {
          pIAction.Send(this, function(pIAction) {
            resolve(pIAction.pResponse);
          });
        });

        if (!rootResponse || (rootResponse.nResult !== undefined && rootResponse.nResult !== 0)) {
          break;
        }

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

      return { tree };

    } catch (err) {
      return { error: err.message };
    }
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
            const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMROOT.apAction.UPDATE);
            pIAction.pRequest.twRMRootIx = nodeId;

            response = await new Promise((resolve) => {
              pIAction.Send(this, function(pIAction) {
                resolve(pIAction.pResponse);
              });
            });

            if (response && (response.nResult === undefined || response.nResult === 0)) {
              node = await this._buildTreeFromRoot(response, nodeId);
            }
          }
          break;

        case 'RMCObject': {
          const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMCOBJECT.apAction.UPDATE);
          pIAction.pRequest.twRMCObjectIx = nodeId;

          response = await new Promise((resolve) => {
            pIAction.Send(this, function(pIAction) {
              resolve(pIAction.pResponse);
            });
          });

          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildContainerNode(response, nodeId);
          }
          break;
        }

        case 'RMTObject': {
          const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMTOBJECT.apAction.UPDATE);
          pIAction.pRequest.twRMTObjectIx = nodeId;

          response = await new Promise((resolve) => {
            pIAction.Send(this, function(pIAction) {
              resolve(pIAction.pResponse);
            });
          });

          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildTerrainNode(response, nodeId);
          }
          break;
        }

        case 'RMPObject': {
          const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMPOBJECT.apAction.UPDATE);
          pIAction.pRequest.twRMPObjectIx = nodeId;

          response = await new Promise((resolve) => {
            pIAction.Send(this, function(pIAction) {
              resolve(pIAction.pResponse);
            });
          });

          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = this._buildPlaceableNode(response, nodeId);
          }
          break;
        }

        default:
          return { error: `Unknown node type: ${nodeType}` };
      }

      if (node) {
        return { node };
      } else {
        return { error: `Failed to fetch node ${nodeId}` };
      }

    } catch (err) {
      return { error: err.message };
    }
  }
}
