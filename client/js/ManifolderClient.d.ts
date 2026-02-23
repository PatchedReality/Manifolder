/**
 * Normalize a fabric URL to a canonical form used for deterministic scope IDs.
 * @param {string} url
 * @returns {string}
 */
export function normalizeUrl(url: string): string;
/**
 * @param {string} normalizedInput
 * @returns {Promise<FabricScopeId>}
 */
export function computeScopeId(normalizedInput: string): Promise<FabricScopeId>;
/**
 * @param {string} fabricUrl
 * @returns {Promise<FabricScopeId>}
 */
export function computeRootScopeId(fabricUrl: string): Promise<FabricScopeId>;
/**
 * @param {NodeUid} parentNodeUid
 * @param {string} childFabricUrl
 * @returns {Promise<FabricScopeId>}
 */
export function computeChildScopeId(parentNodeUid: NodeUid, childFabricUrl: string): Promise<FabricScopeId>;
/**
 * @param {FabricScopeId} scopeId
 * @param {number} classId
 * @param {number} numericId
 * @returns {NodeUid}
 */
export function computeNodeUid(scopeId: FabricScopeId, classId: number, numericId: number): NodeUid;
/**
 * @param {ManifolderClient} client
 * @returns {IManifolderSubscriptionClient}
 */
export function asManifolderSubscriptionClient(client: ManifolderClient): IManifolderSubscriptionClient;
/**
 * @param {ManifolderClient} client
 * @returns {IManifolderPromiseClient}
 */
export function asManifolderPromiseClient(client: ManifolderClient): IManifolderPromiseClient;
/**
 * @returns {IManifolderSubscriptionClient}
 */
export function createManifolderSubscriptionClient(): IManifolderSubscriptionClient;
/**
 * @returns {IManifolderPromiseClient}
 */
