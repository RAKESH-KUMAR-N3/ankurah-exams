import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User';
import { connectDB } from './config/db';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123123', salt);

    const adminExists = await User.findOne({ email: 'admin123@gmail.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin123@gmail.com',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('Admin user seeded');
    } else {
      console.log('Admin already exists');
    }

    const studentExists = await User.findOne({ email: 'student123@gmail.com' });
    if (!studentExists) {
      await User.create({
        name: 'Student User',
        email: 'student123@gmail.com',
        password: hashedPassword,
        role: 'student',
      });
      console.log('Student user seeded');
    } else {
      console.log('Student already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
};

seedUsers();
