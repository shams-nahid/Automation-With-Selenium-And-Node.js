'use strict';

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var Base = require('mocha/lib/reporters/base');
var Spec = require('mocha/lib/reporters/spec');
var uuid = require('uuid');
var conf = require('./config');
var marge = require('mochawesome-report-generator');
var utils = require('./utils');

// Import the utility functions
var log = utils.log,
    getPercentClass = utils.getPercentClass,
    mapSuites = utils.mapSuites;

// Track the total number of tests registered

var totalTestsRegistered = { total: 0 };

/**
 * Done function gets called before mocha exits
 *
 * Creates and saves the report HTML and JSON files
 *
 * @param {Object} output    Final report object
 * @param {Object} options   Options to pass to report generator
 * @param {Object} config    Reporter config object
 * @param {Number} failures  Number of reported failures
 * @param {Function} exit
 *
 * @return {Promise} Resolves with successful report creation
 */
function done(output, options, config, failures, exit) {
  return marge.create(output, options).then(function (_ref) {
    var _ref2 = (0, _slicedToArray3.default)(_ref, 2),
        htmlFile = _ref2[0],
        jsonFile = _ref2[1];

    if (!htmlFile && !jsonFile) {
      log('No files were generated', 'warn', config);
    } else {
      jsonFile && log('Report JSON saved to ' + jsonFile, null, config);
      htmlFile && log('Report HTML saved to ' + htmlFile, null, config);
    }
  }).catch(function (err) {
    log(err, 'error', config);
  }).then(function () {
    exit && exit(failures > 0 ? 1 : 0);
  });
}

/**
 * Initialize a new reporter.
 *
 * @param {Runner} runner
 * @api public
 */
function Mochawesome(runner, options) {
  var _this = this;

  // Set the config options
  this.config = conf(options);

  // Reporter options
  var reporterOptions = (0, _assign2.default)({}, options.reporterOptions || {}, {
    reportFilename: this.config.reportFilename,
    saveHtml: this.config.saveHtml,
    saveJson: this.config.saveJson
  });

  // Done function will be called before mocha exits
  // This is where we will save JSON and generate the HTML report
  this.done = function (failures, exit) {
    return done(_this.output, reporterOptions, _this.config, failures, exit);
  };

  // Reset total tests counter
  totalTestsRegistered.total = 0;

  // Call the Base mocha reporter
  Base.call(this, runner);

  // Show the Spec Reporter in the console
  new Spec(runner); // eslint-disable-line

  var endCalled = false;

  // Add a unique identifier to each test/hook
  runner.on('test', function (test) {
    test.uuid = uuid.v4();
  });
  runner.on('hook', function (hook) {
    hook.uuid = uuid.v4();
  });
  runner.on('pending', function (test) {
    test.uuid = uuid.v4();
  });

  // Process the full suite
  runner.on('end', function () {
    try {
      /* istanbul ignore else */
      if (!endCalled) {
        // end gets called more than once for some reason
        // so we ensure the suite is processed only once
        endCalled = true;

        var allSuites = mapSuites(_this.runner.suite, totalTestsRegistered, _this.config);

        var obj = {
          stats: _this.stats,
          suites: allSuites,
          copyrightYear: new Date().getFullYear()
        };

        obj.stats.testsRegistered = totalTestsRegistered.total;

        var _obj$stats = obj.stats,
            passes = _obj$stats.passes,
            failures = _obj$stats.failures,
            pending = _obj$stats.pending,
            tests = _obj$stats.tests,
            testsRegistered = _obj$stats.testsRegistered;

        var passPercentage = Math.round(passes / (testsRegistered - pending) * 1000) / 10;
        var pendingPercentage = Math.round(pending / testsRegistered * 1000) / 10;

        obj.stats.passPercent = passPercentage;
        obj.stats.pendingPercent = pendingPercentage;
        obj.stats.other = passes + failures + pending - tests;
        obj.stats.hasOther = obj.stats.other > 0;
        obj.stats.skipped = testsRegistered - tests;
        obj.stats.hasSkipped = obj.stats.skipped > 0;
        obj.stats.failures -= obj.stats.other;
        obj.stats.passPercentClass = getPercentClass(passPercentage);
        obj.stats.pendingPercentClass = getPercentClass(pendingPercentage);

        // Save the final output to be used in the done function
        _this.output = obj;
      }
    } catch (e) {
      // required because thrown errors are not handled directly in the
      // event emitter pattern and mocha does not have an "on error"
      /* istanbul ignore next */
      log('Problem with mochawesome: ' + e.stack, 'error');
    }
  });
}

module.exports = Mochawesome;