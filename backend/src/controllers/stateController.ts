import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import State from '../models/State';

// @desc    Get all states
// @route   GET /api/states
// @access  Public
export const getStates = asyncHandler(async (req: Request, res: Response) => {
  let states = await State.find({});
  if (states.length === 0) {
    states = await State.insertMany([
      { name: 'Andhra Pradesh', code: 'AP', isActive: true },
      { name: 'Telangana', code: 'TG', isActive: true },
    ]);
  }
  res.json(states);
});

// @desc    Create a state
// @route   POST /api/states
// @access  Admin
export const createState = asyncHandler(async (req: Request, res: Response) => {
  const { name, code } = req.body;
  if (!name || !code) {
    res.status(400);
    throw new Error('Please provide state name and code');
  }

  const existingState = await State.findOne({ code: code.toUpperCase() });
  if (existingState) {
    res.status(400);
    throw new Error('State code already exists');
  }

  const state = await State.create({
    name,
    code: code.toUpperCase(),
  });

  res.status(201).json(state);
});

// @desc    Delete a state
// @route   DELETE /api/states/:id
// @access  Admin
export const deleteState = asyncHandler(async (req: Request, res: Response) => {
  const state = await State.findById(req.params.id);
  if (state) {
    await State.deleteOne({ _id: state._id });
    res.json({ message: 'State removed' });
  } else {
    res.status(404);
    throw new Error('State not found');
  }
});
