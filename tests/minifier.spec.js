'use strict';

const { test, expect } = require('@jest/globals');
const { minify } = require('../src/htmlminifier');

test('`minifiy` exists', () => {
  expect(minify).toBeDefined();
});

test('parsing non-trivial markup', async () => {
  let input, output;

  expect(await minify('</td>')).toBe('');
  expect(await minify('</p>')).toBe('<p></p>');
  expect(await minify('</br>')).toBe('<br>');
  expect(await minify('<br>x</br>')).toBe('<br>x<br>');
  expect(await minify('<p title="</p>">x</p>')).toBe('<p title="</p>">x</p>');
  expect(await minify('<p title=" <!-- hello world --> ">x</p>')).toBe('<p title=" <!-- hello world --> ">x</p>');
  expect(await minify('<p title=" <![CDATA[ \n\n foobar baz ]]> ">x</p>')).toBe('<p title=" <![CDATA[ \n\n foobar baz ]]> ">x</p>');
  expect(await minify('<p foo-bar=baz>xxx</p>')).toBe('<p foo-bar="baz">xxx</p>');
  expect(await minify('<p foo:bar=baz>xxx</p>')).toBe('<p foo:bar="baz">xxx</p>');
  expect(await minify('<p foo.bar=baz>xxx</p>')).toBe('<p foo.bar="baz">xxx</p>');

  input = '<div><div><div><div><div><div><div><div><div><div>' +
    'i\'m 10 levels deep' +
    '</div></div></div></div></div></div></div></div></div></div>';

  expect(await minify(input)).toBe(input);

  expect(await minify('<script>alert(\'<!--\')</script>')).toBe('<script>alert(\'<!--\')</script>');
  expect(await minify('<script>alert(\'<!-- foo -->\')</script>')).toBe('<script>alert(\'<!-- foo -->\')</script>');
  expect(await minify('<script>alert(\'-->\')</script>')).toBe('<script>alert(\'-->\')</script>');

  expect(await minify('<a title="x"href=" ">foo</a>')).toBe('<a title="x" href="">foo</a>');
  expect(await minify('<p id=""class=""title="">x')).toBe('<p id="" class="" title="">x</p>');
  expect(await minify('<p x="x\'"">x</p>')).toBe('<p x="x\'">x</p>', 'trailing quote should be ignored');
  expect(await minify('<a href="#"><p>Click me</p></a>')).toBe('<a href="#"><p>Click me</p></a>');
  expect(await minify('<span><button>Hit me</button></span>')).toBe('<span><button>Hit me</button></span>');
  expect(await minify('<object type="image/svg+xml" data="image.svg"><div>[fallback image]</div></object>')).toBe(
    '<object type="image/svg+xml" data="image.svg"><div>[fallback image]</div></object>'
  );

  expect(await minify('<ng-include src="x"></ng-include>')).toBe('<ng-include src="x"></ng-include>');
  expect(await minify('<ng:include src="x"></ng:include>')).toBe('<ng:include src="x"></ng:include>');
  expect(await minify('<ng-include src="\'views/partial-notification.html\'"></ng-include><div ng-view=""></div>')).toBe(
    '<ng-include src="\'views/partial-notification.html\'"></ng-include><div ng-view=""></div>'
  );

  // will cause test to time-out if fail
  input = '<p>For more information, read <a href=https://stackoverflow.com/questions/17408815/fieldset-resizes-wrong-appears-to-have-unremovable-min-width-min-content/17863685#17863685>this Stack Overflow answer</a>.</p>';
  output = '<p>For more information, read <a href="https://stackoverflow.com/questions/17408815/fieldset-resizes-wrong-appears-to-have-unremovable-min-width-min-content/17863685#17863685">this Stack Overflow answer</a>.</p>';
  expect(await minify(input)).toBe(output);

  input = '<html ⚡></html>';
  expect(await minify(input)).toBe(input);

  input = '<h:ællæ></h:ællæ>';
  expect(await minify(input)).toBe(input);

  input = '<$unicorn>';
  expect(minify(input)).rejects.toBeInstanceOf(Error, 'Invalid tag name');

  expect(await minify(input, {
    continueOnParseError: true
  })).toBe(input);

  input = '<begriffs.pagination ng-init="perPage=20" collection="logs" url="\'/api/logs?user=-1\'" per-page="perPage" per-page-presets="[10,20,50,100]" template-url="/assets/paginate-anything.html"></begriffs.pagination>';
  expect(await minify(input)).toBe(input);

  // https://github.com/kangax/html-minifier/issues/41
  expect(await minify('<some-tag-1></some-tag-1><some-tag-2></some-tag-2>')).toBe(
    '<some-tag-1></some-tag-1><some-tag-2></some-tag-2>'
  );

  // https://github.com/kangax/html-minifier/issues/40
  expect(await minify('[\']["]')).toBe('[\']["]');

  // https://github.com/kangax/html-minifier/issues/21
  expect(await minify('<a href="test.html"><div>hey</div></a>')).toBe('<a href="test.html"><div>hey</div></a>');

  // https://github.com/kangax/html-minifier/issues/17
  expect(await minify(':) <a href="http://example.com">link</a>')).toBe(':) <a href="http://example.com">link</a>');

  // https://github.com/kangax/html-minifier/issues/169
  expect(await minify('<a href>ok</a>')).toBe('<a href>ok</a>');

  expect(await minify('<a onclick></a>')).toBe('<a onclick></a>');

  // https://github.com/kangax/html-minifier/issues/229
  expect(await minify('<CUSTOM-TAG></CUSTOM-TAG><div>Hello :)</div>')).toBe('<custom-tag></custom-tag><div>Hello :)</div>');

  // https://github.com/kangax/html-minifier/issues/507
  input = '<tag v-ref:vm_pv :imgs=" objpicsurl_ "></tag>';
  expect(await minify(input)).toBe(input);

  input = '<tag v-ref:vm_pv :imgs=" objpicsurl_ " ss"123>';
  expect(minify(input)).rejects.toBeInstanceOf(Error, 'invalid attribute name');

  expect(await minify(input, {
    continueOnParseError: true
  })).toBe(input);

  // https://github.com/kangax/html-minifier/issues/512
  input = '<input class="form-control" type="text" style="" id="{{vm.formInputName}}" name="{{vm.formInputName}}"' +
    ' placeholder="YYYY-MM-DD"' +
    ' date-range-picker' +
    ' data-ng-model="vm.value"' +
    ' data-ng-model-options="{ debounce: 1000 }"' +
    ' data-ng-pattern="vm.options.format"' +
    ' data-options="vm.datepickerOptions">';
  expect(await minify(input)).toBe(input);

  input = '<input class="form-control" type="text" style="" id="{{vm.formInputName}}" name="{{vm.formInputName}}"' +
    ' <!--FIXME hardcoded placeholder - dates may not be used for service required fields yet. -->' +
    ' placeholder="YYYY-MM-DD"' +
    ' date-range-picker' +
    ' data-ng-model="vm.value"' +
    ' data-ng-model-options="{ debounce: 1000 }"' +
    ' data-ng-pattern="vm.options.format"' +
    ' data-options="vm.datepickerOptions">';

  expect(minify(input)).rejects.toBeInstanceOf(Error, 'HTML comment inside tag');

  expect(await minify(input, {
    continueOnParseError: true
  })).toBe(input);

  // // https://github.com/kangax/html-minifier/issues/974
  input = '<!–– Failing New York Times Comment -->';
  expect(minify(input)).rejects.toBeInstanceOf(Error, 'invalid HTML comment');

  expect(await minify(input, {
    continueOnParseError: true
  })).toBe(input);

  input = '<br a=\u00A0 b="&nbsp;" c="\u00A0">';
  output = '<br a="\u00A0" b="&nbsp;" c="\u00A0">';
  expect(await minify(input)).toBe(output);
  output = '<br a="\u00A0"b="\u00A0"c="\u00A0">';
  expect(await minify(input, {
    decodeEntities: true,
    removeTagWhitespace: true
  })).toBe(output);
  output = '<br a=\u00A0 b=\u00A0 c=\u00A0>';
  expect(await minify(input, {
    decodeEntities: true,
    removeAttributeQuotes: true
  })).toBe(output);
  expect(await minify(input, {
    decodeEntities: true,
    removeAttributeQuotes: true,
    removeTagWhitespace: true
  })).toBe(output);
});

test('options', async () => {
  const input = '<p>blah<span>blah 2<span>blah 3</span></span></p>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, {})).toBe(input);
});

test('case normalization', async () => {
  expect(await minify('<P>foo</p>')).toBe('<p>foo</p>');
  expect(await minify('<DIV>boo</DIV>')).toBe('<div>boo</div>');
  expect(await minify('<DIV title="moo">boo</DiV>')).toBe('<div title="moo">boo</div>');
  expect(await minify('<DIV TITLE="blah">boo</DIV>')).toBe('<div title="blah">boo</div>');
  expect(await minify('<DIV tItLe="blah">boo</DIV>')).toBe('<div title="blah">boo</div>');
  expect(await minify('<DiV tItLe="blah">boo</DIV>')).toBe('<div title="blah">boo</div>');
});

test('space normalization between attributes', async () => {
  expect(await minify('<p title="bar">foo</p>')).toBe('<p title="bar">foo</p>');
  expect(await minify('<img src="test"/>')).toBe('<img src="test">');
  expect(await minify('<p title = "bar">foo</p>')).toBe('<p title="bar">foo</p>');
  expect(await minify('<p title\n\n\t  =\n     "bar">foo</p>')).toBe('<p title="bar">foo</p>');
  expect(await minify('<img src="test" \n\t />')).toBe('<img src="test">');
  expect(await minify('<input title="bar"       id="boo"    value="hello world">')).toBe('<input title="bar" id="boo" value="hello world">');
});

