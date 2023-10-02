const { createMacro } = require("babel-plugin-macros");

/**
 * @typedef {[string, import('@babel/core').NodePath[]]} KeyValue
 */

/* import module name is defined in @var REFERENCES
 * @example
 * ```
 * import { fetchText } from 'fetch.macro'
 * ```
 * */
const REFERENCES = [
  "default",
  "fetchText",
  "fetchJson",
  "fetchBlob",
  "fetchFormData",
  "fetchArrayBuffer",
  "fetchClone",
];
/**
 * @param {KeyValue} keyValue
 * @return {boolean}
 */
const isAllowedReference = ([k, v]) => REFERENCES.includes(k) && Array.isArray(v) && v.length > 0;

/**
 * This use for handle when value of fetch.macro have arguments
 * e.g "/api/user/:id"
 *
 * @param {string} val
 * @return {boolean}
 */
const isValueHaveArgs = (val) => /:\w+/g.test(val);

/**
 * @param {import('@babel/core').NodePath} path
 * @return {string?} value param when use with call expression or tagged template expression
 */
const getValue = (path) =>
  ({
    [true]: () => null,
    [path.isCallExpression()]: () => path.node.arguments[0].value,
    [path.isTaggedTemplateExpression()]: () => path.node.quasi.quasis[0].value.cooked,
  }).true();

/**
 * @param {string} ref
 * @return {string} property access at promise type data (e.g: .then .catch)
 */
const memberExpressionTemplate = (ref) =>
  ({
    [true]: "",
    [ref === REFERENCES[1]]: ".then(r => r.text())",
    [ref === REFERENCES[2]]: ".then(r => r.json())",
    [ref === REFERENCES[3]]: ".then(r => r.blob())",
    [ref === REFERENCES[4]]: ".then(r => r.formData())",
    [ref === REFERENCES[5]]: ".then(r => r.arrayBuffer())",
    [ref === REFERENCES[6]]: ".then(r => r.clone())",
  }).true;

/** @type { import('babel-plugin-macros').MacroHandler } */
const fetchMacro = ({ babel: { types: t, template }, references }) => {
  /**
   * @param {string} reference
   * @return {(path: import('@babel/core').NodePath) => void}
   */
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

  /**
   * @param {KeyValue} keyValue
   * @return {void}
   */
  const transformByReference = ([k, v]) => v.forEach(transform(k));

  Object.entries(references).filter(isAllowedReference).forEach(transformByReference);
};

module.exports = createMacro(fetchMacro);
