const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    underscore: "\x1b[4m",
    blink: "\x1b[5m",
    reverse: "\x1b[7m",
    hidden: "\x1b[8m",

    fgBlack: "\x1b[30m",
    fgRed: "\x1b[31m",
    fgGreen: "\x1b[32m",
    fgYellow: "\x1b[33m",
    fgBlue: "\x1b[34m",
    fgMagenta: "\x1b[35m",
    fgCyan: "\x1b[36m",
    fgWhite: "\x1b[37m",
};

const getTimestamp = () => {
    return new Date().toISOString();
};

const logger = {
    info: (module, message, data = '') => {
        console.log(`${colors.fgCyan}[${getTimestamp()}]${colors.reset} ${colors.fgGreen}[INFO]${colors.reset} ${colors.bright}[${module}]${colors.reset} ${message}`, data);
    },
    warn: (module, message, data = '') => {
        console.warn(`${colors.fgCyan}[${getTimestamp()}]${colors.reset} ${colors.fgYellow}[WARN]${colors.reset} ${colors.bright}[${module}]${colors.reset} ${message}`, data);
    },
    error: (module, message, data = '') => {
        console.error(`${colors.fgCyan}[${getTimestamp()}]${colors.reset} ${colors.fgRed}[ERROR]${colors.reset} ${colors.bright}[${module}]${colors.reset} ${message}`, data);
    },
    debug: (module, message, data = '') => {
        console.debug(`${colors.fgCyan}[${getTimestamp()}]${colors.reset} ${colors.fgBlue}[DEBUG]${colors.reset} ${colors.bright}[${module}]${colors.reset} ${message}`, data);
    }
};

export default logger;
