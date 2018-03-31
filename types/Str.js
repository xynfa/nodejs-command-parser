// imports
const Type = require("../classes/Type.js");
const Fault = require("../classes/Fault.js");
const methods = require("../methods.js");

class Str extends Type {

    constructor(options) {
        // defaults
        if (options) {
            for (const key in Str.defaults) {
                if (!options[key]) {
                    options[key] = Str.defaults[key];
                }
            }
        } else {
            options = Str.defaults;
        }

        super(options);
    }

    _parse(separators, input) {
        let output = "";
        let quote = false;

        const result = methods.arrayScan(input, this._options.stringSeparators);

        if (result) {
            // input starts with quotation
            quote = true;
            input = input.slice(result.length, input.length);
        }

        // while there is still input to be parsed
        while (input.length > 0) {
            const result = methods.arrayScan(input, [
                ...this._options.stringSeparators,
                ...separators
            ], this._options.caseSensitive);

            if (result) {
                // input started with something string related
                if (quote) {
                    input = input.slice(result.length, input.length);

                    if (this._options.stringSeparators.includes(result)) {
                        // found end quotation. break
                        break;
                    } else if (separators.includes(result)) {
                        // input started with quotation. we don't need to break
                        output += result;
                    }
                } else if (separators.includes(result)) {
                    // input didn't start with quotation. break
                    break;
                }
            } else {
                // input didn't start with something string related. add character to the output
                output += input[0];
                input = input.slice(1, input.length);
            }
        }

        return {
            output,
            input
        };
    }

    parse(separators, input, custom) {
        const result = this._parse(separators, input);
        const output = result.output;

        if (this._options.min && output.length < this._options.min) {
            throw new Fault("TOO_SMALL", `string must be atleast ${this._options.min}  characters long`, {
                string: output,
                min: this._options.min
            });
        } else if (this._options.max && output.length > this._options.max) {
            throw new Fault("TOO_LARGE", `string must at max be ${this._options.max} characters long`, {
                string: output,
                max: this._options.max
            });
        }

        input = result.input;

        return [ input, output ];
    }

    toString() {
        return "string";
    }

}

// defaults
Str.defaults = {
    stringSeparators: [ '"', "'" ]
};

// exports
module.exports = Str;