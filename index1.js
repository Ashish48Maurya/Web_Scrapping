import * as cheerio from "cheerio";

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
                                        const nestedKey = $(innerDivs[0]).text().trim();

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
                                        secondDivData.push({ key: nestedKey, value: nestedValue });
                                }
                                else {
                                        secondDivData.push({ key: $(innerDivs[0]).text().trim(), value: $(el).text().trim() });
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

                        const productLink = `https://www.cvedetails.com${productColumn.attr("href")}`;
                        const vulnLink = `https://www.cvedetails.com${vulnColumn.attr("href")}`;

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
                                no_of_vuln: $(columns[3]).text().trim(),
                                vuln_link: vulnLink,
                                prd_type: $(columns[4]).text().trim(),
                                details: data1
                        });
                }
        }
        return data;
}

const res = await fetchData("linux");
res.forEach((element) => {
        console.log(element);
        // if (element.details.length > 0) {
        //         console.log(element.details[0].length);
        //         for (let i = 0; i < element.details[0].length; i++) {
        //                 console.log(element.details[0][i].firstDiv);
        //                 console.log(element.details[0][i].secondDiv);
        //                 console.log("---------------------------------------------------");
        //         }
        // }
});