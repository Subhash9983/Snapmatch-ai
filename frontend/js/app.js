
// ─────────── PAGE NAVIGATION ───────────
let currentPage = 1;
const PAGES = {1:'page-guest', 2:'page-admin', 3:'page-results'};

function goPage(n) {
  currentPage = n;
  Object.values(PAGES).forEach(id => document.getElementById(id).classList.remove('active'));
  document.getElementById(PAGES[n]).classList.add('active');
  // sync all dot navs
  document.querySelectorAll('.dot-nav').forEach(nav => {
    nav.querySelectorAll('.dnav').forEach((d,i) => d.classList.toggle('active', i+1 === n));
  });
  if (n === 2) initAdmin();
}

// ─────────── ADMIN INIT ───────────
let progressInterval = null;

function initAdmin() {
  if (!progressInterval) {
    progressInterval = setInterval(fetchProgress, 1000);
  }
  fetchAdminStats();
}
async function fetchProgress() {
  try {
    const response = await fetch("/admin/progress");
    const data = await response.json();

    document.getElementById('idx-fill').style.width = data.percent + '%';
    document.getElementById('idx-pct').textContent = data.percent + '%';
    document.getElementById('idx-sub').textContent =
      'Processing ' + data.processed + '/' + data.total + ' photos...';

    if (!data.running) {
      clearInterval(progressInterval);
      progressInterval = null;
    }

  } catch (error) {
    console.error("Progress fetch error:", error);
  }
}
function buildRecent() {
  const g = document.getElementById('recent-grid');
  const items = ['✅','🎉','💒','💐','🥂','💍','🎊','❤️'];
  items.forEach((e,i) => {
    const t = document.createElement('div'); t.className = 'rthumb';
    t.innerHTML = i===0
      ? `<div class="chk">${e}</div>`
      : `<div style="width:100%;height:100%;background:linear-gradient(135deg,rgba(20,22,42,.9),rgba(8,10,24,.9));display:flex;align-items:center;justify-content:center;font-size:20px">${e}</div>`;
    g.appendChild(t);
  });
}
function dzOver(e) { e.preventDefault(); document.getElementById('drop-zone').classList.add('dg'); }
function dzLeave() { document.getElementById('drop-zone').classList.remove('dg'); }
function dzDrop(e) {
  e.preventDefault();
  dzLeave();

  const files = Array.from(e.dataTransfer.files)
    .filter(f => f.type.startsWith('image/'));

  if (files.length === 0) return;


  uploadToBackend(files);  // send to backend
}
function handleAdminUp(e) {
  const files = Array.from(e.target.files)
    .filter(f => f.type.startsWith('image/'));

  if (files.length === 0) return;

  uploadToBackend(files);  // send to backend
}
function addAdminThumbs(files) {
  const g = document.getElementById('recent-grid');
  files.forEach(f => {
    const t = document.createElement('div'); t.className = 'rthumb';
    const img = document.createElement('img');
    const fr = new FileReader(); fr.onload = ev => img.src = ev.target.result; fr.readAsDataURL(f);
    t.appendChild(img); g.prepend(t);
  });
}
async function uploadToBackend(files) {
  const formData = new FormData();

  files.forEach(file => {
    formData.append("photos", file);
  });

  try {
    const response = await fetch("/admin/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("Upload failed");
    }

    const data = await response.json();

    // ✅ Only add thumbnails for processed files
    const processedFiles = files.filter(file =>
      data.processed.includes(file.name)
    );

    if (processedFiles.length > 0) {
      addAdminThumbs(processedFiles);
    }
    fetchAdminStats();

    if (data.skipped.length > 0 && processedFiles.length === 0) {
      alert("Duplicate photo. Already uploaded.");
    } else {
      alert(
        "Uploaded successfully.\nFaces detected: " +
        (data.faces_detected || 0)
      );
    }

  } catch (error) {
    console.error("Upload failed:", error);
    alert("Upload failed. Check console.");
  }
}
async function fetchAdminStats() {
  try {
    const response = await fetch("/admin/stats");
    const data = await response.json();

    document.querySelectorAll(".stat-val")[0].textContent =
      data.total_photos;

    document.querySelectorAll(".stat-val")[1].textContent =
      data.faces_detected;

    document.querySelectorAll(".stat-val")[2].textContent =
      data.unique_people;

    document.querySelectorAll(".stat-badge.teal")[0].textContent =
      data.accuracy + "% accuracy";

  } catch (error) {
    console.error("Stats fetch error:", error);
  }
}

