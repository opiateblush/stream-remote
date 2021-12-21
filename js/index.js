import {
    PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE,
    getSocketConnectFormProperties
} from "./socket/socket-connect-form.js";

import { 
    createStreamRemoteSocket, EVENT_CONNECTED, EVENT_DISCONNECTED 
} from "./socket/socket.js";

import { 
    SOCKET_NAMES 
} from "./socket-names.js";

import {
    SEARCH_PARAM_SOCKET_NAME
} from "./constants.js";

import {
    setStorageValue,
    deleteStorageValue,
    getStorage,
    clearStorage
} from "./storage.js";

import {
    showErrorAlert,
    showSuccessAlert,
    removeAlert
} from "./alert.js";

import { 
    OVRT, 
    OVRTOverlay 
} from "./lib/ovrt-helper.js";

const ID_BUTTON_SPAWN_OVERLAY = "button-spawn-overlay";
const ID_SELECT_STREAMING_SOFTWARE = "select-streaming-software";
const ID_CONTAINER_SELECT_STREAMING_SOFTWARE = "container-form-select-streaming-software";

const ID_SOCKET_CONNECT_FORM_DESCRIPTION = "socket-connect-form-description";
const ID_CONTAINER_SOCKET_CONNECT_FORM = "container-socket-connect-form";

const ID_ALERT_DISCONNECTED = "alert-disonnected";
const ID_ALERT_CONNECTED = "alert-connected";

const STORAGE_CONNECT_FORM = "connect-form";

const INITIAL_OVERLAY_TRANSFORM = { 
	"posX": -0.02450195, 
	"posY": -0.1016635, 
	"posZ": -0.2013816, 
	"rotX": 176.058, 
	"rotY": -73.207, 
	"rotZ": 36.771, 
	"size": 0.175, 
	"opacity": 0.6, 
	"curvature": 0, 
	"framerate": 60, 
	"ecoMode": true, 
	"lookHiding": true, 
	"attachedDevice": 3, 
	"shouldSave": true
};

const OVERLAY_WIDTH = 800;
const OVERLAY_RATIO = 4 / 3;

const OVERLAY_DIMENSIONS = {
    width: OVERLAY_WIDTH,
    height: parseInt(OVERLAY_WIDTH / OVERLAY_RATIO)
};

async function spawnStreamRemoteOverlay()
{
    let url = new URL("main.html", window.location.href);
    let socketConnectProperties = getStorage(STORAGE_CONNECT_FORM);

    for (let key in socketConnectProperties)
        url.searchParams.append(key, socketConnectProperties[key]);

    // Only when not in VR
    // window.open(url.href);

    // Only in VR
    const ovrt = new OVRT();
    let overlay = await ovrt.spawnOverlay(INITIAL_OVERLAY_TRANSFORM);

    overlay.setBrowserOptionsEnabled(false);
    overlay.setContent(0, {
        url: url.href,
        width: OVERLAY_DIMENSIONS.width,
        height: OVERLAY_DIMENSIONS.height,
    });

    return overlay;
}

async function requestSpawnStreamRemoteOverlay()
{
    let socketConnectProperties = getStorage(STORAGE_CONNECT_FORM);
    let socket = await createStreamRemoteSocket(socketConnectProperties[SEARCH_PARAM_SOCKET_NAME]);

    delete socketConnectProperties[SEARCH_PARAM_SOCKET_NAME];

    socket.addEventListener(EVENT_CONNECTED, () => {
        spawnStreamRemoteOverlay();
        removeAlert(ID_ALERT_DISCONNECTED);
        showSuccessAlert("Overlay spawned at your left wrist!", ID_ALERT_CONNECTED);
    })

    socket.addEventListener(EVENT_DISCONNECTED, () => {
        socket.disconnect();
        removeAlert(ID_ALERT_CONNECTED);
        showErrorAlert("Cannot connect to your streaming software. All requirements installed? Configuration correct?", 
            ID_ALERT_DISCONNECTED);
    })

    await socket.connect(socketConnectProperties);
}

function setupButtonSpawnOverlay()
{
    let buttonSpawnOverlay = document.getElementById(ID_BUTTON_SPAWN_OVERLAY);
    buttonSpawnOverlay.addEventListener("click", () => {
        buttonSpawnOverlay.blur();
        requestSpawnStreamRemoteOverlay();
    }, false);
}

function setupSelectStreamingSoftware()
{
    if (SOCKET_NAMES.length >= 2)
    {
        let selectSupportedStreamingSoftware = document.getElementById(ID_SELECT_STREAMING_SOFTWARE);
        selectSupportedStreamingSoftware.innerHTML = ""

        for (let streamingSoftwareName of SOCKET_NAMES)
        {
            let option = document.createElement("option");
            option.innerHTML = streamingSoftwareName;
            selectSupportedStreamingSoftware.insertAdjacentElement("beforeend", option);
        }

        selectSupportedStreamingSoftware.addEventListener("input", e => {
            clearStorage(STORAGE_CONNECT_FORM);
            setStorageValue(SEARCH_PARAM_SOCKET_NAME, SOCKET_NAMES[0], STORAGE_CONNECT_FORM);
            requestSocketConnectFormSetup(e.target.value);
        });
    }
    else
    {
        let containerSoftwareSelection = document.getElementById(ID_CONTAINER_SELECT_STREAMING_SOFTWARE);
        
        if (!containerSoftwareSelection.classList.contains("d-none"))
            containerSoftwareSelection.classList.add("d-none")
    }
}

async function requestSocketConnectFormSetup(socketName)
{
    let formproperties = await getSocketConnectFormProperties(socketName);
    setupSocketConnectForm(formproperties);
}

function setupSocketConnectForm(formProperties)
{
    let descriptionText = document.getElementById(ID_SOCKET_CONNECT_FORM_DESCRIPTION);
    let formContainer = document.getElementById(ID_CONTAINER_SOCKET_CONNECT_FORM);

    formContainer.innerHTML = "";

    if (PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION in formProperties)
        descriptionText.innerHTML = formProperties[PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION];
    
    for (let property in formProperties)
    {
        if (property != PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION)
        {
            let itemProperties =  formProperties[property];

            let propertyContainer = document.createElement("div");
            propertyContainer.className = "my-1";

            let label = document.createElement("label");
            label.className = "form-label";
            label.style = "font-size: 8pt";
            label.setAttribute("for", property);
            label.innerHTML = `${itemProperties[PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]}:`;

            let input = document.createElement("input");
            input.className = "form-control";
            input.style = "font-size: 8pt";
            input.setAttribute("placeholder", itemProperties[PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]);
            input.setAttribute("type", itemProperties[PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE]);

            input.addEventListener("input", e => {
                if (e.target.value)
                    setStorageValue(property, e.target.value, STORAGE_CONNECT_FORM);
                else
                    deleteStorageValue(property, STORAGE_CONNECT_FORM);
            });

            propertyContainer.insertAdjacentElement("beforeend", label);
            propertyContainer.insertAdjacentElement("beforeend", input);

            formContainer.insertAdjacentElement("beforeend", propertyContainer);
        }
    }
}

setupButtonSpawnOverlay();
setupSelectStreamingSoftware();

setStorageValue(SEARCH_PARAM_SOCKET_NAME, SOCKET_NAMES[0], STORAGE_CONNECT_FORM);

requestSocketConnectFormSetup(SOCKET_NAMES[0]);
