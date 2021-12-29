import {
    SEARCH_PARAM_SOCKET_NAME
} from "./constants.js"

import {
    setStorageValue,
    getStorageValue,
    getStorage,
    clearStorage
} from "./storage.js"

const STORAGE_SOCKET_CONNECT_PROPERTIES = "socket-connect";
const STORAGE_SOCKET_GENERAL_PROPERTIES = "socket-general";

function setSocketConnectProperties(connectProperties)
{
    for (let key in connectProperties)
        setStorageValue(key, connectProperties[key], STORAGE_SOCKET_CONNECT_PROPERTIES);
}

function getSocketConnectProperties()
{
    return getStorage(STORAGE_SOCKET_CONNECT_PROPERTIES);
}

function setSocketName(name)
{
    setStorageValue(SEARCH_PARAM_SOCKET_NAME, name, STORAGE_SOCKET_GENERAL_PROPERTIES);
}

function getSocketName()
{
    return getStorageValue(SEARCH_PARAM_SOCKET_NAME, STORAGE_SOCKET_GENERAL_PROPERTIES);
}

function clearSocketProperties()
{
    clearStorage(STORAGE_SOCKET_CONNECT_PROPERTIES);
    clearStorage(STORAGE_SOCKET_GENERAL_PROPERTIES);
}

export {
    setSocketConnectProperties,
    getSocketConnectProperties,
    getSocketName,
    setSocketName,
    clearSocketProperties
}