// ─────────── SCAN MODAL ───────────
function openScanModal() { document.getElementById('scan-overlay').classList.add('active'); }
function closeScan() { document.getElementById('scan-overlay').classList.remove('active'); resetScan(); }
document.getElementById('scan-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('scan-overlay')) closeScan();
});
function trigFile() { document.getElementById('m-file').click(); }
function handleSelfie(e) {
  const f = e.target.files[0]; if (!f) return;
  const fr = new FileReader(); fr.onload = ev => {
    const p = document.getElementById('m-preview'); p.src = ev.target.result; p.style.display = 'block';
    document.getElementById('cam-ph').style.display = 'none'; stopCam();
  }; fr.readAsDataURL(f);
}
let camStream = null;
function toggleCam() {
  if (camStream) { captureFrame(); return; }
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({video:{facingMode:'user'}}).then(s => {
      camStream = s;
      const v = document.getElementById('m-video'); v.srcObject = s; v.style.display = 'block';
      document.getElementById('cam-ph').style.display = 'none';
      document.getElementById('m-preview').style.display = 'none';
      document.getElementById('cam-btn').textContent = 'Capture 📸';
    }).catch(() => trigFile());
  } else trigFile();
}
function captureFrame() {
  const v = document.getElementById('m-video');
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v,0,0);
  const p = document.getElementById('m-preview'); p.src = c.toDataURL('image/jpeg'); p.style.display = 'block';
  stopCam(); document.getElementById('cam-btn').textContent = 'Open Camera';
}
function stopCam() {
  if (camStream) { camStream.getTracks().forEach(t=>t.stop()); camStream = null; }
  document.getElementById('m-video').style.display = 'none';
}
function resetScan() {
  stopCam();
  document.getElementById('m-preview').style.display = 'none';
  document.getElementById('cam-ph').style.display = 'flex';
  document.getElementById('scan-ov').classList.remove('active');
  document.getElementById('spct').textContent = '0%';
  document.getElementById('m-file').value = '';
  document.getElementById('cam-btn').textContent = 'Open Camera';
}
async function startScan() {
  const preview = document.getElementById('m-preview');

  if (!preview.src || preview.style.display === 'none') {
    trigFile();
    return;
  }

  document.getElementById('scan-ov').classList.add('active');

  const blob = await fetch(preview.src).then(r => r.blob());

  const formData = new FormData();
  formData.append("selfie", blob, "selfie.jpg");

  try {
    const response = await fetch("/guest/scan", {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    closeScan();
    if (!data.photos || data.photos.length === 0) {
      alert("No matching photos found.");
      return;
    }
    setTimeout(() => {
        buildResultsFromBackend(data.photos);
        goPage(3);
    }, 200);

  } catch (error) {
    document.getElementById('scan-ov').classList.remove('active');
    alert("Error scanning face.");
    console.error(error);
  }
}


// ─────────── RESULTS PAGE ───────────
let currentView = 'float';
function buildResultsFromBackend(results) {
  document.getElementById('found-n').textContent = results.length;
  document.getElementById('dl-lbl').textContent =
    "Download All (" + results.length + " Photos)";

  buildFloatFromBackend(results);
  buildGridFromBackend(results);
}
function getPhotoName(result) {
  const rawPhoto = typeof result === 'string' ? result : result?.photo;
  if (!rawPhoto) return '';

  return rawPhoto.split("\\").pop().split("/").pop();
}
function buildFloatFromBackend(results) {
  const wrap = document.getElementById('photos-float');
  wrap.innerHTML = '';

  const positions = [
    {left:'5%',  top:'10px', w:130, rot:-4},
    {left:'42%', top:'55px', w:120, rot:3},
    {left:'18%', top:'150px',w:140, rot:-2},
    {left:'52%', top:'180px',w:125, rot:5},
    {left:'3%',  top:'280px',w:115, rot:-5},
    {left:'38%', top:'310px',w:130, rot:2},
    {left:'55%', top:'400px',w:120, rot:-3},
    {left:'8%',  top:'420px',w:125, rot:4},
    {left:'30%', top:'490px',w:110, rot:-2},
  ];

  let maxBottom = 0;

  results.forEach((item, i) => {
    const pos = positions[i % positions.length];
    const photoName = getPhotoName(item);
    if (!photoName) return;
    const height = Math.round(pos.w * 0.72);

    const div = document.createElement('div');
    div.className = 'photo-float';
    div.style.cssText =
      `left:${pos.left};top:${pos.top};width:${pos.w}px;transform:rotate(${pos.rot}deg)`;

    div.innerHTML = `
      <div class="photo-float-inner">
        <img src="/photos/${encodeURIComponent(photoName)}"
             style="width:${pos.w}px;height:${height}px;object-fit:cover;border-radius:10px;">
      </div>
    `;

    wrap.appendChild(div);

    const bottom = parseInt(pos.top) + height + Math.abs(pos.rot)*2;
    if (bottom > maxBottom) maxBottom = bottom;
  });

  wrap.style.minHeight = (maxBottom + 40) + 'px';
}
function buildGridFromBackend(results) {
  const grid = document.getElementById('photos-grid');
  grid.innerHTML = '';

  results.forEach(item => {
    const photoName = getPhotoName(item);
    if (!photoName) return;

    const div = document.createElement('div');
    div.className = 'pgrid-item';
    div.innerHTML = `
      <img src="/photos/${encodeURIComponent(photoName)}"
           style="width:100%;height:100%;object-fit:cover;">
      <button onclick="downloadSingle('${photoName}')"
              style="position:absolute;bottom:6px;right:6px;
                     background:#000;color:#fff;border:none;
                     padding:4px 8px;border-radius:6px;
                     cursor:pointer;">
        Download
      </button>
  `;
   

    grid.appendChild(div);
  });
}

function setView(v) {
  currentView = v;
  const isFloat = v === 'float';
  document.getElementById('photos-float').style.display = isFloat ? 'block' : 'none';
  const gv = document.getElementById('photos-grid');
  if (isFloat) gv.classList.remove('show'); else gv.classList.add('show');
  document.getElementById('vt-float').classList.toggle('active', isFloat);
  document.getElementById('vt-grid').classList.toggle('active', !isFloat);
}
function dlAll() {
  const images = Array.from(
    document.querySelectorAll("#photos-grid img")
  ).map(img => decodeURIComponent(img.src.split("/").pop()));

  fetch("/guest/download_all", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ photos: images })
  })
  .then(response => response.blob())
  .then(blob => {
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = "matched_photos.zip";
    link.click();
  });
}
function shareIt() {
  if (navigator.share) navigator.share({title:'My Wedding Photos',text:'Found my photos with SnapMatch!'}); 

  else { navigator.clipboard.writeText(location.href).then(()=>alert('Link copied!')).catch(()=>alert('Share link copied! (Demo)')); }
} 
function downloadSingle(filename) {
  const link = document.createElement("a");
  link.href = "/photos/" + encodeURIComponent(filename);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
