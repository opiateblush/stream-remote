import { 
    NotImplementedError 
} from "../utils.js"

class UnsupportedRequestTypeError extends Error
{
    constructor(requestType = "")
    {
        super();
        this.name = "Unsupported Request Type Error";
        this.message = "Request of type " + requestType + " is not supported.";
    }
}

class UnsupportedEventTypeError extends Error
{
    constructor(eventType = "")
    {
        super();
        this.name = "Unsupported Event Type Error";
        this.message = "Event of type " + eventType + " is not supported.";
    }
}

class StreamRemoteSocket
{
    constructor()
    {
        this._callbacks = {};
    }
    
    /**
     * 
     * @param {Object} connectionProperties 
     */
    async connect(connectionProperties = {})
    {
        throw new NotImplementedError();
    }

    disconnect()
    {
        throw new NotImplementedError();
    }

    /**
     * @return {boolean}
     */
    isConnected()
    {
        throw new NotImplementedError();
    }

    isEventObserved(eventType)
    {
        return eventType in this._callbacks;
    }

    _registerEvent(eventType)
    {
        throw new NotImplementedError();
    }

    async request(requestType, requestData = undefined)
    {
        if (!this.getSupportedRequestTypes().includes(requestType))
            throw new UnsupportedRequestTypeError(requestType);
        
        return this._sendRequest(requestType, requestData);
    }

    async _sendRequest(requestType, requestData = undefined)
    {
        throw new NotImplementedError();
    }

    addEventListener(eventType, eventListener, strict = false)
    {
        if (!this.getSupportedEventTypes().includes(eventType))
        {
            if (strict)
                throw new UnsupportedEventTypeError(eventType);
        }
        else
        {
            if (!(eventType in this._callbacks))
            {
                this._callbacks[eventType] = [];
                this._registerEvent(eventType)
            }
                
            this._callbacks[eventType].push(eventListener);
        }
    }

    _broadcastEvent(eventType, eventData = undefined)
    {
        if (eventType in this._callbacks)
            for (let eventListener of this._callbacks[eventType])
                if (eventData === undefined)    
                    eventListener();
                else
                    eventListener(eventData);
    }

    /**
     * 
     * @param {string} requestType 
     * @returns {boolean}
     */
    isSupportedRequest(requestType)
    {
        return this.getSupportedRequestTypes().includes(requestType);
    }

    /**
     * 
     * @param {string} eventType 
     * @returns {boolean}
     */
    isSupportedEvent(eventType)
    {
        return this.getSupportedEventTypes().includes(eventType);
    }

    /**
     * @return {Array}
     */
     getSupportedRequestTypes()
     {
         throw new NotImplementedError();
     }
 
     /**
      * @return {Array}
      */
     getSupportedEventTypes()
     {
         throw new NotImplementedError();
     }
}

// Request Types

const REQUEST_STREAM_TOGGLE = "StreamToggle";
const REQUEST_RECORD_TOGGLE = "RecordToggle";
const REQUEST_REPLAY_TOGGLE = "ReplayToggle";

const REQUEST_SCENE_NAMES = "SceneNames";
const REQUEST_SCENE_SET = "SceneSet";
const REQUEST_SCENE_GET = "SceneGet";
const REQUEST_STREAM_TIME = "StreamTime";
const REQUEST_RECORD_TIME = "RecordTime";
const REQUEST_REPLAY_SAVE = "ReplaySave";
const REQUEST_REPLAY_ACTIVE = "ReplayActive";

const REQUEST_LIST_V1 = [
    REQUEST_STREAM_TOGGLE,
    REQUEST_RECORD_TOGGLE,
    REQUEST_SCENE_NAMES,
    REQUEST_SCENE_SET,
    REQUEST_SCENE_GET,
    REQUEST_STREAM_TIME,
    REQUEST_RECORD_TIME
];

const REQUEST_LIST_V2 = REQUEST_LIST_V1.slice().concat([
    REQUEST_REPLAY_TOGGLE,
    REQUEST_REPLAY_SAVE,
    REQUEST_REPLAY_ACTIVE
]);

// Event Types

const EVENT_CONNECTED = "Connected";
const EVENT_DISCONNECTED = "Disconnected";

const EVENT_STREAM_STARTED = "StreamStarted";
const EVENT_STREAM_STARTING = "StreamStarting";
const EVENT_STREAM_STOPPED = "StreamStopped";
const EVENT_STREAM_STOPPING = "StreamStopping";

