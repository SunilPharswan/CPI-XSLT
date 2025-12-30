// Main application logic for CPI XSLT Editor
import * as monaco from 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/+esm';
import { validateXSLT } from './validation.js';

let xmlEditor, xsltEditor, outputEditor;
let consoleMessages = [];
let isConsoleCollapsed = false;

// XML Pretty Print function
function prettyPrintXML(xml) {
    let formatted = '';
    let indent = 0;
    const tab = '    '; // 4 spaces

    // First, normalize whitespace
    xml = xml.replace(/>\s+</g, '><').replace(/<\s+/g, '<').replace(/\s+>/g, '>').trim();

    // Split into tokens: tags and text
    const tokens = xml.split(/(<[^>]*>)/).filter(token => token.trim());

    let i = 0;
    while (i < tokens.length) {
        let token = tokens[i].trim();
        if (!token) {
            i++;
            continue;
        }

        if (token.startsWith('</')) {
            // Closing tag
            indent = Math.max(0, indent - 1);
            formatted += tab.repeat(indent) + token + '\n';
        } else if (token.startsWith('<') && token.endsWith('/>')) {
            // Self-closing tag
            formatted += tab.repeat(indent) + token + '\n';
        } else if (token.startsWith('<') && !token.includes('?>')) {
            // Opening tag - check if it has simple text content
            const openingTag = token;
            const nextToken = tokens[i + 1]?.trim();
            const afterNext = tokens[i + 2]?.trim();

            if (nextToken && !nextToken.startsWith('<') && afterNext && afterNext.startsWith('</')) {
                // Simple text content - keep on same line
                const textContent = nextToken;
                const closingTag = afterNext;
                formatted += tab.repeat(indent) + openingTag + textContent + closingTag + '\n';
                i += 2; // Skip the next two tokens
            } else {
                // Complex content - normal formatting
                formatted += tab.repeat(indent) + token + '\n';
                indent++;
            }
        } else if (token.startsWith('<?')) {
            // Processing instruction
            formatted += tab.repeat(indent) + token + '\n';
        } else {
            // Text content (for complex cases)
            formatted += tab.repeat(indent) + token + '\n';
        }
        i++;
    }

    return formatted.trim();
}

// Console management functions
function addConsoleMessage(type, message, details = '') {
    const timestamp = new Date().toLocaleTimeString();
    const messageObj = {
        type,
        message,
        details,
        timestamp,
        id: Date.now() + Math.random()
    };

    consoleMessages.push(messageObj);
    updateConsoleDisplay();
    updateErrorCount();
}

function clearConsole() {
    consoleMessages = [];
    updateConsoleDisplay();
    updateErrorCount();
}

function toggleConsole() {
    isConsoleCollapsed = !isConsoleCollapsed;
    const consoleContent = document.getElementById('console-content');
    const toggleBtn = document.getElementById('toggle-console');

    if (isConsoleCollapsed) {
        consoleContent.classList.add('collapsed');
        toggleBtn.classList.add('rotated');
    } else {
        consoleContent.classList.remove('collapsed');
        toggleBtn.classList.remove('rotated');
    }
}

function updateConsoleDisplay() {
    const consoleOutput = document.getElementById('console-output');
    const welcomeMsg = document.querySelector('.console-welcome');

    if (consoleMessages.length === 0) {
        consoleOutput.innerHTML = '<div class="console-welcome">Console ready. Transformation errors and runtime problems will appear here.</div>';
        return;
    }

    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    consoleOutput.innerHTML = consoleMessages.map(msg => `
        <div class="console-message ${msg.type}">
            <div class="timestamp">${msg.timestamp}</div>
            <div class="content">${msg.message}${msg.details ? '\n' + msg.details : ''}</div>
        </div>
    `).join('');

    // Auto-scroll to bottom
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function updateErrorCount() {
    const errorCount = consoleMessages.filter(msg => msg.type === 'error').length;
    const errorCountEl = document.getElementById('error-count');
    errorCountEl.textContent = errorCount;
    errorCountEl.setAttribute('data-count', errorCount);
}

// Wait for DOM to be ready before initializing Monaco
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Monaco Editor...');
    console.log('Examples available:', examples);

    // Define custom theme to match the dark design
    monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: 'comment', foreground: '64748b' },
            { token: 'keyword', foreground: 'c792ea' },
            { token: 'string', foreground: 'c3e88d' },
            { token: 'number', foreground: 'f78c6c' }
        ],
        colors: {
            'editor.background': '#1a1a2e',
            'editor.foreground': '#e2e8f0',
            'editor.lineHighlightBackground': '#16213e',
            'editor.selectionBackground': '#334155',
            'editorCursor.foreground': '#6366f1'
        }
    });

    initializeEditors();
});

