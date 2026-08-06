const babel = require("@babel/core");
const preset = require("../src");

function transform(source, options = {}, filename = "example.js") {
  return babel.transformSync(source, {
    filename,
    presets: [[preset, options]],
  }).code;
}

function evaluateCommonJS(code) {
  const moduleUnderTest = { exports: {} };
  Function("module", "exports", code)(moduleUnderTest, moduleUnderTest.exports);
  return moduleUnderTest.exports;
}

describe("Babel preset", () => {
  it("transforms modern syntax and exposes a default export directly", () => {
    const code = transform(`
      "use babel";
      export default class Example {
        value = 1;
        read(input) {
          return input?.value ?? this.value;
        }
      }
    `);

    expect(code).not.toMatch(/["']use strict["']/);

    const Example = evaluateCommonJS(code);
    expect(new Example().read(null)).toBe(1);
    expect(new Example().read({ value: 2 })).toBe(2);
  });

  it("uses the classic React runtime so per-file JSX pragmas remain valid", () => {
    const code = transform(
      `
        /** @babel */
        /** @jsx etch.dom */
        const view = <div className="settings-view" />;
      `,
      { flow: false, typescript: false },
      "settings-view.js",
    );

    expect(code).toMatch(/etch\.dom\("div"/);
  });

  it("supports legacy decorators", () => {
    const code = transform(
      `
        function observer(target) {
          target.observed = true;
        }

        @observer
        class Display {}

        module.exports = Display;
      `,
      { flow: false, typescript: false },
      "display.js",
    );

    expect(code).not.toMatch(/@observer/);
    expect(evaluateCommonJS(code).observed).toBe(true);
  });

  it("preserves ES modules when keepModules is enabled", () => {
    const code = transform("export const answer = 42;", {
      keepModules: true,
      flow: false,
      react: false,
      typescript: false,
    });

    expect(code).toMatch(/export const answer = 42/);
    expect(code).not.toMatch(/module\.exports|exports\.answer/);
  });

  it("can retain Babel's default-export wrapper", () => {
    const code = transform("export default 42;", {
      addModuleExports: false,
      flow: false,
      react: false,
      typescript: false,
    });

    expect(evaluateCommonJS(code)).toEqual({ default: 42 });
  });

  it("keeps strict mode when no opt-out trigger is present", () => {
    const code = transform('"use strict"; const answer = 42;', {
      flow: false,
      react: false,
      typescript: false,
    });

    expect(code).toMatch(/["']use strict["']/);
  });

  it("honors custom directive and comment triggers for non-strict files", () => {
    const directiveCode = transform('"legacy file"; "use strict";', {
      flow: false,
      react: false,
      typescript: false,
      notStrictDirectiveTriggers: ["legacy file"],
    });
    const commentCode = transform('"use strict"; /* legacy file */\n"another directive";', {
      flow: false,
      react: false,
      typescript: false,
      notStrictCommentTriggers: ["legacy file"],
    });

    expect(directiveCode).not.toMatch(/["']use strict["']/);
    expect(commentCode).not.toMatch(/["']use strict["']/);
  });

  it("marks every explicitly strict file as non-strict when requested", () => {
    const code = transform('"use strict"; const answer = 42;', {
      flow: false,
      react: false,
      typescript: false,
      removeAllUseStrict: true,
    });

    expect(code).not.toMatch(/["']use strict["']/);
    expect(code).toMatch(/["']not strict["']/);
  });
});
