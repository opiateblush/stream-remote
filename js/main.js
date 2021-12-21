import { 
    AUTHOR, 
    VERSION 
} from "./manifest.js";

import { 
    SEARCH_PARAM_SOCKET_NAME 
} from "./constants.js";

import {
    setSocketConnectProperties,
    setSocketName
} from "./stream-remote.js"

import {
    showErrorAlert,
    removeAlert
} from "./alert.js";

import {
    createStreamRemoteSocket, EVENT_CONNECTED, EVENT_DISCONNECTED, EVENT_RECORD_STARTED, EVENT_RECORD_STARTING, EVENT_RECORD_STOPPED, EVENT_RECORD_STOPPING, EVENT_STREAM_STARTED, EVENT_STREAM_STARTING, EVENT_STREAM_STOPPED, EVENT_STREAM_STOPPING, REQUEST_RECORD_TOGGLE, REQUEST_STREAM_TOGGLE
} from "./socket/socket.js"

import {
    REQUEST_RECORD_TIME,
    REQUEST_STREAM_TIME
} from "./socket/socket.js"

const ID_BUTTON_RECORD = "button-record";
const ID_BUTTON_STREAM = "button-stream";
const SUFFIX_ID_BUTTON_CONTENT_RECORD_STREAM = "-content";
const SUFFIX_ID_BUTTON_TEXT_RECORD_STREAM = "-text";

const ID_TEXT_STREAM_RECORD_TIME = "text-stream-record-time";
const ID_TEXT_VERSION_AUTHOR = "text-version-author";

const ID_ALERT_DISCONNECTED = "alert-disconnected";
const TEXT_ALERT_DICONNECTED = "Cannot connect to your streaming software. All requirements installed? Configuration correct?";

const INTERVAL_STREAM_RECORD_TIME_MS = 2000;

let streamRecordTimeIntervalID;

function getSocketConnectPropertiesFromSearchParams()
{
    let searchParams = new URLSearchParams(window.location.search);
    let connectionProperties = {};

    searchParams.forEach((value, key) => {
        if (key != SEARCH_PARAM_SOCKET_NAME)
            connectionProperties[key] = value;
    });

    return connectionProperties;
}

function getSocketNameFromSearchParams()
{
    let searchParams = new URLSearchParams(window.location.search);
    return searchParams.get(SEARCH_PARAM_SOCKET_NAME);
}

function onStreamRemoteSocketConnected()
{
    updateStreamRecordButtons(streamRemoteSocket);
    updateStreamRecordTimes(streamRemoteSocket);

    removeAlert(ID_ALERT_DISCONNECTED);

    streamRecordTimeIntervalID = setStreamRecordTimeInterval(streamRemoteSocket, INTERVAL_STREAM_RECORD_TIME_MS);
}

function onStreamRemoteSocketDisconnected()
{
    if (streamRecordTimeIntervalID !== undefined)
    {
        clearInterval(streamRecordTimeIntervalID);
        streamRecordTimeIntervalID = undefined;
    }

    showErrorAlert(TEXT_ALERT_DICONNECTED, ID_ALERT_DISCONNECTED)
}

async function updateStreamRecordTimes(socket)
{
    let recordTime_s = await socket.request(REQUEST_RECORD_TIME);
    let streamTime_s = await socket.request(REQUEST_STREAM_TIME);

    setStreamRecordTime(streamTime_s, recordTime_s);
}

async function updateStreamRecordButtons(socket)
{
    let recordTime_s = await socket.request(REQUEST_RECORD_TIME);
    let streamTime_s = await socket.request(REQUEST_STREAM_TIME);

    setRecordButtonState(recordTime_s >= 0);
    setStreamButtonState(streamTime_s >= 0)
}

function setStreamRecordTimeInterval(socket, interval_ms = 2000)
{
    return setInterval(() => {
        updateStreamRecordTimes(socket);
    }, interval_ms);
}