test('space normalization around text', async () => {
  let input, output;
  input = '   <p>blah</p>\n\n\n   ';
  expect(await minify(input)).toBe(input);
  output = '<p>blah</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  output = ' <p>blah</p> ';
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);
  output = '<p>blah</p>\n';
  expect(await minify(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);
  output = ' <p>blah</p>\n';
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true
  })).toBe(output);
  await Promise.all([
    'a', 'abbr', 'acronym', 'b', 'big', 'del', 'em', 'font', 'i', 'ins', 'kbd',
    'mark', 's', 'samp', 'small', 'span', 'strike', 'strong', 'sub', 'sup',
    'time', 'tt', 'u', 'var'
  ].map(async function (el) {
    expect(await minify('foo <' + el + '>baz</' + el + '> bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz</' + el + '> bar');
    expect(await minify('foo<' + el + '>baz</' + el + '>bar', { collapseWhitespace: true })).toBe('foo<' + el + '>baz</' + el + '>bar');
    expect(await minify('foo <' + el + '>baz</' + el + '>bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz</' + el + '>bar');
    expect(await minify('foo<' + el + '>baz</' + el + '> bar', { collapseWhitespace: true })).toBe('foo<' + el + '>baz</' + el + '> bar');
    expect(await minify('foo <' + el + '> baz </' + el + '> bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz </' + el + '>bar');
    expect(await minify('foo<' + el + '> baz </' + el + '>bar', { collapseWhitespace: true })).toBe('foo<' + el + '> baz </' + el + '>bar');
    expect(await minify('foo <' + el + '> baz </' + el + '>bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz </' + el + '>bar');
    expect(await minify('foo<' + el + '> baz </' + el + '> bar', { collapseWhitespace: true })).toBe('foo<' + el + '> baz </' + el + '>bar');
    expect(await minify('<div>foo <' + el + '>baz</' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz</' + el + '> bar</div>');
    expect(await minify('<div>foo<' + el + '>baz</' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '>baz</' + el + '>bar</div>');
    expect(await minify('<div>foo <' + el + '>baz</' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz</' + el + '>bar</div>');
    expect(await minify('<div>foo<' + el + '>baz</' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '>baz</' + el + '> bar</div>');
    expect(await minify('<div>foo <' + el + '> baz </' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz </' + el + '>bar</div>');
    expect(await minify('<div>foo<' + el + '> baz </' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '> baz </' + el + '>bar</div>');
    expect(await minify('<div>foo <' + el + '> baz </' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz </' + el + '>bar</div>');
    expect(await minify('<div>foo<' + el + '> baz </' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '> baz </' + el + '>bar</div>');
  }));
  // Don't trim whitespace around element, but do trim within
  await Promise.all([
    'bdi', 'bdo', 'button', 'cite', 'code', 'dfn', 'math', 'q', 'rt', 'rtc', 'ruby', 'svg'
  ].map(async function (el) {
    expect(await minify('foo <' + el + '>baz</' + el + '> bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz</' + el + '> bar');
    expect(await minify('foo<' + el + '>baz</' + el + '>bar', { collapseWhitespace: true })).toBe('foo<' + el + '>baz</' + el + '>bar');
    expect(await minify('foo <' + el + '>baz</' + el + '>bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz</' + el + '>bar');
    expect(await minify('foo<' + el + '>baz</' + el + '> bar', { collapseWhitespace: true })).toBe('foo<' + el + '>baz</' + el + '> bar');
    expect(await minify('foo <' + el + '> baz </' + el + '> bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz</' + el + '> bar');
    expect(await minify('foo<' + el + '> baz </' + el + '>bar', { collapseWhitespace: true })).toBe('foo<' + el + '>baz</' + el + '>bar');
    expect(await minify('foo <' + el + '> baz </' + el + '>bar', { collapseWhitespace: true })).toBe('foo <' + el + '>baz</' + el + '>bar');
    expect(await minify('foo<' + el + '> baz </' + el + '> bar', { collapseWhitespace: true })).toBe('foo<' + el + '>baz</' + el + '> bar');
    expect(await minify('<div>foo <' + el + '>baz</' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz</' + el + '> bar</div>');
    expect(await minify('<div>foo<' + el + '>baz</' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '>baz</' + el + '>bar</div>');
    expect(await minify('<div>foo <' + el + '>baz</' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz</' + el + '>bar</div>');
    expect(await minify('<div>foo<' + el + '>baz</' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '>baz</' + el + '> bar</div>');
    expect(await minify('<div>foo <' + el + '> baz </' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz</' + el + '> bar</div>');
    expect(await minify('<div>foo<' + el + '> baz </' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '>baz</' + el + '>bar</div>');
    expect(await minify('<div>foo <' + el + '> baz </' + el + '>bar</div>', { collapseWhitespace: true })).toBe('<div>foo <' + el + '>baz</' + el + '>bar</div>');
    expect(await minify('<div>foo<' + el + '> baz </' + el + '> bar</div>', { collapseWhitespace: true })).toBe('<div>foo<' + el + '>baz</' + el + '> bar</div>');
  }));
  await Promise.all([
    ['<span> foo </span>', '<span>foo</span>'],
    [' <span> foo </span> ', '<span>foo</span>'],
    ['<nobr>a</nobr>', '<nobr>a</nobr>'],
    ['<nobr>a </nobr>', '<nobr>a</nobr>'],
    ['<nobr> a</nobr>', '<nobr>a</nobr>'],
    ['<nobr> a </nobr>', '<nobr>a</nobr>'],
    ['a<nobr>b</nobr>c', 'a<nobr>b</nobr>c'],
    ['a<nobr>b </nobr>c', 'a<nobr>b </nobr>c'],
    ['a<nobr> b</nobr>c', 'a<nobr> b</nobr>c'],
    ['a<nobr> b </nobr>c', 'a<nobr> b </nobr>c'],
    ['a<nobr>b</nobr> c', 'a<nobr>b</nobr> c'],
    ['a<nobr>b </nobr> c', 'a<nobr>b</nobr> c'],
    ['a<nobr> b</nobr> c', 'a<nobr> b</nobr> c'],
    ['a<nobr> b </nobr> c', 'a<nobr> b</nobr> c'],
    ['a <nobr>b</nobr>c', 'a <nobr>b</nobr>c'],
    ['a <nobr>b </nobr>c', 'a <nobr>b </nobr>c'],
    ['a <nobr> b</nobr>c', 'a <nobr>b</nobr>c'],
    ['a <nobr> b </nobr>c', 'a <nobr>b </nobr>c'],
    ['a <nobr>b</nobr> c', 'a <nobr>b</nobr> c'],
    ['a <nobr>b </nobr> c', 'a <nobr>b</nobr> c'],
    ['a <nobr> b</nobr> c', 'a <nobr>b</nobr> c'],
    ['a <nobr> b </nobr> c', 'a <nobr>b</nobr> c']
  ].map(async function (inputs) {
    expect(await minify(inputs[0], {
      collapseWhitespace: true,
      conservativeCollapse: true
    })).toBe(inputs[0], inputs[0]);
    expect(await minify(inputs[0], { collapseWhitespace: true })).toBe(inputs[1], inputs[0]);
    const input = '<div>' + inputs[0] + '</div>';
    expect(await minify(input, {
      collapseWhitespace: true,
      conservativeCollapse: true
    })).toBe(input, input);
    const output = '<div>' + inputs[1] + '</div>';
    expect(await minify(input, { collapseWhitespace: true })).toBe(output, input);
  }));
  expect(await minify('<p>foo <img> bar</p>', { collapseWhitespace: true })).toBe('<p>foo <img> bar</p>');
  expect(await minify('<p>foo<img>bar</p>', { collapseWhitespace: true })).toBe('<p>foo<img>bar</p>');
  expect(await minify('<p>foo <img>bar</p>', { collapseWhitespace: true })).toBe('<p>foo <img>bar</p>');
  expect(await minify('<p>foo<img> bar</p>', { collapseWhitespace: true })).toBe('<p>foo<img> bar</p>');
  expect(await minify('<p>foo <wbr> bar</p>', { collapseWhitespace: true })).toBe('<p>foo<wbr> bar</p>');
  expect(await minify('<p>foo<wbr>bar</p>', { collapseWhitespace: true })).toBe('<p>foo<wbr>bar</p>');
  expect(await minify('<p>foo <wbr>bar</p>', { collapseWhitespace: true })).toBe('<p>foo <wbr>bar</p>');
  expect(await minify('<p>foo<wbr> bar</p>', { collapseWhitespace: true })).toBe('<p>foo<wbr> bar</p>');
  expect(await minify('<p>foo <wbr baz moo=""> bar</p>', { collapseWhitespace: true })).toBe('<p>foo<wbr baz moo=""> bar</p>');
  expect(await minify('<p>foo<wbr baz moo="">bar</p>', { collapseWhitespace: true })).toBe('<p>foo<wbr baz moo="">bar</p>');
  expect(await minify('<p>foo <wbr baz moo="">bar</p>', { collapseWhitespace: true })).toBe('<p>foo <wbr baz moo="">bar</p>');
  expect(await minify('<p>foo<wbr baz moo=""> bar</p>', { collapseWhitespace: true })).toBe('<p>foo<wbr baz moo=""> bar</p>');
  expect(await minify('<p>  <a href="#">  <code>foo</code></a> bar</p>', { collapseWhitespace: true })).toBe('<p><a href="#"><code>foo</code></a> bar</p>');
  expect(await minify('<p><a href="#"><code>foo  </code></a> bar</p>', { collapseWhitespace: true })).toBe('<p><a href="#"><code>foo</code></a> bar</p>');
  expect(await minify('<p>  <a href="#">  <code>   foo</code></a> bar   </p>', { collapseWhitespace: true })).toBe('<p><a href="#"><code>foo</code></a> bar</p>');
  expect(await minify('<div> Empty <!-- or --> not </div>', { collapseWhitespace: true })).toBe('<div>Empty<!-- or --> not</div>');
  expect(await minify('<div> a <input><!-- b --> c </div>', {
    collapseWhitespace: true,
    removeComments: true
  })).toBe('<div>a <input> c</div>');
  await Promise.all([
    ' a <? b ?> c ',
    '<!-- d --> a <? b ?> c ',
    ' <!-- d -->a <? b ?> c ',
    ' a<!-- d --> <? b ?> c ',
    ' a <!-- d --><? b ?> c ',
    ' a <? b ?><!-- d --> c ',
    ' a <? b ?> <!-- d -->c ',
    ' a <? b ?> c<!-- d --> ',
    ' a <? b ?> c <!-- d -->'
  ].map(async function (input) {
    expect(await minify(input, {
      collapseWhitespace: true,
      conservativeCollapse: true
    })).toBe(input, input);
    expect(await minify(input, {
      collapseWhitespace: true,
      removeComments: true
    })).toBe('a <? b ?> c', input);
    expect(await minify(input, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true
    })).toBe(' a <? b ?> c ', input);
    input = '<p>' + input + '</p>';
    expect(await minify(input, {
      collapseWhitespace: true,
      conservativeCollapse: true
    })).toBe(input, input);
    expect(await minify(input, {
      collapseWhitespace: true,
      removeComments: true
    })).toBe('<p>a <? b ?> c</p>', input);
    expect(await minify(input, {
      collapseWhitespace: true,
      conservativeCollapse: true,
      removeComments: true
    })).toBe('<p> a <? b ?> c </p>', input);
  }));
  input = '<li><i></i> <b></b> foo</li>';
  output = '<li><i></i> <b></b> foo</li>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<li><i> </i> <b></b> foo</li>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<li> <i></i> <b></b> foo</li>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<li><i></i> <b> </b> foo</li>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<li> <i> </i> <b> </b> foo</li>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<div> <a href="#"> <span> <b> foo </b> <i> bar </i> </span> </a> </div>';
  output = '<div><a href="#"><span><b>foo </b><i>bar</i></span></a></div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<head> <!-- a --> <!-- b --><link> </head>';
  output = '<head><!-- a --><!-- b --><link></head>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<head> <!-- a --> <!-- b --> <!-- c --><link> </head>';
  output = '<head><!-- a --><!-- b --><!-- c --><link></head>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<p> foo\u00A0bar\nbaz  \u00A0\nmoo\t</p>';
  output = '<p>foo\u00A0bar baz \u00A0 moo</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<label> foo </label>\n' +
    '<input>\n' +
    '<object> bar </object>\n' +
    '<select> baz </select>\n' +
    '<textarea> moo </textarea>\n';
  output = '<label>foo</label> <input> <object>bar</object> <select>baz</select> <textarea> moo </textarea>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  input = '<pre>\n' +
    'foo\n' +
    '<br>\n' +
    'bar\n' +
    '</pre>\n' +
    'baz\n';
  output = '<pre>\nfoo\n<br>\nbar\n</pre>baz';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
});

test('types of whitespace that should always be preserved', async () => {
  // Hair space:
  let input = '<div>\u200afo\u200ao\u200a</div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(input);

  // Hair space passed as HTML entity:
  let inputWithEntities = '<div>&#8202;fo&#8202;o&#8202;</div>';
  expect(await minify(inputWithEntities, { collapseWhitespace: true })).toBe(inputWithEntities);

  // Hair space passed as HTML entity, in decodeEntities:true mode:
  expect(await minify(inputWithEntities, { collapseWhitespace: true, decodeEntities: true })).toBe(input);

  // Non-breaking space:
  input = '<div>\xa0fo\xa0o\xa0</div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(input);

  // Non-breaking space passed as HTML entity:
  inputWithEntities = '<div>&nbsp;fo&nbsp;o&nbsp;</div>';
  expect(await minify(inputWithEntities, { collapseWhitespace: true })).toBe(inputWithEntities);

  // Non-breaking space passed as HTML entity, in decodeEntities:true mode:
  expect(await minify(inputWithEntities, { collapseWhitespace: true, decodeEntities: true })).toBe(input);

  // Do not remove hair space when preserving line breaks between tags:
  input = '<p></p>\u200a\n<p></p>\n';
  expect(await minify(input, { collapseWhitespace: true, preserveLineBreaks: true })).toBe(input);

  // Preserve hair space in attributes:
  input = '<p class="foo\u200abar"></p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(input);

  // Preserve hair space in class names when deduplicating and reordering:
  input = '<a class="0 1\u200a3 2 3"></a>';
  expect(await minify(input, { sortClassName: false })).toBe(input);
  expect(await minify(input, { sortClassName: true })).toBe(input);
});

test('doctype normalization', async () => {
  let input;
  const output = '<!doctype html>';

  input = '<!DOCTYPE html>';
  expect(await minify(input, { useShortDoctype: false })).toBe(input);
  expect(await minify(input, { useShortDoctype: true })).toBe(output);

  expect(await minify(input, {
    useShortDoctype: true,
    removeTagWhitespace: true
  })).toBe('<!doctypehtml>');

  input = '<!DOCTYPE\nhtml>';
  expect(await minify(input, { useShortDoctype: false })).toBe('<!DOCTYPE html>');
  expect(await minify(input, { useShortDoctype: true })).toBe(output);

  input = '<!DOCTYPE\thtml>';
  expect(await minify(input, { useShortDoctype: false })).toBe(input);
  expect(await minify(input, { useShortDoctype: true })).toBe(output);

  input = '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"\n    "http://www.w3.org/TR/html4/strict.dtd">';
  expect(await minify(input, { useShortDoctype: false })).toBe('<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">');
  expect(await minify(input, { useShortDoctype: true })).toBe(output);
});

test('removing comments', async () => {
  let input;

  input = '<!-- test -->';
  expect(await minify(input, { removeComments: true })).toBe('');

  input = '<!-- foo --><div>baz</div><!-- bar\n\n moo -->';
  expect(await minify(input, { removeComments: true })).toBe('<div>baz</div>');
  expect(await minify(input, { removeComments: false })).toBe(input);

  input = '<p title="<!-- comment in attribute -->">foo</p>';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<script><!-- alert(1) --></script>';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<STYLE><!-- alert(1) --></STYLE>';
  expect(await minify(input, { removeComments: true })).toBe('<style><!-- alert(1) --></style>');
});

test('ignoring comments', async () => {
  let input;

  input = '<!--! test -->';
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { removeComments: false })).toBe(input);

  input = '<!--! foo --><div>baz</div><!--! bar\n\n moo -->';
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { removeComments: false })).toBe(input);

  input = '<!--! foo --><div>baz</div><!-- bar\n\n moo -->';
  expect(await minify(input, { removeComments: true })).toBe('<!--! foo --><div>baz</div>');
  expect(await minify(input, { removeComments: false })).toBe(input);

  input = '<!-- ! test -->';
  expect(await minify(input, { removeComments: true })).toBe('');
  expect(await minify(input, { removeComments: false })).toBe(input);

  input = '<div>\n\n   \t<div><div>\n\n<p>\n\n<!--!      \t\n\nbar\n\n moo         -->      \n\n</p>\n\n        </div>  </div></div>';
  const output = '<div><div><div><p><!--!      \t\n\nbar\n\n moo         --></p></div></div></div>';
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { removeComments: true, collapseWhitespace: true })).toBe(output);
  expect(await minify(input, { removeComments: false })).toBe(input);
  expect(await minify(input, { removeComments: false, collapseWhitespace: true })).toBe(output);

  input = '<p rel="<!-- comment in attribute -->" title="<!--! ignored comment in attribute -->">foo</p>';
  expect(await minify(input, { removeComments: true })).toBe(input);
});

test('conditional comments', async () => {
  let input, output;

  input = '<![if IE 5]>test<![endif]>';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<!--[if IE 6]>test<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<!--[if IE 7]>-->test<!--<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<!--[if IE 8]><!-->test<!--<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<!--[if lt IE 5.5]>test<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<!--[if (gt IE 5)&(lt IE 7)]>test<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);

  input = '<html>\n' +
    '  <head>\n' +
    '    <!--[if lte IE 8]>\n' +
    '      <script type="text/javascript">\n' +
    '        alert("ie8!");\n' +
    '      </script>\n' +
    '    <![endif]-->\n' +
    '  </head>\n' +
    '  <body>\n' +
    '  </body>\n' +
    '</html>';
  output = '<head><!--[if lte IE 8]>\n' +
    '      <script type="text/javascript">\n' +
    '        alert("ie8!");\n' +
    '      </script>\n' +
    '    <![endif]-->';
  expect(await minify(input, {
    minifyJS: true,
    removeComments: true,
    collapseWhitespace: true,
    removeOptionalTags: true,
    removeScriptTypeAttributes: true
  })).toBe(output);
  output = '<head><!--[if lte IE 8]><script>alert("ie8!")</script><![endif]-->';
  expect(await minify(input, {
    minifyJS: true,
    removeComments: true,
    collapseWhitespace: true,
    removeOptionalTags: true,
    removeScriptTypeAttributes: true,
    processConditionalComments: true
  })).toBe(output);

  input = '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '  <head>\n' +
    '    <meta http-equiv="X-UA-Compatible"\n' +
    '          content="IE=edge,chrome=1">\n' +
    '    <meta charset="utf-8">\n' +
    '    <!--[if lt IE 7]><html class="no-js ie6"><![endif]-->\n' +
    '    <!--[if IE 7]><html class="no-js ie7"><![endif]-->\n' +
    '    <!--[if IE 8]><html class="no-js ie8"><![endif]-->\n' +
    '    <!--[if gt IE 8]><!--><html class="no-js"><!--<![endif]-->\n' +
    '\n' +
    '    <title>Document</title>\n' +
    '  </head>\n' +
    '  <body>\n' +
    '  </body>\n' +
    '</html>';
  output = '<!DOCTYPE html>' +
    '<html lang="en">' +
    '<head>' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">' +
    '<meta charset="utf-8">' +
    '<!--[if lt IE 7]><html class="no-js ie6"><![endif]-->' +
    '<!--[if IE 7]><html class="no-js ie7"><![endif]-->' +
    '<!--[if IE 8]><html class="no-js ie8"><![endif]-->' +
    '<!--[if gt IE 8]><!--><html class="no-js"><!--<![endif]-->' +
    '<title>Document</title></head><body></body></html>';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true
  })).toBe(output);
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    processConditionalComments: true
  })).toBe(output);
});

test('collapsing space in conditional comments', async () => {
  let input, output;

  input = '<!--[if IE 7]>\n\n   \t\n   \t\t ' +
    '<link rel="stylesheet" href="/css/ie7-fixes.css" type="text/css" />\n\t' +
    '<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { removeComments: true, collapseWhitespace: true })).toBe(input);
  output = '<!--[if IE 7]>\n\n   \t\n   \t\t ' +
    '<link rel="stylesheet" href="/css/ie7-fixes.css" type="text/css">\n\t' +
    '<![endif]-->';
  expect(await minify(input, { removeComments: true, processConditionalComments: true })).toBe(output);
  output = '<!--[if IE 7]>' +
    '<link rel="stylesheet" href="/css/ie7-fixes.css" type="text/css">' +
    '<![endif]-->';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    processConditionalComments: true
  })).toBe(output);

  input = '<!--[if lte IE 6]>\n    \n   \n\n\n\t' +
    '<p title=" sigificant     whitespace   ">blah blah</p>' +
    '<![endif]-->';
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { removeComments: true, collapseWhitespace: true })).toBe(input);
  output = '<!--[if lte IE 6]>' +
    '<p title=" sigificant     whitespace   ">blah blah</p>' +
    '<![endif]-->';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    processConditionalComments: true
  })).toBe(output);
});

test('remove comments from scripts', async () => {
  let input, output;

  input = '<script><!--\nalert(1);\n--></script>';
  expect(await minify(input)).toBe(input);
  output = '<script>alert(1)</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script><!--alert(2);--></script>';
  expect(await minify(input)).toBe(input);
  output = '<script></script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script><!--alert(3);\n--></script>';
  expect(await minify(input)).toBe(input);
  output = '<script></script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script><!--\nalert(4);--></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script><!--alert(5);\nalert(6);\nalert(7);--></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script><!--alert(8)</script>';
  expect(await minify(input)).toBe(input);
  output = '<script></script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="text/javascript"> \n <!--\nalert("-->"); -->\n\n   </script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script type="text/javascript"> \n <!--\nalert("-->");\n -->\n\n   </script>';
  expect(await minify(input)).toBe(input);
  output = '<script type="text/javascript">alert("--\\x3e")</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script> //   <!--   \n  alert(1)   //  --> </script>';
  expect(await minify(input)).toBe(input);
  output = '<script>alert(1)</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="text/html">\n<div>\n</div>\n<!-- aa -->\n</script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);
});

test('remove comments from styles', async () => {
  let input, output;

  input = '<style><!--\np.a{background:red}\n--></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.a{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><!--p.b{background:red}--></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.b{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><!--p.c{background:red}\n--></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.c{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><!--\np.d{background:red}--></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.d{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><!--p.e{background:red}\np.f{background:red}\np.g{background:red}--></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.e{background:red}p.f{background:red}p.g{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style>p.h{background:red}<!--\np.i{background:red}\n-->p.j{background:red}</style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.h{background:red}p.i{background:red}p.j{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style type="text/css"><!-- p { color: red } --></style>';
  expect(await minify(input)).toBe(input);
  output = '<style type="text/css">p{color:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style type="text/css">p::before { content: "<!--" }</style>';
  expect(await minify(input)).toBe(input);
  output = '<style type="text/css">p::before{content:"<!--"}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style type="text/html">\n<div>\n</div>\n<!-- aa -->\n</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);
});

test('remove CDATA sections from scripts/styles', async () => {
  let input, output;

  input = '<script><![CDATA[\nalert(1)\n]]></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script><![CDATA[alert(2)]]></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script><![CDATA[alert(3)\n]]></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script><![CDATA[\nalert(4)]]></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script><![CDATA[alert(5)\nalert(6)\nalert(7)]]></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script>/*<![CDATA[*/alert(8)/*]]>*/</script>';
  expect(await minify(input)).toBe(input);
  output = '<script>alert(8)</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script>//<![CDATA[\nalert(9)\n//]]></script>';
  expect(await minify(input)).toBe(input);
  output = '<script>alert(9)</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="text/javascript"> /* \n\t  <![CDATA[  */ alert(10) /*  ]]>  */ \n </script>';
  expect(await minify(input)).toBe(input);
  output = '<script type="text/javascript">alert(10)</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script>\n\n//<![CDATA[\nalert(11)//]]></script>';
  expect(await minify(input)).toBe(input);
  output = '<script>alert(11)</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<style><![CDATA[\np.a{background:red}\n]]></style>';
  expect(await minify(input)).toBe(input);
  output = '<style></style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><![CDATA[p.b{background:red}]]></style>';
  expect(await minify(input)).toBe(input);
  output = '<style></style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><![CDATA[p.c{background:red}\n]]></style>';
  expect(await minify(input)).toBe(input);
  output = '<style></style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><![CDATA[\np.d{background:red}]]></style>';
  expect(await minify(input)).toBe(input);
  output = '<style></style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style><![CDATA[p.e{background:red}\np.f{background:red}\np.g{background:red}]]></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.f{background:red}p.g{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style>p.h{background:red}<![CDATA[\np.i{background:red}\n]]>p.j{background:red}</style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p.h{background:red}]]>p.j{background:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style>/* <![CDATA[ */p { color: red } // ]]></style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p{color:red}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style type="text/html">\n<div>\n</div>\n<![CDATA[ aa ]]>\n</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);
});

test('custom processors', async () => {
  let input, output;

  function css(text, type) {
    return (type || 'Normal') + ' CSS';
  }

  input = '<style>\n.foo { font: 12pt "bar" } </style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: null })).toBe(input);
  expect(await minify(input, { minifyCSS: false })).toBe(input);
  output = '<style>Normal CSS</style>';
  expect(await minify(input, { minifyCSS: css })).toBe(output);

  input = '<p style="font: 12pt \'bar\'"></p>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: null })).toBe(input);
  expect(await minify(input, { minifyCSS: false })).toBe(input);
  output = '<p style="inline CSS"></p>';
  expect(await minify(input, { minifyCSS: css })).toBe(output);

  input = '<link rel="stylesheet" href="css/style-mobile.css" media="(max-width: 737px)">';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: null })).toBe(input);
  expect(await minify(input, { minifyCSS: false })).toBe(input);
  output = '<link rel="stylesheet" href="css/style-mobile.css" media="media CSS">';
  expect(await minify(input, { minifyCSS: css })).toBe(output);

  input = '<style media="(max-width: 737px)"></style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: null })).toBe(input);
  expect(await minify(input, { minifyCSS: false })).toBe(input);
  output = '<style media="media CSS">Normal CSS</style>';
  expect(await minify(input, { minifyCSS: css })).toBe(output);

  function js(text, inline) {
    return inline ? 'Inline JS' : 'Normal JS';
  }

  input = '<script>\nalert(1); </script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: null })).toBe(input);
  expect(await minify(input, { minifyJS: false })).toBe(input);
  output = '<script>Normal JS</script>';
  expect(await minify(input, { minifyJS: js })).toBe(output);

  input = '<p onload="alert(1);"></p>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: null })).toBe(input);
  expect(await minify(input, { minifyJS: false })).toBe(input);
  output = '<p onload="Inline JS"></p>';
  expect(await minify(input, { minifyJS: js })).toBe(output);

  function url() {
    return 'URL';
  }

  input = '<a href="http://site.com/foo">bar</a>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyURLs: null })).toBe(input);
  expect(await minify(input, { minifyURLs: false })).toBe(input);
  output = '<a href="URL">bar</a>';
  expect(await minify(input, { minifyURLs: url })).toBe(output);

  input = '<style>\n.foo { background: url("http://site.com/foo") } </style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyURLs: null })).toBe(input);
  expect(await minify(input, { minifyURLs: false })).toBe(input);
  expect(await minify(input, { minifyURLs: url })).toBe(input);
  output = '<style>.foo{background:url("URL")}</style>';
  expect(await minify(input, { minifyCSS: true, minifyURLs: url })).toBe(output);
});

test('empty attributes', async () => {
  let input;

  input = '<p id="" class="" STYLE=" " title="\n" lang="" dir="">x</p>';
  expect(await minify(input, { removeEmptyAttributes: true })).toBe('<p>x</p>');

  input = '<p onclick=""   ondblclick=" " onmousedown="" ONMOUSEUP="" onmouseover=" " onmousemove="" onmouseout="" ' +
    'onkeypress=\n\n  "\n     " onkeydown=\n"" onkeyup\n="">x</p>';
  expect(await minify(input, { removeEmptyAttributes: true })).toBe('<p>x</p>');

  input = '<input onfocus="" onblur="" onchange=" " value=" boo ">';
  expect(await minify(input, { removeEmptyAttributes: true })).toBe('<input value=" boo ">');

  input = '<input value="" name="foo">';
  expect(await minify(input, { removeEmptyAttributes: true })).toBe('<input name="foo">');

  input = '<img src="" alt="">';
  expect(await minify(input, { removeEmptyAttributes: true })).toBe('<img src="" alt="">');

  // preserve unrecognized attribute
  // remove recognized attrs with unspecified values
  input = '<div data-foo class id style title lang dir onfocus onblur onchange onclick ondblclick onmousedown onmouseup onmouseover onmousemove onmouseout onkeypress onkeydown onkeyup></div>';
  expect(await minify(input, { removeEmptyAttributes: true })).toBe('<div data-foo></div>');

  // additional remove attributes
  input = '<img src="" alt="">';
  expect(await minify(input, { removeEmptyAttributes: function (attrName, tag) { return tag === 'img' && attrName === 'src'; } })).toBe('<img alt="">');
});

test('cleaning class/style attributes', async () => {
  let input, output;

  input = '<p class=" foo bar  ">foo bar baz</p>';
  expect(await minify(input)).toBe('<p class="foo bar">foo bar baz</p>');

  input = '<p class=" foo      ">foo bar baz</p>';
  expect(await minify(input)).toBe('<p class="foo">foo bar baz</p>');
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<p class=foo>foo bar baz</p>');

  input = '<p class="\n  \n foo   \n\n\t  \t\n   ">foo bar baz</p>';
  output = '<p class="foo">foo bar baz</p>';
  expect(await minify(input)).toBe(output);

  input = '<p class="\n  \n foo   \n\n\t  \t\n  class1 class-23 ">foo bar baz</p>';
  output = '<p class="foo class1 class-23">foo bar baz</p>';
  expect(await minify(input)).toBe(output);

  input = '<p style="    color: red; background-color: rgb(100, 75, 200);  "></p>';
  output = '<p style="color: red; background-color: rgb(100, 75, 200);"></p>';
  expect(await minify(input)).toBe(output);

  input = '<p style="font-weight: bold  ; "></p>';
  output = '<p style="font-weight: bold;"></p>';
  expect(await minify(input)).toBe(output);
});

test('cleaning URI-based attributes', async () => {
  let input, output;

  input = '<a href="   http://example.com  ">x</a>';
  output = '<a href="http://example.com">x</a>';
  expect(await minify(input)).toBe(output);

  input = '<a href="  \t\t  \n \t  ">x</a>';
  output = '<a href="">x</a>';
  expect(await minify(input)).toBe(output);

  input = '<img src="   http://example.com  " title="bleh   " longdesc="  http://example.com/longdesc \n\n   \t ">';
  output = '<img src="http://example.com" title="bleh   " longdesc="http://example.com/longdesc">';
  expect(await minify(input)).toBe(output);

  input = '<img src="" usemap="   http://example.com  ">';
  output = '<img src="" usemap="http://example.com">';
  expect(await minify(input)).toBe(output);

  input = '<form action="  somePath/someSubPath/someAction?foo=bar&baz=qux     "></form>';
  output = '<form action="somePath/someSubPath/someAction?foo=bar&baz=qux"></form>';
  expect(await minify(input)).toBe(output);

  input = '<BLOCKQUOTE cite=" \n\n\n http://www.mycom.com/tolkien/twotowers.html     "><P>foobar</P></BLOCKQUOTE>';
  output = '<blockquote cite="http://www.mycom.com/tolkien/twotowers.html"><p>foobar</p></blockquote>';
  expect(await minify(input)).toBe(output);

  input = '<head profile="       http://gmpg.org/xfn/11    "></head>';
  output = '<head profile="http://gmpg.org/xfn/11"></head>';
  expect(await minify(input)).toBe(output);

  input = '<object codebase="   http://example.com  "></object>';
  output = '<object codebase="http://example.com"></object>';
  expect(await minify(input)).toBe(output);

  input = '<span profile="   1, 2, 3  ">foo</span>';
  expect(await minify(input)).toBe(input);

  input = '<div action="  foo-bar-baz ">blah</div>';
  expect(await minify(input)).toBe(input);
});

test('cleaning Number-based attributes', async () => {
  let input, output;

  input = '<a href="#" tabindex="   1  ">x</a><button tabindex="   2  ">y</button>';
  output = '<a href="#" tabindex="1">x</a><button tabindex="2">y</button>';
  expect(await minify(input)).toBe(output);

  input = '<input value="" maxlength="     5 ">';
  output = '<input value="" maxlength="5">';
  expect(await minify(input)).toBe(output);

  input = '<select size="  10   \t\t "><option>x</option></select>';
  output = '<select size="10"><option>x</option></select>';
  expect(await minify(input)).toBe(output);

  input = '<textarea rows="   20  " cols="  30      "></textarea>';
  output = '<textarea rows="20" cols="30"></textarea>';
  expect(await minify(input)).toBe(output);

  input = '<COLGROUP span="   40  "><COL span="  39 "></COLGROUP>';
  output = '<colgroup span="40"><col span="39"></colgroup>';
  expect(await minify(input)).toBe(output);

  input = '<tr><td colspan="    2   ">x</td><td rowspan="   3 "></td></tr>';
  output = '<tr><td colspan="2">x</td><td rowspan="3"></td></tr>';
  expect(await minify(input)).toBe(output);
});

test('cleaning other attributes', async () => {
  let input, output;

  input = '<a href="#" onclick="  window.prompt(\'boo\'); " onmouseover=" \n\n alert(123)  \t \n\t  ">blah</a>';
  output = '<a href="#" onclick="window.prompt(\'boo\');" onmouseover="alert(123)">blah</a>';
  expect(await minify(input)).toBe(output);

  input = '<body onload="  foo();   bar() ;  "><p>x</body>';
  output = '<body onload="foo();   bar() ;"><p>x</p></body>';
  expect(await minify(input)).toBe(output);
});

test('removing redundant attributes (&lt;form method="get" ...>)', async () => {
  let input;

  input = '<form method="get">hello world</form>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<form>hello world</form>');

  input = '<form method="post">hello world</form>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<form method="post">hello world</form>');
});

