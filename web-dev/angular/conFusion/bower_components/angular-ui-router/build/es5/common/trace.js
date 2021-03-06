var common_1 = require("../common/common");
var resolvable_1 = require("../resolve/resolvable");
var transition_1 = require("../transition/transition");
var rejectFactory_1 = require("../transition/rejectFactory");
function promiseToString(p) {
    if (common_1.is(rejectFactory_1.TransitionRejection)(p.reason))
        return p.reason.toString();
    return "Promise(" + JSON.stringify(p) + ")";
}
function functionToString(fn) {
    var fnStr = common_1.fnToString(fn);
    var namedFunctionMatch = fnStr.match(/^(function [^ ]+\([^)]*\))/);
    return namedFunctionMatch ? namedFunctionMatch[1] : fnStr;
}
var uiViewString = function (viewData) {
    return ("ui-view id#" + viewData.id + ", contextual name '" + viewData.name + "@" + viewData.creationContext + "', fqn: '" + viewData.fqn + "'");
};
var viewConfigString = function (viewConfig) {
    return ("ViewConfig targeting ui-view: '" + viewConfig.uiViewName + "@" + viewConfig.uiViewContextAnchor + "', context: '" + viewConfig.context.name + "'");
};
function normalizedCat(input) {
    return common_1.isNumber(input) ? Category[input] : Category[Category[input]];
}
function stringify(o) {
    var format = common_1.pattern([
        [common_1.not(common_1.isDefined), common_1.val("undefined")],
        [common_1.isNull, common_1.val("null")],
        [common_1.isPromise, promiseToString],
        [common_1.is(transition_1.Transition), common_1.invoke("toString")],
        [common_1.is(resolvable_1.Resolvable), common_1.invoke("toString")],
        [common_1.isInjectable, functionToString],
        [common_1.val(true), common_1.identity]
    ]);
    return JSON.stringify(o, function (key, val) { return format(val); }).replace(/\\"/g, '"');
}
var Category;
(function (Category) {
    Category[Category["RESOLVE"] = 0] = "RESOLVE";
    Category[Category["TRANSITION"] = 1] = "TRANSITION";
    Category[Category["HOOK"] = 2] = "HOOK";
    Category[Category["INVOKE"] = 3] = "INVOKE";
    Category[Category["UIVIEW"] = 4] = "UIVIEW";
    Category[Category["VIEWCONFIG"] = 5] = "VIEWCONFIG";
})(Category || (Category = {}));
var Trace = (function () {
    function Trace() {
        var _this = this;
        this._enabled = {};
        this.enable = function () {
            var categories = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                categories[_i - 0] = arguments[_i];
            }
            return _this._set(true, categories);
        };
        this.disable = function () {
            var categories = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                categories[_i - 0] = arguments[_i];
            }
            return _this._set(false, categories);
        };
        this.approximateDigests = 0;
    }
    Trace.prototype._set = function (enabled, categories) {
        var _this = this;
        if (!categories.length) {
            categories = Object.keys(Category)
                .filter(function (k) { return isNaN(parseInt(k, 10)); })
                .map(function (key) { return Category[key]; });
        }
        categories.map(normalizedCat).forEach(function (category) { return _this._enabled[category] = enabled; });
    };
    Trace.prototype.enabled = function (category) {
        return !!this._enabled[normalizedCat(category)];
    };
    Trace.prototype.traceTransitionStart = function (transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, transitionStr = stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": Started  -> " + transitionStr);
    };
    Trace.prototype.traceTransitionIgnored = function (transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, transitionStr = stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": Ignored  <> " + transitionStr);
    };
    Trace.prototype.traceHookInvocation = function (step, options) {
        if (!this.enabled(Category.HOOK))
            return;
        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, event = common_1.parse("traceData.hookType")(options) || "internal", context = common_1.parse("traceData.context.state.name")(options) || common_1.parse("traceData.context")(options) || "unknown", name = functionToString(step.fn);
        console.log("Transition #" + tid + " Digest #" + digest + ":   Hook -> " + event + " context: " + context + ", " + common_1.maxLength(200, name));
    };
    Trace.prototype.traceHookResult = function (hookResult, transitionResult, transitionOptions) {
        if (!this.enabled(Category.HOOK))
            return;
        var tid = common_1.parse("transition.$id")(transitionOptions), digest = this.approximateDigests, hookResultStr = stringify(hookResult), transitionResultStr = stringify(transitionResult);
        console.log("Transition #" + tid + " Digest #" + digest + ":   <- Hook returned: " + common_1.maxLength(200, hookResultStr) + ", transition result: " + common_1.maxLength(200, transitionResultStr));
    };
    Trace.prototype.traceResolvePath = function (path, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, pathStr = path && path.toString(), policyStr = options && options.resolvePolicy;
        console.log("Transition #" + tid + " Digest #" + digest + ":         Resolving " + pathStr + " (" + policyStr + ")");
    };
    Trace.prototype.traceResolvePathElement = function (pathElement, resolvablePromises, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        if (!resolvablePromises.length)
            return;
        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvablePromisesStr = Object.keys(resolvablePromises).join(", "), pathElementStr = pathElement && pathElement.toString(), policyStr = options && options.resolvePolicy;
        console.log("Transition #" + tid + " Digest #" + digest + ":         Resolve " + pathElementStr + " resolvables: [" + resolvablePromisesStr + "] (" + policyStr + ")");
    };
    Trace.prototype.traceResolveResolvable = function (resolvable, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvableStr = resolvable && resolvable.toString();
        console.log("Transition #" + tid + " Digest #" + digest + ":               Resolving -> " + resolvableStr);
    };
    Trace.prototype.traceResolvableResolved = function (resolvable, options) {
        if (!this.enabled(Category.RESOLVE))
            return;
        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, resolvableStr = resolvable && resolvable.toString(), result = stringify(resolvable.data);
        console.log("Transition #" + tid + " Digest #" + digest + ":               <- Resolved  " + resolvableStr + " to: " + common_1.maxLength(200, result));
    };
    Trace.prototype.tracePathElementInvoke = function (node, fn, deps, options) {
        if (!this.enabled(Category.INVOKE))
            return;
        var tid = common_1.parse("transition.$id")(options), digest = this.approximateDigests, stateName = node && node.state && node.state.toString(), fnName = functionToString(fn);
        console.log("Transition #" + tid + " Digest #" + digest + ":         Invoke " + options.when + ": context: " + stateName + " " + common_1.maxLength(200, fnName));
    };
    Trace.prototype.traceError = function (error, transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, transitionStr = stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": <- Rejected " + transitionStr + ", reason: " + error);
    };
    Trace.prototype.traceSuccess = function (finalState, transition) {
        if (!this.enabled(Category.TRANSITION))
            return;
        var tid = transition.$id, digest = this.approximateDigests, state = finalState.name, transitionStr = stringify(transition);
        console.log("Transition #" + tid + " Digest #" + digest + ": <- Success  " + transitionStr + ", final state: " + state);
    };
    Trace.prototype.traceUiViewEvent = function (event, viewData, extra) {
        if (extra === void 0) { extra = ""; }
        if (!this.enabled(Category.UIVIEW))
            return;
        console.log("ui-view: " + common_1.padString(30, event) + " " + uiViewString(viewData) + extra);
    };
    Trace.prototype.traceUiViewConfigUpdated = function (viewData, context) {
        if (!this.enabled(Category.UIVIEW))
            return;
        this.traceUiViewEvent("Updating", viewData, " with ViewConfig from context='" + context + "'");
    };
    Trace.prototype.traceUiViewScopeCreated = function (viewData, newScope) {
        if (!this.enabled(Category.UIVIEW))
            return;
        this.traceUiViewEvent("Created scope for", viewData, ", scope #" + newScope.$id);
    };
    Trace.prototype.traceUiViewFill = function (viewData, html) {
        if (!this.enabled(Category.UIVIEW))
            return;
        this.traceUiViewEvent("Fill", viewData, " with: " + common_1.maxLength(200, html));
    };
    Trace.prototype.traceViewServiceEvent = function (event, viewConfig) {
        if (!this.enabled(Category.VIEWCONFIG))
            return;
        console.log("$view.ViewConfig: " + event + " " + viewConfigString(viewConfig));
    };
    Trace.prototype.traceViewServiceUiViewEvent = function (event, viewData) {
        if (!this.enabled(Category.VIEWCONFIG))
            return;
        console.log("$view.ViewConfig: " + event + " " + uiViewString(viewData));
    };
    return Trace;
})();
var trace = new Trace();
exports.trace = trace;
watchDigests.$inject = ['$rootScope'];
function watchDigests($rootScope) {
    $rootScope.$watch(function () { trace.approximateDigests++; });
}
angular.module("ui.router").run(watchDigests);
angular.module("ui.router").service("$trace", function () { return trace; });
//# sourceMappingURL=trace.js.map