import * as fs from 'fs';
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { Config } from './types';

// Keys of the type must match the top level fields specified in `Config`. 
type StudentData = {
    uid: string;
    name: string;
};

export async function fillOMRSingle(
    page: PDFPage,
    student: StudentData,
    config: Config,
    font: PDFFont
) {
    const drawText = (
        text: string,
        x: number,
        y: number,
        size: number = 12
    ) => {
        page.drawText(text, {
            x,
            y,
            font,
            size,
            color: rgb(0, 0, 0)
        });
    };

    const drawBubble = (x: number, y: number, radius: number = 5) => {
        page.drawCircle({ x, y, size: radius, color: rgb(0, 0, 0) });
    };

    for (const [fieldName, field] of Object.entries(config)) {
        const value = (student as any)[fieldName];
        if (!value) continue;

        if (field.type === 'bubble-grid') {
            for (let i = 0; i < value.length; i++) {
                const digit = value[i];
                const x = field.x[i.toString()];
                const y = field.y[digit];
                if (x !== undefined && y !== undefined) {
                    drawBubble(x, y, field.radius ?? 5);

                    if (field.text) {
                        drawText(
                            value[i],
                            x + (field.text.xOffset ?? 0),
                            field.text.y,
                            field.text.fontSize ?? 10
                        );
                    }
                }
            }
        }

        if (field.type === 'text') {
            drawText(value, field.x, field.y, field.fontSize ?? 14);
        }
    }
}

export async function generateOMR(
    templateBytes: Uint8Array,
    students: StudentData[],
    config: Config
): Promise<Uint8Array> {
    const templatePdf = await PDFDocument.load(templateBytes);
    const mergedPdf = await PDFDocument.create();
    const font = await mergedPdf.embedFont(StandardFonts.Courier);

    const configErrors = validateConfig(config);
    // TODO: Better and prettier error handling
    if (configErrors.length) throw new Error(configErrors.join('\n'));

    for (const student of students) {
        const [templatePage] = await mergedPdf.copyPages(templatePdf, [0]);
        mergedPdf.addPage(templatePage);

        await fillOMRSingle(templatePage, student, config, font);
    }

    return await mergedPdf.save();
}

function validateConfig(config: Config): string[] {
    // TODO:
    // Implement checks in the config to ensure certain fields like `x` and `y` are always present
    // and check the lengths of all fields to ensure that out of bounds indices are never an issue.
    const errors: string[] = [];

    for (const [fieldName, field] of Object.entries(config)) {
        if (field.type === 'bubble-grid') {
            const xLen = Object.keys(field.x ?? {}).length;
            if (xLen == 0) errors.push(`Field ${fieldName} has no x coordinates specified`);
            if (xLen !== field.length + 1) {
                errors.push(`Field ${fieldName} has mismatched x length (${xLen} ≠ ${field.length})`);
            }
            for (const digit of '0123456789') {
                if (!(digit in field.y)) {
                    errors.push(`Field ${fieldName} missing y for digit ${digit}`);
                }
            }
            if (!field.text?.y) errors.push(`Field ${fieldName} text has no y coordinate`);
        }

        if (field.type === 'text') {
            if (!field.x || !field.y || typeof field.x !== 'number' || typeof field.y !== 'number') {
                errors.push(`Field ${fieldName} has invalid position`);
            }
        }
    }
    return errors;
}

async function main() {
    const templateBytes = await fs.promises.readFile('omr_template.pdf');
    const config = await fs.promises.readFile('coordinates.json', 'utf8')
    const config_json = JSON.parse(config);
    const data = {
        "uid": "01234567",
        "name": "Student 1"
    }
    const data2 = {
        "uid": "23456789",
        "name": "Student 2"
    }
    const students: StudentData[] = [data, data2];
    const filled = await generateOMR(templateBytes, students, config_json);
    await fs.promises.writeFile('filled_output.pdf', filled).then(() => {
        console.log('OMR written at: filled_output.pdf');
    });
}

main()