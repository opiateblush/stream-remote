class NotImplementedError extends Error
{
    constructor(message = "")
    {
        super();
        this.name = "Not Implemented Error"
        this.message = message;
    }
}

export {
    NotImplementedError
}