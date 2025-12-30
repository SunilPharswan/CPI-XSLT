// XSLT and XML validation functions for CPI XSLT Editor

// Export validation functions for use in modules
export { validateXSLT, validateXMLStructure, validateXSLTSyntax, validateXPathExpressions, validateXPathSyntax, getXSLTElements, getXSLTElementAttributes, getAttributeDocumentation, getXPathFunctions };

// XSLT Validation Function
function validateXSLT(editor, monaco) {
    const model = editor.getModel();
    if (!model) return;

    const content = model.getValue();
    const markers = [];

    // Basic XML well-formedness check
    const xmlErrors = validateXMLStructure(content, monaco);
    markers.push(...xmlErrors);

    // XSLT-specific validation
    const xsltErrors = validateXSLTSyntax(content);
    markers.push(...xsltErrors);

    // XPath expression validation
    const xpathErrors = validateXPathExpressions(content);
    markers.push(...xpathErrors);

    // Only set warning markers (no red error underscores)
    const warningMarkers = markers.filter(marker => marker.severity === monaco.MarkerSeverity.Warning);
    monaco.editor.setModelMarkers(model, 'xslt', warningMarkers);
}

// Validate basic XML structure
function validateXMLStructure(content, monaco) {
    const errors = [];
    const lines = content.split('\n');

    // Check for unclosed tags
    const tagStack = [];
    // Updated regex to be more robust with tag name extraction
    const tagRegex = /<\/?([a-zA-Z_:][\w:.-]*)(?:\s[^>]*)?>/g;
    let match;
    let lineNum = 0;

    while ((match = tagRegex.exec(content)) !== null) {
        const tag = match[0];
        const tagName = match[1];
        const charIndex = match.index;

        // Skip if tagName is empty (shouldn't happen with our regex, but safety check)
        if (!tagName || tagName.trim() === '') {
            continue;
        }

        // Find which line this tag is on
        let currentLineStart = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineEnd = currentLineStart + lines[i].length + 1; // +1 for newline
            if (charIndex >= currentLineStart && charIndex < lineEnd) {
                lineNum = i;
                break;
            }
            currentLineStart = lineEnd;
        }

        if (tag.startsWith('</')) {
            // Closing tag
            if (tagStack.length === 0) {
                errors.push({
                    severity: monaco.MarkerSeverity.Error,
                    message: `Unexpected closing tag </${tagName}>`,
                    startLineNumber: lineNum + 1,
                    startColumn: charIndex - content.lastIndexOf('\n', charIndex) + 1,
                    endLineNumber: lineNum + 1,
                    endColumn: charIndex - content.lastIndexOf('\n', charIndex) + tag.length + 1
                });
            } else {
                const lastTag = tagStack.pop();
                if (lastTag !== tagName) {
                    errors.push({
                        severity: monaco.MarkerSeverity.Error,
                        message: `Mismatched tags: expected </${lastTag}>, found </${tagName}>`,
                        startLineNumber: lineNum + 1,
                        startColumn: charIndex - content.lastIndexOf('\n', charIndex) + 1,
                        endLineNumber: lineNum + 1,
                        endColumn: charIndex - content.lastIndexOf('\n', charIndex) + tag.length + 1
                    });
                }
            }
        } else if (!tag.endsWith('/>')) {
            // Opening tag (not self-closing)
            tagStack.push(tagName);
        }
        // Self-closing tags like <br/> are ignored (not pushed to stack)
    }

    // Check for unclosed tags at end
    while (tagStack.length > 0) {
        const unclosedTag = tagStack.pop();
        errors.push({
            severity: monaco.MarkerSeverity.Error,
            message: `Unclosed tag <${unclosedTag}>`,
            startLineNumber: lines.length,
            startColumn: 1,
            endLineNumber: lines.length,
            endColumn: lines[lines.length - 1].length + 1
        });
    }

    return errors;
}

