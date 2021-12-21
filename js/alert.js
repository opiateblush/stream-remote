const ID_CONTAINER_ALERTS = "container-alerts";

const CLASS_ALERT_ERROR = "alert-danger";
const CLASS_ALERT_SUCCESS = "alert-success";
const CLASS_ALERT_INFO = "alert-info";

function showInfoAlert(text, alertID)
{
    showAlert(text, alertID, CLASS_ALERT_INFO);
}

function showSuccessAlert(text, alertID)
{
    showAlert(text, alertID, CLASS_ALERT_SUCCESS);
}

function showErrorAlert(text, alertID)
{
    showAlert(text, alertID, CLASS_ALERT_ERROR);
}

function removeAlert(alertID)
{
    let alertContainer = window.top.document.getElementById(ID_CONTAINER_ALERTS);

    for (let child of Array.from(alertContainer.children))
        if (child.id == alertID)
            alertContainer.removeChild(child);
}

function showAlert(text, alertID, alertClass)
{
    let alertContainer = window.top.document.getElementById(ID_CONTAINER_ALERTS);
    let altertIDPresent = false;

    for (let child of Array.from(alertContainer.children))
        if (child.id == alertID)
            altertIDPresent = true;
    
    if (!altertIDPresent)
    {
        let alertElement = window.top.document.createElement("div");
        alertElement.className = `alert ${alertClass} alert-dismissible fade show`;
        alertElement.id = alertID;

        let dismissButton = window.top.document.createElement("button");
        dismissButton.className = "btn-close";
        dismissButton.type = "button";
        dismissButton.setAttribute("data-bs-dismiss", "alert");

        let alertText = window.top.document.createElement("span");
        alertText.innerHTML = text;

        alertElement.insertAdjacentElement("beforeend", dismissButton);
        alertElement.insertAdjacentElement("beforeend", alertText);

        alertContainer.insertAdjacentElement("beforeend", alertElement);
    }
    else
    {
        let alertElement = window.top.document.getElementById(alertID);
        let alertText = alertElement.getElementsByTagName("span")[0];

        alertText.innerHTML = text;
    }
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