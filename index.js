import * as cheerio from "cheerio";
import express from "express";
import cors from "cors"
const app = express();
const port = process.env.PORT || 8000;


app.use(cors())
app.use(express.json());

async function findID(url) { //retrn vuln
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);

        let urll = {
                mostback: null,
                back: null,
                front: null
        };
        const uri = $('#contentdiv > div > main > div.paging > a');
        uri.each((idx, element) => {
                const a = $(element).attr('href');
                if (uri.length === 3) {
                        urll.mostback = `https://www.cvedetails.com${$(uri[0]).attr('href')}`;
                        urll.back = `https://www.cvedetails.com${$(uri[1]).attr('href')}`;
                        urll.front = `https://www.cvedetails.com${$(uri[2]).attr('href')}`;
                }
                else if (uri.length === 1) {
                        urll.mostback = null;
                        urll.back = null;
                        urll.front = `https://www.cvedetails.com${$(uri[0]).attr('href')}`;
                }
        });


        const tableRows = $("#searchresults > div > div");
        const data = [];

        tableRows.each((index, row) => {
                const childDivs = $(row).children("div");

                if (childDivs.length >= 2) {
                        const firstDivChildren = $(childDivs[0]).children("div");
                        const firstDivData = firstDivChildren.map((i, el) => {
                                const text = $(el).text().trim();
                                const href = $(el).find('a').attr('href');

                                return { text, href: `https://www.cvedetails.com${href}` }
                        }).get();

                        const secondDivChildren = $(childDivs[1]).children("div");

                        let secondDivData = [];
                        secondDivChildren.each((i, el) => {
                                const innerDivs = $(el).children("div");

                                if (innerDivs.length >= 2) {
                                        // const nestedKey = $(innerDivs[0]).text().trim();
                                        let nestedValue;
                                        if (i === 0) {
                                                nestedValue = $(innerDivs[1]).children("div").text().trim();
                                        }
                                        else if (i === 1) {
                                                nestedValue = $(innerDivs[1]).children("span").text().trim();
                                        }
                                        else {
                                                nestedValue = $(innerDivs[1]).text().trim();
                                        }
                                        secondDivData.push(nestedValue);
                                }
                                else {
                                        secondDivData.push($(el).text().trim());
                                }
                        });

                        data.push({
                                firstDiv: firstDivData,
                                secondDiv: secondDivData
                        });
                }
        });
        let data1 = [];

        const sample = [];
        for (let i = 0; i < data.length; i++) {
                const currentDetail = data[i];
                const firstDivData = currentDetail.firstDiv;
                const secondDivData = currentDetail.secondDiv;

                const combinedData = {
                        firstDiv: firstDivData,
                        secondDiv: secondDivData
                };
                sample.push(combinedData);
        }
        data1.push(sample);
        data1.push(urll)
        return data1
}

async function findbyCvvId(url) {
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);

        let head = [];
        const tableHead = $('#contentdiv > div > main > div:nth-child(5) > div > table > thead > tr > th');
        tableHead.each((idx, col) => {
                const cellData = $(col).text().trim();
                head.push(cellData);
        });

        let foot = [];
        const tableBody = $('#contentdiv > div > main > div:nth-child(5) > div > table > tbody > tr');

        tableBody.each((rowIdx, row) => {
                let rowData = [];

                const tds = $(row).find('td');  // Find all td elements in the row
                tds.each((tdIdx, col) => {
                        const cellData = $(col).text().trim();  // Extract text content and trim it
                        rowData.push(cellData);  // Push the data to rowData array
                });

                foot.push(rowData);  // Push the rowData array to foot
        });

        return { head, foot }
}


async function fetchData(tool) {
        const response = await fetch(`https://www.cvedetails.com/product-search.php?vendor_id=0&search=${tool}`);
        const body = await response.text();
        const $ = cheerio.load(body);

        const tableRows = $("#contentdiv > div > main > div.table-responsive > table > tbody > tr");

        const data = [];

        for (let row of tableRows) {
                const columns = $(row).find("td");
                if (columns.length >= 6) {
                        const productColumn = $(columns[1]).find("a");
                        const vulnColumn = $(columns[3]).find("a");
                        const no_of_vuln = $(columns[3]).text().trim();
                        const vendor_name = $(columns[2]).find("a");

                        const productLink = `https://www.cvedetails.com${productColumn.attr("href")}`;
                        const vulnLink = `https://www.cvedetails.com${vulnColumn.attr("href")}`;
                        const vendorLink = `https://www.cvedetails.com${vendor_name.attr("href")}`;

                        data.push({
                                serial_no: $(columns[0]).text().trim(),
                                product_name: productColumn.text().trim(),
                                product_link: productLink,
                                vendor_name: $(columns[2]).text().trim(),
                                vendor_link: vendorLink,
                                no_of_vuln: $(columns[3]).text().trim(),
                                vuln_link: vulnLink,
                                prd_type: $(columns[4]).text().trim(),
                        });
                }
        }
        return data;
}


