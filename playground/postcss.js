var postcss = require('postcss')
var scope = require('postcss-modules-scope')
var localByDefault = require('postcss-modules-local-by-default')
var extractImports = require('postcss-modules-extract-imports')
var values = require('postcss-modules-values')
var parser = require('postcss-modules-parser')
var identity = require('lodash').identity

var runner = postcss([scope])

function fetch(to, from) {
  console.log(to, from);
}
var results = runner.process(`:local(.continueButton) {
  color: green;
}`, {from: 'aaa.css'}).then((res) => {
  console.log(res)
  console.log('============');
  console.log(res.css);
}).catch((err) => {
  console.error(err);
})
