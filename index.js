import * as cheerio from "cheerio";
import express from "express";
import cors from "cors"
const app = express();
const port = process.env.PORT || 8000;


app.use(cors())
app.use(express.json());

async function findID(url) {
        const response = await fetch(url);
        const body = await response.text();
        const $ = cheerio.load(body);

        const tableRows = $("#searchresults > div > div");
        const data = [];

        tableRows.each((index, row) => {
                const childDivs = $(row).children("div");

                if (childDivs.length >= 2) {
                        const firstDivChildren = $(childDivs[0]).children("div");
                        const firstDivData = firstDivChildren.map((i, el) => $(el).text().trim()).get();

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
        return data;
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

                        const data1 = [];

                        if (no_of_vuln > 0) {
                                const details = await findID(vulnLink);
                                const sample = [];
                                for (let i = 0; i < details.length; i++) {
                                        const currentDetail = details[i];
                                        const firstDivData = currentDetail.firstDiv;
                                        const secondDivData = currentDetail.secondDiv;

                                        const combinedData = {
                                                firstDiv: firstDivData,
                                                secondDiv: secondDivData
                                        };
                                        sample.push(combinedData);
                                }
                                data1.push(sample);
                        }
                        data.push({
                                serial_no: $(columns[0]).text().trim(),
                                product_name: productColumn.text().trim(),
                                product_link: productLink,
                                vendor_name: $(columns[2]).text().trim(),
                                vendor_link: vendorLink,
                                no_of_vuln: $(columns[3]).text().trim(),
                                vuln_link: vulnLink,
                                prd_type: $(columns[4]).text().trim(),
                                details: data1
                        });
                }
        }
        return data;
}

app.get('/', (req, res) => {
        return res.status(200).json({ message: "Server is Live" })
})

app.get('/api', async (req, res) => {
        const { tool } = req.query;
        if (!tool) {
                return res.status(404).json({ message: "Software name is req." });
        }
        const data = await fetchData(tool);
        return res.status(200).json(data)
})

app.listen(port,()=>{
        console.log(`Server is listening at Port ${port}`);
})