test('removing redundant attributes (&lt;input type="text" ...>)', async () => {
  let input;

  input = '<input type="text">';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<input>');

  input = '<input type="  TEXT  " value="foo">';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<input value="foo">');

  input = '<input type="checkbox">';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<input type="checkbox">');
});

test('removing redundant attributes (&lt;a name="..." id="..." ...>)', async () => {
  let input;

  input = '<a id="foo" name="foo">blah</a>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<a id="foo">blah</a>');

  input = '<input id="foo" name="foo">';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe(input);

  input = '<a name="foo">blah</a>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe(input);

  input = '<a href="..." name="  bar  " id="bar" >blah</a>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<a href="..." id="bar">blah</a>');
});

test('removing redundant attributes (&lt;script src="..." charset="...">)', async () => {
  let input, output;

  input = '<script type="text/javascript" charset="UTF-8">alert(222);</script>';
  output = '<script type="text/javascript">alert(222);</script>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe(output);

  input = '<script type="text/javascript" src="http://example.com" charset="UTF-8">alert(222);</script>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe(input);

  input = '<script CHARSET=" ... ">alert(222);</script>';
  output = '<script>alert(222);</script>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe(output);
});

test('removing redundant attributes (&lt;... language="javascript" ...>)', async () => {
  let input;

  input = '<script language="Javascript">x=2,y=4</script>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<script>x=2,y=4</script>');

  input = '<script LANGUAGE = "  javaScript  ">x=2,y=4</script>';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe('<script>x=2,y=4</script>');
});

test('removing redundant attributes (&lt;area shape="rect" ...>)', async () => {
  const input = '<area shape="rect" coords="696,25,958,47" href="#" title="foo">';
  const output = '<area coords="696,25,958,47" href="#" title="foo">';
  expect(await minify(input, { removeRedundantAttributes: true })).toBe(output);
});

test('removing redundant attributes (&lt;... = "javascript: ..." ...>)', async () => {
  let input;

  input = '<p onclick="javascript:alert(1)">x</p>';
  expect(await minify(input)).toBe('<p onclick="alert(1)">x</p>');

  input = '<p onclick="javascript:x">x</p>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<p onclick=x>x</p>');

  input = '<p onclick=" JavaScript: x">x</p>';
  expect(await minify(input)).toBe('<p onclick="x">x</p>');

  input = '<p title="javascript:(function() { /* some stuff here */ })()">x</p>';
  expect(await minify(input)).toBe(input);
});

test('removing javascript type attributes', async () => {
  let input, output;

  input = '<script type="">alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: false })).toBe(input);
  output = '<script>alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: true })).toBe(output);

  input = '<script type="modules">alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: false })).toBe(input);
  output = '<script type="modules">alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: true })).toBe(output);

  input = '<script type="text/javascript">alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: false })).toBe(input);
  output = '<script>alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: true })).toBe(output);

  input = '<SCRIPT TYPE="  text/javascript ">alert(1)</script>';
  output = '<script>alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: true })).toBe(output);

  input = '<script type="application/javascript;version=1.8">alert(1)</script>';
  output = '<script>alert(1)</script>';
  expect(await minify(input, { removeScriptTypeAttributes: true })).toBe(output);

  input = '<script type="text/vbscript">MsgBox("foo bar")</script>';
  output = '<script type="text/vbscript">MsgBox("foo bar")</script>';
  expect(await minify(input, { removeScriptTypeAttributes: true })).toBe(output);
});

test('removing type="text/css" attributes', async () => {
  let input, output;

  input = '<style type="">.foo { color: red }</style>';
  expect(await minify(input, { removeStyleLinkTypeAttributes: false })).toBe(input);
  output = '<style>.foo { color: red }</style>';
  expect(await minify(input, { removeStyleLinkTypeAttributes: true })).toBe(output);

  input = '<style type="text/css">.foo { color: red }</style>';
  expect(await minify(input, { removeStyleLinkTypeAttributes: false })).toBe(input);
  output = '<style>.foo { color: red }</style>';
  expect(await minify(input, { removeStyleLinkTypeAttributes: true })).toBe(output);

  input = '<STYLE TYPE = "  text/CSS ">body { font-size: 1.75em }</style>';
  output = '<style>body { font-size: 1.75em }</style>';
  expect(await minify(input, { removeStyleLinkTypeAttributes: true })).toBe(output);

  input = '<style type="text/plain">.foo { background: green }</style>';
  expect(await minify(input, { removeStyleLinkTypeAttributes: true })).toBe(input);

  input = '<link rel="stylesheet" type="text/css" href="http://example.com">';
  output = '<link rel="stylesheet" href="http://example.com">';
  expect(await minify(input, { removeStyleLinkTypeAttributes: true })).toBe(output);

  input = '<link rel="alternate" type="application/atom+xml" href="data.xml">';
  expect(await minify(input, { removeStyleLinkTypeAttributes: true })).toBe(input);
});

test('removing attribute quotes', async () => {
  let input;

  input = '<p title="blah" class="a23B-foo.bar_baz:qux" id="moo">foo</p>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<p title=blah class=a23B-foo.bar_baz:qux id=moo>foo</p>');

  input = '<input value="hello world">';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<input value="hello world">');

  input = '<script type="module">alert(1);</script>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<script type=module>alert(1);</script>');

  input = '<a href="#" title="foo#bar">x</a>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<a href=# title=foo#bar>x</a>');

  input = '<a href="http://example.com/" title="blah">\nfoo\n\n</a>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<a href=http://example.com/ title=blah>\nfoo\n\n</a>');

  input = '<a title="blah" href="http://example.com/">\nfoo\n\n</a>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<a title=blah href=http://example.com/ >\nfoo\n\n</a>');

  input = '<a href="http://example.com/" title="">\nfoo\n\n</a>';
  expect(await minify(input, { removeAttributeQuotes: true, removeEmptyAttributes: true })).toBe('<a href=http://example.com/ >\nfoo\n\n</a>');

  input = '<p class=foo|bar:baz></p>';
  expect(await minify(input, { removeAttributeQuotes: true })).toBe('<p class=foo|bar:baz></p>');
});

