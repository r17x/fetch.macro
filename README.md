<div align="center">
<h1>fetch.macro</h1>

<p>Allows you to build simple fetch function at compile-time</p>
</div>

---

<!-- prettier-ignore-start -->
[![Build Status][build-badge]][build]
[![Code Coverage][coverage-badge]][coverage]
[![version][version-badge]][package]
[![downloads][downloads-badge]][npmtrends]
[![MIT License][license-badge]][license]
[![All Contributors][all-contributors-badge]](#contributors-)
[![PRs Welcome][prs-badge]][prs]
<!-- prettier-ignore-end -->

## Usage

Simply install and configure [`babel-plugin-macros`](https://github.com/kentcdodds/babel-plugin-macros) and then use `fetch.macro`.

### Example

#### Basic

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

## License

[MIT](./LICENSE)
