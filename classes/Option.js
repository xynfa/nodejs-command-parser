// community modules
const Promise = require("promise");

// imports
const methods = require("../methods.js");
const Fault = require("./Fault.js");

class Option {

    constructor(name) {
        this._name = name;
    }

    // getters, setters, and set methods
    get name() { return this._name; }
    set name(name) { this._name = name; }
    setName(name) { this._name = name; return this; }

    get args() { return this._args; }
    set args(args) { this._args = args; }
    setArgs(args) { this._args = args; return this; }

    get aliases() { return this._aliases; }
    set aliases(aliases) { this._aliases = aliases; }
    setAliases(aliases) { this._aliases = aliases; return this; }

    set(key, value) {
        this[key] = value;
        return this;
    }

    async parse(separators, input, merged, custom) {
        return new Promise(async (resolve, reject) => {
            let args = {};

            // if we have arguments, parse them
            if (this._args && this._args.length > 0) {
                let argIndex = 0;

                // while there is still input to be parsed 
                while (input.length > 0) {
                    // if the parent has options, check if the input starts with the name of an option
                    if (merged) {
                        if (methods.objectScan(input, merged)) {
                            // the input started with the name of an option. break and let the parent parse it
                            break;
                        }
                    }

                    const arg = this._args[argIndex];

                    // parse argument
                    try {
                        const result = await arg.parse(separators, input, custom);

                        // if there's a syntax error, break and resolve the error
                        if (result.error) {
                            return resolve(result);
                        } else {
                            input = result.input;
                            args[arg.name] = result.output;
                        }
                    } catch (error) {
                        return reject(error);
                    }

                    argIndex++;
                    if (argIndex == this._args.length) {
                        // we have no more arguments to parse. break and let the parent parse the rest
                        break;
                    }

                    // trim the following separators
                    input = methods.trimSepperators(separators, input);
                }

                // check if we were able to parse all required arguments
                if (argIndex < this._args.length) {
                    const arg = this._args[argIndex];

                    if (!arg.optional) {
                        // we weren't able to parse all required arguments
                        return resolve({ error: new Fault("REQUIRED", `argument ${arg.name} is required`, { arg: arg }) });
                    }
                }
            }
            
            // trim the following separators
            input = methods.trimSepperators(separators, input);

            resolve({
                input: input,
                args: args
            });
        });
    }

}

// exports
module.exports = Option;