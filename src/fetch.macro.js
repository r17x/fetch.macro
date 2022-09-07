const { createMacro } = require("babel-plugin-macros");

const getValue = (path) =>
  ({
    [true]: () => null,
    [path.type === "CallExpression"]: () => path.node.arguments[0].value,
    [path.type === "TaggedTemplateExpression"]: () => path.node.quasi.quasis[0].value.cooked,
  }.true());

module.exports = createMacro(({ babel: { types: t, template }, references: { default: paths } }) => {
  paths.forEach(({ parentPath }) => {
    const value = getValue(parentPath);

    const buildFetch = template(`(opts) => fetch(URI, opts)`);

    if (value) {
      parentPath.replaceWithMultiple(
        buildFetch({
          URI: t.stringLiteral(value),
        }),
      );
    }
  });
});
