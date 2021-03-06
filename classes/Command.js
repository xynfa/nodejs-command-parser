// community modules
const Promise = require("promise");

// imports
const methods = require("../methods.js");
const Option = require("./Option.js");
const Fault = require("./Fault.js");

class Command extends Option {

    constructor(name) {
        super(name);
    }

    // getters, setters, and set methods
    get commands() { return this._commands; }
    set commands(commands) { this._commands = commands; }
    setCommands(commands) { this._commands = commands; return this; }

    get options() { return this._options; }
    set options(options) { this._options = options; }
    setOptions(options) { this._options = options; return this; }

    async parse(separators, input, custom) {
        return new Promise(async (resolve, reject) => {
            // if we have commands, check if the input starts with the name of one
            if (this._commands && Object.keys(this._commands).length > 0) {
                const command = methods.objectScan(input, methods.merge(this._commands));

                if (command) {
                    // input starts with the name of a command. trim the name and following separators
                    input = methods.trimSepperators(separators, input.slice(command.key.length, input.length));

                    // forward the result of that command instead
                    return command.value.parse(separators, input, custom)
                        .then(resolve)
                        .catch(reject);
                }
            }

            // the output object, where we put all the parse results
            let output = {
                args: {},
                options: {}
            };
            
            let merged = null;
            let parsed = false;
            
            // if we have options, merge them
            if (this._options && Object.keys(this._options).length > 0) {
                merged = methods.merge(this._options);
            }

            // while there is still input to be parsed
            do {
                // if we have options, check if the input starts with the name of one
                if (merged) {
                    const option = methods.objectScan(input, merged);

                    if (option) {
                        // input starts with the name of an option. trim the name and following separators
                        input = methods.trimSepperators(separators, input.slice(option.key.length, input.length));

                        // parse the option's arguments
                        try {
                            const result = await option.value.parse(separators, input, merged, custom);

                            // if there's a syntax error, break and resolve the error
                            if (result.error) {
                                return resolve({
                                    command: this,
                                    error: result.error
                                });
                            } else {
                                input = result.input;
                                output.options[option.value.name] = result.args;

                                // we parsed the option's arguments. skip our own arguments and check if the input starts with another
                                continue;
                            }
                        } catch (error) {
                            return reject(error);
                        }
                    }
                }

                if (parsed) {
                    // we have already parsed our own arguments. ignore the rest of the input
                    break;
                } else {
                    // input didn't start with the name of an option. parse our own arguments
                    try {
                        const result = await super.parse(separators, input, merged, custom);
                        
                        // if there's a syntax error, break and resolve the error
                        if (result.error) {
                            return resolve({
                                command: this,
                                error: result.error
                            });
                        } else {
                            parsed = true;
                            input = result.input;
                            output.args = result.args;
                        }
                    } catch (error) {
                        return reject(error);
                    }
                }
            } while (input.length > 0)

            resolve({
                command: this,
                output: output
            });
        });
    }

}

// exports
module.exports = Command;