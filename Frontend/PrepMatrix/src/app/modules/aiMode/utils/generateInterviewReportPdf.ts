import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

import { APP_NAME } from '../../../constants/branding';

const logoIconLight = '/logo-icon-light.png';
import type { AIInterviewSession } from '../types';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const PAGE_MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const COLOR_BLACK = '#000';
const COLOR_DARK = '#333';
const COLOR_MID = '#666';
const COLOR_LIGHT = '#ccc';

function normalizePercent(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

function scoreOutOfTen(value: number | undefined) {
  const percent = normalizePercent(value);
  if (percent === null) {
    return 'Pending';
  }

  return `${(percent / 10).toFixed(1)}/10`;
}

function percentLabel(value: number | undefined) {
  const percent = normalizePercent(value);
  return percent === null ? 'Pending' : `${percent}%`;
}

function durationLabel(startedAt?: number, endedAt?: number) {
  if (!startedAt || !endedAt || endedAt <= startedAt) {
    return 'In progress';
  }

  const totalMinutes = Math.max(1, Math.round((endedAt - startedAt) / 60000));
  return `${totalMinutes} min`;
}

function performanceLevel(score: number | undefined) {
  const percent = normalizePercent(score);
  if (percent === null) {
    return 'Pending';
  }

  if (percent >= 80) {
    return 'Advanced';
  }

  if (percent >= 60) {
    return 'Intermediate';
  }

  return 'Beginner';
}

function uniqueItems(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function verdictForSession(
  score: number | undefined,
  answeredCount: number,
  totalQuestions: number,
) {
  const percent = normalizePercent(score);
  const completionRate = totalQuestions > 0 ? answeredCount / totalQuestions : 0;

  if (percent === null) {
    return {
      label: 'Not Recommended',
      reason:
        'The session does not yet contain enough scored responses to support a hiring recommendation.',
    };
  }

  if (percent >= 75 && completionRate >= 0.8) {
    return {
      label: 'Recommended',
      reason:
        'The candidate maintained strong answer quality across most of the interview and demonstrated solid readiness for the next hiring stage.',
    };
  }

  if (percent >= 60 && completionRate >= 0.6) {
    return {
      label: 'Recommended',
      reason:
        'The candidate showed credible readiness overall, with a few areas that would benefit from targeted follow-up.',
    };
  }

  return {
    label: 'Not Recommended',
    reason:
      'The session shows incomplete coverage or lower answer quality than required for progression, so further preparation is advised.',
  };
}

function ensureSpace(doc: jsPDF, y: number, height: number) {
  if (y + height <= PAGE_HEIGHT - PAGE_MARGIN) {
    return y;
  }

  doc.addPage();
  return PAGE_MARGIN;
}

function setText(doc: jsPDF, color: string, size: number, style: 'normal' | 'bold') {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(color);
}

function drawBox(doc: jsPDF, y: number, height: number) {
  doc.setDrawColor(COLOR_LIGHT);
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, height);
}

function writeParagraph(args: {
  color?: string;
  doc: jsPDF;
  fontSize?: number;
  fontStyle?: 'normal' | 'bold';
  lineHeight?: number;
  text: string;
  width?: number;
  x?: number;
  y: number;
}) {
  const {
    color = COLOR_DARK,
    doc,
    fontSize = 10,
    fontStyle = 'normal',
    lineHeight = 5,
    text,
    width = CONTENT_WIDTH,
    x = PAGE_MARGIN,
    y,
  } = args;
  const safeText = text?.trim() || 'Pending';
  const lines = doc.splitTextToSize(safeText, width);

  setText(doc, color, fontSize, fontStyle);
  doc.text(lines, x, y);

  return y + lines.length * lineHeight;
}

function drawProgressBar(args: {
  doc: jsPDF;
  label: string;
  value: number | undefined;
  y: number;
}) {
  const { doc, label, value, y } = args;
  const percent = normalizePercent(value);

  let nextY = writeParagraph({
    color: COLOR_DARK,
    doc,
    fontSize: 10,
    fontStyle: 'bold',
    text: label,
    y,
  });

  writeParagraph({
    color: COLOR_MID,
    doc,
    fontSize: 9,
    text: percent === null ? 'Pending' : `${percent}%`,
    width: 24,
    x: PAGE_MARGIN + CONTENT_WIDTH - 24,
    y,
  });

  nextY += 1;
  doc.setDrawColor(COLOR_LIGHT);
  doc.rect(PAGE_MARGIN, nextY, CONTENT_WIDTH, 6);
  doc.setFillColor(COLOR_BLACK);
  doc.rect(PAGE_MARGIN, nextY, (CONTENT_WIDTH * (percent ?? 0)) / 100, 6, 'F');

  return nextY + 10;
}

function writeMetaPair(args: {
  doc: jsPDF;
  label: string;
  value: string;
  x: number;
  y: number;
}) {
  const { doc, label, value, x, y } = args;

  setText(doc, COLOR_MID, 9, 'bold');
  doc.text(label, x, y);

  const lines = doc.splitTextToSize(value || 'Pending', CONTENT_WIDTH / 2 - 10);
  setText(doc, COLOR_BLACK, 10, 'normal');
  doc.text(lines, x, y + 5);
}

function loadBrandImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error('Unable to load the PrepMatrix report logo.'));
    image.src = src;
  });
}

