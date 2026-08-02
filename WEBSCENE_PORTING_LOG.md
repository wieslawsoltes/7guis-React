# Running 7GUIs React without a browser: the WebScene porting log

> Working draft for a later blog post. Evidence and results are updated as each
> benchmark passes build, startup, interaction, and screenshot checks.

## Goal

Run the 7GUIs React examples in a native Uno Platform desktop application through
WebScene's high-performance native scene runtime. The application must not embed a
browser or WebView. The integration must consume released WebScene NuGet packages,
not project references to the WebScene source checkout.

## Starting point

- Upstream application: `wieslawsoltes/7guis-React`, commit `9110e0f` on `master`.
- Runtime reference: `wieslawsoltes/WebScene`, commit `5c838df`, tag `v1.0.17`.
- Work branch: `WebScene` in the `7guis-React` checkout.
- Host: Uno Platform Skia desktop (`net10.0-desktop`) on Apple silicon macOS.
- Released packages: `WebScene.Backend.Uno` 1.0.17 and
  `WebScene.NativeEngine.Runtime.osx-arm64` 1.0.17.

## Architecture

```text
React 19 offline bundle
        ↓
WebScene native V8 + DOM/CSS/layout/events
        ↓
immutable native scene diffs
        ↓
WebScene.Backend.Uno / UnoNativeSceneSurface
        ↓
Uno Skia desktop window
```

The host loads `web/index.html` from application output using a `file:` URI. All React,
CSS, and sample code is bundled locally. `UnoNativeWebSceneView` owns the native engine
and presents scene diffs through Uno's Skia renderer. There is no WebView dependency or
network-loaded application content.

## Issues found and decisions

### 1. The expected local checkouts were absent

The workspace initially contained neither `7guis-React` nor `WebScene`, despite the
task context describing WebScene as already cloned. Both authoritative upstreams were
cloned into `/Users/wieslawsoltes/GitHub` before analysis.

### 2. The upstream repository does not contain all seven implementations

The README lists Cells as exercise seven, but there is no `Cells` directory or source.
The port implements Cells as a React spreadsheet with cell selection, direct values,
cell references, arithmetic expressions, `SUM(A1:B4)` ranges, and cycle detection.
This preserves the seven-exercise scope instead of redefining success around the six
available source folders.

### 3. The original JavaScript toolchain is from the Node 4 / React 0.14 era

Every upstream exercise has its own webpack 1 and Babel 6 setup and declares Node
4.2.3. Installing those dependency trees on the current Node 25 toolchain would add
obsolete build-time dependencies and would still produce seven disconnected pages.

The port preserves each exercise's behavior while consolidating it into one offline
React 19.2.8 bundle built with esbuild 0.28.1. The separate upstream `CRUD-Redux`
variant is included using Redux 5.0.1 and React-Redux 9.3.0. The consolidated shell
makes each sample directly selectable and exercises the modern React scheduler already
covered by WebScene's compatibility suite.

### 4. Uno support is a native backend, not an Uno component-host SDK control

WebScene 1.0.17 publishes `WebScene.Sdk.Avalonia`, but there is no corresponding
`WebScene.Sdk.Uno` package. The supported Uno integration surface is
`WebScene.Backend.Uno`, whose `UnoNativeWebSceneView` directly loads a URL into the
native engine and presents immutable scene diffs through Uno Skia.

The app therefore uses the portable offline bundle as the component artifact and the
Uno backend directly. This matches WebScene's own `NativeRuntimeShowcase.Uno` sample.

### 5. The native engine package is RID-specific and explicit

`WebScene.Backend.Uno` does not silently choose a native engine. The app sets
`RuntimeIdentifier=osx-arm64` and references
`WebScene.NativeEngine.Runtime.osx-arm64` at the same 1.0.17 version. Its transitive
MSBuild targets copy the engine library, ICU data, V8 snapshot, metadata, and manifest
to output and reject RID mismatches.

### 6. Runtime readiness is stronger than document creation

`UnoNativeWebSceneView.LoadAsync` waits for a document and body, but React may still be
mounting. The host polls a tiny `window.__webSceneSevenGuis.ready` contract before it
selects the requested sample. This also gives automated launch/screenshot runs a
deterministic readiness boundary.

