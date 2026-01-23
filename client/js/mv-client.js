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
import { NodeFactory } from './node-factory.js';
import { setResourceBaseUrl } from './node-helpers.js';

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

      const rootUrl = this.msf.GetMapRootUrl();
      setResourceBaseUrl(rootUrl);

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
    this.callbacks[event]?.forEach(handler => {
      try {
        handler(data);
      } catch {
        // Handler errors should not propagate
      }
    });
  }

  _sendRequest(action, timeout = 30000) {
    if (!this.pClient || !this.isConnected) {
      return Promise.reject(new Error('Not connected'));
    }

    const pIAction = this.pClient.Request(action);
    return this._sendAction(pIAction, timeout);
  }

  _sendAction(pIAction, timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      pIAction.Send(this, function(pIAction) {
        clearTimeout(timeoutId);
        resolve(pIAction.pResponse);
      });
    });
  }

  _buildTreeFromRoot(rootData, rootIx = 1) {
    return NodeFactory.createNode('RMRoot', rootData, rootIx);
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

        const rootResponse = await this._sendAction(pIAction);

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

            response = await this._sendAction(pIAction);

            if (response && (response.nResult === undefined || response.nResult === 0)) {
              node = this._buildTreeFromRoot(response, nodeId);
            }
          }
          break;

        case 'RMCObject': {
          const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMCOBJECT.apAction.UPDATE);
          pIAction.pRequest.twRMCObjectIx = nodeId;

          response = await this._sendAction(pIAction);

          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = NodeFactory.createNode('RMCObject', response, nodeId);
          }
          break;
        }

        case 'RMTObject': {
          const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMTOBJECT.apAction.UPDATE);
          pIAction.pRequest.twRMTObjectIx = nodeId;

          response = await this._sendAction(pIAction);

          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = NodeFactory.createNode('RMTObject', response, nodeId);
          }
          break;
        }

        case 'RMPObject': {
          const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMPOBJECT.apAction.UPDATE);
          pIAction.pRequest.twRMPObjectIx = nodeId;

          response = await this._sendAction(pIAction);

          if (response && (response.nResult === undefined || response.nResult === 0)) {
            node = NodeFactory.createNode('RMPObject', response, nodeId);
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

  async searchNodes(searchText) {
    if (!this.isConnected || !searchText) {
      return { matches: [], paths: [], unavailable: [] };
    }

    const results = { matches: [], paths: [], unavailable: [] };

    // Find ALL root child indices for search scopes (query all roots like _getMapTree)
    const rmcObjectIndices = [];
    const rmtObjectIndices = [];

    try {
      for (let rootIx = 1; rootIx <= 10; rootIx++) {
        const pIAction = this.pClient.Request(MV.MVRP.Map.IO_RMROOT.apAction.UPDATE);
        pIAction.pRequest.twRMRootIx = rootIx;

        const rootResponse = await this._sendAction(pIAction);

        if (!rootResponse || (rootResponse.nResult !== undefined && rootResponse.nResult !== 0)) {
          break;
        }

        if (rootResponse.aChild && rootResponse.aChild.length > 0) {
          for (const childArray of rootResponse.aChild) {
            if (Array.isArray(childArray)) {
              for (const child of childArray) {
                if (child.twRMCObjectIx) {
                  rmcObjectIndices.push(child.twRMCObjectIx);
                }
                if (child.twRMTObjectIx) {
                  rmtObjectIndices.push(child.twRMTObjectIx);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      return results;
    }

    const searchPromises = [];

    // Search ALL RMCObject (celestial) scopes
    for (const objectIx of rmcObjectIndices) {
      searchPromises.push(this._searchObjectType('RMCObject', objectIx, searchText));
    }

    // Search ALL RMTObject (terrestrial) scopes
    for (const objectIx of rmtObjectIndices) {
      searchPromises.push(this._searchObjectType('RMTObject', objectIx, searchText));
    }

    const searchResults = await Promise.all(searchPromises);
    const unavailableTypes = new Set();

    for (const result of searchResults) {
      results.matches.push(...result.matches);
      results.paths.push(...result.paths);
      if (result.unavailable) {
        unavailableTypes.add(result.unavailable);
      }
    }

    results.unavailable = [...unavailableTypes];
    return results;
  }

  async _searchObjectType(objectType, objectIx, searchText) {
    const matches = [];
    const paths = [];

    try {
      const actionType = objectType === 'RMCObject'
        ? MV.MVRP.Map.IO_RMCOBJECT.apAction.SEARCH
        : MV.MVRP.Map.IO_RMTOBJECT.apAction.SEARCH;

      const pIAction = this.pClient.Request(actionType);

      if (objectType === 'RMCObject') {
        pIAction.pRequest.twRMCObjectIx = objectIx;
      } else {
        pIAction.pRequest.twRMTObjectIx = objectIx;
      }
      pIAction.pRequest.dX = 0;
      pIAction.pRequest.dY = 0;
      pIAction.pRequest.dZ = 0;
      pIAction.pRequest.sText = searchText.toLowerCase();

      const response = await this._sendAction(pIAction);

      // Server returns nResult: -1 for unimplemented search (e.g., RMTObject)
      if (response.nResult === -1) {
        return { matches, paths, unavailable: objectType };
      }

      if (response.aResultSet && response.aResultSet.length > 0) {
        // aResultSet[0] = direct matches
        if (response.aResultSet[0] && Array.isArray(response.aResultSet[0])) {
          for (const match of response.aResultSet[0]) {
            matches.push({
              id: match.ObjectHead_twObjectIx,
              name: match.Name_wsRMCObjectId || match.Name_wsRMTObjectId,
              type: objectType,
              nodeType: match.Type_bType
            });
          }
        }

        // aResultSet[1] = ancestry paths
        if (response.aResultSet[1] && Array.isArray(response.aResultSet[1])) {
          for (const ancestor of response.aResultSet[1]) {
            paths.push({
              id: ancestor.ObjectHead_twObjectIx,
              name: ancestor.Name_wsRMCObjectId || ancestor.Name_wsRMTObjectId,
              type: objectType,
              nodeType: ancestor.Type_bType,
              ancestorDepth: ancestor.nAncestor
            });
          }
        }
      }
    } catch (err) {
      // Silently fail individual searches
    }

    return { matches, paths };
  }
}
