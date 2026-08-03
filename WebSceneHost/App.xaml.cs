using Microsoft.UI.Xaml;

namespace SevenGuis.WebSceneHost;

public sealed partial class App : Application
{
    public App() => InitializeComponent();

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        var window = new Window
        {
            Title = "7GUIs React · WebScene · Uno",
            Content = new MainPage()
        };
        window.Activate();
    }
}
