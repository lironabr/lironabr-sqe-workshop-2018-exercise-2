import $ from 'jquery';
import * as escodegen from 'escodegen';
import {parseCode,substitute,paintCode} from './code-analyzer';


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        let substituted_ast= substitute(parsedCode);
        let code=escodegen.generate(substituted_ast);
        let params=$('#paramsPlaceholder').val();
        let painted_code=paintCode(code,params);
        $('#parsedCode').empty().append(painted_code);
    });
});