test('preserving custom attribute-wrapping markup', async () => {
  let input, customAttrOptions;

  // With a single rule
  customAttrOptions = {
    customAttrSurround: [[/\{\{#if\s+\w+\}\}/, /\{\{\/if\}\}/]]
  };

  input = '<input {{#if value}}checked="checked"{{/if}}>';
  expect(await minify(input, customAttrOptions)).toBe(input);

  input = '<input checked="checked">';
  expect(await minify(input, customAttrOptions)).toBe(input);

  // With multiple rules
  customAttrOptions = {
    customAttrSurround: [
      [/\{\{#if\s+\w+\}\}/, /\{\{\/if\}\}/],
      [/\{\{#unless\s+\w+\}\}/, /\{\{\/unless\}\}/]
    ]
  };

  input = '<input {{#if value}}checked="checked"{{/if}}>';
  expect(await minify(input, customAttrOptions)).toBe(input);

  input = '<input {{#unless value}}checked="checked"{{/unless}}>';
  expect(await minify(input, customAttrOptions)).toBe(input);

  input = '<input {{#if value1}}data-attr="example" {{/if}}{{#unless value2}}checked="checked"{{/unless}}>';
  expect(await minify(input, customAttrOptions)).toBe(input);

  input = '<input checked="checked">';
  expect(await minify(input, customAttrOptions)).toBe(input);

  // With multiple rules and richer options
  customAttrOptions = {
    customAttrSurround: [
      [/\{\{#if\s+\w+\}\}/, /\{\{\/if\}\}/],
      [/\{\{#unless\s+\w+\}\}/, /\{\{\/unless\}\}/]
    ],
    collapseBooleanAttributes: true,
    removeAttributeQuotes: true
  };

  input = '<input {{#if value}}checked="checked"{{/if}}>';
  expect(await minify(input, customAttrOptions)).toBe('<input {{#if value}}checked{{/if}}>');

  input = '<input {{#if value1}}checked="checked"{{/if}} {{#if value2}}data-attr="foo"{{/if}}/>';
  expect(await minify(input, customAttrOptions)).toBe('<input {{#if value1}}checked {{/if}}{{#if value2}}data-attr=foo{{/if}}>');

  customAttrOptions.keepClosingSlash = true;
  expect(await minify(input, customAttrOptions)).toBe('<input {{#if value1}}checked {{/if}}{{#if value2}}data-attr=foo {{/if}}/>');
});

test('preserving custom attribute-joining markup', async () => {
  let input;
  const polymerConditionalAttributeJoin = /\?=/;
  const customAttrOptions = {
    customAttrAssign: [polymerConditionalAttributeJoin]
  };
  input = '<div flex?="{{mode != cover}}"></div>';
  expect(await minify(input, customAttrOptions)).toBe(input);
  input = '<div flex?="{{mode != cover}}" class="foo"></div>';
  expect(await minify(input, customAttrOptions)).toBe(input);
});

test('collapsing whitespace', async () => {
  let input, output;

  input = '<script type="text/javascript">  \n\t   alert(1) \n\n\n  \t </script>';
  output = '<script type="text/javascript">alert(1)</script>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<p>foo</p>    <p> bar</p>\n\n   \n\t\t  <div title="quz">baz  </div>';
  output = '<p>foo</p><p>bar</p><div title="quz">baz</div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<p> foo    bar</p>';
  output = '<p>foo bar</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<p>foo\nbar</p>';
  output = '<p>foo bar</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<p> foo    <span>  blah     <i>   22</i>    </span> bar <img src=""></p>';
  output = '<p>foo <span>blah <i>22</i> </span>bar <img src=""></p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<textarea> foo bar     baz \n\n   x \t    y </textarea>';
  output = '<textarea> foo bar     baz \n\n   x \t    y </textarea>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<div><textarea></textarea>    </div>';
  output = '<div><textarea></textarea></div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<div><pRe> $foo = "baz"; </pRe>    </div>';
  output = '<div><pre> $foo = "baz"; </pre></div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  output = '<div><pRe>$foo = "baz";</pRe></div>';
  expect(await minify(input, { collapseWhitespace: true, caseSensitive: true })).toBe(output);

  input = '<script type="text/javascript">var = "hello";</script>\r\n\r\n\r\n' +
    '<style type="text/css">#foo { color: red;        }          </style>\r\n\r\n\r\n' +
    '<div>\r\n  <div>\r\n    <div><!-- hello -->\r\n      <div>' +
    '<!--! hello -->\r\n        <div>\r\n          <div class="">\r\n\r\n            ' +
    '<textarea disabled="disabled">     this is a textarea </textarea>\r\n          ' +
    '</div>\r\n        </div>\r\n      </div>\r\n    </div>\r\n  </div>\r\n</div>' +
    '<pre>       \r\nxxxx</pre><span>x</span> <span>Hello</span> <b>billy</b>     \r\n' +
    '<input type="text">\r\n<textarea></textarea>\r\n<pre></pre>';
  output = '<script type="text/javascript">var = "hello";</script>' +
    '<style type="text/css">#foo { color: red;        }</style>' +
    '<div><div><div>' +
    '<!-- hello --><div><!--! hello --><div><div class="">' +
    '<textarea disabled="disabled">     this is a textarea </textarea>' +
    '</div></div></div></div></div></div>' +
    '<pre>       \r\nxxxx</pre><span>x</span> <span>Hello</span> <b>billy</b> ' +
    '<input type="text"> <textarea></textarea><pre></pre>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<pre title="some title...">   hello     world </pre>';
  output = '<pre title="some title...">   hello     world </pre>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<pre title="some title..."><code>   hello     world </code></pre>';
  output = '<pre title="some title..."><code>   hello     world </code></pre>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<script>alert("foo     bar")    </script>';
  output = '<script>alert("foo     bar")</script>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<style>alert("foo     bar")    </style>';
  output = '<style>alert("foo     bar")</style>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
});

test('removing empty elements', async () => {
  let input, output;

  expect(await minify('<p>x</p>', { removeEmptyElements: true })).toBe('<p>x</p>');
  expect(await minify('<p></p>', { removeEmptyElements: true })).toBe('');

  input = '<p>foo<span>bar</span><span></span></p>';
  output = '<p>foo<span>bar</span></p>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<a href="http://example/com" title="hello world"></a>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<iframe></iframe>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<iframe src="page.html"></iframe>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<iframe srcdoc="<h1>Foo</h1>"></iframe>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<video></video>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<video src="preview.ogg"></video>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<audio autoplay></audio>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<audio src="startup.mp3" autoplay></audio>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<object type="application/x-shockwave-flash"></object>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<object data="game.swf" type="application/x-shockwave-flash"></object>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<applet archive="game.zip" width="250" height="150"></applet>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<applet code="game.class" archive="game.zip" width="250" height="150"></applet>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<textarea cols="10" rows="10"></textarea>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<div>hello<span>world</span></div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<p>x<span title="<" class="blah-moo"></span></p>';
  output = '<p>x</p>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<div>x<div>y <div>blah</div><div></div>foo</div>z</div>';
  output = '<div>x<div>y <div>blah</div>foo</div>z</div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<img src="">';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);

  input = '<p><!-- x --></p>';
  output = '';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);

  input = '<script src="foo.js"></script>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);
  input = '<script></script>';
  expect(await minify(input, { removeEmptyElements: true })).toBe('');

  input = '<div>after<span></span> </div>';
  output = '<div>after </div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);
  output = '<div>after</div>';
  expect(await minify(input, { collapseWhitespace: true, removeEmptyElements: true })).toBe(output);

  input = '<div>before <span></span></div>';
  output = '<div>before </div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);
  output = '<div>before</div>';
  expect(await minify(input, { collapseWhitespace: true, removeEmptyElements: true })).toBe(output);

  input = '<div>both <span></span> </div>';
  output = '<div>both  </div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);
  output = '<div>both</div>';
  expect(await minify(input, { collapseWhitespace: true, removeEmptyElements: true })).toBe(output);

  input = '<div>unary <span></span><link></div>';
  output = '<div>unary <link></div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(output);
  output = '<div>unary<link></div>';
  expect(await minify(input, { collapseWhitespace: true, removeEmptyElements: true })).toBe(output);

  input = '<div>Empty <!-- NOT --> </div>';
  expect(await minify(input, { removeEmptyElements: true })).toBe(input);
  output = '<div>Empty<!-- NOT --></div>';
  expect(await minify(input, { collapseWhitespace: true, removeEmptyElements: true })).toBe(output);
});

test('collapsing boolean attributes', async () => {
  let input, output;

  input = '<input disabled="disabled">';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe('<input disabled>');

  input = '<input CHECKED = "checked" readonly="readonly">';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe('<input checked readonly>');

  input = '<option name="blah" selected="selected">moo</option>';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe('<option name="blah" selected>moo</option>');

  input = '<input autofocus="autofocus">';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe('<input autofocus>');

  input = '<input required="required">';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe('<input required>');

  input = '<input multiple="multiple">';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe('<input multiple>');

  input = '<div Allowfullscreen=foo Async=foo Autofocus=foo Autoplay=foo Checked=foo Compact=foo Controls=foo ' +
    'Declare=foo Default=foo Defaultchecked=foo Defaultmuted=foo Defaultselected=foo Defer=foo Disabled=foo ' +
    'Enabled=foo Formnovalidate=foo Hidden=foo Indeterminate=foo Inert=foo Ismap=foo Itemscope=foo ' +
    'Loop=foo Multiple=foo Muted=foo Nohref=foo Noresize=foo Noshade=foo Novalidate=foo Nowrap=foo Open=foo ' +
    'Pauseonexit=foo Readonly=foo Required=foo Reversed=foo Scoped=foo Seamless=foo Selected=foo Sortable=foo ' +
    'Truespeed=foo Typemustmatch=foo Visible=foo></div>';
  output = '<div allowfullscreen async autofocus autoplay checked compact controls declare default defaultchecked ' +
    'defaultmuted defaultselected defer disabled enabled formnovalidate hidden indeterminate inert ' +
    'ismap itemscope loop multiple muted nohref noresize noshade novalidate nowrap open pauseonexit readonly ' +
    'required reversed scoped seamless selected sortable truespeed typemustmatch visible></div>';
  expect(await minify(input, { collapseBooleanAttributes: true })).toBe(output);
  output = '<div Allowfullscreen Async Autofocus Autoplay Checked Compact Controls Declare Default Defaultchecked ' +
    'Defaultmuted Defaultselected Defer Disabled Enabled Formnovalidate Hidden Indeterminate Inert ' +
    'Ismap Itemscope Loop Multiple Muted Nohref Noresize Noshade Novalidate Nowrap Open Pauseonexit Readonly ' +
    'Required Reversed Scoped Seamless Selected Sortable Truespeed Typemustmatch Visible></div>';
  expect(await minify(input, { collapseBooleanAttributes: true, caseSensitive: true })).toBe(output);
});

test('collapsing enumerated attributes', async () => {
  expect(await minify('<div draggable="auto"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
  expect(await minify('<div draggable="true"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable="true"></div>');
  expect(await minify('<div draggable="false"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable="false"></div>');
  expect(await minify('<div draggable="foo"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
  expect(await minify('<div draggable></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
  expect(await minify('<div Draggable="auto"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
  expect(await minify('<div Draggable="true"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable="true"></div>');
  expect(await minify('<div Draggable="false"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable="false"></div>');
  expect(await minify('<div Draggable="foo"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
  expect(await minify('<div Draggable></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
  expect(await minify('<div draggable="Auto"></div>', { collapseBooleanAttributes: true })).toBe('<div draggable></div>');
});

test('keeping trailing slashes in tags', async () => {
  expect(await minify('<img src="test"/>', { keepClosingSlash: true })).toBe('<img src="test"/>');
  // https://github.com/kangax/html-minifier/issues/233
  expect(await minify('<img src="test"/>', { keepClosingSlash: true, removeAttributeQuotes: true })).toBe('<img src=test />');
  expect(await minify('<img src="test" id=""/>', { keepClosingSlash: true, removeAttributeQuotes: true, removeEmptyAttributes: true })).toBe('<img src=test />');
  expect(await minify('<img title="foo" src="test"/>', { keepClosingSlash: true, removeAttributeQuotes: true })).toBe('<img title=foo src=test />');
});

test('removing optional tags', async () => {
  let input, output;

  input = '<p>foo';
  expect(await minify(input, { removeOptionalTags: true })).toBe(input);

  input = '</p>';
  output = '<p>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  input = '<body></body>';
  output = '';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  expect(await minify(input, { removeOptionalTags: true, removeEmptyElements: true })).toBe(output);

  input = '<html><head></head><body></body></html>';
  output = '';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  expect(await minify(input, { removeOptionalTags: true, removeEmptyElements: true })).toBe(output);

  input = ' <html></html>';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html> </html>';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html></html> ';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = ' <html><body></body></html>';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html> <body></body></html>';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html><body> </body></html>';
  output = '<body> ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html><body></body> </html>';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html><body></body></html> ';
  output = ' ';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<html><head><title>hello</title></head><body><p>foo<span>bar</span></p></body></html>';
  expect(await minify(input)).toBe(input);
  output = '<title>hello</title><p>foo<span>bar</span>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  input = '<html lang=""><head><title>hello</title></head><body style=""><p>foo<span>bar</span></p></body></html>';
  output = '<html lang=""><title>hello</title><body style=""><p>foo<span>bar</span>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  output = '<title>hello</title><p>foo<span>bar</span>';
  expect(await minify(input, { removeOptionalTags: true, removeEmptyAttributes: true })).toBe(output);

  input = '<html><head><title>a</title><link href="b.css" rel="stylesheet"/></head><body><a href="c.html"></a><div class="d"><input value="e"/></div></body></html>';
  output = '<title>a</title><link href="b.css" rel="stylesheet"><a href="c.html"></a><div class="d"><input value="e"></div>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  input = '<!DOCTYPE html><html><head><title>Blah</title></head><body><div><p>This is some text in a div</p><details>Followed by some details</details></div><div><p>This is some more text in a div</p></div></body></html>';
  output = '<!DOCTYPE html><title>Blah</title><div><p>This is some text in a div<details>Followed by some details</details></div><div><p>This is some more text in a div</div>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  input = '<!DOCTYPE html><html><head><title>Blah</title></head><body><noscript><p>This is some text in a noscript</p><details>Followed by some details</details></noscript><noscript><p>This is some more text in a noscript</p></noscript></body></html>';
  output = '<!DOCTYPE html><title>Blah</title><body><noscript><p>This is some text in a noscript<details>Followed by some details</details></noscript><noscript><p>This is some more text in a noscript</p></noscript>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  input = '<md-list-item ui-sref=".app-config"><md-icon md-font-icon="mdi-settings"></md-icon><p translate>Configure</p></md-list-item>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(input);
});

test('removing optional tags in tables', async () => {
  let input, output;

  input = '<table>' +
    '<thead><tr><th>foo</th><th>bar</th> <th>baz</th></tr></thead> ' +
    '<tbody><tr><td>boo</td><td>moo</td><td>loo</td></tr> </tbody>' +
    '<tfoot><tr><th>baz</th> <th>qux</th><td>boo</td></tr></tfoot>' +
    '</table>';
  expect(await minify(input)).toBe(input);

  output = '<table>' +
    '<thead><tr><th>foo<th>bar</th> <th>baz</thead> ' +
    '<tr><td>boo<td>moo<td>loo</tr> ' +
    '<tfoot><tr><th>baz</th> <th>qux<td>boo' +
    '</table>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  output = '<table>' +
    '<thead><tr><th>foo<th>bar<th>baz' +
    '<tbody><tr><td>boo<td>moo<td>loo' +
    '<tfoot><tr><th>baz<th>qux<td>boo' +
    '</table>';
  expect(await minify(input, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);
  expect(await minify(output, { collapseWhitespace: true, removeOptionalTags: true })).toBe(output);

  input = '<table>' +
    '<caption>foo</caption>' +
    '<!-- blah -->' +
    '<colgroup><col span="2"><col></colgroup>' +
    '<!-- blah -->' +
    '<tbody><tr><th>bar</th><td>baz</td><th>qux</th></tr></tbody>' +
    '</table>';
  expect(await minify(input)).toBe(input);

  output = '<table>' +
    '<caption>foo</caption>' +
    '<!-- blah -->' +
    '<col span="2"><col></colgroup>' +
    '<!-- blah -->' +
    '<tr><th>bar<td>baz<th>qux' +
    '</table>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
  expect(await minify(output, { removeOptionalTags: true })).toBe(output);

  output = '<table>' +
    '<caption>foo' +
    '<col span="2"><col>' +
    '<tr><th>bar<td>baz<th>qux' +
    '</table>';
  expect(await minify(input, { removeComments: true, removeOptionalTags: true })).toBe(output);

  input = '<table>' +
    '<tbody></tbody>' +
    '</table>';
  expect(await minify(input)).toBe(input);

  output = '<table><tbody></table>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
});

test('removing optional tags in options', async () => {
  let input, output;

  input = '<select><option>foo</option><option>bar</option></select>';
  output = '<select><option>foo<option>bar</select>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(output);

  input = '<select>\n' +
    '  <option>foo</option>\n' +
    '  <option>bar</option>\n' +
    '</select>';
  expect(await minify(input, { removeOptionalTags: true })).toBe(input);
  output = '<select><option>foo<option>bar</select>';
  expect(await minify(input, { removeOptionalTags: true, collapseWhitespace: true })).toBe(output);
  output = '<select> <option>foo</option> <option>bar</option> </select>';
  expect(await minify(input, { removeOptionalTags: true, collapseWhitespace: true, conservativeCollapse: true })).toBe(output);

  // example from htmldog.com
  input = '<select name="catsndogs">' +
    '<optgroup label="Cats">' +
    '<option>Tiger</option><option>Leopard</option><option>Lynx</option>' +
    '</optgroup>' +
    '<optgroup label="Dogs">' +
    '<option>Grey Wolf</option><option>Red Fox</option><option>Fennec</option>' +
    '</optgroup>' +
    '</select>';

  output = '<select name="catsndogs">' +
    '<optgroup label="Cats">' +
    '<option>Tiger<option>Leopard<option>Lynx' +
    '<optgroup label="Dogs">' +
    '<option>Grey Wolf<option>Red Fox<option>Fennec' +
    '</select>';

  expect(await minify(input, { removeOptionalTags: true })).toBe(output);
});

test('custom components', async () => {
  const input = '<custom-component>Oh, my.</custom-component>';
  const output = '<custom-component>Oh, my.</custom-component>';
  expect(await minify(input)).toBe(output);
});

test('HTML4: anchor with inline elements', async () => {
  const input = '<a href="#"><span>Well, look at me! I\'m a span!</span></a>';
  expect(await minify(input, { html5: false })).toBe(input);
});

test('HTML5: anchor with inline elements', async () => {
  const input = '<a href="#"><span>Well, look at me! I\'m a span!</span></a>';
  expect(await minify(input, { html5: true })).toBe(input);
});

test('HTML4: anchor with block elements', async () => {
  const input = '<a href="#"><div>Well, look at me! I\'m a div!</div></a>';
  const output = '<a href="#"></a><div>Well, look at me! I\'m a div!</div>';
  expect(await minify(input, { html5: false })).toBe(output);
});

test('HTML5: anchor with block elements', async () => {
  const input = '<a href="#"><div>Well, look at me! I\'m a div!</div></a>';
  const output = '<a href="#"><div>Well, look at me! I\'m a div!</div></a>';
  expect(await minify(input, { html5: true })).toBe(output);
});

test('HTML5: enabled by default', async () => {
  const input = '<a href="#"><div>Well, look at me! I\'m a div!</div></a>';
  expect(await minify(input, { html5: true })).toBe(await minify(input));
});

test('phrasing content', async () => {
  let input, output;

  input = '<p>a<div>b</div>';
  output = '<p>a</p><div>b</div>';
  expect(await minify(input, { html5: true })).toBe(output);
  output = '<p>a<div>b</div></p>';
  expect(await minify(input, { html5: false })).toBe(output);

  input = '<label>a<div>b</div>c</label>';
  expect(await minify(input, { html5: true })).toBe(input);
});

// https://github.com/kangax/html-minifier/issues/888
test('ul/ol should be phrasing content', async () => {
  let input, output;

  input = '<p>a<ul><li>item</li></ul>';
  output = '<p>a</p><ul><li>item</li></ul>';
  expect(await minify(input, { html5: true })).toBe(output);

  output = '<p>a<ul><li>item</ul>';
  expect(await minify(input, { html5: true, removeOptionalTags: true })).toBe(output);

  output = '<p>a<ul><li>item</li></ul></p>';
  expect(await minify(input, { html5: false })).toBe(output);

  input = '<p>a<ol><li>item</li></ol></p>';
  output = '<p>a</p><ol><li>item</li></ol><p></p>';
  expect(await minify(input, { html5: true })).toBe(output);

  output = '<p>a<ol><li>item</ol><p>';
  expect(await minify(input, { html5: true, removeOptionalTags: true })).toBe(output);

  output = '<p>a</p><ol><li>item</li></ol>';
  expect(await minify(input, { html5: true, removeEmptyElements: true })).toBe(output);
});

test('phrasing content with Web Components', async () => {
  const input = '<span><phrasing-element></phrasing-element></span>';
  const output = '<span><phrasing-element></phrasing-element></span>';
  expect(await minify(input, { html5: true })).toBe(output);
});

// https://github.com/kangax/html-minifier/issues/10
test('Ignore custom fragments', async () => {
  let input, output;
  const reFragments = [/<\?[^?]+\?>/, /<%[^%]+%>/, /\{\{[^}]*\}\}/];

  input = 'This is the start. <% ... %>\r\n<%= ... %>\r\n<? ... ?>\r\n<!-- This is the middle, and a comment. -->\r\nNo comment, but middle.\r\n{{ ... }}\r\n<?php ... ?>\r\n<?xml ... ?>\r\nHello, this is the end!';
  output = 'This is the start. <% ... %> <%= ... %> <? ... ?> No comment, but middle. {{ ... }} <?php ... ?> <?xml ... ?> Hello, this is the end!';
  expect(await minify(input, {})).toBe(input);
  expect(await minify(input, { removeComments: true, collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    ignoreCustomFragments: reFragments
  })).toBe(output);

  output = 'This is the start. <% ... %>\n<%= ... %>\n<? ... ?>\nNo comment, but middle. {{ ... }}\n<?php ... ?>\n<?xml ... ?>\nHello, this is the end!';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);

  output = 'This is the start. <% ... %>\n<%= ... %>\n<? ... ?>\nNo comment, but middle.\n{{ ... }}\n<?php ... ?>\n<?xml ... ?>\nHello, this is the end!';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    preserveLineBreaks: true,
    ignoreCustomFragments: reFragments
  })).toBe(output);

  input = '{{ if foo? }}\r\n  <div class="bar">\r\n    ...\r\n  </div>\r\n{{ end \n}}';
  output = '{{ if foo? }}<div class="bar">...</div>{{ end }}';
  expect(await minify(input, {})).toBe(input);
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, { collapseWhitespace: true, ignoreCustomFragments: [] })).toBe(output);

  output = '{{ if foo? }} <div class="bar">...</div> {{ end \n}}';
  expect(await minify(input, { collapseWhitespace: true, ignoreCustomFragments: reFragments })).toBe(output);

  output = '{{ if foo? }}\n<div class="bar">\n...\n</div>\n{{ end \n}}';
  expect(await minify(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true,
    ignoreCustomFragments: reFragments
  })).toBe(output);

  input = '<a class="<% if foo? %>bar<% end %> {{ ... }}"></a>';
  expect(await minify(input, {})).toBe(input);
  expect(await minify(input, { ignoreCustomFragments: reFragments })).toBe(input);

  input = '<img src="{% static "images/logo.png" %}">';
  output = '<img src="{% static "images/logo.png" %}">';
  expect(await minify(input, { ignoreCustomFragments: [/\{%[^%]*?%\}/g] })).toBe(output);

  input = '<p{% if form.name.errors %}class=\'error\'{% endif %}>' +
    '{{ form.name.label_tag }}' +
    '{{ form.name }}' +
    ' <label>{{ label }}</label> ' +
    '{% if form.name.errors %}' +
    '{% for error in form.name.errors %}' +
    '<span class=\'error_msg\' style=\'color:#ff0000\'>{{ error }}</span>' +
    '{% endfor %}' +
    '{% endif %}' +
    '</p>';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /\{%[\s\S]*?%\}/g,
      /\{\{[\s\S]*?\}\}/g
    ],
    quoteCharacter: '\''
  })).toBe(input);
  output = '<p {% if form.name.errors %} class=\'error\' {% endif %}>' +
    '{{ form.name.label_tag }}' +
    '{{ form.name }}' +
    ' <label>{{ label }}</label> ' +
    '{% if form.name.errors %}' +
    '{% for error in form.name.errors %}' +
    '<span class=\'error_msg\' style=\'color:#ff0000\'>{{ error }}</span>' +
    '{% endfor %}' +
    '{% endif %}' +
    '</p>';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /\{%[\s\S]*?%\}/g,
      /\{\{[\s\S]*?\}\}/g
    ],
    quoteCharacter: '\'',
    collapseWhitespace: true
  })).toBe(output);

  input = '<a href="/legal.htm"<?php echo e(Request::path() == \'/\' ? \' rel="nofollow"\':\'\'); ?>>Legal Notices</a>';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /<\?php[\s\S]*?\?>/g
    ]
  })).toBe(input);

  input = '<input type="checkbox"<%= (model.isChecked ? \'checked="checked"\' : \'\') %>>';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /<%=[\s\S]*?%>/g
    ]
  })).toBe(input);

  input = '<div' +
    '{{IF text}}' +
    'data-yashareDescription="{{shorted(text, 300)}}"' +
    '{{END IF}}></div>';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /\{\{[\s\S]*?\}\}/g
    ],
    caseSensitive: true
  })).toBe(input);

  input = '<img class="{% foo %} {% bar %}">';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /\{%[^%]*?%\}/g
    ]
  })).toBe(input);
  // trimCustomFragments withOUT collapseWhitespace, does
  // not break the "{% foo %} {% bar %}" test
  expect(await minify(input, {
    ignoreCustomFragments: [
      /\{%[^%]*?%\}/g
    ],
    trimCustomFragments: true
  })).toBe(input);
  // trimCustomFragments WITH collapseWhitespace, changes output
  output = '<img class="{% foo %}{% bar %}">';
  expect(await minify(input, {
    ignoreCustomFragments: [
      /\{%[^%]*?%\}/g
    ],
    collapseWhitespace: true,
    trimCustomFragments: true
  })).toBe(output);

  input = '<img class="titi.<%=tsItem_[0]%>">';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(input);

  input = '<table id="<?php echo $this->escapeHtmlAttr($this->table_id); ?>"></table>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(input);

  input = '<!--{{comment}}-->{{if a}}<div>b</div>{{/if}}';
  expect(await minify(input)).toBe(input);
  output = '{{if a}}<div>b</div>{{/if}}';
  expect(await minify(input, {
    removeComments: true,
    ignoreCustomFragments: [
      /\{\{.*?\}\}/g
    ]
  })).toBe(output);

  // https://github.com/kangax/html-minifier/issues/722
  input = '<? echo "foo"; ?> <span>bar</span>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(input);
  output = '<? echo "foo"; ?><span>bar</span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    trimCustomFragments: true
  })).toBe(output);

  input = ' <? echo "foo"; ?> bar';
  expect(await minify(input)).toBe(input);
  output = '<? echo "foo"; ?> bar';
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(output);
  output = '<? echo "foo"; ?>bar';
  expect(await minify(input, {
    collapseWhitespace: true,
    trimCustomFragments: true
  })).toBe(output);

  input = '<span>foo</span> <? echo "bar"; ?> baz';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(input);
  output = '<span>foo</span><? echo "bar"; ?>baz';
  expect(await minify(input, {
    collapseWhitespace: true,
    trimCustomFragments: true
  })).toBe(output);

  input = '<span>foo</span> <? echo "bar"; ?> <? echo "baz"; ?> <span>foo</span>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(input);
  output = '<span>foo</span><? echo "bar"; ?><? echo "baz"; ?><span>foo</span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    trimCustomFragments: true
  })).toBe(output);

  input = 'foo <WC@bar> baz moo </WC@bar> loo';
  expect(await minify(input, {
    collapseWhitespace: true,
    ignoreCustomFragments: [
      /<(WC@[\s\S]*?)>(.*?)<\/\1>/
    ]
  })).toBe(input);
  output = 'foo<wc @bar>baz moo</wc>loo';
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(output);

  input = '<link href="<?php echo \'http://foo/\' ?>">';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { removeAttributeQuotes: true })).toBe(input);

  input = '<pre>\nfoo\n<? bar ?>\nbaz\n</pre>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { collapseWhitespace: true })).toBe(input);

  input = '<script>var value="<?php ?>+<?php ?>0"</script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<style>body{font-size:<%=1%>2pt}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);
});

