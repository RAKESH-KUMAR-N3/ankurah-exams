import express from 'express';
import { protect, authorize } from '../middlewares/authMiddleware';
import { createStudyMaterial, getStudyMaterials, updateStudyMaterial, deleteStudyMaterial } from '../controllers/studyMaterialController';
import { validate, studyMaterialSchema } from '../validations/schemas';

const router = express.Router();

router.use(protect, authorize('admin'));

router.route('/')
  .get(getStudyMaterials)
  .post(validate(studyMaterialSchema), createStudyMaterial);

router.route('/:id')
  .put(validate(studyMaterialSchema), updateStudyMaterial)
  .delete(deleteStudyMaterial);

export default router;
