// Unified Manifolder client for both browser and Node runtimes.
// Assumes globalThis.MV is initialized by host project bootstrap code.
/** @typedef {import('../types.js').BulkOperation} BulkOperation */
/** @typedef {import('../types.js').ConnectionStatus} ConnectionStatus */
/** @typedef {import('../types.js').CreateObjectParams} CreateObjectParams */
/** @typedef {import('../types.js').FabricObject} FabricObject */
/** @typedef {import('../types.js').ObjectFilter} ObjectFilter */
/** @typedef {import('../types.js').Scene} Scene */
/** @typedef {import('../types.js').SearchQuery} SearchQuery */
/** @typedef {import('../types.js').UpdateObjectParams} UpdateObjectParams */
/**
 * @typedef {object} ConnectOptions
 * @property {string} [adminKey]
 * @property {number} [timeoutMs]
 */
/** @typedef {'connected' | 'disconnected' | 'error' | 'status' | 'mapData' | 'nodeInserted' | 'nodeUpdated' | 'nodeDeleted' | 'modelReady'} ClientEvent */
/** @typedef {(data: any) => void} ClientEventHandler */
/** @typedef {{ sID: string; twObjectIx: number }} ModelRef */
/** @typedef {{ matches: any[]; paths: any[]; unavailable: string[] }} SearchNodesResult */
function debugLog(_msg) { }
const ClassIds = {
    RMRoot: 70,
    RMCObject: 71,
    RMTObject: 72,
    RMPObject: 73,
};
const ClassPrefixes = {
    root: 70,
    celestial: 71,
    terrestrial: 72,
    physical: 73,
};
const ClassIdToPrefix = {
    70: 'root',
    71: 'celestial',
    72: 'terrestrial',
    73: 'physical',
};
function parseObjectRef(ref) {
    if (ref === 'root') {
        return { classId: ClassIds.RMRoot, numericId: 1 };
    }
    const colonIndex = ref.indexOf(':');
    if (colonIndex === -1) {
        throw new Error(`Invalid object reference "${ref}". Expected format: "class:id" or "root".`);
    }
    const prefix = ref.substring(0, colonIndex);
    const classId = ClassPrefixes[prefix];
    if (classId === undefined) {
        throw new Error(`Unknown class prefix "${prefix}" in reference "${ref}".`);
    }
    const numericId = Number.parseInt(ref.substring(colonIndex + 1), 10);
    if (Number.isNaN(numericId)) {
        throw new Error(`Invalid numeric ID in reference "${ref}".`);
    }
    return { classId, numericId };
}
function formatObjectRef(classId, numericId) {
    const prefix = ClassIdToPrefix[classId];
    if (!prefix) {
        throw new Error(`Unknown class ID ${classId}`);
    }
    if (classId === ClassIds.RMRoot) {
        return 'root';
    }
    return `${prefix}:${numericId}`;
}
const ObjectTypeMap = {
    'celestial:universe': { classId: 71, subtype: 1 },
    'celestial:supercluster': { classId: 71, subtype: 2 },
    'celestial:galaxy_cluster': { classId: 71, subtype: 3 },
    'celestial:galaxy': { classId: 71, subtype: 4 },
    'celestial:black_hole': { classId: 71, subtype: 5 },
    'celestial:nebula': { classId: 71, subtype: 6 },
    'celestial:star_cluster': { classId: 71, subtype: 7 },
    'celestial:constellation': { classId: 71, subtype: 8 },
    'celestial:star_system': { classId: 71, subtype: 9 },
    'celestial:star': { classId: 71, subtype: 10 },
    'celestial:planet_system': { classId: 71, subtype: 11 },
    'celestial:planet': { classId: 71, subtype: 12 },
    'celestial:moon': { classId: 71, subtype: 13 },
    'celestial:debris': { classId: 71, subtype: 14 },
    'celestial:satellite': { classId: 71, subtype: 15 },
    'celestial:transport': { classId: 71, subtype: 16 },
    'celestial:surface': { classId: 71, subtype: 17 },
    'terrestrial:root': { classId: 72, subtype: 1 },
    'terrestrial:water': { classId: 72, subtype: 2 },
    'terrestrial:land': { classId: 72, subtype: 3 },
    'terrestrial:country': { classId: 72, subtype: 4 },
    'terrestrial:territory': { classId: 72, subtype: 5 },
    'terrestrial:state': { classId: 72, subtype: 6 },
    'terrestrial:county': { classId: 72, subtype: 7 },
    'terrestrial:city': { classId: 72, subtype: 8 },
    'terrestrial:community': { classId: 72, subtype: 9 },
    'terrestrial:sector': { classId: 72, subtype: 10 },
    'terrestrial:parcel': { classId: 72, subtype: 11 },
    physical: { classId: 73, subtype: 0 },
    'physical:transport': { classId: 73, subtype: 1 },
};
// Class-aware action lookups
const CLASS_ID_TO_OPEN_ACTION = {
    [ClassIds.RMCObject]: { action: 'RMCOBJECT_OPEN', nameField: 'wsRMCObjectId', resultField: 'twRMCObjectIx' },
    [ClassIds.RMTObject]: { action: 'RMTOBJECT_OPEN', nameField: 'wsRMTObjectId', resultField: 'twRMTObjectIx' },
    [ClassIds.RMPObject]: { action: 'RMPOBJECT_OPEN', nameField: 'wsRMPObjectId', resultField: 'twRMPObjectIx' },
};
const CLASS_ID_TO_CLOSE_ACTION = {
    [ClassIds.RMCObject]: { action: 'RMCOBJECT_CLOSE', idField: 'twRMCObjectIx_Close' },
    [ClassIds.RMTObject]: { action: 'RMTOBJECT_CLOSE', idField: 'twRMTObjectIx_Close' },
    [ClassIds.RMPObject]: { action: 'RMPOBJECT_CLOSE', idField: 'twRMPObjectIx_Close' },
};
const CLASS_ID_TO_NAME_FIELD = {
    [ClassIds.RMCObject]: 'wsRMCObjectId',
    [ClassIds.RMTObject]: 'wsRMTObjectId',
    [ClassIds.RMPObject]: 'wsRMPObjectId',
};
const BASELINE_REQUIRE_LIST = 'MVRP_Dev,MVRP_Map';
export class ManifolderClient extends MV.MVMF.NOTIFICATION {
    static eSTATE = {
        NOTREADY: 0,
        LOADING: 1,
        READY: 4,
    };
    pFabric = null;
    pLnG = null;
    pRMRoot = null;
    connected = false;
    loggedIn = false;
    fabricUrl = null;
    currentSceneId = null;
    adminKey = null;
    loginAttempted = false;
    // Cache keyed by prefixed ID (e.g., "physical:42", "terrestrial:3")
    objectCache = new Map();
    pendingReady = new Map();
    attachedObjects = new Set();
    connectResolve = null;
    connectReject = null;
    connectionGeneration = 0;
    sceneWClass = null;
    sceneObjectIx = null;
    callbacks = {
        connected: [],
        disconnected: [],
        error: [],
        status: [],
        mapData: [],
        nodeInserted: [],
        nodeUpdated: [],
        nodeDeleted: [],
        modelReady: [],
    };
    searchableRMCObjectIndices = [];
    searchableRMTObjectIndices = [];
    rootReadyEmitted = false;
    pendingMutationWaits = new Set();
    recentMutationEvents = [];
    mutationConfirmTimeoutMs = 5000;
    isDisconnecting = false;
    bootstrapRequireHandle = null;
    IsReady() {
        return this.ReadyState?.() === ManifolderClient.eSTATE.READY;
    }
    _acquireBootstrapRequirements() {
        if (this.bootstrapRequireHandle) {
            return;
        }
        const core = MV?.MVMF?.Core;
        if (!core?.Require || !core?.Release) {
            throw new Error('MVMF core Require/Release APIs are unavailable');
        }
        const requireHandle = core.Require(BASELINE_REQUIRE_LIST);
        if (!requireHandle) {
            throw new Error(`Failed to require baseline plugins: ${BASELINE_REQUIRE_LIST}`);
        }
        this.bootstrapRequireHandle = requireHandle;
    }
    _releaseBootstrapRequirements() {
        if (!this.bootstrapRequireHandle) {
            return;
        }
        const core = MV?.MVMF?.Core;
        if (core?.Release) {
            try {
                core.Release(this.bootstrapRequireHandle);
            }
            catch {
                // Ignore release errors during teardown.
            }
        }
        this.bootstrapRequireHandle = null;
    }
    getObjectName(pObject) {
        return pObject.pName?.wsRMPObjectId
            || pObject.pName?.wsRMTObjectId
            || pObject.pName?.wsRMCObjectId
            || `Object ${pObject.twObjectIx}`;
    }
    getObjectKey(pObject) {
        return `${pObject.wClass_Object || pObject.sID || 'unknown'}:${pObject.twObjectIx || 0}`;
    }
    getPrefixedId(pObject) {
        return formatObjectRef(pObject.wClass_Object, pObject.twObjectIx);
    }
    _isChildOf(parent, child) {
        if (!parent?.Child_Enum || !parent.IsReady?.()) {
            return null;
        }
        const cpChild = parent.acpChild?.[child.sID];
        if (!cpChild || cpChild.Length() === 0) {
            return null;
        }
        let found = false;
        parent.Child_Enum(child.sID, this, (c) => {
            if (c.twObjectIx === child.twObjectIx) {
                found = true;
            }
        }, null);
        return found;
    }
    _pruneMutationEvents() {
        const cutoff = Date.now() - 60000;
        while (this.recentMutationEvents.length > 0 && this.recentMutationEvents[0].timestamp < cutoff) {
            this.recentMutationEvents.shift();
        }
    }
    _recordMutationEvent(event) {
        const stampedEvent = {
            ...event,
            timestamp: Date.now(),
        };
        this.recentMutationEvents.push(stampedEvent);
        this._pruneMutationEvents();
        for (const wait of Array.from(this.pendingMutationWaits)) {
            if (stampedEvent.timestamp < (wait.minTimestamp ?? 0)) {
                continue;
            }
            let matched = false;
            try {
                matched = wait.matchFn(stampedEvent);
            }
            catch {
                matched = false;
            }
            if (matched) {
                clearTimeout(wait.timeoutId);
                this.pendingMutationWaits.delete(wait);
                wait.resolve(stampedEvent);
            }
        }
    }
    _createMutationWait(matchFn, description, timeoutMs = this.mutationConfirmTimeoutMs, minTimestamp = 0) {
        const findRecentMatch = () => {
            for (let i = this.recentMutationEvents.length - 1; i >= 0; i -= 1) {
                const event = this.recentMutationEvents[i];
                if (event.timestamp < minTimestamp) {
                    continue;
                }
                let matched = false;
                try {
                    matched = matchFn(event);
                }
                catch {
                    matched = false;
                }
                if (matched) {
                    return event;
                }
            }
            return null;
        };
        this._pruneMutationEvents();
        const immediateMatch = findRecentMatch();
        if (immediateMatch) {
            return {
                promise: Promise.resolve(immediateMatch),
                cancel: () => { },
            };
        }
        let wait;
        const promise = new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (wait) {
                    this.pendingMutationWaits.delete(wait);
                }
                reject(new Error(`Timeout waiting for mutation notification: ${description}`));
            }, timeoutMs);
            wait = { matchFn, resolve, reject, timeoutId, minTimestamp };
            this.pendingMutationWaits.add(wait);
            // Re-check after registration to avoid edge-case race windows.
            const lateMatch = findRecentMatch();
            if (lateMatch) {
                clearTimeout(wait.timeoutId);
                this.pendingMutationWaits.delete(wait);
                resolve(lateMatch);
            }
        });
        const cancel = () => {
            if (wait && this.pendingMutationWaits.has(wait)) {
                clearTimeout(wait.timeoutId);
                this.pendingMutationWaits.delete(wait);
            }
        };
        return { promise, cancel };
    }
    async _confirmMutation(matchFn, description, timeoutMs = this.mutationConfirmTimeoutMs, minTimestamp = 0) {
        const wait = this._createMutationWait(matchFn, description, timeoutMs, minTimestamp);
        try {
            await wait.promise;
        }
        finally {
            wait.cancel();
        }
    }
    waitForReady(pObject, timeoutMs = 30000) {
        if (pObject.IsReady()) {
            return Promise.resolve();
        }
        if (pObject.ReadyState?.() === pObject.eSTATE?.ERROR) {
            return Promise.reject(new Error('Object in error state'));
        }
        const key = this.getObjectKey(pObject);
        debugLog(`[waitForReady] registering key=${key} sID=${pObject.sID} wClass=${pObject.wClass_Object} twObj=${pObject.twObjectIx}`);
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.pendingReady.delete(key);
                debugLog(`[waitForReady] TIMEOUT key=${key}`);
                reject(new Error(`Timeout waiting for object to be ready (key: ${key}, state: ${pObject.ReadyState?.()})`));
            }, timeoutMs);
            this.pendingReady.set(key, {
                resolve: () => { clearTimeout(timeoutId); resolve(); },
                reject: (err) => { clearTimeout(timeoutId); reject(err); }
            });
        });
    }
    onReadyState(pNotice) {
        try {
            if (this.isDisconnecting) {
                return;
            }
            this.handleReadyState(pNotice);
            const pObject = pNotice.pCreator;
            if (!pObject)
                return;
            const key = this.getObjectKey(pObject);
            const isReady = pObject.IsReady?.();
            const state = pObject.ReadyState?.();
            debugLog(`[onReadyState] key=${key} isReady=${isReady} state=${state} sID=${pObject.sID} wClass=${pObject.wClass_Object} twObj=${pObject.twObjectIx} pendingKeys=[${[...this.pendingReady.keys()].join(',')}]`);
            const pending = this.pendingReady.get(key);
            if (pending) {
                if (isReady) {
                    this.pendingReady.delete(key);
                    pending.resolve();
                }
                else if (state === pObject.eSTATE?.ERROR) {
                    this.pendingReady.delete(key);
                    pending.reject(new Error('Object failed to load'));
                }
            }
            if (isReady && this.attachedObjects.has(pObject)) {
                this._emit('modelReady', { mvmfModel: pObject });
                if (pObject === this.pRMRoot && !this.rootReadyEmitted) {
                    this.rootReadyEmitted = true;
                    this.ReadyState?.(ManifolderClient.eSTATE.READY);
                    this._collectSearchableIndices(pObject);
                    this._emit('status', 'Map loaded');
                    this._emit('mapData', pObject);
                }
            }
        }
        catch (err) {
            debugLog(`[onReadyState] ERROR: ${err.message}`);
            this._emit('error', err);
        }
    }
    onInserted(pNotice) {
        try {
            if (this.isDisconnecting) {
                return;
            }
            const pChild = pNotice.pData?.pChild;
            const pParent = pNotice.pCreator;
            debugLog(`[onInserted] parent=${pParent?.twObjectIx} parentClass=${pParent?.wClass_Object} child=${pChild?.twObjectIx} childClass=${pChild?.wClass_Object} childName=${pChild?.pName?.wsRMPObjectId || pChild?.pName?.wsRMTObjectId || pChild?.pName?.wsRMCObjectId}`);
            if (pChild?.twObjectIx && pChild?.wClass_Object) {
                const prefixedId = this.getPrefixedId(pChild);
                this.objectCache.set(prefixedId, pChild);
                const parentClassId = pChild?.wClass_Parent ?? pParent?.wClass_Object;
                const parentObjectId = pChild?.twParentIx ?? pParent?.twObjectIx;
                this._recordMutationEvent({
                    kind: 'inserted',
                    childClassId: pChild.wClass_Object,
                    childObjectId: pChild.twObjectIx,
                    parentClassId,
                    parentObjectId,
                    name: this.getObjectName(pChild),
                    mvmfModel: pChild,
                });
            }
            if (this.connected && pChild) {
                this._emit('nodeInserted', {
                    mvmfModel: pChild,
                    parentType: pParent?.sID,
                    parentId: pParent?.twObjectIx,
                });
            }
        }
        catch (err) {
            debugLog(`[onInserted] ERROR: ${err.message}`);
        }
    }
    onUpdated(pNotice) {
        try {
            if (this.isDisconnecting) {
                return;
            }
            const pChild = pNotice.pData?.pChild;
            const pUpdated = pChild || pNotice.pCreator;
            if (pUpdated?.twObjectIx && pUpdated?.wClass_Object) {
                const prefixedId = this.getPrefixedId(pUpdated);
                this.objectCache.set(prefixedId, pUpdated);
                this._recordMutationEvent({
                    kind: 'updated',
                    classId: pUpdated.wClass_Object,
                    objectId: pUpdated.twObjectIx,
                    mvmfModel: pUpdated,
                });
            }
            if (this.connected && pUpdated?.sID && pUpdated.twObjectIx !== undefined) {
                this._emit('nodeUpdated', {
                    id: pUpdated.twObjectIx,
                    type: pUpdated.sID,
                    mvmfModel: pUpdated,
                });
            }
        }
        catch (err) {
            debugLog(`[onUpdated] ERROR: ${err.message}`);
        }
    }
    attachTo(pObject) {
        if (pObject && typeof pObject.Attach === 'function' && !this.attachedObjects.has(pObject)) {
            pObject.Attach(this);
            this.attachedObjects.add(pObject);
        }
    }
    detachFrom(pObject) {
        if (pObject && this.attachedObjects.has(pObject)) {
            try {
                pObject.Detach(this);
            }
            catch {
                // Ignore errors during detach
            }
            this.attachedObjects.delete(pObject);
        }
    }
    detachAll() {
        for (const pObject of this.attachedObjects) {
            try {
                pObject.Detach(this);
            }
            catch {
                // Ignore errors during detach
            }
        }
        this.attachedObjects.clear();
    }
    onChanged(pNotice) {
        try {
            if (this.isDisconnecting) {
                return;
            }
            const pParent = pNotice.pCreator;
            const pChild = pNotice.pData?.pChild;
            const pChange = pNotice.pData?.pChange;
            if (!pParent?.IsReady?.()) {
                return;
            }
            if (pChild?.sID && pChild.twObjectIx !== undefined) {
                const emitInserted = () => {
                    const parentClassId = pChild?.wClass_Parent ?? pParent?.wClass_Object;
                    const parentObjectId = pChild?.twParentIx ?? pParent?.twObjectIx;
                    const prefixedId = this.getPrefixedId(pChild);
                    this.objectCache.set(prefixedId, pChild);
                    this._recordMutationEvent({
                        kind: 'inserted',
                        childClassId: pChild.wClass_Object,
                        childObjectId: pChild.twObjectIx,
                        parentClassId,
                        parentObjectId,
                        name: this.getObjectName(pChild),
                        mvmfModel: pChild,
                    });
                    this._emit('nodeInserted', {
                        mvmfModel: pChild,
                        parentType: pParent.sID,
                        parentId: pParent.twObjectIx,
                    });
                };
                const emitDeleted = () => {
                    const parentClassId = pChild?.wClass_Parent ?? pParent?.wClass_Object;
                    const parentObjectId = pChild?.twParentIx ?? pParent?.twObjectIx;
                    this._recordMutationEvent({
                        kind: 'deleted',
                        classId: pChild.wClass_Object,
                        objectId: pChild.twObjectIx,
                        parentClassId,
                        parentObjectId,
                    });
                    this._emit('nodeDeleted', {
                        id: pChild.twObjectIx,
                        type: pChild.sID,
                        sourceParentType: pParent.sID,
                        sourceParentId: pParent.twObjectIx,
                    });
                };
                if (pChange?.sType?.endsWith('_OPEN')) {
                    emitInserted();
                    return;
                }
                const present = this._isChildOf(pParent, pChild);
                if (present === false) {
                    emitDeleted();
                    return;
                }
                if (present === true) {
                    const prefixedId = this.getPrefixedId(pChild);
                    this.objectCache.set(prefixedId, pChild);
                    this._recordMutationEvent({
                        kind: 'updated',
                        classId: pChild.wClass_Object,
                        objectId: pChild.twObjectIx,
                        mvmfModel: pChild,
                    });
                    this._emit('nodeUpdated', {
                        id: pChild.twObjectIx,
                        type: pChild.sID,
                        mvmfModel: pChild,
                    });
                    return;
                }
                if (this.pLnG) {
                    const model = this.pLnG.Model_Open(pParent.sID, pParent.twObjectIx);
                    this.attachTo(model);
                }
                return;
            }
            this.onUpdated(pNotice);
        }
        catch (err) {
            debugLog(`[onChanged] ERROR: ${err.message}`);
        }
    }
    onDeleting(pNotice) {
        try {
            if (this.isDisconnecting) {
                return;
            }
            const pChild = pNotice.pData?.pChild;
            if (pChild?.twObjectIx && pChild?.wClass_Object) {
                const prefixedId = this.getPrefixedId(pChild);
                this.objectCache.delete(prefixedId);
                const parentClassId = pChild?.wClass_Parent ?? pNotice.pCreator?.wClass_Object;
                const parentObjectId = pChild?.twParentIx ?? pNotice.pCreator?.twObjectIx;
                this._recordMutationEvent({
                    kind: 'deleted',
                    classId: pChild.wClass_Object,
                    objectId: pChild.twObjectIx,
                    parentClassId,
                    parentObjectId,
                });
            }
            if (this.connected && pChild) {
                this._emit('nodeDeleted', {
                    id: pChild.twObjectIx,
                    type: pChild.sID,
                    sourceParentType: pNotice.pCreator?.sID,
                    sourceParentId: pNotice.pCreator?.twObjectIx,
                });
            }
        }
        catch (err) {
            debugLog(`[onDeleting] ERROR: ${err.message}`);
        }
    }
    /**
     * @param {string} fabricUrl
     * @param {string | ConnectOptions} [optionsOrAdminKey]
     * @param {number} [timeoutMs]
     * @returns {Promise<any>}
     */
    async connect(fabricUrl, optionsOrAdminKey = '', timeoutMs = 60000) {
        if (this.connected || this.pFabric) {
            await this.disconnect();
        }
        this.isDisconnecting = false;
        let adminKey = '';
        if (typeof optionsOrAdminKey === 'string') {
            adminKey = optionsOrAdminKey;
        }
        else if (optionsOrAdminKey && typeof optionsOrAdminKey === 'object') {
            adminKey = optionsOrAdminKey.adminKey || '';
            if (typeof optionsOrAdminKey.timeoutMs === 'number') {
                timeoutMs = optionsOrAdminKey.timeoutMs;
            }
        }
        this._acquireBootstrapRequirements();
        this.fabricUrl = fabricUrl;
        this.adminKey = adminKey;
        this.loginAttempted = false;
        this.rootReadyEmitted = false;
        this.searchableRMCObjectIndices = [];
        this.searchableRMTObjectIndices = [];
        this.ReadyState?.(ManifolderClient.eSTATE.LOADING);
        this._emit('status', 'Loading map config...');
        ++this.connectionGeneration;
        const capturedGeneration = this.connectionGeneration;
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                if (this.connectionGeneration === capturedGeneration) {
                    this.connectResolve = null;
                    this.connectReject = null;
                    reject(new Error(`Connection timeout after ${timeoutMs}ms`));
                }
            }, timeoutMs);
            this.connectResolve = async () => {
                if (this.connectionGeneration === capturedGeneration) {
                    clearTimeout(timeoutId);
                    try {
                        if (this.pRMRoot) {
                            await this.waitForReady(this.pRMRoot, timeoutMs);
                        }
                        resolve(this.pRMRoot);
                    }
                    catch (err) {
                        reject(err);
                    }
                }
            };
            this.connectReject = (err) => {
                if (this.connectionGeneration === capturedGeneration) {
                    clearTimeout(timeoutId);
                    reject(err);
                }
            };
            this.pFabric = new MV.MVRP.MSF(fabricUrl, MV.MVRP.MSF.eMETHOD.GET);
            this.attachTo(this.pFabric);
        });
    }
    handleReadyState(pNotice) {
        // Ignore callbacks from a previous connection
        if (pNotice.pCreator !== this.pFabric && pNotice.pCreator !== this.pLnG) {
            return;
        }
        if (pNotice.pCreator === this.pFabric) {
            if (this.pFabric.IsReady()) {
                this._emit('status', 'Connecting to Metaverse server...');
                this.pLnG = this.pFabric.GetLnG('map');
                const mapConfig = this.pFabric.pMSFConfig?.map;
                this.sceneWClass = mapConfig?.wClass ?? null;
                this.sceneObjectIx = mapConfig?.twObjectIx ?? null;
                if (!this.pLnG) {
                    const err = new Error('Failed to get LnG "map" from fabric config');
                    this.connectReject?.(err);
                    this._emit('error', err);
                    this.connectResolve = null;
                    this.connectReject = null;
                    return;
                }
                this.attachTo(this.pLnG);
            }
            else if (this.pFabric.ReadyState() === this.pFabric.eSTATE.ERROR) {
                const err = new Error('Failed to load fabric config from ' + this.fabricUrl);
                this.connectReject?.(err);
                this._emit('error', err);
                this.connectResolve = null;
                this.connectReject = null;
            }
        }
        else if (pNotice.pCreator === this.pLnG) {
            const state = this.pLnG.ReadyState();
            if (state === this.pLnG.eSTATE.CONNECTING) {
                this._emit('status', 'Connecting to server...');
                return;
            }
            if (state === this.pLnG.eSTATE.LOGGING) {
                this._emit('status', 'Authenticating...');
                return;
            }
            if (state === this.pLnG.eSTATE.LOGGEDIN) {
                const wasConnected = this.connected;
                this.connected = true;
                this.loggedIn = true;
                if (!wasConnected) {
                    this._emit('status', 'Connected, loading map...');
                    this._emit('connected');
                    this.start();
                    this.connectResolve?.();
                    this.connectResolve = null;
                    this.connectReject = null;
                }
            }
            else if (state === this.pLnG.eSTATE.LOGGEDOUT) {
                if (this.adminKey) {
                    if (this.loginAttempted) {
                        this.connectReject?.(new Error('Login failed: invalid admin key or authentication error'));
                        this.connectResolve = null;
                        this.connectReject = null;
                    }
                    else {
                        this.loginAttempted = true;
                        this.pLnG.Login('token=' + MV.MVMF.Escape(this.adminKey));
                    }
                }
                else {
                    this.connected = true;
                    this.loggedIn = false;
                    this._emit('status', 'Connected, loading map...');
                    this._emit('connected');
                    this.start();
                    this.connectResolve?.();
                    this.connectResolve = null;
                    this.connectReject = null;
                }
            }
            else if (state === this.pLnG.eSTATE.DISCONNECTED) {
                this._emit('status', 'Disconnected from server');
                this._emit('disconnected');
                if (this.connected) {
                    this.handleUnexpectedDisconnect();
                }
                else {
                    this.connectReject?.(new Error('Disconnected from server'));
                    this.connectResolve = null;
                    this.connectReject = null;
                }
            }
            else if (state === this.pLnG.eSTATE.ERROR) {
                this._emit('disconnected');
                if (this.connected) {
                    this.handleUnexpectedDisconnect();
                }
                else {
                    this.connectReject?.(new Error('LnG connection error'));
                    this.connectResolve = null;
                    this.connectReject = null;
                }
            }
        }
    }
    handleUnexpectedDisconnect() {
        this.connected = false;
        this.loggedIn = false;
        // Reject all pending object-ready promises
        for (const [, pending] of this.pendingReady) {
            pending.reject(new Error('Connection lost'));
        }
        this.pendingReady.clear();
        for (const wait of this.pendingMutationWaits) {
            clearTimeout(wait.timeoutId);
            wait.reject(new Error('Connection lost'));
        }
        this.pendingMutationWaits.clear();
        this.recentMutationEvents = [];
    }
    start() {
        const hasScopedRoot = !this.adminKey && this.sceneWClass && this.sceneObjectIx;
        if (hasScopedRoot) {
            const classMap = {
                70: 'RMRoot',
                71: 'RMCObject',
                72: 'RMTObject',
                73: 'RMPObject',
            };
            const sceneType = classMap[this.sceneWClass];
            if (sceneType) {
                this.pRMRoot = this.pLnG.Model_Open(sceneType, this.sceneObjectIx);
            }
        }
        if (!this.pRMRoot) {
            this.pRMRoot = this.pLnG.Model_Open('RMRoot', 1);
        }
        this.attachTo(this.pRMRoot);
    }
    async openAndWait(modelType, objectId, timeoutMs) {
        const pObject = this.pLnG.Model_Open(modelType, objectId);
        if (!pObject) {
            throw new Error(`Failed to open ${modelType} with id ${objectId}`);
        }
        this.attachTo(pObject);
        await this.waitForReady(pObject, timeoutMs);
        return pObject;
    }
    static CLASS_ID_TO_TYPE = {
        [ClassIds.RMPObject]: 'RMPObject',
        [ClassIds.RMTObject]: 'RMTObject',
        [ClassIds.RMCObject]: 'RMCObject',
    };
    static CHILD_CLASS_TYPES = ['RMPObject', 'RMTObject', 'RMCObject'];
    async openWithKnownType(objectId, classId, timeoutMs) {
        const modelType = ManifolderClient.CLASS_ID_TO_TYPE[classId];
        if (!modelType) {
            throw new Error(`Unknown class ID: ${classId}`);
        }
        return await this.openAndWait(modelType, objectId, timeoutMs);
    }
    enumAllChildTypes(pObject, callback) {
        for (const childType of ManifolderClient.CHILD_CLASS_TYPES) {
            pObject.Child_Enum(childType, this, callback, null);
        }
    }
    /**
     * @param {ModelRef} params
     * @returns {void}
     */
    openModel({ sID, twObjectIx }) {
        if (!this.pLnG)
            return;
        const mvmfModel = this.pLnG.Model_Open(sID, twObjectIx);
        if (!mvmfModel)
            return;
        this.attachTo(mvmfModel);
        if (mvmfModel.IsReady?.()) {
            this._emit('modelReady', { mvmfModel });
        }
    }
    /**
     * @param {ModelRef} params
     * @returns {void}
     */
    subscribe({ sID, twObjectIx }) {
        this.openModel({ sID, twObjectIx });
    }
    /**
     * @param {ModelRef} params
     * @returns {void}
     */
    closeModel({ sID, twObjectIx }) {
        if (!this.pLnG)
            return;
        const mvmfModel = this.pLnG.Model_Open(sID, twObjectIx);
        this.detachFrom(mvmfModel);
        try {
            if (mvmfModel && mvmfModel !== this.pRMRoot && mvmfModel !== this.pLnG && mvmfModel !== this.pFabric) {
                this.pLnG.Model_Close(mvmfModel);
            }
        }
        catch {
            // best effort close
        }
    }
    /**
     * @param {any} model
     * @returns {any[]}
     */
    enumerateChildren(model) {
        const children = [];
        if (!model?.Child_Enum) {
            return children;
        }
        const enumCallback = (child) => {
            children.push(child);
        };
        model.Child_Enum('RMCObject', this, enumCallback, null);
        model.Child_Enum('RMTObject', this, enumCallback, null);
        model.Child_Enum('RMPObject', this, enumCallback, null);
        return children;
    }
    _collectSearchableIndices(model) {
        if (!model)
            return;
        if (model.sID === 'RMCObject') {
            this.searchableRMCObjectIndices = [model.twObjectIx];
            this.searchableRMTObjectIndices = [];
            return;
        }
        if (model.sID === 'RMTObject') {
            this.searchableRMTObjectIndices = [model.twObjectIx];
            this.searchableRMCObjectIndices = [];
            return;
        }
        this.searchableRMCObjectIndices = [];
        this.searchableRMTObjectIndices = [];
        const children = this.enumerateChildren(model);
        for (const child of children) {
            if (child.sID === 'RMCObject') {
                this.searchableRMCObjectIndices.push(child.twObjectIx);
            }
            else if (child.sID === 'RMTObject') {
                this.searchableRMTObjectIndices.push(child.twObjectIx);
            }
        }
    }
    _collectSearchIndicesFromSceneRoot(rmcObjectIndices, rmtObjectIndices) {
        rmcObjectIndices.push(...this.searchableRMCObjectIndices);
        rmtObjectIndices.push(...this.searchableRMTObjectIndices);
    }
    /**
     * @param {string} searchText
     * @returns {Promise<SearchNodesResult>}
     */
    async searchNodes(searchText) {
        if (!this.connected || !searchText) {
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
            const model = this.pLnG.Model_Open(objectType, objectIx);
            if (!model?.IsReady?.()) {
                return { matches, paths, unavailable: objectType };
            }
            const pIAction = model.Request('SEARCH');
            if (!pIAction) {
                return { matches, paths, unavailable: objectType };
            }
            if (objectType === 'RMCObject') {
                pIAction.pRequest.twRMCObjectIx = objectIx;
            }
            else {
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
            if (response.aResultSet?.[0] && Array.isArray(response.aResultSet[0])) {
                for (let i = 0; i < response.aResultSet[0].length; i += 1) {
                    const match = response.aResultSet[0][i];
                    matches.push({
                        id: match.ObjectHead_twObjectIx,
                        name: match.Name_wsRMCObjectId || match.Name_wsRMTObjectId,
                        type: objectType,
                        nodeType: match.Type_bType,
                        parentType: this._getClassID(match.ObjectHead_wClass_Parent),
                        parentId: match.ObjectHead_twParentIx,
                        matchOrder: i,
                        rootId: objectIx,
                    });
                }
            }
            if (response.aResultSet?.[1] && Array.isArray(response.aResultSet[1])) {
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
                        rootId: objectIx,
                    });
                }
            }
        }
        catch {
            // fail individual search without failing all
        }
        return { matches, paths };
    }
    _getClassID(wClass) {
        const classIds = {
            70: 'RMRoot',
            71: 'RMCObject',
            72: 'RMTObject',
            73: 'RMPObject',
        };
        return classIds[wClass];
    }
    /**
     * @param {ClientEvent} event
     * @param {ClientEventHandler} handler
     * @returns {void}
     */
    on(event, handler) {
        if (this.callbacks[event]) {
            this.callbacks[event].push(handler);
        }
    }
    /**
     * @param {ClientEvent} event
     * @param {ClientEventHandler} handler
     * @returns {void}
     */
    off(event, handler) {
        if (!this.callbacks[event]) {
            return;
        }
        const index = this.callbacks[event].indexOf(handler);
        if (index !== -1) {
            this.callbacks[event].splice(index, 1);
        }
    }
    _emit(event, data) {
        this.callbacks[event]?.forEach((handler) => {
            try {
                handler(data);
            }
            catch {
                // handler errors should not propagate
            }
        });
    }
    /**
     * @returns {Promise<void>}
     */
    async disconnect() {
        if (this.isDisconnecting) {
            return;
        }
        this.isDisconnecting = true;
        try {
            const pLnG = this.pLnG;
            const pFabric = this.pFabric;
            const pRMRoot = this.pRMRoot;
            // Bump generation so any in-flight callbacks from this connection are ignored
            this.connectionGeneration++;
            // Reject any pending connect promise
            if (this.connectReject) {
                this.connectReject(new Error('Disconnected'));
            }
            this.connectResolve = null;
            this.connectReject = null;
            // Reject all pending object-ready promises
            for (const [key, pending] of this.pendingReady) {
                pending.reject(new Error('Disconnected'));
            }
            this.pendingReady.clear();
            for (const wait of this.pendingMutationWaits) {
                clearTimeout(wait.timeoutId);
                wait.reject(new Error('Disconnected'));
            }
            this.pendingMutationWaits.clear();
            this.recentMutationEvents = [];
            // Mirror legacy behavior: tear down local objects immediately without waiting for remote logout flow.
            // Detach from all MVMF objects before destroying
            this.detachAll();
            this.pRMRoot = null;
            if (pRMRoot && pLnG?.Model_Close) {
                try {
                    pLnG.Model_Close(pRMRoot);
                }
                catch {
                    // Ignore errors during teardown
                }
            }
            if (pFabric?.destructor) {
                try {
                    pFabric.destructor();
                }
                catch {
                    // Ignore errors during teardown
                }
            }
            this.pFabric = null;
            this.pLnG = null;
            this.connected = false;
            this.loggedIn = false;
            this.fabricUrl = null;
            this.adminKey = null;
            this.currentSceneId = null;
            this.objectCache.clear();
            this.searchableRMCObjectIndices = [];
            this.searchableRMTObjectIndices = [];
            this.rootReadyEmitted = false;
            this.ReadyState?.(ManifolderClient.eSTATE.NOTREADY);
            this._emit('status', 'Disconnected from server');
            this._emit('disconnected');
        }
        finally {
            this._releaseBootstrapRequirements();
            this.isDisconnecting = false;
        }
    }
    /**
     * @returns {ConnectionStatus}
     */
    getStatus() {
        return {
            connected: this.connected,
            fabricUrl: this.fabricUrl,
            currentSceneId: this.currentSceneId,
            currentSceneName: null,
            resourceRootUrl: this.getResourceRootUrl() || null,
        };
    }
    /**
     * @returns {Promise<Scene[]>}
     */
    async listScenes() {
        await this.ensureConnected();
        await this.waitForReady(this.pRMRoot);
        const scenes = [];
        const seenIds = new Set();
        const enumCallback = (pRMXObject) => {
            const prefixedId = this.getPrefixedId(pRMXObject);
            if (seenIds.has(prefixedId))
                return;
            seenIds.add(prefixedId);
            const name = this.getObjectName(pRMXObject);
            const classId = pRMXObject.wClass_Object;
            scenes.push({ id: prefixedId, name, rootObjectId: prefixedId, classId });
        };
        this.enumAllChildTypes(this.pRMRoot, enumCallback);
        return scenes;
    }
    /**
     * @param {string} sceneId
     * @returns {Promise<FabricObject>}
     */
    async openScene(sceneId) {
        await this.ensureConnected();
        const { classId, numericId } = parseObjectRef(sceneId);
        const pObject = await this.openWithKnownType(numericId, classId);
        this.currentSceneId = sceneId;
        this.objectCache.set(sceneId, pObject);
        // Eagerly load direct children so list_objects works immediately
        await this.loadDirectChildren(pObject);
        return this.rmxToFabricObject(pObject);
    }
    async loadDirectChildren(pObject) {
        const children = [];
        this.enumAllChildTypes(pObject, (child) => {
            children.push(child);
        });
        if (children.length > 0) {
            debugLog(`[loadDirectChildren] opening ${children.length} children`);
            await Promise.all(children.map(async (child) => {
                const childPrefixedId = this.getPrefixedId(child);
                if (this.objectCache.has(childPrefixedId))
                    return;
                try {
                    const childClassId = child.wClass_Object;
                    const pChild = await this.openWithKnownType(child.twObjectIx, childClassId);
                    this.objectCache.set(childPrefixedId, pChild);
                }
                catch (err) {
                    debugLog(`[loadDirectChildren] failed to open child ${childPrefixedId}: ${err.message}`);
                }
            }));
        }
    }
    /**
     * @param {string} name
     * @param {string} [objectType]
     * @returns {Promise<Scene>}
     */
    async createScene(name, objectType) {
        const obj = await this.createObject({
            parentId: 'root',
            name,
            objectType,
            bound: { x: 150, y: 150, z: 150 },
        });
        return { id: obj.id, name, rootObjectId: obj.id, classId: obj.classId };
    }
    /**
     * @param {string} sceneId
     * @returns {Promise<void>}
     */
    async deleteScene(sceneId) {
        await this.ensureConnected();
        await this.waitForReady(this.pRMRoot);
        const { classId, numericId } = parseObjectRef(sceneId);
        const closeInfo = CLASS_ID_TO_CLOSE_ACTION[classId];
        if (!closeInfo) {
            throw new Error(`Cannot delete object of class ${classId}`);
        }
        const startedAt = Date.now();
        const response = await this.sendAction(this.pRMRoot, closeInfo.action, (payload) => {
            payload[closeInfo.idField] = numericId;
            payload.bDeleteAll = 1;
        });
        if (response.nResult !== 0) {
            throw new Error(this.formatResponseError('Failed to delete scene', response));
        }
        await this._confirmMutation((event) => {
            if (event.kind !== 'deleted' || event.classId !== classId || event.objectId !== numericId) {
                return false;
            }
            if (event.parentClassId == null || event.parentObjectId == null) {
                return true;
            }
            return event.parentClassId === ClassIds.RMRoot &&
                event.parentObjectId === this.pRMRoot.twObjectIx;
        }, `delete scene ${sceneId}`, undefined, startedAt);
        if (this.currentSceneId === sceneId) {
            this.currentSceneId = null;
        }
        this.objectCache.delete(sceneId);
    }
    /**
     * @param {string} scopeId
     * @param {ObjectFilter} [filter]
     * @returns {Promise<FabricObject[]>}
     */
    async listObjects(scopeId, filter) {
        await this.ensureConnected();
        if (!this.objectCache.has(scopeId)) {
            const { classId, numericId } = parseObjectRef(scopeId);
            const pScene = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(scopeId, pScene);
        }
        const objects = [];
        const seenIds = new Set();
        const collectLoaded = (pObject) => {
            const prefixedId = this.getPrefixedId(pObject);
            if (seenIds.has(prefixedId))
                return;
            seenIds.add(prefixedId);
            objects.push(this.rmxToFabricObject(pObject));
            this.enumAllChildTypes(pObject, (child) => {
                collectLoaded(child);
            });
        };
        const pScene = this.objectCache.get(scopeId);
        if (pScene) {
            collectLoaded(pScene);
        }
        let result = objects;
        if (filter?.type) {
            const typeInfo = ObjectTypeMap[filter.type];
            if (typeInfo) {
                result = result.filter(obj => obj.classId === typeInfo.classId && obj.subtype === typeInfo.subtype);
            }
            else {
                result = result.filter(obj => obj.id.startsWith(filter.type + ':'));
            }
        }
        if (filter?.namePattern) {
            const pattern = new RegExp(filter.namePattern, 'i');
            result = result.filter(obj => pattern.test(obj.name));
        }
        return result;
    }
    /**
     * @param {string} objectId
     * @returns {Promise<FabricObject>}
     */
    async getObject(objectId) {
        await this.ensureConnected();
        const { classId, numericId } = parseObjectRef(objectId);
        let pObject = this.objectCache.get(objectId);
        if (pObject) {
            if (!pObject.IsReady?.()) {
                debugLog(`[getObject] cached object ${objectId} not ready (class ${classId}), opening to load children`);
                pObject = await this.openWithKnownType(numericId, classId);
                this.objectCache.set(objectId, pObject);
            }
        }
        else {
            pObject = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(objectId, pObject);
        }
        return this.rmxToFabricObject(pObject);
    }
    /**
     * @param {CreateObjectParams} params
     * @returns {Promise<FabricObject>}
     */
    async createObject(params) {
        await this.ensureConnected();
        // Determine child class from objectType
        let childClassId;
        let bType;
        if (params.objectType) {
            const typeInfo = ObjectTypeMap[params.objectType];
            if (!typeInfo) {
                throw new Error(`Unknown objectType "${params.objectType}". Valid types: ${Object.keys(ObjectTypeMap).join(', ')}`);
            }
            childClassId = typeInfo.classId;
            bType = typeInfo.subtype;
        }
        else {
            childClassId = ClassIds.RMPObject;
            bType = 0;
        }
        const openInfo = CLASS_ID_TO_OPEN_ACTION[childClassId];
        if (!openInfo) {
            throw new Error(`Cannot create objects of class ${childClassId}`);
        }
        const isRootParent = params.parentId === 'root';
        let pParent;
        if (isRootParent) {
            await this.waitForReady(this.pRMRoot);
            pParent = this.pRMRoot;
        }
        else {
            const { classId: parentClassId, numericId: parentNumericId } = parseObjectRef(params.parentId);
            pParent = this.objectCache.get(params.parentId);
            if (!pParent) {
                pParent = await this.openWithKnownType(parentNumericId, parentClassId);
                this.objectCache.set(params.parentId, pParent);
            }
        }
        this.attachTo(pParent);
        const isCelestial = childClassId === ClassIds.RMCObject;
        const isTerrestrial = childClassId === ClassIds.RMTObject;
        const startedAt = Date.now();
        const response = await this.sendAction(pParent, openInfo.action, (payload) => {
            payload.pName[openInfo.nameField] = params.name;
            payload.pType.bType = bType;
            payload.pType.bSubtype = 0;
            payload.pType.bFiction = 0;
            if (childClassId === ClassIds.RMPObject) {
                payload.pType.bMovable = 0;
            }
            payload.pOwner.twRPersonaIx = 1;
            payload.pResource.qwResource = 0;
            payload.pResource.sName = params.resourceName || '';
            payload.pResource.sReference = params.resourceReference || '';
            payload.pTransform.vPosition.dX = params.position?.x ?? 0;
            payload.pTransform.vPosition.dY = params.position?.y ?? 0;
            payload.pTransform.vPosition.dZ = params.position?.z ?? 0;
            payload.pTransform.qRotation.dX = params.rotation?.x ?? 0;
            payload.pTransform.qRotation.dY = params.rotation?.y ?? 0;
            payload.pTransform.qRotation.dZ = params.rotation?.z ?? 0;
            payload.pTransform.qRotation.dW = params.rotation?.w ?? 1;
            payload.pTransform.vScale.dX = params.scale?.x ?? 1;
            payload.pTransform.vScale.dY = params.scale?.y ?? 1;
            payload.pTransform.vScale.dZ = params.scale?.z ?? 1;
            payload.pBound.dX = params.bound?.x ?? 1;
            payload.pBound.dY = params.bound?.y ?? 1;
            payload.pBound.dZ = params.bound?.z ?? 1;
            if (isTerrestrial) {
                payload.pProperties.bLockToGround = 0;
                payload.pProperties.bYouth = 0;
                payload.pProperties.bAdult = 0;
                payload.pProperties.bAvatar = 0;
                payload.pCoord.bCoord = 3;
                payload.pCoord.dA = 0;
                payload.pCoord.dB = 0;
                payload.pCoord.dC = 0;
            }
            if (isCelestial) {
                payload.pOrbit_Spin.tmPeriod = params.orbit?.period ?? 0;
                payload.pOrbit_Spin.tmStart = params.orbit?.start ?? 0;
                payload.pOrbit_Spin.dA = params.orbit?.a ?? 0;
                payload.pOrbit_Spin.dB = params.orbit?.b ?? 0;
                payload.pProperties.fMass = params.properties?.mass ?? 0;
                payload.pProperties.fGravity = params.properties?.gravity ?? 0;
                payload.pProperties.fColor = params.properties?.color ?? 0;
                payload.pProperties.fBrightness = params.properties?.brightness ?? 0;
                payload.pProperties.fReflectivity = params.properties?.reflectivity ?? 0;
            }
        });
        if (response.nResult !== 0) {
            throw new Error(this.formatResponseError('Failed to create object', response));
        }
        const numericNewId = response.aResultSet?.[0]?.[0]?.[openInfo.resultField];
        const newId = numericNewId != null
            ? formatObjectRef(childClassId, numericNewId)
            : `${formatObjectRef(childClassId, Date.now())}`;
        await this._confirmMutation((event) => {
            if (event.kind !== 'inserted' || event.childClassId !== childClassId) {
                return false;
            }
            const idOrNameMatches = numericNewId != null
                ? event.childObjectId === numericNewId
                : event.name === params.name;
            if (!idOrNameMatches) {
                return false;
            }
            if (event.parentClassId == null || event.parentObjectId == null) {
                return true;
            }
            return event.parentClassId === pParent.wClass_Object &&
                event.parentObjectId === pParent.twObjectIx;
        }, `create object ${params.name}`, undefined, startedAt);
        return {
            id: newId,
            parentId: params.parentId,
            name: params.name,
            transform: {
                position: params.position ?? { x: 0, y: 0, z: 0 },
                rotation: params.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
                scale: params.scale ?? { x: 1, y: 1, z: 1 },
            },
            resourceReference: params.resourceReference ?? null,
            resourceName: params.resourceName ?? null,
            bound: null,
            classId: childClassId,
            subtype: bType,
            children: null,
            orbit: isCelestial ? params.orbit ?? undefined : undefined,
            properties: isCelestial ? params.properties ?? undefined : undefined,
        };
    }
    /**
     * @param {UpdateObjectParams} params
     * @returns {Promise<FabricObject>}
     */
    async updateObject(params) {
        await this.ensureConnected();
        const { classId, numericId } = parseObjectRef(params.objectId);
        let pObject = this.objectCache.get(params.objectId);
        if (!pObject) {
            pObject = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(params.objectId, pObject);
        }
        this.attachTo(pObject);
        if (params.name !== undefined) {
            const nameField = CLASS_ID_TO_NAME_FIELD[classId];
            if (!nameField) {
                throw new Error(`Cannot rename object of class ${classId}`);
            }
            const startedAt = Date.now();
            const response = await this.sendAction(pObject, 'NAME', (payload) => {
                payload.pName[nameField] = params.name;
            });
            if (response.nResult !== 0) {
                throw new Error(this.formatResponseError('Failed to update name', response));
            }
            await this._confirmMutation((event) => event.kind === 'updated' &&
                event.classId === classId &&
                event.objectId === numericId, `update name for ${params.objectId}`, undefined, startedAt);
        }
        if (params.position !== undefined || params.rotation !== undefined || params.scale !== undefined) {
            const startedAt = Date.now();
            const response = await this.sendAction(pObject, 'TRANSFORM', (payload) => {
                payload.pTransform.vPosition.dX = params.position?.x ?? pObject.pTransform?.vPosition?.dX ?? 0;
                payload.pTransform.vPosition.dY = params.position?.y ?? pObject.pTransform?.vPosition?.dY ?? 0;
                payload.pTransform.vPosition.dZ = params.position?.z ?? pObject.pTransform?.vPosition?.dZ ?? 0;
                payload.pTransform.qRotation.dX = params.rotation?.x ?? pObject.pTransform?.qRotation?.dX ?? 0;
                payload.pTransform.qRotation.dY = params.rotation?.y ?? pObject.pTransform?.qRotation?.dY ?? 0;
                payload.pTransform.qRotation.dZ = params.rotation?.z ?? pObject.pTransform?.qRotation?.dZ ?? 0;
                payload.pTransform.qRotation.dW = params.rotation?.w ?? pObject.pTransform?.qRotation?.dW ?? 1;
                payload.pTransform.vScale.dX = params.scale?.x ?? pObject.pTransform?.vScale?.dX ?? 1;
                payload.pTransform.vScale.dY = params.scale?.y ?? pObject.pTransform?.vScale?.dY ?? 1;
                payload.pTransform.vScale.dZ = params.scale?.z ?? pObject.pTransform?.vScale?.dZ ?? 1;
                if (classId === ClassIds.RMTObject) {
                    payload.pCoord.bCoord = 3;
                    payload.pCoord.dA = 0;
                    payload.pCoord.dB = 0;
                    payload.pCoord.dC = 0;
                }
            });
            if (response.nResult !== 0) {
                throw new Error(this.formatResponseError('Failed to update transform', response));
            }
            await this._confirmMutation((event) => event.kind === 'updated' &&
                event.classId === classId &&
                event.objectId === numericId, `update transform for ${params.objectId}`, undefined, startedAt);
        }
        if (params.resourceReference !== undefined || params.resourceName !== undefined) {
            const startedAt = Date.now();
            const response = await this.sendAction(pObject, 'RESOURCE', (payload) => {
                payload.pResource.sReference = params.resourceReference !== undefined
                    ? params.resourceReference
                    : (pObject.pResource?.sReference ?? '');
                payload.pResource.sName = params.resourceName !== undefined
                    ? params.resourceName
                    : (pObject.pResource?.sName ?? '');
            });
            if (response.nResult !== 0) {
                throw new Error(this.formatResponseError('Failed to update resource', response));
            }
            await this._confirmMutation((event) => event.kind === 'updated' &&
                event.classId === classId &&
                event.objectId === numericId, `update resource for ${params.objectId}`, undefined, startedAt);
        }
        if (params.bound !== undefined) {
            const startedAt = Date.now();
            const response = await this.sendAction(pObject, 'BOUND', (payload) => {
                payload.pBound.dX = params.bound.x;
                payload.pBound.dY = params.bound.y;
                payload.pBound.dZ = params.bound.z;
            });
            if (response.nResult !== 0) {
                throw new Error(this.formatResponseError('Failed to update bound', response));
            }
            await this._confirmMutation((event) => event.kind === 'updated' &&
                event.classId === classId &&
                event.objectId === numericId, `update bound for ${params.objectId}`, undefined, startedAt);
        }
        if (params.orbit !== undefined) {
            // IO transport registers this as 'ORBIT_SPIN', SB transport as 'ORBIT'
            const orbitAction = pObject.Request('ORBIT_SPIN') ? 'ORBIT_SPIN' : 'ORBIT';
            const startedAt = Date.now();
            const response = await this.sendAction(pObject, orbitAction, (payload) => {
                payload.pOrbit_Spin.tmPeriod = params.orbit.period;
                payload.pOrbit_Spin.tmStart = params.orbit.start;
                payload.pOrbit_Spin.dA = params.orbit.a;
                payload.pOrbit_Spin.dB = params.orbit.b;
            });
            if (response.nResult !== 0) {
                throw new Error(this.formatResponseError('Failed to update orbit', response));
            }
            await this._confirmMutation((event) => event.kind === 'updated' &&
                event.classId === classId &&
                event.objectId === numericId, `update orbit for ${params.objectId}`, undefined, startedAt);
        }
        if (params.properties !== undefined) {
            const startedAt = Date.now();
            const response = await this.sendAction(pObject, 'PROPERTIES', (payload) => {
                payload.pProperties.fMass = params.properties.mass;
                payload.pProperties.fGravity = params.properties.gravity;
                payload.pProperties.fColor = params.properties.color;
                payload.pProperties.fBrightness = params.properties.brightness;
                payload.pProperties.fReflectivity = params.properties.reflectivity;
            });
            if (response.nResult !== 0) {
                throw new Error(this.formatResponseError('Failed to update properties', response));
            }
            await this._confirmMutation((event) => event.kind === 'updated' &&
                event.classId === classId &&
                event.objectId === numericId, `update properties for ${params.objectId}`, undefined, startedAt);
        }
        if (params.skipRefetch) {
            const parentPrefixedId = pObject.twParentIx && pObject.wClass_Parent
                ? formatObjectRef(pObject.wClass_Parent, pObject.twParentIx)
                : null;
            const isCelestial = pObject.wClass_Object === 71;
            return {
                id: params.objectId,
                parentId: parentPrefixedId,
                name: params.name ?? this.getObjectName(pObject),
                transform: {
                    position: params.position ?? { x: pObject.pTransform?.vPosition?.dX ?? 0, y: pObject.pTransform?.vPosition?.dY ?? 0, z: pObject.pTransform?.vPosition?.dZ ?? 0 },
                    rotation: params.rotation ?? { x: pObject.pTransform?.qRotation?.dX ?? 0, y: pObject.pTransform?.qRotation?.dY ?? 0, z: pObject.pTransform?.qRotation?.dZ ?? 0, w: pObject.pTransform?.qRotation?.dW ?? 1 },
                    scale: params.scale ?? { x: pObject.pTransform?.vScale?.dX ?? 1, y: pObject.pTransform?.vScale?.dY ?? 1, z: pObject.pTransform?.vScale?.dZ ?? 1 },
                },
                resourceReference: params.resourceReference ?? pObject.pResource?.sReference ?? null,
                resourceName: params.resourceName ?? pObject.pResource?.sName ?? null,
                bound: null,
                classId: pObject.wClass_Object,
                subtype: pObject.pType?.bType ?? 0,
                children: null,
                orbit: isCelestial && pObject.pOrbit_Spin ? {
                    period: params.orbit?.period ?? pObject.pOrbit_Spin.tmPeriod ?? 0,
                    start: params.orbit?.start ?? pObject.pOrbit_Spin.tmStart ?? 0,
                    a: params.orbit?.a ?? pObject.pOrbit_Spin.dA ?? 0,
                    b: params.orbit?.b ?? pObject.pOrbit_Spin.dB ?? 0,
                } : undefined,
                properties: isCelestial && pObject.pProperties ? {
                    mass: params.properties?.mass ?? pObject.pProperties.fMass ?? 0,
                    gravity: params.properties?.gravity ?? pObject.pProperties.fGravity ?? 0,
                    color: params.properties?.color ?? pObject.pProperties.fColor ?? 0,
                    brightness: params.properties?.brightness ?? pObject.pProperties.fBrightness ?? 0,
                    reflectivity: params.properties?.reflectivity ?? pObject.pProperties.fReflectivity ?? 0,
                } : undefined,
            };
        }
        return this.getObject(params.objectId);
    }
    /**
     * @param {string} objectId
     * @returns {Promise<void>}
     */
    async deleteObject(objectId) {
        await this.ensureConnected();
        const { classId, numericId } = parseObjectRef(objectId);
        const closeInfo = CLASS_ID_TO_CLOSE_ACTION[classId];
        if (!closeInfo) {
            throw new Error(`Cannot delete object of class ${classId}`);
        }
        let pObject = this.objectCache.get(objectId);
        if (!pObject) {
            pObject = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(objectId, pObject);
        }
        this.attachTo(pObject);
        const parentClassId = pObject.wClass_Parent;
        const parentNumericId = pObject.twParentIx;
        const parentPrefixedId = parentClassId && parentNumericId
            ? formatObjectRef(parentClassId, parentNumericId)
            : null;
        let pParent = parentPrefixedId ? this.objectCache.get(parentPrefixedId) : null;
        if (!pParent && parentPrefixedId) {
            pParent = await this.openWithKnownType(parentNumericId, parentClassId);
            this.objectCache.set(parentPrefixedId, pParent);
        }
        if (!pParent) {
            throw new Error(`Cannot find parent for object ${objectId}`);
        }
        this.attachTo(pParent);
        const startedAt = Date.now();
        const response = await this.sendAction(pParent, closeInfo.action, (payload) => {
            payload[closeInfo.idField] = numericId;
            payload.bDeleteAll = 0;
        });
        if (response.nResult !== 0) {
            throw new Error(this.formatResponseError('Failed to delete object', response));
        }
        await this._confirmMutation((event) => {
            if (event.kind !== 'deleted' || event.classId !== classId || event.objectId !== numericId) {
                return false;
            }
            if (event.parentClassId == null || event.parentObjectId == null) {
                return true;
            }
            return event.parentClassId === parentClassId &&
                event.parentObjectId === parentNumericId;
        }, `delete object ${objectId}`, undefined, startedAt);
        this.objectCache.delete(objectId);
    }
    /**
     * @param {string} objectId
     * @param {string} newParentId
     * @param {boolean} [skipRefetch]
     * @returns {Promise<FabricObject>}
     */
    async moveObject(objectId, newParentId, skipRefetch) {
        await this.ensureConnected();
        const { classId, numericId } = parseObjectRef(objectId);
        const { classId: newParentClassId, numericId: newParentNumericId } = parseObjectRef(newParentId);
        let pObject = this.objectCache.get(objectId);
        if (!pObject) {
            pObject = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(objectId, pObject);
        }
        this.attachTo(pObject);
        let pNewParent = this.objectCache.get(newParentId);
        if (!pNewParent) {
            pNewParent = await this.openWithKnownType(newParentNumericId, newParentClassId);
            this.objectCache.set(newParentId, pNewParent);
        }
        this.attachTo(pNewParent);
        const oldParentClassId = pObject.wClass_Parent;
        const oldParentNumericId = pObject.twParentIx;
        const oldParentId = oldParentClassId && oldParentNumericId
            ? formatObjectRef(oldParentClassId, oldParentNumericId)
            : null;
        const startedAt = Date.now();
        const response = await this.sendAction(pObject, 'PARENT', (payload) => {
            payload.wClass = newParentClassId;
            payload.twObjectIx = newParentNumericId;
        });
        if (response.nResult !== 0) {
            throw new Error(this.formatResponseError('Failed to move object', response));
        }
        await this._confirmMutation((event) => {
            if (event.timestamp < startedAt) {
                return false;
            }
            const missingParentMetadata = event.parentClassId == null || event.parentObjectId == null;
            const deletedFromOldParent = event.kind === 'deleted' &&
                event.classId === classId &&
                event.objectId === numericId &&
                (missingParentMetadata || (event.parentClassId === oldParentClassId &&
                    event.parentObjectId === oldParentNumericId));
            const insertedIntoNewParent = event.kind === 'inserted' &&
                event.childClassId === classId &&
                event.childObjectId === numericId &&
                (missingParentMetadata || (event.parentClassId === newParentClassId &&
                    event.parentObjectId === newParentNumericId));
            return deletedFromOldParent || insertedIntoNewParent;
        }, `move object ${objectId} -> ${newParentId}`, undefined, startedAt);
        // Model fields may be getter-only; force subsequent reads/writes to reopen authoritative state.
        this.objectCache.delete(objectId);
        if (skipRefetch) {
            return {
                id: objectId,
                parentId: newParentId,
                name: this.getObjectName(pObject),
                transform: {
                    position: { x: pObject.pTransform?.vPosition?.dX ?? 0, y: pObject.pTransform?.vPosition?.dY ?? 0, z: pObject.pTransform?.vPosition?.dZ ?? 0 },
                    rotation: { x: pObject.pTransform?.qRotation?.dX ?? 0, y: pObject.pTransform?.qRotation?.dY ?? 0, z: pObject.pTransform?.qRotation?.dZ ?? 0, w: pObject.pTransform?.qRotation?.dW ?? 1 },
                    scale: { x: pObject.pTransform?.vScale?.dX ?? 1, y: pObject.pTransform?.vScale?.dY ?? 1, z: pObject.pTransform?.vScale?.dZ ?? 1 },
                },
                resourceReference: pObject.pResource?.sReference || null,
                resourceName: pObject.pResource?.sName || null,
                bound: null,
                classId: pObject.wClass_Object,
                subtype: pObject.pType?.bType ?? 0,
                children: null,
            };
        }
        return this.getObject(objectId);
    }
    /**
     * @param {BulkOperation[]} operations
     * @returns {Promise<{ success: number; failed: number; createdIds: string[]; errors: string[] }>}
     */
    async bulkUpdate(operations) {
        let success = 0;
        let failed = 0;
        const createdIds = [];
        const errors = [];
        const CONCURRENCY = 10;
        // Pre-fetch all referenced objects so concurrent ops don't race
        const idsToPreload = new Set();
        for (const op of operations) {
            switch (op.type) {
                case 'create':
                    idsToPreload.add(op.params.parentId);
                    break;
                case 'update':
                    idsToPreload.add(op.params.objectId);
                    break;
                case 'delete':
                    idsToPreload.add(op.params.objectId);
                    break;
                case 'move': {
                    const p = op.params;
                    idsToPreload.add(p.objectId);
                    idsToPreload.add(p.newParentId);
                    break;
                }
            }
        }
        // Remove "root" and IDs already cached
        for (const id of idsToPreload) {
            if (id === 'root' || this.objectCache.has(id))
                idsToPreload.delete(id);
        }
        if (idsToPreload.size > 0) {
            debugLog(`[bulkUpdate] pre-fetching ${idsToPreload.size} objects`);
            for (const id of idsToPreload) {
                try {
                    const { classId, numericId } = parseObjectRef(id);
                    const pObj = await this.openWithKnownType(numericId, classId);
                    this.objectCache.set(id, pObj);
                }
                catch (err) {
                    debugLog(`[bulkUpdate] pre-fetch failed for ${id}: ${err.message}`);
                }
            }
        }
        const executeOp = async (op) => {
            switch (op.type) {
                case 'create': {
                    const createParams = op.params;
                    const obj = await this.createObject({ ...createParams, skipParentRefetch: true });
                    return obj.id;
                }
                case 'update':
                    await this.updateObject({ ...op.params, skipRefetch: true });
                    return null;
                case 'delete':
                    await this.deleteObject(op.params.objectId);
                    return null;
                case 'move': {
                    const moveParams = op.params;
                    const pObj = this.objectCache.get(moveParams.objectId);
                    const oldParentClassId = pObj?.wClass_Parent;
                    const oldParentNumericId = pObj?.twParentIx;
                    const oldParentId = oldParentClassId && oldParentNumericId
                        ? formatObjectRef(oldParentClassId, oldParentNumericId)
                        : null;
                    await this.moveObject(moveParams.objectId, moveParams.newParentId, true);
                    return null;
                }
            }
        };
        // Process all ops concurrently in batches
        for (let i = 0; i < operations.length; i += CONCURRENCY) {
            const batch = operations.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(batch.map(op => executeOp(op)));
            for (let j = 0; j < results.length; j++) {
                const result = results[j];
                if (result.status === 'fulfilled') {
                    success++;
                    if (result.value)
                        createdIds.push(result.value);
                }
                else {
                    failed++;
                    errors.push(`${batch[j].type} failed: ${result.reason?.message || 'unknown error'}`);
                }
            }
        }
        return { success, failed, createdIds, errors };
    }
    async loadFullTree(scopeId) {
        if (!this.objectCache.has(scopeId)) {
            const { classId, numericId } = parseObjectRef(scopeId);
            const pScene = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(scopeId, pScene);
        }
        const objects = [];
        const seenIds = new Set();
        const collectObjects = async (pObject) => {
            const prefixedId = this.getPrefixedId(pObject);
            if (seenIds.has(prefixedId))
                return;
            seenIds.add(prefixedId);
            objects.push(this.rmxToFabricObject(pObject));
            const children = [];
            this.enumAllChildTypes(pObject, (child) => {
                children.push(child);
            });
            const unopened = children.filter(c => {
                const childPrefixedId = this.getPrefixedId(c);
                return !seenIds.has(childPrefixedId) && !this.objectCache.has(childPrefixedId);
            });
            await Promise.all(unopened.map(child => this.openWithKnownType(child.twObjectIx, child.wClass_Object).catch(() => { })));
            await Promise.all(children.map(child => collectObjects(child)));
        };
        const pScene = this.objectCache.get(scopeId);
        if (pScene) {
            await collectObjects(pScene);
        }
        return objects;
    }
    /**
     * @param {string} scopeId
     * @param {SearchQuery} query
     * @returns {Promise<FabricObject[]>}
     */
    async findObjects(scopeId, query) {
        await this.ensureConnected();
        if (query.namePattern) {
            return this.serverSearch(scopeId, query);
        }
        const allObjects = await this.loadFullTree(scopeId);
        return allObjects.filter(obj => {
            if (query.resourceUrl && obj.resourceReference !== query.resourceUrl)
                return false;
            if (query.positionRadius) {
                const { center, radius } = query.positionRadius;
                const pos = obj.transform.position;
                const dist = Math.sqrt(Math.pow(pos.x - center.x, 2) +
                    Math.pow(pos.y - center.y, 2) +
                    Math.pow(pos.z - center.z, 2));
                if (dist > radius)
                    return false;
            }
            return true;
        });
    }
    async serverSearch(scopeId, query) {
        let pScene = this.objectCache.get(scopeId);
        if (!pScene) {
            const { classId, numericId } = parseObjectRef(scopeId);
            pScene = await this.openWithKnownType(numericId, classId);
            this.objectCache.set(scopeId, pScene);
        }
        const response = await this.sendAction(pScene, 'SEARCH', (p) => {
            if (pScene.sID === 'RMCObject') {
                p.twRMCObjectIx = pScene.twObjectIx;
            }
            else {
                p.twRMTObjectIx = pScene.twObjectIx;
            }
            p.dX = query.positionRadius?.center.x ?? 0;
            p.dY = query.positionRadius?.center.y ?? 0;
            p.dZ = query.positionRadius?.center.z ?? 0;
            p.sText = query.namePattern.toLowerCase();
        });
        if (response.nResult === -1) {
            throw new Error('Search is not supported on this server. Use get_object to browse the hierarchy manually.');
        }
        if (response.nResult !== 0) {
            throw new Error(this.formatResponseError('Search failed', response));
        }
        const results = [];
        const resultSet = response.aResultSet?.[0] || [];
        for (const item of resultSet) {
            const objectIx = item.ObjectHead_twObjectIx;
            const classId = item.ObjectHead_wClass_Object;
            if (!objectIx || !classId)
                continue;
            const resultObjectId = formatObjectRef(classId, objectIx);
            try {
                const obj = await this.getObject(resultObjectId);
                results.push(obj);
            }
            catch {
                // Skip objects we can't open
            }
        }
        return results;
    }
    async ensureConnected() {
        if (this.connected)
            return;
        if (this.fabricUrl && this.adminKey != null) {
            await this.connect(this.fabricUrl, this.adminKey);
            return;
        }
        throw new Error('Not connected. Call fabric_connect first.');
    }
    static TERM_SUBSTITUTIONS = [
        [/\bRMCObject\b/gi, 'celestial'],
        [/\bRMTObject\b/gi, 'terrestrial'],
        [/\bRMPObject\b/gi, 'physical'],
        [/\bRMRoot\b/gi, 'root'],
        [/\btwRMCObjectIx_Close\b/g, 'celestial object'],
        [/\btwRMTObjectIx_Close\b/g, 'terrestrial object'],
        [/\btwRMPObjectIx_Close\b/g, 'physical object'],
        [/\btwRMCObjectIx\b/g, 'celestial object ID'],
        [/\btwRMTObjectIx\b/g, 'terrestrial object ID'],
        [/\btwRMPObjectIx\b/g, 'physical object ID'],
        [/\btwRMRootIx\b/g, 'root ID'],
        [/\btwRPersonaIx\b/g, 'session ID'],
        [/\bType_bType\b/g, 'objectType'],
        [/\bType_bSubtype\b/g, 'objectSubtype'],
        [/\bType_bFiction\b/g, 'fiction flag'],
        [/\bType_bMovable\b/g, 'movable flag'],
        [/\bwClass\b/g, 'object class'],
        [/\bSURFACE\b/g, 'celestial:surface'],
        [/\bPARCEL\b/g, 'terrestrial:parcel'],
        [/\bRMCOBJECT_OPEN\b/g, 'create celestial child'],
        [/\bRMTOBJECT_OPEN\b/g, 'create terrestrial child'],
        [/\bRMPOBJECT_OPEN\b/g, 'create physical child'],
        [/\bRMCOBJECT_CLOSE\b/g, 'delete celestial child'],
        [/\bRMTOBJECT_CLOSE\b/g, 'delete terrestrial child'],
        [/\bRMPOBJECT_CLOSE\b/g, 'delete physical child'],
    ];
    static ERROR_REWRITES = [
        [/Parent's Type_bType must be equal to SURFACE when its parent's class is RMCOBJECT/,
            'celestial:surface is the only celestial type that accepts terrestrial children'],
        [/Parent's Type_bType must be equal to PARCEL when its parent's class is RMTOBJECT/,
            'terrestrial:parcel is the only terrestrial type that accepts physical children'],
    ];
    translateError(raw) {
        for (const [pattern, replacement] of ManifolderClient.ERROR_REWRITES) {
            if (pattern.test(raw))
                return replacement;
        }
        let translated = raw;
        for (const [pattern, replacement] of ManifolderClient.TERM_SUBSTITUTIONS) {
            translated = translated.replace(pattern, replacement);
        }
        return translated;
    }
    formatResponseError(operation, response) {
        const details = [];
        const resultSet = response.aResultSet?.[0];
        if (Array.isArray(resultSet)) {
            for (const row of resultSet) {
                if (row?.sError) {
                    details.push(this.translateError(row.sError));
                }
            }
        }
        const suffix = details.length > 0 ? `: ${details.join('; ')}` : '';
        return `${operation}: error ${response.nResult}${suffix}`;
    }
    sendAction(pObject, actionName, fillPayload, timeoutMs = 30000) {
        const pIAction = pObject.Request(actionName);
        if (!pIAction) {
            const message = actionName === 'SEARCH'
                ? 'Search is only available for celestial or terrestrial roots'
                : `Cannot ${this.translateError(actionName)} under this parent type`;
            return Promise.reject(new Error(message));
        }
        fillPayload(pIAction.pRequest);
        return this._sendAction(pIAction, timeoutMs).catch((err) => {
            if (err?.message === 'Request timeout') {
                throw new Error(`Timeout waiting for ${actionName} action response`);
            }
            throw err;
        });
    }
    _sendAction(pIAction, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
            pIAction.Send(this, (action) => {
                clearTimeout(timeoutId);
                resolve(action.pResponse);
            });
        });
    }
    getChildIds(pObject) {
        const childIds = [];
        this.enumAllChildTypes(pObject, (child) => {
            if (child?.twObjectIx && child?.wClass_Object) {
                childIds.push(formatObjectRef(child.wClass_Object, child.twObjectIx));
            }
        });
        return childIds;
    }
    /**
     * @param {any} rmx
     * @returns {FabricObject}
     */
    rmxToFabricObject(rmx) {
        const id = this.getPrefixedId(rmx);
        const name = this.getObjectName(rmx);
        const nChildren = rmx.nChildren ?? 0;
        const childIds = this.getChildIds(rmx);
        // If nChildren > 0 but no children enumerated, they haven't been loaded yet
        const children = (nChildren > 0 && childIds.length === 0) ? null : childIds;
        const parentId = rmx.twParentIx && rmx.wClass_Parent
            ? formatObjectRef(rmx.wClass_Parent, rmx.twParentIx)
            : null;
        return {
            id,
            parentId,
            name,
            transform: {
                position: {
                    x: rmx.pTransform?.vPosition?.dX ?? 0,
                    y: rmx.pTransform?.vPosition?.dY ?? 0,
                    z: rmx.pTransform?.vPosition?.dZ ?? 0,
                },
                rotation: {
                    x: rmx.pTransform?.qRotation?.dX ?? 0,
                    y: rmx.pTransform?.qRotation?.dY ?? 0,
                    z: rmx.pTransform?.qRotation?.dZ ?? 0,
                    w: rmx.pTransform?.qRotation?.dW ?? 1,
                },
                scale: {
                    x: rmx.pTransform?.vScale?.dX ?? 1,
                    y: rmx.pTransform?.vScale?.dY ?? 1,
                    z: rmx.pTransform?.vScale?.dZ ?? 1,
                },
            },
            resourceReference: rmx.pResource?.sReference || null,
            resourceName: rmx.pResource?.sName || null,
            bound: rmx.pBound ? {
                x: rmx.pBound.dX ?? 0,
                y: rmx.pBound.dY ?? 0,
                z: rmx.pBound.dZ ?? 0,
            } : null,
            classId: rmx.wClass_Object,
            subtype: rmx.pType?.bType ?? 0,
            children,
            orbit: rmx.wClass_Object === 71 && rmx.pOrbit_Spin ? {
                period: rmx.pOrbit_Spin.tmPeriod ?? 0,
                start: rmx.pOrbit_Spin.tmStart ?? 0,
                a: rmx.pOrbit_Spin.dA ?? 0,
                b: rmx.pOrbit_Spin.dB ?? 0,
            } : undefined,
            properties: rmx.wClass_Object === 71 && rmx.pProperties ? {
                mass: rmx.pProperties.fMass ?? 0,
                gravity: rmx.pProperties.fGravity ?? 0,
                color: rmx.pProperties.fColor ?? 0,
                brightness: rmx.pProperties.fBrightness ?? 0,
                reflectivity: rmx.pProperties.fReflectivity ?? 0,
            } : undefined,
        };
    }
    /**
     * @returns {string}
     */
    getResourceRootUrl() {
        return this.pFabric?.pMSFConfig?.map?.sRootUrl || '';
    }
}
const COMMON_CLIENT_METHODS = /** @type {const} */ ([
    'connect',
    'disconnect',
    'getResourceRootUrl',
]);
const SUBSCRIPTION_ONLY_METHODS = /** @type {const} */ ([
    'on',
    'off',
    'openModel',
    'closeModel',
    'subscribe',
    'enumerateChildren',
    'searchNodes',
]);
const PROMISE_ONLY_METHODS = /** @type {const} */ ([
    'getStatus',
    'listScenes',
    'openScene',
    'createScene',
    'deleteScene',
    'listObjects',
    'getObject',
    'createObject',
    'updateObject',
    'deleteObject',
    'moveObject',
    'bulkUpdate',
    'findObjects',
]);
const SUBSCRIPTION_CLIENT_METHODS = /** @type {const} */ ([
    ...COMMON_CLIENT_METHODS,
    ...SUBSCRIPTION_ONLY_METHODS,
]);
const PROMISE_CLIENT_METHODS = /** @type {const} */ ([
    ...COMMON_CLIENT_METHODS,
    ...PROMISE_ONLY_METHODS,
]);
/**
 * @typedef {{ connected: ManifolderClient['connected'] } & Pick<ManifolderClient, (typeof COMMON_CLIENT_METHODS)[number]>} IManifolderClientCommon
 * @typedef {IManifolderClientCommon & Pick<ManifolderClient, (typeof SUBSCRIPTION_ONLY_METHODS)[number]>} IManifolderSubscriptionClient
 * @typedef {IManifolderClientCommon & Pick<ManifolderClient, (typeof PROMISE_ONLY_METHODS)[number]>} IManifolderPromiseClient
 */