test('bootstrap\'s span > button > span', async () => {
  const input = '<span class="input-group-btn">' +
    '\n  <button class="btn btn-default" type="button">' +
    '\n    <span class="glyphicon glyphicon-search"></span>' +
    '\n  </button>' +
    '</span>';
  const output = '<span class=input-group-btn><button class="btn btn-default" type=button><span class="glyphicon glyphicon-search"></span></button></span>';
  expect(await minify(input, { collapseWhitespace: true, removeAttributeQuotes: true })).toBe(output);
});

test('caseSensitive', async () => {
  const input = '<div mixedCaseAttribute="value"></div>';
  const caseSensitiveOutput = '<div mixedCaseAttribute="value"></div>';
  const caseInSensitiveOutput = '<div mixedcaseattribute="value"></div>';
  expect(await minify(input)).toBe(caseInSensitiveOutput);
  expect(await minify(input, { caseSensitive: true })).toBe(caseSensitiveOutput);
});

test('source & track', async () => {
  const input = '<audio controls="controls">' +
    '<source src="foo.wav">' +
    '<source src="far.wav">' +
    '<source src="foobar.wav">' +
    '<track kind="captions" src="sampleCaptions.vtt" srclang="en">' +
    '</audio>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { removeOptionalTags: true })).toBe(input);
});

test('mixed html and svg', async () => {
  const input = '<html><body>\n' +
    '  <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\n' +
    '     width="612px" height="502.174px" viewBox="0 65.326 612 502.174" enable-background="new 0 65.326 612 502.174"\n' +
    '     xml:space="preserve" class="logo">' +
    '' +
    '    <ellipse class="ground" cx="283.5" cy="487.5" rx="259" ry="80"/>' +
    '    <polygon points="100,10 40,198 190,78 10,78 160,198"\n' +
    '      style="fill:lime;stroke:purple;stroke-width:5;fill-rule:evenodd;" />\n' +
    '    <filter id="pictureFilter">\n' +
    '      <feGaussianBlur stdDeviation="15" />\n' +
    '    </filter>\n' +
    '  </svg>\n' +
    '</body></html>';
  const output = '<html><body>' +
    '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="612px" height="502.174px" viewBox="0 65.326 612 502.174" enable-background="new 0 65.326 612 502.174" xml:space="preserve" class="logo">' +
    '<ellipse class="ground" cx="283.5" cy="487.5" rx="259" ry="80"/>' +
    '<polygon points="100,10 40,198 190,78 10,78 160,198" style="fill:lime;stroke:purple;stroke-width:5;fill-rule:evenodd;"/>' +
    '<filter id="pictureFilter"><feGaussianBlur stdDeviation="15"/></filter>' +
    '</svg>' +
    '</body></html>';
  // Should preserve case-sensitivity and closing slashes within svg tags
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
});

test('nested quotes', async () => {
  const input = '<div data=\'{"test":"\\"test\\""}\'></div>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { quoteCharacter: '\'' })).toBe(input);

  const output = '<div data="{&#34;test&#34;:&#34;\\&#34;test\\&#34;&#34;}"></div>';
  expect(await minify(input, { quoteCharacter: '"' })).toBe(output);
});

test('script minification', async () => {
  let input, output;

  input = '<script></script>(function(){ var foo = 1; var bar = 2; alert(foo + " " + bar); })()';

  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script>(function(){ var foo = 1; var bar = 2; alert(foo + " " + bar); })()</script>';
  output = '<script>alert("1 2")</script>';

  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="text/JavaScript">(function(){ var foo = 1; var bar = 2; alert(foo + " " + bar); })()</script>';
  output = '<script type="text/JavaScript">alert("1 2")</script>';

  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="application/javascript;version=1.8">(function(){ var foo = 1; var bar = 2; alert(foo + " " + bar); })()</script>';
  output = '<script type="application/javascript;version=1.8">alert("1 2")</script>';

  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type=" application/javascript  ; charset=utf-8 ">(function(){ var foo = 1; var bar = 2; alert(foo + " " + bar); })()</script>';
  output = '<script type="application/javascript;charset=utf-8">alert("1 2")</script>';

  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({\'gtm.start\':new Date().getTime(),event:\'gtm.js\'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!=\'dataLayer\'?\'&l=\'+l:\'\';j.async=true;j.src=\'//www.googletagmanager.com/gtm.js?id=\'+i+dl;f.parentNode.insertBefore(j,f);})(window,document,\'script\',\'dataLayer\',\'GTM-67NT\');</script>';
  output = '<script>!function(w,d,s,l,i){w[l]=w[l]||[],w[l].push({"gtm.start":(new Date).getTime(),event:"gtm.js"});var f=d.getElementsByTagName(s)[0],j=d.createElement(s);j.async=!0,j.src="//www.googletagmanager.com/gtm.js?id=GTM-67NT",f.parentNode.insertBefore(j,f)}(window,document,"script","dataLayer")</script>';

  expect(await minify(input, { minifyJS: { mangle: false } })).toBe(output);

  input = '<script>\n' +
    '  <!--\n' +
    '    Platform.Mobile.Bootstrap.init(function () {\n' +
    '      Platform.Mobile.Core.Navigation.go("Login", {\n' +
    '        "error": ""\n' +
    '      });\n' +
    '    });\n' +
    '  //-->\n' +
    '</script>';
  output = '<script>Platform.Mobile.Bootstrap.init((function(){Platform.Mobile.Core.Navigation.go("Login",{error:""})}))</script>';

  expect(await minify(input, { minifyJS: true })).toBe(output);
});

test('minification of scripts with different mimetypes', async () => {
  let input, output;

  input = '<script type="">function f(){  return 1  }</script>';
  output = '<script type="">function f(){return 1}</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="text/javascript">function f(){  return 1  }</script>';
  output = '<script type="text/javascript">function f(){return 1}</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script foo="bar">function f(){  return 1  }</script>';
  output = '<script foo="bar">function f(){return 1}</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="text/ecmascript">function f(){  return 1  }</script>';
  output = '<script type="text/ecmascript">function f(){return 1}</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="application/javascript">function f(){  return 1  }</script>';
  output = '<script type="application/javascript">function f(){return 1}</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<script type="boo">function f(){  return 1  }</script>';
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<script type="text/html"><!-- ko if: true -->\n\n\n<div></div>\n\n\n<!-- /ko --></script>';
  expect(await minify(input, { minifyJS: true })).toBe(input);
});

test('minification of scripts with custom fragments', async () => {
  let input, output;

  input = '<script><?php ?></script>';
  expect(await minify(input, { minifyJS: true })).toBe(input);
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(input);

  input = '<script>\n<?php ?></script>';
  expect(await minify(input, { minifyJS: true })).toBe(input);
  output = '<script> <?php ?></script>';
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(input);

  input = '<script><?php ?>\n</script>';
  expect(await minify(input, { minifyJS: true })).toBe(input);
  output = '<script><?php ?> </script>';
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(input);

  input = '<script>\n<?php ?>\n</script>';
  expect(await minify(input, { minifyJS: true })).toBe(input);
  output = '<script> <?php ?> </script>';
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(input);

  input = '<script>// <% ... %></script>';
  output = '<script></script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = '<script>// \n<% ... %></script>';
  output = '<script> \n<% ... %></script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  output = '<script> <% ... %></script>';
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  output = '<script>\n<% ... %></script>';
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = '<script>// <% ... %>\n</script>';
  output = '<script></script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = '<script>// \n<% ... %>\n</script>';
  output = '<script> \n<% ... %>\n</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  output = '<script> <% ... %> </script>';
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
  output = '<script>\n<% ... %>\n</script>';
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyJS: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = '<script>function f(){  return <?php ?>  }</script>';
  output = '<script>function f(){return <?php ?>  }</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  output = '<script>function f(){return <?php ?> }</script>';
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);

  input = '<script>function f(){  return "<?php ?>"  }</script>';
  output = '<script>function f(){return"<?php ?>"}</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  expect(await minify(input, { collapseWhitespace: true, minifyJS: true })).toBe(output);
});

test('event minification', async () => {
  let input, output;

  input = '<div only="alert(a + b)" one=";return false;"></div>';
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<div onclick="alert(a + b)"></div>';
  output = '<div onclick="alert(a+b)"></div>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<a href="/" onclick="this.href = getUpdatedURL (this.href);return true;">test</a>';
  output = '<a href="/" onclick="return this.href=getUpdatedURL(this.href),!0">test</a>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<a onclick="try{ dcsMultiTrack(\'DCS.dcsuri\',\'USPS\',\'WT.ti\') }catch(e){}"> foobar</a>';
  output = '<a onclick=\'try{dcsMultiTrack("DCS.dcsuri","USPS","WT.ti")}catch(e){}\'> foobar</a>';
  expect(await minify(input, { minifyJS: { mangle: false } })).toBe(output);
  expect(await minify(input, { minifyJS: { mangle: false }, quoteCharacter: '\'' })).toBe(output);

  input = '<a onclick="try{ dcsMultiTrack(\'DCS.dcsuri\',\'USPS\',\'WT.ti\') }catch(e){}"> foobar</a>';
  output = '<a onclick="try{dcsMultiTrack(&#34;DCS.dcsuri&#34;,&#34;USPS&#34;,&#34;WT.ti&#34;)}catch(e){}"> foobar</a>';
  expect(await minify(input, { minifyJS: { mangle: false }, quoteCharacter: '"' })).toBe(output);

  input = '<a onClick="_gaq.push([\'_trackEvent\', \'FGF\', \'banner_click\']);"></a>';
  output = '<a onclick=\'_gaq.push(["_trackEvent","FGF","banner_click"])\'></a>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  expect(await minify(input, { minifyJS: true, quoteCharacter: '\'' })).toBe(output);

  input = '<a onClick="_gaq.push([\'_trackEvent\', \'FGF\', \'banner_click\']);"></a>';
  output = '<a onclick="_gaq.push([&#34;_trackEvent&#34;,&#34;FGF&#34;,&#34;banner_click&#34;])"></a>';
  expect(await minify(input, { minifyJS: true, quoteCharacter: '"' })).toBe(output);

  input = '<button type="button" onclick=";return false;" id="appbar-guide-button"></button>';
  output = '<button type="button" onclick="return!1" id="appbar-guide-button"></button>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<button type="button" onclick=";return false;" ng-click="a(1 + 2)" data-click="a(1 + 2)"></button>';
  output = '<button type="button" onclick="return!1" ng-click="a(1 + 2)" data-click="a(1 + 2)"></button>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
  expect(await minify(input, { minifyJS: true, customEventAttributes: [] })).toBe(input);
  output = '<button type="button" onclick=";return false;" ng-click="a(3)" data-click="a(1 + 2)"></button>';
  expect(await minify(input, { minifyJS: true, customEventAttributes: [/^ng-/] })).toBe(output);
  output = '<button type="button" onclick="return!1" ng-click="a(3)" data-click="a(1 + 2)"></button>';
  expect(await minify(input, { minifyJS: true, customEventAttributes: [/^on/, /^ng-/] })).toBe(output);

  input = '<div onclick="<?= b ?>"></div>';
  expect(await minify(input, { minifyJS: true })).toBe(input);

  input = '<div onclick="alert(a + <?= b ?>)"></div>';
  output = '<div onclick="alert(a+ <?= b ?>)"></div>';
  expect(await minify(input, { minifyJS: true })).toBe(output);

  input = '<div onclick="alert(a + \'<?= b ?>\')"></div>';
  output = '<div onclick=\'alert(a+"<?= b ?>")\'></div>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
});

