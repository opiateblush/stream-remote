const PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION = "description";
const PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL = "label";
const PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER = "placeholder";
const PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE = "input-type";

const SOCKET_CONNECT_FORM_MODULE_NAME = "socket-connect-form.js";

/**
 * 
 * @param {string} socketName
 * 
 * @returns {Object}
 */
async function getSocketConnectFormProperties(socketName)
{
    let module = await import(`./${socketName.toLowerCase().replace(" ", "-")}/${SOCKET_CONNECT_FORM_MODULE_NAME}`);
    return module.getSocketConnectFormProperties();
}

export {
    PROPERTY_SOCKET_CONNECT_FORM_DESCRIPTION,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_LABEL,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_PLACEHOLDER,
    PROPERTY_SOCKET_CONNECT_FORM_ITEM_INPUT_TYPE
};

export {
    getSocketConnectFormProperties
};