function registerStreamRemoteEvents(socket)
{
    socket.addEventListener(EVENT_CONNECTED, () => {
        onStreamRemoteSocketConnected();
    });
    socket.addEventListener(EVENT_DISCONNECTED, () => {
        onStreamRemoteSocketDisconnected();
    });

    socket.addEventListener(EVENT_RECORD_STARTED, () => {
        setRecordButtonState(true);
    });
    socket.addEventListener(EVENT_RECORD_STOPPED, () => {
        setRecordButtonState();
    });
    socket.addEventListener(EVENT_RECORD_STARTING, () => {
        setRecordButtonState(false, true);
    });
    socket.addEventListener(EVENT_RECORD_STOPPING, () => {
        setRecordButtonState(true, true);
    });

    socket.addEventListener(EVENT_STREAM_STARTED, () => {
        setStreamButtonState(true);
    });
    socket.addEventListener(EVENT_STREAM_STOPPED, () => {
        setStreamButtonState();
    });
    socket.addEventListener(EVENT_STREAM_STARTING, () => {
        setStreamButtonState(false, true);
    });
    socket.addEventListener(EVENT_STREAM_STOPPING, () => {
        setStreamButtonState(true, true);
    });
}

function registerButtonEvents(socket)
{
    let recordButton = document.getElementById(ID_BUTTON_RECORD);
    let streamButton = document.getElementById(ID_BUTTON_STREAM);

    recordButton.addEventListener("click", () => {
        recordButton.blur();
        socket.request(REQUEST_RECORD_TOGGLE);
    });

    streamButton.addEventListener("click", () => {
        streamButton.blur();
        socket.request(REQUEST_STREAM_TOGGLE);
    });
}

function setVersionAuthor(version, author)
{
    let versionAuthorText = document.getElementById(ID_TEXT_VERSION_AUTHOR);
    versionAuthorText.innerHTML = `made by ${author}, v${version}`; 
}



function setStreamRecordButtonState(buttonID, activeName, inactiveName, active, changing)
{
    let button = document.getElementById(buttonID);
    
    if (changing)
    {
        button.setAttribute("class", "ms-1 me-1 btn btn-lg btn-warning");
    }
    else
    {
        let buttonTextID = buttonID + SUFFIX_ID_BUTTON_TEXT_RECORD_STREAM;
        let buttonText = document.getElementById(buttonTextID);
        
        if (active)
        {
            button.setAttribute("class", "ms-1 me-1 btn btn-lg btn-danger");
            buttonText.innerHTML = activeName;
        }
        else
        {
            button.setAttribute("class", "ms-1 me-1 btn btn-lg btn-secondary");
            buttonText.innerHTML = inactiveName;
        }
    }
}

function setRecordButtonState(active = false, changing = false)
{
    setStreamRecordButtonState(ID_BUTTON_RECORD, "Recording", "Record", active, changing);
}

function setStreamButtonState(active = false, changing = false)
{
    setStreamRecordButtonState(ID_BUTTON_STREAM, "Streaming", "Stream", active, changing);
}

function setStreamRecordTime(streamTime_s = -1, recordTime_s = -1)
{
    let timeElement = document.getElementById(ID_TEXT_STREAM_RECORD_TIME);
    let totalTime_s = -1;

    if (streamTime_s >= 0)
    {
        totalTime_s = streamTime_s;
        timeElement.className = "fs-3 text-danger";
    }
    else if (recordTime_s >= 0)
    {
        totalTime_s = recordTime_s;
        timeElement.className = "fs-3 text-white";
    }
    else
    {
        timeElement.className = "d-none";
    }
        
    if (totalTime_s >= 0)
    {
        let minutes = totalTime_s / 60;
        let hours = parseInt(minutes / 60);

        minutes = parseInt(minutes - hours * 60);
        let seconds = parseInt(totalTime_s - hours * 60 * 60 - minutes * 60);

        timeElement.innerHTML = String(hours) + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }
}

setVersionAuthor(VERSION, AUTHOR);

const socketName = getSocketNameFromSearchParams();
const connectionProperties = getSocketConnectPropertiesFromSearchParams();

setSocketName(socketName);
setSocketConnectProperties(connectionProperties);

let streamRemoteSocket;

createStreamRemoteSocket(socketName).then((socket) => {
    streamRemoteSocket = socket;
    
    registerStreamRemoteEvents(streamRemoteSocket);
    registerButtonEvents(streamRemoteSocket);

    streamRemoteSocket.connect(connectionProperties);
})

// const streamRemoteSocket = await createStreamRemoteSocket(socketName);

// registerStreamRemoteEvents(streamRemoteSocket);
// registerButtonEvents(streamRemoteSocket);

// streamRemoteSocket.connect(connectionProperties);