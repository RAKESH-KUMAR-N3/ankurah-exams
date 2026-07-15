import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import Category from '../models/Category';
import { getPaginatedData } from '../services/paginationService';

// @desc    Create a Category
// @route   POST /api/categories
// @access  Admin
export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const category = await Category.create({ name });
  res.status(201).json(category);
});

// @desc    Get all Categories
// @route   GET /api/categories
// @access  Admin
export const getCategories = asyncHandler(async (req: Request, res: Response) => {
  const result = await getPaginatedData(Category, {}, req.query, {
    searchFields: ['name'],
    lean: true
  });
  res.json(result);
});

// @desc    Update a Category
// @route   PUT /api/categories/:id
// @access  Admin
export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body;
  const category = await Category.findById(req.params.id);
  if (category) {
    category.name = name || category.name;
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});

// @desc    Delete a Category
// @route   DELETE /api/categories/:id
// @access  Admin
export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (category) {
    await Category.deleteOne({ _id: category._id });
    res.json({ message: 'Category removed' });
  } else {
    res.status(404);
    throw new Error('Category not found');
  }
});
