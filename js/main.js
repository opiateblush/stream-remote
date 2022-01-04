import { 
    NAME,
    AUTHOR, 
    VERSION 
} from "./manifest.js";

import { 
    SEARCH_PARAM_SOCKET_NAME 
} from "./constants.js";

import {
    USER_PREFERENCE_CPU_OK_KEY,
    USER_PREFERENCE_CPU_SUFFICIENT_KEY,
    USER_PREFERENCE_DROP_OK_KEY,
    USER_PREFERENCE_DROP_SUFFICIENT_KEY,
    USER_PREFERENCE_MEMORY_OK_KEY,
    USER_PREFERENCE_MEMORY_SUFFICIENT_KEY,
    USER_PREFERENCE_SPACE_OK_KEY,
    USER_PREFERENCE_SPACE_SUFFICIENT_KEY
} from "./stream-remote.js"

import {
    setSocketConnectProperties,
    setSocketName,
    clearSocketProperties,
    getUserPreferences,
} from "./stream-remote.js"

import {
    showErrorAlert,
    removeAlert,
    showSuccessAlert
} from "./alert.js";

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
    EVENT_CPU_USAGE, 
    EVENT_ENCODING_DROP, 
    EVENT_FREE_DISK_SPACE, 
    EVENT_MEMORY_USAGE, 
    EVENT_RENDERING_DROP, 
    EVENT_STREAMING_DROP, 
    EVENT_STREAM_RECORD_TIME
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
    createStreamRemoteSocket,
} from "./socket/socket.js"

// Necessary import even if it's not used, otherwise the "api-ready" event won't be fired.
import {
    OVRT
} from "./lib/ovrt-helper.js"

const ID_CONTAINER_CONTINUOUS_BUTTONS = "navbar-container-buttons-continuous";
const ID_CONTAINER_ONESHOT_BUTTONS = "navbar-container-buttons-oneshot";
const ID_SEPARATOR_BUTTONS = "navbar-buttons-separator";
const ID_CONTAINER_STATUS_BAR_ELEMENTS = "container-status-bar-elements";

const ID_BUTTON_RECORD = "button-record";
const ID_BUTTON_STREAM = "button-stream";
const ID_BUTTON_REPLAY = "button-replay";
const ID_BUTTON_REPLAY_SAVE = "button-replay-save";

const ID_TEXT_VERSION_AUTHOR = "text-version-author";

const ID_ALERT_DISCONNECTED = "alert-disconnected";
const TEXT_ALERT_DICONNECTED = "Cannot connect to your streaming software. All requirements installed? Configuration correct?";

const ID_ALERT_REPLAY_SAVE = "alert-replay-save";
const TEXT_ALERT_REPLAY_SAVE_SUCCESS = "Replay saved!";
const TEXT_ALERT_REPLAY_SAVE_FAILED = "Replay could not be saved!";
const TIMEOUT_ALERT_REPLAY_SAVE = 5000;

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

    removeAlert(ID_ALERT_DISCONNECTED);
}

