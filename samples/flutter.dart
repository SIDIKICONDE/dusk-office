/// Advanced Flutter: state management, animations, custom painters, isolates.

import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';

// Custom painter for complex graphics
class RadialProgressPainter extends CustomPainter {
  final double progress;
  final Color backgroundColor;
  final Color foregroundColor;
  final double strokeWidth;

  RadialProgressPainter({
    required this.progress,
    required this.backgroundColor,
    required this.foregroundColor,
    this.strokeWidth = 8,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - strokeWidth) / 2;

    final backgroundPaint = Paint()
      ..color = backgroundColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final foregroundPaint = Paint()
      ..color = foregroundColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..shader = ui.Gradient.sweep(center, [
        foregroundColor.withOpacity(0.5),
        foregroundColor,
      ]);

    canvas.drawCircle(center, radius, backgroundPaint);

    final sweepAngle = 2 * 3.14159 * progress;
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -3.14159 / 2,
      sweepAngle,
      false,
      foregroundPaint,
    );
  }

  @override
  bool shouldRepaint(covariant RadialProgressPainter oldDelegate) {
    return progress != oldDelegate.progress ||
        backgroundColor != oldDelegate.backgroundColor ||
        foregroundColor != oldDelegate.foregroundColor;
  }
}

// Animated widget with controller
class PulsingWidget extends StatefulWidget {
  final Widget child;
  final Duration duration;
  final double minScale;
  final double maxScale;

  const PulsingWidget({
    super.key,
    required this.child,
    this.duration = const Duration(milliseconds: 1000),
    this.minScale = 0.95,
    this.maxScale = 1.0,
  });

  @override
  State<PulsingWidget> createState() => _PulsingWidgetState();
}

class _PulsingWidgetState extends State<PulsingWidget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: widget.duration)
      ..repeat(reverse: true);

    _animation = Tween<double>(
      begin: widget.minScale,
      end: widget.maxScale,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(scale: _animation, child: widget.child);
  }
}

// State management with InheritedWidget
class InheritedState<T> extends InheritedWidget {
  final T state;
  final void Function(T) update;

  const InheritedState({
    super.key,
    required this.state,
    required this.update,
    required super.child,
  });

  static InheritedState<T> of<T>(BuildContext context) {
    final result = context
        .dependOnInheritedWidgetOfExactType<InheritedState<T>>();
    assert(result != null, 'No InheritedState<$T> found in context');
    return result!;
  }

  @override
  bool updateShouldNotify(covariant InheritedState<T> oldWidget) {
    return state != oldWidget.state;
  }
}

// Notifier-based state management
class CounterNotifier extends ValueNotifier<int> {
  CounterNotifier([super.value = 0]);

  void increment() => value++;
  void decrement() => value--;
  void reset() => value = 0;
}

class ValueListenableBuilder2<T, U> extends StatelessWidget {
  final ValueListenable<T> first;
  final ValueListenable<U> second;
  final Widget Function(BuildContext, T, U, Widget?) builder;
  final Widget? child;

  const ValueListenableBuilder2({
    super.key,
    required this.first,
    required this.second,
    required this.builder,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<T>(
      valueListenable: first,
      builder: (_, t, __) {
        return ValueListenableBuilder<U>(
          valueListenable: second,
          builder: (_, u, child) => builder(_, t, u, child),
          child: child,
        );
      },
    );
  }
}

// Custom scroll physics
class BouncingScrollPhysics extends ScrollPhysics {
  final double friction;
  final double springiness;

  const BouncingScrollPhysics({
    super.parent,
    this.friction = 0.02,
    this.springiness = 0.5,
  });

  @override
  BouncingScrollPhysics applyTo(ScrollPhysics? ancestor) {
    return BouncingScrollPhysics(
      parent: buildParent(ancestor),
      friction: friction,
      springiness: springiness,
    );
  }

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    if (position.outOfRange) {
      return BouncingScrollSimulation(
        position: position.pixels,
        velocity: velocity,
        leadingExtent: position.minScrollExtent,
        trailingExtent: position.maxScrollExtent,
        spring: SpringDescription.withDampingRatio(
          mass: 1.0,
          stiffness: 500.0,
          ratio: 1.0,
        ),
      );
    }
    return super.createBallisticSimulation(position, velocity);
  }
}

// Sliver with custom layout
class SliverStickyHeader extends StatelessWidget {
  final Widget header;
  final List<Widget> children;

