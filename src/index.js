import type { ConfigAPI, InputOptions, PluginAPI, PluginItem, PresetItem } from "@babel/core" with {
  "resolution-mode": "require",
}

let keepModulesEnv = false // false by default

if (process.env.BABEL_KEEP_MODULES === "true") {
  keepModulesEnv = true
}

export type Options = {
  targets?: InputOptions["targets"]
  keepModules?: boolean
  addModuleExports?: boolean
  addModuleExportsDefaultProperty?: boolean
  react?: boolean | Record<string, any>
  flow?: boolean | Record<string, any>
  typescript?: boolean | Record<string, any>
  removeAllUseStrict?: boolean
  notStrictDirectiveTriggers?: string[]
  notStrictCommentTriggers?: string[]
}

function handleOptions(options: Options) {
  let {
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
  } = options

  // Use Lumine's Electron runtime as the default target.
  if (targets === undefined) {
    targets = {
      electron: "43",
    }
  }

  // if not provided in the options, use the environment variable
  if (keepModules === undefined) {
    keepModules = keepModulesEnv
  }

  // add module exports by default
  if (addModuleExports === undefined) {
    addModuleExports = true
  }

  // do not add default property by default
  if (addModuleExportsDefaultProperty === undefined) {
    addModuleExportsDefaultProperty = false
  }

  if (react === undefined) {
    react = true
  }

  if (flow === undefined) {
    flow = true
  }

  if (typescript === undefined) {
    typescript = true
  }

  if (removeAllUseStrict === undefined) {
    removeAllUseStrict = false
  }
  if (notStrictDirectiveTriggers === undefined) {
    notStrictDirectiveTriggers = ["use babel"]
  }
  if (notStrictCommentTriggers === undefined) {
    notStrictCommentTriggers = ["@babel", "@flow", "* @babel", "* @flow"]
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
  }
}

function transformNotStrict({ types }: PluginAPI) {
  return {
    name: "transform-not-strict",
    visitor: {
      Directive(path: any, state: any) {
        if (path.node.value.value !== "use strict") return
        if (state.opts.removeAll) {
          path.node.value.value = "not strict"
          return
        }

        for (const sibling of path.container) {
          if (
            types.isDirective(sibling) &&
            (sibling.value.value === "not strict" ||
              state.opts.directiveTriggers?.includes(sibling.value.value))
          ) {
            path.remove()
            return
          }

          const comments = [...(sibling.leadingComments ?? []), ...(sibling.trailingComments ?? [])]
          if (comments.some((comment) => state.opts.commentTriggers?.includes(comment.value.trim()))) {
            path.remove()
            return
          }
        }
      },
    },
  }
}

// eslint-disable-next-line no-unused-vars
module.exports = (_api: ConfigAPI, options: Options, _dirname: string): InputOptions => {
  const {
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
  } = handleOptions(options)

  const presets = [
    [
      require("@babel/preset-env") as PresetItem,
      {
        targets,
        modules: keepModules ? false : "commonjs",
      },
    ],
  ] as PresetItem[]

  if (react !== false) {
    const presetReact = require("@babel/preset-react")
    // Editor packages still use per-file @jsx pragmas (for example, Etch's
    // `/** @jsx etch.dom */`). Babel 8 defaults to the automatic runtime,
    // which rejects those pragmas, so retain the preset's legacy behavior.
    presets.push(
      typeof react === "object" ? [presetReact, react] : [presetReact, { runtime: "classic" }],
    )
  }

  if (flow !== false) {
    const presetFlow = require("@babel/preset-flow")
    presets.push(typeof flow === "object" ? [presetFlow, flow] : presetFlow)
  }

  if (typescript !== false) {
    const presetTypeScript = require("@babel/preset-typescript")
    presets.push(typeof typescript === "object" ? [presetTypeScript, typescript] : presetTypeScript)
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
  ] as PluginItem[]

  // transform modules (e.g when without Rollup)
  if (!keepModules) {
    plugins.push(require("@babel/plugin-transform-modules-commonjs"))

    if (addModuleExports) {
      plugins.push([
        require("babel-plugin-add-module-exports"),
        { addDefaultProperty: addModuleExportsDefaultProperty },
      ] as PluginItem) // The editor needs this.
    }
  }

  return {
    presets,
    plugins,
    assumptions: {
      setPublicClassFields: true,
      privateFieldsAsProperties: true,
    },
  }
}
