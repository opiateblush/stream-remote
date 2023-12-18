import {
    OBSWebSocket
}
from "./lib/obs-ws.js"

import { 
    EVENT_CONNECTED,
    EVENT_DISCONNECTED,
    EVENT_STREAM_STARTED,
    EVENT_STREAM_STOPPED,
    EVENT_RECORD_STARTED,
    EVENT_RECORD_STOPPED,
    EVENT_REPLAY_STARTED,
    EVENT_REPLAY_STOPPED,
    EVENT_SCENE_SWITCHED,
    EVENT_STREAM_RECORD_TIME,
    EVENT_SCENES_CHANGED,
    EVENT_CPU_USAGE,
    EVENT_MEMORY_USAGE,
    EVENT_FREE_DISK_SPACE,
    EVENT_RENDERING_DROP,
    EVENT_ENCODING_DROP,
    EVENT_STREAMING_DROP,
    EVENT_RECORD_STARTING,
    EVENT_RECORD_STOPPING,
    EVENT_STREAM_STARTING,
    EVENT_STREAM_STOPPING,
    EVENT_REPLAY_STARTING,
    EVENT_REPLAY_STOPPING
} from "../socket.js";

import { 
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
} from "../socket.js";

import {
    REQUEST_LIST_V2,
    EVENT_LIST_V3
} from "../socket.js"

import { 
    StreamRemoteSocket
} from "../socket.js";

const DEFAULT_OBS_V5_ADDRESS = "127.0.0.1";
const DEFAULT_OBS_V5_PORT = 4455;
const DEFAULT_OBS_V5_PASSWORD = undefined;

const DEFAULT_OBS_V5_UPDATE_INTERVAL_MS = 2500;

const PROPERTY_OBS_V5_ADDRESS = "address";
const PROPERTY_OBS_V5_PORT = "port";
const PROPERTY_OBS_V5_PASSWORD = "password";

// currently not part of the connect form
const PROPERTY_OBS_V5_UPDATE_INTERVAL_MS = "update-interval";

const OBS_OUTPUT_STATE_STARTED = "OBS_WEBSOCKET_OUTPUT_STARTED"
const OBS_OUTPUT_STATE_STARTING = "OBS_WEBSOCKET_OUTPUT_STARTING"
const OBS_OUTPUT_STATE_STOPPED = "OBS_WEBSOCKET_OUTPUT_STOPPED"
const OBS_OUTPUT_STATE_STOPPING = "OBS_WEBSOCKET_OUTPUT_STOPPING"

class OBSRemoteSocketV5 extends StreamRemoteSocket
{
    constructor()
    {
        super();

        this._connectionProperties = {};

        this._updateRunning = false;
        this._updateReconnect = true;
        this._updateIntervalID = undefined;

        this._obsSocket = new OBSWebSocket();
        this._obsSocketConnected = false

        this._obsSocket.on("Identified", (data) => {
            this._obsSocketConnected = true
            this._broadcastEvent(EVENT_CONNECTED)
        });

        this._obsSocket.on("ConnectionClosed", (data) => {
            this._obsSocketConnected = false
            this._broadcastEvent(EVENT_DISCONNECTED)
        })
    }
    
    async connect(connectionProperties)
    {
        if (!(PROPERTY_OBS_V5_ADDRESS in connectionProperties))
            connectionProperties[PROPERTY_OBS_V5_ADDRESS] = DEFAULT_OBS_V5_ADDRESS;
        if (!(PROPERTY_OBS_V5_PORT in connectionProperties))
            connectionProperties[PROPERTY_OBS_V5_PORT] = DEFAULT_OBS_V5_PORT;
        if (!(PROPERTY_OBS_V5_PASSWORD in connectionProperties))
            connectionProperties[PROPERTY_OBS_V5_PASSWORD] = DEFAULT_OBS_V5_PASSWORD;
        
        if (!(PROPERTY_OBS_V5_UPDATE_INTERVAL_MS in connectionProperties))
            connectionProperties[PROPERTY_OBS_V5_UPDATE_INTERVAL_MS] = DEFAULT_OBS_V5_UPDATE_INTERVAL_MS;

        this._connectionProperties = connectionProperties;

        if (!this.isConnected() && this._updateIntervalID === undefined)
        {
            try
            {
                await this._connectOBSWebSocket();
            }
            finally
            {
                this._updateReconnect = true;
                this._updateIntervalID = setInterval(this._triggerUpdate.bind(this), this._connectionProperties[PROPERTY_OBS_V5_UPDATE_INTERVAL_MS]);
            }
        }
    }

