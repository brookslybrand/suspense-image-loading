import React, { useState, useEffect } from 'react'

import './styles.css'

function App() {
  const [showImages, setShowImages] = useState(true)
  return (
    <>
      <button onClick={() => setShowImages(show => !show)}>
        {showImages ? 'hide' : 'show'} images
      </button>
      <div className="App">
        {showImages &&
          Array.from({ length: 12 }).map((_, id) => (
            <SuspenseImage
              key={id}
              src={`images/${id}.jpeg`}
              alt={`dog ${id}`}
            />
          ))}
      </div>
    </>
  )
}

const SuspenseImage = ({ src, alt }) => {
  // const [dataUrl, setDataUrl] = useState(null)
  // useEffect(() => {
  //   const img = new Image()
  //   img.src = 'images/0.jpeg'
  //   img.addEventListener('load', function() {
  //     const imgCanvas = document.createElement('canvas')
  //     const imgContext = imgCanvas.getContext('2d')

  //     imgContext.drawImage(img, 0, 0)

  //     setDataUrl(imgCanvas.toDataURL('image/jpeg'))
  //   })
  // }, [])

  // if (!dataUrl) return null

  return <img src={src} alt={alt} />
}

export default App
