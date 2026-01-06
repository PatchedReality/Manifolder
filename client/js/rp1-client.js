/**
 * RP1Client - WebSocket client for browser to proxy communication
 * Handles connection, authentication, and map data requests
 */
export class RP1Client {
  constructor(url = 'ws://localhost:3000/ws') {
    this.url = url;
    this.ws = null;
    this.connected = false;

    this.callbacks = {
      connected: [],
      disconnected: [],
      error: [],
      mapData: [],
      nodeData: [],
      status: []
    };

    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  connect() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.connected) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.connected = true;
          this._emit('connected');
          resolve();
        };

        this.ws.onclose = () => {
          this.connected = false;
          this._emit('disconnected');
        };

        this.ws.onerror = (event) => {
          const error = new Error('WebSocket connection failed');
          this._emit('error', error);
          if (!this.connected) {
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  loadMap(url) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const requestId = this._nextRequestId();

      this.pendingRequests.set(requestId, {
        type: 'loadMap',
        resolve,
        reject,
        timestamp: Date.now()
      });

      this._send({
        type: 'loadMap',
        requestId,
        url
      });

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Map load timeout'));
        }
      }, 60000);
    });
  }

  getMapTree() {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const requestId = this._nextRequestId();

      this.pendingRequests.set(requestId, {
        type: 'getMapTree',
        resolve,
        reject,
        timestamp: Date.now()
      });

      this._send({
        type: 'getMapTree',
        requestId
      });

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Map tree request timeout'));
        }
      }, 60000);
    });
  }

  getNode(id, nodeType) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected'));
        return;
      }

      const requestId = this._nextRequestId();

      this.pendingRequests.set(requestId, {
        type: 'getNode',
        resolve,
        reject,
        timestamp: Date.now()
      });

      this._send({
        type: 'getNode',
        requestId,
        id,
        nodeType
      });

      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Node request timeout'));
        }
      }, 30000);
    });
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

  _send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  _nextRequestId() {
    return ++this.requestId;
  }

  _handleMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse message:', error);
      return;
    }

    const { type, requestId } = message;

    switch (type) {
      case 'mapData':
        this._handleMapData(message, requestId);
        break;

      case 'nodeData':
        this._handleNodeData(message, requestId);
        break;

      case 'error':
        this._handleError(message, requestId);
        break;

      case 'status':
        this._emit('status', message.message);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  }

  _handleMapData(message, requestId) {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      this.pendingRequests.delete(requestId);
      pending.resolve(message.tree);
    }

    this._emit('mapData', message.tree);
  }

  _handleNodeData(message, requestId) {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      this.pendingRequests.delete(requestId);
      pending.resolve(message.node);
    }

    this._emit('nodeData', message.node);
  }

  _handleError(message, requestId) {
    const error = new Error(message.message || 'Unknown error');

    if (requestId) {
      const pending = this.pendingRequests.get(requestId);
      if (pending) {
        this.pendingRequests.delete(requestId);
        pending.reject(error);
      }
    }

    this._emit('error', error);
  }
}
