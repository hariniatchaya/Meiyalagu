
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, ArrowRight, Bell, BookOpen, Check, ChevronRight, ClipboardCheck,
  FileText, HeartPulse, History, ImagePlus, Info, LayoutDashboard, MapPin,
  Menu, Microscope, Moon, Plus, Printer, RotateCcw, ScanFace, Search, Settings,
  ShieldAlert, ShieldCheck, Sparkles, Stethoscope, Sun, Trash2, UploadCloud,
  UserRound, X, Eye, EyeOff, Clock3, Save, Languages, Navigation, Phone, Hospital, Globe2, Mail, LockKeyhole
} from 'lucide-react';
import './style.css';
import { translateDocument, translateUiString, EN_TA } from './i18n';
import {
  uploadAnalysisImage,
  predictAnalysis,
  getSavedAnalysis,
  ApiError,
  API_BASE,
  loginUser,
  registerUser,
  submitRiskAssessment,
  getCurrentUser,
  updateCurrentUser
} from './services/api';

const CONDITIONS = [
  {
    name: 'Melanocytic nevus',
    image: '/disease-images/nevus.jpg',
    alias: 'Common mole',
    tone: 'brown',
    what: 'A mole is a small growth made of pigment-producing skin cells. Most moles are harmless.',
    simple: 'It usually looks like a brown or black spot that stays similar in size, shape, and color.',
    appearance: 'Usually round or oval with a fairly even color and clear border.',
    symptoms: 'Usually none. A changing, itchy, painful, or bleeding mole should be checked.',
    locations: 'Can appear almost anywhere on the skin.',
    risk: 'Many moles, family history, and UV exposure can increase concern.',
    care: 'Use sun protection and watch for meaningful changes over time.',
    seek: 'Seek medical advice if a mole is new, changing, bleeding, painful, or very different from your other moles.'
  },
  {
    name: 'Melanoma',
    image: '/disease-images/melanoma.jpg',
    alias: 'A type of skin cancer',
    tone: 'dark',
    what: 'Melanoma develops in pigment-producing skin cells and can become serious if not treated.',
    simple: 'It may look like a new dark spot or a mole that changes in size, shape, or color.',
    appearance: 'May be asymmetric, have uneven borders, several colors, or change over time.',
    symptoms: 'May have no symptoms. It can sometimes itch, bleed, hurt, or grow.',
    locations: 'Can occur anywhere, including areas not often exposed to sunlight.',
    risk: 'UV exposure, prior melanoma, family history, and some mole patterns.',
    care: 'Protect skin from UV and do not ignore noticeable changes.',
    seek: 'Prompt clinical assessment is important for a suspicious or changing mole.'
  },
  {
    name: 'Basal cell carcinoma',
    image: '/disease-images/bcc.jpg',
    alias: 'BCC',
    tone: 'pink',
    what: 'A common skin cancer that begins in basal cells. It often grows slowly but still needs treatment.',
    simple: 'It can look like a shiny bump, a pink patch, or a sore that keeps coming back.',
    appearance: 'Pearly or shiny bump, pink patch, crusted area, or a sore that does not heal.',
    symptoms: 'May bleed, crust, feel tender, or fail to heal.',
    locations: 'Often appears on sun-exposed skin such as the face, scalp, ears, or neck.',
    risk: 'Long-term UV exposure and previous skin cancer.',
    care: 'Use sun protection and have persistent sores or changing lesions assessed.',
    seek: 'See a clinician if a sore does not heal, keeps bleeding, or keeps returning.'
  },
  {
    name: 'Actinic keratosis',
    image: '/disease-images/actinic.jpg',
    alias: 'Sun-damage spot',
    tone: 'rough',
    what: 'A rough, scaly patch often caused by long-term sun exposure.',
    simple: 'It may feel dry or sandpapery and can be easier to feel than to see.',
    appearance: 'Rough, dry, scaly patch that may be pink, red, tan, brown, or skin-colored.',
    symptoms: 'Dryness, roughness, mild tenderness, or itching.',
    locations: 'Face, ears, scalp, forearms, and backs of hands.',
    risk: 'Long-term sun exposure, age, and immune suppression.',
    care: 'Sun protection is important. Persistent patches should be checked.',
    seek: 'Seek advice if a rough patch persists, grows, becomes painful, or bleeds.'
  },
  {
    name: 'Benign keratosis',
    image: '/disease-images/benign-keratosis.jpg',
    alias: 'Often seborrheic keratosis',
    tone: 'tan',
    what: 'A common non-cancerous skin growth.',
    simple: 'It often looks waxy, rough, or as if it is stuck on the skin.',
    appearance: 'Tan, brown, or dark growth with a waxy or rough surface.',
    symptoms: 'Often none, though it may itch or become irritated.',
    locations: 'Trunk, face, neck, and other areas.',
    risk: 'More common with age.',
    care: 'Avoid picking or scratching. Ask a clinician if the growth changes.',
    seek: 'Get it checked if it changes rapidly, bleeds, becomes painful, or looks unusual.'
  },
  {
    name: 'Dermatofibroma',
    image: '/disease-images/dermatofibroma.jpg',
    alias: 'Usually a benign firm bump',
    tone: 'brown2',
    what: 'A small, firm skin nodule that is usually harmless.',
    simple: 'It often feels firm and may dimple slightly when the surrounding skin is pinched.',
    appearance: 'Firm pink, brown, or reddish bump.',
    symptoms: 'Usually none, but it may itch or feel tender.',
    locations: 'Commonly on the lower legs, but can occur elsewhere.',
    risk: 'Sometimes follows a minor injury or insect bite.',
    care: 'Do not try to remove it yourself.',
    seek: 'Seek medical advice if it changes, grows quickly, or becomes painful.'
  },
  {
    name: 'Vascular lesion',
    image: '/disease-images/vascular.jpg',
    alias: 'Blood-vessel skin mark',
    tone: 'red',
    what: 'A broad term for marks or growths involving blood vessels.',
    simple: 'These may look red, pink, purple, or blue and can be flat or raised.',
    appearance: 'Red, pink, purple, or bluish area that may be flat or raised.',
    symptoms: 'Often none, though some can bleed if irritated.',
    locations: 'Can occur anywhere on the body.',
    risk: 'Depends on the specific type.',
    care: 'Avoid irritating the area and monitor for change.',
    seek: 'See a clinician if it changes, becomes painful, or bleeds repeatedly.'
  },
];

const NAV = [
  ['Dashboard', LayoutDashboard, 'dashboard'],
  ['Analyze Skin', ScanFace, 'analyze'],
  ['History', History, 'history'],
  ['Risk Screening', ShieldAlert, 'risk'],
  ['About Diseases', Microscope, 'conditions'],
  ['Nearby Care', MapPin, 'nearby'],
  ['Reports', FileText, 'reports'],
];

const APPEARANCE = ['Color change','Redness','Dark/black spot','Raised/bumpy area','Scaly/dry skin','Rash','Blister','Wound/ulcer','Mole/spot changing','Other'];
const SYMPTOMS = ['Itching','Pain','Burning','Tenderness','Bleeding','Swelling','Discharge','No symptoms','Other'];
const DURATION = ['Less than 1 week','1–2 weeks','2–4 weeks','1–3 months','More than 3 months','Not sure'];
const SIZES = ['Very small','<5 mm','5–10 mm','10–20 mm','>20 mm','Not sure'];

