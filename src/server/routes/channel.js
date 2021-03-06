import express from 'express';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import guard from 'connect-ensure-login';
import Account from '../models/account';
import Category from '../models/category';
import Media from '../models/media';

const router = express.Router();


router.get('/', guard.ensureLoggedIn(), async (req, res) => {
  const user = await Account.findById(req.user._id);
  const categories = await Category.find();
  res.render('channel/video', { user, categories, success: req.flash('success'), error: req.flash('error'), layout: 'layouts/user' });
});


router.get('/video', guard.ensureLoggedIn(), async (req, res) => {
  const user = await Account.findById(req.user._id);
  const videos = await Media.find({ _createdBy: req.user._id, type: 'video' }).populate('_subCategoryId');
  res.render('channel/video', { user, videos, success: req.flash('success'), error: req.flash('error'), layout: 'layouts/user' });
});

router.get('/music', guard.ensureLoggedIn(), async (req, res) => {
  const user = await Account.findById(req.user._id);
  const musics = await Media.find({ _createdBy: req.user._id, type: 'music' }).populate('_subCategoryId');
  res.render('channel/music', { user, musics, success: req.flash('success'), error: req.flash('error'), layout: 'layouts/user' });
});

router.get('/animator', guard.ensureLoggedIn(), async (req, res) => {
  const user = await Account.findById(req.user._id);
  const animators = await Media.find({ _createdBy: req.user._id, type: 'animator' }).populate('_subCategoryId');
  res.render('channel/animator', { user, animators, success: req.flash('success'), error: req.flash('error'), layout: 'layouts/user' });
});


router.post('/', async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    const fileUpload = files.media;
    const member = fields;

    if (member.title === null || member.price === null || member.description === null || member.forWho === null || member.subCatId === null || member.type === null) {
      req.flash('error', 'Please Fill All The Required Forms');
      res.redirect('/upload');
    }

    if (fileUpload && fileUpload.name) {
      const name = `${Math.round(Math.random() * 10000)}.${fileUpload.name.split('.').pop()}`;
      const dest = path.join(__dirname, '..', 'public', 'assets', 'user', 'media', name);
      const data = fs.readFileSync(fileUpload.path);
      fs.writeFileSync(dest, data);
      fs.unlinkSync(fileUpload.path);
      member.media = name;
    }

    const newUpload = new Media();
    newUpload._createdBy = req.user._id;
    newUpload._subCategoryId = member.subCatId;
    newUpload.media = member.media;
    newUpload.title = member.title;
    newUpload.price = member.price;
    newUpload.type = member.type;
    newUpload.description = member.description;
    newUpload.forWho = member.forWho;
    newUpload.save((err) => {
      if (err) {
        console.log(err);
      } else {
        req.flash('success', 'File Upload Successfully');
        res.redirect('/upload');
      }
    });
  });
});


export default router;