test('escaping closing script tag', async () => {
  const input = '<script>window.jQuery || document.write(\'<script src="jquery.js"><\\/script>\')</script>';
  const output = '<script>window.jQuery||document.write(\'<script src="jquery.js"><\\/script>\')</script>';
  expect(await minify(input, { minifyJS: true })).toBe(output);
});

test('style minification', async () => {
  let input, output;

  input = '<style></style>div#foo { background-color: red; color: white }';
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>div#foo { background-color: red; color: white }</style>';
  output = '<style>div#foo{background-color:red;color:#fff}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<style>div > p.foo + span { border: 10px solid black }</style>';
  output = '<style>div>p.foo+span{border:10px solid #000}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);

  input = '<div style="background: url(images/<% image %>);"></div>';
  expect(await minify(input)).toBe(input);
  output = '<div style="background:url(images/<% image %>)"></div>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyCSS: true
  })).toBe(output);

  input = '<div style="background: url(\'images/<% image %>\')"></div>';
  expect(await minify(input)).toBe(input);
  output = '<div style="background:url(\'images/<% image %>\')"></div>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyCSS: true
  })).toBe(output);

  input = '<style>\np {\n  background: url(images/<% image %>);\n}\n</style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p{background:url(images/<% image %>)}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyCSS: true
  })).toBe(output);

  input = '<style>p { background: url("images/<% image %>") }</style>';
  expect(await minify(input)).toBe(input);
  output = '<style>p{background:url("images/<% image %>")}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    minifyCSS: true
  })).toBe(output);

  input = '<link rel="stylesheet" href="css/style-mobile.css" media="(max-width: 737px)">';
  expect(await minify(input)).toBe(input);
  output = '<link rel="stylesheet" href="css/style-mobile.css" media="(max-width:737px)">';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  output = '<link rel=stylesheet href=css/style-mobile.css media=(max-width:737px)>';
  expect(await minify(input, {
    minifyCSS: true,
    removeAttributeQuotes: true
  })).toBe(output);

  input = '<style media="(max-width: 737px)"></style>';
  expect(await minify(input)).toBe(input);
  output = '<style media="(max-width:737px)"></style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  output = '<style media=(max-width:737px)></style>';
  expect(await minify(input, {
    minifyCSS: true,
    removeAttributeQuotes: true
  })).toBe(output);
});

test('style attribute minification', async () => {
  const input = '<div style="color: red; background-color: yellow; font-family: Verdana, Arial, sans-serif;"></div>';
  const output = '<div style="color:red;background-color:#ff0;font-family:Verdana,Arial,sans-serif"></div>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
});

test('minification of style with custom fragments', async () => {
  let input;

  input = '<style><?foo?></style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>\t<?foo?>\t</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style><?foo?>{color:red}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>\t<?foo?>\t{color:red}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{<?foo?>}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{\t<?foo?>\t}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style><?foo?>body{color:red}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>\t<?foo?>\tbody{color:red}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{<?foo?>color:red}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{\t<?foo?>\tcolor:red}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{color:red<?foo?>}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{color:red\t<?foo?>\t}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{color:red;<?foo?>}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{color:red;\t<?foo?>\t}</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{color:red}<?foo?></style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);

  input = '<style>body{color:red}\t<?foo?>\t</style>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { minifyCSS: true })).toBe(input);
});

test('url attribute minification', async () => {
  let input, output;

  input = '<link rel="stylesheet" href="http://website.com/style.css"><form action="http://website.com/folder/folder2/index.html"><a href="http://website.com/folder/file.html">link</a></form>';
  output = '<link rel="stylesheet" href="/style.css"><form action="folder2/"><a href="file.html">link</a></form>';
  expect(await minify(input, { minifyURLs: 'http://website.com/folder/' })).toBe(output);
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/folder/' } })).toBe(output);

  input = '<link rel="canonical" href="http://website.com/">';
  expect(await minify(input, { minifyURLs: 'http://website.com/' })).toBe(input);
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/' } })).toBe(input);

  input = '<style>body { background: url(\'http://website.com/bg.png\') }</style>';
  expect(await minify(input, { minifyURLs: 'http://website.com/' })).toBe(input);
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/' } })).toBe(input);
  output = '<style>body{background:url(\'http://website.com/bg.png\')}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  output = '<style>body{background:url(\'bg.png\')}</style>';
  expect(await minify(input, {
    minifyCSS: true,
    minifyURLs: 'http://website.com/'
  })).toBe(output);
  expect(await minify(input, {
    minifyCSS: true,
    minifyURLs: { site: 'http://website.com/' }
  })).toBe(output);

  input = '<style>body { background: url("http://website.com/foo bar/bg.png") }</style>';
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/foo bar/' } })).toBe(input);
  output = '<style>body{background:url("http://website.com/foo bar/bg.png")}</style>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  output = '<style>body{background:url("bg.png")}</style>';
  expect(await minify(input, {
    minifyCSS: true,
    minifyURLs: { site: 'http://website.com/foo bar/' }
  })).toBe(output);

  input = '<style>body { background: url("http://website.com/foo bar/(baz)/bg.png") }</style>';
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/' } })).toBe(input);
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/foo%20bar/' } })).toBe(input);
  expect(await minify(input, { minifyURLs: { site: 'http://website.com/foo%20bar/(baz)/' } })).toBe(input);
  output = '<style>body{background:url("foo%20bar/(baz)/bg.png")}</style>';
  expect(await minify(input, {
    minifyCSS: true,
    minifyURLs: { site: 'http://website.com/' }
  })).toBe(output);
  output = '<style>body{background:url("(baz)/bg.png")}</style>';
  expect(await minify(input, {
    minifyCSS: true,
    minifyURLs: { site: 'http://website.com/foo%20bar/' }
  })).toBe(output);
  output = '<style>body{background:url("bg.png")}</style>';
  expect(await minify(input, {
    minifyCSS: true,
    minifyURLs: { site: 'http://website.com/foo%20bar/(baz)/' }
  })).toBe(output);

  input = '<img src="http://cdn.site.com/foo.png">';
  output = '<img src="//cdn.site.com/foo.png">';
  expect(await minify(input, { minifyURLs: { site: 'http://site.com/' } })).toBe(output);
});

test('srcset attribute minification', async () => {
  let output;
  const input = '<source srcset="http://site.com/foo.gif ,http://site.com/bar.jpg 1x, baz moo 42w,' +
    '\n\n\n\n\n\t    http://site.com/zo om.png 1.00x">';
  output = '<source srcset="http://site.com/foo.gif, http://site.com/bar.jpg, baz moo 42w, http://site.com/zo om.png">';
  expect(await minify(input)).toBe(output);
  output = '<source srcset="foo.gif, bar.jpg, baz%20moo 42w, zo%20om.png">';
  expect(await minify(input, { minifyURLs: { site: 'http://site.com/' } })).toBe(output);
});

test('valueless attributes', async () => {
  const input = '<br foo>';
  expect(await minify(input)).toBe(input);
});

test('newlines becoming whitespaces', async () => {
  const input = 'test\n\n<input>\n\ntest';
  const output = 'test <input> test';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
});

test('conservative collapse', async () => {
  let input, output;

  input = '<b>   foo \n\n</b>';
  output = '<b> foo </b>';
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<html>\n\n<!--test-->\n\n</html>';
  output = '<html> </html>';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p>\u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(input);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(input);

  input = '<p> \u00A0</p>';
  output = '<p>\u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p>\u00A0 </p>';
  output = '<p>\u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p> \u00A0 </p>';
  output = '<p>\u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p>  \u00A0\u00A0  \u00A0  </p>';
  output = '<p>\u00A0\u00A0 \u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p>foo  \u00A0\u00A0  \u00A0  </p>';
  output = '<p>foo \u00A0\u00A0 \u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p>  \u00A0\u00A0  \u00A0  bar</p>';
  output = '<p>\u00A0\u00A0 \u00A0 bar</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p>foo  \u00A0\u00A0  \u00A0  bar</p>';
  output = '<p>foo \u00A0\u00A0 \u00A0 bar</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p> \u00A0foo\u00A0\t</p>';
  output = '<p>\u00A0foo\u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p> \u00A0\nfoo\u00A0\t</p>';
  output = '<p>\u00A0 foo\u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p> \u00A0foo \u00A0\t</p>';
  output = '<p>\u00A0foo \u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);

  input = '<p> \u00A0\nfoo \u00A0\t</p>';
  output = '<p>\u00A0 foo \u00A0</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true
  })).toBe(output);
});

test('collapse preseving a line break', async () => {
  let input, output;

  input = '\n\n\n<!DOCTYPE html>   \n<html lang="en" class="no-js">\n' +
    '  <head>\n    <meta charset="utf-8">\n    <meta http-equiv="X-UA-Compatible" content="IE=edge">\n\n\n\n' +
    '\t<!-- Copyright Notice -->\n' +
    '    <title>Carbon</title>\n\n\t<meta name="title" content="Carbon">\n\t\n\n' +
    '\t<meta name="description" content="A front-end framework.">\n' +
    '    <meta name="apple-mobile-web-app-capable" content="yes">\n' +
    '    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1">\n\n' +
    '<link href="stylesheets/application.css" rel="stylesheet">\n' +
    '    <script src="scripts/application.js"></script>\n' +
    '    <link href="images/icn-32x32.png" rel="shortcut icon">\n' +
    '    <link href="images/icn-152x152.png" rel="apple-touch-icon">\n  </head>\n  <body><p>\n   test test\n\ttest\n\n</p></body>\n</html>';
  output = '\n<!DOCTYPE html>\n<html lang="en" class="no-js">\n' +
    '<head>\n<meta charset="utf-8">\n<meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
    '<!-- Copyright Notice -->\n' +
    '<title>Carbon</title>\n<meta name="title" content="Carbon">\n' +
    '<meta name="description" content="A front-end framework.">\n' +
    '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<link href="stylesheets/application.css" rel="stylesheet">\n' +
    '<script src="scripts/application.js"></script>\n' +
    '<link href="images/icn-32x32.png" rel="shortcut icon">\n' +
    '<link href="images/icn-152x152.png" rel="apple-touch-icon">\n</head>\n<body><p>\ntest test test\n</p></body>\n</html>';
  expect(await minify(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true
  })).toBe(output);
  output = '\n<!DOCTYPE html>\n<html lang="en" class="no-js">\n' +
    '<head>\n<meta charset="utf-8">\n<meta http-equiv="X-UA-Compatible" content="IE=edge">\n' +
    '<title>Carbon</title>\n<meta name="title" content="Carbon">\n' +
    '<meta name="description" content="A front-end framework.">\n' +
    '<meta name="apple-mobile-web-app-capable" content="yes">\n' +
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<link href="stylesheets/application.css" rel="stylesheet">\n' +
    '<script src="scripts/application.js"></script>\n' +
    '<link href="images/icn-32x32.png" rel="shortcut icon">\n' +
    '<link href="images/icn-152x152.png" rel="apple-touch-icon">\n</head>\n<body><p>\ntest test test\n</p></body>\n</html>';
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true,
    removeComments: true
  })).toBe(output);

  input = '<div> text <span>\n text</span> \n</div>';
  output = '<div>text <span>\ntext</span>\n</div>';
  expect(await minify(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = '<div>  text \n </div>';
  output = '<div>text\n</div>';
  expect(await minify(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);
  output = '<div> text\n</div>';
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = '<div>\ntext  </div>';
  output = '<div>\ntext</div>';
  expect(await minify(input, {
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);
  output = '<div>\ntext </div>';
  expect(await minify(input, {
    collapseWhitespace: true,
    conservativeCollapse: true,
    preserveLineBreaks: true
  })).toBe(output);

  input = 'This is the start. <% ... %>\r\n<%= ... %>\r\n<? ... ?>\r\n<!-- This is the middle, and a comment. -->\r\nNo comment, but middle.\r\n<?= ... ?>\r\n<?php ... ?>\r\n<?xml ... ?>\r\nHello, this is the end!';
  output = 'This is the start. <% ... %>\n<%= ... %>\n<? ... ?>\nNo comment, but middle.\n<?= ... ?>\n<?php ... ?>\n<?xml ... ?>\nHello, this is the end!';
  expect(await minify(input, {
    removeComments: true,
    collapseWhitespace: true,
    preserveLineBreaks: true
  })).toBe(output);
});

test('collapse inline tag whitespace', async () => {
  let input, output;

  input = '<button>a</button> <button>b</button>';
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(input);

  output = '<button>a</button><button>b</button>';
  expect(await minify(input, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true
  })).toBe(output);

  input = '<p>where <math> <mi>R</mi> </math> is the Rici tensor.</p>';
  output = '<p>where <math><mi>R</mi></math> is the Rici tensor.</p>';
  expect(await minify(input, {
    collapseWhitespace: true
  })).toBe(output);

  output = '<p>where<math><mi>R</mi></math>is the Rici tensor.</p>';
  expect(await minify(input, {
    collapseWhitespace: true,
    collapseInlineTagWhitespace: true
  })).toBe(output);
});

test('ignore custom comments', async () => {
  let input;

  input = '<!--! test -->';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { ignoreCustomComments: false })).toBe(input);
  expect(await minify(input, {
    removeComments: true,
    ignoreCustomComments: []
  })).toBe('');
  expect(await minify(input, {
    removeComments: true,
    ignoreCustomComments: false
  })).toBe('');

  input = '<!-- htmlmin:ignore -->test<!-- htmlmin:ignore -->';
  const output = 'test';
  expect(await minify(input)).toBe(output);
  expect(await minify(input, { removeComments: true })).toBe(output);
  expect(await minify(input, { ignoreCustomComments: false })).toBe(output);
  expect(await minify(input, {
    removeComments: true,
    ignoreCustomComments: []
  })).toBe(output);
  expect(await minify(input, {
    removeComments: true,
    ignoreCustomComments: false
  })).toBe(output);

  input = '<!-- ko if: someExpressionGoesHere --><li>test</li><!-- /ko -->';
  expect(await minify(input, {
    removeComments: true,
    // ignore knockout comments
    ignoreCustomComments: [
      /^\s+ko/,
      /\/ko\s+$/
    ]
  })).toBe(input);

  input = '<!--#include virtual="/cgi-bin/counter.pl" -->';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { removeComments: true })).toBe(input);
  expect(await minify(input, { removeComments: true, ignoreCustomComments: false })).toBe('');
  expect(await minify(input, { removeComments: true, ignoreCustomComments: [] })).toBe('');
});

test('processScripts', async () => {
  const input = '<script type="text/ng-template"><!--test--><div>   <span> foobar </span> \n\n</div></script>';
  const output = '<script type="text/ng-template"><div><span>foobar</span></div></script>';
  expect(await minify(input, {
    collapseWhitespace: true,
    removeComments: true,
    processScripts: ['text/ng-template']
  })).toBe(output);
});