function App() {
  const [page, setPage] = useState('dashboard');
  const [loggedIn, setLoggedIn] = useState(() => {
    return Boolean(localStorage.getItem('access_token') || localStorage.getItem('meiyalagu_demo_session'));
  });
  const [authMode, setAuthMode] = useState('login');
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('meiyalagu_user') || 'null'); }
    catch { return null; }
  });
  const [dark, setDark] = useState(false);
  const [language, setLanguage] = useState(() => localStorage.getItem('meiyalagu_language') || 'en');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [image, setImage] = useState('');
  const [imageName, setImageName] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [analysisBusy, setAnalysisBusy] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewTool, setPreviewTool] = useState('zoom');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [records, setRecords] = useState(() => {
    try { return JSON.parse(localStorage.getItem('meiyalagu_records') || '[]'); }
    catch { return []; }
  });
  const [side, setSide] = useState('Front');
  const [marks, setMarks] = useState([]);
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [conditionFocus, setConditionFocus] = useState(0);
  const [form, setForm] = useState({
    duration:'', appearance:[], symptoms:[], size:'', trend:'', spread:'',
    similar:'', sunlight:'', cream:'', doctor:'', notes:''
  });
  const fileRef = useRef(null);

  const currentRecord = records.find(r => r.id === selectedRecord) || records[0];

  // Whole-site bilingual layer: translates every rendered label, paragraph, form control,
  // disease description, notification and accessibility label, and reverses cleanly to English.
  useEffect(() => {
    const apply = () => translateDocument(document.body, language);
    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:['placeholder','title','aria-label']});
    return () => observer.disconnect();
  }, [language]);

  useEffect(() => {
    if (loggedIn) {
      getCurrentUser()
        .then(u => {
          if (u && u.name) {
            setCurrentUser(u);
            localStorage.setItem('meiyalagu_user', JSON.stringify(u));
          }
        })
        .catch(err => {
          console.warn('Could not fetch user details from MySQL:', err);
          if (err?.code === 'AUTH_EXPIRED') {
            handleLogout();
          }
        });
    }
  }, [loggedIn]);

  const userDisplayName = currentUser?.name || 'User';
  const userEmail = currentUser?.email || '';
  const userFirstName = userDisplayName.split(' ')[0] || userDisplayName;
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const handleLogout = () => {
    localStorage.removeItem('meiyalagu_demo_session');
    sessionStorage.removeItem('meiyalagu_demo_session');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('meiyalagu_user');
    setCurrentUser(null);
    setLoggedIn(false);
    setAuthMode('login');
  };

  const saveRecords = (next) => {
    setRecords(next);
    localStorage.setItem('meiyalagu_records', JSON.stringify(next));
  };

  const setLang = (next) => { setLanguage(next); localStorage.setItem('meiyalagu_language', next); };

  const go = (next) => {
    setPage(next);
    setMobileOpen(false);
    window.scrollTo({ top:0, behavior:'smooth' });
  };

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setAnalysisError('Please select a valid image file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setAnalysisError('Please choose an image under 10 MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
      setImageName(file.name);
      setImageFile(file);
      setAnalysisError('');
    };
    reader.readAsDataURL(file);
  };

  const runRealAnalysis = async () => {
    if (!imageFile || analysisBusy) return;
    setAnalysisBusy(true);
    setAnalysisError('');
    try {
      const uploaded = await uploadAnalysisImage(imageFile);
      const analysisId = uploaded?.analysis_id ?? uploaded?.id;
      if (analysisId === undefined || analysisId === null || analysisId === '') {
        throw new ApiError('The upload response did not include analysis_id.', 'INVALID_RESPONSE');
      }
      const predictRes = await predictAnalysis(analysisId);
      let saved = null;
      try {
        saved = await getSavedAnalysis(analysisId);
      } catch {
        saved = predictRes;
      }
      const payload = saved?.analysis ?? saved?.result ?? saved ?? predictRes;
      const predictedClass = payload?.predicted_class ?? predictRes?.predicted_class ?? predictRes?.result;
      const confidenceVal = payload?.confidence ?? predictRes?.confidence;

      if (!predictedClass || confidenceVal == null) {
        throw new ApiError('The model response is missing predicted_class or confidence.', 'INVALID_RESPONSE');
      }
      const confidenceNumber = Number(confidenceVal);
      const confidenceDisplay = Number.isFinite(confidenceNumber)
        ? `${confidenceNumber <= 1 ? (confidenceNumber * 100).toFixed(1) : confidenceNumber.toFixed(1)}%`
        : String(confidenceVal);

      const rawHeatmap = payload.heatmap_url || payload.heatmap_path || payload.heatmap || predictRes?.heatmap || predictRes?.heatmap_url;
      const fullHeatmapUrl = rawHeatmap
        ? (String(rawHeatmap).startsWith('http') ? rawHeatmap : `${API_BASE}${rawHeatmap}`)
        : null;

      const record = {
        id: String(payload.analysis_id ?? payload.id ?? analysisId),
        analysis_id: String(payload.analysis_id ?? payload.id ?? analysisId),
        record_id: payload.record_id || `MY-${analysisId}`,
        type: 'analysis',
        date: payload.created_at ? new Date(payload.created_at).toLocaleString(language==='ta' ? 'ta-IN' : 'en-IN') : new Date().toLocaleString(language==='ta' ? 'ta-IN' : 'en-IN'),
        name: imageName,
        image,
        condition: String(predictedClass),
        predicted_class: String(predictedClass),
        risk: payload.risk_level || predictRes?.risk_level || 'Prediction returned',
        status: payload.status || 'completed',
        confidence: confidenceDisplay,
        confidence_raw: confidenceVal,
        heatmap_url: fullHeatmapUrl,
        recommendation: 'AI image classification is informational and is not a confirmed medical diagnosis.'
      };
      const next = [record, ...records.filter(r => String(r.analysis_id ?? r.id) !== String(record.analysis_id))];
      saveRecords(next);
      setSelectedRecord(record.id);
      go('result');
    } catch (error) {
      const message = error instanceof ApiError ? error.message : (error?.message || 'Could not complete analysis. Check your connection and try again.');
      setAnalysisError(message);
    } finally {
      setAnalysisBusy(false);
    }
  };

  const addMark = (region, x=50, y=50) => {
    setMarks(prev => [...prev, { id: Date.now()+Math.random(), side, x, y, region }]);
  };

  const toggleMulti = (key, value) => {
    setForm(prev => {
      const has = prev[key].includes(value);
      return {...prev, [key]: has ? prev[key].filter(v => v !== value) : [...prev[key], value]};
    });
  };

  const saveScreening = async () => {
    const item = {
      id: Date.now(),
      type: 'screening',
      date: new Date().toLocaleString(language==='ta' ? 'ta-IN' : 'en-IN'),
      name: 'Skin concern screening',
      image: '',
      condition: 'Self-reported skin concern',
      risk: 'Not medically assessed',
      confidence: '—',
      screening: {...form, locations: marks}
    };
    try {
      await submitRiskAssessment({
        body_location: marks.map(m => m.region),
        duration: form.duration || null,
        appearance: form.appearance || [],
        symptoms: form.symptoms || [],
        size: form.size || null,
        change_status: form.trend || null,
        spread_status: form.spread || null,
        history: {
          similar: form.similar || null,
          sunlight: form.sunlight || null,
          cream: form.cream || null,
          doctor: form.doctor || null
        },
        notes: form.notes || null
      });
    } catch (e) {
      console.warn('Risk screening backend sync notice:', e);
    }
    saveRecords([item, ...records]);
    setSelectedRecord(item.id);
    go('history');
  };

  if (!loggedIn) return <LoginPage
    language={language}
    setLang={setLang}
    onLogin={(user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('meiyalagu_user', JSON.stringify(user));
      }
      localStorage.setItem('meiyalagu_demo_session','1');
      setLoggedIn(true);
    }}
    authMode={authMode}
    setAuthMode={setAuthMode}
  />;

  return <div className={`app ${dark ? 'dark' : ''}`}>
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="brand" onClick={() => go('dashboard')}>
        <img className="brand-logo" src={language==='ta' ? '/logo-ta.png' : '/logo-en.png'} alt={language==='ta' ? 'மெய்யழகு AI' : 'Meiyalagu AI'} />
        <div className="brand-wordmark">
          <b>Meiyalagu AI</b>
          <small>{language==='ta' ? 'தோல் நலத் துணை' : 'Skin health companion'}</small>
        </div>
        <button className="close-nav" onClick={(e)=>{e.stopPropagation();setMobileOpen(false)}}><X size={18}/></button>
      </div>

      <div className="nav-caption">WORKSPACE</div>
      <nav>
        {NAV.map(([label, Icon, id]) =>
          <button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>go(id)}>
            <Icon size={18}/><span>{language==='ta' ? ({Dashboard:'முகப்புப்பக்கம்','Analyze Skin':'தோல் படத்தை ஆய்வு செய்',History:'வரலாறு','Risk Screening':'ஆபத்து மதிப்பீடு','About Diseases':'நோய்கள் பற்றி','Nearby Care':'அருகிலுள்ள மருத்துவம்',Reports:'அறிக்கைகள்'}[label] || label) : label}</span>
          </button>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="care-card">
          <div className="care-icon"><ShieldCheck size={18}/></div>
          <b>Care starts with awareness</b>
          <p>Track changes and prepare for informed conversations with a clinician.</p>
          <button onClick={()=>go('risk')}>Start self-check <ArrowRight size={14}/></button>
        </div>
        <button className="nav-item" onClick={()=>go('profile')}><Settings size={18}/><span>Settings</span></button>
        <div className="user-row" onClick={()=>go('profile')} style={{cursor:'pointer'}} title={userDisplayName}>
          <div className="avatar">{userInitials}</div>
          <div><b>{userDisplayName}</b><small>{userEmail || (language==='ta' ? 'தனிப்பட்ட பணிப்பகுதி' : 'Personal workspace')}</small></div>
        </div>
      </div>
    </aside>

    {mobileOpen && <div className="scrim" onClick={()=>setMobileOpen(false)}/>}

    <main className="main">
      <header className="topbar">
        <button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button>
        <div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><b>{pageTitle(page)}</b></div>
        <div className="top-right">
          <div className="language-switch"><Languages size={15}/><button className={language==='en'?'selected':''} onClick={()=>setLang('en')}>EN</button><button className={language==='ta'?'selected':''} onClick={()=>setLang('ta')}>தமிழ்</button></div>
          <button className="icon-btn" onClick={()=>setDark(!dark)} title="Toggle theme">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
          <button className="icon-btn" title="Notifications"><Bell size={18}/></button>
          <button className="signout-btn" onClick={handleLogout} title={language==='ta'?'வெளியேறு':'Sign out'}>{language==='ta'?'வெளியேறு':'Sign out'}</button>
          <div className="avatar" onClick={()=>go('profile')} style={{cursor:'pointer'}} title={userDisplayName}>{userInitials}</div>
        </div>
      </header>

      <div className="content">
        {page==='dashboard' && <Dashboard records={records} go={go} user={currentUser} onOpen={(id,type)=>{setSelectedRecord(id);go(type==='screening'?'risk':'result')}}/>}

        {page==='analyze' && <section>
          <Heading title="Analyze skin" sub="Upload a clear image of one skin concern. This frontend is ready for backend integration." />
          <div className="two-col analyze-reference-grid">
            <div className="panel analyze-upload-panel">
              <div className="panel-heading"><div><h3>Upload image</h3><p>JPG, PNG or WEBP · up to 10 MB</p></div><span className="step-tag">STEP 01</span></div>
              <div className="dropzone reference-dropzone" onClick={()=>fileRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleFile(e.dataTransfer.files[0])}}>
                {image ? <><img className="uploaded-thumb" src={image} alt="Selected skin image"/><b>{imageName}</b><p>Image uploaded — replace it or continue to preview</p></> : <><div className="upload-symbol"><UploadCloud size={26}/></div><b>Drag & drop your image here</b><p>or browse from your device</p></>}
                <div className="upload-actions"><button className="btn" onClick={e=>{e.stopPropagation();fileRef.current?.click()}}><ImagePlus size={15}/>{image?'Replace image':'Choose image'}</button>{image&&<button className="btn btn-primary" onClick={e=>{e.stopPropagation();setPreviewZoom(1);setPreviewTool('zoom')}}><ScanFace size={15}/>Analyze and crop</button>}</div>
                <small>Use a focused, well-lit image. Avoid including identifying details.</small>
              </div>
              <div className="privacy-line"><ShieldCheck size={16}/><span>Image is previewed locally and sent to the configured backend when you analyze.</span></div>
            </div>
            <div className="panel analyze-preview-panel">
              <div className="panel-heading"><div><h3>Image preview</h3><p>Review before continuing</p></div></div>
              {image ? <>
                <div className={'image-preview reference-image-preview '+(previewTool==='pan'?'pan-mode':'')}>
                  <img src={image} alt="Selected skin concern preview" style={{transform:`scale(${previewZoom})`}}/>
                  
                  <div className="preview-tools"><button className={previewTool==='zoom'?'active':''} onClick={()=>setPreviewTool('zoom')}><Search size={13}/> Zoom</button><button className={previewTool==='pan'?'active':''} onClick={()=>setPreviewTool('pan')}><Navigation size={13}/> Pan</button><button className={previewTool==='crop'?'active':''} onClick={()=>setPreviewTool('crop')}><ScanFace size={13}/> Crop to blemish</button></div>
                </div>
                <div className="zoom-controls"><button className="btn btn-sm" onClick={()=>setPreviewZoom(z=>Math.max(.7,z-.15))}>−</button><span>{Math.round(previewZoom*100)}%</span><button className="btn btn-sm" onClick={()=>setPreviewZoom(z=>Math.min(2.5,z+.15))}>+</button><button className="text-btn" onClick={()=>setPreviewZoom(1)}>Reset</button></div>
              </> : <div className="preview-empty reference-empty"><ImagePlus size={30}/><b>No image selected</b><span>Your image will appear here</span></div>}
              {analysisError && <div className="api-error" role="alert">{analysisError}</div>}
              <div className="analysis-status"><div><b>{image?'Analyzing image quality…':'Waiting for image'}</b><small>{image?'Image selected. Submit it to the configured AI backend for prediction.':'Upload an image to begin.'}</small></div><span className={'quality-spinner '+(image?'visible':'')}></span><button className="btn btn-primary" disabled={!imageFile || analysisBusy} onClick={runRealAnalysis}>{analysisBusy ? 'Uploading and predicting…' : 'Analyze image'} <ArrowRight size={15}/></button></div>
            </div>
          </div>
          <div className="notice"><Info size={17}/><p><b>Important:</b> This frontend does not diagnose skin conditions. Connect a validated model/API before enabling real AI predictions.</p></div>
        </section>}

        {page==='result' && <AnalysisResult item={currentRecord} go={go}/>}

        {page==='conditions' && <Conditions initialIndex={conditionFocus} language={language}/ >}

        {page==='nearby' && <NearbyCare language={language}/>}

        {page==='risk' && <section>
          <Heading title="Risk screening" sub="Record what you notice about a skin concern. This is informational and not a medical risk score." />
          <div className="risk-grid">
            <div className="panel body-panel">
              <div className="panel-heading"><div><h3>Mark affected area</h3><p>Tap the approximate location on the body.</p></div><span className="step-tag">STEP 01</span></div>
              <div className="segmented">
                <button className={side==='Front'?'chosen':''} onClick={()=>setSide('Front')}><UserRound size={15}/> Front</button>
                <button className={side==='Back'?'chosen':''} onClick={()=>setSide('Back')}><RotateCcw size={15}/> Back</button>
              </div>
              <div className="body-stage">
                <div className="body-instruction"><MapPin size={14}/> Tap silhouette to mark a concern</div>
                <HumanBody side={side} marks={marks.filter(m=>m.side===side)} onSelect={addMark} language={language} />
              </div>
              <div className="marked-list">
                {marks.length
                  ? marks.map(m => <div className="marked-item" key={m.id}>
                      <MapPin size={15}/><span><b>{language==='ta' ? (REGION_TA[m.region] || m.region) : m.region}</b><small>{language==='ta' ? (m.side==='Front'?'முன்புறம்':'பின்புறம்') : `${m.side} view`}</small></span>
                      <button className="icon-btn small" onClick={()=>setMarks(marks.filter(x=>x.id!==m.id))}><X size={15}/></button>
                    </div>)
                  : <p className="empty-note">No locations marked yet.</p>
                }
              </div>
            </div>

            <div className="panel">
              <div className="panel-heading"><div><h3>Skin concern details</h3><p>Fill only what you know.</p></div><span className="step-tag">STEP 02</span></div>

              <Field label="How long have you had this skin issue?">
                <select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}>
                  <option value="">Choose duration</option>
                  {DURATION.map(x=><option key={x}>{x}</option>)}
                </select>
              </Field>

              <Field label="Appearance" helper="Select all that apply">
                <div className="choice-grid">
                  {APPEARANCE.map(x=><button key={x} className={`choice ${form.appearance.includes(x)?'selected':''}`} onClick={()=>toggleMulti('appearance',x)}>{form.appearance.includes(x)&&<Check size={13}/>} {x}</button>)}
                </div>
              </Field>

              <Field label="Symptoms" helper="Select all that apply">
                <div className="choice-grid">
                  {SYMPTOMS.map(x=><button key={x} className={`choice ${form.symptoms.includes(x)?'selected':''}`} onClick={()=>toggleMulti('symptoms',x)}>{form.symptoms.includes(x)&&<Check size={13}/>} {x}</button>)}
                </div>
              </Field>

              <Field label="Approximate size">
                <select value={form.size} onChange={e=>setForm({...form,size:e.target.value})}>
                  <option value="">Choose size</option>{SIZES.map(x=><option key={x}>{x}</option>)}
                </select>
              </Field>

              <Field label="How is it changing?">
                <div className="radio-row">
                  {['Getting better','Staying the same','Getting worse','Not sure'].map(x=><button key={x} className={`radio-chip ${form.trend===x?'selected':''}`} onClick={()=>setForm({...form,trend:x})}>{x}</button>)}
                </div>
              </Field>

              <Field label="Has it recently appeared or spread?">
                <div className="radio-row">
                  {['Recently appeared','Spread','Neither','Not sure'].map(x=><button key={x} className={`radio-chip ${form.spread===x?'selected':''}`} onClick={()=>setForm({...form,spread:x})}>{x}</button>)}
                </div>
              </Field>

              <details className="optional-details">
                <summary>Optional history questions</summary>
                {[
                  ['similar','Have you had a similar skin issue before?'],
                  ['sunlight','Significant sunlight exposure recently?'],
                  ['cream','Applied any cream or medicine?'],
                  ['doctor','Has a doctor examined this before?']
                ].map(([key,label])=><Field key={key} label={label}>
                  <select value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}>
                    <option value="">Not answered</option><option>Yes</option><option>No</option><option>Not sure</option>
                  </select>
                </Field>)}
              </details>

              <Field label="Anything else you would like to tell us?">
                <textarea rows="4" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Describe anything else you have noticed..."/>
              </Field>

              <button className="btn btn-primary full" onClick={()=>setSummaryVisible(true)}><ClipboardCheck size={16}/> Review screening summary</button>
            </div>
          </div>

          {summaryVisible && <div className="panel summary-panel">
            <div className="panel-heading">
              <div><h3>Skin concern summary</h3><p>Review your information before saving.</p></div>
              <button className="text-btn" onClick={()=>setSummaryVisible(false)}><Settings size={14}/> Edit</button>
            </div>
            <div className="summary-grid">
              <Summary icon={MapPin} label="Location" value={marks.length ? marks.map(m=>`${m.region} (${m.side})`).join(', ') : 'Not selected'}/>
              <Summary icon={Clock3} label="Duration" value={form.duration || 'Not answered'}/>
              <Summary icon={Activity} label="Size" value={form.size || 'Not answered'}/>
              <Summary icon={Eye} label="Appearance" value={form.appearance.join(', ') || 'Not answered'}/>
              <Summary icon={HeartPulse} label="Symptoms" value={form.symptoms.join(', ') || 'Not answered'}/>
              <Summary icon={ShieldAlert} label="Change" value={[form.trend,form.spread].filter(Boolean).join(' · ') || 'Not answered'}/>
            </div>
            {form.notes && <div className="summary-note"><b>Additional information</b><p>{form.notes}</p></div>}
            <div className="notice"><Info size={16}/><p>This summary records your answers only. It does not confirm a diagnosis or calculate medical risk.</p></div>
            <div className="row-end">
              <button className="btn" onClick={()=>setSummaryVisible(false)}>Edit</button>
              <button className="btn btn-primary" onClick={saveScreening}><Save size={15}/> Save summary</button>
            </div>
          </div>}
        </section>}

        {page==='history' && <HistoryPage records={records} setRecords={saveRecords} onOpen={(id,type)=>{setSelectedRecord(id);go(type==='screening'?'risk':'result')}} go={go}/>}

        {page==='reports' && <ReportsPage record={currentRecord}/>}

        {page==='profile' && <ProfilePage
          currentUser={currentUser}
          onUpdateUser={(u) => {
            setCurrentUser(u);
            localStorage.setItem('meiyalagu_user', JSON.stringify(u));
          }}
          language={language}
        />}
      </div>

      <footer><span>© 2026 Meiyalagu AI</span><span><ShieldCheck size={13}/> Informational support · Not a medical diagnosis</span></footer>
    </main>

    <input ref={fileRef} type="file" hidden accept="image/png,image/jpeg,image/webp" onChange={e=>handleFile(e.target.files[0])}/>
  </div>
}

