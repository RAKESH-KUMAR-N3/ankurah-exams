import { Request, Response } from 'express';
import Topic from '../models/Topic';

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
    const { title, chapterId, order } = req.body;
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