async function fetchVendor(url) { //table thing
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);

        let table1Row = [];
        let table1Column = [];
        const table1Rows = $('#contentdiv > div > main > div.section-container > div.table-responsive.my-2 > table > thead > tr')
        table1Rows.each((idx, row) => {
                const ths = $(row).find("th");
                ths.each((idx, col) => {
                        const data = $(col).text().trim();
                        table1Row.push(data);
                });
        })

        const table1Cols = $('#contentdiv > div > main > div.section-container > div.table-responsive.my-2 > table > tbody > tr')
        table1Cols.each((idx, row) => {
                let rowData = [];
                const th = $(row).find("th").text().trim();
                if (th) rowData.push(th);

                const tds = $(row).find("td");
                tds.each((idx, col) => {
                        const cellData = $(col).text().trim();
                        rowData.push(cellData);
                });

                table1Column.push(rowData);
        });


        let table2Row = [];
        let table2Column = [];
        const table2Rows = $('#contentdiv > div > main > div.section-container > div:nth-child(4) > table > thead > tr')
        table2Rows.each((idx, row) => {
                const columns = $(row).find("th");
                columns.each((idx, col) => {
                        const data = $(col).text().trim();
                        table2Row.push(data);
                });
        })


        const table2Cols = $('#contentdiv > div > main > div.section-container > div:nth-child(4) > table > tbody > tr')
        table2Cols.each((idx, row) => {
                let rowData = [];
                const th = $(row).find("th").text().trim();
                if (th) rowData.push(th);

                const tds = $(row).find("td");
                tds.each((idx, col) => {
                        const cellData = $(col).text().trim();
                        rowData.push(cellData);
                });

                table2Column.push(rowData);
        });

        return { table1Row, table1Column, table2Row, table2Column };
}



async function fetchVersion(url) {
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);

        let Urls = [];
        const urls = $('#contentdiv > div > main > div.paging > a');
        urls.each((idx, col) => {
                const url = $(col).attr('href');
                if (url) {
                        Urls.push(`https://www.cvedetails.com${url}`);
                }
        });

        if(Urls.length === 0){
                Urls.push(url);
        }

        let tableRow = [];
        let tableColumn = [];
        let isFirstIteration = true;
        for (const uri of Urls) {
                const response = await fetch(uri);
                const body = await response.text();
                const $ = cheerio.load(body);

                if (isFirstIteration) {
                        const table1Rows = $('#contentdiv > div > main > div.table-responsive > table > thead > tr');
                        table1Rows.each((idx, row) => {
                                const ths = $(row).find("th");
                                ths.each((idx, col) => {
                                        const data = $(col).text().trim();
                                        tableRow.push(data);
                                });
                        });
                        isFirstIteration = false;
                }

                const table1Cols = $('#contentdiv > div > main > div.table-responsive > table > tbody > tr')
                table1Cols.each((idx, row) => {
                        let rowData = [];
                        const tds = $(row).find("td");

                        tds.each((tdIdx, col) => {
                                if (tdIdx === tds.length - 2) {
                                        const txt = $(col).text().trim();
                                        const link = $(col).find("a").attr("href");
                                        rowData.push({ txt, link: link ? `https://www.cvedetails.com${link}` : "No link" })
                                } else if (tdIdx < tds.length - 1) {
                                        const cellData = $(col).text().trim();
                                        rowData.push(cellData);
                                }
                        });

                        tableColumn.push(rowData);
                });

        }
        return { tableRow, tableColumn }
}

app.get('/', (req, res) => {
        return res.status(200).json({ message: "Server is Live" })
})

app.get('/api/tool', async (req, res) => {
        const { tool } = req.query;
        if (!tool) {
                return res.status(404).json({ message: "Software name is req." });
        }
        try {

                const data = await fetchData(tool);
                return res.status(200).json(data)
        } catch (error) {
                console.error("Error fetching vendor data:", error);
                return res.status(500).json({ message: "Internal server error" });
        }
})

app.get('/api/vuln', async (req, res) => {
        const { no_of_vuln, link } = req.query;
        if (!link) {
                return res.status(404).json({ message: "link is req." });
        }
        let data = [];
        try {
                if (no_of_vuln > 0) {
                        data = await findID(link);
                }
                return res.status(200).json(data)
        }
        catch (error) {
                console.error("Error fetching vendor data:", error);
                return res.status(500).json({ message: "Internal server error" });
        }
})
app.get('/api/vendor', async (req, res) => {
        const { link } = req.query;
        if (!link) {
                return res.status(404).json({ message: "link is required." });
        }

        try {
                const { table1Row, table1Column, table2Row, table2Column } = await fetchVendor(link);

                return res.status(200).json({
                        table1Row,
                        table1Column,
                        table2Row,
                        table2Column
                });

        } catch (error) {
                console.error("Error fetching vendor data:", error);
                return res.status(500).json({ message: "Internal server error" });
        }
});

app.get('/api/version', async (req, res) => {
        const { link } = req.query;
        if (!link) {
                return res.status(404).json({ message: "link is required." });
        }
        try {
                const { tableRow, tableColumn } = await fetchVersion(link);

                return res.status(200).json({
                        tableRow,
                        tableColumn,
                });

        } catch (error) {
                console.log(error.message);
                return res.status(500).json({ message: "Internal server error" });
        }
})

app.get('/api/cvvid', async (req, res) => {
        const { link } = req.query;
        if (!link) {
                return res.status(404).json({ message: "link is required." });
        }
        try {
                const { head, foot } = await findbyCvvId(link);

                return res.status(200).json({
                        head, foot
                });

        } catch (error) {
                console.log(error.message);
                return res.status(500).json({ message: "Internal server error" });
        }
})


app.listen(port, async () => {
        console.log(`Server is listening at Port ${port}`);
})