// Validate XSLT-specific syntax
function validateXSLTSyntax(content) {
    const errors = [];
    const lines = content.split('\n');

    // Check for required xsl:stylesheet or xsl:transform root element
    const rootMatch = content.match(/<(\w+:)?stylesheet[^>]*>|<(\w+:)?transform[^>]*>/);
    if (!rootMatch && content.trim().length > 0) {
        errors.push({
            severity: monaco.MarkerSeverity.Warning,
            message: 'XSLT document should start with <xsl:stylesheet> or <xsl:transform>',
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: content.indexOf('>') + 1 || content.length + 1
        });
    }

    // Check for missing namespace declaration
    if (!content.includes('xmlns:xsl="http://www.w3.org/1999/XSL/Transform"') &&
        !content.includes("xmlns:xsl='http://www.w3.org/1999/XSL/Transform'")) {
        errors.push({
            severity: monaco.MarkerSeverity.Warning,
            message: 'Missing XSL namespace declaration',
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: 1,
            endColumn: Math.min(50, content.length + 1)
        });
    }

    // Check for xsl:template without match or name attribute
    const templateRegex = /<xsl:template([^>]*)>/g;
    let templateMatch;
    while ((templateMatch = templateRegex.exec(content)) !== null) {
        const attrs = templateMatch[1];
        if (!attrs.includes('match=') && !attrs.includes('name=')) {
            const charIndex = templateMatch.index;
            let lineNum = 0;
            while (lineNum < lines.length && charIndex >= content.indexOf(lines[lineNum], charIndex - templateMatch[0].length)) {
                lineNum++;
            }
            lineNum = Math.max(0, lineNum - 1);

            errors.push({
                severity: monaco.MarkerSeverity.Error,
                message: 'xsl:template must have either match or name attribute',
                startLineNumber: lineNum + 1,
                startColumn: charIndex - content.lastIndexOf('\n', charIndex) + 1,
                endLineNumber: lineNum + 1,
                endColumn: charIndex - content.lastIndexOf('\n', charIndex) + templateMatch[0].length + 1
            });
        }
    }

    return errors;
}

// Validate XPath expressions
function validateXPathExpressions(content) {
    const errors = [];
    const lines = content.split('\n');

    // Find XPath expressions in select, test, and match attributes
    const xpathAttrs = ['select', 'test', 'match'];
    const attrRegex = new RegExp(`(${xpathAttrs.join('|')})\\s*=\\s*["']([^"']*)["']`, 'gi');

    let attrMatch;
    while ((attrMatch = attrRegex.exec(content)) !== null) {
        const attrName = attrMatch[1];
        const xpathExpr = attrMatch[2];
        const charIndex = attrMatch.index;

        let lineNum = 0;
        while (lineNum < lines.length && charIndex >= content.indexOf(lines[lineNum], charIndex - attrMatch[0].length)) {
            lineNum++;
        }
        lineNum = Math.max(0, lineNum - 1);

        // Basic XPath validation
        const xpathErrors = validateXPathSyntax(xpathExpr);
        if (xpathErrors.length > 0) {
            errors.push({
                severity: monaco.MarkerSeverity.Error,
                message: `Invalid XPath in ${attrName} attribute: ${xpathErrors[0]}`,
                startLineNumber: lineNum + 1,
                startColumn: charIndex - content.lastIndexOf('\n', charIndex) + attrMatch[0].indexOf('"') + 1,
                endLineNumber: lineNum + 1,
                endColumn: charIndex - content.lastIndexOf('\n', charIndex) + attrMatch[0].indexOf('"') + xpathExpr.length + 2
            });
        }
    }

    return errors;
}