function onStreamRemoteSocketDisconnected()
{
    showErrorAlert(TEXT_ALERT_DICONNECTED, ID_ALERT_DISCONNECTED)
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

function setupStatusBar()
{
    let statusBar = document.getElementById(ID_CONTAINER_STATUS_BAR_ELEMENTS);
    statusBar.innerHTML = "";

    if (streamRemoteSocket.isSupportedEvent(EVENT_CPU_USAGE) || streamRemoteSocket.isSupportedEvent(EVENT_MEMORY_USAGE) ||
        streamRemoteSocket.isSupportedEvent(EVENT_FREE_DISK_SPACE))
    {
        if (streamRemoteSocket.isSupportedEvent(EVENT_CPU_USAGE))
        {
            let cpuUsage = document.createElement("i");
            cpuUsage.className = "bi bi-cpu-fill text-success fs-3 mx-2";
    
            statusBar.insertAdjacentElement("beforeend", cpuUsage);
            
            streamRemoteSocket.addEventListener(EVENT_CPU_USAGE, data => {
                let userPreferences = getUserPreferences();
    
                cpuUsage.classList.remove("text-success");
                cpuUsage.classList.remove("text-warning");
                cpuUsage.classList.remove("text-danger");
    
                if (data <= userPreferences[USER_PREFERENCE_CPU_OK_KEY])
                    cpuUsage.classList.add("text-success");
                else if (data <= userPreferences[USER_PREFERENCE_CPU_SUFFICIENT_KEY])
                    cpuUsage.classList.add("text-warning");
                else
                    cpuUsage.classList.add("text-danger");
            });
        }

        if (streamRemoteSocket.isSupportedEvent(EVENT_MEMORY_USAGE))
        {
            let memoryUsageIndicator = document.createElement("i");
            memoryUsageIndicator.className = "bi bi-memory text-success fs-3 mx-2";

            statusBar.insertAdjacentElement("beforeend", memoryUsageIndicator);

            streamRemoteSocket.addEventListener(EVENT_MEMORY_USAGE, memoryUsage_g => {
                let userPreferences = getUserPreferences();
    
                memoryUsageIndicator.classList.remove("text-success");
                memoryUsageIndicator.classList.remove("text-warning");
                memoryUsageIndicator.classList.remove("text-danger");

                if (memoryUsage_g <= userPreferences[USER_PREFERENCE_MEMORY_OK_KEY])
                    memoryUsageIndicator.classList.add("text-success");
                else if (memoryUsage_g <= userPreferences[USER_PREFERENCE_MEMORY_SUFFICIENT_KEY])
                    memoryUsageIndicator.classList.add("text-warning");
                else
                    memoryUsageIndicator.classList.add("text-danger");
            });
        }

        if (streamRemoteSocket.isSupportedEvent(EVENT_FREE_DISK_SPACE))
        {
            let freeDiskSpaceIndicator = document.createElement("i");
            freeDiskSpaceIndicator.className = "bi bi-hdd-fill text-success fs-3 mx-2";

            statusBar.insertAdjacentElement("beforeend", freeDiskSpaceIndicator);

            streamRemoteSocket.addEventListener(EVENT_FREE_DISK_SPACE, freeDiskSpace_g => {
                let userPreferences = getUserPreferences();
    
                freeDiskSpaceIndicator.classList.remove("text-success");
                freeDiskSpaceIndicator.classList.remove("text-warning");
                freeDiskSpaceIndicator.classList.remove("text-danger");

                if (freeDiskSpace_g >= userPreferences[USER_PREFERENCE_SPACE_OK_KEY])
                    freeDiskSpaceIndicator.classList.add("text-success");
                else if (freeDiskSpace_g >= userPreferences[USER_PREFERENCE_SPACE_SUFFICIENT_KEY])
                    freeDiskSpaceIndicator.classList.add("text-warning");
                else
                    freeDiskSpaceIndicator.classList.add("text-danger");
            });
        }

        let separator = document.createElement("div");
        separator.className = "bg-secondary rounded py-3 mx-3";
        separator.style = "width: 0.25em;";

        statusBar.insertAdjacentElement("beforeend", separator);
    }


    if (streamRemoteSocket.isSupportedEvent(EVENT_STREAMING_DROP) || streamRemoteSocket.isSupportedEvent(EVENT_ENCODING_DROP) ||
        streamRemoteSocket.isSupportedEvent(EVENT_RENDERING_DROP))
    {
        let listener = (drop, element) => {
            let userPreferences = getUserPreferences();

            element.classList.remove("text-success");
            element.classList.remove("text-warning");
            element.classList.remove("text-danger");

            if (drop <= userPreferences[USER_PREFERENCE_DROP_OK_KEY])
                element.classList.add("text-success");
            else if (drop <= userPreferences[USER_PREFERENCE_DROP_SUFFICIENT_KEY])
                element.classList.add("text-warning");
            else
                element.classList.add("text-danger");
        };

        if (streamRemoteSocket.isSupportedEvent(EVENT_STREAMING_DROP))
        {
            let dropElement = document.createElement("i");
            dropElement.className = "bi bi-cloud-arrow-up-fill text-success fs-3 mx-2";

            statusBar.insertAdjacentElement("beforeend", dropElement);

            streamRemoteSocket.addEventListener(EVENT_STREAMING_DROP, drop => listener(drop, dropElement));
        }

        if (streamRemoteSocket.isSupportedEvent(EVENT_ENCODING_DROP))
        {
            let dropElement = document.createElement("i");
            dropElement.className = "bi bi-arrow-left-circle-fill text-success fs-4 mx-2";

            statusBar.insertAdjacentElement("beforeend", dropElement);

            streamRemoteSocket.addEventListener(EVENT_ENCODING_DROP, drop => listener(drop, dropElement));
        }

        if (streamRemoteSocket.isSupportedEvent(EVENT_RENDERING_DROP))
        {
            let dropElement = document.createElement("i");
            dropElement.className = "bi bi-gpu-card text-success fs-3 mx-2";

            statusBar.insertAdjacentElement("beforeend", dropElement);

            streamRemoteSocket.addEventListener(EVENT_RENDERING_DROP, drop => listener(drop, dropElement));
        }

        let separator = document.createElement("div");
        separator.className = "bg-secondary rounded py-3 mx-3";
        separator.style = "width: 0.25em;";

        statusBar.insertAdjacentElement("beforeend", separator);
    }

    let streamRecordTime = document.createElement("span");
    streamRecordTime.className = "text-white fs-3 mx-2";

    statusBar.insertAdjacentElement("beforeend", streamRecordTime);

    let updateStreamRecordTime = (streamTime_s = -1, recordTime_s = -1) => {
        let totalTime_s = 0;

        streamRecordTime.classList.remove("text-white");
        streamRecordTime.classList.remove("text-danger");

        streamRecordTime.classList.add("text-white");
    
        if (streamTime_s >= 0)
        {
            totalTime_s = streamTime_s;
            streamRecordTime.classList.add("text-danger");
        }
        else if (recordTime_s >= 0)
        {
            totalTime_s = recordTime_s;
        }
            
        let minutes = totalTime_s / 60;
        let hours = parseInt(minutes / 60);
    
        minutes = parseInt(minutes - hours * 60);
        let seconds = parseInt(totalTime_s - hours * 60 * 60 - minutes * 60);
    
        streamRecordTime.innerHTML = String(hours) + ":" + String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");    
    };

    streamRemoteSocket.addEventListener(EVENT_STREAM_RECORD_TIME, data => {
        let streamTime_s = data.streamTime_s;
        let recordTime_s = data.recordTime_s;
        updateStreamRecordTime(data.streamTime_s, data.recordTime_s);
    });

    updateStreamRecordTime();
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

    setupStatusBar();

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