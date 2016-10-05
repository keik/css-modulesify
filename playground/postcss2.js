var postcss = require('postcss')
var myp = postcss.plugin('myp', (opts) => {
  return (css) => {
    css.walkRules(function (rule) {
      console.log('@@@@@@@@@', rule);
      rule.walkDecls(function (decl, i) {
        console.log('##########', decl, i);
      })
    })
  }
})

var psScope = require( 'postcss-modules-scope')
var psLocal = require( 'postcss-modules-local-by-default')
var psImports = require( 'postcss-modules-extract-imports')
var psParser = require( 'postcss-modules-parser')

var runner = postcss()
function fetch(to, from,a,b,c) {
  console.log('||||||||||||||||||||||||||||||||', to, from,a,b,c);
  return this.process(require('fs').readFileSync(to), to).root.tokens
}
runner
  .use(myp)
  .use(psLocal)
  .use(psImports)
  .use(psScope)
  .use(new psParser({fetch: fetch.bind(runner)}))

// var runner = postcss([
//   myp,
//   psLocal,
//   psImports,
//   psScope,
//   psParser({fetch: function(to, from,a,b,c) {
//     console.log('||||||||||||||||||||||||||||||||', to, from,a,b,c);
//     console.log(this);
//     return runner.process(require('fs').readFileSync(to), to).root.tokens
//   }.bind(runner)})
// ])

var results = runner
      .process(`
.className {
  color: green;
  background: red;
}

.otherClassName {
  composes: className;
  color: yellow;
}

.otherClassName2 {
  composes: cm1_a from './cm1.css';
  color: yellow;
}`, {from: 'aaa.css'})
      .then(res => {
        console.log('=====================result==================');
        console.log(res.root.tokens);
        console.log(res.css);
      })
