# 7GUIs React on WebScene

This Uno Platform desktop host runs the seven React benchmark exercises through
WebScene's native V8/DOM/CSS/scene runtime. It does not host a browser, WebView,
Chromium, WebKit, or Electron surface.

## Build and run on Apple silicon macOS

```sh
cd WebSceneHost/web
npm ci
npm run build
cd ../..
dotnet run --project WebSceneHost -c Release -f net10.0-desktop -- --sample counter
```

Valid sample names are `counter`, `temperature`, `flight-booker`, `timer`, `crud`,
`crud-redux`, `circle-drawer`, and `cells`. This covers the seven canonical 7GUIs
tasks plus the repository's additional Redux implementation of CRUD.

Add `--verify` after the sample selection to run that exercise's in-runtime React/DOM
interaction smoke before reporting readiness:

```sh
dotnet run --project WebSceneHost -c Release -f net10.0-desktop -- --sample cells --verify
```

The host consumes these published NuGet packages at version `1.0.18`:

- `WebScene.Backend.Uno`
- `WebScene.NativeEngine.Runtime.osx-arm64`

The runtime package copies the native engine library, ICU data, V8 bootstrap snapshot,
and ABI manifest into the application output. `MainPage` resolves the library beside
the executable and loads the checked-in offline React bundle with
`UnoNativeWebSceneView`.

Version 1.0.18 supplies the collapsed HTML `select` and CSS Grid behavior used by the
Flight Booker, Temperature Converter, and CRUD samples. The timer keeps an explicit
flex row because React's incrementally-created mixed inline descendants can still be
projected out of order; the `--verify` smoke checks the final visual order as well as
the timer update.
