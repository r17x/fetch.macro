/* istanbul ignore next */
const testCases = [
  {
    title: "basic fetch",
    name: "default",
    description:
      "It will be produce a code for fetch function with URL by input and return response that need to be manual handle the response.",
    category: "API",
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
    name: "fetchText",
    description:
      "It will be produce a code for fetch function with URL by input and return [**response text**](https://webidl.spec.whatwg.org/#idl-USVString).",
    category: "API",
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
    name: "fetchJson",
    description:
      "It will be produce a code for fetch function with URL by input and return [**response json**](https://fetch.spec.whatwg.org/#dom-body-json).",
    category: "API",
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
    name: "fetchBlob",
    description:
      "It will be produce a code for fetch function with URL by input and return [**response blob**](https://fetch.spec.whatwg.org/#dom-body-blob).",
    category: "API",
    code: `
        import {fetchBlob} from '../src/fetch.macro'
        const fetchProject = fetchBlob\`/api/v1/user/:id/project/:projectId/:others\`;
      `,
    output: `
        const fetchProject = ({ id, projectId, others, ...opts }) =>
          fetch(\`/api/v1/user/\${id}/project/\${projectId}/\${others}\`, opts).then((r) => r.blob());
      `,
  },
  // fetchFormData
  {
    title: "fetchFormData with url params",
    name: "fetchFormData",
    description:
      "It will be produce a code for fetch function with URL by input and return [**response formData**](https://fetch.spec.whatwg.org/#dom-body-formdata).",
    category: "API",
    code: `
        import {fetchFormData} from '../src/fetch.macro'
        const fetchProject = fetchFormData\`/api/v1/user/:id/project/:projectId/:others\`;
      `,
    output: `
        const fetchProject = ({ id, projectId, others, ...opts }) =>
          fetch(\`/api/v1/user/\${id}/project/\${projectId}/\${others}\`, opts).then((r) => r.formData());
      `,
  },
];

module.exports = { testCases };