test('ignore', async () => {
  let input, output;

  input = '<!-- htmlmin:ignore --><div class="blah" style="color: red">\n   test   <span> <input disabled/>  foo </span>\n\n   </div><!-- htmlmin:ignore -->' +
    '<div class="blah" style="color: red">\n   test   <span> <input disabled/>  foo </span>\n\n   </div>';
  output = '<div class="blah" style="color: red">\n   test   <span> <input disabled/>  foo </span>\n\n   </div>' +
    '<div class="blah" style="color: red">test <span><input disabled="disabled"> foo</span></div>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<!-- htmlmin:ignore --><!-- htmlmin:ignore -->';
  expect(await minify(input)).toBe('');

  input = '<p>.....</p><!-- htmlmin:ignore -->' +
    '@for( $i = 0 ; $i < $criterions->count() ; $i++ )' +
    '<h1>{{ $criterions[$i]->value }}</h1>' +
    '@endfor' +
    '<!-- htmlmin:ignore --><p>....</p>';
  output = '<p>.....</p>' +
    '@for( $i = 0 ; $i < $criterions->count() ; $i++ )' +
    '<h1>{{ $criterions[$i]->value }}</h1>' +
    '@endfor' +
    '<p>....</p>';
  expect(await minify(input, { removeComments: true })).toBe(output);

  input = '<!-- htmlmin:ignore --> <p class="logged"|cond="$is_logged === true" id="foo"> bar</p> <!-- htmlmin:ignore -->';
  output = ' <p class="logged"|cond="$is_logged === true" id="foo"> bar</p> ';
  expect(await minify(input)).toBe(output);

  input = '<!-- htmlmin:ignore --><body <?php body_class(); ?>><!-- htmlmin:ignore -->';
  output = '<body <?php body_class(); ?>>';
  expect(await minify(input, { ignoreCustomFragments: [/<\?php[\s\S]*?\?>/] })).toBe(output);

  input = 'a\n<!-- htmlmin:ignore -->b<!-- htmlmin:ignore -->';
  output = 'a b';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<p>foo <!-- htmlmin:ignore --><span>\n\tbar\n</span><!-- htmlmin:ignore -->.</p>';
  output = '<p>foo <span>\n\tbar\n</span>.</p>';
  expect(await minify(input, { collapseWhitespace: true })).toBe(output);

  input = '<!-- htmlmin:ignore -->+<!-- htmlmin:ignore -->0';
  expect(await minify(input)).toBe('+0');
});

test('meta viewport', async () => {
  let input, output;

  input = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  output = '<meta name="viewport" content="width=device-width,initial-scale=1">';
  expect(await minify(input)).toBe(output);

  input = '<meta name="viewport" content="initial-scale=1, maximum-scale=1.0">';
  output = '<meta name="viewport" content="initial-scale=1,maximum-scale=1">';
  expect(await minify(input)).toBe(output);

  input = '<meta name="viewport" content="width= 500 ,  initial-scale=1">';
  output = '<meta name="viewport" content="width=500,initial-scale=1">';
  expect(await minify(input)).toBe(output);

  input = '<meta name="viewport" content="width=device-width, initial-scale=1.0001, maximum-scale=3.140000">';
  output = '<meta name="viewport" content="width=device-width,initial-scale=1.0001,maximum-scale=3.14">';
  expect(await minify(input)).toBe(output);
});

test('downlevel-revealed conditional comments', async () => {
  const input = '<![if !IE]><link href="non-ie.css" rel="stylesheet"><![endif]>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { removeComments: true })).toBe(input);
});

test('noscript', async () => {
  let input;

  input = '<SCRIPT SRC="x"></SCRIPT><NOSCRIPT>x</NOSCRIPT>';
  expect(await minify(input)).toBe('<script src="x"></script><noscript>x</noscript>');

  input = '<noscript>\n<!-- anchor linking to external file -->\n' +
    '<a href="#" onclick="javascript:">External Link</a>\n</noscript>';
  expect(await minify(input, { removeComments: true, collapseWhitespace: true, removeEmptyAttributes: true })).toBe(
    '<noscript><a href="#">External Link</a></noscript>');
});

test('max line length', async () => {
  let input;
  const options = { maxLineLength: 25 };

  input = '123456789012345678901234567890';
  expect(await minify(input, options)).toBe(input);

  input = '<div data-attr="foo"></div>';
  expect(await minify(input, options)).toBe('<div data-attr="foo">\n</div>');

  input = [
    '<code>    hello   world   ',
    '    world   hello  </code>'
  ].join('\n');
  expect(await minify(input)).toBe(input);
  expect(await minify(input, options)).toBe([
    '<code>',
    '    hello   world   ',
    '    world   hello  ',
    '</code>'
  ].join('\n'));

  expect(await minify('<p title="</p>">x</p>')).toBe('<p title="</p>">x</p>');
  expect(await minify('<p title=" <!-- hello world --> ">x</p>')).toBe('<p title=" <!-- hello world --> ">x</p>');
  expect(await minify('<p title=" <![CDATA[ \n\n foobar baz ]]> ">x</p>')).toBe('<p title=" <![CDATA[ \n\n foobar baz ]]> ">x</p>');
  expect(await minify('<p foo-bar=baz>xxx</p>')).toBe('<p foo-bar="baz">xxx</p>');
  expect(await minify('<p foo:bar=baz>xxx</p>')).toBe('<p foo:bar="baz">xxx</p>');

  input = [
    '<div><div><div><div><div>',
    '<div><div><div><div><div>',
    'i\'m 10 levels deep</div>',
    '</div></div></div></div>',
    '</div></div></div></div>',
    '</div>'
  ];
  expect(await minify(input.join(''))).toBe(input.join(''));
  expect(await minify(input.join(''), options)).toBe(input.join('\n'));

  input = [
    '<div><div><?foo?><div>',
    '<div><div><?bar?><div>',
    '<div><div>',
    'i\'m 9 levels deep</div>',
    '</div></div><%baz%></div>',
    '</div></div><%moo%></div>',
    '</div>'
  ];
  expect(await minify(input.join(''))).toBe(input.join(''));
  expect(await minify(input.join(''), options)).toBe(input.join('\n'));

  expect(await minify('<script>alert(\'<!--\')</script>', options)).toBe('<script>alert(\'<!--\')\n</script>');
  input = '<script>\nalert(\'<!-- foo -->\')\n</script>';
  expect(await minify('<script>alert(\'<!-- foo -->\')</script>', options)).toBe(input);
  expect(await minify(input, options)).toBe(input);
  expect(await minify('<script>alert(\'-->\')</script>', options)).toBe('<script>alert(\'-->\')\n</script>');

  expect(await minify('<a title="x"href=" ">foo</a>', options)).toBe('<a title="x" href="">foo\n</a>');
  expect(await minify('<p id=""class=""title="">x', options)).toBe('<p id="" class="" \ntitle="">x</p>');
  expect(await minify('<p x="x\'"">x</p>', options)).toBe('<p x="x\'">x</p>', 'trailing quote should be ignored');
  expect(await minify('<a href="#"><p>Click me</p></a>', options)).toBe('<a href="#"><p>Click me\n</p></a>');
  input = '<span><button>Hit me\n</button></span>';
  expect(await minify('<span><button>Hit me</button></span>', options)).toBe(input);
  expect(await minify(input, options)).toBe(input);
  expect(await minify('<object type="image/svg+xml" data="image.svg"><div>[fallback image]</div></object>', options)).toBe(
    '<object \ntype="image/svg+xml" \ndata="image.svg"><div>\n[fallback image]</div>\n</object>'
  );

  expect(await minify('<ng-include src="x"></ng-include>', options)).toBe('<ng-include src="x">\n</ng-include>');
  expect(await minify('<ng:include src="x"></ng:include>', options)).toBe('<ng:include src="x">\n</ng:include>');
  expect(await minify('<ng-include src="\'views/partial-notification.html\'"></ng-include><div ng-view=""></div>', options)).toBe(
    '<ng-include \nsrc="\'views/partial-notification.html\'">\n</ng-include><div \nng-view=""></div>'
  );

  input = [
    '<some-tag-1></some-tag-1>',
    '<some-tag-2></some-tag-2>',
    '<some-tag-3>4',
    '</some-tag-3>'
  ];
  expect(await minify(input.join(''))).toBe(input.join(''));
  expect(await minify(input.join(''), options)).toBe(input.join('\n'));

  expect(await minify('[\']["]', options)).toBe('[\']["]');
  expect(await minify('<a href="/test.html"><div>hey</div></a>', options)).toBe('<a href="/test.html">\n<div>hey</div></a>');
  expect(await minify(':) <a href="http://example.com">link</a>', options)).toBe(':) <a \nhref="http://example.com">\nlink</a>');
  expect(await minify(':) <a href="http://example.com">\nlink</a>', options)).toBe(':) <a \nhref="http://example.com">\nlink</a>');
  expect(await minify(':) <a href="http://example.com">\n\nlink</a>', options)).toBe(':) <a \nhref="http://example.com">\n\nlink</a>');

  expect(await minify('<a href>ok</a>', options)).toBe('<a href>ok</a>');
});

test('custom attribute collapse', async () => {
  let input, output;

  input = '<div data-bind="\n' +
    'css: {\n' +
    'fadeIn: selected(),\n' +
    'fadeOut: !selected()\n' +
    '},\n' +
    'visible: function () {\n' +
    'return pageWeAreOn() == \'home\';\n' +
    '}\n' +
    '">foo</div>';
  output = '<div data-bind="css: {fadeIn: selected(),fadeOut: !selected()},visible: function () {return pageWeAreOn() == \'home\';}">foo</div>';

  expect(await minify(input)).toBe(input);
  expect(await minify(input, { customAttrCollapse: /data-bind/ })).toBe(output);

  input = '<div style="' +
    'color: red;' +
    'font-size: 100em;' +
    '">bar</div>';
  output = '<div style="color: red;font-size: 100em;">bar</div>';
  expect(await minify(input, { customAttrCollapse: /style/ })).toBe(output);

  input = '<div ' +
    'class="fragment square" ' +
    'ng-hide="square1.hide" ' +
    'ng-class="{ \n\n' +
    '\'bounceInDown\': !square1.hide, ' +
    '\'bounceOutDown\': square1.hide ' +
    '}" ' +
    '> ' +
    '</div>';
  output = '<div class="fragment square" ng-hide="square1.hide" ng-class="{\'bounceInDown\': !square1.hide, \'bounceOutDown\': square1.hide }"> </div>';
  expect(await minify(input, { customAttrCollapse: /ng-class/ })).toBe(output);
});

test('custom attribute collapse with empty attribute value', async () => {
  const input = '<div ng-some\n\n></div>';
  const output = '<div ng-some></div>';
  expect(await minify(input, { customAttrCollapse: /.+/ })).toBe(output);
});

test('custom attribute collapse with newlines, whitespace, and carriage returns', async () => {
  const input = '<div ng-class="{ \n\r' +
    '               value:true, \n\r' +
    '               value2:false \n\r' +
    '               }"></div>';
  const output = '<div ng-class="{value:true,value2:false}"></div>';
  expect(await minify(input, { customAttrCollapse: /ng-class/ })).toBe(output);
});

test('do not escape attribute value', async () => {
  let input;

  input = '<div data=\'{\n' +
    '\t"element": "<div class=\\"test\\"></div>\n"' +
    '}\'></div>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { preventAttributesEscaping: true })).toBe(input);

  input = '<div foo bar=\'\' baz="" moo=1 loo=\'2\' haa="3"></div>';
  expect(await minify(input, { preventAttributesEscaping: true })).toBe(input);
  const output = '<div foo bar="" baz="" moo="1" loo="2" haa="3"></div>';
  expect(await minify(input)).toBe(output);
});

test('quoteCharacter is single quote', async () => {
  expect(await minify('<div class=\'bar\'>foo</div>', { quoteCharacter: '\'' })).toBe('<div class=\'bar\'>foo</div>');
  expect(await minify('<div class="bar">foo</div>', { quoteCharacter: '\'' })).toBe('<div class=\'bar\'>foo</div>');
});

test('quoteCharacter is not single quote or double quote', async () => {
  expect(await minify('<div class=\'bar\'>foo</div>', { quoteCharacter: 'm' })).toBe('<div class="bar">foo</div>');
  expect(await minify('<div class="bar">foo</div>', { quoteCharacter: 'm' })).toBe('<div class="bar">foo</div>');
});

test('remove space between attributes', async () => {
  let input, output;
  const options = {
    collapseBooleanAttributes: true,
    keepClosingSlash: true,
    removeAttributeQuotes: true,
    removeTagWhitespace: true
  };

  input = '<input data-attr="example" value="hello world!" checked="checked">';
  output = '<input data-attr=example value="hello world!"checked>';
  expect(await minify(input, options)).toBe(output);

  input = '<input checked="checked" value="hello world!" data-attr="example">';
  output = '<input checked value="hello world!"data-attr=example>';
  expect(await minify(input, options)).toBe(output);

  input = '<input checked="checked" data-attr="example" value="hello world!">';
  output = '<input checked data-attr=example value="hello world!">';
  expect(await minify(input, options)).toBe(output);

  input = '<input data-attr="example" value="hello world!" checked="checked"/>';
  output = '<input data-attr=example value="hello world!"checked/>';
  expect(await minify(input, options)).toBe(output);

  input = '<input checked="checked" value="hello world!" data-attr="example"/>';
  output = '<input checked value="hello world!"data-attr=example />';
  expect(await minify(input, options)).toBe(output);

  input = '<input checked="checked" data-attr="example" value="hello world!"/>';
  output = '<input checked data-attr=example value="hello world!"/>';
  expect(await minify(input, options)).toBe(output);
});

test('markups from Angular 2', async () => {
  let output;
  const input = '<template ngFor #hero [ngForOf]="heroes">\n' +
    '  <hero-detail *ngIf="hero" [hero]="hero"></hero-detail>\n' +
    '</template>\n' +
    '<form (ngSubmit)="onSubmit(theForm)" #theForm="ngForm">\n' +
    '  <div class="form-group">\n' +
    '    <label for="name">Name</label>\n' +
    '    <input class="form-control" required ngControl="firstName"\n' +
    '      [(ngModel)]="currentHero.firstName">\n' +
    '  </div>\n' +
    '  <button type="submit" [disabled]="!theForm.form.valid">Submit</button>\n' +
    '</form>';
  output = '<template ngFor #hero [ngForOf]="heroes">\n' +
    '  <hero-detail *ngIf="hero" [hero]="hero"></hero-detail>\n' +
    '</template>\n' +
    '<form (ngSubmit)="onSubmit(theForm)" #theForm="ngForm">\n' +
    '  <div class="form-group">\n' +
    '    <label for="name">Name</label>\n' +
    '    <input class="form-control" required ngControl="firstName" [(ngModel)]="currentHero.firstName">\n' +
    '  </div>\n' +
    '  <button type="submit" [disabled]="!theForm.form.valid">Submit</button>\n' +
    '</form>';
  expect(await minify(input, { caseSensitive: true })).toBe(output);
  output = '<template ngFor #hero [ngForOf]=heroes>' +
    '<hero-detail *ngIf=hero [hero]=hero></hero-detail>' +
    '</template>' +
    '<form (ngSubmit)=onSubmit(theForm) #theForm=ngForm>' +
    '<div class=form-group>' +
    '<label for=name>Name</label>' +
    ' <input class=form-control required ngControl=firstName [(ngModel)]=currentHero.firstName>' +
    '</div>' +
    '<button type=submit [disabled]=!theForm.form.valid>Submit</button>' +
    '</form>';
  expect(await minify(input, {
    caseSensitive: true,
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeAttributeQuotes: true,
    removeComments: true,
    removeEmptyAttributes: true,
    removeOptionalTags: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    useShortDoctype: true
  })).toBe(output);
});

test('auto-generated tags', async () => {
  let input, output;

  input = '</p>';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(input);

  input = '<p id=""class=""title="">x';
  output = '<p id="" class="" title="">x';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(output);
  output = '<p id="" class="" title="">x</p>';
  expect(await minify(input)).toBe(output);
  expect(await minify(input, { includeAutoGeneratedTags: true })).toBe(output);

  input = '<body onload="  foo();   bar() ;  "><p>x</body>';
  output = '<body onload="foo();   bar() ;"><p>x</body>';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(output);

  input = '<a href="#"><div>Well, look at me! I\'m a div!</div></a>';
  output = '<a href="#"><div>Well, look at me! I\'m a div!</div>';
  expect(await minify(input, { html5: false, includeAutoGeneratedTags: false })).toBe(output);
  expect(await minify('<p id=""class=""title="">x', {
    maxLineLength: 25,
    includeAutoGeneratedTags: false
  })).toBe('<p id="" class="" \ntitle="">x');

  input = '<p>foo';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(input);
  expect(await minify(input, {
    includeAutoGeneratedTags: false,
    removeOptionalTags: true
  })).toBe(input);

  input = '</p>';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(input);
  output = '';
  expect(await minify(input, {
    includeAutoGeneratedTags: false,
    removeOptionalTags: true
  })).toBe(output);

  input = '<select><option>foo<option>bar</select>';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(input);
  output = '<select><option>foo</option><option>bar</option></select>';
  expect(await minify(input, { includeAutoGeneratedTags: true })).toBe(output);

  input = '<datalist><option label="A" value="1"><option label="B" value="2"></datalist>';
  expect(await minify(input, { includeAutoGeneratedTags: false })).toBe(input);
  output = '<datalist><option label="A" value="1"></option><option label="B" value="2"></option></datalist>';
  expect(await minify(input, { includeAutoGeneratedTags: true })).toBe(output);
});

