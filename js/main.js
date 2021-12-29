import { 
    NAME,
    AUTHOR, 
    VERSION 
} from "./manifest.js";

import { 
    SEARCH_PARAM_SOCKET_NAME 
} from "./constants.js";

import {
    setSocketConnectProperties,
    setSocketName,
    clearSocketProperties
} from "./stream-remote.js"

import {
    showErrorAlert,
    removeAlert,
    showSuccessAlert
} from "./alert.js";

import {
    createStreamRemoteSocket
} from "./socket/socket.js"

import {
    EVENT_CONNECTED, 
    EVENT_DISCONNECTED, 
    EVENT_RECORD_STARTED, 
    EVENT_RECORD_STARTING, 
    EVENT_RECORD_STOPPED, 
    EVENT_RECORD_STOPPING, 
    EVENT_REPLAY_STARTED, 
    EVENT_REPLAY_STARTING, 
    EVENT_REPLAY_STOPPED, 
    EVENT_REPLAY_STOPPING, 
    EVENT_STREAM_STARTED, 
    EVENT_STREAM_STARTING, 
    EVENT_STREAM_STOPPED, 
    EVENT_STREAM_STOPPING, 
} from "./socket/socket.js"

import {
    REQUEST_RECORD_TIME,
    REQUEST_STREAM_TIME,
    REQUEST_RECORD_TOGGLE, 
    REQUEST_REPLAY_ACTIVE, 
    REQUEST_REPLAY_SAVE, 
    REQUEST_REPLAY_TOGGLE, 
    REQUEST_STREAM_TOGGLE
} from "./socket/socket.js"

import {
    OVRT
} from "./lib/ovrt-helper.js"

const ID_CONTAINER_CONTINUOUS_BUTTONS = "navbar-container-buttons-continuous";
const ID_CONTAINER_ONESHOT_BUTTONS = "navbar-container-buttons-oneshot";
const ID_SEPARATOR_BUTTONS = "navbar-buttons-separator";

const ID_BUTTON_RECORD = "button-record";
const ID_BUTTON_STREAM = "button-stream";
const ID_BUTTON_REPLAY = "button-replay";
const ID_BUTTON_REPLAY_SAVE = "button-replay-save";

const ID_TEXT_STREAM_RECORD_TIME = "text-stream-record-time";
const ID_TEXT_VERSION_AUTHOR = "text-version-author";

const ID_ALERT_DISCONNECTED = "alert-disconnected";
const TEXT_ALERT_DICONNECTED = "Cannot connect to your streaming software. All requirements installed? Configuration correct?";

const ID_ALERT_REPLAY_SAVE = "alert-replay-save";
const TEXT_ALERT_REPLAY_SAVE_SUCCESS = "Replay saved!";
const TEXT_ALERT_REPLAY_SAVE_FAILED = "Replay could not be saved!";
const TIMEOUT_ALERT_REPLAY_SAVE = 5000;

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
    updateStreamRecordButtons();
    updateStreamRecordTimes();

    removeAlert(ID_ALERT_DISCONNECTED);

    streamRecordTimeIntervalID = setStreamRecordTimeInterval(INTERVAL_STREAM_RECORD_TIME_MS);
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

async function updateStreamRecordTimes()
{
    let recordTime_s = streamRemoteSocket.isSupportedRequest(REQUEST_RECORD_TIME) ? 
        await streamRemoteSocket.request(REQUEST_RECORD_TIME) : 
        -1;
    let streamTime_s = streamRemoteSocket.isSupportedRequest(REQUEST_STREAM_TIME) ? 
        await streamRemoteSocket.request(REQUEST_STREAM_TIME) :
        -1;

    setStreamRecordTime(streamTime_s, recordTime_s);
}

async function updateStreamRecordButtons()
{
    let recordTime_s = streamRemoteSocket.isSupportedRequest(REQUEST_RECORD_TIME) ? 
        await streamRemoteSocket.request(REQUEST_RECORD_TIME) : 
        -1;
    let streamTime_s = streamRemoteSocket.isSupportedRequest(REQUEST_STREAM_TIME) ? 
        await streamRemoteSocket.request(REQUEST_STREAM_TIME) :
        -1;
    let replayActive = streamRemoteSocket.isSupportedRequest(REQUEST_REPLAY_ACTIVE) ? 
        await streamRemoteSocket.request(REQUEST_REPLAY_ACTIVE) :
        false;

    setRecordButtonState(recordTime_s >= 0);
    setStreamButtonState(streamTime_s >= 0);
    setReplayButtonState(replayActive);
}

