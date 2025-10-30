// import * as fs from "fs";
// import * as path from "path";
// import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
// import { fillOMRSingle } from "./index"; // your existing code file
// import { Config } from "./types";

// type StudentData = {
//   uid: string;
//   name: string;
//   answers: Record<number, string>;
// };

// const OUTPUT_DIR = "./output";
// const TEMPLATE_PATH = "omr_template.pdf";
// const CONFIG_PATH = "coordinates.json";

// // ------------------------------------------------------------
// // STEP 1: Generate a blank OMR template if it doesn't exist
// // ------------------------------------------------------------
// async function ensureTemplate() {
//   if (fs.existsSync(TEMPLATE_PATH)) return;

//   console.log("Template not found. Creating a blank template...");
//   const pdfDoc = await PDFDocument.create();
//   const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
//   const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

//   page.drawText("OMR Template", {
//     x: 230,
//     y: 800,
//     size: 20,
//     font,
//     color: rgb(0, 0, 0),
//   });

//   const bytes = await pdfDoc.save();
//   await fs.promises.writeFile(TEMPLATE_PATH, bytes);
//   console.log("Template created:", TEMPLATE_PATH);
// }

// // ------------------------------------------------------------
// // STEP 2: Generate config.json if it doesn't exist
// // ------------------------------------------------------------
// async function ensureConfig() {
//   if (fs.existsSync(CONFIG_PATH)) return;

//   console.log("Config not found. Creating a default coordinates.json...");
//   const defaultConfig: Config = {
//     uid: {
//       type: "bubble-grid",
//       length: 10,
//       radius: 5,
//       x: {
//         "0": 72,
//         "1": 87,
//         "2": 103,
//         "3": 118,
//         "4": 133.5,
//         "5": 149,
//         "6": 164,
//         "7": 179.5,
//         "8": 195,
//         "9": 210,
//         "10": 226,
//       },
//       y: {
//         "0": 718,
//         "1": 703,
//         "2": 689,
//         "3": 674,
//         "4": 660,
//         "5": 645,
//         "6": 630.5,
//         "7": 616,
//         "8": 602,
//         "9": 587,
//       },
//       text: {
//         y: 730,
//         fontSize: 10,
//         xOffset: -2,
//       },
//     },
//     name: {
//       type: "text",
//       x: 350,
//       y: 600,
//     },
//   };

//   await fs.promises.writeFile(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
//   console.log("Default config created:", CONFIG_PATH);
// }

// function generateDummyStudents(count: number): StudentData[] {
//   const students: StudentData[] = [];
//   for (let i = 0; i < count; i++) {
//     const uid = Math.floor(Math.random() * 1e8)
//       .toString()
//       .padStart(8, "0");
//     const name = `Student_${i + 1}`;
//     students.push({ uid, name, answers });
//   }
//   return students;
// }

// async function generateBatchOMRs() {
//   await ensureTemplate();
//   await ensureConfig();

//   if (!fs.existsSync(OUTPUT_DIR)) {
//     fs.mkdirSync(OUTPUT_DIR);
//   }

//   const templateBytes = await fs.promises.readFile(TEMPLATE_PATH);
//   const configJson = JSON.parse(await fs.promises.readFile(CONFIG_PATH, "utf8")) as Config;

//   const students = generateDummyStudents(500);
//   console.log(`Generating OMRs for ${students.length} students...`);

//   const templatePdf = await PDFDocument.load(templateBytes);
//   // const fontBytes = await (await PDFDocument.create()).embedFont(StandardFonts.Courier);

//   for (let i = 0; i < students.length; i++) {
//     const mergedPdf = await PDFDocument.create();
//     const font = await mergedPdf.embedFont(StandardFonts.Courier);
//     const [templatePage] = await mergedPdf.copyPages(templatePdf, [0]);
//     mergedPdf.addPage(templatePage);

//     await fillOMRSingle(templatePage, students[i], configJson, font);

//     const outPath = path.join(OUTPUT_DIR, `${students[i].uid}_${students[i].name}.pdf`);
//     const bytes = await mergedPdf.save();
//     await fs.promises.writeFile(outPath, bytes);

//     if ((i + 1) % 50 === 0) console.log(`${i + 1} OMRs generated...`);
//   }

//   console.log(`All OMRs saved in: ${OUTPUT_DIR}`);
// }

// // ------------------------------------------------------------
// // Run the batch generator
// // ------------------------------------------------------------
// generateBatchOMRs().catch((err) => console.error(err));
