# 7guis
## A Notational Usability Benchmark for GUI Programming

Taken from the [7guis wiki](https://github.com/eugenkiss/7guis/wiki)

_( ReactJS, Redux, ES6+, Mocha, expect, webpack )_


### 1. Counter exercise 
> [![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/counter.png)](Counter)

### 2. Temperature Converter
> [![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/tempconv.png)](TemperatureConverter)

### 3. Flight Booker
> [![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/bookflight.png)](FlightBooker)

### 4. Timer
> [![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/timer.png)](Timer)

### 5. CRUD
- [CRUD](CRUD)
- [CRUD + Redux](CRUD-Redux)

> ![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/crud.png)

### 6. Circle Drawer
> [![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/circledraw.png)](CircleDrawer)

### 7. Cells
> ![](https://raw.githubusercontent.com/wiki/eugenkiss/7guis/images/cells.png)

## WebScene native Uno host

The [`WebSceneHost`](WebSceneHost) app runs all seven exercises as an offline React
19 bundle on WebScene 1.0.18's native V8/DOM/CSS scene runtime in an Uno Platform Skia
desktop window. It does not use a browser or WebView. This branch also supplies the
Cells implementation that is listed above but absent from the original repository.

See [`WebSceneHost/README.md`](WebSceneHost/README.md) for build, launch, and per-sample
interaction-smoke commands. The complete analysis, issues, adaptations, runtime
evidence, and screenshot inventory are in [`WEBSCENE_PORTING_LOG.md`](WEBSCENE_PORTING_LOG.md).
