

// const cveData = await Promise.all(
        //     cveIds.map(async (cveId) => {
        //         const browser = await puppeteer.launch();
        //         const page = await browser.newPage();
        //         await page.goto(`https://www.cve.org/CVERecord?id=${cveId}`, { waitUntil: 'domcontentloaded' });

        //         const pageExist = await page
        //             .waitForSelector('#cvss-table > table')
        //             .then(() => true)
        //             .catch(() => false);

        //         if (!pageExist) {
        //             await browser.close();
        //             return { cveId, message: 'Page not found' };
        //         }

        //         const content = await page.evaluate(() => {
        //             const rows = document.querySelectorAll('#cvss-table > table > tbody > tr');
        //             return Array.from(rows).map(row => {
        //                 const cols = row.querySelectorAll('td');
        //                 return {
        //                     score: cols[0] ? cols[0].innerText : null,
        //                     severity: cols[1] ? cols[1].innerText : null,
        //                     version: cols[2] ? cols[2].innerText : null,
        //                     vectorString: cols[3] ? cols[3].innerText : null
        //                 };
        //             });
        //         });

        //         await browser.close();
        //         return { cveId, content };
        //     })
        // );

        // console.log("Res:", JSON.stringify(cveData, null, 2));