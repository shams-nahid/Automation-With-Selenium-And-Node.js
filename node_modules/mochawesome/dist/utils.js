'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');
var chalk = require('chalk');
var uuid = require('uuid');
var mochaUtils = require('mocha/lib/utils');
var stringify = require('json-stringify-safe');
var diff = require('diff');
var stripAnsi = require('strip-ansi');

/**
 * Return a classname based on percentage
 *
 * @param {String} msg - message to log
 * @param {String} level - log level [log, info, warn, error]
 * @param {Object} config - configuration object
 */
function log(msg, level, config) {
  // Don't log messages in quiet mode
  if (config && config.quiet) return;
  var logMethod = console[level] || console.log;
  var out = msg;
  if ((typeof msg === 'undefined' ? 'undefined' : (0, _typeof3.default)(msg)) === 'object') {
    out = stringify(msg, null, 2);
  }
  logMethod('[' + chalk.gray('mochawesome') + '] ' + out + '\n');
}

/**
 * Return a classname based on percentage
 *
 * @param {Integer} pct - percentage
 *
 * @return {String} classname
 */
function getPercentClass(pct) {
  if (pct <= 50) {
    return 'danger';
  } else if (pct > 50 && pct < 80) {
    return 'warning';
  } else {
    return 'success';
  }
}

/**
 * Strip the function definition from `str`,
 * and re-indent for pre whitespace.
 *
 * @param {String} str - code in
 *
 * @return {String} cleaned code string
 */
function cleanCode(str) {
  str = str.replace(/\r\n|[\r\n\u2028\u2029]/g, '\n') // unify linebreaks
  .replace(/^\uFEFF/, '') // replace zero-width no-break space
  .replace(/^(?:.|\s)*?(?:{|=>) *\n?(?:\(|{)?/, '') // replace function declaration
  .replace(/\)\s*\)\s*$/, ')') // replace closing paren
  .replace(/\s*};?\s*$/, ''); // replace closing bracket

  // Preserve indentation by finding leading tabs/spaces
  // and removing that amount of space from each line
  var spaces = str.match(/^\n?( *)/)[1].length;
  var tabs = str.match(/^\n?(\t*)/)[1].length;
  /* istanbul ignore next */
  var indentRegex = new RegExp('^\n?' + (tabs ? '\t' : ' ') + '{' + (tabs || spaces) + '}', 'gm');

  str = str.replace(indentRegex, '').trim();
  return str;
}

/**
 * Create a unified diff between two strings
 *
 * @param {Error}  err          Error object
 * @param {string} err.actual   Actual result returned
 * @param {string} err.expected Result expected
 *
 * @return {string} diff
 */
function createUnifiedDiff(_ref) {
  var actual = _ref.actual,
      expected = _ref.expected;

  return diff.createPatch('string', actual, expected).split('\n').splice(4).map(function (line) {
    if (line.match(/@@/)) {
      return null;
    }
    if (line.match(/\\ No newline/)) {
      return null;
    }
    return line.replace(/^(-|\+)/, '$1 ');
  }).filter(function (line) {
    return typeof line !== 'undefined' && line !== null;
  }).join('\n');
}

/**
 * Create an inline diff between two strings
 *
 * @param {Error}  err          Error object
 * @param {string} err.actual   Actual result returned
 * @param {string} err.expected Result expected
 *
 * @return {array} diff string objects
 */
function createInlineDiff(_ref2) {
  var actual = _ref2.actual,
      expected = _ref2.expected;

  return diff.diffWordsWithSpace(actual, expected);
}

/**
 * Return a normalized error object
 *
 * @param {Error} err Error object
 *
 * @return {Object} normalized error
 */
function normalizeErr(err, config) {
  var name = err.name,
      message = err.message,
      actual = err.actual,
      expected = err.expected,
      stack = err.stack,
      showDiff = err.showDiff;

  var errMessage = void 0;
  var errDiff = void 0;

  /**
   * Check that a / b have the same type.
   */
  function sameType(a, b) {
    var objToString = Object.prototype.toString;
    return objToString.call(a) === objToString.call(b);
  }

  // Format actual/expected for creating diff
  if (showDiff !== false && sameType(actual, expected) && expected !== undefined) {
    /* istanbul ignore if */
    if (!(_.isString(actual) && _.isString(expected))) {
      err.actual = mochaUtils.stringify(actual);
      err.expected = mochaUtils.stringify(expected);
    }
    errDiff = config.useInlineDiffs ? createInlineDiff(err) : createUnifiedDiff(err);
  }

  // Assertion libraries do not output consitent error objects so in order to
  // get a consistent message object we need to create it ourselves
  if (name && message) {
    errMessage = name + ': ' + stripAnsi(message);
  } else if (stack) {
    errMessage = stack.replace(/\n.*/g, '');
  }

  return {
    message: errMessage,
    estack: stack && stripAnsi(stack),
    diff: errDiff
  };
}

