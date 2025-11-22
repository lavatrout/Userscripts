
// ==UserScript==
// @name         Ao3 Work Error Class
// @namespace    https://github.com/lavatrout/Userscripts
// @version      0.0.01
// @description  Create a custom error type for AO3 Work related errors.
// @author       Lavatrout
// ==/UserScript==

// define exports
export { Ao3_Work_Error };

/**
 * Custom error type for AO3 Work related errors.
 */
class Ao3_Work_Error extends Error {

    /**
     * Constructor for Ao3_Work_Error.
     * @param {string} message The error message.
     * @param {Error} cause The original error (if any).
     */
    constructor(message, cause) {
        super(message, { cause: cause });

        // Gets the error stack without including this constructor function
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, Ao3_Work_Error);
        }

        // Set the error name
        this.name = "Ao3_Work_Error";
    }
}