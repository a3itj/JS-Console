
$(function() {
	"use strict";
    var command = $("#cmdInput");
    var output = $("#output");
    var currentHistory = '';
    var currentIndex = null;
    var matchedIndex = null;
    var matched = [];
    var typedVal = "";

    var content = $("#content");
    command.on("keyup", function(event) {
        var keyCode = event.keyCode;
        var val = command.val().trim();
        if (!val) {
            return;
        }

        switch (keyCode) {
            case 13:
                execCommand(val);
                addHistory();
                setValue();
                break
            case 9:
                autoComplete();
                break;
            default:
                getSuggestion();
                break;
        }

    });

    command.on("keydown", function(event) {
        var keyCode = event.keyCode;

        if (keyCode === 9) {
            event.preventDefault();

        }
        if (!(keyCode === 38 || keyCode === 40)) {
            return;
        }
        moveThroughHistory(keyCode - 39);

    });

    function getSuggestion() {
        matchedIndex = null;

        typedVal = command.val();
        matched = patternMatch(typedVal);
    }

    function setValue(cmd) {
        currentHistory = cmd || "";
        command.focus();
        command.val(currentHistory);

        output.scrollTop(output[0].scrollHeight - output.height());
    }

    function autoComplete() {
        if (matched.length > 0) {
            if (matchedIndex) {
                matchedIndex = matchedIndex + 1;
            } else {
                matchedIndex = 1;
            }

            if (matchedIndex === matched.length + 1) {
                matchedIndex = null;
                command.val(typedVal);
            } else {
                command.val(matched[matchedIndex - 1]);
            }

        }

    }

    function getProps(obj) {
        var props = [];
        try {
            for (var p in obj) props.push(p);
        } catch (e) {}
        return props;
    }

    function patternMatch(pattern) {
        var prop = "window";
        var psplit = pattern.split(".");
        var plength = psplit.length;
        var pt = pattern;

        if (plength > 1) {
            prop = psplit.slice(0, plength - 1).join('.');
            pt = psplit[plength-1]
        }


        var props = getProps(eval(prop));

        return props.filter(function(v) {
            return v.indexOf(pt) === 0;
        }).map(function(v){
            return plength > 1 ? prop + "." + v : v;
        })
    }

    function loadScript(src) {
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.src = src
        document.body.appendChild(script);
    }

    function showHistory() {
        var history = localStorage.getItem("cmdHistory").split(",");
        var frag = document.createDocumentFragment();
        var hrow;
        history.forEach(function(v, i) {
            hrow = document.createElement("div");
            hrow.innerHTML = v.trim();
            hrow.className =  "history";
            frag.appendChild(hrow);
        })

        output.append(frag);
    }

    function moveThroughHistory(dir) {
        var history = localStorage.getItem("cmdHistory").split(",");
        var length = history.length;
        currentIndex = currentIndex || length;
        if (dir < 0 && currentIndex !== 0) {
            currentIndex = currentIndex - 1;
        } else if (dir > 0 && currentIndex !== length) {
            currentIndex = currentIndex + 1;
        }
        setValue(history[currentIndex]);

    }

    function execCommand(cmd) {
        if (!cmd) {
            return;
        }
        currentIndex = null;
        cmdHtml(cmd);

        switch (cmd) {
            case ":history":
                showHistory();
                break;
            case ":help":
                showHelp();
                break;
            case ":clear":
                clear();
                break;
            case ":removehistory":
                removehistory();
                break;
            default:
                evalCommand(cmd);
                break;
        }

    };

    function showHelp(){
        var jHelp = $("#help")
        output.after(jHelp);
    };

    function cmdHtml(cmd) {
        var cmd = $('<pre class="cmd"></pre>').html(cmd);
        output.append(cmd);
    }

    function stringify(obj) {
        try {
            return JSON.stringify(obj);
        } catch (e) {
            return obj.toString();
        }
    }

    function toEscaped (string) {
        return String(string)
            .replace(/\\"/g, '"')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function evalCommand(cmd) {
        var response = $('<div class="response"></div>')
        try {
            var evalRes = eval.call(window, cmd);
        } catch (e) {
            evalRes = e.toString();
            response.addClass("error");
        }

        if (_.isString(evalRes)) evalRes = '\"' + evalRes.toString().replace(/"/g, '\\"') + '\"';
        if (_.isFunction(evalRes)) evalRes = evalRes.toString().replace(/"/g, '\\"');
        if (_.isObject(evalRes)) evalRes = stringify(evalRes).replace(/"/g, '\\"');
        if (_.isUndefined(evalRes)) {
            evalRes = "undefined";
        }

        response.html(toEscaped(evalRes));
        $("#output").append(response);
    }


    function clear() {
        $("#output").html("");
    }

    function addHistory(event) {
        var oldItem = localStorage.getItem("cmdHistory") || "";
        try {
            localStorage.setItem("cmdHistory", oldItem + "," + command.val());
            command.val("");
        } catch (e) {
            alert("Exceeded Storage Quota!");
        }

    };

    (function removehistory() {
        localStorage.setItem("cmdHistory" , "")
    })();

});