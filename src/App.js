import React, { Suspense, Component, useState } from 'react'

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
            <Suspense key={id} fallback={<div className="image-placeholder" />}>
              <ErrorBoundary>
                <SuspenseImage
                  imageResource={fetchImageData(`images/${id}.jpeg`)}
                  alt={`dog ${id}`}
                />
              </ErrorBoundary>
            </Suspense>
            // <img
            //   className=""
            //   key={id}
            //   src={`images/${id}.jpeg`}
            //   alt={`dog ${id}`}
            // />
          ))}
      </div>
    </>
  )
}

const SuspenseImage = ({ imageResource, alt }) => (
  <img className="suspense-image" src={imageResource.read()} alt={alt} />
)

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.errorInfo) {
      return (
        <div className="image-placeholder">
          <h3>{this.state.error && this.state.error.toString()}</h3>
        </div>
      )
    }
    return this.props.children
  }
}

// rejects with perc% chance
const randomReject = (resolve, reject, perc = 0.3) => {
  if (Math.random() < perc) reject()
  else resolve()
}

function getImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = src
    img.addEventListener('load', () => {
      const imgCanvas = document.createElement('canvas')
      imgCanvas.width = img.width
      imgCanvas.height = img.height
      imgCanvas.getContext('2d').drawImage(img, 0, 0)
      const dataURL = imgCanvas.toDataURL('image/jpeg')
      // resolve(dataURL)
      setTimeout(
        () =>
          randomReject(
            () => resolve(dataURL),
            () => reject('The image failed to load')
          ),
        Math.random() * 1000
      )
    })
  })
}

const fetchImageData = src => wrapPromise(getImage(src))

function wrapPromise(promise) {
  let status = 'pending'
  let result
  let suspender = promise.then(
    r => {
      status = 'success'
      result = r
    },
    e => {
      status = 'error'
      result = e
    }
  )
  return {
    read() {
      if (status === 'pending') {
        throw suspender
      } else if (status === 'error') {
        throw new Error('image could not be loaded')
      } else if (status === 'success') {
        return result
      }
    }
  }
}

export default App
