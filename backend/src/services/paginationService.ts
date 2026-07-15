import { Model, Document } from 'mongoose';

interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  populate?: any;
  sort?: any;
  lean?: boolean;
}

export const getPaginatedData = async <T extends Document>(
  model: Model<T>,
  baseQuery: any,
  reqQuery: any,
  options: PaginationOptions = {}
) => {
  const page = parseInt(reqQuery.page as string) || 1;
  const limit = parseInt(reqQuery.limit as string) || 10;
  const skip = (page - 1) * limit;

  // Build the dynamic query
  const query = { ...baseQuery };

  // Filter fields mapping
  const filterFields = [
    'examId',
    'studentTypeId',
    'categoryId',
    'subjectId',
    'chapterId',
    'status',
    'targetAudience'
  ];

  filterFields.forEach(field => {
    if (reqQuery[field]) {
      query[field] = reqQuery[field];
    }
  });

  // Search logic
  const search = reqQuery.search as string || options.search;
  if (search && options.searchFields && options.searchFields.length > 0) {
    query.$or = options.searchFields.map(field => ({
      [field]: { $regex: search, $options: 'i' }
    }));
  }

  const sort = options.sort || { createdAt: -1 };

  let dbQuery = model.find(query).sort(sort).skip(skip).limit(limit);

  if (options.populate) {
    dbQuery = dbQuery.populate(options.populate);
  }

  if (options.lean) {
    dbQuery = dbQuery.lean() as any;
  }

  const [data, total] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
