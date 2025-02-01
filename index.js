import express from "express";
import * as cheerio from "cheerio";
const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());

app.get("/", async (req, res) => {
    const { tool, version } = req.body;
    if (!tool || !version) {
        return res.status(400).json({ message: "Tool and version are required" });
    }

    try {
        const response = await fetch(`https://cve.mitre.org/cgi-bin/cvekey.cgi?keyword=${tool}`);
        const body = await response.text();
        const $ = cheerio.load(body);

        const tableRows = $("#TableWithRules tbody tr");
        let cveIds = [];

        tableRows.each((_, row) => {
            const cveId = $(row).find("td").first().text().trim();
            const cveDesc = $(row).find("td").eq(1).text().trim();
            if (cveId.startsWith("CVE-")) {
                cveIds.push({ cveId, cveDesc });
            }
        });

        const cveDetails = [];

        for (const cveId of cveIds) {
            try {
                const ans = await fetch(`https://cveawg.mitre.org/api/cve/${cveId.cveId}`);
                const res = await ans.json();
                if (res && res.containers && res.containers.cna && res.containers.cna.metrics && res.containers.cna.metrics.length > 0) {
                    const metric = res.containers.cna.metrics[0];
                    if (metric?.cvssV3_1) {
                        if (metric?.cvssV3_1.version == version) {
                            console.log("push");
                            cveDetails.push({
                                date_published: res.cveMetadata.datePublished,
                                cveId: cveId.cveId,
                                cveDesc: cveId.cveDesc,
                                score: metric ? metric.cvssV3_1.baseScore : null,
                                severity: metric ? metric.cvssV3_1.baseSeverity : null,
                                version: metric ? metric.cvssV3_1.version : null,
                                vectorString: metric ? metric.cvssV3_1.vectorString : null
                            });
                        }
                    }
                    else if (metric?.cvssV4_0) {
                        if (metric?.cvssV4_0.version === version) {
                            cveDetails.push({
                                date_published: res.cveMetadata.datePublished,
                                cveId: cveId.cveId,
                                cveDesc: cveId.cveDesc,
                                score: metric ? metric.cvssV4_0.baseScore : null,
                                severity: metric ? metric.cvssV4_0.baseSeverity : null,
                                version: metric ? metric.cvssV4_0.version : null,
                                vectorString: metric ? metric.cvssV4_0.vectorString : null
                            });
                        }
                    }
                    else if (metric?.cvssV3_0) {
                        if (metric?.cvssV3_0.version === version) {
                            cveDetails.push({
                                date_published: res.cveMetadata.datePublished,
                                cveId: cveId.cveId,
                                cveDesc: cveId.cveDesc,
                                score: metric ? metric.cvssV3_0.baseScore : null,
                                severity: metric ? metric.cvssV3_0.baseSeverity : null,
                                version: metric ? metric.cvssV3_0.version : null,
                                vectorString: metric ? metric.cvssV3_0.vectorString : null
                            });
                        }
                    }
                    else if (metric?.cvssV2_0) {
                        if (metric?.cvssV2_0.version === version) {
                            cveDetails.push({
                                date_published: res.cveMetadata.datePublished,
                                cveId: cveId.cveId,
                                cveDesc: cveId.cveDesc,
                                score: metric ? metric.cvssV2_0.baseScore : null,
                                severity: metric ? metric.cvssV2_0.baseSeverity : null,
                                version: metric ? metric.cvssV2_0.version : null,
                                vectorString: metric ? metric.cvssV2_0.vectorString : null
                            });
                        }
                    }
                    else {
                        cveDetails.push({
                            cveId: cveId.cveId,
                            cveDesc: cveId.cveDesc,
                            score: null,
                            severity: null,
                            version: null,
                            vectorString: null
                        });
                    }
                }
                else {
                    cveDetails.push({
                        cveId: cveId.cveId,
                        cveDesc: cveId.cveDesc,
                        score: null,
                        severity: null,
                        version: null,
                        vectorString: null
                    });
                }
            } catch (error) {
                console.error(`Error fetching details for ${cveId.cveId}:`, error.message);
                cveDetails.push({
                    cveId: cveId.cveId,
                    cveDesc: cveId.cveDesc,
                    score: null,
                    severity: null,
                    version: null,
                    vectorString: null
                });
            }
        }

        if (cveDetails.length === 0) {
            return res.status(404).json({ message: `No data found for ${tool} version ${version}` });
        }
        return res.status(200).json(cveDetails);

    } catch (error) {
        console.error("Error:", error);
    }
});

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
});