// Basic XPath syntax validation
function validateXPathSyntax(xpath) {
    const errors = [];

    try {
        // Check for balanced brackets
        let bracketCount = 0;
        let inString = false;
        let stringChar = '';
        let inComment = false;

        for (let i = 0; i < xpath.length; i++) {
            const char = xpath[i];
            const nextChar = xpath[i + 1] || '';

            // Handle strings
            if (!inString && !inComment && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && xpath[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            }
            // Skip comments (basic handling)
            else if (!inString && char === '(' && nextChar === ':') {
                // This is a simplified comment detection
                // XPath comments are (: ... :) but this is complex to parse
            }

            // Only check brackets when not in strings or comments
            if (!inString && !inComment) {
                if (char === '[') bracketCount++;
                if (char === ']') bracketCount--;
                if (bracketCount < 0) {
                    errors.push('Unmatched closing bracket');
                    break;
                }
            }
        }
        if (bracketCount > 0) {
            errors.push('Unmatched opening bracket');
        }

        // Check for balanced parentheses
        let parenCount = 0;
        inString = false;
        stringChar = '';

        for (let i = 0; i < xpath.length; i++) {
            const char = xpath[i];

            // Handle strings
            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
            } else if (inString && char === stringChar && xpath[i - 1] !== '\\') {
                inString = false;
                stringChar = '';
            }

            // Only check parentheses when not in strings
            if (!inString) {
                if (char === '(') parenCount++;
                if (char === ')') parenCount--;
                if (parenCount < 0) {
                    errors.push('Unmatched closing parenthesis');
                    break;
                }
            }
        }
        if (parenCount > 0) {
            errors.push('Unmatched opening parenthesis');
        }

        // More lenient character validation - allow more XPath characters
        const cleanedXPath = xpath.replace(/'.*?'|".*?"/g, ''); // Remove strings
        if (/[^\w\s.\-/@\[\]\(\)\*\+\|!=<>&:,]/.test(cleanedXPath)) {
            // Allow common XPath characters, but flag obviously wrong ones
            const invalidChars = cleanedXPath.match(/[^\w\s.\-/@\[\]\(\)\*\+\|!=<>&:,]/g);
            if (invalidChars && invalidChars.some(char => !['/', '#', '$', '?', '^'].includes(char))) {
                errors.push('Potentially invalid characters in XPath expression');
            }
        }

    } catch (e) {
        // If validation fails, don't report XPath errors
        return [];
    }

    return errors;
}

// Helper functions for XSLT IntelliSense
function getXSLTElements() {
    return [
        {
            name: 'stylesheet',
            snippet: 'stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">\n\t$1\n</stylesheet>',
            documentation: 'Root element of XSLT stylesheet'
        },
        {
            name: 'template',
            snippet: 'template match="$1">\n\t$2\n</template>',
            documentation: 'Defines a template rule'
        },
        {
            name: 'for-each',
            snippet: 'for-each select="$1">\n\t$2\n</for-each>',
            documentation: 'Iterates over a sequence of items'
        },
        {
            name: 'if',
            snippet: 'if test="$1">\n\t$2\n</if>',
            documentation: 'Conditional processing'
        },
        {
            name: 'choose',
            snippet: 'choose>\n\t<xsl:when test="$1">\n\t\t$2\n\t</xsl:when>\n\t<xsl:otherwise>\n\t\t$3\n\t</xsl:otherwise>\n</choose>',
            documentation: 'Multiple conditional processing'
        },
        {
            name: 'when',
            snippet: 'when test="$1">\n\t$2\n</when>',
            documentation: 'When condition in choose'
        },
        {
            name: 'otherwise',
            snippet: 'otherwise>\n\t$1\n</otherwise>',
            documentation: 'Otherwise condition in choose'
        },
        {
            name: 'value-of',
            snippet: 'value-of select="$1"/>',
            documentation: 'Outputs the value of an expression'
        },
        {
            name: 'copy-of',
            snippet: 'copy-of select="$1"/>',
            documentation: 'Copies a node and its descendants'
        },
        {
            name: 'apply-templates',
            snippet: 'apply-templates select="$1"/>',
            documentation: 'Applies templates to selected nodes'
        },
        {
            name: 'call-template',
            snippet: 'call-template name="$1"/>',
            documentation: 'Calls a named template'
        },
        {
            name: 'variable',
            snippet: 'variable name="$1" select="$2"/>',
            documentation: 'Declares a variable'
        },
        {
            name: 'param',
            snippet: 'param name="$1" select="$2"/>',
            documentation: 'Declares a parameter'
        },
        {
            name: 'output',
            snippet: 'output method="$1" indent="yes"/>',
            documentation: 'Controls the format of the output'
        }
    ];
}