function setStreamRecordTimeInterval(interval_ms = 2000)
{
    return setInterval(() => {
        updateStreamRecordTimes();
    }, interval_ms);
}

function registerStreamRemoteEvents()
{
    streamRemoteSocket.addEventListener(EVENT_CONNECTED, () => {
        onStreamRemoteSocketConnected();
    });
    streamRemoteSocket.addEventListener(EVENT_DISCONNECTED, () => {
        onStreamRemoteSocketDisconnected();
    });

    if (streamRemoteSocket.isSupportedRequest(REQUEST_RECORD_TOGGLE))
    {
        streamRemoteSocket.addEventListener(EVENT_RECORD_STARTED, () => {
            setRecordButtonState(true);
        });
        streamRemoteSocket.addEventListener(EVENT_RECORD_STOPPED, () => {
            setRecordButtonState();
        });
        streamRemoteSocket.addEventListener(EVENT_RECORD_STARTING, () => {
            setRecordButtonState(false, true);
        });
        streamRemoteSocket.addEventListener(EVENT_RECORD_STOPPING, () => {
            setRecordButtonState(true, true);
        });
    }

    if (streamRemoteSocket.isSupportedRequest(REQUEST_STREAM_TOGGLE))
    {
        streamRemoteSocket.addEventListener(EVENT_STREAM_STARTED, () => {
            setStreamButtonState(true);
        });
        streamRemoteSocket.addEventListener(EVENT_STREAM_STOPPED, () => {
            setStreamButtonState();
        });
        streamRemoteSocket.addEventListener(EVENT_STREAM_STARTING, () => {
            setStreamButtonState(false, true);
        });
        streamRemoteSocket.addEventListener(EVENT_STREAM_STOPPING, () => {
            setStreamButtonState(true, true);
        });
    }

    if (streamRemoteSocket.isSupportedRequest(REQUEST_REPLAY_TOGGLE))
    {
        streamRemoteSocket.addEventListener(EVENT_REPLAY_STARTED, () => {
            setReplayButtonState(true);
        });
        streamRemoteSocket.addEventListener(EVENT_REPLAY_STOPPED, () => {
            setReplayButtonState();
        });
        streamRemoteSocket.addEventListener(EVENT_REPLAY_STARTING, () => {
            setReplayButtonState(false, true);
        });
        streamRemoteSocket.addEventListener(EVENT_REPLAY_STOPPING, () => {
            setReplayButtonState(true, true);
        });
    }
}

function setVersionAuthor(version, author)
{
    let versionAuthorText = document.getElementById(ID_TEXT_VERSION_AUTHOR);
    versionAuthorText.innerHTML = `made by ${author}, v${version}`; 
}

function setContinuousButtonState(buttonID, active, changing)
{
    let button = document.getElementById(buttonID);

    if (button.classList.contains("btn-secondary"))
        button.classList.remove("btn-secondary");
    if (button.classList.contains("btn-danger"))
        button.classList.remove("btn-danger");
    if (button.classList.contains("btn-warning"))
        button.classList.remove("btn-warning");
    
    if (changing)
        button.classList.add("btn-warning");
    else if (active)
        button.classList.add("btn-danger");
    else
        button.classList.add("btn-secondary");
}

function setReplayButtonState(active = false, changing = false)
{
    setContinuousButtonState(ID_BUTTON_REPLAY, active, changing);
}

function setRecordButtonState(active = false, changing = false)
{
    setContinuousButtonState(ID_BUTTON_RECORD, active, changing);
}

