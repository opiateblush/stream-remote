let globalStorage = "default-storage";

function setGlobalStorage(storage)
{
    globalStorage = storage;
}

function getGlobalStorage()
{
    return globalStorage;
}

function getLocalStorageKey(storage, key)
{
    return `${storage}-${key}`;
}

function getStorageKey(storage, localStorageKey)
{
    return localStorageKey.substring(storage.length + 1, localStorageKey.length);
}

function setStorageValue(key, value, storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();

    let localStorageKey = getLocalStorageKey(storage, key);
    localStorage[localStorageKey] = value;
}

function getStorageValue(key, storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();
    
    let localStorageKey = getLocalStorageKey(storage, key);
    return localStorage[localStorageKey];
}

function isStorageKey(key, storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();

    let localStorageKey = getLocalStorageKey(storage, key);
    return localStorageKey in localStorage;
}

function deleteStorageValue(key, storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();
    
    let localStorageKey = getLocalStorageKey(storage, key);

    if (localStorageKey in localStorage)
        delete localStorage[localStorageKey];
}

function getStorage(storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();
    
    let _storage = {};

    for (let key in localStorage)
        if (key.startsWith(storage))
            _storage[getStorageKey(storage, key)] = localStorage[key]; 
    
    return _storage; 
}

function getStorageKeys(storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();
    
    let keys = [];

    for (let key in localStorage)
        if (key.startsWith(storage))
            keys.push(getStorageKey(storage, key));
    
    return keys; 
}

function getStorageValues(storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();
    
    let values = [];

    for (let key in localStorage)
        if (key.startsWith(storage))
            values.push(localStorage[key]);
    
    return values; 
}

function clearStorage(storage = undefined)
{
    if (storage === undefined)
        storage = getGlobalStorage();

    for (let key of getStorageKeys(storage))
        delete localStorage[getLocalStorageKey(storage, key)];
}

export {
    setStorageValue,
    getStorageValue,
    isStorageKey,
    deleteStorageValue,
    getStorage,
    getStorageKeys,
    getStorageValues,
    clearStorage,
    setGlobalStorage,
    getGlobalStorage
};