const EVENT_RECORD_STARTED = "RecordStarted";
const EVENT_RECORD_STARTING = "RecordStarting";
const EVENT_RECORD_STOPPED = "RecordStopped";
const EVENT_RECORD_STOPPING = "RecordStopping";

const EVENT_REPLAY_STARTED = "ReplayStarted";
const EVENT_REPLAY_STARTING = "ReplayStarting";
const EVENT_REPLAY_STOPPED = "ReplayStopped";
const EVENT_REPLAY_STOPPING = "ReplayStopping";

const EVENT_SCENE_SWITCHED = "SceneSwitched";
const EVENT_SCENES_CHANGED = "ScenesChanged";

const EVENT_STREAM_RECORD_TIME = "StreamRecordTime";

const EVENT_CPU_USAGE = "CpuUsage";
const EVENT_MEMORY_USAGE = "MemoryUsage";
const EVENT_FREE_DISK_SPACE = "FreeDiskSpace";

const EVENT_RENDERING_DROP = "RenderDrop";
const EVENT_ENCODING_DROP = "EncodingDrop";
const EVENT_STREAMING_DROP = "StreamingDrop";

const EVENT_LIST_V1 = [
    EVENT_CONNECTED,
    EVENT_DISCONNECTED,
    EVENT_STREAM_STARTED,
    EVENT_STREAM_STARTING,
    EVENT_STREAM_STOPPED,
    EVENT_STREAM_STOPPING,
    EVENT_RECORD_STARTED,
    EVENT_RECORD_STARTING,
    EVENT_RECORD_STOPPED,
    EVENT_RECORD_STOPPING,
    EVENT_SCENE_SWITCHED,
    EVENT_SCENES_CHANGED
];

const EVENT_LIST_V2 = EVENT_LIST_V1.slice().concat([
    EVENT_REPLAY_STARTED,
    EVENT_REPLAY_STARTING,
    EVENT_REPLAY_STOPPED,
    EVENT_REPLAY_STOPPING
]);

const EVENT_LIST_V3 = EVENT_LIST_V2.slice().concat([
    EVENT_STREAM_RECORD_TIME,
    EVENT_CPU_USAGE,
    EVENT_MEMORY_USAGE,
    EVENT_FREE_DISK_SPACE,
    EVENT_RENDERING_DROP,
    EVENT_ENCODING_DROP,
    EVENT_STREAMING_DROP
]);

const SOCKET_MODULE_NAME = "socket.js";

/**
 * 
 * @param {string} socketName 
 * 
 * @returns {Promise}
 */
async function createStreamRemoteSocket(socketName)
{
    let module = await import(`./${socketName.toLowerCase().replace(" ", "-")}/${SOCKET_MODULE_NAME}`);
    return module.createStreamRemoteSocket();
}


export {
    StreamRemoteSocket
};

export {
    REQUEST_STREAM_TOGGLE,
    REQUEST_RECORD_TOGGLE,
    REQUEST_REPLAY_TOGGLE,
    REQUEST_REPLAY_SAVE,
    REQUEST_REPLAY_ACTIVE,
    REQUEST_SCENE_NAMES,
    REQUEST_SCENE_SET,
    REQUEST_SCENE_GET,
    REQUEST_STREAM_TIME,
    REQUEST_RECORD_TIME
};

export {
    EVENT_CONNECTED,
    EVENT_DISCONNECTED,
    EVENT_STREAM_STARTED,
    EVENT_STREAM_STARTING,
    EVENT_STREAM_STOPPED,
    EVENT_STREAM_STOPPING,
    EVENT_RECORD_STARTED,
    EVENT_RECORD_STARTING,
    EVENT_RECORD_STOPPED,
    EVENT_RECORD_STOPPING,
    EVENT_REPLAY_STARTED,
    EVENT_REPLAY_STARTING,
    EVENT_REPLAY_STOPPED,
    EVENT_REPLAY_STOPPING,
    EVENT_SCENE_SWITCHED,
    EVENT_STREAM_RECORD_TIME,
    EVENT_SCENES_CHANGED,
    EVENT_CPU_USAGE,
    EVENT_MEMORY_USAGE,
    EVENT_FREE_DISK_SPACE,
    EVENT_RENDERING_DROP,
    EVENT_ENCODING_DROP,
    EVENT_STREAMING_DROP
};

export {
    REQUEST_LIST_V1,
    REQUEST_LIST_V2,
    EVENT_LIST_V1,
    EVENT_LIST_V2,
    EVENT_LIST_V3
};

export {
    createStreamRemoteSocket
};