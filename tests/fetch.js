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
  {
    title: "fetch with url args 2",
    code: `
      import f from '../src/fetch.macro'
      const fetchProject = f\`/api/v1/user/:id/project/:projectId\`;
    `,
    output: `
      const fetchProject = ({ id, projectId, ...opts }) => fetch(\`/api/v1/user/\${id}/project/\${projectId}\`, opts);
    `,
  },
  {
    title: "fetch with url args nested",
    code: `
      import f from '../src/fetch.macro'
      const fetchProject = f\`/api/v1/user/:id/project/:projectId/:others\`;
    `,
    output: `
      const fetchProject = ({ id, projectId, others, ...opts }) =>
        fetch(\`/api/v1/user/\${id}/project/\${projectId}/\${others}\`, opts);
    `,
  },
  {
    title: "fetch with url empty",
    code: `
      import f from '../src/fetch.macro'
      const fetchProject = f\`\`;
    `,
    output: "",
  },
  {
    title: "fetch with url empty",
    code: `
      import f from '../src/fetch.macro'
      const fetchProject = f.x;
    `,
    output: "",
  },
  // fetchText
  {
    title: "fetchText with url params",
    code: `
      import {fetchText} from '../src/fetch.macro'
      const fetchProject = fetchText\`/api/v1/user/:id/project/:projectId/:others\`;
    `,
    output: `
      const fetchProject = ({ id, projectId, others, ...opts }) =>
        fetch(\`/api/v1/user/\${id}/project/\${projectId}/\${others}\`, opts).then((r) => r.text());
    `,
  },
  // fetchJson
  {
    title: "fetchJson with url params",
    code: `
      import {fetchJson} from '../src/fetch.macro'
      const fetchProject = fetchJson\`/api/v1/user/:id/project/:projectId/:others\`;
    `,
    output: `
      const fetchProject = ({ id, projectId, others, ...opts }) =>
        fetch(\`/api/v1/user/\${id}/project/\${projectId}/\${others}\`, opts).then((r) => r.json());
    `,
  },
    // fetchBlob
    {
      title: "fetchBlob with url params",
      code: `
        import {fetchBlob} from '../src/fetch.macro'
        const fetchProject = fetchBlob\`/api/v1/user/:id/project/:projectId/:others\`;
      `,
      output: `
        const fetchProject = ({ id, projectId, others, ...opts }) =>
          fetch(\`/api/v1/user/\${id}/project/\${projectId}/\${others}\`, opts).then((r) => r.blob());
      `,
    },
]);
