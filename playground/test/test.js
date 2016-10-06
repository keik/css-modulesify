var test = require('ava')

var fs = require('fs')
var child_process = require('child_process')

test.afterEach.always((t) => {
  fs.unlinkSync('./bundle.css')
})
test('aaa', (t) => {
  t.is(child_process.execSync('$(npm bin)/browserify ./fixture/basic/1.js -p [ ../../ -o bundle.css ] | node').toString(),
`{ aaa: '_fixture_basic_1__aaa' }
`)

  t.is(fs.readFileSync('./bundle.css').toString(),
`._fixture_basic_1__aaa {
  color: blue;
}
`)
})

test('aaa', (t) => {
  t.is(child_process.execSync('$(npm bin)/browserify ./fixture/multiple-requires-from-single/1.js -p [ ../../ -o bundle.css ] | node').toString(),
`{ aaa: '_fixture_multiple_requires_from_single_1_1__aaa' }
{ bbb: '_fixture_multiple_requires_from_single_1_2__bbb' }
`)

  t.is(fs.readFileSync('./bundle.css').toString(),
`._fixture_multiple_requires_from_single_1_2__bbb {
  background-color: green;
}
._fixture_multiple_requires_from_single_1_1__aaa {
  color: blue;
}
`)
})

test('aaa', (t) => {
  t.is( child_process.execSync('$(npm bin)/browserify ./fixture/multiple-requires-from-deps-chain/1.js -p [ ../../ -o bundle.css ] | node').toString(),
`{ aaa: '_fixture_multiple_requires_from_deps_chain_1_1__aaa' }
{ bbb: '_fixture_multiple_requires_from_deps_chain_1_2__bbb' }
{ ccc: '_fixture_multiple_requires_from_deps_chain_2_1__ccc' }
{ ddd: '_fixture_multiple_requires_from_deps_chain_2_2__ddd' }
`)

  t.is(fs.readFileSync('./bundle.css').toString(),
`._fixture_multiple_requires_from_deps_chain_1_1__aaa {
  color: blue;
}
._fixture_multiple_requires_from_deps_chain_1_2__bbb {
  background-color: green;
}
._fixture_multiple_requires_from_deps_chain_2_1__ccc {
  font-weight: bold;
}
._fixture_multiple_requires_from_deps_chain_2_2__ddd {
  font-size: 10em;
}
`)
})

// test('aaa', (t) => {
//   t.is(child_process.execSync('$(npm bin)/browserify ./fixture/composes-from-others/1.js -p [ ../../ -o bundle.css ] | node').toString(),
// `{ aaa: '_fixture_composes_from_others_1__aaa _fixture_composes_from_others_shared__bbb' }
// `)

//   t.is(fs.readFileSync('./bundle.css').toString(),
// `._fixture_composes_from_others_shared__bbb {
//   color: yellow;
// }
// ._fixture_composes_from_others_1__aaa {
//   font-size: 10em;
// }
// `)
// })
