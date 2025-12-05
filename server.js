const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const path = require('path');

const app = express();

// MongoDB connection
mongoose.connect('mongodb+srv://admin:admin1234@cluster0.2v66n.mongodb.net/?appName=Cluster0')
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Public')));
app.use('/videos', express.static(path.join(__dirname, 'Public')));
app.use(session({
  secret: 'pathology-museum-secret',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.render('signup', { error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    
    req.session.user = { id: user._id, email: user.email };
    res.redirect('/');
  } catch (error) {
    res.render('signup', { error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    
    req.session.user = { id: user._id, email: user.email };
    res.redirect('/');
  } catch (error) {
    res.render('login', { error: 'Login failed' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/description/:type', (req, res) => {
  const { type } = req.params;
  const descriptions = {
    'intestinal-gangrene': `
      <p><strong>Specimen ID:</strong> GIT 10</p>
      <p><strong>DIAGNOSIS:</strong> Intestinal Gangrene</p>
      <p><strong>CLINICAL PRESENTATION:</strong> 50-year-old male presented with severe abdominal pain, nausea, and vomiting.</p>
      <p><strong>GROSS:</strong> Specimen of intestine shows dark-discolored external surface. On cutting open the lumen, the bowel loop is swollen, putrid, and necrotic.</p>
      <p><strong>MICROSCOPY:</strong> Sections show coagulative necrosis of bowel wall with underlying thrombosed vessels and chronic inflammatory cells in lamina propria. The demarcation between gangrenous segment and viable bowel is not clear-cut in wet gangrene.</p>
    `,
    'leiomyoma': `
      <p><strong>Specimen ID:</strong> FGS 2</p>
      <p><strong>DIAGNOSIS:</strong> Leiomyoma</p>
      <p><strong>CLINICAL PRESENTATION:</strong> Abnormal uterine bleeding or lower abdomen pressure-related symptoms.</p>
      <p><strong>GROSS:</strong> Specimen of uterus showing well-circumscribed, round, firm, grayish-white intramural mass measuring 8 × 6 × 4 cm. Cut surface shows whorled appearance.</p>
      <p><strong>MICROSCOPY:</strong> Section studied shows a tumour with whorled pattern of smooth muscle bundles separated by well-vascularized connective tissue.</p>
    `,
    'acute-appendicitis': `
      <p><strong>Specimen ID:</strong> GIT 45</p>
      <p><strong>DIAGNOSIS:</strong> Acute Appendicitis</p>
      <p><strong>CLINICAL PRESENTATION:</strong> 8-year-old male with pain in right side of abdomen since one day.</p>
      <p><strong>GROSS:</strong> Received tubular appendix measuring 5 cm in length. External surface appears congested. Cut section shows patent lumen filled with fecolith.</p>
      <p><strong>MICROSCOPY:</strong> Sections from appendix show lumen lined by unremarkable columnar epithelium. Lamina propria shows abundant neutrophils along with lymphoplasmacytic inflammation. Muscularis propria shows inflammation comprising neutrophils, lymphocytes, plasma cells and occasional eosinophils. Serosa shows congested blood vessels.</p>
    `,
    'lipoma': `
      <p><strong>Specimen ID:</strong> BST 6</p>
      <p><strong>DIAGNOSIS:</strong> Lipoma</p>
      <p><strong>CLINICAL PRESENTATION:</strong> Presents a lump which has a static growth after initial growth period. Does not regress even with starvation. Becomes hard after application of ice.</p>
      <p><strong>GROSS:</strong> Bright yellow homogeneous mass, measuring 2 cm in diameter. Fibrous capsule (superficial lesions only) and trabeculae. Cut surface is greasy. These type of lesions might be large particularly if they are deep.</p>
      <p><strong>MICROSCOPIC:</strong> Mature white adipose tissue without atypia. Cytoplasmic vacuoles are relatively uniform. May have intranuclear vacuoles, thickened fibrous septa in buttocks, foot or hand. May contain areas of fat necrosis with histiocytes, infarct, or calcification. Rarely contains bone or cartilage. No mitotic figures.</p>
    `
  };
  
  if (descriptions[type]) {
    res.render('description', { content: descriptions[type] });
  } else {
    res.redirect('/');
  }
});

app.get('/video/:type', (req, res) => {
  const { type } = req.params;
  console.log('Video request for type:', type);
  const videos = {
    'intestinal-gangrene': 'intestinal.mp4',
    'leiomyoma': 'Leiomyoma.mp4',
    'acute-appendicitis': 'acute.mp4',
    'lipoma': 'lipoma.mp4'
  };
  
  if (videos[type]) {
    console.log('Playing video:', videos[type]);
    res.render('video', { video: videos[type] });
  } else {
    console.log('Video not found for type:', type);
    res.redirect('/');
  }
});

app.get('/model/:type', (req, res) => {
  const { type } = req.params;
  const models = {
    'intestinal-gangrene': 'intestinalGangren.fbx',
    'leiomyoma': 'leiomyoma.fbx',
    'acute-appendicitis': 'acuteAppendicitis.fbx',
    'lipoma': 'lipoma.fbx'
  };
  
  if (models[type]) {
    res.render('model-viewer', { 
      modelFile: models[type], 
      title: type.replace('-', ' ').toUpperCase(),
      user: req.session.user 
    });
  } else {
    res.redirect('/');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});