### 7. A desktop Uno head still needs its platform entry point

The initial host build failed with `CS5001` because the project had the shared `App`
but not `Platforms/Desktop/Program.cs`. The WebScene showcase includes this file even
though it is easy to miss in a shallow source listing. Adding the standard
`UnoPlatformHostBuilder` chain for X11, Linux framebuffer, macOS, and Win32 restored
the expected Uno desktop lifetime.

### 8. Uno's restored graph selected a vulnerable DBus patch version

The first restore selected `Tmds.DBus.Protocol` 0.21.2 and emitted `NU1903` for
GHSA-xrw6-gwf8-vvr9. WebScene's current central package graph already pins 0.21.3, so
the consumer app now explicitly references 0.21.3 as well. This keeps the published
WebScene package integration while avoiding the vulnerable transitive selection.

### 9. Some browser-default layout and form presentation needed explicit equivalents

The first native screenshots exposed useful compatibility differences rather than
startup failures:

- the HTML `select` painted its option text inline instead of as one collapsed native
  picker;
- CSS Grid placement did not match browser layout in the Temperature and CRUD panels;
- mixed inline timer text did not retain the intended visual order.

The port switched these small surfaces to WebScene-friendly equivalents: a segmented
trip-type picker and explicit flex layouts. Circle Drawer also starts with three sample
circles so screenshot verification proves the SVG scene path without requiring a
manual click before capture. These are presentation adaptations; the benchmark state
and constraint behavior remains in React.

### 10. SVG elements dispatch events but do not expose the `click()` convenience method

The first Circle Drawer interaction smoke called `click()` on an SVG `circle` and
received `TypeError: ...click is not a function`. Dispatching a bubbling `click` event
through `dispatchEvent` exercises the same React handler and works. The application
itself receives ordinary pointer input through the Uno backend; this difference only
affected the automated DOM smoke.

## Verification matrix

| Exercise | Build | Native startup | Interaction | Screenshot |
| --- | --- | --- | --- | --- |
| Counter | Pass | Pass | Pass: Count commits `0 → 1` | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-53-02.png` |
| Temperature Converter | Pass | Pass | Pass: `100 °C → 212 °F` | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-51-05.png` |
| Flight Booker | Pass | Pass | Pass: booking confirmation commits | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-54-13.png` |
| Timer | Pass | Pass | Pass: elapsed time advances | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-51-12.png` |
| CRUD | Pass | Pass | Pass: selecting Grace Hopper updates the editor | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-53-32.png` |
| CRUD + Redux | Pass | Pass | Pass: Redux selection updates connected fields | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-50-35.png` |
| Circle Drawer | Pass | Pass | Pass: SVG circle selection commits | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-51-20.png` |
| Cells | Pass | Pass | Pass: selecting B1 updates the formula bar | `/Users/wieslawsoltes/Desktop/screenshot-2026-08-02_21-43-11.png` |

Each startup emitted both an interaction result and a ready result, for example:

```text
[7GUIs WebScene] interaction sample=counter pass=true
[7GUIs WebScene] ready sample=counter loadMs=860
```

Warm native startup for the separate screenshot launches ranged from roughly
104 ms to 203 ms after the first process populated the persistent V8 compilation
cache. The screenshot status bars independently show non-zero native published and
rendered scene counts. Timer reached 105 published/rendered scenes during the final
capture, demonstrating repeated React scheduling and native scene publication rather
than a static bitmap.

## Build evidence

The final Release build completed with no warnings or errors:

```text
WebSceneHost -> WebSceneHost/bin/Release/net10.0-desktop/osx-arm64/WebSceneHost.dll
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

The application output contains `libwebscene_native_engine.dylib`, `icudtl.dat`,
`webscene_bootstrap_snapshot.bin`, its metadata, and
`webscene-native-runtime.json`, proving that the RID-specific NuGet package copied the
native runtime payload into the Uno application.

## Reproduction

See `WebSceneHost/README.md` for commands. Use `--verify` to run an exercise's
interaction smoke before the host reports readiness.
