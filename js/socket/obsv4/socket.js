import "./lib/obs-websocket.js";

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
    EVENT_STREAM_RECORD_TIME,
    EVENT_SCENES_CHANGED,
    EVENT_CPU_USAGE,
    EVENT_MEMORY_USAGE,
    EVENT_FREE_DISK_SPACE,
    EVENT_RENDERING_DROP,
    EVENT_ENCODING_DROP,
    EVENT_STREAMING_DROP
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
    EVENT_LIST_V3,
    REQUEST_LIST_V2
} from "../socket.js"

import { 
    StreamRemoteSocket
} from "../socket.js";

const DEFAULT_OBS_ADDRESS = "localhost";
const DEFAULT_OBS_PORT = 4444;
const DEFAULT_OBS_PASSWORD = undefined;

const DEFAULT_OBS_UPDATE_INTERVAL_MS = 2500;

const PROPERTY_OBS_ADDRESS = "address";
const PROPERTY_OBS_PORT = "port";
const PROPERTY_OBS_PASSWORD = "password";

// currently not part of the connect form
const PROPERTY_OBS_UPDATE_INTERVAL_MS = "update-interval";

function obsTimecodeToSeconds(timecode)
{
    let hms = timecode.split(".")[0].split(":");
    return parseInt(hms[0]) * (60 * 60) + parseInt(hms[1]) * 60 + parseInt(hms[2]);
}

class OBSRemoteSocket extends StreamRemoteSocket
{
    constructor()
    {
        super();

        this._connectionProperties = {};

        this._updateRunning = false;
        this._updateReconnect = true;
        this._updateIntervalID = undefined;

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
        
        if (!(PROPERTY_OBS_UPDATE_INTERVAL_MS in connectionProperties))
            connectionProperties[PROPERTY_OBS_UPDATE_INTERVAL_MS] = DEFAULT_OBS_UPDATE_INTERVAL_MS;

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
                this._updateIntervalID = setInterval(this._triggerUpdate.bind(this), this._connectionProperties[PROPERTY_OBS_UPDATE_INTERVAL_MS]);
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

        if (this.isConnected())
            this._obsSocket.disconnect();
    }

    isConnected()
    {
        // TODO: This is unexposed API, but how else to check? Fix it anyways!
        return this._obsSocket._connected;
    }

    async _update()
    {
        this._updateRunning = true;

        try
        {
            if (this.isConnected())
            {
                if (this.isEventObserved(EVENT_STREAM_RECORD_TIME) || this.isEventObserved(EVENT_STREAMING_DROP))
                {
                    let obsStreamStatus = await this._obsSocket.send("GetStreamingStatus");

                    let streamTime_s = obsStreamStatus["streaming"] ? obsTimecodeToSeconds(obsStreamStatus["stream-timecode"]) : -1;
                    let recordTime_s = obsStreamStatus["recording"] ? obsTimecodeToSeconds(obsStreamStatus["rec-timecode"]) : -1;

                    this._broadcastEvent(EVENT_STREAM_RECORD_TIME, {streamTime_s: streamTime_s, recordTime_s: recordTime_s});

                    // Data only available through StreamStatus event
                    if (!obsStreamStatus["streaming"])
                        this._broadcastEvent(EVENT_STREAMING_DROP, 0);
                }

                if (this.isEventObserved(EVENT_CPU_USAGE) || this.isEventObserved(EVENT_MEMORY_USAGE) || this.isEventObserved(EVENT_FREE_DISK_SPACE) ||
                    this.isEventObserved(EVENT_RENDERING_DROP) || this.isEventObserved(EVENT_ENCODING_DROP))
                {
                    let obsStats = await this._obsSocket.send("GetStats");
                    obsStats = obsStats.stats;
    
                    let cpuUsage = obsStats["cpu-usage"] / 100;
                    let memoryUsage = obsStats["memory-usage"] / 1000;
                    let diskSpace = obsStats["free-disk-space"] / 1000;
                    let renderDrop = obsStats["render-total-frames"] > 0 ? obsStats["render-missed-frames"] / obsStats["render-total-frames"] : 0;
                    let encodeDrop = obsStats["output-total-frames"] > 0 ? obsStats["output-skipped-frames"] / obsStats["output-total-frames"] : 0; 
                    
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

        else if (eventType == EVENT_STREAMING_DROP)
            obsEvent = "StreamStatus";
        
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

        else if (eventType == EVENT_STREAMING_DROP)
        {
            obsCallback = (data) => {
                let streamDrop = data["streaming"] && data["num-total-frames"] > 0 ? data["num-dropped-frames"] / data["num-total-frames"] : 0;
                this._broadcastEvent(eventType, streamDrop);
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
                responesData = parseInt(hms[0]) * (60 * 60) + parseInt(hms[1]) * 60 + parseInt(hms[2]);
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
        return EVENT_LIST_V3;
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