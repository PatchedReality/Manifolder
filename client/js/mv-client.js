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
 * Uses MVMF notification pattern for push-based data flow
 */
import { NodeFactory } from './node-factory.js';
import { setResourceBaseUrl } from './node-helpers.js';

export class MVClient extends MV.MVMF.NOTIFICATION {
  static _initialized = false;

  static eSTATE = {
    NOTREADY: 0,
    LOADING: 1,
    READY: 4
  };

  eSTATE = MVClient.eSTATE;

  #m_pFabric;
  #m_pLnG;
  #pRMXRoot;
  #sceneWClass;
  #sceneObjectIx;

  #pendingModelLoads = new Map();
  #searchableRMCObjectIndices = [];
  #searchableRMTObjectIndices = [];
  #attachedModels = new Set();

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
    super();
    MVClient._initializePlugins();

    this.#m_pFabric = null;
    this.#m_pLnG = null;
    this.#pRMXRoot = null;
    this.#sceneWClass = null;
    this.#sceneObjectIx = null;

    this._pendingResolve = null;
    this._pendingReject = null;
    this._loadTimeout = null;

    this.callbacks = {
      connected: [],
      disconnected: [],
      error: [],
      mapData: [],
      nodeData: [],
      nodeInserted: [],
      nodeUpdated: [],
      nodeDeleted: [],
      status: []
    };
  }

  IsReady() {
    return this.ReadyState() === this.eSTATE.READY;
  }

  get connected() {
    return this.IsReady();
  }

  destructor() {
    // Detach from all models we attached to (child models from getNode)
    for (const model of this.#attachedModels) {
      if (model !== this.#pRMXRoot && model !== this.#m_pLnG && model !== this.#m_pFabric) {
        try { model.Detach(this); } catch (e) { /* already detached */ }
      }
    }

    if (this.#m_pLnG) {
      if (this.#pRMXRoot) {
        this._safeDetach(this.#pRMXRoot);
        this.#m_pLnG.Model_Close(this.#pRMXRoot);
        this.#pRMXRoot = null;
      }

      this._safeDetach(this.#m_pLnG);
      this.#m_pLnG = null;
    }

    if (this.#m_pFabric) {
      this._safeDetach(this.#m_pFabric);
      this.#m_pFabric.destructor();
      this.#m_pFabric = null;
    }

    this.#searchableRMCObjectIndices = [];
    this.#searchableRMTObjectIndices = [];
    this.#pendingModelLoads.clear();
    this.#attachedModels.clear();

    this.ReadyState(this.eSTATE.NOTREADY);
  }

  disconnect() {
    this.destructor();
    this._emit('disconnected');
  }

  connect() {
    return Promise.resolve();
  }

  async loadMap(url) {
    if (!url) {
      throw new Error('Missing MSF URL');
    }

    try {
      this._emit('status', 'Loading map config...');

      if (this.IsReady() || this.#m_pFabric) {
        this.destructor();
      }

      return new Promise((resolve, reject) => {
        this._pendingResolve = resolve;
        this._pendingReject = reject;

        this._loadTimeout = setTimeout(() => {
          this._pendingResolve = null;
          this._pendingReject = null;
          reject(new Error('Connection timeout - server unreachable'));
        }, 30000);

        this.#m_pFabric = new MV.MVRP.MSF(url, MV.MVRP.MSF.eMETHOD.GET);
        this._safeAttach(this.#m_pFabric);
      });

    } catch (err) {
      this._emit('error', err);
      throw err;
    }
  }

  onReadyState(pNotice) {
    console.log('[MVClient] onReadyState', pNotice.pCreator?.constructor?.name, pNotice.pCreator);

    if (!this.IsReady()) {
      if (pNotice.pCreator === this.#m_pFabric) {
        console.log('[MVClient] → Fabric ready state');
        this._handleFabricReadyState();
      } else if (pNotice.pCreator === this.#m_pLnG) {
        console.log('[MVClient] → LnG ready state');
        this._handleLnGReadyState();
      } else if (pNotice.pCreator === this.#pRMXRoot) {
        console.log('[MVClient] → Root model ready state');
        this._handleRootModelReadyState(pNotice.pCreator);
      } else if (pNotice.pCreator.IsReady && pNotice.pCreator.IsReady()) {
        console.log('[MVClient] → Other model ready state');
        this._handleModelReadyState(pNotice.pCreator);
      }
    } else {
      if (pNotice.pCreator.IsReady && pNotice.pCreator.IsReady()) {
        this._handleModelReadyState(pNotice.pCreator);
      }
    }
  }

  _handleFabricReadyState() {
    console.log('[MVClient] Fabric ReadyState:', this.#m_pFabric.ReadyState(), 'IsReady:', this.#m_pFabric.IsReady());

    if (this.#m_pFabric.IsReady()) {
      this._emit('status', 'Connecting to Metaverse server...');

      const msfConfig = this.#m_pFabric.pMSFConfig;
      console.log('[MVClient] MSF Config:', msfConfig);
      const mapConfig = msfConfig?.map;
      console.log('[MVClient] Map Config:', mapConfig);

      this.#sceneWClass = mapConfig?.wClass;
      this.#sceneObjectIx = mapConfig?.twObjectIx;

      const rootUrl = mapConfig?.sRootUrl || mapConfig?.RootUrl || '';
      setResourceBaseUrl(rootUrl);

      this.#m_pLnG = this.#m_pFabric.GetLnG('map');

      if (!this.#m_pLnG) {
        clearTimeout(this._loadTimeout);
        const err = new Error('No map service available in MSF config');
        this._emit('error', err);
        if (this._pendingReject) {
          this._pendingReject(err);
          this._pendingResolve = null;
          this._pendingReject = null;
        }
        return;
      }

      this._safeAttach(this.#m_pLnG);
    } else if (this.#m_pFabric.ReadyState() === MV.MVRP.MSF.eSTATE.FAILED) {
      clearTimeout(this._loadTimeout);
      const err = new Error(this.#m_pFabric.XHRError || 'Failed to load MSF config');
      this._emit('error', err);
      if (this._pendingReject) {
        this._pendingReject(err);
        this._pendingResolve = null;
        this._pendingReject = null;
      }
    }
  }

  _handleLnGReadyState() {
    const state = this.#m_pLnG.ReadyState();
    console.log('[MVClient] LnG ReadyState:', state, 'eSTATE:', this.#m_pLnG.eSTATE);

    switch (state) {
      case this.#m_pLnG.eSTATE.DISCONNECTED:
        this._emit('status', 'Disconnected from server');
        this._emit('disconnected');
        break;

      case this.#m_pLnG.eSTATE.CONNECTING:
        this._emit('status', 'Connecting to server...');
        break;

      case this.#m_pLnG.eSTATE.LOGGING:
        this._emit('status', 'Authenticating...');
        break;

      case this.#m_pLnG.eSTATE.LOGGEDIN:
      case this.#m_pLnG.eSTATE.LOGGEDOUT:
        this._emit('status', 'Connected, loading map...');
        this._emit('connected');
        this._startRootModel();
        break;
    }
  }

  _startRootModel() {
    const classId = this._getClassID(this.#sceneWClass);
    console.log('[MVClient] _startRootModel wClass:', this.#sceneWClass, '→ classId:', classId, 'objectIx:', this.#sceneObjectIx);

    if (!classId) {
      clearTimeout(this._loadTimeout);
      const err = new Error(`Unknown wClass: ${this.#sceneWClass}`);
      this._emit('error', err);
      if (this._pendingReject) {
        this._pendingReject(err);
        this._pendingResolve = null;
        this._pendingReject = null;
      }
      return;
    }

    this.#pRMXRoot = this.#m_pLnG.Model_Open(classId, this.#sceneObjectIx);
    console.log('[MVClient] Model_Open returned:', this.#pRMXRoot);
    this._safeAttach(this.#pRMXRoot);
  }

  _handleRootModelReadyState(model) {
    const state = model.ReadyState();
    const RECOVERED = model.eSTATE?.RECOVERED ?? 3;

    console.log('[MVClient] Root model state:', state, 'RECOVERED:', RECOVERED);

    if (state >= RECOVERED) {
      clearTimeout(this._loadTimeout);

      console.log('[MVClient] Root model ready, building tree from:', model);
      console.log('[MVClient] Model properties:', Object.keys(model));

      const tree = this._buildNodeFromModel(model);
      console.log('[MVClient] Built tree:', tree);

      this.#searchableRMCObjectIndices = [];
      this.#searchableRMTObjectIndices = [];
      this._collectSearchableIndicesFromTree(tree);

      this.ReadyState(this.eSTATE.READY);

      this._emit('status', 'Map loaded');
      this._emit('mapData', tree);

      if (this._pendingResolve) {
        this._pendingResolve(tree);
        this._pendingResolve = null;
        this._pendingReject = null;
      }
    }
  }

  _collectSearchableIndicesFromTree(tree) {
    if (tree.type === 'RMCObject') {
      this.#searchableRMCObjectIndices.push(tree.id);
    } else if (tree.type === 'RMTObject') {
      this.#searchableRMTObjectIndices.push(tree.id);
    } else if (tree.children) {
      for (const child of tree.children) {
        if (child.type === 'RMCObject') {
          this.#searchableRMCObjectIndices.push(child.id);
        } else if (child.type === 'RMTObject') {
          this.#searchableRMTObjectIndices.push(child.id);
        }
      }
    }
  }

  _handleModelReadyState(model) {
    const RECOVERED = model.eSTATE?.RECOVERED ?? 3;
    if (model.ReadyState() < RECOVERED) return;

    const key = `${model.sID}_${model.twObjectIx}`;
    const pending = this.#pendingModelLoads.get(key);

    if (pending) {
      this.#pendingModelLoads.delete(key);
      const node = this._buildNodeFromModel(model);
      pending.resolve(node);
    }
  }

  _buildNodeFromModel(model) {
    const type = model.sID;
    const id = model.twObjectIx;

    const data = this._extractModelData(model);
    return NodeFactory.createNode(type, data, id);
  }

  _buildNodeShallow(model) {
    const type = model.sID;
    const id = model.twObjectIx;

    const data = this._extractModelData(model, true);
    return NodeFactory.createNode(type, data, id);
  }

  _extractModelData(model, skipChildren = false) {
    const data = {
      Parent: {}
    };

    const parent = data.Parent;

    if (model.sID === 'RMRoot') {
      parent.twRMRootIx = model.twRMRootIx || model.twObjectIx;
      parent.pName = model.pName || { wsRMRootId: 'Root' };
      parent.nChildren = model.nChildren;
    } else if (model.sID === 'RMCObject') {
      parent.twRMCObjectIx = model.twRMCObjectIx || model.twObjectIx;
      parent.pName = model.pName;
      parent.bType = model.pType?.bType;
      parent.sClass = model.pType?.sClass;
      parent.pTransform = this._extractTransform(model);
      parent.pBound = this._extractBound(model);
      parent.pOrbit_Spin = model.pOrbit_Spin;
      parent.pResource = model.pResource;
      parent.nChildren = model.nChildren;
    } else if (model.sID === 'RMTObject') {
      parent.twRMTObjectIx = model.twRMTObjectIx || model.twObjectIx;
      parent.pName = model.pName;
      parent.bType = model.pType?.bType;
      parent.sClass = model.pType?.sClass;
      parent.pTransform = this._extractTransform(model);
      parent.pBound = this._extractBound(model);
      parent.pResource = model.pResource;
      parent.nChildren = model.nChildren;
    } else if (model.sID === 'RMPObject') {
      parent.twRMPObjectIx = model.twRMPObjectIx || model.twObjectIx;
      parent.pName = model.pName;
      parent.bType = model.pType?.bType;
      parent.sClass = model.pType?.sClass;
      parent.pTransform = this._extractTransform(model);
      parent.pBound = this._extractBound(model);
      parent.pResource = model.pResource;
      parent.sAssetUrl = model.sAssetUrl;
      parent.nChildren = model.nChildren;
    }

    data.aChild = skipChildren ? [[], [], []] : this._extractChildren(model);

    return data;
  }

  _extractTransform(model) {
    if (!model.pTransform) return null;

    const t = model.pTransform;
    return {
      Position: this._toArray3(t.vPosition),
      Rotation: this._toArray4(t.qRotation),
      Scale: this._toArray3(t.vScale)
    };
  }

  _extractBound(model) {
    if (!model.pBound) return null;

    const b = model.pBound;
    return {
      Max: [b.dX || 0, b.dY || 0, b.dZ || 0]
    };
  }

  _toArray3(v) {
    if (!v) return [0, 0, 0];
    if (Array.isArray(v)) return v;
    return [v.dX ?? v.x ?? 0, v.dY ?? v.y ?? 0, v.dZ ?? v.z ?? 0];
  }

  _toArray4(v) {
    if (!v) return [0, 0, 0, 1];
    if (Array.isArray(v)) return v;
    return [v.dX ?? v.x ?? 0, v.dY ?? v.y ?? 0, v.dZ ?? v.z ?? 0, v.dW ?? v.w ?? 1];
  }

  _extractChildren(model) {
    const aChild = [[], [], []];

    console.log('[MVClient] _extractChildren from model:', model.sID, 'nChildren:', model.nChildren);

    if (model.Child_Enum) {
      const children = [];

      const enumCallback = (child, arr) => {
        arr.push(child);
      };

      model.Child_Enum('RMCObject', this, enumCallback, children);
      model.Child_Enum('RMTObject', this, enumCallback, children);
      model.Child_Enum('RMPObject', this, enumCallback, children);

      console.log('[MVClient] Enumerated children:', children.length);

      for (const child of children) {
        const childData = this._extractChildData(child);
        if (childData) {
          if (childData.twRMCObjectIx !== undefined) {
            aChild[0].push(childData);
          } else if (childData.twRMTObjectIx !== undefined) {
            aChild[1].push(childData);
          } else if (childData.twRMPObjectIx !== undefined) {
            aChild[2].push(childData);
          }
        }
      }
    }

    console.log('[MVClient] aChild result:', aChild);
    return aChild;
  }

  _extractChildData(child) {
    const data = {};

    if (child.sID === 'RMCObject') {
      data.twRMCObjectIx = child.twRMCObjectIx || child.twObjectIx;
      data.pName = child.pName;
      data.bType = child.pType?.bType;
      data.sClass = child.pType?.sClass;
      data.pTransform = this._extractTransform(child);
      data.pBound = this._extractBound(child);
      data.pOrbit_Spin = child.pOrbit_Spin;
      data.pResource = child.pResource;
      data.nChildren = child.nChildren;
    } else if (child.sID === 'RMTObject') {
      data.twRMTObjectIx = child.twRMTObjectIx || child.twObjectIx;
      data.pName = child.pName;
      data.bType = child.pType?.bType;
      data.sClass = child.pType?.sClass;
      data.pTransform = this._extractTransform(child);
      data.pBound = this._extractBound(child);
      data.pResource = child.pResource;
      data.nChildren = child.nChildren;
    } else if (child.sID === 'RMPObject') {
      data.twRMPObjectIx = child.twRMPObjectIx || child.twObjectIx;
      data.pName = child.pName;
      data.bType = child.pType?.bType;
      data.sClass = child.pType?.sClass;
      data.pTransform = this._extractTransform(child);
      data.pBound = this._extractBound(child);
      data.pResource = child.pResource;
      data.sAssetUrl = child.sAssetUrl;
      data.nChildren = child.nChildren;
    }

    return Object.keys(data).length > 0 ? data : null;
  }

  _getClassID(wClass) {
    const classIds = {
      70: 'RMRoot',
      71: 'RMCObject',
      72: 'RMTObject',
      73: 'RMPObject'
    };
    return classIds[wClass];
  }

  _safeAttach(obj) {
    if (!obj || this.#attachedModels.has(obj)) {
      return false;
    }
    this.#attachedModels.add(obj);
    obj.Attach(this);
    return true;
  }

  _safeDetach(obj) {
    if (!obj || !this.#attachedModels.has(obj)) {
      return false;
    }
    this.#attachedModels.delete(obj);
    obj.Detach(this);
    return true;
  }

  async getNode(id, nodeType) {
    if (id === undefined || !nodeType) {
      throw new Error('Missing node id or type');
    }

    if (!this.#m_pLnG) {
      throw new Error('Not connected to MV server');
    }

    try {
      const key = `${nodeType}_${id}`;

      const existingPending = this.#pendingModelLoads.get(key);
      if (existingPending) {
        return existingPending.promise;
      }

      const model = this.#m_pLnG.Model_Open(nodeType, id);
      const RECOVERED = model.eSTATE?.RECOVERED ?? 3;
      console.log('[MVClient] getNode Model_Open returned:', model, 'ReadyState:', model.ReadyState?.(), 'RECOVERED:', RECOVERED);

      if (model.ReadyState() >= RECOVERED) {
        const node = this._buildNodeFromModel(model);
        this._emit('nodeData', node);
        return node;
      }

      const pendingPromise = new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          this.#pendingModelLoads.delete(key);
          reject(new Error(`Timeout loading node ${nodeType}/${id}`));
        }, 30000);

        this.#pendingModelLoads.set(key, {
          resolve: (node) => {
            clearTimeout(timeoutId);
            this._emit('nodeData', node);
            resolve(node);
          },
          reject: (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          model: model
        });
      });

      this.#pendingModelLoads.get(key).promise = pendingPromise;
      this._safeAttach(model);

      return pendingPromise;

    } catch (err) {
      this._emit('error', err);
      throw err;
    }
  }

  onInserted(pNotice) {
    if (this.IsReady() && pNotice.pData?.pChild) {
      const child = pNotice.pData.pChild;
      const node = this._buildNodeFromModel(child);
      this._emit('nodeInserted', { node, parentModel: pNotice.pCreator });
    }
  }

  onUpdated(pNotice) {
    if (this.IsReady() && pNotice.pData?.pChild) {
      const child = pNotice.pData.pChild;
      const node = this._buildNodeShallow(child);
      this._emit('nodeUpdated', node);
    }
  }

  onChanged(pNotice) {
    this.onUpdated(pNotice);
  }

  onDeleting(pNotice) {
    if (this.IsReady() && pNotice.pData?.pChild) {
      const child = pNotice.pData.pChild;
      this._emit('nodeDeleted', {
        id: child.twObjectIx,
        type: child.sID
      });
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

  async searchNodes(searchText) {
    if (!this.IsReady() || !searchText) {
      return { matches: [], paths: [], unavailable: [] };
    }

    const results = { matches: [], paths: [], unavailable: [] };
    const rmcObjectIndices = [];
    const rmtObjectIndices = [];

    this._collectSearchIndicesFromSceneRoot(rmcObjectIndices, rmtObjectIndices);

    if (rmcObjectIndices.length === 0 && rmtObjectIndices.length === 0) {
      return results;
    }

    const searchPromises = [];

    for (const objectIx of rmcObjectIndices) {
      searchPromises.push(this._searchObjectType('RMCObject', objectIx, searchText));
    }

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
      const model = this.#m_pLnG.Model_Open(objectType, objectIx);

      await new Promise((resolve) => {
        if (model.IsReady()) {
          resolve();
        } else {
          const checkReady = () => {
            if (model.IsReady()) resolve();
            else setTimeout(checkReady, 50);
          };
          this._safeAttach(model);
          setTimeout(checkReady, 50);
        }
      });

      const pIAction = model.Request('SEARCH');
      if (!pIAction) {
        return { matches, paths, unavailable: objectType };
      }

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

      if (response.nResult === -1) {
        return { matches, paths, unavailable: objectType };
      }

      if (response.aResultSet && response.aResultSet.length > 0) {
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
    } catch {
      // Silently fail individual searches
    }

    return { matches, paths };
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

  _collectSearchIndicesFromSceneRoot(rmcObjectIndices, rmtObjectIndices) {
    rmcObjectIndices.push(...this.#searchableRMCObjectIndices);
    rmtObjectIndices.push(...this.#searchableRMTObjectIndices);
  }
}
