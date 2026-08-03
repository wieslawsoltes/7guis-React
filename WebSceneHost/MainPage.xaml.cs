using System.Diagnostics;
using System.Runtime.InteropServices;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using WebScene.Backends.Uno.Native;

namespace SevenGuis.WebSceneHost;

public sealed partial class MainPage : Page
{
    private static readonly HashSet<string> Samples = new(StringComparer.Ordinal)
    {
        "counter",
        "temperature",
        "flight-booker",
        "timer",
        "crud",
        "crud-redux",
        "circle-drawer",
        "cells"
    };

    private readonly UnoNativeWebSceneView _scene = new();
    private readonly DispatcherTimer _diagnosticsTimer = new();
    private readonly string _initialSample;
    private readonly bool _verifyInteractions;

    public MainPage()
    {
        InitializeComponent();
        SceneContent.Content = _scene;
        _initialSample = ReadSampleArgument(Environment.GetCommandLineArgs());
        _verifyInteractions = Environment.GetCommandLineArgs().Contains("--verify", StringComparer.Ordinal);
        _diagnosticsTimer.Interval = TimeSpan.FromSeconds(1);
        _diagnosticsTimer.Tick += OnDiagnosticsTick;
        Loaded += OnLoaded;
        Unloaded += OnUnloaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs args)
    {
        Loaded -= OnLoaded;
        try
        {
            await WaitForLayoutAsync(SceneContent);
            var nativeLibrary = ResolveNativeLibraryPath();
            var documentPath = Path.Combine(AppContext.BaseDirectory, "web", "index.html");
            if (!File.Exists(documentPath))
            {
                throw new FileNotFoundException("The built React entry document is missing.", documentPath);
            }

            var started = Stopwatch.StartNew();
            await _scene.LoadAsync(
                new Uri(documentPath).AbsoluteUri,
                nativeLibrary,
                CacheDirectory());
            await WaitForReactAsync();
            await SelectSampleAsync(_initialSample);
            await WaitForSampleAsync(_initialSample);
            if (_verifyInteractions)
            {
                await VerifyInteractionAsync(_initialSample);
            }
            started.Stop();
            _diagnosticsTimer.Start();
            StatusText.Text = $"{DisplayName(_initialSample)} ready · native load {started.Elapsed.TotalMilliseconds:F0} ms";
            Console.WriteLine($"[7GUIs WebScene] ready sample={_initialSample} loadMs={started.Elapsed.TotalMilliseconds:F0}");
        }
        catch (Exception error)
        {
            LoadFailureText.Text = $"WebScene startup failed\n\n{error}";
            LoadFailure.Visibility = Visibility.Visible;
            StatusText.Text = "WebScene startup failed";
            Console.Error.WriteLine(error);
        }
    }

