import { useRef, useState, useEffect } from 'react'

export default function LabelPage({ onNavigate }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [photo, setPhoto] = useState(null)
  const [tag, setTag] = useState('Iron')
  const [uploading, setUploading] = useState(false)
  const [showNameModal, setShowNameModal] = useState(false)
  const [nameInput, setNameInput] = useState('')

  useEffect(() => {
    let activeStream = null
    async function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('getUserMedia not supported')
        return
      }
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream
          videoRef.current.muted = true
          await videoRef.current.play()
          setStream(activeStream)
        }
      } catch (err) {
        console.error('Could not start camera', err)
      }
    }

    startCamera()

    return () => {
      if (activeStream) activeStream.getTracks().forEach(t => t.stop())
      setStream(null)
    }
  }, [])

  const handleSnap = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, w, h)
    const data = canvas.toDataURL('image/png')
    setPhoto(data)
  }

  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',')
    const mime = arr[0].match(/:(.*?);/)[1]
    const bstr = atob(arr[1])
    let n = bstr.length
    const u8arr = new Uint8Array(n)
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n)
    }
    return new Blob([u8arr], { type: mime })
  }

  const performUpload = async (filename) => {
    if (!photo) return alert('No photo to upload')
    setUploading(true)
    try {
      const blob = dataURLtoBlob(photo)
      const form = new FormData()
      form.append('tag', tag)
      // send user filename as form field
      if (filename) form.append('filename', filename)
      // use filename as uploaded file name (append .png if user didn't include ext)
      const ext = '.png'
      const uploadName = filename ? (pathHasExt(filename) ? filename : filename + ext) : 'capture.png'
      form.append('file', blob, uploadName)
      const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setPhoto(null)
      alert('Upload successful!')
    } catch (err) {
      console.error(err)
      alert('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
      setShowNameModal(false)
      setNameInput('')
    }
  }

  const pathHasExt = (s) => /\.[a-zA-Z0-9]+$/.test(s)

  const uploadToServer = () => {
    if (!photo) return alert('No photo to upload')
    // open modal to ask for filename
    setNameInput('')
    setShowNameModal(true)
  }

  return (
    <div className="label-page">
      <div className="label-header">
        <h2>Labeling</h2>
        <div>
          <button className="btn" onClick={() => onNavigate('manage')}>Data Management</button>
        </div>
      </div>

      <main className="main label-main">
        <div className="camera-column">
          <section className="camera">
            <video ref={videoRef} className="video" playsInline />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </section>

          <section className="preview">
            {photo ? (
              <img src={photo} alt="capture" className="preview-img" />
            ) : (
              <div className="placeholder">No photo yet</div>
            )}
          </section>
        </div>

        <aside className="controls-column">
          <div className="snap-wrap">
            <button className="btn snap" onClick={handleSnap}>Snap</button>
          </div>

          <div className="tag-upload">
            <select className="select" value={tag} onChange={e => setTag(e.target.value)}>
              <option>Iron</option>
              <option>Copper</option>
              <option>Aluminum</option>
              <option>Steel</option>
              <option>Brass</option>
              <option>Titanium</option>
            </select>
            <button className="btn upload" onClick={uploadToServer} disabled={uploading || !photo}>
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </aside>
      </main>
      {showNameModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', padding: 16, borderRadius: 6, minWidth: 320 }}>
            <h3 style={{ marginTop: 0 }}>Enter filename</h3>
            <input autoFocus value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="filename (without extension)" style={{ width: '100%', marginBottom: 12, padding: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn" onClick={() => { setShowNameModal(false); setNameInput('') }}>Cancel</button>
              <button className="btn" onClick={() => performUpload(nameInput || undefined)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
