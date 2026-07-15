import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Notification from '../models/Notification';

// @desc    Create a Notification
// @route   POST /api/notifications
// @access  Admin
export const createNotification = asyncHandler(async (req: Request, res: Response) => {
  const { title, message, targetAudience, examId, studentTypeId, status } = req.body;
  const notification = await Notification.create({
    title, message, targetAudience, examId, studentTypeId, status
  });
  res.status(201).json(notification);
});

// @desc    Get all Notifications
// @route   GET /api/notifications
// @access  Admin
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({})
    .populate('examId studentTypeId');
  res.json(notifications);
});

// @desc    Update a Notification
// @route   PUT /api/notifications/:id
// @access  Admin
export const updateNotification = asyncHandler(async (req: Request, res: Response) => {
  const { title, message, targetAudience, examId, studentTypeId, status } = req.body;
  const notification = await Notification.findById(req.params.id);
  
  if (notification) {
    notification.title = title || notification.title;
    notification.message = message || notification.message;
    notification.targetAudience = targetAudience || notification.targetAudience;
    notification.examId = examId || notification.examId;
    notification.studentTypeId = studentTypeId || notification.studentTypeId;
    notification.status = status || notification.status;

    const updatedNotification = await notification.save();
    res.json(updatedNotification);
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});

// @desc    Delete a Notification
// @route   DELETE /api/notifications/:id
// @access  Admin
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findById(req.params.id);
  if (notification) {
    await Notification.deleteOne({ _id: notification._id });
    res.json({ message: 'Notification removed' });
  } else {
    res.status(404);
    throw new Error('Notification not found');
  }
});