    private async Task WaitForReactAsync()
    {
        for (var attempt = 0; attempt < 250; attempt++)
        {
            var result = await _scene.EvaluateTextAsync(
                "({ ready: !!(window.__webSceneSevenGuis && window.__webSceneSevenGuis.ready) })",
                "7guis-ready-probe.js");
            if (result.Contains("true", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
            await Task.Delay(20);
        }

        throw new TimeoutException("The React 7GUIs bundle did not become ready within five seconds.");
    }

    private async Task SelectSampleAsync(string sample)
    {
        await _scene.EvaluateTextAsync(
            $"window.__webSceneSevenGuis.show({System.Text.Json.JsonSerializer.Serialize(sample)}); true",
            "7guis-select-sample.js");
    }

    private async Task WaitForSampleAsync(string sample)
    {
        var encoded = System.Text.Json.JsonSerializer.Serialize(sample);
        for (var attempt = 0; attempt < 100; attempt++)
        {
            var result = await _scene.EvaluateTextAsync(
                $"({{ selected: document.querySelector('[data-active-sample]')?.getAttribute('data-active-sample') === {encoded} }})",
                "7guis-selected-sample-probe.js");
            if (result.Contains("true", StringComparison.OrdinalIgnoreCase))
            {
                return;
            }
            await Task.Delay(20);
        }
        throw new TimeoutException($"React did not select sample '{sample}'.");
    }

    private async Task VerifyInteractionAsync(string sample)
    {
        var action = sample switch
        {
            "counter" => "document.querySelector('.counter-row button').click(); true",
            "temperature" => "(() => { const input = document.querySelector('.temperature-row input'); const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input), 'value')?.set; if (setter) setter.call(input, '100'); else input.value = '100'; input.dispatchEvent(new Event('input', { bubbles: true })); return true; })()",
            "flight-booker" => "document.querySelector('.form-stack.narrow button.primary').click(); true",
            "timer" => "true",
            "crud" => "document.querySelectorAll('.user-row')[4].click(); true",
            "crud-redux" => "document.querySelectorAll('.redux-crud .user-row')[4].click(); true",
            "circle-drawer" => "document.querySelector('.circle').dispatchEvent(new Event('click', { bubbles: true })); true",
            "cells" => "document.querySelectorAll('.sheet td')[1].click(); true",
            _ => throw new InvalidOperationException($"Unknown interaction probe sample '{sample}'.")
        };
        await _scene.EvaluateTextAsync(action, $"7guis-{sample}-interaction.js");
        await Task.Delay(sample == "timer" ? 450 : 100);

        var assertion = sample switch
        {
            "counter" => "document.querySelector('[data-testid=\"counter-value\"]')?.textContent === '1'",
            "temperature" => "(() => { const inputs = document.querySelectorAll('.temperature-row input'); const left = inputs[0]?.getBoundingClientRect(); const equals = document.querySelector('.temperature-row .equals')?.getBoundingClientRect(); const right = inputs[1]?.getBoundingClientRect(); return inputs[1]?.value === '212' && left && equals && right && left.right <= equals.left && equals.right <= right.left && Math.abs(left.width - right.width) < 1; })()",
            "flight-booker" => "(() => { const select = document.querySelector('.form-stack.narrow select'); const box = select?.getBoundingClientRect(); const optionsCollapsed = Array.from(select?.options ?? [], option => option.getBoundingClientRect()).every(rect => rect.width === 0 && rect.height === 0); return document.querySelector('.confirmation')?.textContent.startsWith('One-way flight booked') && select?.value === 'one-way' && box?.width > 0 && box?.height > 0 && optionsCollapsed; })()",
            "timer" => "(() => { const readout = document.querySelector('.timer-readout')?.getBoundingClientRect(); const elapsed = document.querySelector('.timer-readout strong')?.getBoundingClientRect(); const suffix = document.querySelector('.timer-readout span')?.getBoundingClientRect(); return Number(document.querySelector('.timer-readout strong')?.textContent) > 0 && readout && elapsed && suffix && elapsed.left < suffix.left && suffix.left >= elapsed.right - 1 && suffix.top >= readout.top && suffix.bottom <= readout.bottom + 1; })()",
            "crud" => "(() => { const inputs = document.querySelectorAll('.crud-grid input'); const list = document.querySelector('.crud-grid .user-list')?.getBoundingClientRect(); const form = document.querySelector('.crud-grid > .form-stack')?.getBoundingClientRect(); return inputs[0]?.value === 'Grace' && inputs[1]?.value === 'Hopper' && list && form && list.right < form.left && Math.abs(list.width - form.width) < 1; })()",
            "crud-redux" => "(() => { const inputs = document.querySelectorAll('.redux-crud input'); const list = document.querySelector('.redux-crud .user-list')?.getBoundingClientRect(); const form = document.querySelector('.redux-crud > .form-stack')?.getBoundingClientRect(); return inputs[0]?.value === 'Grace' && inputs[1]?.value === 'Hopper' && list && form && list.right < form.left && Math.abs(list.width - form.width) < 1; })()",
            "circle-drawer" => "document.querySelectorAll('.circle.selected').length === 1",
            "cells" => "document.querySelector('.formula-bar strong')?.textContent === 'B1'",
            _ => "false"
        };
        var result = await _scene.EvaluateTextAsync(
            $"({{ pass: !!({assertion}) }})",
            $"7guis-{sample}-assertion.js");
        if (!result.Contains("true", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Interaction probe failed for {sample}: {result}");
        }
        Console.WriteLine($"[7GUIs WebScene] interaction sample={sample} pass=true");
    }

    private void OnDiagnosticsTick(object? sender, object args)
    {
        var diagnostics = _scene.RenderDiagnostics;
        var metrics = _scene.EngineMetrics;
        StatusText.Text =
            $"{DisplayName(_initialSample)} · native scenes {diagnostics.RenderedSceneCount}/{diagnostics.PublishedSceneCount} "
            + $"· V8 cache {metrics.CompilationPersistentHits}/{metrics.CompilationRequests}";
    }

    private static async Task WaitForLayoutAsync(FrameworkElement element)
    {
        for (var attempt = 0; attempt < 30 && (element.ActualWidth <= 0 || element.ActualHeight <= 0); attempt++)
        {
            await Task.Delay(16);
        }
    }

    private static string ReadSampleArgument(IReadOnlyList<string> arguments)
    {
        for (var index = 0; index + 1 < arguments.Count; index++)
        {
            if (arguments[index] == "--sample" && Samples.Contains(arguments[index + 1]))
            {
                return arguments[index + 1];
            }
        }
        return "counter";
    }

    private static string ResolveNativeLibraryPath()
    {
        var configured = Environment.GetEnvironmentVariable("WEBSCENE_NATIVE_ENGINE_LIBRARY");
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return Path.GetFullPath(configured);
        }

        var packaged = Path.Combine(AppContext.BaseDirectory, NativeLibraryFileName());
        return File.Exists(packaged)
            ? packaged
            : throw new FileNotFoundException("The NuGet-provided WebScene native engine was not copied to the app output.", packaged);
    }

    private static string NativeLibraryFileName()
        => RuntimeInformation.IsOSPlatform(OSPlatform.Windows)
            ? "webscene_native_engine.dll"
            : RuntimeInformation.IsOSPlatform(OSPlatform.OSX)
                ? "libwebscene_native_engine.dylib"
                : "libwebscene_native_engine.so";

    private static string CacheDirectory()
    {
        var path = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "WebScene",
            "7guis-react");
        Directory.CreateDirectory(path);
        return path;
    }

    private static string DisplayName(string sample) => sample switch
    {
        "flight-booker" => "Flight Booker",
        "circle-drawer" => "Circle Drawer",
        "crud-redux" => "CRUD + Redux",
        _ => char.ToUpperInvariant(sample[0]) + sample[1..]
    };

    private async void OnUnloaded(object sender, RoutedEventArgs args)
    {
        _diagnosticsTimer.Stop();
        await _scene.DisposeAsync();
    }
}
