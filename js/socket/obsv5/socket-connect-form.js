import {
    PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE
} from "../socket-connect-form.js";

import {
    PROPERTY_OBS_V5_ADDRESS,
    PROPERTY_OBS_V5_PORT,
    PROPERTY_OBS_V5_PASSWORD 
} from "./socket.js";

const PLACEHOLDER_OBS_ADRESS = "127.0.0.1";
const PLACEHOLDER_OBS_PORT = "4455";
const PLACEHOLDER_OBS_PASSWORD = "Optional";

const LABEL_OBS_ADDRESS = "Address";
const LABEL_OBS_PORT = "Port";
const LABEL_OBS_PASSWORD = "Password";

const PROPERTIES_SOCKET_FORM = {
    [PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION]: "Connect to OBS via built-in WebSocket server:",
    [PROPERTY_OBS_V5_ADDRESS]: {
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]: LABEL_OBS_ADDRESS,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]: PLACEHOLDER_OBS_ADRESS,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP]: "Unless you're running OBS on a different machine, leave this field empty.",
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE]: "text"
    },
    [PROPERTY_OBS_V5_PORT]: {
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]: LABEL_OBS_PORT,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]: PLACEHOLDER_OBS_PORT,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP]: "Did you configure a different port? If not leave this field empty.",
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE]: "text" 
    },
    [PROPERTY_OBS_V5_PASSWORD]: {
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL]: LABEL_OBS_PASSWORD,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER]: PLACEHOLDER_OBS_PASSWORD,
        [PROPERTY_SOCKET_CONNECT_FORM_ITEM_TOOLTIP]: "Attention! If you didn't disable authentication inside OBS you have to provide a password here (it's enabled by default). Leave empty if authentication is disabled.",
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