function pageTitle(page) {
  return {
    dashboard:'Dashboard', analyze:'Analyze Skin', result:'Analysis Result',
    history:'Analysis History', risk:'Risk Screening', conditions:'Skin Conditions',
    reports:'Reports', profile:'Profile & Settings'
  }[page] || 'Dashboard';
}

function Heading({title, sub, action}) {
  return <div className="page-heading">
    <div><div className="eyebrow"><Sparkles size={13}/> MEIYALAGU AI</div><h1>{title}</h1><p>{sub}</p></div>
    {action && <div>{action}</div>}
  </div>
}

function Dashboard({records, go, onOpen, user}) {
  const firstName = user?.name ? user.name.split(' ')[0] : 'User';
  return <section>
    <Heading title={`Good morning, ${firstName}`} sub="A calm space to understand, record, and follow your skin health." action={<button className="btn btn-primary" onClick={()=>go('analyze')}><Plus size={16}/> New analysis</button>}/>
    <div className="hero-banner">
      <div className="hero-copy">
        <div className="hero-kicker"><span/> YOUR SKIN HEALTH, IN FOCUS</div>
        <h2>Small changes deserve <em>thoughtful attention.</em></h2>
        <p>Track skin concerns, organize observations, and prepare for conversations with a qualified healthcare professional.</p>
        <button className="btn btn-white" onClick={()=>go('risk')}>Start a skin self-check <ArrowRight size={16}/></button>
      </div>
      <div className="hero-visual"><div className="hero-orb"/><HeartPulse size={92} strokeWidth={1.1}/></div>
    </div>

    <div className="stats-grid">
      <Stat icon={ScanFace} label="Saved analyses" value={records.filter(r=>r.type==='analysis').length} sub="Local browser records"/>
      <Stat icon={ClipboardCheck} label="Screening summaries" value={records.filter(r=>r.type==='screening').length} sub="Self-reported observations"/>
      <Stat icon={History} label="Total records" value={records.length} sub="Across this workspace"/>
      <Stat icon={ShieldCheck} label="AI connection" value="API" sub="Configured backend status"/>
    </div>

    <div className="dashboard-grid">
      <div className="panel">
        <div className="panel-heading"><div><h3>Recent activity</h3><p>Your latest saved records</p></div><button className="text-btn" onClick={()=>go('history')}>View history <ArrowRight size={14}/></button></div>
        {records.length ? <div className="recent-list">{records.slice(0,4).map(r=><button className="recent-row" key={r.id} onClick={()=>onOpen(r.id,r.type)}>
          {r.image ? <img src={r.image} alt=""/> : <span className="recent-icon"><ClipboardCheck size={17}/></span>}
          <span className="recent-info"><b>{r.name}</b><small>{r.date}</small></span>
          <span className="pill neutral">{r.risk}</span><ChevronRight size={16}/>
        </button>)}</div> : <EmptyState icon={History} title="No activity yet" text="Upload an image or complete a self-check to create your first record." action={()=>go('analyze')}/>}
      </div>

      <div className="panel">
        <div className="panel-heading"><div><h3>Helpful reminders</h3><p>General skin-health habits</p></div><span className="round-icon"><HeartPulse size={17}/></span></div>
        <Tip n="01" title="Notice changes" text="Track spots that are new, changing, bleeding, or not healing."/>
        <Tip n="02" title="Protect from UV" text="Use shade, protective clothing, and broad-spectrum SPF 30+."/>
        <Tip n="03" title="Get professional advice" text="Photos and AI tools do not replace clinical evaluation."/>
        <button className="btn btn-outline full" onClick={()=>go('conditions')}><BookOpen size={15}/> Explore skin conditions</button>
      </div>
    </div>
  </section>
}

