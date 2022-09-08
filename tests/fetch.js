const createTests = require("./create-tests");

createTests("fetch", [
  {
    title: "basic fetch",
    code: `
      import f from '../src/fetch.macro'
      const fetchByUrl = f("/api/v1/ping");
    `,
    output: `
      const fetchByUrl = (opts) => fetch("/api/v1/ping", opts);
    `,
  },
  {
    title: "basic fetch with tagged",
    code: `
      import f from '../src/fetch.macro'
      const fetchByUrl = f\`/api/v1/ping\`;
    `,
    output: `
      const fetchByUrl = (opts) => fetch("/api/v1/ping", opts);
    `,
  },
  {
    title: "fetch with url args",
    code: `
      import f from '../src/fetch.macro'
      const fetchUserByID = f\`/api/v1/user/:id\`;
    `,
    output: `
      const fetchUserByID = ({ id, ...opts }) => fetch(\`/api/v1/user/\${id}\`, opts);
    `,
  },
]);
