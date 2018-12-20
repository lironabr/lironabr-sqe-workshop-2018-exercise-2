import assert from 'assert';
import {parseCode,substitute,paintCode} from '../src/js/code-analyzer';
import * as escodegen from 'escodegen';


let first_test_input=escodegen.generate(substitute(parseCode(
    'function foo(x, y, z){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    if (b < z) {\n' +
    '        c = c + 5;\n' +
    '        return x + y + z + c;\n' +
    '    } else if (b < z * 2) {\n' +
    '        c = c + x + 5;\n' +
    '        return x + y + z + c;\n' +
    '    } else {\n' +
    '        c = c + z + 5;\n' +
    '        return x + y + z + c;\n' +
    '    }\n' +
    '}\n')));
it('The substitute is substituting the first example correctly',()=>{
    assert.deepEqual(first_test_input,
        'function foo(x, y, z) {\n' +
        '    if (x + 1 + y < z) {\n' +
        '        return x + y + z + (0 + 5);\n' +
        '    } else if (x + 1 + y < z * 2) {\n' +
        '        return x + y + z + (0 + x + 5);\n' +
        '    } else {\n' +
        '        return x + y + z + (0 + z + 5);\n' +
        '    }\n' +
        '}'
    );
});



let second_test_input=escodegen.generate(substitute(parseCode(
    'function foo(x, y, z){\n' +
    '    let a = x + 1;\n' +
    '    let b = a + y;\n' +
    '    let c = 0;\n' +
    '    \n' +
    '    while (a < z) {\n' +
    '        c = a + b;\n' +
    '        z = c * 2;\n' +
    '    }\n' +
    '    \n' +
    '    return z;\n' +
    '}\n')));
it('The substitute is substituting the second example correctly', () => {
    assert.deepEqual(
        second_test_input,
        'function foo(x, y, z) {\n' +
        '    while (x + 1 < z) {\n' +
        '        z = (x + 1 + (x + 1 + y)) * 2;\n' +
        '    }\n' +
        '    return z;\n' +
        '}'
    );
});

let third_test_input=escodegen.generate(substitute(parseCode(
    'function foo(){\n' +
    '    \n' +
    '}\n')));
it('The substitute is substituting an empty function correctly', () => {
    assert.deepEqual(
        third_test_input,
        'function foo() {\n}'
    );
});

let fourth_test_input=escodegen.generate(substitute(parseCode(
    'function foo(x){\n' +
    '    if(x>5){\n' +
    '        return true;\n' +
    '    }\n' +
    '    return false;\n' +
    '}\n')));
it('The substitute is substituting a single if (no alternate) correctly', () => {
    assert.deepEqual(
        fourth_test_input,
        'function foo(x) {\n' +
        '    if (x > 5) {\n' +
        '        return true;\n' +
        '    }\n' +
        '    return false;\n' +
        '}'
    );
});

let fifth_test_input= escodegen.generate(substitute(parseCode(
    'function foo(){\n' +
    '    return a;\n' +
    '}')));
it('The substitute is substituting a non existing identifier name correctly', () => {
    assert.deepEqual(
        fifth_test_input,
        'function foo() {\n' +
        '    return a;\n' +
        '}'
    );
});
let sixth_test_input=escodegen.generate(substitute(parseCode(
    'function foo(){\n' +
    '    let a=[1,2,3,4];\n' +
    '    return a[2]+ a[0];\n' +
    '}')));
it('The substitute is substituting an array correctly', () => {
    assert.deepEqual(
        sixth_test_input,
        'function foo() {\n' +
        '    return 3 + 1;\n' +
        '}'
    );
});

let seventh_test_input=paintCode(first_test_input,'1,2,3');
it('The painter is painting the first example correctly', () => {
    assert.deepEqual(
        seventh_test_input,
        '<p>function foo(x, y, z) {</p>' +
        '<p><mark style="background-color:red">    if (x + 1 + y < z) {</mark></p>' +
        '<p>        return x + y + z + (0 + 5);</p>' +
        '<p><mark style="background-color:lawngreen">    } else if (x + 1 + y < z * 2) {</mark></p>' +
        '<p>        return x + y + z + (0 + x + 5);</p>' +
        '<p>    } else {</p>' +
        '<p>        return x + y + z + (0 + z + 5);</p>' +
        '<p>    }</p>' +
        '<p>}</p>'
    );
});