/**
 * @template {readonly (keyof ManifolderClient)[]} TMethodNames
 * @param {ManifolderClient} client
 * @param {TMethodNames} methodNames
 * @returns {{ readonly connected: ManifolderClient['connected'] } & Readonly<Pick<ManifolderClient, TMethodNames[number]>>}
 */
function createClientView(client, methodNames) {
    const view = {};
    Object.defineProperty(view, 'connected', {
        enumerable: true,
        get: () => client.connected,
    });
    for (const methodName of methodNames) {
        view[methodName] = client[methodName].bind(client);
    }
    return Object.freeze(view);
}
/**
 * @param {ManifolderClient} client
 * @returns {IManifolderSubscriptionClient}
 */
export function asManifolderSubscriptionClient(client) {
    return createClientView(client, SUBSCRIPTION_CLIENT_METHODS);
}
/**
 * @param {ManifolderClient} client
 * @returns {IManifolderPromiseClient}
 */
export function asManifolderPromiseClient(client) {
    return createClientView(client, PROMISE_CLIENT_METHODS);
}
/**
 * @returns {IManifolderSubscriptionClient}
 */
export function createManifolderSubscriptionClient() {
    return asManifolderSubscriptionClient(new ManifolderClient());
}
/**
 * @returns {IManifolderPromiseClient}
 */
export function createManifolderPromiseClient() {
    return asManifolderPromiseClient(new ManifolderClient());
}