function Stat({icon:Icon,label,value,sub}) {
  return <div className="stat-card"><span className="stat-icon"><Icon size={18}/></span><span>{label}</span><b>{value}</b><small>{sub}</small></div>
}

function Tip({n,title,text}) {
  return <div className="tip"><span>{n}</span><div><b>{title}</b><p>{text}</p></div></div>
}

function EmptyState({icon:Icon,title,text,action}) {
  return <div className="empty-state"><span><Icon size={24}/></span><b>{title}</b><p>{text}</p>{action&&<button className="btn btn-primary" onClick={action}>Get started <ArrowRight size={15}/></button>}</div>
}

function Field({label, helper, children}) {
  return <div className="field"><label>{label}{helper&&<small>{helper}</small>}</label>{children}</div>
}

function Summary({icon:Icon,label,value}) {
  return <div className="summary-item"><span><Icon size={16}/></span><div><small>{label}</small><b>{value}</b></div></div>
}

function ProfilePage({ currentUser, onUpdateUser, language }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setEmail(currentUser.email || '');
    }
  }, [currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const updated = await updateCurrentUser({ name, email });
      if (updated) {
        onUpdateUser(updated);
        setStatusMsg(language === 'ta' ? 'சுயவிவரம் வெற்றிகரமாக MySQL தரவுத்தளத்தில் புதுப்பிக்கப்பட்டது.' : 'Profile updated successfully in MySQL Workbench database (meiyalagu_db).');
      }
    } catch (err) {
      setErrorMsg(err?.message || (language === 'ta' ? 'புதுப்பித்தல் தோல்வியடைந்தது.' : 'Failed to update profile.'));
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (name || currentUser?.name || 'User')
    .split(' ')
    .filter(Boolean)
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <section>
      <Heading title="Profile & settings" sub="Manage personal workspace and live account details synced with MySQL." />
      <div className="two-col">
        <form className="panel" onSubmit={handleSave}>
          <div className="panel-heading">
            <div>
              <h3>Personal account</h3>
              <p>Live details stored in MySQL (meiyalagu_db.users)</p>
            </div>
            <span className="step-tag">USER #{currentUser?.id || 1}</span>
          </div>
          <div className="profile-row">
            <div className="avatar large">{userInitials}</div>
            <div>
              <b>{name || currentUser?.name || 'User'}</b>
              <small>{email || currentUser?.email || 'Active workspace account'}</small>
            </div>
          </div>

          <Field label="Full name" helper="Your name displayed on dashboard, reports and header">
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Harini"
            />
          </Field>

          <Field label="Email address" helper="Login email and primary identifier in MySQL">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="e.g. user@example.com"
            />
          </Field>

          <Field label="Database connection">
            <input value="MySQL Workbench Database (meiyalagu_db.users)" readOnly />
          </Field>

          {statusMsg && <div className="notice" style={{borderColor:'#10b981', color:'#065f46'}}><Check size={16}/><b>{statusMsg}</b></div>}
          {errorMsg && <div className="api-error" role="alert">{errorMsg}</div>}

          <div className="row-end" style={{marginTop:'1.2rem'}}>
            <button className="btn btn-primary" type="submit" disabled={saving}>
              <Save size={15}/> {saving ? (language === 'ta' ? 'சேமிக்கிறது…' : 'Saving to MySQL…') : (language === 'ta' ? 'மாற்றங்களை சேமி' : 'Save profile changes')}
            </button>
          </div>
        </form>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <h3>System & storage status</h3>
              <p>Verified MySQL connection</p>
            </div>
          </div>
          <p className="body-copy">Your account is connected to the live Meiyalagu AI FastAPI backend with MySQL database integration (<code>meiyalagu_db.users</code>).</p>
          <div className="stats-grid" style={{gridTemplateColumns:'1fr 1fr', marginTop:'1rem', marginBottom:'1rem'}}>
            <Stat icon={ShieldCheck} label="Database" value="MySQL 8.4" sub="meiyalagu_db" />
            <Stat icon={UserRound} label="Account ID" value={`#${currentUser?.id || 1}`} sub="Verified user" />
          </div>
          <div className="notice"><Info size={16}/><p>AI-generated skin screening is informational and should not replace clinical medical consultation or diagnosis.</p></div>
        </div>
      </div>
    </section>
  );
}

