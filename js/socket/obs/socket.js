import "./lib/obs-websocket.js";

import { 
    StreamRemoteSocket
} from "../socket.js";

import { 
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
    EVENT_SCENES_CHANGED
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
    EVENT_LIST_V2,
    REQUEST_LIST_V2
} from "../socket.js"

const DEFAULT_OBS_ADDRESS = "localhost";
const DEFAULT_OBS_PORT = 4444;
const DEFAULT_OBS_PASSWORD = undefined;

const DEFAULT_OBS_RECONNECT = true;
const DEFAULT_OBS_RECONNECT_INTERVAL_MS = 5000;

const PROPERTY_OBS_ADDRESS = "address";
const PROPERTY_OBS_PORT = "port";
const PROPERTY_OBS_PASSWORD = "password";

// currently not part of the connect form
const PROPERTY_OBS_RECONNECT = "reconnect";
const PROPERTY_OBS_RECONNECT_INTERVAL_MS = "reconnect-interval";

class OBSRemoteSocket extends StreamRemoteSocket
{
    constructor()
    {
        super();

        this._connectionProperties = {};
        this._reconnectIntervalID = undefined;

        this._obsSocket = new OBSWebSocket();
    }
    
    async connect(connectionProperties)
    {
        if (!(PROPERTY_OBS_ADDRESS in connectionProperties))
            connectionProperties[PROPERTY_OBS_ADDRESS] = DEFAULT_OBS_ADDRESS;
        if (!(PROPERTY_OBS_PORT in connectionProperties))
            connectionProperties[PROPERTY_OBS_PORT] = DEFAULT_OBS_PORT;
        if (!(PROPERTY_OBS_PASSWORD in connectionProperties))
            connectionProperties[PROPERTY_OBS_PASSWORD] = DEFAULT_OBS_PASSWORD;
        
        if (!(PROPERTY_OBS_RECONNECT in connectionProperties))
            connectionProperties[PROPERTY_OBS_RECONNECT] = DEFAULT_OBS_RECONNECT;
        if (!(PROPERTY_OBS_RECONNECT_INTERVAL_MS in connectionProperties))
            connectionProperties[PROPERTY_OBS_RECONNECT_INTERVAL_MS] = DEFAULT_OBS_RECONNECT_INTERVAL_MS;

        this._connectionProperties = connectionProperties;

        if (!this.isConnected())
        {
            await this._connectOBSWebSocket();

            if (this._connectionProperties[PROPERTY_OBS_RECONNECT])
                this._reconnectIntervalID = setInterval(() => {
                    if (!this.isConnected())
                        this._connectOBSWebSocket();
                }, this._connectionProperties[PROPERTY_OBS_RECONNECT_INTERVAL_MS]);
        }
    }

    disconnect()
    {
        if (this._reconnectIntervalID !== undefined)
        {
            clearInterval(this._reconnectIntervalID);
            this._reconnectIntervalID = undefined;
        }

        if (this.isConnected())
            this._obsSocket.disconnect();
    }

    isConnected()
    {
        // TODO: This is unexposed API, but how else to check? Fix it anyways!
        return this._obsSocket._connected;
    }

    async _connectOBSWebSocket()
    {
        let connectionArguments = this._getOBSWebSocketConnectArguments();
        
        await this._obsSocket.connect(connectionArguments).then(() => {
            this._broadcastEvent(EVENT_CONNECTED)
        }, () => {
            this._broadcastEvent(EVENT_DISCONNECTED)
        });
    }

    _getOBSWebSocketConnectArguments()
    {
        let connectionArguments = {};

        connectionArguments.address = this._connectionProperties[PROPERTY_OBS_ADDRESS] + ":" + this._connectionProperties[PROPERTY_OBS_PORT];

        if (this._connectionProperties[PROPERTY_OBS_PASSWORD] !== undefined)
            connectionArguments.password = this._connectionProperties[PROPERTY_OBS_PASSWORD];

        return connectionArguments;
    }

    _registerEvent(eventType)
    {
        let obsEvent = this._eventTypeToOBSEvent(eventType);
        let obsCallback = this._eventTypeToOBSCallback(eventType);

        if (obsEvent !== undefined)
            this._obsSocket.on(obsEvent, obsCallback);
    }

    async _sendRequest(requestType, requestData = undefined)
    {
        let obsRequest = this._requestTypeToOBSRequest(requestType);
        let obsRequestData = this._requestDataToOBSRequestData(requestType, requestData);

        let obsResponseData = await this._obsSocket.send(obsRequest, obsRequestData);
        let responseData = this._obsResponseDataToResponseData(requestType, obsResponseData);
        
        return responseData;
    }

