import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Chapter from '../models/Chapter';

import PDFParser from 'pdf2json';
import Topic from '../models/Topic';

const parsePdfBuffer = (buffer: Buffer): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser(null, true);
      pdfParser.on('pdfParser_dataError', (errData: any) => reject(errData.parserError || errData));
      pdfParser.on('pdfParser_dataReady', () => {
        try {
          const rawText = pdfParser.getRawTextContent() || '';
          const lines = rawText
            .split(/\r?\n/)
            .map(line => line.trim())
            .filter(line => line.length >= 2 && !/^(page\s+\d+|\d+\s*of\s*\d+|\d+|-+)$/i.test(line));
          resolve(lines);
        } catch (e) {
          reject(e);
        }
      });
      pdfParser.parseBuffer(buffer);
    } catch (err) {
      reject(err);
    }
  });
};

// @desc    Parse PDF to extract chapters
// @route   POST /api/chapters/parse-pdf
// @access  Admin
export const parsePdfChapters = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: 'No PDF file uploaded' });
    return;
  }
  try {
    const lines = await parsePdfBuffer(req.file.buffer);
    res.json({ success: true, text: lines.join('\n'), lines });
  } catch (error: any) {
    console.error("Error in parsePdfChapters:", error);
    res.status(500).json({ message: error.message || 'Error parsing PDF' });
  }
});

// @desc    Create Chapters with Topics (Bulk Nested)
// @route   POST /api/chapters/with-topics
// @access  Admin
export const createChaptersWithTopics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subjectId, chapters } = req.body;
  if (!subjectId || !Array.isArray(chapters) || chapters.length === 0) {
    res.status(400).json({ message: 'Subject ID and chapters array are required' });
    return;
  }

  const createdResults = [];

  for (let i = 0; i < chapters.length; i++) {
    const chData = chapters[i];
    const chTitle = typeof chData === 'string' ? chData.trim() : (chData.title || '').trim();
    if (!chTitle) continue;

    const chapter = await Chapter.create({ title: chTitle, subjectId });
    const topics = Array.isArray(chData.topics) ? chData.topics.map((t: string) => t.trim()).filter(Boolean) : [];

    let createdTopics: any[] = [];
    if (topics.length > 0) {
      const topicDocs = topics.map((tTitle: string, idx: number) => ({
        title: tTitle,
        chapterId: chapter._id,
        order: idx
      }));
      createdTopics = await Topic.insertMany(topicDocs);
    }

    createdResults.push({ chapter, topics: createdTopics });
  }

  res.status(201).json(createdResults);
});

// @desc    Create Chapter (Single or Bulk)
// @route   POST /api/chapters
// @access  Admin
export const createChapter = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, titles, subjectId } = req.body;

  if (Array.isArray(titles) && titles.length > 0) {
    const docs = titles.map((t: string) => ({ title: t.trim(), subjectId })).filter(d => d.title);
    const created = await Chapter.insertMany(docs);
    res.status(201).json(created);
    return;
  }

  const chapter = await Chapter.create({ title, subjectId });
  res.status(201).json(chapter);
});

// @desc    Get all Chapters
// @route   GET /api/chapters
// @access  Admin
export const getChapters = asyncHandler(async (req: Request, res: Response) => {
  const chapters = await Chapter.find({}).populate('subjectId');
  res.json(chapters);
});

// @desc    Update a Chapter
// @route   PUT /api/chapters/:id
// @access  Admin
export const updateChapter = asyncHandler(async (req: Request, res: Response) => {
  const { title, subjectId } = req.body;
  const chapter = await Chapter.findById(req.params.id);
  if (chapter) {
    chapter.title = title || chapter.title;
    chapter.subjectId = subjectId || chapter.subjectId;
    const updatedChapter = await chapter.save();
    res.json(updatedChapter);
  } else {
    res.status(404);
    throw new Error('Chapter not found');
  }
});

// @desc    Delete all chapters for a subject
// @route   DELETE /api/chapters/subject/:subjectId
// @access  Admin
export const deleteAllChaptersBySubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { subjectId } = req.params;
  const chapters = await Chapter.find({ subjectId });
  const chapterIds = chapters.map(c => c._id);

  await Topic.deleteMany({ chapterId: { $in: chapterIds } });
  const delRes = await Chapter.deleteMany({ subjectId });

  res.json({ message: `Successfully deleted all ${delRes.deletedCount} chapters and topics for this subject` });
});

// @desc    Delete a Chapter
// @route   DELETE /api/chapters/:id
// @access  Admin
export const deleteChapter = asyncHandler(async (req: Request, res: Response) => {
  const chapter = await Chapter.findById(req.params.id);
  if (chapter) {
    await Chapter.deleteOne({ _id: chapter._id });
    res.json({ message: 'Chapter removed' });
  } else {
    res.status(404);
    throw new Error('Chapter not found');
  }
});
