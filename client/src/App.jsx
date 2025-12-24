import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, Loader2, ArrowRight, Play, RefreshCw, FolderOpen, Download } from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ prompt: '', pdf: null });

  useEffect(() => {
    console.log('[enzonic] Initializing App, starting task fetch interval');
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.error('[enzonic] Failed to fetch tasks:', err.message);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.pdf || !formData.prompt) {
      console.warn('[enzonic] Upload blocked: Missing PDF or prompt');
      return;
    }

    console.log('[enzonic] Starting upload:', { fileName: formData.pdf.name, promptLength: formData.prompt.length });
    setUploading(true);
    const data = new FormData();
    data.append('pdf', formData.pdf);
    data.append('prompt', formData.prompt);

    try {
      const res = await axios.post(`${API_BASE}/upload`, data);
      console.log('[enzonic] Upload successful, taskId:', res.data.taskId);
      setFormData({ prompt: '', pdf: null });
      setView('dashboard');
    } catch (err) {
      console.error('[enzonic] Upload error:', err.response?.data || err.message);
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleResume = async (id) => {
    console.log('[enzonic] Resuming task:', id);
    try {
      await axios.post(`${API_BASE}/tasks/${id}/resume`);
      console.log('[enzonic] Resume command sent successfully');
    } catch (err) {
      console.error('[enzonic] Failed to resume task:', err.message);
      alert('Failed to resume');
    }
  };

  const downloadJson = (task) => {
    console.log('[enzonic] Preparing JSON download for task:', task.id);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(task.results, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${task.name.replace('.pdf', '')}_result.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    console.log('[enzonic] Download triggered');
  };

  return (
    <div className="auth-container">
      <header className="header">
        <div className="logo">
          <FileText size={32} />
          <span>enzonic Docasaurus</span>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setView(view === 'dashboard' ? 'upload' : 'dashboard')}>
            {view === 'dashboard' ? 'New Task' : 'Back to Dashboard'}
          </button>
        </div>
      </header>

      {view === 'upload' && (
        <main className="card">
          <h2>Create New Processing Task</h2>
          <form onSubmit={handleUpload}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Instructions Prompt</label>
              <textarea
                className="input"
                rows="4"
                placeholder="Ex: Rewrite each section to be more professional..."
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>PDF Document</label>
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  padding: '2rem',
                  textAlign: 'center',
                  borderRadius: '0.5rem',
                  background: 'var(--bg-color)'
                }}
              >
                <input
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  id="pdf-upload"
                  onChange={(e) => setFormData({ ...formData, pdf: e.target.files[0] })}
                />
                <label htmlFor="pdf-upload" style={{ cursor: 'pointer' }}>
                  <Upload size={48} style={{ color: 'var(--primary-color)', marginBottom: '1rem' }} />
                  <p>{formData.pdf ? formData.pdf.name : 'Click to select PDF file'}</p>
                </label>
              </div>
            </div>

            <button className="btn btn-primary" type="submit" disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : 'Start Processing'}
            </button>
          </form>
        </main>
      )}

      {view === 'dashboard' && (
        <main>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Processing Tasks</h2>
            <button onClick={fetchTasks} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)' }}>
              <RefreshCw size={20} />
            </button>
          </div>

          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              background: 'var(--bg-color)',
              padding: '1rem',
              borderRadius: '0.75rem',
              color: 'var(--primary-color)'
            }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-light)', fontWeight: 500 }}>Total Pieces Processed</p>
              <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                {tasks.reduce((acc, t) => acc + t.chunks.filter(c => c.status === 'completed').length, 0)}
              </h3>
            </div>
          </div>

          <div className="task-grid">
            {tasks.map(task => (
              <div key={task.id} className="card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{task.name}</h3>
                  <span className={`status-badge status-${task.status}`}>
                    {task.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', margin: '0.5rem 0' }}>
                  {task.prompt.substring(0, 60)}...
                </p>

                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${task.progress}%` }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 600 }}>
                  <span>{task.progress}% Complete</span>
                  <span>{task.chunks.filter(c => c.status === 'completed').length} / {task.totalChunks} pieces</span>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                  {task.status === 'completed' ? (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => downloadJson(task)}>
                      <Download size={18} style={{ marginRight: '0.5rem' }} /> Download JSON
                    </button>
                  ) : task.status === 'failed' ? (
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleResume(task.id)}>
                      <Play size={18} style={{ marginRight: '0.5rem' }} /> Resume
                    </button>
                  ) : (
                    <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-light)', fontSize: '0.875rem' }}>
                      <Loader2 className="animate-spin" style={{ margin: '0 auto' }} /> Processing...
                    </div>
                  )}
                </div>
              </div>
            ))}
            {tasks.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-light)' }}>
                <FolderOpen size={64} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
                <p>No tasks yet. Create your first task to get started!</p>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
