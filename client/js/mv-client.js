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
 * Uses MVMF notification pattern for push-based data flow.
 * Emits raw MVMF model references — Model layer wraps them in NodeAdapters.
 */
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

  #pendingInserts = new Map();
  #pendingModelOpen = new Map();
  #searchableRMCObjectIndices = [];
  #searchableRMTObjectIndices = [];
  #attachedModels = new Set();

  static _initializePlugins() {
    if (MVClient._initialized) return;

    MV.MVMF.Core.Require('MVRP_Dev,MVRP_Map');

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
      modelReady: [],
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
    for (const model of [...this.#attachedModels]) {
      if (model !== this.#pRMXRoot && model !== this.#m_pLnG && model !== this.#m_pFabric) {
        this._safeDetach(model);
      }
    }

    if (this.#m_pLnG) {
      if (this.#pRMXRoot) {
        this._safeDetach(this.#pRMXRoot);
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
    this.#pendingInserts.clear();
    this.#pendingModelOpen.clear();
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

  // Returns true/false/null (null = indeterminate, collection not populated)
  _isChildOf(parent, child) {
    if (!parent.Child_Enum || !parent.IsReady?.()) return null;

    const cpChild = parent.acpChild?.[child.sID];
    if (!cpChild || cpChild.Length() === 0) {
      return null;
    }

    let found = false;
    parent.Child_Enum(child.sID, this, (c) => {
      if (c.twObjectIx === child.twObjectIx) found = true;
    }, null);
    return found;
  }

  openModel({ sID, twObjectIx, mvmfModel: providedModel }) {
    if (!this.#m_pLnG) {
      this.#pendingModelOpen.set(`${sID}_${twObjectIx}`, {
        child: null,
        parentType: sID,
        parentId: twObjectIx
      });
      return;
    }
    const key = `${sID}_${twObjectIx}`;
    // Use provided model if available, otherwise look up via Model_Open
    const mvmfModel = providedModel || this.#m_pLnG.Model_Open(sID, twObjectIx);

    if (this.#attachedModels.has(mvmfModel)) {
      // Already attached - emit modelReady immediately if ready
      if (mvmfModel.IsReady()) {
        this._emit('modelReady', { mvmfModel });
      }
    } else {
      // New attachment - add to pending BEFORE attaching (onReadyState may fire sync)
      this.#pendingModelOpen.set(key, {
        child: mvmfModel,
        parentType: sID,
        parentId: twObjectIx
      });
      this._safeAttach(mvmfModel);
    }
  }

  subscribe({ sID, twObjectIx }) {
    if (!this.#m_pLnG) return;
    const mvmfModel = this.#m_pLnG.Model_Open(sID, twObjectIx);
    this._safeAttach(mvmfModel);
  }

  closeModel({ sID, twObjectIx }) {
    const key = `${sID}_${twObjectIx}`;
    this.#pendingModelOpen.delete(key);
    if (this.#m_pLnG) {
      const mvmfModel = this.#m_pLnG.Model_Open(sID, twObjectIx);
      this._safeDetach(mvmfModel);
    }
  }

  onReadyState(pNotice) {
    if (!this.IsReady()) {
      if (pNotice.pCreator === this.#m_pFabric) {
        this._handleFabricReadyState();
      } else if (pNotice.pCreator === this.#m_pLnG) {
        this._handleLnGReadyState();
      } else if (pNotice.pCreator === this.#pRMXRoot) {
        this._handleRootModelReadyState(pNotice.pCreator);
      } else if (pNotice.pCreator.IsReady && pNotice.pCreator.IsReady()) {
        this._handleModelReadyState(pNotice.pCreator);
      }
    } else {
      if (pNotice.pCreator.IsReady && pNotice.pCreator.IsReady()) {
        this._handleModelReadyState(pNotice.pCreator);
      }
    }
  }

  _handleFabricReadyState() {
    if (this.#m_pFabric.IsReady()) {
      this._emit('status', 'Connecting to Metaverse server...');

      const msfConfig = this.#m_pFabric.pMSFConfig;
      const mapConfig = msfConfig?.map;

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
    this._safeAttach(this.#pRMXRoot);
  }

  _handleRootModelReadyState(model) {
    if (model.IsReady()) {
      clearTimeout(this._loadTimeout);

      this.#searchableRMCObjectIndices = [];
      this.#searchableRMTObjectIndices = [];
      this._collectSearchableIndices(model);

      this.ReadyState(this.eSTATE.READY);

      this._emit('status', 'Map loaded');
      this._emit('mapData', model);

      if (this._pendingResolve) {
        this._pendingResolve(model);
        this._pendingResolve = null;
        this._pendingReject = null;
      }
    }
  }

  enumerateChildren(model) {
    const children = [];
    if (model.Child_Enum) {
      const enumCallback = (child, arr) => { arr.push(child); };
      model.Child_Enum('RMCObject', this, enumCallback, children);
      model.Child_Enum('RMTObject', this, enumCallback, children);
      model.Child_Enum('RMPObject', this, enumCallback, children);
    }
    return children;
  }

  _collectSearchableIndices(model) {
    if (model.sID === 'RMCObject') {
      this.#searchableRMCObjectIndices.push(model.twObjectIx);
    } else if (model.sID === 'RMTObject') {
      this.#searchableRMTObjectIndices.push(model.twObjectIx);
    } else {
      const children = this.enumerateChildren(model);
      for (const child of children) {
        if (child.sID === 'RMCObject') {
          this.#searchableRMCObjectIndices.push(child.twObjectIx);
        } else if (child.sID === 'RMTObject') {
          this.#searchableRMTObjectIndices.push(child.twObjectIx);
        }
      }
    }
  }

  _handleModelReadyState(model) {
    if (!model.IsReady()) return;

    const key = `${model.sID}_${model.twObjectIx}`;

    const pendingInsert = this.#pendingInserts.get(key);
    if (pendingInsert) {
      this.#pendingInserts.delete(key);
      this._emit('nodeInserted', pendingInsert);
    }

    const pendingOpen = this.#pendingModelOpen.get(key);
    if (pendingOpen) {
      this.#pendingModelOpen.delete(key);
      this._emit('modelReady', { mvmfModel: model });
    }
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
    if (!obj || this.#attachedModels.has(obj)) return;
    this.#attachedModels.add(obj);
    obj.Attach(this);
  }

  _safeDetach(obj) {
    if (!obj || !this.#attachedModels.has(obj)) {
      return false;
    }
    this.#attachedModels.delete(obj);
    obj.Detach(this);
    if (this.#m_pLnG && obj !== this.#m_pLnG && obj !== this.#m_pFabric) {
      this.#m_pLnG.Model_Close(obj);
    }
    return true;
  }

  onInserted(pNotice) {
    const creator = pNotice.pCreator;
    const child = pNotice.pData?.pChild;
    if (this.IsReady() && child) {
      this._emit('nodeInserted', {
        mvmfModel: child,
        parentType: creator.sID,
        parentId: creator.twObjectIx
      });
    }
  }

  onUpdated(pNotice) {
    if (!this.IsReady()) return;
    const creator = pNotice.pCreator;
    const child = pNotice.pData?.pChild || creator;
    if (child?.sID && child.twObjectIx !== undefined) {
      if (!child.IsReady?.()) return;
      this._emit('nodeUpdated', {
        id: child.twObjectIx,
        type: child.sID,
        mvmfModel: child
      });
    }
  }

  onChanged(pNotice) {
    const creator = pNotice.pCreator;
    const child = pNotice.pData?.pChild;
    const pChange = pNotice.pData?.pChange;
    if (!creator.IsReady?.()) {
      return;
    }

    if (child?.sID && child.twObjectIx !== undefined) {
      // RMPOBJECT_OPEN is authoritative: child is being added to this parent.
      // _isChildOf enum lags behind the notification, so bypass it.
      if (pChange?.sType === 'RMPOBJECT_OPEN') {
        this._emit('nodeInserted', {
          mvmfModel: child,
          parentType: creator.sID,
          parentId: creator.twObjectIx
        });
        return;
      }

      const present = this._isChildOf(creator, child);
      if (present === false) {
        this._emit('nodeDeleted', {
          id: child.twObjectIx,
          type: child.sID,
          sourceParentType: creator.sID,
          sourceParentId: creator.twObjectIx
        });
      } else if (present === true) {
        this._emit('nodeInserted', {
          mvmfModel: child,
          parentType: creator.sID,
          parentId: creator.twObjectIx
        });
      } else {
        const model = this.#m_pLnG.Model_Open(creator.sID, creator.twObjectIx);
        this._safeAttach(model);
      }
      return;
    }

    this.onUpdated(pNotice);
  }

  onDeleting(pNotice) {
    const creator = pNotice.pCreator;
    const child = pNotice.pData?.pChild;
    if (!creator.IsReady?.()) {
      return;
    }
    if (this.IsReady() && child) {
      this._emit('nodeDeleted', {
        id: child.twObjectIx,
        type: child.sID,
        sourceParentType: creator.sID,
        sourceParentId: creator.twObjectIx
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

      // Only search models that are already ready - never attach during search
      if (!model.IsReady()) {
        return { matches, paths, unavailable: objectType };
      }

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
          for (let i = 0; i < response.aResultSet[0].length; i++) {
            const match = response.aResultSet[0][i];
            matches.push({
              id: match.ObjectHead_twObjectIx,
              name: match.Name_wsRMCObjectId || match.Name_wsRMTObjectId,
              type: objectType,
              nodeType: match.Type_bType,
              parentType: this._getClassID(match.ObjectHead_wClass_Parent),
              parentId: match.ObjectHead_twParentIx,
              matchOrder: i,
              rootId: objectIx
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
              parentType: this._getClassID(ancestor.ObjectHead_wClass_Parent),
              parentId: ancestor.ObjectHead_twParentIx,
              ancestorDepth: ancestor.nAncestor,
              matchOrder: ancestor.nOrder,
              rootId: objectIx
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
