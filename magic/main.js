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
            var parsed = parse(code);
            code = magic.charm(parsed.argv, parsed.body);
        }
        return code;
    }

    var execute = kernel.Kernel.prototype.execute;

    kernel.Kernel.prototype.execute = function (code, callbacks, options) {
        return execute.call(this, charm(code), callbacks, options);
    };


    /** PRE MAGIC.test(text) */
    function parse(text) {
        var lineEnd = text.indexOf('\n');
        if (lineEnd === -1) lineEnd = text.length;

        var head = text.substring(0, lineEnd),
            body = text.substr(lineEnd + 1).trim();

        return {argv: argv(head), body: body};
    }

    function argv(cmd) {return cmd.split(/\s+/);}

    return {
        register: register
    };

});
