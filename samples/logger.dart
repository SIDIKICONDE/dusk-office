/// Console logger using ANSI SGR codes (same palette as `samples/app.log`).
/// Open `app.log` in the editor with a Dusk Office theme to see colored output.

class Logger {
  static const _reset = '\x1B[0m';
  static const _gray = '\x1B[90m'; // DEBUG — terminal.ansiBrightBlack
  static const _gold = '\x1B[33m'; // WARNING — terminal.ansiYellow
  static const _red = '\x1B[31m'; // ERROR — terminal.ansiRed
  static const _green = '\x1B[32m'; // SUCCESS — terminal.ansiGreen
  static const _cyan = '\x1B[36m'; // INFO — terminal.ansiCyan

  static void debug(String msg) => print('$_gray[DEBUG] $msg$_reset');
  static void info(String msg) => print('$_cyan[INFO] $msg$_reset');
  static void success(String msg) => print('$_green[SUCCESS] $msg$_reset');
  static void warning(String msg) => print('$_gold[WARNING] $msg$_reset');
  static void error(String msg) => print('$_red[ERROR] $msg$_reset');
}

void main() {
  Logger.debug('Application started');
  Logger.info('Server listening on :8080');
  Logger.success('Database connected');
  Logger.warning('Cache miss rate high (42%)');
  Logger.error('Connection timeout after 30s');
}
