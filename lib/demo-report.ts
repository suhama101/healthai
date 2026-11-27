import pdfMake from "pdfmake/build/pdfmake";
import fonts from "pdfmake/build/vfs_fonts";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { caseDate, caseImageInfo, type DemoCase } from "@/lib/demo-cases";

export async function downloadDemoReport(item: DemoCase) {
  pdfMake.addVirtualFileSystem(fonts);
  const report: TDocumentDefinitions = {
    info: { title: `MediLens AI Demo Report | ${item.id}`, author: "MediLens AI" },
    pageSize: "A4",
    pageMargins: [48, 48, 48, 58],
    defaultStyle: { fontSize: 11, color: "#10243b", lineHeight: 1.2 },
    footer: (page, pages) => ({
      columns: [
        { text: "MediLens AI · Research and education only", width: "*" },
        { text: `${page} / ${pages}`, width: "auto", alignment: "right" },
      ],
      margin: [48, 15, 48, 0],
      color: "#465c70",
      fontSize: 9,
    }),
    content: [
      { text: "MediLens AI", fontSize: 12, bold: true, color: "#00766d", margin: [0, 0, 0, 8] },
      { text: "Laboratory Demo Case Report", fontSize: 26, bold: true, margin: [0, 0, 0, 22] },
      {
        layout: "lightHorizontalLines",
        table: {
          widths: [94, "*"],
          body: [
            [{ text: "Demo case ID", bold: true }, item.id],
            [{ text: "Fictional title", bold: true }, item.title || "No title entered"],
            [{ text: "Created", bold: true }, `${caseDate(item.createdAt)} (browser local time)`],
            [{ text: "Last saved", bold: true }, `${caseDate(item.updatedAt)} (browser local time)`],
            [{ text: "Review status", bold: true }, item.status],
            [{ text: "Image information", bold: true }, item.image ? caseImageInfo(item.image) : "No image attached"],
          ],
        },
      },
      { text: "Human review observations", style: "heading" },
      { text: item.notes.trim() || "No human observations recorded." },
      { text: "Model analysis", style: "heading" },
      { text: "AI analysis was unavailable for this demo case." },
      { text: "Research use only", style: "heading" },
      { text: "Fictional demo case for research and education only. This report is not for clinical diagnosis, treatment, or patient care. Observations were entered by a human reviewer." },
    ],
    styles: { heading: { bold: true, fontSize: 14, color: "#005d55", margin: [0, 17, 0, 5] } },
  };

  await pdfMake.createPdf(report).download(`medilens-${item.id.toLowerCase()}.pdf`);
}
