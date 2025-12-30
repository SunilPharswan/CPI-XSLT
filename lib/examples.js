// XSLT Examples Data
const examples = {
    blank: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <message>
        <!-- Your input XML here -->
    </message>
</root>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:template match="/">
		<!-- TODO: Auto-generated template -->
	</xsl:template>
</xsl:stylesheet>`
    },
    basic: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<data>
    <user id="1" role="admin">Alice</user>
    <user id="2" role="editor">Bob</user>
    <user id="3" role="user">Charlie</user>
</data>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <report date="{current-date()}">
            <xsl:apply-templates select="//user"/>
        </report>
    </xsl:template>

    <xsl:template match="user">
        <entry name="{.}" type="{@role}" id="{@id}"/>
    </xsl:template>
</xsl:stylesheet>`
    },
    html: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<library>
    <book id="1">
        <title>XSLT 3.0 Guide</title>
        <author>John Doe</author>
        <year>2023</year>
        <genre>Technical</genre>
    </book>
    <book id="2">
        <title>Modern Web Development</title>
        <author>Jane Smith</author>
        <year>2022</year>
        <genre>Web</genre>
    </book>
    <book id="3">
        <title>Data Processing</title>
        <author>Bob Johnson</author>
        <year>2021</year>
        <genre>Technical</genre>
    </book>
</library>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <html>
            <head>
                <title>Book Library</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                </style>
            </head>
            <body>
                <h1>Book Library Collection</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Author</th>
                            <th>Year</th>
                            <th>Genre</th>
                        </tr>
                    </thead>
                    <tbody>
                        <xsl:apply-templates select="//book"/>
                    </tbody>
                </table>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="book">
        <tr>
            <td><xsl:value-of select="title"/></td>
            <td><xsl:value-of select="author"/></td>
            <td><xsl:value-of select="year"/></td>
            <td><xsl:value-of select="genre"/></td>
        </tr>
    </xsl:template>
</xsl:stylesheet>`
    },
    filter: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<employees>
    <employee id="1">
        <name>Alice Johnson</name>
        <department>Engineering</department>
        <salary>75000</salary>
        <status>active</status>
    </employee>
    <employee id="2">
        <name>Bob Smith</name>
        <department>Marketing</department>
        <salary>65000</salary>
        <status>active</status>
    </employee>
    <employee id="3">
        <name>Charlie Brown</name>
        <department>Engineering</department>
        <salary>80000</salary>
        <status>inactive</status>
    </employee>
    <employee id="4">
        <name>Diana Prince</name>
        <department>HR</department>
        <salary>70000</salary>
        <status>active</status>
    </employee>
</employees>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <filtered-employees>
            <!-- Filter: Engineering department, active status, salary > 70000 -->
            <xsl:apply-templates select="//employee[
                department = 'Engineering' and
                status = 'active' and
                salary > 70000
            ]"/>
        </filtered-employees>
    </xsl:template>

    <xsl:template match="employee">
        <high-earning-engineer>
            <name><xsl:value-of select="name"/></name>
            <salary currency="USD"><xsl:value-of select="salary"/></salary>
            <department><xsl:value-of select="department"/></department>
        </high-earning-engineer>
    </xsl:template>
</xsl:stylesheet>`
    },
    group: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<sales>
    <sale>
        <product>Widget A</product>
        <category>Electronics</category>
        <amount>150.00</amount>
        <date>2023-01-15</date>
    </sale>
    <sale>
        <product>Widget B</product>
        <category>Electronics</category>
        <amount>200.00</amount>
        <date>2023-01-16</date>
    </sale>
    <sale>
        <product>Book X</product>
        <category>Books</category>
        <amount>25.00</amount>
        <date>2023-01-15</date>
    </sale>
    <sale>
        <product>Book Y</product>
        <category>Books</category>
        <amount>30.00</amount>
        <date>2023-01-17</date>
    </sale>
    <sale>
        <product>Tool Z</product>
        <category>Tools</category>
        <amount>75.00</amount>
        <date>2023-01-16</date>
    </sale>
</sales>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="xml" indent="yes"/>

    <xsl:template match="/">
        <sales-summary>
            <xsl:for-each-group select="//sale" group-by="category">
                <category-group name="{current-grouping-key()}">
                    <total-sales><xsl:value-of select="sum(current-group()//amount)"/></total-sales>
                    <transaction-count><xsl:value-of select="count(current-group())"/></transaction-count>
                    <products>
                        <xsl:apply-templates select="current-group()"/>
                    </products>
                </category-group>
            </xsl:for-each-group>
        </sales-summary>
    </xsl:template>

    <xsl:template match="sale">
        <product>
            <name><xsl:value-of select="product"/></name>
            <amount><xsl:value-of select="amount"/></amount>
            <date><xsl:value-of select="date"/></date>
        </product>
    </xsl:template>
