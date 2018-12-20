import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import * as walk from 'esprima-walk';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const handlers = [];
const types = ['Program', 'AssignmentExpression', 'FunctionDeclaration', 'VariableDeclaration', 'WhileStatement', 'IfStatement',
    'ReturnStatement', 'BlockStatement', 'ExpressionStatement', 'ForStatement', 'BinaryExpression', 'Identifier', 'MemberExpression'];
handlers['Program'] = ProgramExpressionHandler;
handlers['AssignmentExpression'] = AssignmentExpressionHandler;
handlers['FunctionDeclaration'] = FunctionDeclarationHandler;
handlers['VariableDeclaration'] = VariableDeclarationHandler;
handlers['WhileStatement'] = WhileStatementHandler;
handlers['IfStatement'] = IfStatementHandler;
handlers['ReturnStatement'] = ReturnStatementHandler;
handlers['BlockStatement'] = BlockStatementHandler;
handlers['ExpressionStatement'] = ExpressionStatementHandler;
handlers['BinaryExpression'] = BinaryExpressionHandler;
handlers['Identifier'] = IdentifierHandler;
handlers['MemberExpression'] = MemberExpressionHandler;
let env = new Map();
env.clear();
let while_test = [];

function substitute(node) {
    if (node)
        return types.includes(node.type) ? handlers[node.type](node) : node;
}

function filterBody(body) {
    return body.filter(expr => expr.type !== 'EmptyStatement' && !(expr.type === 'ExpressionStatement' && expr.expression.type === 'EmptyStatement'));
}

function IdentifierHandler(node) {
    return env.has(node.name) ? env.get(node.name) : node;
}

function ProgramExpressionHandler(node) {
    env = new Map();
    node.body = node.body.map(expr => substitute(expr));
    node.body = filterBody(node.body);
    return node;
}

function BinaryExpressionHandler(node) {
    node.left = substitute(node.left);
    node.right = substitute(node.right);
    return node;
}

function AssignmentExpressionHandler(node) {
    node.right = substitute(node.right);
    let name = node.left.name;
    env.set(node.left.name, node.right);
    return while_test.includes(name) ? node : parseCode(';').body[0]; //EmptyStatement

}

function FunctionDeclarationHandler(node) {
    let current_env = env;
    env = new Map(env);
    node.params.forEach(param => env.set(param.name, param));
    node.body = substitute(node.body);
    env = current_env;
    return node;

}

function VariableDeclarationHandler(node) {
    node.declarations.forEach(decl => env.set(decl.id.name, substitute(decl.init)));
    return parseCode(';').body[0]; //EmptyStatement
}

function WhileStatementHandler(node) {
    let current_env = env;
    env = new Map(env);
    node.test = substitute(node.test);
    while_test = escodegen.generate(node.test).toString().split(' ');
    node.body = substitute(node.body);
    env = current_env;
    while_test = [];
    return node;
}

function IfStatementHandler(node) {
    node.test = substitute(node.test);
    let current_env = env;
    env = new Map(env);
    node.consequent = substitute(node.consequent);
    env = current_env;
    env = new Map(env);
    node.alternate = node.alternate ? substitute(node.alternate) : node.alternate;
    env = current_env;
    return node;
}

function ReturnStatementHandler(node) {
    node.argument = substitute(node.argument);
    return node;
}

function BlockStatementHandler(node) {
    node.body = node.body.map(sub_node => substitute(sub_node));
    node.body = filterBody(node.body);
    return node;
}

function ExpressionStatementHandler(node) {
    node.expression = substitute(node.expression);
    return node;
}

function MemberExpressionHandler(node) {
    let arr = escodegen.generate(node.object);
    node.property = substitute(node.property);
    if (env.has(arr) && env.get(arr).type === 'ArrayExpression') {
        node = substitute(env.get(arr).elements[escodegen.generate(node.property)]);
    }
    return node;
}

let green = [];
let red = [];

function paintCode(code, paramValues) {
    red = [];
    green = [];
    let paramValuesArr = extractParamValues(paramValues);
    insertToColorArrs(code, paramValuesArr);
    let result = '';
    let codeArr = code.split('\n');
    for (let i = 0; i < codeArr.length; i++) {
        if (green.includes(i))
            result += '<p><mark style="background-color:lawngreen">' + codeArr[i] + '</mark></p>';
        else if (red.includes(i))
            result += '<p><mark style="background-color:red">' + codeArr[i] + '</mark></p>';
        else
            result += '<p>' + codeArr[i] + '</p>';
    }
    return result;
}
function extractParamValues(paramValues){
    let paramValuesArr = parseCode(paramValues).body[0];
    if (!paramValuesArr) {
        paramValuesArr = [];
    } else {
        if (paramValuesArr.expression.type === 'SequenceExpression') {
            paramValuesArr = paramValuesArr.expression.expressions;
        } else {
            paramValuesArr = [paramValuesArr.expression];
        }
    }
    return paramValuesArr;
}
function insertToColorArrs(code, paramValues) {
    let codeAst = esprima.parseScript(code, {loc: true});
    let map_param_to_value = new Map();
    walk(codeAst, function (node) {
        if (node.type === 'FunctionDeclaration') {
            node.params.reverse().forEach(param =>
                map_param_to_value.set(param.name, escodegen.generate(paramValues.pop())));
        }
        if (node.type === 'IfStatement') {
            if (eval(replaceParams(escodegen.generate(node.test), map_param_to_value))) {
                green.push(node.loc.start.line - 1);
                paintRedAlternates(node.alternate);
            } else {
                red.push(node.loc.start.line - 1);
            }
        }
    });
    green = green.filter(x => !red.includes(x));
}

function replaceParams(toReplace, paramValues) {
    let iterator = paramValues.keys();
    let res = toReplace;
    for (let key of iterator) {
        res = res.replace(new RegExp(key,'g'), paramValues.get(key));
    }
    return res;
}

function paintRedAlternates(node) {
    if (node && node.type === 'IfStatement') {
        red.push(node.loc.start.line - 1);
        paintRedAlternates(node.alternate);
    }
}

export {parseCode, substitute, paintCode};