    disconnect()
    {
        this._updateReconnect = false;
        
        if (this._updateIntervalID !== undefined)
        {
            clearInterval(this._updateIntervalID);
            this._updateIntervalID = undefined;
        }

        if (this._obsSocketConnected)
            this._obsSocket.disconnect();
    }

    isConnected()
    {
        return this._obsSocketConnected;
    }

    async _update()
    {
        this._updateRunning = true;

        try
        {
            if (this.isConnected())
            {
                if (this.isEventObserved(EVENT_STREAM_RECORD_TIME) || this.isEventObserved(EVENT_STREAMING_DROP) || this.isEventObserved(EVENT_STREAMING_DROP))
                {
                    let obsStreamStatus = await this._obsSocket.call("GetStreamStatus");
                    let obsRecordStatus = await this._obsSocket.call("GetRecordStatus");

                    let streamTime_s = obsStreamStatus["outputActive"] ? obsStreamStatus["outputDuration"] / 1000 : -1;
                    let recordTime_s = obsRecordStatus["outputActive"] ? obsRecordStatus["outputDuration"] / 1000 : -1;

                    let streamDrop = obsStreamStatus["outputActive"] ? obsStreamStatus["outputSkippedFrames"] / obsStreamStatus["outputTotalFrames"] : 0;

                    this._broadcastEvent(EVENT_STREAM_RECORD_TIME, {streamTime_s: streamTime_s, recordTime_s: recordTime_s});

                    this._broadcastEvent(EVENT_STREAMING_DROP, streamDrop);
                }

                if (this.isEventObserved(EVENT_CPU_USAGE) || this.isEventObserved(EVENT_MEMORY_USAGE) || this.isEventObserved(EVENT_FREE_DISK_SPACE) ||
                    this.isEventObserved(EVENT_RENDERING_DROP) || this.isEventObserved(EVENT_ENCODING_DROP))
                {
                    let obsStats = await this._obsSocket.call("GetStats");
    
                    let cpuUsage = obsStats["cpuUsage"] / 100;
                    let memoryUsage = obsStats["memoryUsage"] / 1000;
                    let diskSpace = obsStats["availableDiskSpace"] / 1000;
                    let renderDrop = obsStats["renderTotalFrames"] > 0 ? obsStats["renderSkippedFrames"] / obsStats["renderTotalFrames"] : 0;
                    let encodeDrop = obsStats["outputTotalFrames"] > 0 ? obsStats["outputSkippedFrames"] / obsStats["outputTotalFrames"] : 0; 
                    
                    this._broadcastEvent(EVENT_CPU_USAGE, cpuUsage);
                    this._broadcastEvent(EVENT_MEMORY_USAGE, memoryUsage);
                    this._broadcastEvent(EVENT_FREE_DISK_SPACE, diskSpace);

                    this._broadcastEvent(EVENT_RENDERING_DROP, renderDrop);
                    this._broadcastEvent(EVENT_ENCODING_DROP, encodeDrop);
                }
            }
            else if (this._updateReconnect)
            {
                await this._connectOBSWebSocket();
            }
        }
        finally
        {
            this._updateRunning = false;
        }
    }

    _triggerUpdate()
    {
        if (!this._updateRunning)
            this._update();
    }

    async _connectOBSWebSocket()
    {
        let connectionArguments = this._getOBSWebSocketConnectArguments();
        
        await this._obsSocket.connect(connectionArguments.url, connectionArguments.password, {rpcVersion: connectionArguments.rpcVersion});
    }