test('sort attributes', async () => {
  let input, output;

  input = '<link href="foo">' +
    '<link rel="bar" href="baz">' +
    '<link type="text/css" href="app.css" rel="stylesheet" async>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { sortAttributes: false })).toBe(input);
  output = '<link href="foo">' +
    '<link href="baz" rel="bar">' +
    '<link href="app.css" rel="stylesheet" async type="text/css">';
  expect(await minify(input, { sortAttributes: true })).toBe(output);

  input = '<link href="foo">' +
    '<link rel="bar" href="baz">' +
    '<script type="text/html"><link type="text/css" href="app.css" rel="stylesheet" async></script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { sortAttributes: false })).toBe(input);
  output = '<link href="foo">' +
    '<link href="baz" rel="bar">' +
    '<script type="text/html"><link type="text/css" href="app.css" rel="stylesheet" async></script>';
  expect(await minify(input, { sortAttributes: true })).toBe(output);
  output = '<link href="foo">' +
    '<link href="baz" rel="bar">' +
    '<script type="text/html"><link href="app.css" rel="stylesheet" async type="text/css"></script>';
  expect(await minify(input, {
    processScripts: [
      'text/html'
    ],
    sortAttributes: true
  })).toBe(output);

  input = '<link type="text/css" href="foo.css">' +
    '<link rel="stylesheet" type="text/abc" href="bar.css">' +
    '<link href="baz.css">';
  output = '<link href="foo.css" type="text/css">' +
    '<link href="bar.css" type="text/abc" rel="stylesheet">' +
    '<link href="baz.css">';
  expect(await minify(input, { sortAttributes: true })).toBe(output);
  output = '<link href="foo.css">' +
    '<link href="bar.css" rel="stylesheet" type="text/abc">' +
    '<link href="baz.css">';
  expect(await minify(input, {
    removeStyleLinkTypeAttributes: true,
    sortAttributes: true
  })).toBe(output);

  input = '<a foo moo></a>' +
    '<a bar foo></a>' +
    '<a baz bar foo></a>' +
    '<a baz foo moo></a>' +
    '<a moo baz></a>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { sortAttributes: false })).toBe(input);
  output = '<a foo moo></a>' +
    '<a foo bar></a>' +
    '<a foo bar baz></a>' +
    '<a foo baz moo></a>' +
    '<a baz moo></a>';
  expect(await minify(input, { sortAttributes: true })).toBe(output);

  input = '<span nav_sv_fo_v_column <#=(j === 0) ? \'nav_sv_fo_v_first\' : \'\' #> foo_bar></span>';
  expect(await minify(input, {
    ignoreCustomFragments: [/<#[\s\S]*?#>/]
  })).toBe(input);
  expect(await minify(input, {
    ignoreCustomFragments: [/<#[\s\S]*?#>/],
    sortAttributes: false
  })).toBe(input);
  output = '<span foo_bar nav_sv_fo_v_column <#=(j === 0) ? \'nav_sv_fo_v_first\' : \'\' #> ></span>';
  expect(await minify(input, {
    ignoreCustomFragments: [/<#[\s\S]*?#>/],
    sortAttributes: true
  })).toBe(output);

  input = '<a 0 1 2 3 4 5 6 7 8 9 a b c d e f g h i j k l m n o p q r s t u v w x y z></a>';
  expect(await minify(input, { sortAttributes: true })).toBe(input);
});

test('sort style classes', async () => {
  let input, output;

  input = '<a class="foo moo"></a>' +
    '<b class="bar foo"></b>' +
    '<i class="baz bar foo"></i>' +
    '<s class="baz foo moo"></s>' +
    '<u class="moo baz"></u>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { sortClassName: false })).toBe(input);
  output = '<a class="foo moo"></a>' +
    '<b class="foo bar"></b>' +
    '<i class="foo bar baz"></i>' +
    '<s class="foo baz moo"></s>' +
    '<u class="baz moo"></u>';
  expect(await minify(input, { sortClassName: true })).toBe(output);

  input = '<a class="moo <!-- htmlmin:ignore -->bar<!-- htmlmin:ignore --> foo baz"></a>';
  output = '<a class="moo bar foo baz"></a>';
  expect(await minify(input)).toBe(output);
  expect(await minify(input, { sortClassName: false })).toBe(output);
  output = '<a class="baz foo moo bar"></a>';
  expect(await minify(input, { sortClassName: true })).toBe(output);

  input = '<div class="nav_sv_fo_v_column <#=(j === 0) ? \'nav_sv_fo_v_first\' : \'\' #> foo_bar"></div>';
  expect(await minify(input, {
    ignoreCustomFragments: [/<#[\s\S]*?#>/]
  })).toBe(input);
  expect(await minify(input, {
    ignoreCustomFragments: [/<#[\s\S]*?#>/],
    sortClassName: false
  })).toBe(input);
  expect(await minify(input, {
    ignoreCustomFragments: [/<#[\s\S]*?#>/],
    sortClassName: true
  })).toBe(input);

  input = '<a class="0 1 2 3 4 5 6 7 8 9 a b c d e f g h i j k l m n o p q r s t u v w x y z"></a>';
  expect(await minify(input, { sortClassName: false })).toBe(input);
  expect(await minify(input, { sortClassName: true })).toBe(input);

  input = '<a class="add sort keys createSorter"></a>';
  expect(await minify(input, { sortClassName: false })).toBe(input);
  output = '<a class="add createSorter keys sort"></a>';
  expect(await minify(input, { sortClassName: true })).toBe(output);

  input = '<span class="sprite sprite-{{sprite}}"></span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    ignoreCustomFragments: [/{{.*?}}/],
    removeAttributeQuotes: true,
    sortClassName: true
  })).toBe(input);

  input = '<span class="{{sprite}}-sprite sprite"></span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    ignoreCustomFragments: [/{{.*?}}/],
    removeAttributeQuotes: true,
    sortClassName: true
  })).toBe(input);

  input = '<span class="sprite-{{sprite}}-sprite"></span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    ignoreCustomFragments: [/{{.*?}}/],
    removeAttributeQuotes: true,
    sortClassName: true
  })).toBe(input);

  input = '<span class="{{sprite}}"></span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    ignoreCustomFragments: [/{{.*?}}/],
    removeAttributeQuotes: true,
    sortClassName: true
  })).toBe(input);

  input = '<span class={{sprite}}></span>';
  output = '<span class="{{sprite}}"></span>';
  expect(await minify(input, {
    collapseWhitespace: true,
    ignoreCustomFragments: [/{{.*?}}/],
    removeAttributeQuotes: true,
    sortClassName: true
  })).toBe(output);

  input = '<div class></div>';
  expect(await minify(input, { sortClassName: false })).toBe(input);
  expect(await minify(input, { sortClassName: true })).toBe(input);
});

test('decode entity characters', async () => {
  let input, output;

  input = '<!-- &ne; -->';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { decodeEntities: false })).toBe(input);
  expect(await minify(input, { decodeEntities: true })).toBe(input);

  // https://github.com/kangax/html-minifier/issues/964
  input = '&amp;xxx; &amp;xxx &ampthorn; &ampthorn &ampcurren;t &ampcurrent';
  output = '&ampxxx; &xxx &ampthorn; &ampthorn &ampcurren;t &ampcurrent';
  expect(await minify(input, { decodeEntities: true })).toBe(output);

  input = '<script type="text/html">&colon;</script>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { decodeEntities: false })).toBe(input);
  expect(await minify(input, { decodeEntities: true })).toBe(input);
  output = '<script type="text/html">:</script>';
  expect(await minify(input, { decodeEntities: true, processScripts: ['text/html'] })).toBe(output);

  input = '<div style="font: &quot;monospace&#34;">foo&dollar;</div>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { decodeEntities: false })).toBe(input);
  output = '<div style=\'font: "monospace"\'>foo$</div>';
  expect(await minify(input, { decodeEntities: true })).toBe(output);
  output = '<div style="font:&quot">foo&dollar;</div>';
  expect(await minify(input, { minifyCSS: true })).toBe(output);
  expect(await minify(input, { decodeEntities: false, minifyCSS: true })).toBe(output);
  output = '<div style="font:monospace">foo$</div>';
  expect(await minify(input, { decodeEntities: true, minifyCSS: true })).toBe(output);

  input = '<a href="/?foo=1&amp;bar=&lt;2&gt;">baz&lt;moo&gt;&copy;</a>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { decodeEntities: false })).toBe(input);
  output = '<a href="/?foo=1&bar=<2>">baz&lt;moo>\u00a9</a>';
  expect(await minify(input, { decodeEntities: true })).toBe(output);

  input = '<? &amp; ?>&amp;<pre><? &amp; ?>&amp;</pre>';
  expect(await minify(input)).toBe(input);
  expect(await minify(input, { collapseWhitespace: false, decodeEntities: false })).toBe(input);
  expect(await minify(input, { collapseWhitespace: true, decodeEntities: false })).toBe(input);
  output = '<? &amp; ?>&<pre><? &amp; ?>&</pre>';
  expect(await minify(input, { collapseWhitespace: false, decodeEntities: true })).toBe(output);
  expect(await minify(input, { collapseWhitespace: true, decodeEntities: true })).toBe(output);
});

test('tests from PHPTAL', async () => {
  await Promise.all([
    // trailing </p> removed by minifier, but not by PHPTAL
    ['<p>foo bar baz', '<p>foo     \t bar\n\n\n baz</p>'],
    ['<p>foo bar<pre>  \tfoo\t   \nbar   </pre>', '<p>foo   \t\n bar</p><pre>  \tfoo\t   \nbar   </pre>'],
    ['<p>foo <a href="">bar </a>baz', '<p>foo <a href=""> bar </a> baz  </p>'],
    ['<p>foo <a href="">bar </a>baz', ' <p>foo <a href=""> bar </a>baz </p>'],
    ['<p>foo<a href=""> bar </a>baz', ' <p> foo<a href=""> bar </a>baz </p>  '],
    ['<p>foo <a href="">bar</a> baz', ' <p> foo <a href="">bar</a> baz</p>'],
    ['<p>foo<br>', '<p>foo <br/></p>'],
    // PHPTAL remove whitespace after 'foo' - problematic if <span> is used as icon font
    ['<p>foo <span></span>', '<p>foo <span></span></p>'],
    ['<p>foo <span></span>', '<p>foo <span></span> </p>'],
    // comments removed by minifier, but not by PHPTAL
    ['<p>foo', '<p>foo <!-- --> </p>'],
    ['<div>a<div>b</div>c<div>d</div>e</div>', '<div>a <div>b</div> c <div> d </div> e </div>'],
    // unary slashes removed by minifier, but not by PHPTAL
    ['<div><img></div>', '<div> <img/> </div>'],
    ['<div>x <img></div>', '<div> x <img/> </div>'],
    ['<div>x <img> y</div>', '<div> x <img/> y </div>'],
    ['<div><img> y</div>', '<div><img/> y </div>'],
    ['<div><button>Z</button></div>', '<div> <button>Z</button> </div>'],
    ['<div>x <button>Z</button></div>', '<div> x <button>Z</button> </div>'],
    ['<div>x <button>Z</button> y</div>', '<div> x <button>Z</button> y </div>'],
    ['<div><button>Z</button> y</div>', '<div><button>Z</button> y </div>'],
    ['<div><button>Z</button></div>', '<div> <button> Z </button> </div>'],
    ['<div>x <button>Z</button></div>', '<div> x <button> Z </button> </div>'],
    ['<div>x <button>Z</button> y</div>', '<div> x <button> Z </button> y </div>'],
    ['<div><button>Z</button> y</div>', '<div><button> Z </button> y </div>'],
    ['<script>//foo\nbar()</script>', '<script>//foo\nbar()</script>'],
    // optional tags removed by minifier, but not by PHPTAL
    // parser cannot handle <script/>
    [
      '<title></title><link><script>" ";</script><script></script><meta><style></style>',
      '<html >\n' +
      '<head > <title > </title > <link /> <script >" ";</script> <script>\n</script>\n' +
      ' <meta /> <style\n' +
      '  > </style >\n' +
      '   </head > </html>'
    ],
    ['<div><p>test 123<p>456<ul><li>x</ul></div>', '<div> <p> test 123 </p> <p> 456 </p> <ul> <li>x</li> </ul> </div>'],
    ['<div><p>test 123<pre> 456 </pre><p>x</div>', '<div> <p> test 123 </p> <pre> 456 </pre> <p> x </p> </div>'],
    /* minifier does not assume <li> as "display: inline"
    ['<div><ul><li><a>a </a></li><li>b </li><li>c</li></ul></div>', '<div> <ul> <li> <a> a </a> </li> <li> b </li> <li> c </li> </ul> </div>'], */
    ['<table>x<tr>x<td>foo</td>x</tr>x</table>', '<table> x <tr> x <td> foo </td> x </tr> x </table>'],
    ['<select>x<option></option>x<optgroup>x<option></option>x</optgroup>x</select>', '<select> x <option> </option> x <optgroup> x <option> </option> x </optgroup> x </select> '],
    // closing slash and optional attribute quotes removed by minifier, but not by PHPTAL
    // attribute ordering differences between minifier and PHPTAL
    ['<img alt=x height=5 src=foo width=10>', '<img width="10" height="5" src="foo" alt="x" />'],
    ['<img alpha=1 beta=2 gamma=3>', '<img gamma="3" alpha="1" beta="2" />'],
    ['<pre>\n\n\ntest</pre>', '<pre>\n\n\ntest</pre>'],
    /* single line-break preceding <pre> is redundant, assuming <pre> is block element
    ['<pre>test</pre>', '<pre>\ntest</pre>'], */
    // closing slash and optional attribute quotes removed by minifier, but not by PHPTAL
    // attribute ordering differences between minifier and PHPTAL
    // redundant inter-attribute spacing removed by minifier, but not by PHPTAL
    ['<meta content="text/plain;charset=UTF-8"http-equiv=Content-Type>', '<meta http-equiv=\'Content-Type\' content=\'text/plain;charset=UTF-8\'/>'],
    /* minifier does not optimise <meta/> in HTML5 mode
    ['<meta charset=utf-8>', '<meta http-equiv=\'Content-Type\' content=\'text/plain;charset=UTF-8\'/>'], */
    /* minifier does not optimise <script/> in HTML5 mode
    [
      '<script></script><style></style>',
      '<script type=\'text/javascript ;charset=utf-8\'\n' +
      'language=\'javascript\'></script><style type=\'text/css\'></style>'
    ], */
    // minifier removes more javascript type attributes than PHPTAL
    ['<script></script><script type=text/hack></script>', '<script type="text/javascript;e4x=1"></script><script type="text/hack"></script>']
    /* trim "title" attribute value in <a>
    [
      '<title>Foo</title><p><a title="x"href=test>x </a>xu</p><br>foo',
      '<html> <head> <title> Foo </title> </head>\n' +
      '<body>\n' +
      '<p>\n' +
      '<a title="   x " href=" test "> x </a> xu\n' +
      '</p>\n' +
      '<br/>\n' +
      'foo</body> </html>  <!-- bla -->'
    ] */
  ].map(async function (tokens) {
    expect(await minify(tokens[1], {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      removeTagWhitespace: true,
      sortAttributes: true,
      useShortDoctype: true
    })).toBe(tokens[0]);
  }));
});

test('canCollapseWhitespace and canTrimWhitespace hooks', async () => {
  function canCollapseAndTrimWhitespace(tagName, attrs, defaultFn) {
    if ((attrs || []).some(function (attr) { return attr.name === 'class' && attr.value === 'leaveAlone'; })) {
      return false;
    }
    return defaultFn(tagName, attrs);
  }

  let input = '<div class="leaveAlone"><span> </span> foo  bar</div>';
  let output = '<div class="leaveAlone"><span> </span> foo  bar</div>';

  expect(await minify(input, {
    collapseWhitespace: true,
    canTrimWhitespace: canCollapseAndTrimWhitespace,
    canCollapseWhitespace: canCollapseAndTrimWhitespace
  })).toBe(output);

  // Regression test: Previously the first </div> would clear the internal
  // stackNo{Collapse,Trim}Whitespace, so that ' foo  bar' turned into ' foo bar'
  input = '<div class="leaveAlone"><div></div><span> </span> foo  bar</div>';
  output = '<div class="leaveAlone"><div></div><span> </span> foo  bar</div>';

  expect(await minify(input, {
    collapseWhitespace: true,
    canTrimWhitespace: canCollapseAndTrimWhitespace,
    canCollapseWhitespace: canCollapseAndTrimWhitespace
  })).toBe(output);

  // Make sure that the stack does get reset when leaving the element for which
  // the hooks returned false:
  input = '<div class="leaveAlone"></div><div> foo  bar </div>';
  output = '<div class="leaveAlone"></div><div>foo bar</div>';

  expect(await minify(input, {
    collapseWhitespace: true,
    canTrimWhitespace: canCollapseAndTrimWhitespace,
    canCollapseWhitespace: canCollapseAndTrimWhitespace
  })).toBe(output);
});

test('minify Content-Security-Policy', async () => {
  let input, output;

  input = '<meta Http-Equiv="Content-Security-Policy"\t\t\t\tContent="default-src \'self\';\n\n\t\timg-src https://*;">';
  output = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src https://*;">';
  expect(await minify(input)).toBe(output);

  input = '<meta http-equiv="content-security-policy"\t\t\t\tcontent="default-src \'self\';\n\n\t\timg-src https://*;">';
  output = '<meta http-equiv="content-security-policy" content="default-src \'self\'; img-src https://*;">';
  expect(await minify(input)).toBe(output);

  input = '<meta http-equiv="content-security-policy" content="default-src \'self\'; img-src https://*;">';
  expect(await minify(input)).toBe(input);
});
