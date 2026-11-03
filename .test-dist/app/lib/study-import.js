"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFlashcardsFromCsv = void 0;
const normalizeCsvCell = (value) => `${value ?? ""}`
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/\s+/g, " ");
const detectCsvDelimiter = (text) => {
    const sample = text
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .split("\n")
        .find((line) => line.trim().length > 0) || "";
    const delimiters = [",", "\t", ";", "|"];
    let bestDelimiter = ",";
    let bestScore = -1;
    delimiters.forEach((delimiter) => {
        let score = 0;
        let inQuotes = false;
        for (let i = 0; i < sample.length; i += 1) {
            const ch = sample[i];
            if (ch === '"') {
                if (inQuotes && sample[i + 1] === '"')
                    i += 1;
                else
                    inQuotes = !inQuotes;
                continue;
            }
            if (!inQuotes && ch === delimiter)
                score += 1;
        }
        if (score > bestScore) {
            bestScore = score;
            bestDelimiter = delimiter;
        }
    });
    return bestDelimiter;
};
const parseDelimitedText = (text, delimiter) => {
    const normalized = text
        .replace(/^\uFEFF/, "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n");
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < normalized.length; i += 1) {
        const ch = normalized[i];
        if (ch === '"') {
            if (inQuotes && normalized[i + 1] === '"') {
                cell += '"';
                i += 1;
            }
            else
                inQuotes = !inQuotes;
            continue;
        }
        if (!inQuotes && ch === delimiter) {
            row.push(cell);
            cell = "";
            continue;
        }
        if (!inQuotes && ch === "\n") {
            row.push(cell);
            rows.push(row);
            row = [];
            cell = "";
            continue;
        }
        cell += ch;
    }
    row.push(cell);
    if (row.some((value) => value.trim().length > 0))
        rows.push(row);
    return rows.map((currentRow) => currentRow.map((value) => normalizeCsvCell(value)));
};
const headerMatches = (headerCell, aliases) => {
    const value = normalizeCsvCell(headerCell).toLowerCase();
    return aliases.some((alias) => {
        const key = alias.toLowerCase();
        return key.length <= 2
            ? value === key
            : value === key || value.startsWith(`${key} `) || value.startsWith(`${key}_`) || value.startsWith(`${key}-`) || value.includes(` ${key} `);
    });
};
const parseFlashcardsFromCsv = (text) => {
    const rows = parseDelimitedText(text, detectCsvDelimiter(text)).filter((row) => row.some((cell) => cell.trim().length > 0));
    if (rows.length === 0)
        return [];
    const header = rows[0];
    const questionAliases = ["question", "front", "prompt", "term", "cue", "flashcard front", "card front", "front side", "q"];
    const answerAliases = ["answer", "back", "response", "definition", "flashcard back", "card back", "back side", "a"];
    const questionIndex = header.findIndex((cell) => headerMatches(cell, questionAliases));
    const answerIndex = header.findIndex((cell) => headerMatches(cell, answerAliases));
    const hasHeader = questionIndex >= 0 || answerIndex >= 0;
    const seen = new Set();
    const cards = [];
    (hasHeader ? rows.slice(1) : rows).forEach((row) => {
        const question = normalizeCsvCell(row[hasHeader ? (questionIndex >= 0 ? questionIndex : 0) : 0] || "");
        const answer = normalizeCsvCell(row[hasHeader ? (answerIndex >= 0 ? answerIndex : 1) : 1] || "");
        if (!question || !answer)
            return;
        const fingerprint = `${question.toLowerCase()}::${answer.toLowerCase()}`;
        if (seen.has(fingerprint))
            return;
        seen.add(fingerprint);
        cards.push({ q: question, a: answer });
    });
    return cards.slice(0, 300);
};
exports.parseFlashcardsFromCsv = parseFlashcardsFromCsv;