    _getOBSWebSocketConnectArguments()
    {
        let connectionArguments = {};

        connectionArguments.url = "ws://" + this._connectionProperties[PROPERTY_OBS_V5_ADDRESS] + ":" + this._connectionProperties[PROPERTY_OBS_V5_PORT];
        connectionArguments.password = this._connectionProperties[PROPERTY_OBS_V5_PASSWORD];

        // set this statically for now
        connectionArguments.rpcVersion = 1

        return connectionArguments;
    }

    _registerEvent(eventType)
    {
        let obsEvent = this._eventTypeToOBSEvent(eventType);
        let obsCallback = this._eventTypeToOBSCallback(eventType);

        if (obsEvent !== undefined)
            this._obsSocket.on(obsEvent, obsCallback);
    }

    _eventTypeToOBSEvent(eventType)
    {
        let obsEvent = undefined;

        if (eventType == EVENT_RECORD_STARTED)
            obsEvent = "RecordStateChanged";
        else if (eventType == EVENT_RECORD_STARTING)
            obsEvent = "RecordStateChanged";
        else if (eventType == EVENT_RECORD_STOPPED)
            obsEvent = "RecordStateChanged";
        else if (eventType == EVENT_RECORD_STOPPING)
            obsEvent = "RecordStateChanged";

        else if (eventType == EVENT_STREAM_STARTED)
            obsEvent = "StreamStateChanged";
        else if (eventType == EVENT_STREAM_STARTING)
            obsEvent = "StreamStateChanged";
        else if (eventType == EVENT_STREAM_STOPPED)
            obsEvent = "StreamStateChanged";
        else if (eventType == EVENT_STREAM_STOPPING)
            obsEvent = "StreamStateChanged";

        else if (eventType == EVENT_REPLAY_STARTED)
            obsEvent = "ReplayBufferStateChanged";
        else if (eventType == EVENT_REPLAY_STARTING)
            obsEvent = "ReplayBufferStateChanged";
        else if (eventType == EVENT_REPLAY_STOPPED)
            obsEvent = "ReplayBufferStateChanged";
        else if (eventType == EVENT_REPLAY_STOPPING)
            obsEvent = "ReplayBufferStateChanged";

        else if (eventType == EVENT_SCENE_SWITCHED)
            obsEvent = "CurrentProgramSceneChanged";
        else if (eventType == EVENT_SCENES_CHANGED)
            obsEvent = "SceneListChanged";
        
        return obsEvent;
    }

