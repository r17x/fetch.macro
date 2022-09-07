const pluginTester = require("babel-plugin-tester").default;
const plugin = require("babel-plugin-macros");

module.exports = (title, tests) =>
  pluginTester({
    plugin,
    snapshot: false,
    title,
    babelOptions: { filename: __filename },
    tests,
  });