function AnalysisResult({item, go}) {
  if (!item || item.type !== 'analysis') return <section><Heading title="Analysis result" sub="No saved image analysis is selected."/><div className="panel"><EmptyState icon={ScanFace} title="No analysis yet" text="Upload an image to create a record." action={()=>go('analyze')}/></div></section>;

  return <section>
    <Heading title="Analysis result" sub="Prediction returned by the configured backend. This is informational and not a medical diagnosis." action={<button className="btn" onClick={()=>go('reports')}><FileText size={15}/> Open report</button>}/>
    <div className="notice"><Info size={16}/><p><b>Important:</b> an image-classification result is not a confirmed medical diagnosis. Please consult a qualified clinician for concerns.</p></div>
    <div className="result-grid">
      <div className="panel">
        <div className="panel-heading"><div><h3>Submitted image</h3><p>{item.name} · {item.date}</p></div></div>
        {item.image ? <img className="result-image" src={item.image} alt="Submitted skin image"/> : <div className="preview-empty"><ImagePlus size={28}/><b>Original image unavailable</b><span>The saved record did not include a displayable image.</span></div>}
      </div>
      <div className="panel">
        <div className="eyebrow">BACKEND PREDICTION</div>
        <h2 className="result-condition">{item.condition}</h2>
        <span className="pill neutral">{item.status || item.risk || 'Status unavailable'}</span>
        <div className="confidence-display"><span>Model confidence</span><b>{item.confidence ?? 'Not provided'}</b></div>
        {item.heatmap_url && <div className="heatmap-panel"><h3>Model heatmap</h3><img className="result-image" src={item.heatmap_url} alt="Backend-generated prediction heatmap" onError={e=>{e.currentTarget.style.display='none';}}/><small>Shown only because the backend returned a heatmap URL.</small></div>}
        <div className="result-advice"><ShieldCheck size={19}/><div><b>Recommended next step</b><p>{item.recommendation}</p></div></div>
        <div className="row-end"><button className="btn" onClick={()=>go('history')}>History</button><button className="btn btn-primary" onClick={()=>go('reports')}>View report <ArrowRight size={15}/></button></div>
      </div>
    </div>
  </section>
}

function Conditions({initialIndex=0, language='en'}) {
  const [active,setActive] = useState(initialIndex);
  const [tab,setTab] = useState('Overview');
  const [filter,setFilter] = useState('');
  const filtered = CONDITIONS.filter(c => {
    const hay = `${c.name} ${c.alias} ${EN_TA[c.name]||''} ${EN_TA[c.alias]||''}`.toLowerCase();
    return hay.includes(filter.toLowerCase());
  });
  const current = CONDITIONS[active];

  return <section>
    <Heading title="Skin condition library" sub="Easy-to-understand educational information about the conditions already included in your project." />
    <div className="condition-layout">
      <aside className="condition-list">
        <label className="searchbox condition-search"><Search size={15}/><input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Find a condition"/></label>
        {filtered.map(c => {
          const idx = CONDITIONS.indexOf(c);
          return <button key={c.name} className={`condition-option ${active===idx?'active':''}`} onClick={()=>{setActive(idx);setTab('Overview')}}>
            <span className={`condition-swatch ${c.tone}`}/><span><b>{c.name}</b><small>{c.alias}</small></span><ChevronRight size={15}/>
          </button>
        })}
      </aside>

      <article className="panel condition-detail">
        <div className="condition-hero">
          <div className="condition-photo-wrap">
            <img className="condition-photo" src={current.image} alt={`Reference image: ${current.name}`} />
            <small className="image-caption">Reference image for education · not a diagnosis</small>
          </div>
          <div className="condition-intro">
            <div className="eyebrow">CONDITION GUIDE</div>
            <h2>{current.name}</h2><p className="alias">{current.alias}</p>
            <p>{current.simple}</p>
          </div>
        </div>

        <div className="tabs">
          {['Overview','Symptoms','Risk factors','Care & help'].map(t=><button key={t} className={tab===t?'active':''} onClick={()=>setTab(t)}>{t}</button>)}
        </div>

        <div className="condition-content">
          {tab==='Overview' && <>
            <InfoBlock icon={Microscope} title="What it is" text={current.what}/>
            <InfoBlock icon={Eye} title="Common appearance" text={current.appearance}/>
            <InfoBlock icon={MapPin} title="Typical locations" text={current.locations}/>
          </>}
          {tab==='Symptoms' && <InfoBlock icon={HeartPulse} title="Common symptoms" text={current.symptoms}/>}
          {tab==='Risk factors' && <InfoBlock icon={ShieldAlert} title="Possible risk factors / causes" text={current.risk}/>}
          {tab==='Care & help' && <>
            <InfoBlock icon={ShieldCheck} title="General prevention / care" text={current.care}/>
            <InfoBlock icon={Stethoscope} title="When to seek medical attention" text={current.seek}/>
          </>}
        </div>

        <div className="notice"><Info size={16}/><p>This information is educational and cannot confirm what a skin lesion is. A qualified healthcare professional should assess concerning changes.</p></div>
      </article>
    </div>
  </section>
}

function InfoBlock({icon:Icon,title,text}) {
  return <div className="info-block"><span><Icon size={17}/></span><div><b>{title}</b><p>{text}</p></div></div>
}

function HistoryPage({records,setRecords,onOpen,go}) {
  const [query,setQuery]=useState(''); const [status,setStatus]=useState('All'); const [kind,setKind]=useState('All');
  const filtered=records.filter(r=>{
    const q=query.trim().toLowerCase();
    const matches=!q||[r.name,r.condition,r.id,r.date,r.risk].some(v=>String(v||'').toLowerCase().includes(q));
    const st=status==='All'||(status==='Screening'?r.type==='screening':r.type!=='screening');
    const kd=kind==='All'||String(r.condition||'').toLowerCase().includes(kind.toLowerCase());
    return matches&&st&&kd;
  });
  return <section>
    <Heading title="Analysis History" sub="All saved patient analyses and self-check records in this browser." action={<button className="btn btn-primary" onClick={()=>go('analyze')}><Plus size={16}/> New Analysis</button>}/>
    <div className="panel history-panel">
      <div className="history-toolbar"><div><b>All Analysis Records</b> <span className="count">{filtered.length} of {records.length}</span></div><div className="history-actions"><button className="btn" onClick={()=>{const csv=[['Record ID','Name','Date','Type','Result','Risk'],...filtered.map(r=>[r.id,r.name,r.date,r.type,r.condition,r.risk])].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\n');const blob=new Blob([csv],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='meiyalagu-analysis-history.csv';a.click();URL.revokeObjectURL(url)}}><FileText size={15}/> Export CSV</button><button className="btn" onClick={()=>{if(confirm('Clear all saved local records?'))setRecords([])}}><Trash2 size={15}/> Clear history</button></div></div>
      <div className="history-filters"><label className="history-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by patient, record ID, diagnosis…"/></label><label><span>Status / Type</span><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Analysis</option><option>Screening</option></select></label><label><span>Diagnosis</span><select value={kind} onChange={e=>setKind(e.target.value)}><option>All</option>{[...new Set(records.map(r=>r.condition).filter(Boolean))].map(c=><option key={c}>{c}</option>)}</select></label></div>
      {filtered.length ? <div className="table-scroll"><table className="history-table"><thead><tr><th><input type="checkbox" aria-label="Select all (visual only)"/></th><th>RECORD ID</th><th>PATIENT / RECORD</th><th>DATE</th><th>RESULT</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><input type="checkbox" aria-label={`Select ${r.id}`}/></td><td className="record-id">MY-{String(r.id).slice(-6)}</td><td><div className="record-cell">{r.image?<img src={r.image} alt=""/>:<span className="mini-icon"><ClipboardCheck size={17}/></span>}<span><b>{r.name||'Patient record'}</b><small>{r.type==='screening'?'Risk screening':'Image analysis'}</small></span></div></td><td>{r.date}</td><td>{r.condition||'—'}</td><td><span className={`status-tag ${r.type==='screening'?'review':'complete'}`}>{r.type==='screening'?'REVIEW':'COMPLETE'}</span></td><td className="history-links"><button onClick={()=>onOpen(r.id,r.type)}>View Report</button><button onClick={()=>onOpen(r.id,r.type)}>Open</button><button className="delete-link" onClick={()=>setRecords(records.filter(x=>x.id!==r.id))}>Delete</button></td></tr>)}</tbody></table></div> : <EmptyState icon={History} title="No matching records" text={records.length?'Try changing your search or filters.':'Your analyses and screening summaries will appear here.'} action={()=>go('analyze')}/>}
    </div>
  </section>
}

function ReportsPage({record}) {
  if (!record) return <section><Heading title="Reports & Analysis" sub="Open a saved record from Analysis History to view its detailed report."/><div className="panel"><EmptyState icon={FileText} title="No report available" text="Create an analysis or screening record first, then select it from History."/></div></section>;
  return <section>
    <Heading title={`Patient Analysis Report: MY-${String(record.id).slice(-6)}`} sub="A structured, printable summary of the selected record." action={<div className="report-actions"><button className="btn" onClick={()=>window.print()}><Printer size={16}/> Print Report</button><button className="btn btn-primary" onClick={()=>window.print()}><FileText size={16}/> Save as PDF</button></div>}/>
    <Report record={record}/>
  </section>
}

