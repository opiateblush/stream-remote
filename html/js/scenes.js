import {
    getSocketName,
    getSocketConnectProperties,
} from "./stream-remote.js"

import {
    EVENT_CONNECTED, 
    EVENT_SCENE_SWITCHED,
    EVENT_SCENES_CHANGED,
    REQUEST_SCENE_NAMES, 
    REQUEST_SCENE_GET,
    REQUEST_SCENE_SET
} from "./socket/socket.js";

import {
    createStreamRemoteSocket
} from "./socket/socket.js"

const ID_CONTAINER_SCENE_BUTTONS = "container-scene-buttons";

function onStreamRemoteSocketConnected()
{
    updateScenceButtons();
}

async function updateScenceButtons()
{
    let sceneNames = await streamRemoteSocket.request(REQUEST_SCENE_NAMES);
    let activeScene = await streamRemoteSocket.request(REQUEST_SCENE_GET);

    setSceneButtons(sceneNames);
    setActiveSceneButton(activeScene);
}

function switchScene(sceneName)
{
    streamRemoteSocket.request(REQUEST_SCENE_SET, sceneName);
}

function registerStreamRemoteEvents()
{
    streamRemoteSocket.addEventListener(EVENT_CONNECTED, onStreamRemoteSocketConnected);

    streamRemoteSocket.addEventListener(EVENT_SCENE_SWITCHED, (sceneName) => {
        setActiveSceneButton();
        setActiveSceneButton(sceneName);
    });

    streamRemoteSocket.addEventListener(EVENT_SCENES_CHANGED, (sceneNames) => {
        updateScenceButtons();
    });
}

function setSceneButtons(sceneNames)
{
    let sceneButtonsContainer = document.getElementById(ID_CONTAINER_SCENE_BUTTONS);
    sceneButtonsContainer.innerHTML = "";
    
    for (let sceneNameIndex in sceneNames)
    {
        let sceneName = sceneNames[sceneNameIndex];
        let sceneColorIndex = sceneNameIndex % sceneNames.length;
        let buttonElement = document.createElement("button");

        buttonElement.className = `btn btn-lg flex-fill align-self-stretch scene-button-${sceneColorIndex} text-white m-2 fs-3`;
        buttonElement.style = "max-width: 8em; max-height: 8em;";
        buttonElement.type = "button";
        buttonElement.addEventListener("click", () => {
            buttonElement.blur();
            switchScene(buttonElement.innerHTML);
        })
        buttonElement.innerHTML = sceneName;

        sceneButtonsContainer.insertAdjacentElement("beforeend", buttonElement);
    }
}

function setActiveSceneButton(sceneName)
{
    let sceneButtonsContainer = document.getElementById(ID_CONTAINER_SCENE_BUTTONS);
    let buttonElements = sceneButtonsContainer.getElementsByTagName("button");

    for (let buttonElementIndex = 0; buttonElementIndex < buttonElements.length; buttonElementIndex++)
    {
        let buttonElement = buttonElements[buttonElementIndex];
        let sceneColorIndex = buttonElementIndex % buttonElements.length;

        if (buttonElement.innerHTML == sceneName)
            buttonElement.className = `btn btn-lg flex-fill align-self-stretch scene-button-${sceneColorIndex} scene-button-active text-white m-2 fs-3`;
        else
            buttonElement.className = `btn btn-lg flex-fill align-self-stretch scene-button-${sceneColorIndex} text-white m-2 fs-3`;
    }
}

const socketName = getSocketName();
const socketConnectProperties = getSocketConnectProperties();

let streamRemoteSocket;

createStreamRemoteSocket(socketName).then((socket) => {
    streamRemoteSocket = socket;
    
    registerStreamRemoteEvents();
    
    streamRemoteSocket.connect(socketConnectProperties);
})

// const streamRemoteSocket = await createStreamRemoteSocket(socketName)

// registerStreamRemoteEvents();

// streamRemoteSocket.connect(socketConnectProperties);

