import { Request, Response } from 'express';
import Topic from '../models/Topic';
import PDFParser from 'pdf2json';

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

export const parsePdfTopics = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No PDF file uploaded' });
  }
  try {
    const lines = await parsePdfBuffer(req.file.buffer);
    res.json({ success: true, text: lines.join('\n'), lines });
  } catch (error: any) {
    console.error("Error in parsePdfTopics:", error);
    res.status(500).json({ message: error.message || 'Error parsing PDF' });
  }
};

export const getTopicsByChapter = async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const topics = await Topic.find({ chapterId }).sort({ order: 1, createdAt: 1 });
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching topics' });
  }
};

export const createTopic = async (req: Request, res: Response) => {
  try {
    const { title, titles, chapterId, order } = req.body;

    if (Array.isArray(titles) && titles.length > 0) {
      const docs = titles.map((t: string, idx: number) => ({
        title: t.trim(),
        chapterId,
        order: (order || 0) + idx
      })).filter(d => d.title);
      const created = await Topic.insertMany(docs);
      return res.status(201).json(created);
    }

    const topic = new Topic({ title, chapterId, order });
    await topic.save();
    res.status(201).json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating topic' });
  }
};

export const updateTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;
    const topic = await Topic.findByIdAndUpdate(id, { title, order }, { new: true });
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating topic' });
  }
};

export const deleteTopic = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const topic = await Topic.findByIdAndDelete(id);
    if (!topic) return res.status(404).json({ message: 'Topic not found' });
    res.json({ message: 'Topic deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting topic' });
  }
};