function Report({record}) {
  return <div className="report-paper" id="print-report">
    <div className="report-brand"><div className="brand-icon"><HeartPulse size={20}/></div><div><b>Meiyalagu AI</b><small>Skin health summary · informational</small></div><span>MY-{String(record.id).slice(-6)}</span></div>
    <div className="report-title"><h2>Skin Health Summary</h2><p>Prepared {record.date}</p></div>

    <div className="report-columns">
      <div>
        <h3>Record details</h3>
        <dl>
          <dt>Record</dt><dd>{record.name}</dd>
          <dt>Screening result</dt><dd>{record.condition}</dd>
          <dt>Risk / severity</dt><dd>{record.risk}</dd>
          <dt>Model confidence</dt><dd>{record.confidence}</dd>
          <dt>Date / time</dt><dd>{record.date}</dd>
        </dl>
      </div>
      {record.image && <div><h3>Submitted image</h3><img className="report-image" src={record.image} alt="Submitted skin image"/></div>}
    </div>

    <div className="report-summary-grid">
      <section className="report-card"><h3><Microscope size={15}/> Analysis Summary</h3><div className="report-state"><span className="state-dot"/> Record available · informational</div><p>{record.type==='screening'?'This summary reflects the locations and observations entered during self-screening.':'This report contains the saved image-analysis record and user-provided details.'} Any automated output is a screening aid only and requires clinician review.</p></section>
      <section className="report-card"><h3><Activity size={15}/> Diagnostic Breakdown</h3><div className="diagnostic-line"><span>Recorded finding</span><b>{record.condition||'Not specified'}</b></div><div className="diagnostic-line"><span>Risk / status</span><b>{record.risk||'Not assessed'}</b></div><div className="diagnostic-line"><span>Confidence</span><b>{record.confidence||'Not available'}</b></div><div className="report-meter"><span style={{width:record.confidence&&String(record.confidence).match(/[0-9]+/) ? Math.min(100,Number(String(record.confidence).match(/[0-9]+/)[0]))+'%' : '0%'}}/></div><small>Confidence is shown only if it was saved with this record; it is not a measure of clinical certainty.</small></section>
    </div>

    {record.screening && <>
      <h3 className="section-title">Self-reported screening details</h3>
      <dl className="report-observations">
        <dt>Locations</dt><dd>{record.screening.locations?.map(x=>`${x.region} (${x.side})`).join(', ') || 'Not selected'}</dd>
        <dt>Duration</dt><dd>{record.screening.duration || 'Not answered'}</dd>
        <dt>Appearance</dt><dd>{record.screening.appearance?.join(', ') || 'Not answered'}</dd>
        <dt>Symptoms</dt><dd>{record.screening.symptoms?.join(', ') || 'Not answered'}</dd>
        <dt>Approx. size</dt><dd>{record.screening.size || 'Not answered'}</dd>
        <dt>Change</dt><dd>{[record.screening.trend,record.screening.spread].filter(Boolean).join(' · ') || 'Not answered'}</dd>
        <dt>Additional information</dt><dd>{record.screening.notes || 'None provided'}</dd>
      </dl>
    </>}

    <div className="report-recommendation">
      <b>Important medical notice</b>
      <p>This report summarizes information entered into a frontend prototype. It is not a diagnosis and should not be used to make treatment decisions. Seek evaluation from a qualified healthcare professional for concerning or changing lesions.</p>
    </div>
    <div className="report-footer"><div><b>Meiyalagu AI</b><small>Prepared from saved frontend record · {record.date}</small></div><div className="report-footer-actions"><button className="btn btn-sm" onClick={()=>window.print()}><Printer size={14}/> Print</button></div></div>
  </div>
}

function regionFromPoint(x, y, side) {
  // Coordinates are percentages of the actual silhouette image (not its wrapper).
  // Resolve lower-body bands before torso bands so thigh taps never become chest/abdomen.
  const inRange=(v,a,b)=>v>=a&&v<=b;
  const center=inRange(x,37,63);
  const left=inRange(x,20,43), right=inRange(x,57,80);

  // Head and neck
  if (inRange(y,6,15) && inRange(x,42,58)) return 'Head / scalp';
  if (inRange(y,15,24) && inRange(x,40,60)) return 'Face / neck';
  if (inRange(y,23,31) && (inRange(x,31,43)||inRange(x,57,69))) return 'Shoulder';
  if (inRange(y,23,30) && center) return side==='Front' ? 'Neck' : 'Upper back';

  // Arms before torso
  if (inRange(y,29,47) && (inRange(x,29,39)||inRange(x,61,71))) return 'Upper arm';
  if (inRange(y,45,57) && (inRange(x,23,33)||inRange(x,67,77))) return 'Forearm';
  if (inRange(y,54,62) && (inRange(x,20,31)||inRange(x,69,80))) return 'Hand';

  // Legs before torso, with distinct bands.
  if (inRange(y,61,74) && (inRange(x,35,49)||inRange(x,51,65))) return 'Thigh';
  if (inRange(y,74,81) && (inRange(x,36,49)||inRange(x,51,64))) return 'Knee';
  if (inRange(y,81,94) && (inRange(x,36,49)||inRange(x,51,64))) return 'Lower leg';
  if (inRange(y,94,101) && (inRange(x,31,49)||inRange(x,51,69))) return 'Foot';

  // Torso
  if (inRange(y,29,44) && center) return side==='Front' ? 'Chest' : 'Upper back';
  if (inRange(y,44,58) && center) return side==='Front' ? 'Abdomen' : 'Back';
  if (inRange(y,58,64) && center) return side==='Front' ? 'Pelvis / hip' : 'Lower back';

  // Only accept taps inside plausible body areas; never guess a neighboring region.
  const bodyEnvelope=(inRange(y,6,24)&&inRange(x,39,61)) ||
    (inRange(y,23,62)&&(center||left||right)) ||
    (inRange(y,61,99)&&(inRange(x,34,49)||inRange(x,51,66)));
  return bodyEnvelope ? 'Other' : null;
}

const REGION_TA = {
  'Head / scalp':'தலை / உச்சந்தலை', 'Face / neck':'முகம் / கழுத்து',
  'Neck':'கழுத்து', 'Shoulder':'தோள்பட்டை', 'Shoulder / upper arm':'தோள்பட்டை / மேல் கை',
  'Upper arm':'மேல் கை', 'Chest':'மார்பு', 'Upper back':'மேல் முதுகு', 'Back':'முதுகு',
  'Forearm':'முன்கை', 'Hand':'கை', 'Abdomen':'வயிறு', 'Lower back':'கீழ் முதுகு',
  'Pelvis / hip':'இடுப்பு', 'Thigh':'தொடை', 'Knee':'முழங்கால்', 'Lower leg':'கீழ்க்கால்', 'Foot':'பாதம்'
};

