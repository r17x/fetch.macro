const { createMacro } = require("babel-plugin-macros");

const getValue = (path) =>
  ({
    [true]: () => null,
    [path.type === "CallExpression"]: () => path.node.arguments[0].value,
    [path.type === "TaggedTemplateExpression"]: () => path.node.quasi.quasis[0].value.cooked,
  }.true());

const isValueHaveArgs = (val) => /:\w+/g.test(val);

const memberExpressionTemplate = (ref) =>
  ({
    [true]: "",
    [ref === "default"]: "",
    [ref === "fetchText"]: ".then(r => r.text())",
    [ref === "fetchJson"]: ".then(r => r.json())",
    [ref === "fetchBlob"]: ".then(r => r.blob())",
    [ref === "fetchFormData"]: ".then(r => r.formData())",
    [ref === "fetchArrayBuffer"]: ".then(r => r.arrayBuffer())",
  }.true);

module.exports = createMacro(
  ({
    babel: { types: t, template },
    references: { default: paths, fetchText, fetchJson, fetchBlob, fetchFormData, fetchArrayBuffer },
  }) => {
    const transform =
      (reference) =>
      ({ parentPath }) => {
        const value = getValue(parentPath);
        const memberExpression = memberExpressionTemplate(reference);

        if (value) {
          if (isValueHaveArgs(value)) {
            const buildFetch = template(`(PARAM) => fetch(URI, opts)`.concat(memberExpression));
            parentPath.replaceWithMultiple(
              buildFetch({
                PARAM: t.objectPattern(
                  value
                    .split("/")
                    .filter((v) => v.startsWith(":"))
                    .map((p) => {
                      const id = t.identifier(p.replace(":", ""));
                      return t.objectProperty(id, id, false, true);
                    })
                    .concat([t.restElement(t.identifier("opts"))]),
                ),
                URI: t.templateLiteral(
                  value
                    .replace(/:\w+/g, "::::")
                    .split("::::")
                    .map((v, i, a) => t.templateElement({ raw: v, cooked: v }, i + 1 === a.length)),
                  value
                    .split("/")
                    .filter((v) => v.startsWith(":"))
                    .map((v) => t.identifier(v.replace(":", ""))),
                ),
              }),
            );
          } else {
            const buildFetch = template(`(opts) => fetch(URI, opts)`.concat(memberExpression));
            parentPath.replaceWithMultiple(
              buildFetch({
                URI: t.stringLiteral(value),
              }),
            );
          }
        } else {
          parentPath.parentPath.remove();
        }
      };

    (paths || []).forEach(transform("default"));
    (fetchText || []).forEach(transform("fetchText"));
    (fetchJson || []).forEach(transform("fetchJson"));
    (fetchBlob || []).forEach(transform("fetchBlob"));
    (fetchFormData || []).forEach(transform("fetchFormData"));
    (fetchArrayBuffer || []).forEach(transform("fetchArrayBuffer"));
  },
);
