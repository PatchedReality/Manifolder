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
export class ManifolderClient {
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
    subscribe({ sID, twObjectIx }: ModelRef): void;
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
export type BulkOperation = import("../types.js").BulkOperation;
export type ConnectionStatus = import("../types.js").ConnectionStatus;
export type CreateObjectParams = import("../types.js").CreateObjectParams;
export type FabricObject = import("../types.js").FabricObject;
export type ObjectFilter = import("../types.js").ObjectFilter;
export type Scene = import("../types.js").Scene;
export type SearchQuery = import("../types.js").SearchQuery;
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
declare const COMMON_CLIENT_METHODS: readonly ["connect", "disconnect", "getResourceRootUrl"];
declare const SUBSCRIPTION_ONLY_METHODS: readonly ["on", "off", "openModel", "closeModel", "subscribe", "enumerateChildren", "searchNodes"];
declare const PROMISE_ONLY_METHODS: readonly ["getStatus", "listScenes", "openScene", "createScene", "deleteScene", "listObjects", "getObject", "createObject", "updateObject", "deleteObject", "moveObject", "bulkUpdate", "findObjects"];
export {};