function HumanBody({side,marks,onSelect,language}) {
  const back = side === 'Back';
  const zones = back ? [
    ['Head / scalp',50,9,'M43 8 Q50 2 57 8 L58 17 Q56 23 50 23 Q44 23 42 17Z'],
    ['Neck',50,25,'M45 21 L55 21 L57 29 L43 29Z'],
    ['Shoulder',31,31,'M34 27 Q26 26 21 34 L27 43 L39 37Z'],['Shoulder',69,31,'M66 27 Q74 26 79 34 L73 43 L61 37Z'],
    ['Upper arm',25,43,'M21 34 Q15 37 17 49 L20 62 L27 60 L27 43Z'],['Upper arm',75,43,'M79 34 Q85 37 83 49 L80 62 L73 60 L73 43Z'],
    ['Forearm',21,66,'M20 61 L27 60 L28 78 L23 83 L19 80Z'],['Forearm',79,66,'M80 61 L73 60 L72 78 L77 83 L81 80Z'],
    ['Hand',22,86,'M19 81 L24 82 L27 91 L24 94 L19 90Z'],['Hand',78,86,'M81 81 L76 82 L73 91 L76 94 L81 90Z'],
    ['Upper back',50,37,'M38 29 Q50 26 62 29 L66 51 L60 59 L40 59 L34 51Z'],
    ['Lower back',50,58,'M40 57 L60 57 L62 68 L38 68Z'],
    ['Hip / buttock',50,69,'M38 66 L62 66 L65 77 L35 77Z'],
    ['Thigh',40,83,'M36 75 L48 75 L47 91 L43 95 L37 93Z'],['Thigh',60,83,'M52 75 L64 75 L63 93 L57 95 L53 91Z'],
    ['Knee',42,76,'M36 72 L48 72 L48 81 L37 81Z'],['Knee',58,76,'M52 72 L64 72 L63 81 L52 81Z'],
    ['Lower leg',42,87,'M37 81 L48 81 L47 95 L39 95Z'],['Lower leg',58,87,'M52 81 L63 81 L61 95 L53 95Z'],
    ['Foot',42,98,'M39 94 L47 94 L48 98 L34 100 L32 98Z'],['Foot',58,98,'M53 94 L61 94 L68 98 L66 100 L52 98Z']
  ] : [
    ['Head / scalp',50,9,'M43 8 Q50 2 57 8 L58 17 Q56 23 50 23 Q44 23 42 17Z'],
    ['Face / neck',50,24,'M44 17 Q50 22 56 17 L55 29 L45 29Z'],
    ['Shoulder',31,31,'M34 27 Q26 26 21 34 L27 43 L39 37Z'],['Shoulder',69,31,'M66 27 Q74 26 79 34 L73 43 L61 37Z'],
    ['Upper arm',25,43,'M21 34 Q15 37 17 49 L20 62 L27 60 L27 43Z'],['Upper arm',75,43,'M79 34 Q85 37 83 49 L80 62 L73 60 L73 43Z'],
    ['Forearm',21,66,'M20 61 L27 60 L28 78 L23 83 L19 80Z'],['Forearm',79,66,'M80 61 L73 60 L72 78 L77 83 L81 80Z'],
    ['Hand',22,86,'M19 81 L24 82 L27 91 L24 94 L19 90Z'],['Hand',78,86,'M81 81 L76 82 L73 91 L76 94 L81 90Z'],
    ['Chest',50,37,'M38 29 Q50 26 62 29 L66 44 L60 49 L40 49 L34 44Z'],
    ['Abdomen',50,54,'M40 48 L60 48 L62 64 L38 64Z'],
    ['Pelvis / hip',50,68,'M38 63 L62 63 L65 76 L35 76Z'],
    ['Thigh',40,83,'M36 74 L48 74 L47 91 L43 95 L37 93Z'],['Thigh',60,83,'M52 74 L64 74 L63 93 L57 95 L53 91Z'],
    ['Knee',42,76,'M36 72 L48 72 L48 81 L37 81Z'],['Knee',58,76,'M52 72 L64 72 L63 81 L52 81Z'],
    ['Lower leg',42,87,'M37 81 L48 81 L47 95 L39 95Z'],['Lower leg',58,87,'M52 81 L63 81 L61 95 L53 95Z'],
    ['Foot',42,98,'M39 94 L47 94 L48 98 L34 100 L32 98Z'],['Foot',58,98,'M53 94 L61 94 L68 98 L66 100 L52 98Z']
  ];
  const basePaths = ['M50 3 C39 3 36 12 39 20 C40 25 43 27 45 28 L42 31 C33 31 28 34 26 43 L22 63 L29 65 L35 46 L37 66 L35 75 L38 94 L34 98 L33 100 L48 100 L47 95 L49 80 L51 80 L53 95 L52 100 L67 100 L66 98 L62 94 L65 75 L63 66 L65 46 L71 65 L78 63 L74 43 C72 34 67 31 58 31 L55 28 C59 25 61 20 61 14 C61 7 57 3 50 3Z'];
  return <div className="body-3d-wrap">
    <div className={'body-3d-model '+(back?'turn-back':'')} key={side}>
      <svg className="human-svg interactive-human" viewBox="0 0 100 102" role="img" aria-label={back?'3D-style back body model':'3D-style front body model'}>
        <defs><linearGradient id="skinVolume" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f6d6c7"/><stop offset=".38" stopColor="#e9b9a9"/><stop offset=".7" stopColor="#ca8f8c"/><stop offset="1" stopColor="#a96e7e"/></linearGradient><linearGradient id="sideShade" x1="0" x2="1"><stop stopColor="#fff" stopOpacity=".6"/><stop offset=".45" stopColor="#fff" stopOpacity=".03"/><stop offset="1" stopColor="#593d79" stopOpacity=".45"/></linearGradient><filter id="bodyShadow"><feDropShadow dx="1.4" dy="2" stdDeviation="1.6" floodColor="#34245e" floodOpacity=".28"/></filter></defs>
        <ellipse cx="50" cy="98" rx="27" ry="3" fill="#66549a" opacity=".18"/>
        <path d={basePaths[0]} fill="url(#skinVolume)" stroke="#a97587" strokeWidth=".7" filter="url(#bodyShadow)"/>
        <path d="M50 29 L50 94" stroke="#fff" strokeOpacity=".35" strokeWidth=".7" fill="none"/>
        <path d="M50 29 Q38 30 35 44 L39 65 L37 91 L34 98 L46 98 L47 72 L50 72 L53 98 L66 98 L63 91 L61 65 L65 44 Q62 30 50 29Z" fill="url(#sideShade)" opacity=".8"/>
        {zones.map(([region,x,y,d],i)=><path key={i} d={d} className="body-zone" role="button" tabIndex="0" aria-label={`${region}${language==='ta'?' தேர்வு':' select'}`} onClick={(e)=>{e.stopPropagation();onSelect(region,x,y);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(region,x,y);}}} fill={marks.some(m=>m.region===region)?'rgba(112,73,223,.36)':'rgba(255,255,255,.025)'} stroke={marks.some(m=>m.region===region)?'#7049df':'rgba(255,255,255,.13)'} strokeWidth={marks.some(m=>m.region===region)?'.9':'.35'} />)}
        {marks.filter(m=>m.side===side).map(m=><g key={m.id} transform={`translate(${m.x} ${m.y})`} className="svg-body-marker" aria-label={m.region}>
          <circle r="4.3" cy="-1.8" fill="#df2869" stroke="#fff" strokeWidth="1.2"/>
          <path d="M-2.6 1.2 L0 6.5 L2.6 1.2" fill="#df2869" stroke="#fff" strokeWidth=".7" strokeLinejoin="round"/>
          <circle r="1.1" cy="-1.8" fill="#fff"/>
        </g>)}
      </svg>
    </div>
    <div className="body-model-caption"><span className="model-live-dot"/>{language==='ta'?(back?'பின்புற 3D காட்சி':'முன்புற 3D காட்சி'):(back?'3D back view':'3D front view')}<span className="model-caption-tip">{language==='ta'?'பகுதியைத் தேர்ந்தெடுக்க உடல் பகுதியைத் தட்டவும்':'Tap a body region to select it'}</span></div>
  </div>;
}

