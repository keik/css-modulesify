var d = require('debug')('keik:playground:bundle')
var browserify = require('browserify')

var b = browserify('./1-css.js', {transform: [MyTr]})

b.bundle((err, buf) => {
  if (err) throw err
  console.log(buf.toString());
})

var stream = require('stream');
var util = require('util');
util.inherits(MyTr, stream.Transform);
function MyTr(filename, opts) {
  if (!(this instanceof MyTr)) return new MyTr(filename, opts);
  d('MyTr @filename', filename)
  stream.Transform.call(this);
  this._data = '';
  this._filename = filename;
  return this
}

MyTr.prototype._transform = function (buf, enc, callback) {
  d('_transform @buf', buf.toString())
  this._data += buf
  callback()
}
MyTr.prototype._flush = function(callback) {
  if ((/.css$/).test(this._filename)) {
    var wrapped = `module.exports = '${this._data.replace(/[\r\n]/g, '')}'`
    d(wrapped)
    this.push(wrapped)
    callback()
    return
  }
  this.push(this._data)
  callback()
}
