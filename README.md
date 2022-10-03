<div align="center">
<h1 id="toc">fetch.macro</h1>
<p>Allows you to build fetcher function by URL at compile-time.</p>

<p align="center">
  <a href="#usage">Usage</a>  • 
  <a href="#api">API</a>  • 
  <a href="#contributors">Contributors</a> 
</p>

</div>

---

<div align="center">

<!-- prettier-ignore-start -->
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/r17x/fetch.macro/release/main)](https://github.com/r17x/fetch.macro/actions/workflows/release.yml?query=branch%3Amain+)
[![Codecov branch](https://img.shields.io/codecov/c/github/r17x/fetch.macro/main)](https://app.codecov.io/gh/r17x/fetch.macro)
[![npm](https://img.shields.io/npm/v/fetch.macro)](https://www.npmjs.com/package/fetch.macro/v/latest)
[![npm downloads](https://img.shields.io/npm/dw/fetch.macro)](https://www.npmjs.com/package/fetch.macro/v/latest)
[![License](https://img.shields.io/github/license/r17x/fetch.macro)](https://github.com/r17x/fetch.macro/blob/main/LICENSE)
[![GitHub contributors (via allcontributors.org)](https://img.shields.io/github/all-contributors/r17x/fetch.macro/main)](https://github.com/r17x/fetch.macro#contributors)
<!-- prettier-ignore-end -->

</div>

## Usage

[[Back to the Table of Contents] ↑](#toc)

Simply install and configure [`babel-plugin-macros`](https://github.com/kentcdodds/babel-plugin-macros) and then use `fetch.macro`.

> Some project that build with `create-react-app` doesn't need extra setup for `babel-plugin-macros`.

### Vite

To be able to use these macros in your [Vite](https://vitejs.dev/) project, you only need install [`vite-plugin-babel-macros`](https://github.com/itsMapleLeaf/vite-plugin-babel-macros) and add some configuration in `vite.config.js`. And it just work.

```
$ npm i -D vite-plugin-babel-macros
```

```js
import MacrosPlugin from "vite-plugin-babel-macros";

export default {
  // ...
  plugins: [
    // ...
    MacrosPlugin(),
  ],
};
```

### Example

#### Basic

Run one of the following command inside your project directory to install the package:

```
$ npm i fetch.macro
or
$ yarn add fetch.macro
```

Given the following `Input`:

```javascript
import f from "fetch.macro";
const fetchByUrl = f("/api/v1/ping");
```

Babel will produce the following `Output`:

```javascript
const fetchByUrl = (opts) => fetch("/api/v1/ping", opts);
```

It also works as a `tagged template` literal:

```javascript
import f from "fetch.macro";
const fetchByUrl = f`/api/v1/ping`;
```

That will produce the same output as the function version.

#### Nested

Given the following `Input`:

```javascript
import f from "fetch.macro";
const fetchProject = f`/api/v1/user/:id/project/:projectId/:others`;
```

Babel will produce the following `Output`:

```javascript
const fetchProject = ({ id, projectId, others, ...opts }) =>
  fetch(`/api/v1/user/${id}/project/${projectId}/${others}`, opts);
```

## API

[[Back to the Table of Contents] ↑](#toc)

### Default

It will be produce a code for fetch function with URL by input and return response that need to be manual handle the response.

```
import f from 'fetch.macro'

const fetchByUrl = f("/api/v1/ping");
```

### fetchText

It will be produce a code for fetch function with URL by input and return [**response text**](https://webidl.spec.whatwg.org/#idl-USVString).

```
import { fetchText } from 'fetch.macro'

const fetchLicense = fetchText("https://raw.githubusercontent.com/r17x/fetch.macro/main/LICENSE");
```

### fetchJson

It will be produce a code for fetch function with URL by input and return [**response json**](https://fetch.spec.whatwg.org/#dom-body-json).

```
import { fetchJson } from 'fetch.macro'

const fetchUsers = fetchJson("https://reqres.in/api/users");
```

## Contributors

[[Back to the Table of Contents] ↑](#toc)

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://rin.rocks"><img src="https://avatars.githubusercontent.com/u/16365952?v=4?s=100" width="100px;" alt="RiN"/><br /><sub><b>RiN</b></sub></a><br /><a href="#ideas-r17x" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-r17x" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#tool-r17x" title="Tools">🔧</a></td>
      <td align="center"><a href="https://blog.nyan.my.id"><img src="https://avatars.githubusercontent.com/u/24630806?v=4?s=100" width="100px;" alt="Ryan Aunur Rassyid"/><br /><sub><b>Ryan Aunur Rassyid</b></sub></a><br /><a href="#example-nyancodeid" title="Examples">💡</a></td>
      <td align="center"><a href="https://vadhe.dev/"><img src="https://avatars.githubusercontent.com/u/36479850?v=4?s=100" width="100px;" alt="Rivaldi Putra"/><br /><sub><b>Rivaldi Putra</b></sub></a><br /><a href="#example-vadhe" title="Examples">💡</a></td>
      <td align="center"><a href="https://liostech.id"><img src="https://avatars.githubusercontent.com/u/30402431?v=4?s=100" width="100px;" alt="Ibrahim Hanif"/><br /><sub><b>Ibrahim Hanif</b></sub></a><br /><a href="https://github.com/r17x/fetch.macro/commits?author=ibrahim4529" title="Code">💻</a> <a href="#example-ibrahim4529" title="Examples">💡</a></td>
    </tr>
  </tbody>
  <tfoot>
    
  </tfoot>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## License

[MIT](./LICENSE)