function LoginPage({language,setLang,onLogin,authMode,setAuthMode}) {
  const ta=language==='ta';
  const [showPassword,setShowPassword]=useState(false);
  const [remember,setRemember]=useState(true);
  const [name,setName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirmPassword,setConfirmPassword]=useState('');
  const [message,setMessage]=useState('');

  const submit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = name.trim();
    if (authMode === 'signup' && password !== confirmPassword) {
      setMessage(ta ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.');
      return;
    }
    setMessage('');
    try {
      let authRes;
      if (authMode === 'signup') {
        const displayName = cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'User');
        authRes = await registerUser(displayName, cleanEmail, password);
      } else {
        authRes = await loginUser(cleanEmail, password);
      }
      if (remember) localStorage.setItem('meiyalagu_remember_login', '1');
      else localStorage.removeItem('meiyalagu_remember_login');
      const resolvedUser = authRes?.user || { email: cleanEmail, name: cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'User') };
      onLogin(resolvedUser);
    } catch (err) {
      console.warn('Backend auth response:', err);
      if (err instanceof ApiError && err.code === 'NETWORK') {
        // Backend offline fallback
        if (remember) localStorage.setItem('meiyalagu_remember_login', '1');
        const fallbackUser = { name: cleanName || (cleanEmail ? cleanEmail.split('@')[0] : 'User'), email: cleanEmail };
        onLogin(fallbackUser);
      } else {
        setMessage(err?.message || (ta ? 'உள்நுழைவு தோல்வியடைந்தது.' : 'Authentication failed. Please check your credentials.'));
      }
    }
  };

  return <main className="auth-page premium-auth">
    <section className="auth-brand-panel premium-brand">
      <div className="auth-brand-wrap">
        <img className="auth-logo" src={ta?'/logo-ta.png':'/logo-en.png'} alt={ta?'மெய்யழகு AI':'Meiyalagu AI'} />
        <span className="auth-badge"><Sparkles size={15}/> {ta?'AI உதவியுடன் ஆரம்ப நிலை தோல் மதிப்பீடு':'AI-assisted preliminary skin assessment'}</span>
        <h2 className={ta?'ta-hero-title':''}>{ta?'உங்கள் தோலைப் புரிந்துகொள்ளுங்கள். மாற்றங்களை ஆரம்பத்திலேயே கவனியுங்கள். நம்பிக்கையுடன் செயல்படுங்கள்.':'Understand your skin. Detect changes early. Act with confidence.'}</h2>
        <p className="auth-brand-copy">{ta?'மெய்யழகு AI உங்கள் தோல் கவனிப்புகள், மதிப்பீட்டு பதிவுகள் மற்றும் கல்வி தகவல்களை ஒரே பாதுகாப்பான பணிப்பகுதியில் ஒழுங்குபடுத்த உதவுகிறது.':'Meiyalagu AI brings your skin observations, screening records and educational guidance into one focused workspace.'}</p>
        <div className="auth-benefits">
          <div><ShieldCheck size={19}/><span>{ta?'தனிப்பட்ட உள்ளூர் பணிப்பகுதி':'Private local workspace'}</span></div>
          <div><Languages size={19}/><span>{ta?'ஆங்கிலம் / தமிழ் இருமொழி அனுபவம்':'Bilingual English / Tamil experience'}</span></div>
          <div><HeartPulse size={19}/><span>{ta?'மருத்துவ நோயறிதல் அல்ல — ஆரம்ப நிலை உதவி மட்டும்':'Not a diagnosis — preliminary support only'}</span></div>
        </div>
      </div>
      <div className="auth-brand-decoration" aria-hidden="true"><span/><span/><span/></div>
    </section>

    <section className="auth-form-panel premium-form-panel">
      <div className="auth-top">
        <span>{ta?'மொழி':'Language'}</span>
        <div className="auth-language-switch">
          <button className={!ta?'active':''} onClick={()=>setLang('en')}>EN</button>
          <button className={ta?'active':''} onClick={()=>setLang('ta')}>தமிழ்</button>
        </div>
      </div>

      <div className="auth-card premium-card">
        <div className="auth-mini-brand"><img src={ta?'/logo-ta.png':'/logo-en.png'} alt=""/><span>{ta?'பாதுகாப்பான அணுகல்':'SECURE ACCESS'}</span></div>
        <h1>{authMode==='login'?(ta?'மீண்டும் வருக':'Welcome back'):(ta?'உங்கள் கணக்கை உருவாக்குங்கள்':'Create your account')}</h1>
        <p>{ta?'உங்கள் தனிப்பட்ட தோல் நலப் பணிப்பகுதியைத் தொடர உங்கள் விவரங்களை உள்ளிடுங்கள்.':'Enter your details to continue to your personal skin-health workspace.'}</p>

        <div className="auth-mode-tabs">
          <button type="button" className={authMode==='login'?'active':''} onClick={()=>{setAuthMode('login');setMessage('')}}>{ta?'உள்நுழை':'Sign in'}</button>
          <button type="button" className={authMode==='signup'?'active':''} onClick={()=>{setAuthMode('signup');setMessage('')}}>{ta?'புதிய கணக்கு':'Create account'}</button>
        </div>

        <form onSubmit={submit}>
          {authMode==='signup'&&<label>{ta?'முழுப் பெயர்':'Full name'}<div className="auth-input-wrap"><UserRound size={18}/><input required name="name" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder={ta?'உங்கள் பெயர்':'Your name'}/></div></label>}
          <label>{ta?'மின்னஞ்சல் முகவரி':'Email address'}<div className="auth-input-wrap"><Mail size={18}/><input name="email" type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com"/></div></label>
          <label>{ta?'கடவுச்சொல்':'Password'}<div className="auth-input-wrap"><LockKeyhole size={18}/><input name="password" type={showPassword?'text':'password'} required minLength={6} value={password} onChange={e=>setPassword(e.target.value)} autoComplete={authMode==='login'?'current-password':'new-password'} placeholder={ta?'கடவுச்சொல்லை உள்ளிடுங்கள்':'Enter your password'}/><button className="password-toggle" type="button" onClick={()=>setShowPassword(v=>!v)} title={showPassword?(ta?'கடவுச்சொல்லை மறை':'Hide password'):(ta?'கடவுச்சொல்லைக் காட்டு':'Show password')}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>
          {authMode==='signup'&&<label>{ta?'கடவுச்சொல்லை உறுதிப்படுத்து':'Confirm password'}<div className="auth-input-wrap"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} required minLength={6} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder={ta?'கடவுச்சொல்லை மீண்டும் உள்ளிடுங்கள்':'Re-enter your password'}/></div></label>}

          {authMode==='login'&&<div className="auth-options"><label className="remember-check"><input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)}/><span>{ta?'என்னை நினைவில் கொள்':'Remember me'}</span></label><button type="button" className="auth-forgot" onClick={()=>alert(ta?'கடவுச்சொல் மீட்டமைப்பிற்கு பின்தள ஆதரவு அமைப்பு தேவை.':'Password reset requires a configured backend support flow.')}>{ta?'கடவுச்சொல் மறந்துவிட்டதா?':'Forgot password?'}</button></div>}

          {authMode==='login'&&<div style={{display:'flex',gap:'.5rem',margin:'.6rem 0',flexWrap:'wrap'}}>
            <button type="button" className="btn btn-sm" style={{fontSize:'.75rem',padding:'.3rem .6rem'}} onClick={()=>{setEmail('demo@meiyalagu.ai');setPassword('password123');}}>Quick demo: Harini</button>
            <button type="button" className="btn btn-sm" style={{fontSize:'.75rem',padding:'.3rem .6rem'}} onClick={()=>{setEmail('saravanan2006sarass@gmail.com');}}>Fill Saravanan</button>
          </div>}

          {message&&<div className="auth-error"><ShieldAlert size={16}/>{message}</div>}
          <button className="auth-submit" type="submit">{authMode==='login'?(ta?'உள்நுழைந்து தொடர்க':'Sign in & continue'):(ta?'கணக்கை உருவாக்கு':'Create account')} <ArrowRight size={17}/></button>
        </form>

        <div className="auth-divider"><span>{ta?'அல்லது':'OR CONTINUE WITH'}</span></div>
        <div className="auth-socials">
          <button type="button" onClick={()=>setMessage(ta?'Google உள்நுழைவு செயல்படுத்தப்படவில்லை. OAuth அமைப்பு தேவை.':'Google sign-in is not configured yet. OAuth setup is required.')}><b className="google-g">G</b>{ta?'Google மூலம் தொடர்க':'Continue with Google'}</button>
          <button type="button" onClick={()=>setMessage(ta?'சமூக உள்நுழைவு அமைக்கப்படவில்லை.':'Social sign-in is not configured yet.')}><Globe2 size={17}/>{ta?'மற்றொரு கணக்கு':'Other account'}</button>
        </div>

        <div className="auth-contact pro-contact">
          <div><b>{ta?'தொடர்பு & உதவி':'Contact & support'}</b><span>{ta?'மின்னஞ்சல்: உங்கள் திட்ட மின்னஞ்சலை அமைக்கவும் · தொலைபேசி: உங்கள் ஆதரவு எண்ணை அமைக்கவும்':'Email: add your official project email · Phone: add your support number'}</span></div>
          <small>{ta?'மாதிரி உள்நுழைவு: நடைமுறை பயன்பாட்டிற்கு முன் உண்மையான அங்கீகார பின்தளத்தை இணைக்கவும்.':'Prototype sign-in: connect your authentication backend before production use.'}</small>
        </div>
      </div>
    </section>
  </main>;
}

function NearbyCare({language}) {
  const [coords,setCoords]=useState(null); const [status,setStatus]=useState('idle'); const [place,setPlace]=useState('');
  const tamil=language==='ta';
  const locate=()=>{ if(!navigator.geolocation){setStatus('unsupported');return;} setStatus('loading'); navigator.geolocation.getCurrentPosition(pos=>{setCoords({lat:pos.coords.latitude,lon:pos.coords.longitude});setStatus('ready');},()=>setStatus('denied'),{enableHighAccuracy:true,timeout:12000}); };
  const query=coords?`${coords.lat},${coords.lon}`:place.trim();
  const mapsUrl=query?`https://www.google.com/maps/search/dermatologist/@${coords?`${coords.lat},${coords.lon},13z`:''}`:null;
  const manualUrl=place.trim()?`https://www.google.com/maps/search/${encodeURIComponent('dermatologist near '+place)}`:null;
  return <section><Heading title={tamil?'அருகிலுள்ள தோல் மருத்துவர்':'Find Nearby Dermatologists & Hospitals'} sub={tamil?'உங்கள் இருப்பிடத்திற்கு அருகிலுள்ள மருத்துவ சேவைகளை வரைபடத்தில் தேடுங்கள்.':'Use Google Maps to find real nearby providers. This page does not invent clinic listings or contact details.'}/>
    <div className="panel nearby-panel"><div className="nearby-icon"><Hospital size={24}/></div><h2>{tamil?'தொழில்முறை மருத்துவ மதிப்பீடு தேவையா?':'Need professional evaluation?'}</h2><p>{tamil?'அருகிலுள்ள தோல் மருத்துவர் அல்லது மருத்துவமனையைத் தேடுங்கள்.':'Search live map listings for dermatologists or hospitals near you.'}</p>
    <button className="btn btn-primary" onClick={locate}><Navigation size={16}/>{status==='loading'?(tamil?'இருப்பிடத்தைப் பெறுகிறது…':'Getting location…'):(tamil?'எனது இருப்பிடத்தைப் பயன்படுத்து':'Use my location')}</button>
    {status==='denied'&&<div className="notice"><Info size={16}/><p>{tamil?'இருப்பிட அனுமதி மறுக்கப்பட்டது. கீழே இடத்தை உள்ளிடவும்.':'Location permission was denied or unavailable. Enter a city, area, or postcode below instead.'}</p></div>}
    {status==='unsupported'&&<p className="inline-error">{tamil?'இந்த உலாவியில் இருப்பிட வசதி இல்லை.':'Geolocation is not supported by this browser.'}</p>}
    {coords&&<p className="location-confirm"><MapPin size={15}/> {tamil?'இருப்பிடம் பெறப்பட்டது':'Location acquired'}: {coords.lat.toFixed(4)}, {coords.lon.toFixed(4)}</p>}
    <Field label={tamil?'நகரம் / பகுதி / அஞ்சல் குறியீடு':'Or enter a location manually'}><input value={place} onChange={e=>setPlace(e.target.value)} placeholder={tamil?'உதா: கோயம்புத்தூர்':'e.g. Coimbatore, Tamil Nadu'}/></Field>
    <div className="nearby-actions"><a className="btn btn-primary" href={coords?`https://www.google.com/maps/search/dermatologist/@${coords.lat},${coords.lon},13z`:manualUrl||undefined} target="_blank" rel="noreferrer" onClick={e=>{if(!coords&&!place.trim())e.preventDefault()}}><MapPin size={16}/> {tamil?'தோல் மருத்துவரைத் தேடு':'Find dermatologists'}</a><a className="btn btn-outline" href={coords?`https://www.google.com/maps/search/hospital/@${coords.lat},${coords.lon},13z`:place.trim()?`https://www.google.com/maps/search/${encodeURIComponent('hospital near '+place)}`:undefined} target="_blank" rel="noreferrer" onClick={e=>{if(!coords&&!place.trim())e.preventDefault()}}><Hospital size={16}/> {tamil?'மருத்துவமனைகளைத் தேடு':'Find hospitals'}</a></div>
    <p className="nearby-disclaimer"><Globe2 size={15}/> {tamil?'Google Maps-ல் உண்மையான பட்டியல்கள், தொடர்பு மற்றும் வழித்தடங்களைப் பார்க்கலாம்.':'Google Maps provides current provider listings, contact details, opening hours (when listed), and directions. Listing availability depends on Maps.'}</p>
    </div></section>
}

createRoot(document.getElementById('root')).render(<App/>);