</xsl:stylesheet>`
    },
    json: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<api-response>
    <status>success</status>
    <data>
        <user id="123">
            <username>john_doe</username>
            <email>john@example.com</email>
            <profile>
                <firstName>John</firstName>
                <lastName>Doe</lastName>
                <age>30</age>
            </profile>
        </user>
        <user id="124">
            <username>jane_smith</username>
            <email>jane@example.com</email>
            <profile>
                <firstName>Jane</firstName>
                <lastName>Smith</lastName>
                <age>28</age>
            </profile>
        </user>
    </data>
</api-response>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="text" indent="yes"/>

    <xsl:template match="/">
        <xsl:text>{</xsl:text>
        <xsl:text>"status": "</xsl:text><xsl:value-of select="//status"/><xsl:text>",</xsl:text>
        <xsl:text>"users": [</xsl:text>
        <xsl:apply-templates select="//user"/>
        <xsl:text>]</xsl:text>
        <xsl:text>}</xsl:text>
    </xsl:template>

    <xsl:template match="user">
        <xsl:if test="position() > 1"><xsl:text>,</xsl:text></xsl:if>
        <xsl:text>{</xsl:text>
        <xsl:text>"id": </xsl:text><xsl:value-of select="@id"/><xsl:text>,</xsl:text>
        <xsl:text>"username": "</xsl:text><xsl:value-of select="username"/><xsl:text>",</xsl:text>
        <xsl:text>"email": "</xsl:text><xsl:value-of select="email"/><xsl:text>",</xsl:text>
        <xsl:text>"profile": {</xsl:text>
        <xsl:text>"firstName": "</xsl:text><xsl:value-of select="profile/firstName"/><xsl:text>",</xsl:text>
        <xsl:text>"lastName": "</xsl:text><xsl:value-of select="profile/lastName"/><xsl:text>",</xsl:text>
        <xsl:text>"age": </xsl:text><xsl:value-of select="profile/age"/>
        <xsl:text>}</xsl:text>
        <xsl:text>}</xsl:text>
    </xsl:template>
</xsl:stylesheet>`
    },
    complex: {
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<invoice id="INV-2023-001">
    <header>
        <invoice-number>INV-2023-001</invoice-number>
        <date>2023-12-15</date>
        <due-date>2024-01-15</due-date>
        <customer>
            <id>CUST-123</id>
            <name>Acme Corporation</name>
            <address>
                <street>123 Business St</street>
                <city>San Francisco</city>
                <state>CA</state>
                <zip>94105</zip>
            </address>
        </customer>
    </header>
    <items>
        <item>
            <product-code>PROD-001</product-code>
            <description>Professional Services</description>
            <quantity>40</quantity>
            <unit-price>125.00</unit-price>
            <tax-rate>0.0875</tax-rate>
        </item>
        <item>
            <product-code>PROD-002</product-code>
            <description>Software License</description>
            <quantity>1</quantity>
            <unit-price>5000.00</unit-price>
            <tax-rate>0.0875</tax-rate>
        </item>
    </items>
</invoice>`,
        xslt: `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="3.0">
    <xsl:output method="html" indent="yes"/>

    <xsl:template match="/">
        <html>
            <head>
                <title>Invoice <xsl:value-of select="//invoice-number"/></title>
                <style>
                    body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                    .invoice { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                    .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .company { font-size: 2em; font-weight: bold; color: #333; margin: 0; }
                    .invoice-details { display: flex; justify-content: space-between; margin-top: 20px; }
                    .customer-info { background: #f8f9fa; padding: 15px; border-radius: 5px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
                    th { background: #f8f9fa; font-weight: 600; }
                    .total { font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 20px; }
                    .amount { text-align: right; font-weight: 600; }
                </style>
            </head>
            <body>
                <div class="invoice">
                    <div class="header">
                        <h1 class="company">INVOICE</h1>
                        <div class="invoice-details">
                            <div>
                                <strong>Invoice #:</strong> <xsl:value-of select="//invoice-number"/><br/>
                                <strong>Date:</strong> <xsl:value-of select="//date"/><br/>
                                <strong>Due Date:</strong> <xsl:value-of select="//due-date"/>
                            </div>
                            <div class="customer-info">
                                <strong>Bill To:</strong><br/>
                                <xsl:value-of select="//customer/name"/><br/>
                                <xsl:value-of select="//customer/address/street"/><br/>
                                <xsl:value-of select="//customer/address/city"/>,
                                <xsl:value-of select="//customer/address/state"/>
                                <xsl:value-of select="//customer/address/zip"/>
                            </div>
                        </div>
                    </div>

                    <table>
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Tax</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <xsl:apply-templates select="//item"/>
                        </tbody>
                    </table>

                    <div class="total">
                        Total Amount: $<xsl:value-of select="format-number(sum(//item/(quantity * unit-price * (1 + tax-rate))), '#,##0.00')"/>
                    </div>
                </div>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="item">
        <tr>
            <td><xsl:value-of select="description"/></td>
            <td><xsl:value-of select="quantity"/></td>
            <td class="amount">$<xsl:value-of select="format-number(unit-price, '#,##0.00')"/></td>
            <td class="amount">$<xsl:value-of select="format-number(quantity * unit-price * tax-rate, '#,##0.00')"/></td>
            <td class="amount">$<xsl:value-of select="format-number(quantity * unit-price * (1 + tax-rate), '#,##0.00')"/></td>
        </tr>
    </xsl:template>
</xsl:stylesheet>`
    }
};

// Export for modules
window.examples = examples;
