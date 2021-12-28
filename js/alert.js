const ID_CONTAINER_ALERTS = "container-alerts";

const CLASS_ALERT_ERROR = "alert-danger";
const CLASS_ALERT_SUCCESS = "alert-success";
const CLASS_ALERT_INFO = "alert-info";

function showInfoAlert(text, alertID, timeout = undefined)
{
    showAlert(text, alertID, CLASS_ALERT_INFO, timeout);
}

function showSuccessAlert(text, alertID, timeout = undefined)
{
    showAlert(text, alertID, CLASS_ALERT_SUCCESS, timeout);
}

function showErrorAlert(text, alertID, timeout = undefined)
{
    showAlert(text, alertID, CLASS_ALERT_ERROR, timeout);
}

function removeAlert(alertID)
{
    let alertContainer = window.top.document.getElementById(ID_CONTAINER_ALERTS);

    for (let child of Array.from(alertContainer.children))
        if (child.id == alertID)
            child.remove();
}

function showAlert(text, alertID, alertClass, timeout = undefined)
{
    let alertContainer = window.top.document.getElementById(ID_CONTAINER_ALERTS);

    for (let child of Array.from(alertContainer.children))
        if (child.id == alertID)
            child.remove();
    
    let alertElement = window.top.document.createElement("div");
    alertElement.className = `alert ${alertClass}`;
    alertElement.id = alertID;       

    let alertText = window.top.document.createElement("span");
    alertText.innerHTML = text;

    if (timeout !== undefined)
    {
        setTimeout(() => {
            removeAlert(alertID);
        }, timeout);
    }
    else
    {
        alertElement.classList.add("alert-dismissible", "fade", "show");

        let dismissButton = window.top.document.createElement("button");
        dismissButton.className = "btn-close";
        dismissButton.type = "button";
        dismissButton.setAttribute("data-bs-dismiss", "alert");

        alertElement.insertAdjacentElement("beforeend", dismissButton);
    }
        
    alertElement.insertAdjacentElement("afterbegin", alertText);

    alertContainer.insertAdjacentElement("beforeend", alertElement);
}

export {
    ID_CONTAINER_ALERTS
};

export {
    showInfoAlert,
    showSuccessAlert,
    showErrorAlert,
    showAlert,
    removeAlert
}