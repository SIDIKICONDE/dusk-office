// Advanced C#: records, pattern matching, async streams, nullable reference types.

using System.Collections.Immutable;
using System.Runtime.CompilerServices;
using System.Text.Json.Serialization;

namespace DuskOffice.Samples;

public enum PipelineState { Idle, Running, Failed, Completed }

public sealed record Metric(string Name, double Value, DateTimeOffset At);

public sealed record JobResult<T>(
    bool Ok,
    T? Value,
    string? Error = null
)
{
    public static JobResult<T> Success(T value) => new(true, value);
    public static JobResult<T> Failure(string error) => new(false, default, error);
}

public interface IEventSink
{
    ValueTask PublishAsync(string topic, object payload, CancellationToken ct = default);
}

public sealed class InMemorySink : IEventSink
{
    private readonly List<(string Topic, object Payload)> _events = [];

    public IReadOnlyList<(string Topic, object Payload)> Events => _events;

    public ValueTask PublishAsync(string topic, object payload, CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(topic);
        _events.Add((topic, payload));
        return ValueTask.CompletedTask;
    }
}

public static class Program
{
    public static async Task Main()
    {
        var sink = new InMemorySink();
        var metrics = ImmutableArray.Create(
            new Metric("cpu", 0.42, DateTimeOffset.UtcNow),
            new Metric("mem", 0.68, DateTimeOffset.UtcNow)
        );

        foreach (var m in metrics)
        {
            var label = m switch
            {
                { Name: "cpu", Value: > 0.9 } => "hot",
                { Name: "mem", Value: var v } when v > 0.8 => "pressure",
                _ => "ok"
            };

            await sink.PublishAsync("metrics", new { m.Name, m.Value, label });
        }

        Console.WriteLine($"events={sink.Events.Count}");
    }
}

public class Config
{
    [JsonPropertyName("host")]
    public required string Host { get; init; }

    [JsonPropertyName("port")]
    public int Port { get; init; } = 8080;
}
