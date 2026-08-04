"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let keepModulesEnv = false; // false by default
if (process.env.BABEL_KEEP_MODULES === "true") {
    keepModulesEnv = true;
}
function handleOptions(options) {
    let { targets, keepModules, addModuleExports, addModuleExportsDefaultProperty, react, flow, typescript, removeAllUseStrict, notStrictDirectiveTriggers, notStrictCommentTriggers, } = options;
    // Use Lumine's Electron runtime as the default target.
    if (targets === undefined) {
        targets = {
            electron: "43",
        };
    }
    // if not provided in the options, use the environment variable
    if (keepModules === undefined) {
        keepModules = keepModulesEnv;
    }
    // add module exports by default
    if (addModuleExports === undefined) {
        addModuleExports = true;
    }
    // do not add default property by default
    if (addModuleExportsDefaultProperty === undefined) {
        addModuleExportsDefaultProperty = false;
    }
    if (react === undefined) {
        react = true;
    }
    if (flow === undefined) {
        flow = true;
    }
    if (typescript === undefined) {
        typescript = true;
    }
    if (removeAllUseStrict === undefined) {
        removeAllUseStrict = false;
    }
    if (notStrictDirectiveTriggers === undefined) {
        notStrictDirectiveTriggers = ["use babel"];
    }
    if (notStrictCommentTriggers === undefined) {
        notStrictCommentTriggers = ["@babel", "@flow", "* @babel", "* @flow"];
    }
    return {
        targets,
        keepModules,
        addModuleExports,
        addModuleExportsDefaultProperty,
        react,
        flow,
        typescript,
        removeAllUseStrict,
        notStrictDirectiveTriggers,
        notStrictCommentTriggers,
    };
}
function transformNotStrict({ types }) {
    return {
        name: "transform-not-strict",
        visitor: {
            Directive(path, state) {
                var _a;
                var _b, _c;
                if (path.node.value.value !== "use strict")
                    return;
                if (state.opts.removeAll) {
                    path.node.value.value = "not strict";
                    return;
                }
                for (const sibling of path.container) {
                    if (types.isDirective(sibling) &&
                        (sibling.value.value === "not strict" ||
                            ((_a = state.opts.directiveTriggers) === null || _a === void 0 ? void 0 : _a.includes(sibling.value.value)))) {
                        path.remove();
                        return;
                    }
                    const comments = [...((_b = sibling.leadingComments) !== null && _b !== void 0 ? _b : []), ...((_c = sibling.trailingComments) !== null && _c !== void 0 ? _c : [])];
                    if (comments.some((comment) => { var _a; return (_a = state.opts.commentTriggers) === null || _a === void 0 ? void 0 : _a.includes(comment.value.trim()); })) {
                        path.remove();
                        return;
                    }
                }
            },
        },
    };
}
// eslint-disable-next-line no-unused-vars
module.exports = (_api, options, _dirname) => {
    const { targets, keepModules, addModuleExports, addModuleExportsDefaultProperty, react, flow, typescript, removeAllUseStrict, notStrictDirectiveTriggers, notStrictCommentTriggers, } = handleOptions(options);
    const presets = [
        [
            require("@babel/preset-env"),
            {
                targets,
                modules: keepModules ? false : "commonjs",
            },
        ],
    ];
    if (react !== false) {
        const presetReact = require("@babel/preset-react");
        // Editor packages still use per-file @jsx pragmas (for example, Etch's
        // `/** @jsx etch.dom */`). Babel 8 defaults to the automatic runtime,
        // which rejects those pragmas, so retain the preset's legacy behavior.
        presets.push(typeof react === "object" ? [presetReact, react] : [presetReact, { runtime: "classic" }]);
    }
    if (flow !== false) {
        const presetFlow = require("@babel/preset-flow");
        presets.push(typeof flow === "object" ? [presetFlow, flow] : presetFlow);
    }
    if (typescript !== false) {
        const presetTypeScript = require("@babel/preset-typescript");
        presets.push(typeof typescript === "object" ? [presetTypeScript, typescript] : presetTypeScript);
    }
    const plugins = [
        require("@babel/plugin-transform-logical-assignment-operators"),
        require("@babel/plugin-transform-optional-chaining"),
        require("@babel/plugin-transform-nullish-coalescing-operator"),
        require("@babel/plugin-transform-export-namespace-from"),
        require("@babel/plugin-transform-numeric-separator"),
        // Legacy decorators must run before the class-properties transform so
        // that decorated fields (e.g. MobX's @observable in Hydrogen) compile.
        [require("@babel/plugin-proposal-decorators"), { version: "legacy" }],
        require("@babel/plugin-transform-class-properties"),
        require("@babel/plugin-transform-private-methods"),
        require("@babel/plugin-transform-private-property-in-object"), // #38
        require("@babel/plugin-transform-json-strings"),
        // not strict
        [
            transformNotStrict,
            {
                removeAll: removeAllUseStrict,
                directiveTriggers: notStrictDirectiveTriggers,
                commentTriggers: notStrictCommentTriggers,
            },
        ],
        // reserved keywords
        require("@babel/plugin-transform-reserved-words"),
    ];
    // transform modules (e.g when without Rollup)
    if (!keepModules) {
        plugins.push(require("@babel/plugin-transform-modules-commonjs"));
        if (addModuleExports) {
            plugins.push([
                require("babel-plugin-add-module-exports"),
                { addDefaultProperty: addModuleExportsDefaultProperty },
            ]); // The editor needs this.
        }
    }
    return {
        presets,
        plugins,
        assumptions: {
            setPublicClassFields: true,
            privateFieldsAsProperties: true,
        },
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFJQSxJQUFJLGNBQWMsR0FBRyxLQUFLLENBQUEsQ0FBQyxtQkFBbUI7QUFFOUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixLQUFLLE1BQU0sRUFBRSxDQUFDO0lBQzlDLGNBQWMsR0FBRyxJQUFJLENBQUE7QUFDdkIsQ0FBQztBQWVELFNBQVMsYUFBYSxDQUFDLE9BQWdCO0lBQ3JDLElBQUksRUFDRixPQUFPLEVBQ1AsV0FBVyxFQUNYLGdCQUFnQixFQUNoQiwrQkFBK0IsRUFDL0IsS0FBSyxFQUNMLElBQUksRUFDSixVQUFVLEVBQ1Ysa0JBQWtCLEVBQ2xCLDBCQUEwQixFQUMxQix3QkFBd0IsR0FDekIsR0FBRyxPQUFPLENBQUE7SUFFWCx1REFBdUQ7SUFDdkQsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDMUIsT0FBTyxHQUFHO1lBQ1IsUUFBUSxFQUFFLElBQUk7U0FDZixDQUFBO0lBQ0gsQ0FBQztJQUVELCtEQUErRDtJQUMvRCxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUM5QixXQUFXLEdBQUcsY0FBYyxDQUFBO0lBQzlCLENBQUM7SUFFRCxnQ0FBZ0M7SUFDaEMsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUNuQyxnQkFBZ0IsR0FBRyxJQUFJLENBQUE7SUFDekIsQ0FBQztJQUVELHlDQUF5QztJQUN6QyxJQUFJLCtCQUErQixLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ2xELCtCQUErQixHQUFHLEtBQUssQ0FBQTtJQUN6QyxDQUFDO0lBRUQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDeEIsS0FBSyxHQUFHLElBQUksQ0FBQTtJQUNkLENBQUM7SUFFRCxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUN2QixJQUFJLEdBQUcs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