let eighth_test_input = paintCode(escodegen.generate(substitute(parseCode(
    'function foo(x){\n' +
    '    if(x[1]===\'2\')\n' +
    '        return true;\n' +
    '    return false;\n' +
    '}'))), '\'1234\'');
it('The painter is painting a single param function correctly', () => {
    assert.deepEqual(
        eighth_test_input,
        '<p>function foo(x) {</p>' +
        '<p><mark style="background-color:lawngreen">    if (x[1] === \'2\')</mark></p>' +
        '<p>        return true;</p>' +
        '<p>    return false;</p>' +
        '<p>}</p>'
    );
});

let ninth_test_input=paintCode(escodegen.generate(substitute(parseCode(
    'function goo(){\n' +
    '    let a=5\n' +
    '    if(2*a > 12){\n' +
    '        return 6;\n' +
    '    }\n' +
    '    else{\n' +
    '        return 0;\n' +
    '    }\n' +
    '}'))),'');
it('The painter is painting a zero param function correctly', () => {
    assert.deepEqual(
        ninth_test_input,
        '<p>function goo() {</p>' +
        '<p><mark style="background-color:red">    if (2 * 5 > 12) {</mark></p>' +
        '<p>        return 6;</p>' +
        '<p>    } else {</p>' +
        '<p>        return 0;</p>' +
        '<p>    }</p>' +
        '<p>}</p>'
    );
});

let tenth_test_input= paintCode(first_test_input,'3,2,100');
it('The painter is painting all alternates correctly', () => {
    assert.deepEqual(
        tenth_test_input,
        '<p>function foo(x, y, z) {</p>' +
        '<p><mark style="background-color:lawngreen">    if (x + 1 + y < z) {</mark></p>' +
        '<p>        return x + y + z + (0 + 5);</p>' +
        '<p><mark style="background-color:red">    } else if (x + 1 + y < z * 2) {</mark></p>' +
        '<p>        return x + y + z + (0 + x + 5);</p>' +
        '<p>    } else {</p>' +
        '<p>        return x + y + z + (0 + z + 5);</p>' +
        '<p>    }</p>' +
        '<p>}</p>'
    );
});

let eleventh_test_input=paintCode(escodegen.generate(substitute(parseCode(''))),'');
it('The painter is painting empty inputs correctly', () => {
    assert.deepEqual(
        eleventh_test_input,
        '<p></p>'
    );
});

let twelfth_test_input=paintCode(escodegen.generate(substitute(parseCode(
    'function foo(){\n' +
    '    if(7>6)\n' +
    '        return true;\n' +
    '      }'))),'');
it('The painter is painting an if w/o alternate correctly', () => {
    assert.deepEqual(
        twelfth_test_input,
        '<p>function foo() {</p>' +
        '<p><mark style="background-color:lawngreen">    if (7 > 6)</mark></p>' +
        '<p>        return true;</p>' +
        '<p>}</p>'
    );
});

let thirteenth_test_input= escodegen.generate(substitute(parseCode(
    'function foo(){\n' +
     '    let a;\n' +
     '    a=8;\n' +
     '    if(a>6)\n' +
     '        return true;\n' +
     '}')));
it('The substitute is substituting a variable declaration correctly', () => {
    assert.deepEqual(
        thirteenth_test_input,
        'function foo() {\n' +
        '    if (8 > 6)\n' +
        '        return true;\n' +
        '}'
    );
});

let fourteenth_test_input = paintCode(escodegen.generate(substitute(parseCode(
    'function foo(x,y){\n' +
    '    if(x[y]>y){\n' +
    '        return y;\n' +
    '    }\n' +
    '    else\n' +
    '        return x[y];\n' +
    '}'))),'[8,9,10],1');
it('The painter is painting an array argument correctly', () => {
    assert.deepEqual(
        fourteenth_test_input,
        '<p>function foo(x, y) {</p>' +
        '<p><mark style="background-color:lawngreen">    if (x[y] > y) {</mark></p>' +
        '<p>        return y;</p>' +
        '<p>    } else</p>' +
        '<p>        return x[y];</p>' +
        '<p>}</p>'
    );
});
