import { Request, Response } from 'express';
import fs from 'fs';
import csvParser from 'csv-parser';
import Question from '../models/Question';
import StudyMaterial from '../models/StudyMaterial';

// Multer augments Express.Request with `file`, but the typed interface requires explicit extension
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}


export const importQuestions = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        // Assume CSV headers: categoryId, examId, subjectId, chapterId, content, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, marks, negativeMarks
        const options = [data.optionA, data.optionB, data.optionC, data.optionD].filter(Boolean);
        
        results.push({
          categoryId: data.categoryId,
          examId: data.examId,
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          content: data.content,
          options,
          correctAnswer: data.correctAnswer,
          explanation: data.explanation,
          difficulty: data.difficulty || 'Medium',
          marks: Number(data.marks),
          negativeMarks: Number(data.negativeMarks)
        });
      })
      .on('end', async () => {
        try {
          await Question.insertMany(results);
          fs.unlinkSync(req.file!.path); // Clean up
          res.json({ message: `${results.length} questions imported successfully.` });
        } catch (insertError: any) {
          fs.unlinkSync(req.file!.path); // Clean up
          res.status(500).json({ message: insertError.message });
        }
      });
  } catch (error: any) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};

export const importMaterials = async (req: MulterRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
      .pipe(csvParser())
      .on('data', (data) => {
        // Assume CSV headers: categoryId, examId, studentTypeId, subjectId, chapterId, title, type, url
        results.push({
          categoryId: data.categoryId,
          examId: data.examId,
          studentTypeId: data.studentTypeId || undefined,
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          title: data.title,
          type: data.type,
          url: data.url
        });
      })
      .on('end', async () => {
        try {
          await StudyMaterial.insertMany(results);
          fs.unlinkSync(req.file!.path); // Clean up
          res.json({ message: `${results.length} materials imported successfully.` });
        } catch (insertError: any) {
          fs.unlinkSync(req.file!.path); // Clean up
          res.status(500).json({ message: insertError.message });
        }
      });
  } catch (error: any) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: error.message });
  }
};
