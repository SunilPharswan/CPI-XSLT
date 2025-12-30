// XSLT and XML validation functions for CPI XSLT Editor

// Export validation functions for use in modules
export { validateXSLT };

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