  const SliverStickyHeader({
    super.key,
    required this.header,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverPersistentHeader(
          pinned: true,
          delegate: _StickyHeaderDelegate(header: header),
        ),
        SliverList(
          delegate: SliverChildBuilderDelegate(
            (context, index) => children[index],
            childCount: children.length,
          ),
        ),
      ],
    );
  }
}

class _StickyHeaderDelegate extends SliverPersistentHeaderDelegate {
  final Widget header;

  _StickyHeaderDelegate({required this.header});

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      child: header,
    );
  }

  @override
  double get maxExtent => 60;

  @override
  double get minExtent => 60;

  @override
  bool shouldRebuild(covariant _StickyHeaderDelegate oldDelegate) {
    return header != oldDelegate.header;
  }
}

// Hero with custom flight path
class CircularHero extends StatelessWidget {
  final String tag;
  final Widget child;

  const CircularHero({super.key, required this.tag, required this.child});

  @override
  Widget build(BuildContext context) {
    return Hero(
      tag: tag,
      flightShuttleBuilder:
          (
            flightContext,
            animation,
            flightDirection,
            fromHeroContext,
            toHeroContext,
          ) {
            return AnimatedBuilder(
              animation: animation,
              builder: (context, child) {
                return Transform.scale(
                  scale: 1.0 + (animation.value * 0.2),
                  child: Opacity(
                    opacity: Curves.easeInOut.transform(animation.value),
                    child: child,
                  ),
                );
              },
              child: toHeroContext.widget,
            );
          },
      child: child,
    );
  }
}

// Platform channels
class NativeBridge {
  static const _channel = MethodChannel('com.example.app/native');

  static Future<String?> getDeviceId() async {
    try {
      return await _channel.invokeMethod<String>('getDeviceId');
    } on PlatformException catch (e) {
      debugPrint('Failed to get device ID: ${e.message}');
      return null;
    }
  }

  static Future<void> share(String text) async {
    await _channel.invokeMethod<void>('share', {'text': text});
  }

  static Stream<String> get onEvent {
    final eventChannel = EventChannel('com.example.app/events');
    return eventChannel.receiveBroadcastStream().map((e) => e as String);
  }
}

// Responsive layout builder
class ResponsiveBuilder extends StatelessWidget {
  final Widget Function(BuildContext, Breakpoint) builder;

  const ResponsiveBuilder({super.key, required this.builder});

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final breakpoint = _getBreakpoint(constraints.maxWidth);
        return builder(context, breakpoint);
      },
    );
  }

  Breakpoint _getBreakpoint(double width) {
    if (width < 600) return Breakpoint.mobile;
    if (width < 900) return Breakpoint.tablet;
    if (width < 1200) return Breakpoint.desktop;
    return Breakpoint.wide;
  }
}

enum Breakpoint { mobile, tablet, desktop, wide }

// Form with validation
class ValidatedFormField<T> extends FormField<T> {
  final String? Function(T?) validator;
  final Widget Function(T? value, void Function(T?) onChange) builder;

  ValidatedFormField({
    super.key,
    required this.validator,
    required this.builder,
    super.initialValue,
    super.enabled = true,
    super.autovalidateMode,
    super.onSaved,
  }) : super(
         validator: (value) => validator(value),
         builder: (field) {
           return builder(field.value, (v) {
             field.didChange(v);
           });
         },
       );
}

// Main app
void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Advanced',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const HomePage(),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Flutter Advanced')),
      body: ResponsiveBuilder(
        builder: (context, breakpoint) {
          return CustomScrollView(
            slivers: [
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Responsive Layout',
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      Text('Current: ${breakpoint.name}'),
                    ],
                  ),
                ),
              ),
              SliverGrid(
                gridDelegate: SliverGridDelegateWithMaxCrossAxisExtent(
                  maxCrossAxisExtent: breakpoint == Breakpoint.mobile
                      ? 200
                      : 300,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  childAspectRatio: 1,
                ),
                delegate: SliverChildBuilderDelegate((context, index) {
                  return Card(child: Center(child: Text('Item $index')));
                }, childCount: 20),
              ),
            ],
          );
        },
      ),
      floatingActionButton: PulsingWidget(
        child: FloatingActionButton(
          onPressed: () {},
          child: const Icon(Icons.add),
        ),
      ),
    );
  }
}