function setStreamButtonState(active = false, changing = false)
{
    setContinuousButtonState(ID_BUTTON_STREAM, active, changing);
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

function setupContinuousButtons()
{
    let buttonContainer = document.getElementById(ID_CONTAINER_CONTINUOUS_BUTTONS);
    let buttonClass = "btn btn-lg btn-secondary mx-1";

    buttonContainer.innerHTML = "";

    if (streamRemoteSocket.isSupportedRequest(REQUEST_STREAM_TOGGLE))
    {
        let button = document.createElement("button");
        button.className = buttonClass;
        button.type = "button";
        button.id = ID_BUTTON_STREAM;

        let buttonIcon = document.createElement("i");
        buttonIcon.className = "bi bi-broadcast fs-2 mx-2";

        button.addEventListener("click", () => {
            button.blur();
            streamRemoteSocket.request(REQUEST_STREAM_TOGGLE);
        });

        button.insertAdjacentElement("beforeend", buttonIcon);
        buttonContainer.insertAdjacentElement("beforeend", button);
    }

    if (streamRemoteSocket.isSupportedRequest(REQUEST_RECORD_TOGGLE))
    {
        let button = document.createElement("button");
        button.className = buttonClass;
        button.type = "button";
        button.id = ID_BUTTON_RECORD;

        let buttonIcon = document.createElement("i");
        buttonIcon.className = "bi bi-record-fill fs-2 mx-2";

        button.addEventListener("click", () => {
            button.blur();
            streamRemoteSocket.request(REQUEST_RECORD_TOGGLE);
        });

        button.insertAdjacentElement("beforeend", buttonIcon);
        buttonContainer.insertAdjacentElement("beforeend", button);
    }

    if (streamRemoteSocket.isSupportedRequest(REQUEST_REPLAY_TOGGLE))
    {
        let button = document.createElement("button");
        button.className = buttonClass;
        button.type = "button";
        button.id = ID_BUTTON_REPLAY;

        let buttonIcon = document.createElement("i");
        buttonIcon.className = "bi bi-save fs-2 mx-2";

        button.addEventListener("click", () => {
            button.blur();
            streamRemoteSocket.request(REQUEST_REPLAY_TOGGLE);
        });

        button.insertAdjacentElement("beforeend", buttonIcon);
        buttonContainer.insertAdjacentElement("beforeend", button);
    }
}

function setupOneshotButtons()
{
    let buttonContainer = document.getElementById(ID_CONTAINER_ONESHOT_BUTTONS);
    let buttonClass = "btn btn-lg btn-secondary mx-1";

    buttonContainer.innerHTML = "";

    if (streamRemoteSocket.isSupportedRequest(REQUEST_REPLAY_SAVE))
    {
        let button = document.createElement("button");
        button.className = buttonClass;
        button.type = "button";
        button.id = ID_BUTTON_REPLAY_SAVE;

        let buttonIcon = document.createElement("i");
        buttonIcon.className = "bi bi-box-arrow-down fs-2 mx-2";

        button.addEventListener("click", () => {
            button.blur();
            streamRemoteSocket.request(REQUEST_REPLAY_SAVE).then(() => {
                showSuccessAlert(TEXT_ALERT_REPLAY_SAVE_SUCCESS, ID_ALERT_REPLAY_SAVE, TIMEOUT_ALERT_REPLAY_SAVE);
            }).catch(() => {
                showErrorAlert(TEXT_ALERT_REPLAY_SAVE_FAILED, ID_ALERT_REPLAY_SAVE, TIMEOUT_ALERT_REPLAY_SAVE);
            });
        });

        button.insertAdjacentElement("beforeend", buttonIcon);
        buttonContainer.insertAdjacentElement("beforeend", button);
    }
}

function setupButtonsSeparator()
{
    let separator = document.getElementById(ID_SEPARATOR_BUTTONS);
    let oneshots = document.getElementById(ID_CONTAINER_ONESHOT_BUTTONS);

    if (!oneshots.innerHTML)
        separator.remove();
}

clearSocketProperties();

setVersionAuthor(VERSION, AUTHOR);

const socketName = getSocketNameFromSearchParams();
const connectionProperties = getSocketConnectPropertiesFromSearchParams();

setSocketName(socketName);
setSocketConnectProperties(connectionProperties);

let streamRemoteSocket;

createStreamRemoteSocket(socketName).then((socket) => {
    streamRemoteSocket = socket;
    
    setupContinuousButtons();
    setupOneshotButtons();
    setupButtonsSeparator();

    registerStreamRemoteEvents();

    streamRemoteSocket.connect(connectionProperties);
});

window.addEventListener("api-ready", (e) => {
    window.SetBrowserTitle(NAME);
});

// const streamRemoteSocket = await createStreamRemoteSocket(socketName);

// registerStreamRemoteEvents(streamRemoteSocket);
// registerButtonEvents(streamRemoteSocket);

// streamRemoteSocket.connect(connectionProperties);