export async function generateInterviewReportPdf(args: {
  candidateName?: string;
  session: AIInterviewSession;
}) {
  const { candidateName = 'Candidate', session } = args;
  const doc = new jsPDF({
    format: 'a4',
    orientation: 'portrait',
    unit: 'mm',
  });
  const answersByQuestionId = new Map(
    session.answers.map((answer) => [answer.questionId, answer] as const),
  );
  const answeredCount = session.answers.length;
  const verdict = verdictForSession(
    session.overallScore,
    answeredCount,
    session.questionCount,
  );
  const strengths = uniqueItems([
    ...(session.analysis.strengths || []),
    ...session.answers.flatMap((answer) => answer.strengths || []),
  ]);
  const improvements = uniqueItems(
    session.answers.flatMap((answer) => answer.improvements || []),
  );
  let brandLogo: HTMLImageElement | null = null;

  let y = PAGE_MARGIN;

  try {
    brandLogo = await loadBrandImage(logoIconLight);
  } catch (error) {
    console.warn('[generateInterviewReportPdf] brandLogo:error', error);
  }

  if (brandLogo) {
    doc.addImage(brandLogo, 'PNG', PAGE_MARGIN, y - 1, 18, 18);
  }

  const reportTitleX = brandLogo ? PAGE_MARGIN + 24 : PAGE_MARGIN;

  setText(doc, COLOR_BLACK, 18, 'bold');
  doc.text(`${APP_NAME} Interview Report`, reportTitleX, y);
  y += 8;

  y = writeParagraph({
    color: COLOR_MID,
    doc,
    fontSize: 10,
    text: 'ATS-style interview evaluation generated directly from structured interview data.',
    width: CONTENT_WIDTH - (reportTitleX - PAGE_MARGIN),
    x: reportTitleX,
    y,
  });
  y += 4;

  y = ensureSpace(doc, y, 28);
  drawBox(doc, y, 24);
  y += 6;
  const leftX = PAGE_MARGIN + 3;
  const rightX = PAGE_MARGIN + CONTENT_WIDTH / 2 + 2;

  writeMetaPair({
    doc,
    label: 'Candidate Name',
    value: candidateName,
    x: leftX,
    y,
  });
  writeMetaPair({
    doc,
    label: 'Role',
    value: session.analysis.domain || 'General',
    x: rightX,
    y,
  });
  writeMetaPair({
    doc,
    label: 'Date',
    value: format(new Date(session.createdAt), 'MMM dd, yyyy hh:mm a'),
    x: leftX,
    y: y + 11,
  });
  writeMetaPair({
    doc,
    label: 'Duration',
    value: durationLabel(session.startedAt, session.endedAt),
    x: rightX,
    y: y + 11,
  });
  y += 25;

  y = ensureSpace(doc, y + 4, 31);
  y += 4;
  drawBox(doc, y, 27);
  y += 6;
  y = writeParagraph({
    color: COLOR_DARK,
    doc,
    fontSize: 13,
    fontStyle: 'bold',
    text: 'Performance Summary',
    y,
  });

  const summaryItems = [
    ['Overall Score', scoreOutOfTen(session.overallScore)],
    ['Confidence', percentLabel(session.confidenceScore)],
    ['Questions Answered', `${answeredCount}/${session.questionCount}`],
    ['Performance Level', performanceLevel(session.overallScore)],
  ] as const;

  let summaryX = PAGE_MARGIN + 3;
  const summaryWidth = CONTENT_WIDTH / 4 - 1.5;
  const summaryTop = y + 2;

  summaryItems.forEach(([label, value], index) => {
    if (index > 0) {
      doc.setDrawColor(COLOR_LIGHT);
      doc.line(summaryX - 2, summaryTop - 1, summaryX - 2, summaryTop + 14);
    }

    setText(doc, COLOR_MID, 8, 'bold');
    doc.text(label, summaryX, summaryTop);
    const valueLines = doc.splitTextToSize(value, summaryWidth);
    setText(doc, COLOR_BLACK, 12, 'bold');
    doc.text(valueLines, summaryX, summaryTop + 7);
    summaryX += summaryWidth + 2;
  });
  y += 21;

  y = ensureSpace(doc, y + 4, 30);
  y += 4;
  drawBox(doc, y, 26);
  y += 6;
  y = writeParagraph({
    color: COLOR_DARK,
    doc,
    fontSize: 13,
    fontStyle: 'bold',
    text: 'Visual Score Bars',
    y,
  });
  y += 1;
  y = drawProgressBar({ doc, label: 'Score Progress', value: session.overallScore, y });
  y = drawProgressBar({ doc, label: 'Confidence Progress', value: session.confidenceScore, y });

  const writeListSection = (title: string, items: string[], emptyText: string) => {
    const listItems = items.length ? items : [emptyText];
    const estimatedHeight = 12 + listItems.length * 6;
    y = ensureSpace(doc, y + 4, estimatedHeight);
    y += 4;
    drawBox(doc, y, estimatedHeight);
    y += 6;
    y = writeParagraph({
      color: COLOR_DARK,
      doc,
      fontSize: 13,
      fontStyle: 'bold',
      text: title,
      y,
    });
    y += 1;

    listItems.forEach((item) => {
      y = writeParagraph({
        color: COLOR_DARK,
        doc,
        text: `- ${item}`,
        y,
      });
      y += 1;
    });
  };

  writeListSection('Strengths', strengths, 'No strengths were recorded for this session.');
  writeListSection(
    'Improvements',
    improvements,
    'No improvement notes were recorded for this session.',
  );

  y = ensureSpace(doc, y + 4, 14);
  y += 4;
  drawBox(doc, y, 10);
  y += 6;
  y = writeParagraph({
    color: COLOR_DARK,
    doc,
    fontSize: 13,
    fontStyle: 'bold',
    text: 'Question Breakdown',
    y,
  });

  session.questions.forEach((question, index) => {
    const answer = answersByQuestionId.get(question.id);
    const estimatedHeight =
      32 +
      doc.splitTextToSize(question.text, CONTENT_WIDTH - 6).length * 5 +
      doc.splitTextToSize(answer?.answer || 'No answer was saved for this question.', CONTENT_WIDTH - 6)
        .length *
        5 +
      doc.splitTextToSize(answer?.feedback || 'No feedback was saved for this question.', CONTENT_WIDTH - 6)
        .length *
        5;

    y = ensureSpace(doc, y + 4, estimatedHeight);
    y += 4;
    drawBox(doc, y, estimatedHeight - 2);
    y += 6;

    y = writeParagraph({
      color: COLOR_DARK,
      doc,
      fontSize: 11,
      fontStyle: 'bold',
      text: `Q${index + 1}: ${question.focusArea || `Question ${index + 1}`}`,
      y,
    });
    y = writeParagraph({
      color: COLOR_BLACK,
      doc,
      text: question.text,
      y,
    });
    y += 1;
    y = writeParagraph({
      color: COLOR_MID,
      doc,
      fontSize: 9,
      fontStyle: 'bold',
      text: 'Answer',
      y,
    });
    y = writeParagraph({
      color: COLOR_DARK,
      doc,
      text: answer?.answer || 'No answer was saved for this question.',
      y,
    });
    y += 1;
    y = writeParagraph({
      color: COLOR_MID,
      doc,
      fontSize: 9,
      fontStyle: 'bold',
      text: `Score: ${scoreOutOfTen(answer?.score)}    Confidence: ${percentLabel(
        answer?.confidenceScore,
      )}`,
      y,
    });
    y += 1;
    y = writeParagraph({
      color: COLOR_MID,
      doc,
      fontSize: 9,
      fontStyle: 'bold',
      text: 'Feedback',
      y,
    });
    y = writeParagraph({
      color: COLOR_DARK,
      doc,
      text: answer?.feedback || 'No feedback was saved for this question.',
      y,
    });
  });

  const verdictHeight = 22 + doc.splitTextToSize(verdict.reason, CONTENT_WIDTH - 6).length * 5;
  y = ensureSpace(doc, y + 4, verdictHeight);
  y += 4;
  drawBox(doc, y, verdictHeight);
  y += 6;
  y = writeParagraph({
    color: COLOR_DARK,
    doc,
    fontSize: 13,
    fontStyle: 'bold',
    text: 'Final Verdict',
    y,
  });
  y = writeParagraph({
    color: COLOR_BLACK,
    doc,
    fontSize: 10,
    fontStyle: 'bold',
    text: verdict.label,
    y,
  });
  y = writeParagraph({
    color: COLOR_DARK,
    doc,
    text: verdict.reason,
    y,
  });

  const footerY = ensureSpace(doc, y + 8, 6);
  writeParagraph({
    color: COLOR_MID,
    doc,
    fontSize: 9,
    text: `Generated by ${APP_NAME}`,
    y: footerY,
  });

  doc.save('interview-report.pdf');
}
