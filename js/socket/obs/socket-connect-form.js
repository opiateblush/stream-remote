import {
    PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE
} from "../socket-connect-form.js";

import {
    PROPERTY_OBS_ADDRESS,
    PROPERTY_OBS_PORT,
    PROPERTY_OBS_PASSWORD 
} from "./socket.js";

const PLACEHOLDER_OBS_ADRESS = "localhost";
const PLACEHOLDER_OBS_PORT = "4444";
const PLACEHOLDER_OBS_PASSWORD = "Optional";

const LABEL_OBS_ADDRESS = "Address";
const LABEL_OBS_PORT = "Port";
const LABEL_OBS_PASSWORD = "Password";

const PROPERTIES_SOCKET_FORM = {
    [PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION]: "Connect to OBS via obs-websocket plugin:",
    [PROPERTY_OBS_ADDRESS]: {
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]: LABEL_OBS_ADDRESS,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]: PLACEHOLDER_OBS_ADRESS,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP]: "Unless you're running OBS on a different machine, leave that field empty.",
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE]: "text"
    },
    [PROPERTY_OBS_PORT]: {
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]: LABEL_OBS_PORT,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]: PLACEHOLDER_OBS_PORT,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP]: "Did you configure a different port? If not leave that field emtpy.",
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE]: "text" 
    },
    [PROPERTY_OBS_PASSWORD]: {
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]: LABEL_OBS_PASSWORD,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]: PLACEHOLDER_OBS_PASSWORD,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP]: "If you set a password inside OBS then you must enter it here, otherwise leave it empty.",
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE]: "password" 
    }
};

function getSocketConnectFormProperties()
{
    return PROPERTIES_SOCKET_FORM;
}

export {
    getSocketConnectFormProperties
};