function initializeEditors() {
    console.log('Initializing Monaco editors...');

    // Check if SaxonJS2.js loaded correctly
    if (typeof SaxonJS === 'undefined') {
        console.error("Library not found in /lib/SaxonJS2.js");
        return;
    }

    // Setup Monaco Editors with default values
    const xmlOptions = {
        value: `<?xml version="1.0" encoding="UTF-8"?>
<data>
    <user id="1" role="admin">Alice</user>
    <user id="2" role="editor">Bob</user>
</data>`,
        language: 'xml',
        theme: 'custom-dark',
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true
    };

    const xsltOptions = {
        value: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <report date="{current-date()}">
            <xsl:apply-templates select="//user"/>
        </report>
    </xsl:template>

    <xsl:template match="user">
        <entry name="{.}" type="{@role}"/>
    </xsl:template>
</xsl:stylesheet>`,
        language: 'xml',
        theme: 'custom-dark',
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true
    };

    const outputOptions = {
        value: "Press Run to see results...",
        language: 'xml',
        theme: 'custom-dark',
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        minimap: { enabled: false },
        wordWrap: 'on',
        tabSize: 2,
        insertSpaces: true,
        readOnly: true
    };

    // Register XML formatter
    monaco.languages.registerDocumentFormattingEditProvider('xml', {
        provideDocumentFormattingEdits: function(model) {
            const xml = model.getValue();
            const formatted = prettyPrintXML(xml);
            return [{
                range: model.getFullModelRange(),
                text: formatted
            }];
        }
    });

    console.log('Creating XML editor...');
    xmlEditor = monaco.editor.create(document.getElementById('xml-editor'), xmlOptions);
    console.log('Creating XSLT editor...');
    xsltEditor = monaco.editor.create(document.getElementById('xslt-editor'), xsltOptions);
    console.log('Creating output editor...');
    outputEditor = monaco.editor.create(document.getElementById('output-editor'), outputOptions);

    // Add keyboard shortcuts
    xmlEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        document.getElementById('run-btn').click();
    });
    xsltEditor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        document.getElementById('run-btn').click();
    });

    console.log('Monaco editors initialized with default demo data');

    // Add console control event listeners
    document.getElementById('clear-console').addEventListener('click', clearConsole);
    document.getElementById('toggle-console').addEventListener('click', toggleConsole);

    // Add real-time validation
    xsltEditor.onDidChangeModelContent(() => {
        validateXSLT(xsltEditor, monaco);
    });

    // Initial validation
    validateXSLT(xsltEditor, monaco);

    // The Transformation Logic
    document.getElementById('run-btn').addEventListener('click', async () => {
        const runBtn = document.getElementById('run-btn');
        const originalText = runBtn.textContent;

        // Add loading state
        runBtn.textContent = "⏳ PROCESSING...";
        runBtn.disabled = true;
        runBtn.classList.add('loading');

        outputEditor.setValue("🔄 Transforming XML...");
        addConsoleMessage('info', 'Transformation: Starting XSLT processing...');

        try {
            const result = SaxonJS.XPath.evaluate(`
                transform(map {
                    'stylesheet-text' : $xslt,
                    'source-node' : parse-xml($xml),
                    'delivery-format' : 'serialized'
                })?output`,
                [],
                {
                    params: {
                        xslt: xsltEditor.getValue(),
                        xml: xmlEditor.getValue()
                    }
                }
            );

            outputEditor.setValue(result);
            addConsoleMessage('success', 'Transformation: Completed successfully');

        } catch (err) {
            console.error(err);
            const errorMessage = err.message || 'Unknown transformation error';
            outputEditor.setValue("❌ Transformation Error:\n" + errorMessage);
            addConsoleMessage('error', `Transformation: ${errorMessage}`);
        } finally {
            // Reset button state
            runBtn.textContent = originalText;
            runBtn.disabled = false;
            runBtn.classList.remove('loading');
        }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    downloadResult();
                    break;
                case 'p':
                    e.preventDefault();
                    formatAll();
                    break;
            }
        }
    });

    // Example selector
    document.getElementById('example-select').addEventListener('change', (e) => {
        const selectedExample = e.target.value;
        if (selectedExample && examples[selectedExample]) {
            xmlEditor.setValue(examples[selectedExample].xml);
            xsltEditor.setValue(examples[selectedExample].xslt);
            outputEditor.setValue("Example loaded! Press Run to see results...");
        }
    });
}

// Formatting Tool
function formatAll() {
    const format = (v) => v.replace(/>\s*</g, '><').replace(/<([^?\/!][^>]*?)\/>/g, '<$1 />').replace(/>(?=<)/g, '>\n');
    xmlEditor.setValue(format(xmlEditor.getValue()));
    xsltEditor.setValue(format(xsltEditor.getValue()));
}

// Per-section formatting using Monaco's built-in formatter
function formatXML() {
    xmlEditor.trigger('', 'editor.action.formatDocument');
}

function formatXSLT() {
    xsltEditor.trigger('', 'editor.action.formatDocument');
}

function formatOutput() {
    // Temporarily make output editable for formatting
    outputEditor.updateOptions({ readOnly: false });
    outputEditor.trigger('', 'editor.action.formatDocument');
    // Make it read-only again after a short delay
    setTimeout(() => {
        outputEditor.updateOptions({ readOnly: true });
    }, 100);
}

// Download Tool
function downloadResult() {
    downloadContent(outputEditor.getValue(), 'result.xml');
}

// Per-section download
function downloadXML() {
    downloadContent(xmlEditor.getValue(), 'xml-input.xml');
}

function downloadXSLT() {
    downloadContent(xsltEditor.getValue(), 'xslt-stylesheet.xsl');
}

function downloadOutput() {
    downloadContent(outputEditor.getValue(), 'output.xml');
}

// General download function
function downloadContent(text, filename) {
    const blob = new Blob([text], {type: "text/xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Make functions global for onclick handlers
window.formatXML = formatXML;
window.formatXSLT = formatXSLT;
window.formatOutput = formatOutput;
window.downloadXML = downloadXML;
window.downloadXSLT = downloadXSLT;
window.downloadOutput = downloadOutput;