/**
 * Return a plain-object representation of `test`
 * free of cyclic properties etc.
 *
 * @param {Object} test
 *
 * @return {Object} cleaned test
 */
function cleanTest(test, config) {
  /* istanbul ignore next: test.fn exists prior to mocha 2.4.0 */
  var code = test.fn ? test.fn.toString() : test.body;

  var cleaned = {
    title: stripAnsi(test.title),
    fullTitle: _.isFunction(test.fullTitle) ? stripAnsi(test.fullTitle()) : /* istanbul ignore next */stripAnsi(test.title),
    timedOut: test.timedOut,
    duration: test.duration || 0,
    state: test.state,
    speed: test.speed,
    pass: test.state === 'passed',
    fail: test.state === 'failed',
    pending: test.pending,
    context: stringify(test.context, null, 2),
    code: code && cleanCode(code),
    err: test.err && normalizeErr(test.err, config) || {},
    isRoot: test.parent && test.parent.root,
    uuid: test.uuid || /* istanbul ignore next: default */uuid.v4(),
    parentUUID: test.parent && test.parent.uuid,
    isHook: test.type === 'hook'
  };

  cleaned.skipped = !cleaned.pass && !cleaned.fail && !cleaned.pending && !cleaned.isHook;

  return cleaned;
}

/**
 * Return a plain-object representation of `suite` with additional properties for rendering.
 *
 * @param {Object} suite
 * @param {Object} totalTestsRegistered
 * @param {Integer} totalTestsRegistered.total
 *
 * @return {Object|boolean} cleaned suite or false if suite is empty
 */
function cleanSuite(suite, totalTestsRegistered, config) {
  var duration = 0;
  var passingTests = [];
  var failingTests = [];
  var pendingTests = [];
  var skippedTests = [];

  var beforeHooks = _.map([].concat(suite._beforeAll, suite._beforeEach), function (test) {
    return cleanTest(test, config);
  });

  var afterHooks = _.map([].concat(suite._afterAll, suite._afterEach), function (test) {
    return cleanTest(test, config);
  });

  var tests = _.map(suite.tests, function (test) {
    var cleanedTest = cleanTest(test, config);
    duration += test.duration;
    if (cleanedTest.state === 'passed') passingTests.push(cleanedTest.uuid);
    if (cleanedTest.state === 'failed') failingTests.push(cleanedTest.uuid);
    if (cleanedTest.pending) pendingTests.push(cleanedTest.uuid);
    if (cleanedTest.skipped) skippedTests.push(cleanedTest.uuid);
    return cleanedTest;
  });

  totalTestsRegistered.total += tests.length;

  var cleaned = {
    uuid: uuid.v4(),
    title: stripAnsi(suite.title),
    fullFile: suite.file || '',
    file: suite.file ? suite.file.replace(process.cwd(), '') : '',
    beforeHooks: beforeHooks,
    afterHooks: afterHooks,
    tests: tests,
    suites: suite.suites,
    passes: passingTests,
    failures: failingTests,
    pending: pendingTests,
    skipped: skippedTests,
    duration: duration,
    root: suite.root,
    rootEmpty: suite.root && tests.length === 0,
    _timeout: suite._timeout
  };

  var isEmptySuite = _.isEmpty(cleaned.suites) && _.isEmpty(cleaned.tests) && _.isEmpty(cleaned.beforeHooks) && _.isEmpty(cleaned.afterHooks);

  return !isEmptySuite && cleaned;
}

/**
 * Map over a suite, returning a cleaned suite object
 * and recursively cleaning any nested suites.
 *
 * @param {Object} suite          Suite to map over
 * @param {Object} totalTestsReg  Cumulative count of total tests registered
 * @param {Integer} totalTestsReg.total
 * @param {Object} config         Reporter configuration
 */
function mapSuites(suite, totalTestsReg, config) {
  var suites = _.compact(_.map(suite.suites, function (subSuite) {
    return mapSuites(subSuite, totalTestsReg, config);
  }));
  var toBeCleaned = (0, _assign2.default)({}, suite, { suites: suites });
  return cleanSuite(toBeCleaned, totalTestsReg, config);
}

module.exports = {
  log: log,
  getPercentClass: getPercentClass,
  cleanCode: cleanCode,
  cleanTest: cleanTest,
  cleanSuite: cleanSuite,
  mapSuites: mapSuites
};