function getXSLTElementAttributes(elementName) {
    const attributeMap = {
        'template': ['match', 'name', 'mode', 'priority'],
        'for-each': ['select'],
        'if': ['test'],
        'when': ['test'],
        'value-of': ['select', 'disable-output-escaping'],
        'copy-of': ['select'],
        'apply-templates': ['select', 'mode'],
        'call-template': ['name'],
        'variable': ['name', 'select'],
        'param': ['name', 'select'],
        'output': ['method', 'version', 'encoding', 'omit-xml-declaration', 'standalone', 'doctype-public', 'doctype-system', 'indent', 'media-type'],
        'stylesheet': ['version', 'xmlns:xsl']
    };
    return attributeMap[elementName] || [];
}

function getAttributeDocumentation(elementName, attributeName) {
    const docs = {
        'template': {
            'match': 'Pattern to match nodes',
            'name': 'Name of the template for call-template',
            'mode': 'Mode to apply this template in',
            'priority': 'Priority of this template rule'
        },
        'for-each': {
            'select': 'XPath expression selecting nodes to iterate over'
        },
        'if': {
            'test': 'Boolean expression for conditional processing'
        },
        'value-of': {
            'select': 'XPath expression to evaluate',
            'disable-output-escaping': 'Whether to disable output escaping'
        },
        'variable': {
            'name': 'Name of the variable',
            'select': 'XPath expression for variable value'
        }
    };
    return docs[elementName]?.[attributeName] || `Attribute for ${elementName} element`;
}

function getXPathFunctions() {
    return [
        {
            name: 'count()',
            snippet: 'count($1)',
            documentation: 'Returns the number of items in a sequence'
        },
        {
            name: 'string()',
            snippet: 'string($1)',
            documentation: 'Converts to string'
        },
        {
            name: 'number()',
            snippet: 'number($1)',
            documentation: 'Converts to number'
        },
        {
            name: 'boolean()',
            snippet: 'boolean($1)',
            documentation: 'Converts to boolean'
        },
        {
            name: 'current-date()',
            snippet: 'current-date()',
            documentation: 'Returns the current date'
        },
        {
            name: 'current-time()',
            snippet: 'current-time()',
            documentation: 'Returns the current time'
        },
        {
            name: 'current-dateTime()',
            snippet: 'current-dateTime()',
            documentation: 'Returns the current date and time'
        },
        {
            name: 'position()',
            snippet: 'position()',
            documentation: 'Returns the position of the current node'
        },
        {
            name: 'last()',
            snippet: 'last()',
            documentation: 'Returns the size of the context'
        },
        {
            name: 'name()',
            snippet: 'name()',
            documentation: 'Returns the name of the current node'
        },
        {
            name: 'local-name()',
            snippet: 'local-name()',
            documentation: 'Returns the local name of the current node'
        },
        {
            name: 'namespace-uri()',
            snippet: 'namespace-uri()',
            documentation: 'Returns the namespace URI of the current node'
        },
        {
            name: 'text()',
            snippet: 'text()',
            documentation: 'Selects text nodes'
        },
        {
            name: 'node()',
            snippet: 'node()',
            documentation: 'Selects any node'
        },
        {
            name: 'comment()',
            snippet: 'comment()',
            documentation: 'Selects comment nodes'
        },
        {
            name: 'processing-instruction()',
            snippet: 'processing-instruction()',
            documentation: 'Selects processing instruction nodes'
        }
    ];
}
