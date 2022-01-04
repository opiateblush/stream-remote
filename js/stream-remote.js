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
const SOTARGE_USER_PREFERENCES = "user-preferences";

// User Preferences

const USER_PREFERENCE_CPU_OK_KEY = "cpu-ok";
const USER_PREFERENCE_CPU_SUFFICIENT_KEY = "cpu-sufficient";
const USER_PREFERENCE_CPU_OK_DEFAULT_VALUE = 0.10;
const USER_PREFERENCE_CPU_SUFFICIENT_DEFAULT_VALUE = 0.20;

const USER_PREFERENCE_MEMORY_OK_KEY = "memory-ok";
const USER_PREFERENCE_MEMORY_SUFFICIENT_KEY = "memory-sufficient";
const USER_PREFERENCE_MEMORY_OK_DEFAULT_VALUE = 1.0;
const USER_PREFERENCE_MEMORY_SUFFICIENT_DEFAULT_VALUE = 2.0;

const USER_PREFERENCE_SPACE_OK_KEY = "space-ok";
const USER_PREFERENCE_SPACE_SUFFICIENT_KEY = "space-sufficient";
const USER_PREFERENCE_SPACE_OK_DEFAULT_VALUE = 50.0;
const USER_PREFERENCE_SPACE_SUFFICIENT_DEFAULT_VALUE = 20.0;

const USER_PREFERENCE_DROP_OK_KEY = "drop-ok";
const USER_PREFERENCE_DROP_SUFFICIENT_KEY = "drop-sufficient";
const USER_PREFERENCE_DROP_OK_DEFAULT_VALUE = 0.002;
const USER_PREFERENCE_DROP_SUFFICIENT_DEFAULT_VALUE = 0.005;

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

function getUserPreferences()
{
    return getStorage(SOTARGE_USER_PREFERENCES);
}

function setUserPreferences(userPreferences)
{
    for (let key in userPreferences)
        setStorageValue(key, userPreferences[key], SOTARGE_USER_PREFERENCES);
}

function setUserPreferencesDefaults(userPreferences)
{
    if (!(USER_PREFERENCE_CPU_OK_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_CPU_OK_KEY] = USER_PREFERENCE_CPU_OK_DEFAULT_VALUE;
    if (!(USER_PREFERENCE_CPU_SUFFICIENT_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_CPU_SUFFICIENT_KEY] = USER_PREFERENCE_CPU_SUFFICIENT_DEFAULT_VALUE;

    if (!(USER_PREFERENCE_MEMORY_OK_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_MEMORY_OK_KEY] = USER_PREFERENCE_MEMORY_OK_DEFAULT_VALUE;
    if (!(USER_PREFERENCE_MEMORY_SUFFICIENT_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_MEMORY_SUFFICIENT_KEY] = USER_PREFERENCE_MEMORY_SUFFICIENT_DEFAULT_VALUE;
    
    if (!(USER_PREFERENCE_SPACE_OK_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_SPACE_OK_KEY] = USER_PREFERENCE_SPACE_OK_DEFAULT_VALUE;
    if (!(USER_PREFERENCE_SPACE_SUFFICIENT_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_SPACE_SUFFICIENT_KEY] = USER_PREFERENCE_SPACE_SUFFICIENT_DEFAULT_VALUE;
    
    if (!(USER_PREFERENCE_DROP_OK_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_DROP_OK_KEY] = USER_PREFERENCE_DROP_OK_DEFAULT_VALUE;
    if (!(USER_PREFERENCE_DROP_SUFFICIENT_KEY in userPreferences))
        userPreferences[USER_PREFERENCE_DROP_SUFFICIENT_KEY] = USER_PREFERENCE_DROP_SUFFICIENT_DEFAULT_VALUE;

    return userPreferences;
}

function initUserPreferences()
{
    let userPreferences = setUserPreferencesDefaults(getUserPreferences());
    setUserPreferences(userPreferences);
}

function resetUserPreferences()
{
    let userPreferences = setUserPreferencesDefaults({});
    setUserPreferences(userPreferences);
}

initUserPreferences();

export {
    USER_PREFERENCE_CPU_OK_KEY,
    USER_PREFERENCE_CPU_SUFFICIENT_KEY,
    USER_PREFERENCE_MEMORY_OK_KEY,
    USER_PREFERENCE_MEMORY_SUFFICIENT_KEY,
    USER_PREFERENCE_SPACE_OK_KEY,
    USER_PREFERENCE_SPACE_SUFFICIENT_KEY,
    USER_PREFERENCE_DROP_OK_KEY,
    USER_PREFERENCE_DROP_SUFFICIENT_KEY
}

export {
    setSocketConnectProperties,
    getSocketConnectProperties,
    getSocketName,
    setSocketName,
    clearSocketProperties,
    setUserPreferences,
    getUserPreferences,
    resetUserPreferences
}