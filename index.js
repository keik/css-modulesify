// Some css-modules-loader-code dependencies use Promise so we'll provide it for older node versions
var d = require('debug')('keik:css-modulesify')
if (!global.Promise) { global.Promise = require('promise-polyfill'); }

var fs = require('fs');
var path = require('path');
var Cmify = require('./cmify');
var assign = require('object-assign');
var stringHash = require('string-hash');
var ReadableStream = require('stream').Readable;
var through = require('through2');
var postcss = require('postcss')
var modules = require('postcss-modules')

/*
  Custom `generateScopedName` function for `postcss-modules-scope`.
  Short names consisting of source hash and line number.
*/
function generateShortName (name, filename, css) {
  // first occurrence of the name
  // TODO: better match with regex
  var i = css.indexOf('.' + name);
  var numLines = css.substr(0, i).split(/[\r\n]/).length;

  var hash = stringHash(css).toString(36).substr(0, 5);
  return '_' + name + '_' + hash + '_' + numLines;
}

/*
  Custom `generateScopedName` function for `postcss-modules-scope`.
  Appends a hash of the css source.
*/
function generateLongName (name, filename) {
  var sanitisedPath = filename.replace(/\.[^\.\/\\]+$/, '')
      .replace(/[\W_]+/g, '_')
      .replace(/^_|_$/g, '');
  d('@@@@sanitiedPath', sanitisedPath, filename)

  return '_' + sanitisedPath + '__' + name;
}

/*

  Normalize the manifest paths so that they are always relative
  to the project root directory.

*/
function normalizeManifestPaths (tokensByFile, rootDir) {
  var output = {};
  var rootDirLength = rootDir.length + 1;

  Object.keys(tokensByFile).forEach(function (filename) {
    var normalizedFilename = filename.substr(rootDirLength);
    output[normalizedFilename] = tokensByFile[filename];
  });

  return output;
}

// caches
//
// persist these for as long as the process is running. #32

// keep track of all tokens so we can avoid duplicates
var tokensByFile = {};
var tokensByEntrypoint = {};

// we need a separate loader for each entry point
var bundledCss = ''

module.exports = function (browserify, options) {
  options = options || {};

  // if no root directory is specified, assume the cwd
  var rootDir = options.rootDir || options.d || browserify._options.basedir;
  if (rootDir) { rootDir = path.resolve(rootDir); }
  if (!rootDir) { rootDir = process.cwd(); }

  var transformOpts = {};
  if (options.global) {
    transformOpts.global = true;
  }

  var cssOutFilename = options.output || options.o;
  var jsonOutFilename = options.json || options.jsonOutput;
  transformOpts.cssOutFilename = cssOutFilename;

  // TODO: clean this up so there's less scope crossing
  Cmify.prototype._flush = function (callback) {
    d('_flush @_filename', this._filename)

    var self = this;
    var filename = this._filename;

    // only handle .css files
    if (!this.isCssFile(filename)) {
      callback()
      return
    }

    // convert css to js before pushing
    // reset the `tokensByFile` cache
    var relFilename = path.relative(rootDir, filename);

    postcss(modules({
      generateScopedName: generateLongName,
      getJSON: (cssFilename, css) => {
        d('======getJSON========', cssFilename)
        self.push('module.exports = ' + JSON.stringify(css))
      },
    }))
      .process(this._data, {from: '/' + relFilename})
      .then((result) => {
        d('=========result=======');
        d(result.css);
        bundledCss += result.css
        callback() // TODO: Promise.all
      })
      .catch(err => {
        d('=========error=======');
        console.error(err)
      })
  };

  browserify.transform(Cmify, transformOpts);

  function addHooks () {
    d('======addHooks')
    browserify.pipeline.get('pack').push(through(function write (row, enc, next) {
      next(null, row);
    }, function end (cb) {
      // on each bundle, create a new stream b/c the old one might have ended
      var compiledCssStream = new ReadableStream();
      compiledCssStream._read = function () {};

      browserify.emit('css stream', compiledCssStream);

      // Combine the collected sources for a single bundle into a single CSS file
      var self = this;

      // end the output stream
      compiledCssStream.push(bundledCss);
      compiledCssStream.push(null);

      var writes = [];

      // write the css file
      if (cssOutFilename) {
        d('push to writes!!!!!')
        writes.push(writeFile(cssOutFilename, bundledCss));
      }

      // write the classname manifest
      if (jsonOutFilename) {
        writes.push(writeFile(jsonOutFilename, JSON.stringify(normalizeManifestPaths(tokensByFile, rootDir))));
      }
      Promise.all(writes)
        .then(function () { cb(); })
        .catch(function (err) { self.emit('error', err); cb(); });
    }));
  }

  browserify.on('reset', addHooks); // TODO: why (to trigger for each entrypoints?)
  addHooks();

  return browserify;
};

function writeFile (filename, content) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(filename, content, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports.generateShortName = generateShortName;
module.exports.generateLongName = generateLongName;

// TODO: remove for dev
process.on('unhandledRejection', (err, p) => {
  console.error('---------unhandledRejection--------', err, p);
})
process.on('uncaughtException', (a,b,c) => {
  console.error('---------uncaughtException---------', a,b,c);
})