    _eventTypeToOBSCallback(eventType)
    {
        let obsCallback = (data) => this._broadcastEvent(eventType);

        if (eventType == EVENT_SCENE_SWITCHED)
        {
            obsCallback = (data) => {
                this._broadcastEvent(eventType, data["sceneName"]);
            };
        }
        else if (eventType == EVENT_SCENES_CHANGED)
        {
            obsCallback = (data) => {
                let sceneNames = [];
                for (let scene of data.scenes)
                    sceneNames.push(scene.sceneName);
                this._broadcastEvent(eventType, sceneNames);
            };
        }
        else if (eventType == EVENT_RECORD_STARTED)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STARTED)
                    this._broadcastEvent(EVENT_RECORD_STARTED)
            }
        }
        else if (eventType == EVENT_RECORD_STOPPED)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STOPPED)
                    this._broadcastEvent(EVENT_RECORD_STOPPED)
            }
        }
        else if (eventType == EVENT_RECORD_STARTING)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STARTING)
                    this._broadcastEvent(EVENT_RECORD_STARTING)
            }
        }
        else if (eventType == EVENT_RECORD_STOPPING)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STOPPING)
                    this._broadcastEvent(EVENT_RECORD_STOPPING)
            }
        }
        else if (eventType == EVENT_STREAM_STARTED)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STARTED)
                    this._broadcastEvent(EVENT_STREAM_STARTED)
            }
        }
        else if (eventType == EVENT_STREAM_STOPPED)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STOPPED)
                    this._broadcastEvent(EVENT_STREAM_STOPPED)
            }
        }
        else if (eventType == EVENT_STREAM_STARTING)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STARTING)
                    this._broadcastEvent(EVENT_STREAM_STARTING)
            }
        }
        else if (eventType == EVENT_STREAM_STOPPING)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STOPPING)
                    this._broadcastEvent(EVENT_STREAM_STOPPING)
            }
        }
        else if (eventType == EVENT_REPLAY_STARTED)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STARTED)
                    this._broadcastEvent(EVENT_REPLAY_STARTED)
            }
        }
        else if (eventType == EVENT_REPLAY_STOPPED)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STOPPED)
                    this._broadcastEvent(EVENT_REPLAY_STOPPED)
            }
        }
        else if (eventType == EVENT_REPLAY_STARTING)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STARTING)
                    this._broadcastEvent(EVENT_REPLAY_STARTING)
            }
        }
        else if (eventType == EVENT_REPLAY_STOPPING)
        {
            obsCallback = (data) => {
                if (data.outputState == OBS_OUTPUT_STATE_STOPPING)
                    this._broadcastEvent(EVENT_REPLAY_STOPPING)
            }
        }

        return obsCallback;
    }

    async _sendRequest(requestType, requestData = undefined)
    {
        let obsRequest = this._requestTypeToOBSRequest(requestType);
        let obsRequestData = this._requestDataToOBSRequestData(requestType, requestData);

        let obsResponseData = await this._obsSocket.call(obsRequest, obsRequestData);
        let responseData = this._obsResponseDataToResponseData(requestType, obsResponseData);
        
        return responseData;
    }

    _requestTypeToOBSRequest(requestType)
    {
        let obsRequest = undefined;

        if (requestType == REQUEST_RECORD_TOGGLE)
            obsRequest = "ToggleRecord";
        else if (requestType == REQUEST_STREAM_TOGGLE)
            obsRequest = "ToggleStream";
        else if (requestType == REQUEST_REPLAY_TOGGLE)
            obsRequest = "ToggleReplayBuffer";

        else if (requestType == REQUEST_SCENE_NAMES)
            obsRequest = "GetSceneList";
        else if (requestType == REQUEST_SCENE_SET)
            obsRequest = "SetCurrentProgramScene";
        else if (requestType == REQUEST_SCENE_GET)
            obsRequest = "GetCurrentProgramScene";

        else if (requestType == REQUEST_STREAM_TIME)
            obsRequest = "GetStreamStatus";
        else if (requestType == REQUEST_RECORD_TIME)
            obsRequest = "GetRecordStatus";
        
        else if (requestType == REQUEST_REPLAY_ACTIVE)
            obsRequest = "GetReplayBufferStatus";
        else if (requestType == REQUEST_REPLAY_SAVE)
            obsRequest = "SaveReplayBuffer";

        return obsRequest;
    }

    _requestDataToOBSRequestData(requestType, requestData = undefined)
    {
        let obsRequestData = undefined;

        if (requestType == REQUEST_SCENE_SET)
            obsRequestData = { "sceneName": requestData };
        
        return obsRequestData;
    }

    _obsResponseDataToResponseData(requestType, obsResponseData = undefined)
    {
        let responesData = undefined;

        if (requestType == REQUEST_SCENE_NAMES)
        {
            responesData = [];
            for (let scene of obsResponseData.scenes)
                responesData.push(scene.sceneName);
        }
        else if (requestType == REQUEST_SCENE_GET)
            responesData = obsResponseData.currentProgramSceneName;

        else if (requestType == REQUEST_STREAM_TIME || requestType == REQUEST_RECORD_TIME)
        {
            responesData = obsResponseData.outputActive ? obsResponseData.outputDuration / 1000 : -1;
        }

        else if (requestType == REQUEST_REPLAY_ACTIVE)
            responesData = obsResponseData.outputActive;

        return responesData;
    }
    /**
     * @return {Array}
     */
    getSupportedRequestTypes()
    {
        return REQUEST_LIST_V2;
    }

    /**
     * @return {Array}
     */
    getSupportedEventTypes()
    {
        return EVENT_LIST_V3;
    }
}

function createStreamRemoteSocket()
{
    return new OBSRemoteSocketV5();
}

export {
    PROPERTY_OBS_V5_ADDRESS,
    PROPERTY_OBS_V5_PORT,
    PROPERTY_OBS_V5_PASSWORD
};

export {
    createStreamRemoteSocket
};