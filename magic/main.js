define(['services/kernels/kernel'], function (kernel) {

    var _magics = [];

    function register(re, handler) {
        if (typeof re === 'string') {
            re = RegExp("^" + re + "(?:\\s|$)");
        }
        _magics.unshift({
            spell: re,
            charm: handler
        });
    }

    function charm(code) {
        //code = code.trim()
        var magic = _magics.find(function (magic) {
            return magic.spell.test(code);
        });
        if (magic) {
            code = magic.charm(new MagicCode(code));
        }
        return code;
    }

    var execute = kernel.Kernel.prototype.execute;

    kernel.Kernel.prototype.execute = function (code, callbacks, options) {
        return execute.call(this, charm(code), callbacks, options);
    };


    function MagicCode(content) {
        this._content = content;
        // memoized
        this._header = null;
        this._options = null;
    }

    MagicCode.prototype = {
        constructor: MagicCode,

        /** cmd line end */
        get _head() {
            if (!this._haeder) {
                var content = this.content,
                    eol = content.indexOf('\n');
                this._header = eol === -1 ? content.length : eol;
            }
            return this._header;
        },

        get content() {return this._content;},

        get cmd() {
            return this.content.substring(0, this._head);
        },

        get body() {
            return this.content.substr(this._head + 1).trim(); // or not trim?
        },

        /**
         * @return {Array} Arguments. argv[0] is the magic command name
         */
        get argv() {
            return this.cmd.split(/\s+/);
        },

        /**
         * Build {option: value} map.
         * There's (currently) no arguments definition: every option is assumed
         * to have a value (may 'swallow' the following positional argument
         * or default to `PRESENT` (true) if there's none)
         *
         * @return {Object} Options dict.
         */
        get options() {
            if (!this._options) {
                var PRESENT = true; // value used for valueless opts
                var options = {},
                    argv = this.argv,
                    inx = 1,
                    opt;
                while ((opt = argv[inx])) {
                    inx += 1;
                    if (opt[0] === '-') {
                        var next = argv[inx],
                            nextvalue = (next && next[0] !== '-') ?
                                next : PRESENT,
                            name,
                            value;
                        if (opt[1] === '-') { // --opt, --opt=val, --opt val
                            var eqinx = opt.indexOf('=');
                            if (eqinx === -1) { // --opt [val]
                                name = opt.substr(2);
                                value = nextvalue;
                            } else { // --opt=val
                                name = opt.substring(2, eqinx);
                                value = opt.substr(eqinx + 1);
                            }
                        } else { // -x, -xvalue, -x value
                            name = opt.substr(1, 1),
                            value = opt.substr(2) || nextvalue;
                        }
                        options[name] = value;
                    }
                } // while
                this._options = options;
            }
            return this._options;
        },

        toString: function () {return "[object MagicCode]";}
    };

    return {
        register: register
    };

});