export function createManifolderPromiseClient(): IManifolderPromiseClient;
export class SingleScopeClient {
    static eSTATE: {
        NOTREADY: number;
        LOADING: number;
        READY: number;
    };
    static CLASS_ID_TO_TYPE: {
        [ClassIds.RMPObject]: string;
        [ClassIds.RMTObject]: string;
        [ClassIds.RMCObject]: string;
    };
    static CHILD_CLASS_TYPES: string[];
    static TERM_SUBSTITUTIONS: (string | RegExp)[][];
    static ERROR_REWRITES: (string | RegExp)[][];
    pFabric: any;
    pLnG: any;
    pRMRoot: any;
    connected: boolean;
    loggedIn: boolean;
    fabricUrl: any;
    currentSceneId: any;
    adminKey: any;
    loginAttempted: boolean;
    objectCache: Map<any, any>;
    pendingReady: Map<any, any>;
    attachedObjects: Set<any>;
    connectResolve: any;
    connectReject: any;
    connectionGeneration: number;
    sceneWClass: any;
    sceneObjectIx: any;
    callbacks: {
        connected: any[];
        disconnected: any[];
        error: any[];
        status: any[];
        mapData: any[];
        nodeInserted: any[];
        nodeUpdated: any[];
        nodeDeleted: any[];
        modelReady: any[];
    };
    searchableRMCObjectIndices: any[];
    searchableRMTObjectIndices: any[];
    rootReadyEmitted: boolean;
    pendingMutationWaits: Set<any>;
    recentMutationEvents: any[];
    mutationConfirmTimeoutMs: number;
    isDisconnecting: boolean;
    bootstrapRequireHandle: any;
    IsReady(): boolean;
    _acquireBootstrapRequirements(): void;
    _releaseBootstrapRequirements(): void;
    getObjectName(pObject: any): any;
    getObjectKey(pObject: any): string;
    getPrefixedId(pObject: any): string;
    _isChildOf(parent: any, child: any): boolean;
    _pruneMutationEvents(): void;
    _recordMutationEvent(event: any): void;
    _createMutationWait(matchFn: any, description: any, timeoutMs?: number, minTimestamp?: number): {
        promise: Promise<any>;
        cancel: () => void;
    };
    _confirmMutation(matchFn: any, description: any, timeoutMs?: number, minTimestamp?: number): Promise<void>;
    waitForReady(pObject: any, timeoutMs?: number): Promise<any>;
    onReadyState(pNotice: any): void;
    onInserted(pNotice: any): void;
    onUpdated(pNotice: any): void;
    attachTo(pObject: any): void;
    detachFrom(pObject: any): void;
    detachAll(): void;
    onChanged(pNotice: any): void;
    onDeleting(pNotice: any): void;
    /**
     * @param {string} fabricUrl
     * @param {string | ConnectOptions} [optionsOrAdminKey]
     * @param {number} [timeoutMs]
     * @returns {Promise<any>}
     */
    connect(fabricUrl: string, optionsOrAdminKey?: string | ConnectOptions, timeoutMs?: number): Promise<any>;
    handleReadyState(pNotice: any): void;
    handleUnexpectedDisconnect(): void;
    start(): void;
    openAndWait(modelType: any, objectId: any, timeoutMs: any): Promise<any>;
    openWithKnownType(objectId: any, classId: any, timeoutMs: any): Promise<any>;
    enumAllChildTypes(pObject: any, callback: any): void;
    /**
     * @param {ModelRef} params
     * @returns {void}
     */
    openModel({ sID, twObjectIx }: ModelRef): void;
    /**
     * @param {ModelRef} params
     * @returns {void}
     */
    closeModel({ sID, twObjectIx }: ModelRef): void;
    /**
     * @param {any} model
     * @returns {any[]}
     */
    enumerateChildren(model: any): any[];
    _collectSearchableIndices(model: any): void;
    _collectSearchIndicesFromSceneRoot(rmcObjectIndices: any, rmtObjectIndices: any): void;
    /**
     * @param {string} searchText
     * @returns {Promise<SearchNodesResult>}
     */
    searchNodes(searchText: string): Promise<SearchNodesResult>;
    _searchObjectType(objectType: any, objectIx: any, searchText: any): Promise<{
        matches: any[];
        paths: any[];
        unavailable: any;
    } | {
        matches: {
            id: any;
            name: any;
            type: any;
            nodeType: any;
            parentType: any;
            parentId: any;
            matchOrder: number;
            rootId: any;
        }[];
        paths: {
            id: any;
            name: any;
            type: any;
            nodeType: any;
            parentType: any;
            parentId: any;
            ancestorDepth: any;
            matchOrder: any;
            rootId: any;
        }[];
        unavailable?: undefined;
    }>;
    _getClassID(wClass: any): any;
    /**
     * @param {ClientEvent} event
     * @param {ClientEventHandler} handler
     * @returns {void}
     */
    on(event: ClientEvent, handler: ClientEventHandler): void;
    /**
     * @param {ClientEvent} event
     * @param {ClientEventHandler} handler
     * @returns {void}
     */
    off(event: ClientEvent, handler: ClientEventHandler): void;
    _emit(event: any, data: any): void;
    /**
     * @returns {Promise<void>}
     */
    disconnect(): Promise<void>;
    /**
     * @returns {ConnectionStatus}
     */
    getStatus(): ConnectionStatus;
    /**
     * @returns {Promise<Scene[]>}
     */
    listScenes(): Promise<Scene[]>;
    /**
     * @param {string} sceneId
     * @returns {Promise<FabricObject>}
     */
    openScene(sceneId: string): Promise<FabricObject>;
    loadDirectChildren(pObject: any): Promise<void>;
    /**
     * @param {string} name
     * @param {string} [objectType]
     * @returns {Promise<Scene>}
     */
    createScene(name: string, objectType?: string): Promise<Scene>;
    /**
     * @param {string} sceneId
     * @returns {Promise<void>}
     */
    deleteScene(sceneId: string): Promise<void>;
    /**
     * @param {string} scopeId
     * @param {ObjectFilter} [filter]
     * @returns {Promise<FabricObject[]>}
     */
    listObjects(scopeId: string, filter?: ObjectFilter): Promise<FabricObject[]>;
    /**
     * @param {string} objectId
     * @returns {Promise<FabricObject>}
     */
    getObject(objectId: string): Promise<FabricObject>;
    /**
     * @param {CreateObjectParams} params
     * @returns {Promise<FabricObject>}
     */
    createObject(params: CreateObjectParams): Promise<FabricObject>;
    /**
     * @param {UpdateObjectParams} params
     * @returns {Promise<FabricObject>}
     */
    updateObject(params: UpdateObjectParams): Promise<FabricObject>;
    /**
     * @param {string} objectId
     * @returns {Promise<void>}
     */
    deleteObject(objectId: string): Promise<void>;
    /**
     * @param {string} objectId
     * @param {string} newParentId
     * @param {boolean} [skipRefetch]
     * @returns {Promise<FabricObject>}
     */
    moveObject(objectId: string, newParentId: string, skipRefetch?: boolean): Promise<FabricObject>;
    /**
     * @param {BulkOperation[]} operations
     * @returns {Promise<{ success: number; failed: number; createdIds: string[]; errors: string[] }>}
     */
    bulkUpdate(operations: BulkOperation[]): Promise<{
        success: number;
        failed: number;
        createdIds: string[];
        errors: string[];
    }>;
    loadFullTree(scopeId: any): Promise<any[]>;
    /**
     * @param {string} scopeId
     * @param {SearchQuery} query
     * @returns {Promise<FabricObject[]>}
     */
    findObjects(scopeId: string, query: SearchQuery): Promise<FabricObject[]>;
    serverSearch(scopeId: any, query: any): Promise<import("../types.js").FabricObject[]>;
    ensureConnected(): Promise<void>;
    translateError(raw: any): any;
    formatResponseError(operation: any, response: any): string;
    sendAction(pObject: any, actionName: any, fillPayload: any, timeoutMs?: number): Promise<any>;
    _sendAction(pIAction: any, timeoutMs?: number): Promise<any>;
    getChildIds(pObject: any): any[];
    /**
     * @param {any} rmx
     * @returns {FabricObject}
     */
    rmxToFabricObject(rmx: any): FabricObject;
    /**
     * @returns {string}
     */
    getResourceRootUrl(): string;
}
export class ManifolderClient {
    /** @type {Map<FabricScopeId, ScopeInfo>} */
    scopeRegistry: Map<FabricScopeId, ScopeInfo>;
    scopeRuntimes: Map<any, any>;
    rootConnectInFlight: Map<any, any>;
    closingScopes: Set<any>;
    callbacks: {
        connected: any[];
        disconnected: any[];
        error: any[];
        status: any[];
        mapData: any[];
        nodeInserted: any[];
        nodeUpdated: any[];
        nodeDeleted: any[];
        modelReady: any[];
    };
    /**
     * @param {ClientEvent} event
     * @param {ClientEventHandler} handler
     * @returns {void}
     */
    on(event: ClientEvent, handler: ClientEventHandler): void;
    /**
     * @param {ClientEvent} event
     * @param {ClientEventHandler} handler
     * @returns {void}
     */
    off(event: ClientEvent, handler: ClientEventHandler): void;
    _emit(event: any, data: any): void;
    get connected(): boolean;
    /**
     * @param {ScopeInfo} scopeInfo
     * @returns {ScopeInfo}
     */
    _registerScope(scopeInfo: ScopeInfo): ScopeInfo;
    /**
     * @param {FabricScopeId} scopeId
     * @returns {boolean}
     */
    _unregisterScope(scopeId: FabricScopeId): boolean;
    /**
     * @param {FabricScopeId} scopeId
     * @returns {ScopeInfo | null}
     */
    _getScope(scopeId: FabricScopeId): ScopeInfo | null;
    /**
     * @returns {ScopeInfo[]}
     */
    listScopes(): ScopeInfo[];
    /**
     * @param {FabricScopeId} candidateChildScopeId
     * @param {FabricScopeId} currentScopeId
     * @returns {{ isCycle: true; existingScopeId: FabricScopeId } | { isCycle: false }}
     */
    _detectCycle(candidateChildScopeId: FabricScopeId, currentScopeId: FabricScopeId): {
        isCycle: true;
        existingScopeId: FabricScopeId;
    } | {
        isCycle: false;
    };
    /**
     * @param {FabricScopeId} scopeId
     * @returns {SingleScopeClient}
     */
    _requireScopeRuntime(scopeId: FabricScopeId): SingleScopeClient;
    /**
     * @returns {SingleScopeClient}
     */
    _createScopeRuntime(): SingleScopeClient;
    /**
     * @param {FabricScopeId} scopeId
     * @param {SingleScopeClient} runtime
     * @returns {void}
     */
    _wireScopeRuntime(scopeId: FabricScopeId, runtime: SingleScopeClient): void;
    /**
     * @template {keyof SingleScopeClient} TMethodName
     * @param {SingleScopeClient} runtime
     * @param {TMethodName} methodName
     * @param {...any} args
     * @returns {any}
     */
    /**
     * @param {string | null | undefined} className
     * @returns {number | null}
     */
    _classNameToId(className: string | null | undefined): number | null;
    /**
     * @param {FabricScopeId} scopeId
     * @param {FabricObject} obj
     * @returns {FabricObject}
     */
    _enrichObjectWithScope(scopeId: FabricScopeId, obj: FabricObject): FabricObject;
    /**
     * @param {FabricScopeId} scopeId
     * @returns {string | null}
     */
    _getScopeFabricKey(scopeId: FabricScopeId): string | null;
    /**
     * Invalidate object cache entries across all open scopes connected to the same fabric URL.
     * @param {FabricScopeId} scopeId
     * @param {string} objectId
     * @returns {void}
     */
    _invalidateObjectCachesAcrossFabric(scopeId: FabricScopeId, objectId: string): void;
    /**
     * @param {FabricScopeId} scopeId
     * @param {Array<string | null | undefined>} objectIds
     * @returns {void}
     */
    _invalidateObjectIdsAcrossFabric(scopeId: FabricScopeId, objectIds: Array<string | null | undefined>): void;
    connectRoot({ fabricUrl, adminKey, timeoutMs }: {
        fabricUrl: any;
        adminKey?: string;
        timeoutMs?: number;
    }): Promise<any>;
    closeScope({ scopeId, cascade }: {
        scopeId: any;
        cascade?: boolean;
    }): Promise<{
        closedScopeIds: any[];
    }>;
    getScopeStatus({ scopeId }: {
        scopeId: any;
    }): {
        scopeId: any;
        connected: boolean;
        fabricUrl: string | null;
        currentSceneId: string | null;
        currentSceneName: string | null;
        resourceRootUrl: string | null;
    };
    getResourceRootUrl({ scopeId }: {
        scopeId: any;
    }): string;
    openModel({ scopeId, sID, twObjectIx }: {
        scopeId: any;
        sID: any;
        twObjectIx: any;
    }): void;
    closeModel({ scopeId, sID, twObjectIx }: {
        scopeId: any;
        sID: any;
        twObjectIx: any;
    }): void;
    enumerateChildren({ scopeId, model }: {
        scopeId: any;
        model: any;
    }): any[];
    searchNodes({ scopeId, searchText }: {
        scopeId: any;
        searchText: any;
    }): Promise<SearchNodesResult>;
    listScenes({ scopeId }: {
        scopeId: any;
    }): Promise<{
        scopeId: any;
        id: string;
        name: string;
        rootObjectId: string;
        classId: number;
        url?: string;
    }[]>;
    openScene({ scopeId, sceneId }: {
        scopeId: any;
        sceneId: any;
    }): Promise<import("../types.js").FabricObject>;
    createScene({ scopeId, name, objectType }: {
        scopeId: any;
        name: any;
        objectType: any;
    }): Promise<{
        scopeId: any;
        id: string;
        name: string;
        rootObjectId: string;
        classId: number;
        url?: string;
    }>;
    deleteScene({ scopeId, sceneId }: {
        scopeId: any;
        sceneId: any;
    }): Promise<void>;
    listObjects({ scopeId, anchorObjectId, filter }: {
        scopeId: any;
        anchorObjectId: any;
        filter: any;
    }): Promise<import("../types.js").FabricObject[]>;
    getObject({ scopeId, objectId }: {
        scopeId: any;
        objectId: any;
    }): Promise<import("../types.js").FabricObject>;
    createObject({ scopeId, ...createParams }: {
        [x: string]: any;
        scopeId: any;
    }): Promise<import("../types.js").FabricObject>;
    updateObject({ scopeId, ...updateParams }: {
        [x: string]: any;
        scopeId: any;
    }): Promise<import("../types.js").FabricObject>;
    deleteObject({ scopeId, objectId }: {
        scopeId: any;
        objectId: any;
    }): Promise<void>;
    moveObject({ scopeId, objectId, newParentId, skipRefetch }: {
        scopeId: any;
        objectId: any;
        newParentId: any;
        skipRefetch: any;
    }): Promise<import("../types.js").FabricObject>;
    bulkUpdate({ scopeId, operations }: {
        scopeId: any;
        operations: any;
    }): Promise<{
        success: number;
        failed: number;
        createdIds: string[];
        errors: string[];
    }>;
    findObjects({ scopeId, anchorObjectId, query }: {
        scopeId: any;
        anchorObjectId: any;
        query: any;
    }): Promise<import("../types.js").FabricObject[]>;
    followAttachment({ scopeId, objectId, autoOpenRoot }: {
        scopeId: any;
        objectId: any;
        autoOpenRoot?: boolean;
    }): Promise<{
        parentScopeId: any;
        attachmentNodeUid: string;
        childScopeId: string;
        childFabricUrl: string;
        reused: boolean;
    }>;
}
export type BulkOperation = import("../types.js").BulkOperation;
export type ConnectionStatus = import("../types.js").ConnectionStatus;
export type ConnectRootParams = import("../types.js").ConnectRootParams;
export type CreateObjectParams = import("../types.js").CreateObjectParams;
export type FabricObject = import("../types.js").FabricObject;
export type FabricScopeId = import("../types.js").FabricScopeId;
export type FollowAttachmentParams = import("../types.js").FollowAttachmentParams;
export type FollowAttachmentResult = import("../types.js").FollowAttachmentResult;
export type NodeUid = import("../types.js").NodeUid;
export type ObjectFilter = import("../types.js").ObjectFilter;
export type Scene = import("../types.js").Scene;
export type SearchQuery = import("../types.js").SearchQuery;
export type ScopeInfo = import("../types.js").ScopeInfo;
export type ScopeStatus = import("../types.js").ScopeStatus;
export type UpdateObjectParams = import("../types.js").UpdateObjectParams;
export type ConnectOptions = {
    adminKey?: string;
    timeoutMs?: number;
};
export type ClientEvent = "connected" | "disconnected" | "error" | "status" | "mapData" | "nodeInserted" | "nodeUpdated" | "nodeDeleted" | "modelReady";
export type ClientEventHandler = (data: any) => void;
export type ModelRef = {
    sID: string;
    twObjectIx: number;
};
export type SearchNodesResult = {
    matches: any[];
    paths: any[];
    unavailable: string[];
};
export type IManifolderClientCommon = {
    connected: ManifolderClient["connected"];
} & Pick<ManifolderClient, (typeof COMMON_CLIENT_METHODS)[number]>;
export type IManifolderSubscriptionClient = IManifolderClientCommon & Pick<ManifolderClient, (typeof SUBSCRIPTION_ONLY_METHODS)[number]>;
export type IManifolderPromiseClient = IManifolderClientCommon & Pick<ManifolderClient, (typeof PROMISE_ONLY_METHODS)[number]>;
declare namespace ClassIds {
    let RMRoot: number;
    let RMCObject: number;
    let RMTObject: number;
    let RMPObject: number;
}
declare const COMMON_CLIENT_METHODS: readonly ["connectRoot", "closeScope", "getScopeStatus", "listScopes", "followAttachment", "getResourceRootUrl"];
declare const SUBSCRIPTION_ONLY_METHODS: readonly ["on", "off", "openModel", "closeModel", "enumerateChildren", "searchNodes"];
declare const PROMISE_ONLY_METHODS: readonly ["listScenes", "openScene", "createScene", "deleteScene", "listObjects", "getObject", "createObject", "updateObject", "deleteObject", "moveObject", "bulkUpdate", "findObjects"];
export {};