    _eventTypeToOBSEvent(eventType)
    {
        let obsEvent = undefined;

        if (eventType == EVENT_RECORD_STARTED)
            obsEvent = "RecordingStarted";
        else if (eventType == EVENT_RECORD_STARTING)
            obsEvent = "RecordingStarting";
        else if (eventType == EVENT_RECORD_STOPPED)
            obsEvent = "RecordingStopped";
        else if (eventType == EVENT_RECORD_STOPPING)
            obsEvent = "RecordingStopping";

        else if (eventType == EVENT_STREAM_STARTED)
            obsEvent = "StreamStarted";
        else if (eventType == EVENT_STREAM_STARTING)
            obsEvent = "StreamStarting";
        else if (eventType == EVENT_STREAM_STOPPED)
            obsEvent = "StreamStopped";
        else if (eventType == EVENT_STREAM_STOPPING)
            obsEvent = "StreamStopping";

        else if (eventType == EVENT_REPLAY_STARTED)
            obsEvent = "ReplayStarted";
        else if (eventType == EVENT_REPLAY_STARTING)
            obsEvent = "ReplayStarting";
        else if (eventType == EVENT_REPLAY_STOPPED)
            obsEvent = "ReplayStopped";
        else if (eventType == EVENT_REPLAY_STOPPING)
            obsEvent = "ReplayStopping";

        else if (eventType == EVENT_SCENE_SWITCHED)
            obsEvent = "SwitchScenes";
        else if (eventType == EVENT_SCENES_CHANGED)
            obsEvent = "ScenesChanged";
        
        return obsEvent;
    }

    _eventTypeToOBSCallback(eventType)
    {
        let obsCallback = (data) => this._broadcastEvent(eventType);

        if (eventType == EVENT_SCENE_SWITCHED)
        {
            obsCallback = (data) => {
                this._broadcastEvent(eventType, data["scene-name"]);
            };
        }
        else if (eventType == EVENT_SCENES_CHANGED)
        {
            obsCallback = (data) => {
                let sceneNames = [];
                for (let scene of data.scenes)
                    sceneNames.push(scene.name);
                this._broadcastEvent(eventType, sceneNames);
            };
        }

        return obsCallback;
    }

    _requestTypeToOBSRequest(requestType)
    {
        let obsRequest = undefined;

        if (requestType == REQUEST_RECORD_TOGGLE)
            obsRequest = "StartStopRecording";
        else if (requestType == REQUEST_STREAM_TOGGLE)
            obsRequest = "StartStopStreaming";
        else if (requestType == REQUEST_REPLAY_TOGGLE)
            obsRequest = "StartStopReplayBuffer";

        else if (requestType == REQUEST_SCENE_NAMES)
            obsRequest = "GetSceneList";
        else if (requestType == REQUEST_SCENE_SET)
            obsRequest = "SetCurrentScene";
        else if (requestType == REQUEST_SCENE_GET)
            obsRequest = "GetCurrentScene";

        else if (requestType == REQUEST_STREAM_TIME)
            obsRequest = "GetStreamingStatus";
        else if (requestType == REQUEST_RECORD_TIME)
            obsRequest = "GetStreamingStatus";
        
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
            obsRequestData = { "scene-name": requestData };
        
        return obsRequestData;
    }

    _obsResponseDataToResponseData(requestType, obsResponseData = undefined)
    {
        let responesData = undefined;

        if (requestType == REQUEST_SCENE_NAMES)
        {
            responesData = [];
            for (let scene of obsResponseData.scenes)
                responesData.push(scene.name);
        }
        else if (requestType == REQUEST_SCENE_GET)
            responesData = obsResponseData.name;

        else if (requestType == REQUEST_STREAM_TIME || requestType == REQUEST_RECORD_TIME)
        {
            let timeString = undefined
            responesData = -1;
            
            if (requestType == REQUEST_STREAM_TIME && obsResponseData.streaming)
                timeString = obsResponseData["stream-timecode"];
            else if (requestType == REQUEST_RECORD_TIME && obsResponseData.recording)
                timeString = obsResponseData["rec-timecode"];
            
            if (timeString !== undefined)
            {
                let hms = timeString.split(".")[0].split(":");
                responesData = hms[0] * (60 * 60) + hms[1] * 60 + hms[2];
            }
        }

        else if (requestType == REQUEST_REPLAY_ACTIVE)
            responesData = obsResponseData.isReplayBufferActive;

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
        return EVENT_LIST_V2;
    }
}

function createStreamRemoteSocket()
{
    return new OBSRemoteSocket();
}

export {
    PROPERTY_OBS_ADDRESS,
    PROPERTY_OBS_PORT,
    PROPERTY_OBS_PASSWORD
};

export {
    createStreamRemoteSocket
};